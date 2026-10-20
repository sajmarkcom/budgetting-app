/* ================= Budget — direct bank connection (Enable Banking through your own Apps Script proxy) ================= */
const bankCfg = () => (A.plan.bank ||= { url: '', key: '', conns: [], pending: null });
async function bk(action, params = {}) {
  const b = bankCfg(); if (!b.url) throw new Error('Bank connection is not set up');
  // key and parameters travel in the request body (never in the URL), over HTTPS, to the user's own script
  const r = await fetch(b.url, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, key: b.key, ...params }) });
  if (!r.ok) throw new Error('Proxy responded ' + r.status);
  const j = await r.json();
  if (j.error) { const e = new Error(j.error === 'unauthorized' ? 'The proxy refused the request (wrong key).' : j.error === 'not_configured' ? 'Add APP_ID and PRIVATE_KEY in the Apps Script properties.' : (j.error + (j.detail ? ': ' + JSON.stringify(j.detail).slice(0, 200) : ''))); e.code = j.error; throw e; }
  return j;
}
function randKey() { const a = new Uint8Array(24); crypto.getRandomValues(a); return Array.from(a, x => x.toString(16).padStart(2, '0')).join(''); }

/* ---------- settings block ---------- */
function bankSettingsHtml() {
  const b = A.plan.bank;
  if (!b?.url) return `<div class="sec-t"><span>Bank Connections</span></div><div class="card">
    <button class="li" data-a="bankSetup"><span class="ic">${I.bank}</span><span class="grow"><strong>Set up direct import</strong><div class="small muted">Import transactions from your bank automatically (free, via Enable Banking)</div></span>${I.right}</button></div>`;
  const rows = b.conns.map(c => {
    const days = Math.round((new Date(c.validUntil) - Date.now()) / 86400000);
    const accs = c.accounts.filter(x => x.acct).map(x => esc(L.acct[x.acct]?.name || x.name)).join(', ') || 'No account linked';
    return `<div class="li" style="flex-wrap:wrap"><span class="ic">${I.bank}</span><span class="grow" style="min-width:160px"><strong>${esc(c.bank)}</strong><div class="small muted">${accs}</div>
      <div class="small ${days < 14 ? 'amt-bad' : 'muted'}">${days > 0 ? 'Access valid for ' + days + ' days' : 'Access expired: reconnect'}${c.lastSync ? ' · last import ' + new Date(c.lastSync).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</div></span>
      <button class="btn sm" data-a="bankMap" data-id="${c.id}">Accounts</button>${days < 30 ? `<button class="btn sm" data-a="bankLink" data-bank="${esc(c.bank)}">Reconnect</button>` : ''}<button class="ibtn" data-a="bankRemove" data-id="${c.id}" aria-label="Disconnect ${esc(c.bank)}">${I.trash}</button></div>`;
  }).join('');
  return `<div class="sec-t"><span>Bank Connections</span></div><div class="card">${rows}
    ${b.pending ? `<div class="li"><span class="ic">${I.sync}</span><span class="grow"><strong>Waiting for ${esc(b.pending.bank)}…</strong><div class="small muted">Finish the login at your bank, then come back here.</div></span><button class="btn sm" data-a="bankCancel">Cancel</button></div>` : ''}
    <button class="li" data-a="bankLinkSheet"><span class="ic">${I.plus}</span><span class="grow"><strong>Link a bank</strong></span></button>
    ${b.conns.length ? `<button class="li" data-a="bankSyncNow"><span class="ic">${I.download}</span><span class="grow"><strong>Import now</strong><div class="small muted">Imports run automatically when you open the app (at most every 6 hours)</div></span></button>` : ''}
    <button class="li" data-a="bankSetup"><span class="ic">${I.gear}</span><span class="grow"><strong>Proxy settings</strong></span></button></div>`;
}

/* ---------- setup ---------- */
function bankSetupSheet() {
  const b = bankCfg();
  const body = `<p style="margin:0" class="small">Your bank login happens on your bank's own page. Your Enable Banking key stays in a small script on <b>your</b> Google account; this app and GitHub never see it.</p>
    <div class="card" style="padding:14px; display:flex; flex-direction:column; gap:8px">
      <strong>1. Create the proxy (5 min)</strong>
      <span class="small muted">script.google.com → New project → paste the code from <a href="https://github.com/sajmarkcom/budgetting-app/blob/main/bank-proxy/Code.gs" target="_blank" rel="noopener">bank-proxy/Code.gs</a> → Deploy → New deployment → Web app, Execute as: Me, Who has access: Anyone → copy the URL ending in /exec.</span>
      <strong>2. Create the Enable Banking app</strong>
      <span class="small muted">enablebanking.com → sign in → API applications → Production → redirect URL = your /exec URL → Register (a .pem file downloads) → link your own accounts when asked.</span>
      <strong>3. Add the key to the script</strong>
      <span class="small muted">Apps Script → Project Settings → Script properties: APP_ID = application ID, PRIVATE_KEY = the content of the .pem file.</span>
    </div>
    <div class="field"><label for="bkUrl">Apps Script URL</label><input id="bkUrl" class="in" value="${esc(b.url)}" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off" spellcheck="false"></div>
    <div id="bkStep"></div>`;
  openSheet('Bank Connection Setup', body, `<button class="btn pri block" data-a="bankConnect">Connect</button>`);
}
async function bankConnect() {
  const url = ($('#bkUrl')?.value || '').trim(); const st = $('#bkStep');
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) { st.innerHTML = `<div class="banner bad">${I.info}<span>Paste the web app URL that ends in /exec.</span></div>`; return; }
  st.innerHTML = `<div class="small muted">Connecting…</div>`;
  const b = bankCfg(); const prevUrl = b.url, prevKey = b.key;
  try {
    b.url = url; if (!b.key || prevUrl !== url) b.key = randKey();
    let claim = null; try { claim = await bk('claim'); } catch (e) { if (e.code !== 'already_claimed') throw e; }
    await bk('ping');
    try { localStorage.setItem('budget.proxy', JSON.stringify({ url: b.url, key: b.key })); } catch (e) { }
    mutate('Bank proxy connected', () => { }, { silent: true }); closeSheet(); toast('Proxy connected'); bankLinkSheet();
  } catch (e) {
    b.url = prevUrl; b.key = prevKey;
    st.innerHTML = `<div class="banner bad">${I.info}<span>${esc(e.code === 'unauthorized' || e.message.includes('wrong key') ? 'This proxy is already paired with another device. Copy the key from that device, or create a new deployment.' : e.message)}</span></div>`;
  }
}

/* ---------- link a bank ---------- */
let BANKS = null;
async function bankLinkSheet() {
  openSheet('Link a bank', `<input id="bkSearch" class="in" type="search" placeholder="Search your bank (e.g. Société Générale)" data-c="bkSearch"><div id="bkList"><div class="small muted">Loading French banks…</div></div>`, '', { focus: '#bkSearch' });
  try { if (!BANKS) BANKS = (await bk('banks', { country: 'FR' })).aspsps || []; bankListRender(''); }
  catch (e) { $('#bkList').innerHTML = `<div class="banner bad">${I.info}<span>${esc(e.message)}</span></div>`; }
}
function bankListRender(q) {
  const el = $('#bkList'); if (!el || !BANKS) return; q = norm(q);
  const list = BANKS.filter(b => !q || norm(b.name).includes(q)).slice(0, 60);
  el.innerHTML = list.length ? `<div class="card">${list.map(b => `<button class="li" data-a="bankLink" data-bank="${esc(b.name)}"><span class="ic">${I.bank}</span><span class="grow"><strong>${esc(b.name)}</strong>${b.psu_types ? `<div class="small muted">${esc(b.psu_types.join(', '))}</div>` : ''}</span>${I.right}</button>`).join('')}</div>` : `<div class="empty"><strong>No bank found</strong></div>`;
}
async function bankLink(name) {
  const b = bankCfg(); const meta = (BANKS || []).find(x => x.name === name);
  const maxSec = meta?.maximum_consent_validity || 180 * 86400;
  const validUntil = new Date(Date.now() + Math.min(maxSec, 180 * 86400) * 1000 - 3600000).toISOString();
  const state = 'eb-' + uid() + uid();
  try {
    const r = await bk('start', { bank: name, country: 'FR', validUntil, state });
    b.pending = { state, bank: name, at: Date.now(), validUntil };
    mutate('Bank login started', () => { }, { silent: true }); await persistNow();
    location.href = r.url;
  } catch (e) { toast(e.message); }
}
let bankPoll = null;
function bankWatchPending() {
  const b = A.plan?.bank; if (!b?.pending || bankPoll) return;
  if (Date.now() - b.pending.at > 30 * 60000) { b.pending = null; scheduleSave(); return; }
  bankPoll = setInterval(async () => {
    try {
      const r = await bk('pending', { state: b.pending.state });
      if (r.pending) return;
      clearInterval(bankPoll); bankPoll = null;
      const s = r.session; const p = b.pending; b.pending = null;
      const conn = { id: uid(), bank: p.bank, session: s.session_id, validUntil: s.access?.valid_until || p.validUntil, accounts: (s.accounts || []).map(a => ({ uid: a.uid, name: a.name || a.product || a.account_id?.iban || 'Account', iban: a.account_id?.iban || '', currency: a.currency || '', acct: null })), lastSync: 0 };
      const old = b.conns.find(c => c.bank === p.bank);
      if (old) for (const a of conn.accounts) { const prev = old.accounts.find(x => (x.iban && x.iban === a.iban) || x.name === a.name); if (prev) a.acct = prev.acct; }
      mutate('Bank connected', () => { b.conns = b.conns.filter(c => c !== old); b.conns.push(conn); });
      bankMapSheet(conn.id);
    } catch (e) { clearInterval(bankPoll); bankPoll = null; toast(e.message); }
  }, 3000);
}

/* ---------- map bank accounts to plan accounts ---------- */
function bankMapSheet(connId) {
  const c = A.plan.bank.conns.find(x => x.id === connId); if (!c) return;
  const opts = sel => `<option value="">Don't import</option><option value="__new">+ Create a new account</option>` + A.plan.accounts.filter(a => !a.closed).map(a => `<option value="${a.id}" ${sel === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
  const body = `<p style="margin:0" class="small muted">Choose where each bank account's transactions go. Imported transactions arrive unapproved, already matched with the ones you entered by hand.</p>
    <div class="card">${c.accounts.map((a, i) => `<div class="li" style="flex-wrap:wrap"><span class="grow" style="min-width:150px"><strong>${esc(a.name)}</strong><div class="small muted">${esc(a.iban ? '•••• ' + a.iban.slice(-4) : '')} ${esc(a.currency)}</div></span>
      <select class="in" style="height:40px; width:auto; max-width:60%" data-bkmap="${i}" aria-label="Plan account for ${esc(a.name)}">${opts(a.acct)}</select></div>`).join('') || '<div class="li muted">The bank returned no accounts.</div>'}</div>
    <div class="field"><label for="bkFrom">Import transactions from</label><input id="bkFrom" class="in" type="date" value="${addDays(todayISO(), -30)}"></div>`;
  openSheet(c.bank + ' accounts', body, `<button class="btn pri block" data-a="bankMapSave" data-id="${connId}">Save & Import</button>`);
}
function bankMapSave(connId) {
  const c = A.plan.bank.conns.find(x => x.id === connId); if (!c) return;
  const from = $('#bkFrom')?.value || addDays(todayISO(), -30);
  mutate('Bank accounts linked', () => {
    $$('[data-bkmap]').forEach(sel => {
      const a = c.accounts[+sel.dataset.bkmap]; let v = sel.value;
      if (v === '__new') { const na = addAccount({ name: a.name, type: 'checking', balance: 0 }); v = na.id; }
      a.acct = v || null; if (a.acct) a.from = from;
    });
  });
  closeSheet(); bankSync(true);
}

/* ---------- import ---------- */
function ebRow(t) {
  const amt = Math.round(parseFloat(t.transaction_amount?.amount || '0') * 100) * (t.credit_debit_indicator === 'DBIT' ? -1 : 1);
  const party = t.credit_debit_indicator === 'DBIT' ? (t.creditor?.name || t.creditor_name) : (t.debtor?.name || t.debtor_name);
  const info = (Array.isArray(t.remittance_information) ? t.remittance_information.join(' ') : t.remittance_information || '').replace(/\s+/g, ' ').trim();
  return { date: t.booking_date || t.value_date || t.transaction_date, amount: amt, payee: (party || info || 'Bank transaction').slice(0, 80), memo: party && info ? info.slice(0, 140) : '', fitid: t.entry_reference || t.transaction_id || null, pending: t.status && t.status !== 'BOOK' };
}
function importRows(acct, rows) {
  const existing = A.tx.filter(t => t.acct === acct);
  const ids = new Set(existing.map(t => t.importId).filter(Boolean)); const used = new Set();
  let nn = 0, nm = 0; const seen = {};
  for (const r of rows) {
    if (!r.date || !r.amount) continue;
    const key0 = r.fitid ? 'eb:' + r.fitid : `eb:${r.date}|${r.amount}|${(r.payee || '').toLowerCase()}|${(r.memo || '').toLowerCase()}`;
    seen[key0] = (seen[key0] || 0) + 1; const key = r.fitid ? key0 : key0 + '|' + seen[key0];
    if (ids.has(key)) continue;
    const match = existing.find(t => !t.importId && !used.has(t.id) && t.amount === r.amount && Math.abs(daysBetween(t.date, r.date)) <= 10);
    if (match) { used.add(match.id); match.importId = key; if (match.cleared === 'u') match.cleared = 'c'; nm++; continue; }
    const y = getPayee(payeeRuleApply(r.payee) || r.payee);
    const cat = y?.lastCat && L.cat[y.lastCat] && onBudget(L.acct[acct]) ? y.lastCat : null;
    A.tx.push({ id: uid(), acct, date: r.date, payee: y?.id || null, cat, memo: r.memo || '', amount: r.amount, cleared: 'c', flag: null, approved: false, importId: key });
    ids.add(key); nn++;
  }
  return { nn, nm };
}
let bankBusy = false;
async function bankSync(manual) {
  const b = A.plan?.bank; if (!b?.url || !b.conns.length || bankBusy) return;
  bankBusy = true; let tn = 0, tm = 0; const errs = [];
  for (const c of b.conns) {
    if (new Date(c.validUntil) < new Date()) { errs.push(c.bank + ': access expired, reconnect'); continue; }
    for (const a of c.accounts) {
      if (!a.acct || !L.acct[a.acct]) continue;
      const from = c.lastSync ? addDays(isoOf(new Date(c.lastSync)), -10) : (a.from || addDays(todayISO(), -30));
      try {
        const rows = []; let ck = null, guard = 0;
        do { const r = await bk('tx', { uid: a.uid, from, ...(ck ? { ck } : {}) }); for (const t of r.transactions || []) { const x = ebRow(t); if (!x.pending) rows.push(x); } ck = r.continuation_key || null; } while (ck && guard++ < 20);
        const snap = snapshot(); const res = importRows(a.acct, rows);
        if (res.nn || res.nm) { A.undo.push({ snap, label: 'Bank import' }); tn += res.nn; tm += res.nm; }
      } catch (e) { errs.push(c.bank + ': ' + e.message); }
    }
    c.lastSync = Date.now();
  }
  bankBusy = false; scheduleSave(); render();
  if (manual || tn || errs.length) toast(errs.length ? errs[0] : `Bank import: ${tn} new, ${tm} matched`, !!tn);
}
function bankAutoSync() {
  const b = A.plan?.bank; if (!b?.conns?.length) return;
  const last = Math.min(...b.conns.map(c => c.lastSync || 0));
  if (Date.now() - last > 6 * 3600000) bankSync(false);
}
