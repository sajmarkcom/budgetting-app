/* ================= Budget — UI: shell, plan, accounts, register ================= */
const ico = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const I = {
  link: ico('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  left: ico('<path d="M15 18l-6-6 6-6"/>'), right: ico('<path d="M9 18l6-6-6-6"/>'), down: ico('<path d="M6 9l6 6 6-6"/>'),
  plan: ico('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M9 10v10"/>'),
  accts: ico('<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/>'),
  reflect: ico('<path d="M4 20V11M10 20V5M16 20v-6M21 20H3"/>'),
  gear: ico('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  list: ico('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'),
  plus: ico('<path d="M12 5v14M5 12h14"/>'), close: ico('<path d="M18 6L6 18M6 6l12 12"/>'), check: ico('<path d="M20 6L9 17l-5-5"/>'),
  undo: ico('<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'), redo: ico('<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  wand: ico('<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>'),
  swap: ico('<path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/>'), edit: ico('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  up: ico('<path d="M18 15l-6-6-6 6"/>'), eye: ico('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeoff: ico('<path d="M17.9 17.9A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22"/>'),
  trash: ico('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'), upload: ico('<path d="M12 15V3M7 8l5-5 5 5M5 21h14"/>'), download: ico('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
  search: ico('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'), lock: ico('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  repeat: ico('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'),
  target: ico('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  bank: ico('<path d="M3 10l9-6 9 6M5 10v8M19 10v8M9.5 10v8M14.5 10v8M3 21h18"/>'), card: ico('<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/>'),
  loan: ico('<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-6h4v6"/>'), chart: ico('<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
  cash: ico('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>'), piggy: ico('<path d="M19 9c1.5.5 2 1.5 2 3h-2a7 7 0 0 1-3 4v3h-3v-2h-3v2H7v-3a6 6 0 0 1-2-4H3v-3h2a7 7 0 0 1 7-4h3l2-2v4"/>'),
  people: ico('<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 11a4 4 0 0 0 0-8M22 21a7 7 0 0 0-5-6.7"/>'),
  cal: ico('<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>'), flag: ico('<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>'),
  split: ico('<path d="M16 3h5v5M8 3H3v5M21 3l-7 7M3 3l7 7M12 22v-8"/>'), file: ico('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
  note: ico('<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4"/>'), sel: ico('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-6"/>'),
  info: ico('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'), sync: ico('<path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>'),
};
const acctIcon = a => isCredit(a) ? I.card : ACCT[a.type]?.grp === 'loan' ? I.loan : a.type === 'savings' ? I.piggy : a.type === 'cash' ? I.cash : ACCT[a.type]?.grp === 'tracking' ? I.chart : I.bank;

/* ---------- toast ---------- */

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, withUndo) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = `<span>${esc(msg)}</span>${withUndo ? `<button data-a="undo">Undo</button>` : ''}`;
  t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3800);
}
function paintSync() { $$('.syncState').forEach(el => { el.textContent = syncLabel(); }); }
function syncLabel() {
  return { local: 'Saved on this device', syncing: 'Syncing…', synced: 'Synced across your devices', error: 'Sync failed — data kept on this device', quota: 'Sync storage full — export a backup', 'drive-ok': 'Synced with Google Drive', 'drive-err': 'Google Drive sync failed' + (typeof GD !== 'undefined' && GD.lastErr ? ' (' + GD.lastErr + ')' : ' — try again later'), 'drive-login': 'Sign in to Google again', 'script-update': 'Update your Apps Script to the latest version' }[A.sync] || 'Saved on this device';
}
const DESK = () => window.matchMedia('(min-width: 1024px)').matches;
let _wasDesk = null;
window.addEventListener('resize', () => { const d = DESK(); if (_wasDesk !== null && d !== _wasDesk) render(); });

/* ---------- account sections (YNAB order) ---------- */
const SECTIONS = [['cash', 'Cash', a => ['checking', 'savings', 'cash'].includes(a.type)], ['credit', 'Credit', a => isCredit(a)], ['loan', 'Loans', a => ACCT[a.type].grp === 'loan'], ['tracking', 'Tracking', a => ACCT[a.type].grp === 'tracking']];

/* ---------- shell ---------- */
function render() {
  const app = $('#app'); _wasDesk = DESK();
  if (!A.plan) { app.innerHTML = viewOnboarding(); $('#nav').innerHTML = ''; $('#fab').hidden = true; return; }
  let html = '';
  if (A.view === 'plan') html = viewPlan();
  else if (A.view === 'accounts') html = A.acct ? viewRegister() : viewAccounts();
  else if (A.view === 'tx') { A.acct = 'all'; html = viewRegister(); }
  else if (A.view === 'reflect') html = viewReflect();
  else if (A.view === 'settings') html = viewSettings();
  const y = window.scrollY; const mainY = $('.main')?.scrollTop || 0;
  const insp = A.view === 'plan' && DESK() ? `<aside class="insp" aria-label="Month summary">${inspector()}</aside>` : '';
  app.innerHTML = `<div class="shell ${insp ? 'with-insp' : ''} ${A.ui.compact ? 'compact' : ''}">${DESK() ? `<aside class="side" aria-label="Navigation">${sidebar()}</aside>` : ''}<div class="main">${html}</div>${insp}</div>`;
  if (render._keepScroll) { window.scrollTo(0, y); const mn = $('.main'); if (mn) mn.scrollTop = mainY; } render._keepScroll = false;
  $('#nav').innerHTML = DESK() ? '' : `<div>
    ${navBtn('plan', 'Plan', I.plan)}${navBtn('accounts', 'Accounts', I.accts)}${navBtn('tx', 'Transactions', I.list)}${navBtn('reflect', 'Reflect', I.reflect)}${navBtn('settings', 'Settings', I.gear)}
  </div>`;
  const showFab = !DESK() && (A.view === 'plan' || A.view === 'accounts' || A.view === 'tx') && !A.ui.select && A.plan.accounts.some(a => !a.closed);
  $('#fab').hidden = !showFab;
  if (A.ui.select && A.ui.selected.size) $('#actionbar').innerHTML = actionBar(); else $('#actionbar').innerHTML = '';
}
const navBtn = (v, l, icn) => `<button data-a="nav" data-v="${v}" class="${A.view === v ? 'on' : ''}" aria-current="${A.view === v ? 'page' : 'false'}">${icn}<span>${l}</span></button>`;
function topBar(title, sub, left = '', right = '') {
  return `<div class="top wrap"><div class="top-bar">${left || '<span style="width:44px"></span>'}<div class="top-title"><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${right || '<span style="width:44px"></span>'}</div></div>`;
}
const undoBtns = () => `<button class="ibtn" data-a="undo" aria-label="Undo" ${A.undo.length ? '' : 'disabled'}>${I.undo}</button>`;

/* ---------- desktop sidebar ---------- */
/* deferred-debit cards: bank accounts without an IBAN, in the same bank connection as an account with one */
function deferredCards() {
  const out = {};
  for (const c of A.plan.bank?.conns || []) {
    const main = c.accounts.filter(x => x.acct && x.iban && L.acct[x.acct] && !L.acct[x.acct].closed);
    const cards = c.accounts.filter(x => x.acct && !x.iban && L.acct[x.acct] && !L.acct[x.acct].closed && x.acct !== main[0]?.acct);
    if (main.length === 1 && cards.length) (out[main[0].acct] ||= []).push(...cards.map(x => x.acct));
  }
  return out;
}
function sidebar() {
  const p = A.plan, b = balances(); const linked = new Set((p.bank?.conns || []).flatMap(c => c.accounts.map(x => x.acct).filter(Boolean)));
  const sideNav = (v, l, icn, extra = '') => `<button class="snav ${A.view === v && (v !== 'accounts' || !A.acct) ? 'on' : ''}" data-a="nav" data-v="${v}" ${extra}>${icn}<span>${l}</span></button>`;
  let h = `<div class="side-head"><button class="side-plan" data-a="nav" data-v="settings"><span class="logo" aria-hidden="true">${I.plan}</span><span class="grow"><strong class="ellip" style="display:block">${esc(p.name)}</strong><span class="small muted syncState">${syncLabel()}</span></span></button></div>
    <nav class="side-nav">${sideNav('plan', 'Plan', I.plan)}${sideNav('reflect', 'Reflect', I.reflect)}${sideNav('tx', 'All Accounts', I.bank)}${sideNav('settings', 'Settings', I.gear)}</nav>`;
  for (const [key, label, fn] of SECTIONS) {
    const list = p.accounts.filter(a => !a.closed && fn(a)); if (!list.length) continue;
    const col = !!A.ui.collapsed['s_' + key];
    const tot = list.reduce((s, a) => s + b[a.id].working, 0);
    h += `<div class="side-sec"><button class="side-sec-h" data-a="collapse" data-g="s_${key}" aria-expanded="${!col}"><span class="chev ${col ? 'shut' : ''}">${I.down}</span><span class="grow">${label}</span><span class="num">${fmt(tot)}</span></button>`;
    if (!col) for (const a of list) { h += `<button class="side-acct ${A.acct === a.id ? 'on' : ''}" data-a="openAcctNav" data-id="${a.id}" draggable="true" data-drag="${a.id}" title="Drag to reorder"><span class="grow ellip">${esc(a.name)}</span>${linked.has(a.id) ? `<span class="linked" title="Connected to your bank" aria-label="Connected to your bank">${I.link}</span>` : ''}<span class="num ${b[a.id].working < 0 ? 'amt-bad' : ''}">${fmt(b[a.id].working)}</span></button>`;
      const dc = deferredCards()[a.id]; if (dc) { const after = b[a.id].working + dc.reduce((x, id) => x + (b[id]?.working || 0), 0); h += `<div class="side-after" title="Balance once the deferred card is debited"><span class="grow ellip">after card</span><span class="num ${after < 0 ? 'amt-bad' : ''}">${fmt(after)}</span></div>`; } }
    h += `</div>`;
  }
  const closed = p.accounts.filter(a => a.closed);
  if (closed.length) {
    const col = A.ui.collapsed.s_closed !== false;
    h += `<div class="side-sec"><button class="side-sec-h" data-a="collapseClosed" aria-expanded="${!col}"><span class="chev ${col ? 'shut' : ''}">${I.down}</span><span class="grow">Closed</span></button>`;
    if (!col) for (const a of closed) h += `<button class="side-acct muted ${A.acct === a.id ? 'on' : ''}" data-a="openAcctNav" data-id="${a.id}"><span class="grow ellip">${esc(a.name)}</span><span class="num">${fmt(b[a.id].working)}</span></button>`;
    h += `</div>`;
  }
  h += `<div class="side-foot"><span class="small muted" style="padding:0 6px">Drag accounts to reorder them.</span><button class="btn sm block" data-a="acctNew">${I.plus} Add Account</button><button class="btn sm block" data-a="importSheet">${I.upload} File Import</button></div>`;
  return h;
}

/* ---------- onboarding ---------- */
function viewOnboarding() {
  return `<div class="wrap hero">
    <h1>Budget</h1>
    <p>Give every euro a job. Assign the money you actually have, category by category, and always know what you can spend.</p>
    <div class="card" style="padding:16px; display:flex; flex-direction:column; gap:10px">
      <strong>Already using this app on another device?</strong>
      <span class="small muted">Sign in with the Google account that holds your budget to get it back here.</span>
      <button class="btn pri block" data-a="gdLogin">${I.sync} Restore from Google Drive</button>
      <div class="row"><input id="pairIn" class="in grow" placeholder="Or paste a pairing code" autocomplete="off" spellcheck="false"><button class="btn" data-a="pairUse">Restore</button></div>
      ${A.ui.restoreMsg ? `<div class="banner warn">${I.info}<span>${esc(A.ui.restoreMsg)}</span></div>` : (gdOn() ? `<div class="small muted"><span class="syncState">${syncLabel()}</span>${GD.remoteInfo ? ' · Drive copy: ' + GD.remoteInfo.n + ' plan(s)' : ''}</div>` : '')}
    </div>
    <div class="sec-t"><span>Or start here</span></div>
    <button class="btn block" data-a="ynSheet">Import my YNAB plan</button>
    <div class="field"><label for="obName">Plan name</label><input id="obName" class="in" value="My Plan" autocomplete="off"></div>
    <button class="btn block" data-a="createPlan">Start a new plan</button>
    <button class="btn block" data-a="demoPlan">Explore a sample plan</button>
    <label class="btn ghost block" for="restoreFile">${I.upload} Restore a backup file</label>
    <input id="restoreFile" type="file" accept=".json,application/json" hidden data-c="restore">
  </div>`;
}

/* ---------- target text (YNAB wording) ---------- */
function dueLabel(c, m) { const t = c.target; if (!t) return ''; const d = t.type === 'yearly' ? dueMonth(t, m) : t.date; return d && ['yearly', 'date', 'balance'].includes(t.type) ? ' by ' + monthLabel(d) : ' this month'; }
function targetText(c, m, s) {
  const x = s.x, ti = s.ti;
  if (x.available < 0) return x.creditOver > 0 && !x.cashOver ? 'Overspent ' + fmt(x.creditOver) + ' on credit' : 'Overspent ' + fmt(-x.available);
  if (c.cc) { const bal = -(balances()[c.cc]?.working || 0); return bal > x.available ? fmt(bal - x.available) + ' more needed to pay balance' : 'Paid in full'; }
  if (!ti) { const spent = -Math.min(0, x.activity); return spent && x.available === 0 && x.assigned + x.carry > 0 ? 'Fully Spent' : ''; }
  if (ti.snoozed) return 'Snoozed';
  if (ti.under > 0) return fmt(ti.under) + ' more needed' + dueLabel(c, m);
  const spent = -Math.min(0, x.activity);
  if (spent > 0 && x.available === 0) return 'Fully Spent';
  if (spent > 0) return 'Funded. Spent ' + fmt(spent) + ' of ' + fmt(x.carry + x.assigned);
  return 'Funded';
}

/* ---------- PLAN ---------- */
function planStats(m) {
  let under = 0, cost = 0, overN = 0, overfunded = 0;
  for (const c of A.plan.cats) { if (c.hidden) continue; const s = catStatus(c, m); if (s.ti) { under += s.ti.under; cost += s.ti.need; } if (s.x.available < 0) overN++; }
  return { under, cost, overN };
}
function viewPlan() {
  const m = A.month, md = monthData(m), p = A.plan, desk = DESK();
  const rta = md.rta;
  const rtaCls = rta > 0 ? 'pos' : rta < 0 ? 'neg' : 'zero';
  const rtaLbl = rta > 0 ? 'Ready to Assign' : rta < 0 ? 'You assigned more than you have' : 'All Money Assigned';
  const st = planStats(m);
  const aom = ageOfMoney().at(m === curMonth() ? '9999-12-31' : addMonths(m, 1) + '-00');
  const unapproved = A.tx.filter(t => t.approved === false).length;
  const uncatN = A.tx.filter(t => onBudget(L.acct[t.acct]) && !t.transferAcct && !(t.splits && t.splits.length) && !t.cat).length;
  let h;
  if (desk) {
    h = `<div class="dhead wrap"><div class="row">
        <button class="ibtn round" data-a="month" data-d="-1" aria-label="Previous month">${I.left}</button>
        <div><h1 class="dmonth">${MSHORT[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}</h1><input class="mnote" value="${esc(p.notes?.[m] || '')}" placeholder="Enter a note…" data-mnote="${m}" aria-label="Month note"></div>
        <button class="ibtn round" data-a="month" data-d="1" aria-label="Next month">${I.right}</button></div>
      <button class="rta d ${rtaCls}" data-a="rtaSheet"><div><div class="amt num">${fmt(rta)}</div><div class="lbl">${rtaLbl}</div></div>
        ${rta !== 0 ? `<span class="cta" data-a="${rta > 0 ? 'assignSheet' : 'fixOver'}">${rta > 0 ? 'Assign' : 'Fix This'}</span>` : ''}</button>
      <span></span></div>`;
  } else {
    h = topBar(monthLabel(m, false, true), esc(p.name),
      `<button class="ibtn" data-a="month" data-d="-1" aria-label="Previous month">${I.left}</button>`,
      `<button class="ibtn" data-a="month" data-d="1" aria-label="Next month">${I.right}</button>`);
    h += `<div class="wrap"><button class="rta ${rtaCls}" data-a="rtaSheet">
      <div><div class="lbl">${rtaLbl}</div><div class="amt num">${fmt(rta)}</div></div>
      ${rta !== 0 ? `<span class="cta" data-a="${rta > 0 ? 'assignSheet' : 'fixOver'}">${rta > 0 ? 'Assign' : 'Fix This'}</span>` : `<span class="cta" data-a="assignSheet">Auto-Assign</span>`}
    </button>
    <div class="stats">
      <button class="stat" data-a="statInfo" data-k="aom"><span>Age of Money</span><b class="num">${aom == null ? '—' : aom + (aom === 1 ? ' day' : ' days')}</b></button>
      <button class="stat" data-a="statInfo" data-k="cost"><span>Cost to Be Me</span><b class="num">${fmt(st.cost)}</b></button>
      <button class="stat" data-a="filter" data-f="under"><span>Underfunded</span><b class="num">${fmt(st.under)}</b></button>
    </div></div>`;
  }
  h += `<div class="wrap">`;
  if (st.overN) h += `<div class="banner bad">${I.info}<span>${st.overN} ${st.overN > 1 ? 'categories are' : 'category is'} overspent</span><button class="btn sm danger" data-a="filter" data-f="over">Review</button></div>`;
  if (unapproved) h += `<div class="banner info">${I.info}<span>${unapproved} imported transaction${unapproved > 1 ? 's' : ''} to approve</span><button class="btn sm" data-a="openAll" data-f="unapproved">Review</button></div>`;
  if (uncatN) h += `<div class="banner warn">${I.info}<span>${uncatN} transaction${uncatN > 1 ? 's' : ''} need${uncatN > 1 ? '' : 's'} a category</span><button class="btn sm" data-a="autoCat">Auto</button><button class="btn sm" data-a="openAll" data-f="uncat">Categorize</button></div>`;
  if (md.prevCashOver > 0) h += `<div class="banner warn">${I.info}<span>Overspending from ${monthLabel(addMonths(m, -1))}: ${fmt(md.prevCashOver)} taken from Ready to Assign</span></div>`;
  const F = A.ui.filter;
  h += `<div class="chips" role="toolbar" aria-label="Filters">
    ${chip('all', 'All')}${chip('snoozed', 'Snoozed')}${chip('under', 'Underfunded')}${chip('overf', 'Overfunded')}${chip('avail', 'Money Available')}${F === 'over' ? chip('over', 'Overspent') : ''}</div>
    <div class="toolbar">
      <button class="tbtn" data-a="groupNew">${I.plus} Category Group</button>
      <button class="tbtn" data-a="undo" ${A.undo.length ? '' : 'disabled'}>${I.undo} Undo</button>
      <button class="tbtn" data-a="redo" ${A.redo.length ? '' : 'disabled'}>${I.redo} Redo</button>
      <button class="tbtn" data-a="moves">${I.swap} Recent Moves</button>
      <button class="tbtn ${A.ui.edit ? 'on' : ''}" data-a="toggleEdit">${I.edit} ${A.ui.edit ? 'Done' : 'Edit'}</button>
      <span style="flex:1"></span>
      <span class="viewsw" role="group" aria-label="Row size"><button class="${A.ui.compact ? '' : 'on'}" data-a="setCompact" data-v="0" aria-label="Expanded rows with progress bars">${ico('<rect x="4" y="5" width="16" height="6" rx="1.5"/><rect x="4" y="13" width="16" height="6" rx="1.5"/>')}</button><button class="${A.ui.compact ? 'on' : ''}" data-a="setCompact" data-v="1" aria-label="Compact rows">${ico('<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>')}</button></span>
    </div>`;
  h += `<div class="colhead"><span class="c-name">Category</span><span class="w-ass">Assigned</span><span class="w-act hide-s">Activity</span><span class="w-av">Available</span></div>`;
  const groups = p.groups.filter(g => g.sys !== 'cc' || p.cats.some(c => c.gid === g.id && !c.hidden));
  let shown = 0;
  for (const g of groups) {
    if (g.hidden && !A.ui.edit) continue;
    let cats = p.cats.filter(c => c.gid === g.id && (!c.hidden || A.ui.edit && A.ui.showHidden));
    if (F !== 'all') cats = cats.filter(c => { const s = catStatus(c, m); return F === 'under' ? s.ti && s.ti.under > 0 : F === 'over' ? s.x.available < 0 : F === 'avail' ? s.x.available > 0 : F === 'snoozed' ? s.ti && s.ti.snoozed : F === 'overf' ? s.ti && !s.ti.snoozed && s.x.available > s.ti.total && s.ti.total > 0 : true; });
    if (!cats.length && (F !== 'all' || (!A.ui.edit && g.sys))) continue;
    const col = !!A.ui.collapsed[g.id] && F === 'all';
    let ga = 0, gact = 0, gav = 0; for (const c of cats) { const x = catM(m, c.id); ga += x.assigned; gact += x.activity; gav += x.available; }
    h += `<section class="group" aria-label="${esc(g.name)}">
      <div class="ghead ${col ? 'collapsed' : ''}">
        <button class="gname" data-a="collapse" data-g="${g.id}" aria-expanded="${!col}">${I.down}<span style="text-align:left; line-height:1.2">${esc(g.name)}${g.hidden ? ' (hidden)' : ''}</span></button>${!g.sys && !A.ui.edit ? `<button class="gadd" data-a="catNew" data-g="${g.id}" aria-label="Add a category to ${esc(g.name)}">${I.plus}</button>` : ''}<span style="flex:1"></span>
        ${A.ui.edit && !g.sys ? `<div class="editrow">
          <button class="ibtn" data-a="gMove" data-g="${g.id}" data-d="-1" aria-label="Move group up">${I.up}</button>
          <button class="ibtn" data-a="gMove" data-g="${g.id}" data-d="1" aria-label="Move group down">${I.down}</button>
          <button class="ibtn" data-a="catNew" data-g="${g.id}" aria-label="Add category">${I.plus}</button>
          <button class="ibtn" data-a="gEdit" data-g="${g.id}" aria-label="Edit group">${I.edit}</button></div>`
        : `<span class="gsum num w-ass">${fmt(ga)}</span><span class="gsum num w-act hide-s">${fmt(gact)}</span><span class="gsum num w-av">${fmt(gav)}</span>`}
      </div>`;
    if (!col) for (const c of cats) { h += catRow(c, m); shown++; }
    h += `</section>`;
  }
  if (F !== 'all' && !shown) h += `<div class="empty"><strong>No categories match this filter</strong><button class="btn sm" data-a="filter" data-f="all">Show all</button></div>`;
  if (A.ui.edit) {
    const hid = p.cats.filter(c => c.hidden).length;
    if (hid) h += `<div class="row" style="margin-top:14px"><button class="btn" data-a="toggleHidden">${A.ui.showHidden ? I.eyeoff : I.eye} ${A.ui.showHidden ? 'Hide' : 'Show'} hidden categories (${hid})</button></div>`;
  }
  if (!p.accounts.length) h += `<div class="banner info" style="margin-top:16px">${I.info}<span>Start by adding your checking account with today's balance.</span><button class="btn sm pri" data-a="acctNew">Add Account</button></div>`;
  h += `<p class="kbd-hint" style="margin-top:14px">Tip: in Assigned, type <b>+50</b> to add 50 or <b>120/3</b> to do the math.</p></div>`;
  return h;
}
const chip = (f, l) => `<button class="chip ${A.ui.filter === f ? 'on' : ''}" data-a="filter" data-f="${f}">${l}</button>`;
function catRow(c, m) {
  const s = catStatus(c, m), x = s.x, ti = s.ti;
  const barCls = s.cls === 'bad' || s.cls === 'credit' ? 'bad' : s.cls === 'warn' ? 'warn' : '';
  const note = targetText(c, m, s);
  const pillIcon = s.cls === 'good' && ti ? '✓ ' : s.cls === 'warn' ? '! ' : '';
  return `<div class="cat ${c.hidden ? 'muted' : ''}">
    <button class="cname" data-a="catSheet" data-c="${c.id}">
      <span class="ctop"><span class="t">${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}${c.hidden ? ' (hidden)' : ''}</span>${note ? `<span class="note">${esc(note)}</span>` : ''}</span>
      ${ti && ti.total > 0 ? `<span class="bar ${barCls}"><i style="width:${Math.round(ti.pct * 100)}%"></i></span>` : ''}
    </button>
    ${A.ui.edit && !c.cc ? `<div class="editrow">
      <button class="ibtn" data-a="cMove" data-c="${c.id}" data-d="-1" aria-label="Move up">${I.up}</button>
      <button class="ibtn" data-a="cMove" data-c="${c.id}" data-d="1" aria-label="Move down">${I.down}</button>
      <button class="ibtn" data-a="cHide" data-c="${c.id}" aria-label="${c.hidden ? 'Unhide' : 'Hide'}">${c.hidden ? I.eye : I.eyeoff}</button></div>` : `
    <input class="ass-in w-ass" inputmode="decimal" enterkeyhint="done" aria-label="Assigned to ${esc(c.name)}" data-assign="${c.id}" value="${fmtIn(x.assigned)}">
    <span class="w-act hide-s num muted act">${fmt(x.activity)}</span>
    <span class="w-av"><button class="pill ${s.cls}" data-a="pillTap" data-c="${c.id}">${pillIcon}${fmt(x.available)}</button></span>`}
  </div>`;
}
function inspector() {
  const m = A.month, md = monthData(m), st = planStats(m), mn = MONTHS[+m.slice(5, 7) - 1];
  const prevLeft = md.rtaBase - md.income + md.assigned + md.prevCashOver;
  const income = A.plan.expectedIncome || 0;
  const opts = autoOptions(m, A.plan.cats.filter(c => !c.hidden));
  const aom = ageOfMoney().at(m === curMonth() ? '9999-12-31' : addMonths(m, 1) + '-00');
  const pct = income ? Math.min(100, Math.round(st.cost / income * 100)) : 0;
  return `<div class="ipanel"><h3>${cap(mn)}'s Summary</h3>
      <div class="irow"><span>Left Over from Last Month</span><b class="num">${fmt(prevLeft)}</b></div>
      <div class="irow"><span>Assigned in ${cap(mn)}</span><b class="num">${fmt(md.assigned)}</b></div>
      <div class="irow"><span>Activity</span><b class="num">${fmt(md.activity)}</b></div>
      <div class="irow big"><span>Available</span><b class="num">${fmt(md.available)}</b></div>
      <div class="irow"><span>Age of Money</span><b class="num">${aom == null ? '—' : aom + (aom === 1 ? ' day' : ' days')}</b></div></div>
    <div class="ipanel"><h3>Cost to Be Me</h3>
      <div class="irow"><span>${cap(mn)}'s Targets</span><b class="num">${fmt(st.cost)}</b></div>
      <div class="bar ${income && st.cost > income ? 'bad' : ''}" style="margin-top:6px"><i style="width:${income ? pct : 0}%"></i></div>
      ${(() => { const nm = addMonths(m, 1); let nc = 0; for (const c of A.plan.cats) { if (c.hidden) continue; const ti = targetInfo(c, nm); if (ti) nc += ti.need; } return nc > st.cost ? `<div class="hint-box">Next month's targets could increase your total to ${fmt(nc)}</div>` : ''; })()}
      <div class="irow" style="margin-top:8px"><label for="expInc">Expected Income</label><input id="expInc" class="mini num" inputmode="decimal" value="${income ? fmtIn(income) : ''}" placeholder="0,00" data-set="expectedIncome"></div></div>
    <div class="ipanel"><h3>${I.wand} Auto-Assign</h3>
      ${opts.map(o => `<button class="aa" data-a="autoApply" data-k="${o.k}" ${o.changes.length ? '' : 'disabled'}><span>${o.l}</span><b class="num">${fmt(Math.abs(o.delta))}</b></button>`).join('')}</div>`;
}

/* ---------- ACCOUNTS (mobile list) ---------- */
function viewAccounts() {
  const p = A.plan, b = balances();
  let net = 0; for (const a of p.accounts) if (!a.closed) net += b[a.id].working;
  let h = topBar('Accounts', 'Net Worth ' + fmt(net), undoBtns(), `<button class="ibtn" data-a="acctNew" aria-label="Add Account">${I.plus}</button>`);
  const ro = A.ui.reorder;
  h += `<div class="wrap">`;
  if (!p.accounts.length) return h + `<div class="empty"><strong>No accounts yet</strong><span>Add your checking account with the balance your bank shows today.</span><button class="btn pri" data-a="acctNew">${I.plus} Add Account</button></div></div>`;
  for (const [key, lbl, fn] of SECTIONS) {
    const list = p.accounts.filter(a => fn(a) && !a.closed); if (!list.length) continue;
    const tot = list.reduce((s, a) => s + b[a.id].working, 0);
    h += `<div class="sec-t"><span>${lbl}</span><span class="num">${fmt(tot)}</span></div><div class="card">`;
    for (const a of list) {
      const x = b[a.id]; const unap = A.tx.filter(t => t.acct === a.id && t.approved === false).length;
      if (ro) { h += `<div class="li"><span class="ic">${acctIcon(a)}</span><span class="grow"><strong class="ellip" style="display:block">${esc(a.name)}</strong></span><button class="ibtn" data-a="aMove" data-id="${a.id}" data-d="-1" aria-label="Move up">${I.up}</button><button class="ibtn" data-a="aMove" data-id="${a.id}" data-d="1" aria-label="Move down">${I.down}</button></div>`; continue; }
      h += `<button class="li" data-a="openAcct" data-id="${a.id}"><span class="ic">${acctIcon(a)}</span>
        <span class="grow"><strong class="ellip" style="display:block">${esc(a.name)}</strong><span class="small muted">${ACCT[a.type].label}${unap ? ` · <b style="color:var(--info)">${unap} to approve</b>` : ''}${a.lastRec ? ' · reconciled ' + fmtDate(a.lastRec) : ''}</span></span>
        <strong class="num ${x.working < 0 ? 'amt-bad' : ''}">${fmt(x.working)}</strong></button>`;
    }
    h += `</div>`;
  }
  const closed = p.accounts.filter(a => a.closed);
  if (closed.length) {
    const col = A.ui.collapsed.s_closed !== false;
    h += `<div class="sec-t"><button class="side-sec-h" style="padding:0" data-a="collapseClosed" aria-expanded="${!col}"><span class="chev ${col ? 'shut' : ''}">${I.down}</span><span>Closed (${closed.length})</span></button></div>`;
    if (!col) h += `<div class="card">${closed.map(a => `<button class="li" data-a="openAcct" data-id="${a.id}"><span class="ic">${acctIcon(a)}</span><span class="grow muted">${esc(a.name)}</span><span class="num muted">${fmt(b[a.id].working)}</span></button>`).join('')}</div>`;
  }
  h += `<div class="row" style="margin-top:16px; flex-wrap:wrap"><button class="btn ${ro ? 'pri' : ''}" data-a="toggleReorder">${I.swap} ${ro ? 'Done' : 'Reorder Accounts'}</button><button class="btn" data-a="acctNew">${I.plus} Add Account</button><button class="btn" data-a="importSheet">${I.upload} File Import</button></div></div>`;
  return h;
}

/* ---------- REGISTER ---------- */
function regList() {
  const id = A.acct; const f = A.ui.regFilter; const q = A.ui.search.trim().toLowerCase();
  let list = id === 'all' ? A.tx.filter(t => L.acct[t.acct]) : A.tx.filter(t => t.acct === id);
  if (f === 'unapproved') list = list.filter(t => t.approved === false);
  else if (f === 'uncleared') list = list.filter(t => t.cleared === 'u');
  else if (f === 'cleared') list = list.filter(t => t.cleared !== 'u');
  else if (f === 'flagged') list = list.filter(t => t.flag);
  else if (f === 'uncat') list = list.filter(t => onBudget(L.acct[t.acct]) && !t.transferAcct && !(t.splits && t.splits.length) && !t.cat);
  if (q) list = list.filter(t => [payeeName(t), t.memo, catName(t.cat), ...(t.splits || []).map(s => catName(s.cat) + ' ' + (s.memo || '')), fmtIn(Math.abs(t.amount)), L.acct[t.acct]?.name].join(' ').toLowerCase().includes(q));
  return list.sort((a, b) => a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1);
}
function txCatLabel(t) {
  const a = L.acct[t.acct];
  if (t.splits && t.splits.length) return 'Split (Multiple Categories)';
  if (t.cat === '__start') return 'Starting Balance';
  if (t.cat) return catName(t.cat);
  if (t.transferAcct) return onBudget(a) && onBudget(L.acct[t.transferAcct]) ? '' : '';
  if (onBudget(a)) return 'Category Needed';
  return '';
}
/* card purchases imported in the deferred card account that were also typed by hand in the current account */
function cardDups(acctId) {
  const dc = deferredCards(); let main = null, cards = [];
  for (const [m, cs] of Object.entries(dc)) if (m === acctId || cs.includes(acctId)) { main = m; cards = cs; }
  if (!main) return [];
  const cardTx = A.tx.filter(t => cards.includes(t.acct) && t.importId && t.amount < 0).sort((a, b) => a.date < b.date ? -1 : 1);
  if (!cardTx.length) return [];
  const start = addDays(cardTx[0].date, -7), used = new Set(), out = [];
  const manual = A.tx.filter(t => t.acct === main && !t.importId && !t.transferAcct && t.amount < 0 && t.date >= start && t.cleared !== 'r');
  for (const c of cardTx) { const m = manual.find(t => !used.has(t.id) && t.amount === c.amount && Math.abs(daysBetween(t.date, c.date)) <= 7); if (m) { used.add(m.id); out.push({ card: c, main: m }); } }
  return out;
}
function dupReviewSheet(id) {
  const d = cardDups(id); if (!d.length) return;
  const row = t => `${esc(fmtDate ? fmtDate(t.date) : t.date)} · ${esc(payeeName(t) || '—')}`;
  openSheet('Duplicates', `<p class="small muted" style="margin:0">These purchases are in your card account (from the bank) and were also typed by hand in ${esc(L.acct[d[0].main.acct].name)}. Remove the hand-typed copies so they are not counted twice. Their category is kept on the card purchase.</p>
    <div class="card">${d.map(x => `<div class="li"><span class="grow"><strong>${row(x.main)}</strong><div class="small muted">Card: ${row(x.card)}</div></span><span class="num">${fmt(x.main.amount)}</span></div>`).join('')}</div>`,
    `<button class="btn pri block" data-a="dupRemove" data-id="${id}">Remove ${d.length} hand-typed cop${d.length > 1 ? 'ies' : 'y'}</button>`);
}
/* compare with the balance the bank reports (linked accounts only) */
function bankAcctOf(acctId) { for (const c of A.plan.bank?.conns || []) for (const x of c.accounts) if (x.acct === acctId) return x; return null; }
function bankBalLine(acctId, bal) {
  const x = bankAcctOf(acctId); if (!x) return '';
  const c = (A.ui.bankBal ||= {})[acctId];
  if (!c || Date.now() - c.at > 5 * 60000) { if (!c?.busy) { A.ui.bankBal[acctId] = { ...(c || {}), busy: true, at: c?.at || 0 }; bk('balances', { uid: x.uid }).then(r => { const list = (r.balances || []).map(b => ({ v: Math.round(parseFloat(b.balance_amount.amount) * 100), type: b.balance_type || '' })); A.ui.bankBal[acctId] = { list, at: Date.now() }; if (A.acct === acctId) render(); }).catch(e => { A.ui.bankBal[acctId] = { err: e.message, at: Date.now() }; if (A.acct === acctId) render(); }); } }
  if (!c || !c.list) return c?.err ? `<div class="small muted" style="padding:6px 2px">Bank balance unavailable: ${esc(c.err)}</div>` : `<div class="small muted" style="padding:6px 2px">Checking the bank balance…</div>`;
  const pick = c.list.find(b => /CLBD|ITBD|CLAV|ITAV/.test(b.type)) || c.list[0]; if (!pick) return '';
  const diffW = bal.working - pick.v, diffC = bal.cleared - pick.v;
  const ok = !diffW || !diffC;
  return `<div class="banner ${ok ? '' : 'warn'}" style="margin-top:8px">${I.bank}<span>Bank balance <strong class="num">${fmt(pick.v)}</strong>${ok ? ' · matches ✓' : ` · here <strong class="num">${fmt(bal.working)}</strong> · difference <strong class="num">${fmt(diffW)}</strong>`}</span>${ok ? '' : `<button class="btn sm" data-a="diffSheet" data-id="${acctId}" data-v="${pick.v}">Find it</button>`}</div>`;
}
function diffSheet(acctId, bankV) {
  const a = L.acct[acctId], b = balances()[acctId];
  const imp = A.tx.filter(t => t.acct === acctId && t.importId && /^ebp?:/.test(t.importId)).map(t => t.date).sort();
  const since = imp.length ? addDays(imp[0], -3) : addDays(todayISO(), -60);
  const hand = A.tx.filter(t => t.acct === acctId && !t.importId && t.date >= since && L.payee[t.payee]?.name !== 'Starting Balance').sort((x, y) => x.date < y.date ? 1 : -1);
  const sumHand = hand.reduce((s, t) => s + t.amount, 0);
  const pend = A.tx.filter(t => t.acct === acctId && t.pend); const sumPend = pend.reduce((s, t) => s + t.amount, 0);
  const row = t => `<div class="li"><span class="grow"><strong>${esc(payeeName(t) || '—')}</strong><div class="small muted">${esc(fmtDate(t.date))}${t.transferAcct ? ' · transfer' : ''}${t.cat ? ' · ' + esc(catName(t.cat)) : ''}</div></span><span class="num">${fmt(t.amount)}</span></div>`;
  openSheet('Find the difference', `<p class="small muted" style="margin:0">Here ${fmt(b.working)} · bank ${fmt(bankV)} · difference <strong>${fmt(b.working - bankV)}</strong>.</p>
    <div class="sec-t"><span>Typed by hand since the bank link (${fmt(sumHand)})</span></div>
    <p class="small muted" style="margin:0">The bank never sent these. If one is not on your bank statement (already counted elsewhere, or a duplicate), delete it.</p>
    <div class="card">${hand.map(row).join('') || '<div class="li muted">None</div>'}</div>
    ${pend.length ? `<div class="sec-t"><span>Pending at the bank (${fmt(sumPend)})</span></div><p class="small muted" style="margin:0">Payments the bank has not booked yet; some banks leave them out of the balance.</p><div class="card">${pend.map(row).join('')}</div>` : ''}`, '');
}
function viewRegister() {
  const id = A.acct, all = id === 'all', a = all ? null : L.acct[id], desk = DESK();
  if (!all && !a) { A.acct = null; return viewAccounts(); }
  const b = balances();
  const bal = all ? Object.entries(b).filter(([k]) => onBudget(L.acct[k])).map(([, v]) => v).reduce((s, x) => ({ cleared: s.cleared + x.cleared, uncleared: s.uncleared + x.uncleared, working: s.working + x.working }), { cleared: 0, uncleared: 0, working: 0 }) : b[id];
  let h = topBar(all ? 'All Accounts' : esc(a.name), all ? 'Budget accounts' : ACCT[a.type].label,
    A.view === 'tx' || desk ? undoBtns() : `<button class="ibtn" data-a="backAccts" aria-label="Back to accounts">${I.left}</button>`,
    all ? `<button class="ibtn" data-a="importSheet" aria-label="File Import">${I.upload}</button>` : `<button class="ibtn" data-a="acctEdit" data-id="${id}" aria-label="Edit account">${I.edit}</button>`);
  h += `<div class="wrap">`;
  const bk0 = all ? null : bankBalLine(id, bal);
  h += `<div class="balbar"><div><span class="num">${fmt(bal.cleared)}</span><small>Cleared Balance</small></div><span class="op">+</span><div><span class="num">${fmt(bal.uncleared)}</span><small>Uncleared Balance</small></div><span class="op">=</span><div><span class="num strong">${fmt(bal.working)}</span><small>Working Balance</small></div></div>${bk0 || ''}`;
  const dups = all ? [] : cardDups(id);
  if (dups.length) h += `<div class="banner warn">${I.info}<span>${dups.length} card purchase${dups.length > 1 ? 's are' : ' is'} also entered by hand in ${esc(L.acct[dups[0].main.acct].name)}</span><button class="btn sm" data-a="dupReview" data-id="${id}">Review</button></div>`;
  h += `<div class="toolbar">
    ${desk ? `<button class="tbtn" data-a="newTx">${I.plus} Add Transaction</button>` : ''}
    ${!all ? `<button class="tbtn" data-a="reconcile" data-id="${id}">${I.lock} Reconcile</button>` : ''}
    <button class="tbtn" data-a="importSheet" data-id="${all ? '' : id}">${I.upload} File Import</button>
    ${!all && isDebt(a) ? `<button class="tbtn" data-a="loanPlanner" data-id="${id}">${I.target} Loan Planner</button>` : ''}
    ${!all && isCredit(a) ? `<button class="tbtn" data-a="ccPay" data-id="${id}">${I.swap} Record Payment</button>` : ''}
    <button class="tbtn ${A.ui.select ? 'on' : ''}" data-a="toggleSelect">${I.sel} ${A.ui.select ? 'Done' : 'Select'}</button>
  </div>`;
  h += `<input id="regSearch" class="in" type="search" placeholder="Search payee, category, memo, amount…" value="${esc(A.ui.search)}" data-i="search" aria-label="Search transactions" style="margin-top:8px">`;
  const rf = (f, l) => `<button class="chip ${A.ui.regFilter === f ? 'on' : ''}" data-a="regFilter" data-f="${f}">${l}</button>`;
  h += `<div class="chips">${rf('all', 'All')}${rf('unapproved', 'Unapproved')}${rf('uncat', 'Category Needed')}${rf('uncleared', 'Uncleared')}${rf('cleared', 'Cleared')}${rf('flagged', 'Flagged')}</div>`;
  const sch = A.plan.scheduled.filter(s => all || s.acct === id || s.transferAcct === id).sort((x, y) => x.next < y.next ? -1 : 1);
  if (sch.length && A.ui.regFilter === 'all' && !A.ui.search) {
    h += `<div class="day">Scheduled</div><div class="card">`;
    for (const s of sch.slice(0, 8)) h += `<div class="tx"><span style="width:30px;color:var(--muted)">${I.repeat}</span>
      <button class="main-b" data-a="schEdit" data-id="${s.id}"><span class="p ellip">${esc(s.transferAcct ? 'Transfer : ' + (L.acct[s.transferAcct]?.name || '') : s.payee)}</span><span class="c">${fmtDate(s.next)} · ${FREQ[s.freq]}${s.cat ? ' · ' + esc(catName(s.cat)) : ''}</span></button>
      <span class="a num ${s.amount > 0 ? 'amt-pos' : ''}">${fmt(s.amount)}</span>
      <button class="btn sm" data-a="schNow" data-id="${s.id}">Enter Now</button></div>`;
    h += `</div>`;
  }
  const list = regList();
  if (!list.length) {
    h += `<div class="empty"><strong>${A.ui.search || A.ui.regFilter !== 'all' ? 'No matching transactions' : 'No transactions yet'}</strong>${!A.ui.search && A.ui.regFilter === 'all' ? `<span>Add a transaction or import a bank file.</span>` : ''}</div>`;
  } else {
    const run = {};
    if (!all) { let r = 0; const asc = A.tx.filter(t => t.acct === id).sort((x, y) => x.date === y.date ? (x.id < y.id ? -1 : 1) : x.date < y.date ? -1 : 1); for (const t of asc) { r += t.amount; run[t.id] = r; } }
    const lim = A.ui.regLimit || 150;
    if (desk) {
      h += `<div class="rtable-wrap"><table class="rtable"><thead><tr>${A.ui.select ? '<th></th>' : ''}<th></th>${all ? '<th>Account</th>' : ''}<th>Date</th><th>Payee</th><th>Category</th><th>Memo</th><th class="r">Outflow</th><th class="r">Inflow</th>${!all ? '<th class="r">Balance</th>' : ''}<th></th></tr></thead><tbody>`;
      for (const t of list.slice(0, lim)) h += txTr(t, all, run[t.id]);
      h += `</tbody></table></div>`;
    } else {
      let day = '';
      for (const t of list.slice(0, lim)) {
        if (t.date !== day) { if (day) h += `</div>`; day = t.date; h += `<div class="day">${dayLabel(t.date)}</div><div class="card">`; }
        h += txRow(t, all, run[t.id]);
      }
      h += `</div>`;
    }
    if (list.length > lim) h += `<div style="text-align:center; margin-top:12px"><button class="btn" data-a="more">Show more (${list.length - lim})</button></div>`;
  }
  return h + `</div>`;
}
function clrBtn(t) {
  return t.approved === false ? `<button class="btn sm pri" data-a="approve" data-id="${t.id}">Approve</button>` :
    `<button class="clr ${t.cleared}" data-a="clr" data-id="${t.id}" aria-label="${t.cleared === 'u' ? 'Uncleared' : t.cleared === 'c' ? 'Cleared' : 'Reconciled'}">${t.cleared === 'r' ? I.lock : '<span>C</span>'}</button>`;
}
function txTr(t, all, runBal) {
  const cl = txCatLabel(t); const need = cl === 'Category Needed';
  return `<tr class="${t.approved === false ? 'unapproved' : ''}">
    ${A.ui.select ? `<td><input type="checkbox" class="chk" data-c="selTx" data-id="${t.id}" ${A.ui.selected.has(t.id) ? 'checked' : ''} aria-label="Select"></td>` : ''}
    <td style="width:10px">${t.flag ? `<span class="flag" style="background:var(--flag-${t.flag})"></span>` : ''}</td>
    ${all ? `<td class="ellip" style="max-width:150px">${esc(L.acct[t.acct]?.name || '')}</td>` : ''}
    <td class="num">${fmtDate(t.date)}</td>
    <td><button class="cellbtn" data-a="txEdit" data-id="${t.id}">${esc(payeeName(t) || '—')}</button></td>
    <td class="${need ? 'todo' : ''}">${esc(cl)}</td>
    <td class="muted ellip" style="max-width:200px">${esc(t.memo || '')}</td>
    <td class="r num">${t.amount < 0 ? fmt(-t.amount) : ''}</td>
    <td class="r num amt-pos">${t.amount > 0 ? fmt(t.amount) : ''}</td>
    ${runBal != null ? `<td class="r num muted">${fmt(runBal)}</td>` : ''}
    <td class="r">${clrBtn(t)}</td></tr>`;
}
function txRow(t, showAcct, runBal) {
  let c = txCatLabel(t); const todo = c === 'Category Needed';
  if (showAcct) c = (L.acct[t.acct]?.name || '') + (c ? ' · ' + c : '');
  if (t.memo) c += (c ? ' · ' : '') + t.memo;
  return `<div class="tx ${t.approved === false ? 'unapproved' : ''}">
    ${A.ui.select ? `<input type="checkbox" class="chk" data-c="selTx" data-id="${t.id}" ${A.ui.selected.has(t.id) ? 'checked' : ''} aria-label="Select">` : ''}
    ${t.flag ? `<span class="flag" style="background:var(--flag-${t.flag})"></span>` : ''}
    <button class="main-b" data-a="txEdit" data-id="${t.id}"><span class="p ellip">${esc(payeeName(t) || 'No payee')}</span><span class="c ellip ${todo ? 'todo' : ''}">${esc(c)}</span></button>
    <div><div class="a ${t.amount > 0 ? 'amt-pos' : ''}">${t.amount > 0 ? '+' : ''}${fmt(t.amount)}</div>${runBal != null ? `<div class="rb num">${fmt(runBal)}</div>` : ''}</div>
    ${clrBtn(t)}</div>`;
}
function actionBar() {
  const n = A.ui.selected.size;
  return `<div role="toolbar" aria-label="Bulk actions"><span style="padding:0 8px; font-weight:800; white-space:nowrap">${n} selected</span>
    <button data-a="bulk" data-k="cat">Categorize</button><button data-a="bulk" data-k="approve">Approve</button><button data-a="bulk" data-k="clear">Clear</button>
    <button data-a="bulk" data-k="flag">Flag</button><button data-a="bulk" data-k="date">Date</button><button data-a="bulk" data-k="del">Delete</button><button data-a="bulk" data-k="none" aria-label="Deselect all">${I.close.replace('<svg', '<svg width="18" height="18"')}</button></div>`;
}
