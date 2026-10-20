/* ================= Budget — Google Drive sync (hidden app folder, only this app can see the file) ================= */
const DRIVE_CLIENT_ID = '';           // filled once the Google Cloud client exists; can also be set from Réglages
const DRIVE_FILE = 'budget-data.json';
const GD = { token: null, exp: 0, fileId: null, busy: false, timer: null, status: 'off' };
const gdClient = () => DRIVE_CLIENT_ID || (() => { try { return localStorage.getItem('budget.gclient') || ''; } catch (e) { return ''; } })();
const gdOn = () => { try { return localStorage.getItem('budget.drive') === '1'; } catch (e) { return false; } };
const gdRedirect = () => location.origin + location.pathname;
function gdAuth(silent) {
  const cid = gdClient(); if (!cid) { toast('Ajoute d\'abord l\'identifiant Google dans Réglages'); return; }
  try { localStorage.setItem('budget.drive', '1'); localStorage.setItem('budget.gtry', String(Date.now())); } catch (e) { }
  const q = new URLSearchParams({ client_id: cid, redirect_uri: gdRedirect(), response_type: 'token', scope: 'https://www.googleapis.com/auth/drive.appdata', include_granted_scopes: 'true', state: silent ? 'gd-silent' : 'gd', prompt: silent ? 'none' : 'consent' });
  location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + q;
}
function gdReadHash() {
  if (!location.hash || !/access_token=|error=/.test(location.hash)) return;
  const h = new URLSearchParams(location.hash.slice(1));
  if (/^gd/.test(h.get('state') || '')) {
    if (h.get('access_token')) { GD.token = h.get('access_token'); GD.exp = Date.now() + (+h.get('expires_in') || 3600) * 1000 - 60000; try { sessionStorage.setItem('budget.gtok', JSON.stringify({ t: GD.token, e: GD.exp })); } catch (e) { } }
    else if (h.get('error')) GD.status = 'needlogin';
  }
  history.replaceState(null, '', location.pathname + location.search);
}
function gdLoadToken() { try { const x = JSON.parse(sessionStorage.getItem('budget.gtok') || 'null'); if (x && x.e > Date.now()) { GD.token = x.t; GD.exp = x.e; } } catch (e) { } }
async function gdFetch(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + GD.token } });
  if (r.status === 401) { GD.token = null; throw new Error('auth'); }
  if (!r.ok) throw new Error('drive ' + r.status);
  return r;
}
async function gdFind() {
  if (GD.fileId) return GD.fileId;
  const q = encodeURIComponent(`name='${DRIVE_FILE}'`);
  const r = await gdFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)`);
  const f = (await r.json()).files?.[0]; GD.fileId = f ? f.id : null; return GD.fileId;
}
function gdPaint(s) { GD.status = s; A.sync = { ok: 'drive-ok', busy: 'syncing', err: 'drive-err', needlogin: 'drive-login' }[s] || A.sync; paintSync(); }
async function gdPull() {
  const id = await gdFind(); if (!id) return null;
  const r = await gdFetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
  return await r.text();
}
async function gdPush() {
  if (!GD.token || GD.busy) { if (GD.busy) gdSchedule(); return; }
  GD.busy = true; gdPaint('busy');
  try {
    const raw = localStorage.getItem(LKEY) || '{}';
    const id = await gdFind();
    if (id) await gdFetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: raw });
    else {
      const b = 'gd' + uid(); const meta = JSON.stringify({ name: DRIVE_FILE, parents: ['appDataFolder'] });
      const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${raw}\r\n--${b}--`;
      const r = await gdFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body });
      GD.fileId = (await r.json()).id;
    }
    gdPaint('ok');
  } catch (e) { gdPaint(e.message === 'auth' ? 'needlogin' : 'err'); }
  GD.busy = false;
}
function gdSchedule() { if (!gdOn() || !GD.token) return; clearTimeout(GD.timer); GD.timer = setTimeout(gdPush, 4000); }
async function gdSync() {
  if (!gdOn()) return;
  if (!GD.token) {
    // silent re-login at most every 10 minutes, so a refused attempt never loops
    let last = 0; try { last = +localStorage.getItem('budget.gtry') || 0; } catch (e) { }
    if (GD.status !== 'needlogin' && Date.now() - last > 600000) { gdAuth(true); return; }
    gdPaint('needlogin'); return;
  }
  gdPaint('busy');
  try {
    const raw = await gdPull();
    const remote = raw ? JSON.parse(raw) : null;
    const rU = remote?.index?.updatedAt || 0, lU = A.index?.updatedAt || 0;
    if (remote && rU > lU) {
      try { localStorage.setItem(LKEY, raw); } catch (e) { }
      A.index = remote.index; const cur = remote.plans?.[A.index.current] || remote.plans?.[A.index.plans?.[0]?.id];
      if (cur) { A.plan = cur.plan; A.tx = cur.tx; A.index.current = cur.plan.id; } else { A.plan = null; A.tx = []; }
      A.undo = []; A.redo = []; A.calcV++; rebuildLookups(); if (A.plan) runScheduled(); render(); toast('Budget récupéré depuis Google Drive');
      gdPaint('ok');
    } else if (!remote || lU > rU) { await gdPush(); }
    else gdPaint('ok');
  } catch (e) { gdPaint(e.message === 'auth' ? 'needlogin' : 'err'); }
}
function gdDisconnect() {
  try { localStorage.removeItem('budget.drive'); sessionStorage.removeItem('budget.gtok'); } catch (e) { }
  if (GD.token) fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(GD.token), { method: 'POST' }).catch(() => { });
  GD.token = null; GD.fileId = null; A.sync = 'local'; paintSync(); render(); toast('Synchro Google Drive désactivée');
}
function driveSettingsHtml() {
  const on = gdOn();
  return `<div class="sec-t"><span>Synchro Google Drive</span></div>
  <div class="card">
    <div class="li"><span class="ic">${I.sync}</span><span class="grow"><strong id="syncState">${syncLabel()}</strong><div class="small muted">${on ? 'Un fichier caché dans ton Drive, visible seulement par cette appli. Sauvegarde automatique à chaque changement.' : 'Retrouve ton budget sur ton tel et ton Mac, sauvegardé dans ton Drive.'}</div></span></div>
    ${on ? `<button class="li" data-a="gdNow"><span class="ic">${I.sync}</span><span class="grow"><strong>Synchroniser maintenant</strong></span></button>
      ${GD.status === 'needlogin' || !GD.token ? `<button class="li" data-a="gdLogin"><span class="ic">${I.lock}</span><span class="grow"><strong>Se reconnecter à Google</strong></span></button>` : ''}
      <button class="li" data-a="gdOff"><span class="ic">${I.close}</span><span class="grow"><strong>Désactiver la synchro</strong><div class="small muted">Tes données restent sur cet appareil</div></span></button>`
    : `<button class="li" data-a="gdLogin" ${gdClient() ? '' : 'disabled'}><span class="ic">${I.lock}</span><span class="grow"><strong>Connecter Google Drive</strong>${gdClient() ? '' : '<div class="small muted">Ajoute d\'abord l\'identifiant ci-dessous</div>'}</span></button>`}
    ${!DRIVE_CLIENT_ID ? `<div class="li" style="flex-direction:column; align-items:stretch; gap:6px"><label class="lbl2" for="gClient">Identifiant client Google (OAuth)</label><input id="gClient" class="in" value="${esc(gdClient())}" placeholder="xxxx.apps.googleusercontent.com" data-c="gClient" autocomplete="off" spellcheck="false"></div>` : ''}
  </div>`;
}
