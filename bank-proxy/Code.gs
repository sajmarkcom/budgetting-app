/**
 * Budget — bank connection proxy (Google Apps Script, runs on your own Google account, free).
 * It holds your Enable Banking key and talks to Enable Banking for the app; the app never sees the key.
 *
 * Script properties to set (Project Settings → Script properties):
 *   APP_ID       your Enable Banking application ID
 *   PRIVATE_KEY  the content of the .pem file Enable Banking downloaded when you registered the application
 * The app sets SECRET itself the first time it connects; after that, any request without it is refused.
 * It also keeps your budget in budget-data.json in your Google Drive, so the app syncs without asking you to sign in.
 */
const P = PropertiesService.getScriptProperties();
const EB = 'https://api.enablebanking.com';

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.code || p.error) return callbackPage(p);
  return json({ error: 'use POST' });
}

function doPost(e) {
  let p = {}; try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { }
  return json(handle(p));
}

function handle(p) {
  try {
    if (p.action === 'claim') {
      if (P.getProperty('SECRET')) return { error: 'already_claimed' };
      if (!p.key || p.key.length < 24) return { error: 'bad_key' };
      P.setProperty('SECRET', p.key); return { ok: true };
    }
    if (!P.getProperty('SECRET') || p.key !== P.getProperty('SECRET')) return { error: 'unauthorized' };
    if (p.action === 'load') { const f = dataFile(); return { content: f ? f.getBlob().getDataAsString() : null, at: f ? f.getLastUpdated().getTime() : 0 }; }
    if (p.action === 'save') {
      if (typeof p.content !== 'string' || p.content.length < 20) return { error: 'empty' };
      let f = dataFile();
      if (f) f.setContent(p.content); else { f = DriveApp.createFile('budget-data.json', p.content, 'application/json'); P.setProperty('FILE_ID', f.getId()); }
      return { ok: true };
    }
    switch (p.action) {
      case 'ping': if (!P.getProperty('APP_ID') || !P.getProperty('PRIVATE_KEY')) return { ok: true, bank: false }; return { ok: true, redirect: ScriptApp.getService().getUrl() };
      case 'banks': if (!P.getProperty('APP_ID')) return { error: 'not_configured' }; return api('GET', '/aspsps?country=' + encodeURIComponent(p.country || 'FR'));
      case 'start': return api('POST', '/auth', {
        access: { valid_until: p.validUntil },
        aspsp: { name: p.bank, country: p.country || 'FR' },
        state: p.state, redirect_url: ScriptApp.getService().getUrl(), psu_type: p.psuType || 'personal'
      });
      case 'pending': { // the bank sent the user back to this script: hand the new session to the app once
        const v = P.getProperty('S_' + p.state); if (!v) return { pending: true };
        return JSON.parse(v); // kept so a second device or a retry still gets it; cleaned up after 1 h
      }
      case 'session': return api('GET', '/sessions/' + encodeURIComponent(p.session));
      case 'delete': return api('DELETE', '/sessions/' + encodeURIComponent(p.session));
      case 'balances': return api('GET', '/accounts/' + encodeURIComponent(p.uid) + '/balances');
      case 'tx': {
        let q = []; if (p.from) q.push('date_from=' + encodeURIComponent(p.from)); if (p.ck) q.push('continuation_key=' + encodeURIComponent(p.ck));
        return api('GET', '/accounts/' + encodeURIComponent(p.uid) + '/transactions' + (q.length ? '?' + q.join('&') : ''));
      }
    }
    return { error: 'unknown_action' };
  } catch (err) { return { error: String(err && err.message || err) }; }
}

function callbackPage(p) {
  let ok = false, msg = '';
  try {
    if (p.code && p.state && /^eb-[\w-]{8,}$/.test(p.state)) {
      const s = api('POST', '/sessions', { code: p.code });
      if (s.error) msg = 'Enable Banking: ' + JSON.stringify(s.detail || s.error);
      else { P.setProperty('S_' + p.state, JSON.stringify({ session: s, at: Date.now() })); cleanup(); ok = true; }
    } else msg = p.error_description || p.error || 'Missing authorization code.';
  } catch (err) { msg = String(err); }
  const html = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:-apple-system,system-ui,sans-serif;padding:32px;background:#0A1122;color:#E7ECF7">'
    + (ok ? '<h2>Bank connected ✓</h2><p>Go back to the Budget app: your accounts will appear there.</p>'
          : '<h2>Connection failed</h2><p>' + msg.replace(/[<>&]/g, '') + '</p><p>Go back to the Budget app and try again.</p>') + '</body>';
  return HtmlService.createHtmlOutput(html).setTitle('Budget — bank connection');
}

function cleanup() {
  const all = P.getProperties(); for (const k in all) if (k.indexOf('S_') === 0) { try { if (Date.now() - (JSON.parse(all[k]).at || 0) > 3600000) P.deleteProperty(k); } catch (e) { P.deleteProperty(k); } }
}

function dataFile() {
  const id = P.getProperty('FILE_ID'); if (!id) return null;
  try { const f = DriveApp.getFileById(id); return f.isTrashed() ? null : f; } catch (e) { return null; }
}

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function pem() {
  // accepts the key pasted with or without line breaks
  const raw = P.getProperty('PRIVATE_KEY');
  const body = raw.replace(/-----(BEGIN|END)[^-]*-----/g, '').replace(/\s+/g, '');
  return '-----BEGIN PRIVATE KEY-----\n' + body.match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----\n';
}

function jwt() {
  const b64 = s => Utilities.base64EncodeWebSafe(s).replace(/=+$/, '');
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ typ: 'JWT', alg: 'RS256', kid: P.getProperty('APP_ID') }));
  const claims = b64(JSON.stringify({ iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: now, exp: now + 3600 }));
  const sig = Utilities.computeRsaSha256Signature(head + '.' + claims, pem());
  return head + '.' + claims + '.' + b64(sig);
}

function api(method, path, body) {
  const opt = { method: method, headers: { Authorization: 'Bearer ' + jwt() }, muteHttpExceptions: true };
  if (body) { opt.contentType = 'application/json'; opt.payload = JSON.stringify(body); }
  const r = UrlFetchApp.fetch(EB + path, opt);
  const t = r.getContentText(); let j; try { j = JSON.parse(t); } catch (x) { j = { raw: t }; }
  if (r.getResponseCode() >= 300) return { error: 'HTTP ' + r.getResponseCode(), detail: j };
  return j;
}

/** Run once from the editor (select "test" → Run) to check the key works: it lists French banks in the log. */
function test() {
  const r = api('GET', '/aspsps?country=FR');
  Logger.log(r.error ? JSON.stringify(r) : (r.aspsps || []).map(a => a.name).join(', '));
}
