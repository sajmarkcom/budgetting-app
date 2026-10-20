/* ================= Budget — direct bank connection (Enable Banking through your own Apps Script proxy) ================= */
function bankCfg() {
  const b = (A.plan.bank ||= { url: '', key: '', conns: [], pending: null }); b.conns ||= [];
  // a device linked with a pairing code already knows your script: reuse it instead of asking again
  if (!b.url) { try { const x = JSON.parse(localStorage.getItem('budget.proxy') || 'null'); if (x?.url && x?.key) { b.url = x.url; b.key = x.key; } } catch (e) { } }
  return b;
}
async function bk(action, params = {}) {
  const b = bankCfg(); if (!b.url) throw new Error('Bank connection is not set up');
  // key and parameters travel in the request body (never in the URL), over HTTPS, to the user's own script
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
  const r = await fetch(b.url, { signal: ctl.signal, method: 'POST', redirect: 'follow', credentials: 'omit', cache: 'no-store', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, key: b.key, ...params }) }).catch(e => { throw new Error(e.name === 'AbortError' ? 'Your Apps Script did not answer in time. Try again in a minute.' : 'Could not reach your Apps Script.'); }).finally(() => clearTimeout(to));
  if (!r.ok) throw new Error('Proxy responded ' + r.status);
  const j = await r.json();
  if (j.error) { const e = new Error(j.error === 'unauthorized' ? 'The proxy refused the request (wrong key).' : j.error === 'not_configured' ? 'Add APP_ID and PRIVATE_KEY in the Apps Script properties.' : (j.error + (j.detail ? ': ' + JSON.stringify(j.detail).slice(0, 200) : ''))); e.code = j.error; throw e; }
  return j;
}
function randKey() { const a = new Uint8Array(24); crypto.getRandomValues(a); return Array.from(a, x => x.toString(16).padStart(2, '0')).join(''); }

/* ---------- settings block ---------- */
function bankSettingsHtml() {
  const b = bankCfg();
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
    ${pendList().length ? (setTimeout(bankWatchPending, 0), '') + `<div class="li"><span class="ic">${I.sync}</span><span class="grow"><strong>Waiting for ${esc(pendList().slice(-1)[0].bank)}…</strong><div class="small muted">Finish the login at your bank, then come back here.</div></span><button class="btn sm" data-a="bankCheck">Check now</button><button class="btn sm" data-a="bankCancel">Cancel</button></div>` : ''}
    <button class="li" data-a="bankLinkSheet"><span class="ic">${I.plus}</span><span class="grow"><strong>Link a bank</strong></span></button>
    ${b.conns.length ? `<button class="li" data-a="bankSyncNow"><span class="ic">${I.download}</span><span class="grow"><strong>Import now</strong><div class="small muted">Imports run automatically when you open the app (at most every 6 hours)</div></span></button>` : ''}
    <button class="li" data-a="yLearn"><span class="ic">${I.download}</span><span class="grow"><strong>Payee names from YNAB</strong><div class="small muted">${A.plan.learned ? Object.keys(A.plan.learned).length + ' bank labels learned · update' : 'Learn payees and categories from your past YNAB choices'}</div></span></button>
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
    pendSave([...pendList(), { state, bank: name, at: Date.now(), validUntil, plan: A.plan.id }]);
    await persistNow(); try { if (gdOn()) await gdPush(); } catch (e) { }
    location.href = r.url;
  } catch (e) { toast(e.message); }
}
/* bank logins in progress live on THIS device only (never synced: another device's copy can't overwrite them) */
const PEND_KEY = 'budget.bankPending';
function pendAll() { try { return JSON.parse(localStorage.getItem(PEND_KEY) || '[]').filter(x => Date.now() - x.at < 60 * 60000); } catch (e) { return []; } }
function pendSave(l) { try { localStorage.setItem(PEND_KEY, JSON.stringify(l)); } catch (e) { } }
function pendList() { return A.plan ? pendAll().filter(x => x.plan === A.plan.id) : []; }
function pendDrop(state) { pendSave(pendAll().filter(x => x.state !== state)); }
let bankPoll = null, pendBusy = false;
async function bankCheckOnce(manual) {
  if (pendBusy || !A.plan?.bank?.url) return; pendBusy = true;
  try {
    const list = pendList(); if (!list.length) { clearInterval(bankPoll); bankPoll = null; return; }
    for (const p of list) {
      const r = await bk('pending', { state: p.state });
      if (r.pending || !r.session) continue;
      const s = r.session; pendDrop(p.state);
      const B = A.plan.bank; if (B.pending) B.pending = null;
      if (B.conns.some(c => c.session === s.session_id)) continue;
      const conn = { id: uid(), bank: p.bank, session: s.session_id, validUntil: s.access?.valid_until || p.validUntil, accounts: (s.accounts || []).map(a => ({ uid: a.uid, name: a.name || a.product || a.account_id?.iban || 'Account', iban: a.account_id?.iban || '', currency: a.currency || '', product: a.product || '', type: a.cash_account_type || '', acct: null })), lastSync: 0 };
      const old = B.conns.find(c => c.bank === p.bank);
      if (old) for (const a of conn.accounts) { const prev = old.accounts.find(x => (x.iban && x.iban === a.iban) || x.name === a.name); if (prev) a.acct = prev.acct; }
      mutate('Bank connected', () => { const BB = A.plan.bank; BB.conns = BB.conns.filter(c => c.id !== old?.id); BB.conns.push(conn); });
      await persistNow(); try { if (gdOn()) await gdPush(); } catch (e) { }
      pendSave(pendAll().filter(x => !(x.plan === A.plan.id && x.bank === p.bank)));
      bankMapSheet(conn.id); return;
    }
    if (manual) toast('Not received yet: finish the login at your bank until you see "Bank connected".');
  } catch (e) { toast(e.message); }
  finally { pendBusy = false; if (!pendList().length) { clearInterval(bankPoll); bankPoll = null; if (A.view === 'settings') render(); } }
}
function bankWatchPending() {
  if (A.plan?.bank?.pending) { A.plan.bank.pending = null; } // old synced field: ignored now
  if (!pendList().length || bankPoll) return;
  bankCheckOnce(); bankPoll = setInterval(() => bankCheckOnce(), 3000);
}

/* ---------- map bank accounts to plan accounts ---------- */
const BK_TYPE = { CACC: 'Current account', SVGS: 'Savings', LOAN: 'Loan', CARD: 'Card', CASH: 'Cash account', MOMA: 'Money market', TRAN: 'Transactional', OTHR: '' };
function bankMapSheet(connId) {
  const c = A.plan.bank.conns.find(x => x.id === connId); if (!c) return;
  const opts = sel => `<option value="">Don't import</option><option value="__new">+ Create a new account</option><option value="__newcc">+ Create a new credit card account</option>` + A.plan.accounts.filter(a => !a.closed).map(a => `<option value="${a.id}" ${sel === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
  const body = `<p style="margin:0" class="small muted">Choose where each bank account's transactions go. Imported transactions arrive unapproved, already matched with the ones you entered by hand.</p>
    <div class="card">${c.accounts.map((a, i) => `<div class="li" style="flex-wrap:wrap"><span class="grow" style="min-width:150px"><strong>${esc(a.name)}</strong><div class="small muted">${esc([BK_TYPE[a.type] || '', a.product && a.product !== a.name ? a.product : '', a.iban ? '•••• ' + a.iban.slice(-4) : ''].filter(Boolean).join(' · '))}</div><div class="small muted" data-bkbal="${i}">Loading balance…</div></span>
      <select class="in" style="height:40px; width:auto; max-width:60%" data-bkmap="${i}" aria-label="Plan account for ${esc(a.name)}">${opts(a.acct)}</select></div>`).join('') || '<div class="li muted">The bank returned no accounts.</div>'}</div>
    <div class="field"><label for="bkFrom">Import transactions from</label><input id="bkFrom" class="in" type="date" value="${addDays(todayISO(), -30)}"></div>`;
  openSheet(c.bank + ' accounts', body, `<button class="btn pri block" data-a="bankMapSave" data-id="${connId}">Save & Import</button>`);
  // show each account's balance so you can tell them apart (current account, savings, loan…)
  c.accounts.forEach(async (a, i) => {
    try {
      const r = await bk('balances', { uid: a.uid }); const bl = (r.balances || [])[0]; const el = $(`[data-bkbal="${i}"]`);
      if (!el) return;
      if (bl) { const v = Math.round(parseFloat(bl.balance_amount.amount) * 100); el.textContent = 'Balance ' + fmt(v) + (bl.balance_amount.currency && bl.balance_amount.currency !== 'EUR' ? ' ' + bl.balance_amount.currency : '') + (bl.balance_type ? ' (' + bl.balance_type + ')' : ''); el.className = 'small ' + (v < 0 ? 'amt-bad' : 'muted'); }
      else el.textContent = 'Balance: the bank returned none';
    } catch (e) { const el = $(`[data-bkbal="${i}"]`); if (el) { el.className = 'small muted'; el.textContent = 'Balance unavailable: ' + e.message.slice(0, 120); } }
  });
}
function bankMapSave(connId) {
  const c = A.plan.bank.conns.find(x => x.id === connId); if (!c) return;
  const from = $('#bkFrom')?.value || addDays(todayISO(), -30);
  mutate('Bank accounts linked', () => {
    $$('[data-bkmap]').forEach(sel => {
      const a = c.accounts[+sel.dataset.bkmap]; let v = sel.value;
      if (v === '__new') { const na = addAccount({ name: a.name, type: 'checking', balance: 0 }); v = na.id; }
      if (v === '__newcc') { const na = addAccount({ name: c.bank === 'Société Générale' ? 'SG Card' : c.bank + ' Card', type: 'credit', balance: 0 }); v = na.id; }
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
/* free auto-categorisation: tidy the bank's label, then reuse a payee you already have (and its last category) */
function cleanPayee(raw) {
  // bank labels change at every payment (dates, references, card numbers): keep only the merchant / person
  let x = ' ' + String(raw || '').replace(/\s+/g, ' ') + ' ';
  const m = x.match(/\s(?:DE|POUR)\s?:\s*(.+?)(?=\s(?:ID|MOTIF|REF|DATE|IBAN|BQ|CPT|LIB|LIBELLE|NUM)\s?:|\s\d{2}\s\d{2}\sBQ\s|\sBQ\s|$)/i);
  if (m) x = ' ' + m[1] + ' ';
  else {
    const c = x.match(/\sCARTE\s+X\d{3,}\s+(?:REMBT\s+)?(?:\d{2}\/\d{2}\s+)?(.+)$/i); if (c) x = ' ' + c[1] + ' ';
  }
  x = x.replace(/\s(CB|CARTE|PRLV|PRELEVEMENT|EUROPEEN|SEPA|VIR|VIREMENT|INST|INSTANTANE|RE|RECU|EMIS|LOGITEL|WERO|PERM|PAIEMENT|ACHAT|RETRAIT|DAB|FACTURE|COMMERCE|ELECTRONIQUE|REMBT|TRANSF|COMPTABILISE|COMPTABILISÉ|AUTORISATION|EN COURS|PAYPAL \*|SUMUP \*|ZETTLE_\*)(?=\s)/gi, ' ')
    .replace(/\s(M|MME|MLLE|MR|MRS)\.?(?=\s)/gi, ' ')
    .replace(/\sX\d{3,}/gi, ' ').replace(/\d{1,2}[\/.-]\d{1,2}([\/.-]\d{2,4})?/g, ' ').replace(/\*+\d*\**/g, ' ').replace(/\S*\d\S*/g, ' ').replace(/[*_#:]+/g, ' ').replace(/(^|\s)[^\p{L}\s]+(?=\s|$)/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!x) return String(raw || '').trim();
  const words = x.split(' ').slice(0, 3).join(' ');
  return words === words.toUpperCase() ? words.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, m => m.toUpperCase()) : words;
}
function learnKey(raw) { return norm(cleanPayee(raw)).replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim(); }
/* payee you gave this bank label before (learned from YNAB) */
function learnedPayee(raw) {
  const m = A.plan.learned; if (!m) return null; const k = learnKey(raw); if (!k) return null;
  let name = m[k];
  if (!name) { const w = k.split(' '); for (let n = w.length; n >= 1 && !name; n--) { const pre = w.slice(0, n).join(' '); if (pre.length < 4) break; const hits = new Set(Object.entries(m).filter(([kk]) => kk === pre || kk.startsWith(pre + ' ')).map(([, v]) => v)); if (hits.size === 1) name = [...hits][0]; } }
  if (!name) { // same family name as people you already classed (e.g. any “… Bouchenoire” → Famille)
    const last = k.split(' ').slice(-1)[0];
    if (last.length >= 4 && k.split(' ').length >= 2) { const hits = new Set(Object.entries(m).filter(([kk]) => kk.split(' ').length >= 2 && kk.split(' ').slice(-1)[0] === last).map(([, v]) => v)); if (hits.size === 1) name = [...hits][0]; }
  }
  return name ? getPayee(name) : null;
}
/* common merchants → one of YOUR payees (the ones you used in YNAB), so new bank lines land where you'd have put them */
const MERCHANTS = [
  [/\b(lidl|carrefour|leclerc|auchan|intermarch|super ?u|hyper ?u|monoprix|franprix|casino|picard|aldi|netto|biocoop|grand frais|naturalia|spar|proxi|coccinelle)\b/i, ['courses', 'supermarche', 'alimentation', 'groceries']],
  [/\b(mc ?do|mc ?donald'?s?|burger king|kfc|quick|subway|uber ?eats|deliveroo|o'?tacos|five guys|domino|pizza hut|just eat)\b/i, ['fast-food', 'fast food', 'restaurants', 'restaurant']],
  [/\b(total|esso|shell|avia|bp|intermarche carbu|station|carburant|eni)\b(?!.*energies)/i, ['essence', 'carburant', 'fuel']],
  [/\b(tisseo|sncf|ouigo|ratp|tcl|navigo|bolt|lime|uber(?! ?eats)|blablacar|flixbus|tier|dott)\b/i, ['transport', 'tisseo', 'transports']],
  [/\b(vinci autoroutes|sanef|aprr|asf|cofiroute|peage|area)\b/i, ['peage', 'péage']],
  [/\b(free|bouygues|orange|sfr|sosh|red by sfr|b ?& ?you)\b/i, ['telecoms', 'télécoms', 'telephone', 'internet']],
  [/\b(totalenergies|edf|engie|ekwateur|enercoop)\b/i, ['total energies', 'energie', 'électricité', 'electricite']],
  [/\b(spotify)\b/i, ['spotify', 'abonnements']], [/\b(netflix|disney|canal|prime video|deezer)\b/i, ['abonnements', 'streaming']],
  [/\b(apple|icloud|google|microsoft|openai|anthropic|claude|adobe|notion|github)\b/i, ['abonnements tech', 'abonnements']],
  [/\b(basic ?fit|fitness park|keepcool|on air|neoness|l'?orange bleue)\b/i, ['gym', 'sport', 'salle']],
  [/\b(olivier|lolivier|maif|macif|axa|matmut|groupama|sogessur|spb|allianz|alan|harmonie)\b/i, ['olivier assurance', 'assurances', 'assurance', 'mutuelle']],
  [/\b(amazon|zalando|fnac|darty|decathlon|ikea|action|h ?& ?m|zara|uniqlo|shein|vinted|leroy merlin|boulanger|sephora)\b/i, ['shopping', 'achats']],
  [/\b(pharmacie|doctolib|medecin|dentiste|laboratoire)\b/i, ['santé', 'sante', 'pharmacie']],
  [/\b(tabac|presse)\b/i, ['tabac']], [/\b(dgfip|impot|tresor public)\b/i, ['états', 'etat', 'impots', 'impôts']],
];
/* your own name, as the banks report it on your accounts (e.g. “BOUCHENOIRE Sullivan”) */
function ownerNames() {
  const out = new Set();
  for (const c of A.plan.bank?.conns || []) for (const x of c.accounts) { const w = norm(x.name || '').replace(/[^\p{L} ]/gu, ' ').split(/\s+/).filter(t => t.length >= 3); if (w.length >= 2 && w.length <= 4) out.add(w.sort().join(' ')); }
  return [...out];
}
function isSelfLabel(raw) {
  const own = ownerNames(); if (!own.length) return false;
  const w = new Set(norm(cleanPayee(raw) + ' ' + String(raw || '')).replace(/[^\p{L} ]/gu, ' ').split(/\s+/));
  return own.some(n => n.split(' ').every(t => w.has(t)));
}
/* money you moved between your own accounts: link both bank lines as one transfer */
function pairSelfTransfers() {
  let n = 0;
  const cand = A.tx.filter(t => t.self && !t.transferAcct && !t.approved);
  for (const t of cand) {
    if (t.transferAcct) continue;
    const o = A.tx.find(x => x !== t && x.acct !== t.acct && !x.transferAcct && x.amount === -t.amount && Math.abs(daysBetween(x.date, t.date)) <= 4 && (x.self || !x.cat) && L.acct[x.acct] && !L.acct[x.acct].closed);
    if (!o) continue;
    t.transferAcct = o.acct; t.transferId = o.id; t.payee = null; t.cat = null; t.splits = null;
    o.transferAcct = t.acct; o.transferId = t.id; o.payee = null; o.cat = null; o.splits = null; n++;
  }
  return n;
}
function merchantPayee(raw) {
  const txt = ' ' + cleanPayee(raw) + ' ' + String(raw || '') + ' ';
  for (const [re, names] of MERCHANTS) if (re.test(txt)) {
    for (const n of names) { const y = A.plan.payees.find(p => p.lastCat && L.cat[p.lastCat] && norm(p.name.replace(/^\p{Extended_Pictographic}\s*/u, '')) === norm(n)); if (y) return y; }
  }
  return null;
}
function guessPayee(raw) {
  const mp = merchantPayee(raw); if (mp) return mp;
  const n = norm(cleanPayee(raw)); if (n.length < 3) return null;
  const first = n.split(' ')[0];
  let best = null;
  for (const y of A.plan.payees) {
    if (!y.lastCat || !L.cat[y.lastCat] || /^(starting balance|transfer)/i.test(y.name)) continue;
    const pn = norm(y.name.replace(/^\p{Extended_Pictographic}\s*/u, '')); if (pn.length < 3) continue;
    const hit = n === pn || n.startsWith(pn + ' ') || pn.startsWith(n + ' ') || (first.length >= 4 && pn.split(' ')[0] === first);
    if (hit && (!best || pn.length > norm(best.name).length)) best = y;
  }
  return best;
}
/* imported by this app from the bank (YNAB's own import ids don't count) */
function isBankImp(t) { return !!t.importId && /^ebp?:/.test(t.importId); }
/* a bank line that you typed as two transactions (e.g. loan + its insurance) */
function findPair(list, r) {
  const c = list.filter(t => Math.abs(daysBetween(t.date, r.date)) <= 7 && Math.sign(t.amount) === Math.sign(r.amount) && Math.abs(t.amount) < Math.abs(r.amount));
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) if (c[i].amount + c[j].amount === r.amount && Math.abs(daysBetween(c[i].date, c[j].date)) <= 3) return [c[i], c[j]];
  return null;
}
/* bank lines imported twice: once by YNAB (or typed by hand) and once by this app */
function bankDupes(acctId) {
  const mine = A.tx.filter(t => t.acct === acctId && !isBankImp(t) && !t.pend && L.payee[t.payee]?.name !== 'Starting Balance');
  const imp = A.tx.filter(t => t.acct === acctId && isBankImp(t) && !t.approved && !t.importId.includes('#') && !t.pend);
  const used = new Set(), out = [];
  for (const t of imp.sort((a, b) => a.date < b.date ? -1 : 1)) {
    const free = mine.filter(m => !used.has(m.id));
    const one = free.filter(m => m.amount === t.amount && Math.abs(daysBetween(m.date, t.date)) <= 7).sort((a, b) => Math.abs(daysBetween(a.date, t.date)) - Math.abs(daysBetween(b.date, t.date)))[0];
    if (one) { used.add(one.id); out.push({ imp: t, keep: [one] }); continue; }
    const pair = findPair(free, t); if (pair) { pair.forEach(m => used.add(m.id)); out.push({ imp: t, keep: pair }); }
  }
  return out;
}
function mergeBankDupes(acctId) {
  const d = bankDupes(acctId); if (!d.length) return 0;
  mutate(`Merged ${d.length} duplicate${d.length > 1 ? 's' : ''}`, () => {
    for (const x of d) { x.keep.forEach((m, k) => { m.importId = x.imp.importId + (k ? '#' + (k + 1) : ''); if (m.cleared === 'u') m.cleared = 'c'; }); const i = A.tx.indexOf(x.imp); if (i >= 0) A.tx.splice(i, 1); }
  });
  return d.length;
}
function importRows(acct, rows, from) {
  const existing = A.tx.filter(t => t.acct === acct);
  const ids = new Set([...existing.map(t => t.importId).filter(Boolean), ...(A.plan.ignoredImp || [])]); const used = new Set(), pendSeen = new Set();
  let nn = 0, nm = 0; const seen = {};
  const today = todayISO();
  for (const r of rows) {
    if (!r.date || !r.amount || r.date > today) continue; // future-dated lines (standing orders the bank announces) come when they are actually paid
    const base = r.fitid ? r.fitid : `${r.date}|${r.amount}|${(r.payee || '').toLowerCase()}|${(r.memo || '').toLowerCase()}`;
    const key0 = (r.pending ? 'ebp:' : 'eb:') + base;
    seen[key0] = (seen[key0] || 0) + 1; const key = r.fitid ? key0 : key0 + '|' + seen[key0];
    if (ids.has(key)) { if (r.pending) pendSeen.add(key); continue; }
    if (!r.pending) { // a card payment that was pending is now booked: update it instead of adding a duplicate
      const pt = existing.find(t => t.pend && !used.has(t.id) && t.amount === r.amount && Math.abs(daysBetween(t.date, r.date)) <= 10);
      if (pt) { used.add(pt.id); pt.importId = key; pt.pend = false; pt.date = r.date; if (pt.cleared === 'u') pt.cleared = 'c'; ids.add(key); nm++; continue; }
    }
    let match = existing.find(t => !isBankImp(t) && !t.pend && !used.has(t.id) && t.amount === r.amount && Math.abs(daysBetween(t.date, r.date)) <= 10);
    if (!match && !r.pending) { const pair = findPair(existing.filter(t => !isBankImp(t) && !used.has(t.id)), r); if (pair) { used.add(pair[1].id); pair[1].importId = key + '#2'; match = pair[0]; } }
    if (match) { used.add(match.id); match.importId = key; if (r.pending) { match.pend = true; pendSeen.add(key); } else if (match.cleared === 'u') match.cleared = 'c'; nm++; continue; }
    const self = !r.pending && isSelfLabel(r.payee);
    const ruled = payeeRuleApply(r.payee); const y = self ? getPayee(cleanPayee(r.payee)) : ruled && ruled !== r.payee ? getPayee(ruled) : (learnedPayee(r.payee) || L.payeeByName[(r.payee || '').toLowerCase()] || guessPayee(r.payee) || getPayee(cleanPayee(r.payee)));
    const acc = L.acct[acct]; let cat = !self && y?.lastCat && L.cat[y.lastCat] && onBudget(acc) ? y.lastCat : null;
    if (!cat && !self && r.amount > 0 && onBudget(acc) && !isCredit(acc)) cat = 'rta';
    A.tx.push({ id: uid(), acct, date: r.date, payee: y?.id || null, cat, memo: r.memo || '', amount: r.amount, cleared: r.pending ? 'u' : 'c', flag: null, approved: false, importId: key, rawPayee: r.payee, ...(self ? { self: true } : {}), ...(r.pending ? { pend: true } : {}) });
    if (r.pending) pendSeen.add(key);
    ids.add(key); nn++;
  }
  // pending payments the bank no longer reports (cancelled) disappear, unless you already approved them
  for (const t of existing) if (t.pend && !used.has(t.id) && !pendSeen.has(t.importId) && !t.approved && (!from || t.date >= from)) { const i = A.tx.indexOf(t); if (i >= 0) A.tx.splice(i, 1); }
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
      const first = !a.lastSync; // each bank account keeps its own sync date (one linked later starts from its own date)
      const from = !first ? addDays(isoOf(new Date(a.lastSync)), -10) : (a.from || addDays(todayISO(), -30));
      try {
        const rows = []; let ck = null, guard = 0;
        do { const r = await bk('tx', { uid: a.uid, from, ...(ck ? { ck } : {}) }); for (const t of r.transactions || []) rows.push(ebRow(t)); ck = r.continuation_key || null; } while (ck && guard++ < 20);
        const hadTx = A.tx.some(t => t.acct === a.acct);
        const snap = snapshot(); const res = importRows(a.acct, rows, from);
        if (first && !hadTx) { // brand-new account: add a starting balance so it matches the bank
          try {
            const br = await bk('balances', { uid: a.uid }); const bl = (br.balances || [])[0];
            if (bl) { const bal = Math.round(parseFloat(bl.balance_amount.amount) * 100); const sum = A.tx.filter(t => t.acct === a.acct).reduce((x, t) => x + t.amount, 0);
              if (bal - sum) { const acc = L.acct[a.acct]; A.tx.push({ id: uid(), acct: a.acct, date: addDays(from, -1), payee: getPayee('Starting Balance').id, cat: onBudget(acc) && !isCredit(acc) ? 'rta' : '__start', memo: '', amount: bal - sum, cleared: 'c', flag: null, approved: true }); res.nn++; } }
          } catch (e) { }
        }
        a.lastSync = Date.now();
        if (res.nn || res.nm) { A.undo.push({ snap, label: 'Bank import' }); tn += res.nn; tm += res.nm; }
      } catch (e) { errs.push(c.bank + ': ' + e.message); }
    }
    c.lastSync = Date.now();
  }
  { const today = todayISO(); const fut = A.tx.filter(t => isBankImp(t) && !t.approved && t.date > today).map(t => t.id); if (fut.length) A.tx = A.tx.filter(t => !fut.includes(t.id)); }
  if (pairSelfTransfers()) tn = tn; bankBusy = false; scheduleSave(); render();
  if (manual || tn || errs.length) toast(errs.length ? errs[0] : `Bank import: ${tn} new, ${tm} matched`, !!tn);
}
function bankAutoSync() {
  const b = A.plan?.bank; if (!b?.conns?.length) return;
  const last = Math.min(...b.conns.map(c => c.lastSync || 0));
  if (Date.now() - last > 6 * 3600000) bankSync(false);
}

function autoCategorize(quiet) {
  let n = 0;
  mutate('Auto-categorize', () => {
    for (const t of A.tx) {
      const a = L.acct[t.acct]; if (t.cat || t.transferAcct || (t.splits && t.splits.length) || !onBudget(a) || !isBankImp(t)) continue;
      if (t.amount > 0 && !isCredit(a)) { t.cat = 'rta'; n++; continue; }
      const cur = L.payee[t.payee]; if (isSelfLabel(t.rawPayee || cur?.name || '')) { t.self = true; continue; }
      const lp = learnedPayee(cur?.name || '');
      if (lp) { t.payee = lp.id; if (lp.lastCat && L.cat[lp.lastCat]) t.cat = lp.lastCat; n++; continue; }
      const g = cur?.lastCat && L.cat[cur.lastCat] ? cur : guessPayee(cur?.name || '');
      if (g) { t.payee = g.id; t.cat = g.lastCat; n++; }
    }
  });
  let pairs = 0; mutate('Transfers linked', () => { pairs = pairSelfTransfers(); }, { silent: true }); n += pairs;
  if (quiet) return n;
  toast(n ? `${n} transaction${n > 1 ? 's' : ''} categorized: check them, then approve` : 'Nothing recognised: categorize a few by hand and the app learns them');
}
