/* ================= Budget — UI: shell, plan, accounts, register ================= */
const ico = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const I = {
  home: ico('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'), dots: ico('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'), pin: ico('<path d="M12 17v5"/><path d="M8 3h8l-1 6 3 4H6l3-4z"/>'),
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
  if (A.view === 'home') { if (DESK()) A.view = 'plan'; else html = viewHome(); }
  if (A.view === 'plan') html = viewPlan();
  else if (A.view === 'accounts') html = A.acct ? viewRegister() : viewAccounts();
  else if (A.view === 'tx') { A.acct = 'all'; html = viewRegister(); }
  else if (A.view === 'reflect') html = viewReflect();
  else if (A.view === 'settings') html = viewSettings();
  const y = window.scrollY; const mainY = $('.main')?.scrollTop || 0;
  const insp = A.view === 'plan' && DESK() && !A.ui.inspHide ? `<aside class="insp" aria-label="Month summary">${inspector()}</aside>` : '';
  app.innerHTML = `<div class="shell ${insp ? 'with-insp' : ''} ${A.ui.compact ? 'compact' : ''} ${A.ui.sideHide && DESK() ? 'noside' : ''}">${DESK() && !A.ui.sideHide ? `<aside class="side" aria-label="Navigation">${sidebar()}</aside>` : ''}${DESK() && A.ui.sideHide ? `<button class="side-open" data-a="sideToggle" title="Show sidebar (shift .)" aria-label="Show sidebar">${I.right}</button>` : ''}<div class="main">${html}</div>${insp}</div>`;
  animateRender();
  if (render._keepScroll) { window.scrollTo(0, y); const mn = $('.main'); if (mn) mn.scrollTop = mainY; } render._keepScroll = false;
  $('#nav').innerHTML = DESK() ? '' : `<div>
    ${navBtn('home', 'Home', I.home, homeBadge())}${navBtn('plan', 'Plan', I.plan)}${navBtn('tx', 'Spending', I.cash)}${navBtn('accounts', 'Accounts', I.accts)}${navBtn('reflect', 'Reflect', I.reflect)}
  </div>`;
  const showFab = !DESK() && (A.view === 'home' || A.view === 'plan' || A.view === 'accounts' || A.view === 'tx') && !A.ui.select && A.plan.accounts.some(a => !a.closed);
  $('#fab').hidden = !showFab;
  if (selOn() && A.ui.selected.size) $('#actionbar').innerHTML = actionBar(); else $('#actionbar').innerHTML = '';
}
/* YNAB-style entrance animations: screen content rises in on navigation, new transactions slide up from the bottom */
function animateRender() {
  const key = A.view + '|' + (A.acct || '');
  const seen = animateRender.seen;
  const all = new Set(A.tx.map(t => t.id));
  if (seen && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (animateRender.key !== key) {
      const kids = [...($('.main')?.children || [])].filter(el => !el.matches('.top,.dhead,.colhead')).slice(0, 12);
      kids.forEach((el, i) => { el.style.animationDelay = Math.min(i * 35, 280) + 'ms'; el.classList.add('anim-in'); });
    } else {
      const fresh = [...document.querySelectorAll('.main [data-tid]')].filter(el => !seen.has(el.dataset.tid)).slice(0, 15);
      fresh.forEach((el, i) => { el.style.animationDelay = (i * 45) + 'ms'; el.classList.add('tx-in'); });
    }
  }
  animateRender.seen = all; animateRender.key = key;
}
const navBtn = (v, l, icn, badge = 0) => `<button data-a="nav" data-v="${v}" class="${A.view === v || (v === 'home' && A.view === 'settings') ? 'on' : ''}" aria-current="${A.view === v ? 'page' : 'false'}">${icn}${badge ? `<i class="nbadge">${badge > 99 ? '99+' : badge}</i>` : ''}<span>${l}</span></button>`;
const homeBadge = () => A.tx.filter(t => t.approved === false && L.acct[t.acct] && !L.acct[t.acct].closed).length;
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
  let h = `<div class="side-head"><button class="side-plan" data-a="planMenu" aria-haspopup="menu"><span class="logo" aria-hidden="true">${I.plan}</span><span class="grow"><strong class="ellip" style="display:block">${esc(p.name)}</strong><span class="small muted syncState">${syncLabel()}</span></span></button></div>
    <nav class="side-nav">${sideNav('plan', 'Plan', I.plan)}${sideNav('reflect', 'Reflect', I.reflect)}${sideNav('tx', 'All Accounts', I.bank)}${sideNav('settings', 'Settings', I.gear)}</nav>`;
  for (const [key, label, fn] of SECTIONS) {
    const list = p.accounts.filter(a => !a.closed && fn(a)).sort((x, y) => (y.star ? 1 : 0) - (x.star ? 1 : 0)); if (!list.length) continue;
    const col = !!A.ui.collapsed['s_' + key];
    const tot = list.reduce((s, a) => s + b[a.id].working, 0);
    h += `<div class="side-sec"><button class="side-sec-h" data-a="collapse" data-g="s_${key}" aria-expanded="${!col}"><span class="chev ${col ? 'shut' : ''}">${I.down}</span><span class="grow">${label}</span><span class="num">${fmt(tot)}</span></button>`;
    if (!col) for (const a of list) { h += `<button class="side-acct ${A.acct === a.id ? 'on' : ''}" data-a="openAcctNav" data-id="${a.id}" draggable="true" data-drag="${a.id}" title="Drag to reorder"><span class="grow ellip">${a.star ? '<span class="star-s">★</span> ' : ''}${esc(a.name)}</span>${linked.has(a.id) ? `<span class="linked" title="Connected to your bank" aria-label="Connected to your bank">${I.link}</span>` : ''}<span class="num ${b[a.id].working < 0 ? 'amt-bad' : ''}">${fmt(b[a.id].working)}</span></button>`;
      for (const cd of linkedCards(a)) { const v = b[a.id].working + b[cd.id].working; h += `<div class="side-acct sub" title="${esc(a.name)} after the ${esc(cd.name)} statement"><span class="grow ellip small muted">${esc(a.name)} − ${esc(cd.name)}</span><span class="num small ${v < 0 ? 'amt-bad' : ''}">${fmt(v)}</span></div>`; }
      const dc = deferredCards()[a.id]; if (dc) { const after = b[a.id].working + dc.reduce((x, id) => x + (b[id]?.working || 0), 0); const ov = a.overdraft || 0, cls = after >= 0 ? '' : after < -ov ? 'amt-bad' : 'amt-warn';
        h += `<div class="side-after" title="Balance once the deferred card is debited${ov ? ' · authorized overdraft ' + fmt(ov) : ''}"><span class="grow ellip">after card${after < 0 && ov ? ' · ' + (after < -ov ? 'over limit' : fmt(ov + after) + ' left') : ''}</span><span class="num ${cls}">${fmt(after)}</span></div>`; } }
    h += `</div>`;
  }
  const closed = p.accounts.filter(a => a.closed);
  if (closed.length) {
    const col = A.ui.collapsed.s_closed !== false;
    h += `<div class="side-sec"><button class="side-sec-h" data-a="collapseClosed" aria-expanded="${!col}"><span class="chev ${col ? 'shut' : ''}">${I.down}</span><span class="grow">Closed</span></button>`;
    if (!col) for (const a of closed) h += `<button class="side-acct muted ${A.acct === a.id ? 'on' : ''}" data-a="openAcctNav" data-id="${a.id}"><span class="grow ellip">${esc(a.name)}</span><span class="num">${fmt(b[a.id].working)}</span></button>`;
    h += `</div>`;
  }
  h += `<div class="side-foot"><span class="row" style="justify-content:space-between; align-items:center"><span class="small muted" style="padding:0 6px">Drag accounts to reorder them.</span><button class="ibtn" data-a="sideToggle" title="Collapse sidebar (shift .)" aria-label="Collapse sidebar">${I.left}</button></span><button class="btn sm block" data-a="acctNew">${I.plus} Add Account</button><button class="btn sm block" data-a="importSheet">${I.upload} File Import</button></div>`;
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
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const lastDayOf = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };
// YNAB wording: "by the 18th" (monthly), "this month" (yearly / by date), "eventually" (balance without a date)
function dueLabel(c, m) {
  const t = c.target; if (!t) return '';
  if (t.type === 'monthly' || t.type === 'debt') return ' by the ' + ordinal(Math.min(t.day || 31, lastDayOf(m)));
  if (t.type === 'weekly') return ' this month';
  if (t.type === 'balance' && !t.date) return ' eventually';
  return ' this month';
}
function targetText(c, m, s) {
  const x = s.x, ti = s.ti, spent = -Math.min(0, x.activity), fundedAll = x.carry + x.assigned;
  if (x.available < 0) return x.creditOver > 0 && !x.cashOver ? 'Overspent ' + fmt(x.creditOver) + ' on credit' : fundedAll > 0 ? 'Overspent · ' + fmt(spent) + ' of ' + fmt(fundedAll) : 'Overspent ' + fmt(-x.available);
  if (c.cc) { const bal = -(balances()[c.cc]?.working || 0); return bal > x.available ? fmt(bal - x.available) + ' more needed to pay balance' : 'Paid in full'; }
  if (!ti) return spent && x.available === 0 && fundedAll > 0 ? 'Fully Spent' : '';
  if (ti.snoozed) return 'Snoozed';
  const t = c.target;
  if (ti.under > 0) { const more = t.mode !== 'refill' && t.type !== 'debt' && t.type !== 'balance' || ti.funded > 0 || x.carry > 0; return fmt(ti.under) + (more ? ' more needed' : ' needed') + dueLabel(c, m); }
  if (spent > 0 && x.available === 0) return 'Fully Spent';
  const onTrack = ['yearly', 'date', 'balance'].includes(t.type) && dueMonth(t, m) && fundedAll < t.amount;
  const head = onTrack ? 'On Track' : 'Funded';
  if (spent > 0) return head + ' · Spent ' + fmt(spent) + ' of ' + fmt(fundedAll);
  return head;
}

/* ---------- PLAN ---------- */
function planStats(m) {
  let under = 0, cost = 0, overN = 0, overfunded = 0;
  for (const c of A.plan.cats) { if (c.hidden) { if (catM(m, c.id).available < 0) overN++; continue; } const s = catStatus(c, m); if (s.ti) { under += s.ti.under; cost += s.ti.need; } if (s.x.available < 0) overN++; }
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
        <div><h1 class="dmonth"><button class="mpick" data-a="monthPick" aria-label="Choose a month">${MSHORT[+m.slice(5, 7) - 1]} ${m.slice(0, 4)} <span class="caret">▾</span></button></h1><input class="mnote" value="${esc(p.notes?.[m] || '')}" placeholder="Enter a note…" data-mnote="${m}" aria-label="Month note"></div>
        <button class="ibtn round" data-a="month" data-d="1" aria-label="Next month">${I.right}</button>${m !== curMonth() ? `<button class="btn sm" data-a="monthToday">Today</button>` : ''}</div>
      <button class="rta d ${rtaCls}" data-a="rtaSheet"><div><div class="amt num">${fmt(rta)}</div><div class="lbl">${rtaLbl}</div></div>
        ${rta !== 0 ? `<span class="cta" data-a="${rta > 0 ? 'assignSheet' : 'fixOver'}">${rta > 0 ? 'Assign' : 'Fix This'}</span>` : ''}</button>
      <span></span></div>`;
  } else { // YNAB mobile: Edit · filter · month ▾ · ⋯, then the Ready to Assign bar
    const F0 = A.ui.filter && A.ui.filter !== 'all';
    h = `<div class="top wrap"><div class="top-bar mplan"><button class="tbtn ${A.ui.edit ? 'on' : ''}" data-a="toggleEdit">${A.ui.edit ? 'Done' : 'Edit'}</button><button class="ibtn ${F0 ? 'on' : ''}" data-a="planFilterMenu" aria-label="Filter categories">${ico('<path d="M4 6h16M7 12h10M10 18h4"/>')}</button>
      <div class="top-title"><button class="mpick" data-a="monthPick" aria-label="Choose a month"><h1>${MSHORT[+m.slice(5, 7) - 1]} ${m.slice(0, 4)} <span class="caret">${ico('<path d="M6 9l6 6 6-6"/>')}</span></h1></button></div><button class="ibtn" data-a="planMore" aria-label="More">${I.dots}</button></div></div>`;
    if (m !== curMonth()) h += `<div class="wrap"><button class="todaybar" data-a="monthToday">Today</button></div>`;
    h += `<div class="wrap"><button class="rtabar ${rtaCls}" data-a="${rta > 0 ? 'assignSheet' : rta < 0 ? 'fixOver' : 'rtaSheet'}"><b class="num">${fmt(rta)}</b><span class="grow"></span><span>${rta < 0 ? 'Assigned too much' : 'Ready to Assign'}</span>${I.right}</button>`;
    if (A.ui.edit) { const inc = A.plan.expectedIncome || 0, mx = Math.max(st.cost, inc, 1);
      h += `<div class="card ctbm"><div class="ctbm-h"><b class="num">${fmt(st.cost)}</b><span class="small muted">Cost to Be Me</span></div>
        <div class="li col"><div class="row"><span class="grow">${esc(cap(MONTHS[+m.slice(5) - 1]))}’s Targets</span><b class="num">${fmt(st.cost)}</b></div><div class="bar bad"><i style="width:${Math.round(st.cost / mx * 100)}%"></i></div></div>
        <div class="li col"><div class="row"><label class="grow" for="expInc2">Monthly Income</label><input id="expInc2" class="mini num" inputmode="decimal" value="${inc ? fmtIn(inc) : ''}" placeholder="0,00" data-set="expectedIncome"></div><div class="bar"><i style="width:${Math.round(inc / mx * 100)}%"></i></div></div></div>
        <div class="row" style="gap:8px; margin-top:8px"><button class="btn grow" data-a="groupNew">${I.plus} New Group</button><button class="btn grow" data-a="toggleReorder">⇅ Reorder</button></div>`; }
    h += `</div>`;
  }
  h += `<div class="wrap">`;
  { // compact alert chips (YNAB-style), one line instead of stacked banners
    const chips = [];
    if (st.overN) chips.push(`<span class="achip bad"><button data-a="filter" data-f="over">${st.overN} overspent</button></span>`);
    if (unapproved) chips.push(`<span class="achip info"><button data-a="openAll" data-f="unapproved">${unapproved} to approve</button><button class="sub" data-a="approveCat" title="Approve every imported transaction that already has a category">✓ categorized</button></span>`);
    if (uncatN) chips.push(`<span class="achip warn"><button data-a="openAll" data-f="uncat">${uncatN} need${uncatN > 1 ? '' : 's'} a category</button><button class="sub" data-a="autoCat" title="Use your past choices for the same merchants">Auto</button></span>`);
    if (md.prevCashOver > 0 && m === curMonth()) chips.push(`<span class="achip warn" title="Cash overspending from ${esc(monthLabel(addMonths(m, -1)))} is taken from Ready to Assign"><button data-a="rtaSheet">${esc(MSHORT[+addMonths(m, -1).slice(5, 7) - 1] || '')} overspending −${fmt(md.prevCashOver)}</button></span>`);
    if (!desk) { if (st.overN && A.ui.filter !== 'over') h += `<div class="card" style="margin-top:8px"><div class="li"><span class="hnum bad">${st.overN}</span><span class="grow">Overspent categor${st.overN > 1 ? 'ies' : 'y'}</span><button class="btn sm soft" data-a="filter" data-f="over">Cover</button></div></div>`; if (A.ui.filter && A.ui.filter !== 'all') h += `<div class="chips"><button class="chip on" data-a="filter" data-f="all">${esc(({ over: 'Overspent', snoozed: 'Snoozed', under: 'Underfunded', overf: 'Overfunded', avail: 'Money Available' })[A.ui.filter] || (A.plan.views || []).find(v => 'v:' + v.id === A.ui.filter)?.name || 'Filter')} ✕</button></div>`; }
    else if (chips.length) h += `<div class="achips">${chips.join('')}</div>`;
  }
  const F = A.ui.filter;
  if (desk) h += `<div class="chips" role="toolbar" aria-label="Filters">
    ${chip('all', 'All')}${chip('snoozed', 'Snoozed')}${chip('under', 'Underfunded')}${chip('overf', 'Overfunded')}${chip('avail', 'Money Available')}${(A.plan.views || []).map(v => chip('v:' + v.id, esc(v.name))).join('')}${F === 'over' ? chip('over', 'Overspent') : ''}<button class="chip" data-a="viewsMenu" aria-label="Views Menu" title="Views Menu">⋯</button></div>
    <div class="toolbar">
      <button class="tbtn" data-a="groupNew">${I.plus} Category Group</button>
      <button class="tbtn" data-a="undo" ${A.undo.length ? '' : 'disabled'}>${I.undo} Undo</button>
      <button class="tbtn" data-a="redo" ${A.redo.length ? '' : 'disabled'}>${I.redo} Redo</button>
      <button class="tbtn" data-a="moves">${I.swap} Recent Moves</button>
      <button class="tbtn ${A.ui.edit ? 'on' : ''}" data-a="toggleEdit">${I.edit} ${A.ui.edit ? 'Done' : 'Edit'}</button>
      <span style="flex:1"></span>
      <button class="tbtn" data-a="collapseAll" title="Collapse or expand all groups">${A.plan.groups.every(g => A.ui.collapsed[g.id]) ? 'Expand all' : 'Collapse all'}</button>
      ${DESK() ? `<button class="tbtn" data-a="inspToggle" title="${A.ui.inspHide ? 'Show' : 'Hide'} the month summary panel">${A.ui.inspHide ? 'Show summary' : 'Hide summary'}</button>` : ''}
      <span class="viewsw" role="group" aria-label="Row size"><button class="${A.ui.compact ? '' : 'on'}" data-a="setCompact" data-v="0" aria-label="Expanded rows with progress bars">${ico('<rect x="4" y="5" width="16" height="6" rx="1.5"/><rect x="4" y="13" width="16" height="6" rx="1.5"/>')}</button><button class="${A.ui.compact ? 'on' : ''}" data-a="setCompact" data-v="1" aria-label="Compact rows">${ico('<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>')}</button></span>
    </div>`;
  h += `<div class="colhead"><span class="c-name">Category</span><span class="w-ass">Assigned</span><span class="w-act hide-s">Activity</span><span class="w-av">Available</span></div>`;
  const groups = p.groups.filter(g => g.sys !== 'cc' || p.cats.some(c => c.gid === g.id && !c.hidden));
  let shown = 0;
  for (const g of groups) {
    if (g.hidden && !A.ui.edit) continue;
    let cats = p.cats.filter(c => c.gid === g.id && (!c.hidden || A.ui.showHidden || catM(m, c.id).available < 0));
    const VW = F.startsWith('v:') ? (A.plan.views || []).find(v => 'v:' + v.id === F) : null;
    if (VW) cats = cats.filter(c => VW.cats.includes(c.id));
    else if (F !== 'all') cats = cats.filter(c => { const s = catStatus(c, m); return F === 'under' ? s.ti && s.ti.under > 0 : F === 'over' ? s.x.available < 0 : F === 'avail' ? s.x.available > 0 : F === 'snoozed' ? s.ti && s.ti.snoozed : F === 'overf' ? s.ti && !s.ti.snoozed && s.x.available > s.ti.total && s.ti.total > 0 : true; });
    if (!cats.length && (F !== 'all' || (!A.ui.edit && g.sys))) continue;
    const col = !!A.ui.collapsed[g.id] && F === 'all';
    let ga = 0, gact = 0, gav = 0; for (const c of cats) { const x = catM(m, c.id); ga += x.assigned; gact += x.activity; gav += x.available; }
    h += `<section class="group" aria-label="${esc(g.name)}">
      <div class="ghead ${col ? 'collapsed' : ''}">
        ${DESK() ? `<input type="checkbox" class="cchk" data-c="grpChk" data-g="${g.id}" ${cats.length && cats.every(c => (A.ui.selCats || new Set()).has(c.id)) ? 'checked' : ''} aria-label="Select all in ${esc(g.name)}">` : ''}<button class="gname" data-a="collapse" data-g="${g.id}" aria-expanded="${!col}" ${DESK() ? `data-gdrop="${g.id}"` : ''}>${I.down}<span style="text-align:left; line-height:1.2">${esc(g.name)}${g.hidden ? ' (hidden)' : ''}</span></button>${!g.sys && !A.ui.edit ? `<button class="gadd" data-a="catNew" data-g="${g.id}" aria-label="Add a category to ${esc(g.name)}">${I.plus}</button>` : ''}<span style="flex:1"></span>
        ${A.ui.edit && !g.sys ? `<div class="editrow">
          <button class="ibtn" data-a="gMove" data-g="${g.id}" data-d="-1" aria-label="Move group up">${I.up}</button>
          <button class="ibtn" data-a="gMove" data-g="${g.id}" data-d="1" aria-label="Move group down">${I.down}</button>
          <button class="ibtn" data-a="catNew" data-g="${g.id}" aria-label="Add category">${I.plus}</button>
          <button class="ibtn" data-a="gEdit" data-g="${g.id}" aria-label="Edit group">${I.edit}</button></div>`
        : `<span class="gsum num w-ass"><i class="glab">Assigned</i>${fmt(ga)}</span><span class="gsum num w-act hide-s">${fmt(gact)}</span><span class="gsum num w-av"><i class="glab">Available</i>${fmt(gav)}</span>`}
      </div>`;
    if (!col) for (const c of cats) { h += catRow(c, m); shown++; }
    h += `</section>`;
  }
  if (F !== 'all' && !shown) h += `<div class="empty"><strong>No categories match this filter</strong><button class="btn sm" data-a="filter" data-f="all">Show all</button></div>`;
  {
    const hid = p.cats.filter(c => c.hidden).length;
    if (hid) h += `<div class="row" style="margin-top:14px"><button class="btn" data-a="toggleHidden">${A.ui.showHidden ? I.eyeoff : I.eye} ${A.ui.showHidden ? 'Hide' : 'Show'} hidden categories (${hid})</button></div>`;
  }
  if (!p.accounts.length) h += `<div class="banner info" style="margin-top:16px">${I.info}<span>Start by adding your checking account with today's balance.</span><button class="btn sm pri" data-a="acctNew">Add Account</button></div>`;
  h += `<p class="kbd-hint" style="margin-top:14px">Tip: in Assigned, type <b>+50</b> to add 50 or <b>120/3</b> to do the math.</p></div>`;
  return h;
}
const chip = (f, l) => `<button class="chip ${A.ui.filter === f ? 'on' : ''}" data-a="filter" data-f="${f}">${l}</button>`;
function pieIcon(p) {
  if (p >= 1) return `<svg class="picon pie done" viewBox="-1 -1 2 2" aria-hidden="true"><circle r=".9" class="o"/><path d="M-.42 0 L-.12 .3 L.45 -.3" class="ck"/></svg>`;
  const a = Math.max(0, Math.min(.999, p)) * 2 * Math.PI, x = Math.cos(a - Math.PI / 2), y = Math.sin(a - Math.PI / 2);
  return `<svg class="picon pie" viewBox="-1 -1 2 2" aria-hidden="true"><circle r=".9" class="o"/>${p > 0 ? `<path d="M0 0 L0 -.65 A.65 .65 0 ${a > Math.PI ? 1 : 0} 1 ${(x * .65).toFixed(3)} ${(y * .65).toFixed(3)} Z" class="i"/>` : ''}</svg>`;
}
function catRow(c, m) {
  const s = catStatus(c, m), x = s.x, ti = s.ti;
  const barCls = s.cls === 'bad' || s.cls === 'credit' ? 'bad' : s.cls === 'warn' ? 'warn' : '';
  const note = targetText(c, m, s);
  const pillIcon = ti && !ti.snoozed && s.cls !== 'bad' ? pieIcon(ti.under > 0 ? ti.pct : 1) : ''; // YNAB web: target progress circle (check when funded) inside the pill
  const ck = (A.ui.selCats || new Set()).has(c.id);
  return `<div class="cat ${c.hidden ? 'muted' : ''} ${A.ui.selCat === c.id || ck ? 'sel' : ''}" data-a="catSel" data-c="${c.id}" ${DESK() && !c.cc ? `draggable="true" data-cdrag="${c.id}"` : ''}>${DESK() ? `<input type="checkbox" class="cchk" data-c="catChk" data-id="${c.id}" ${ck ? 'checked' : ''} aria-label="Select ${esc(c.name)}">` : ''}
    <div class="cname">
      <span class="ctop"><button class="t" data-a="catSheet" data-c="${c.id}">${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}${c.hidden ? ' (hidden)' : ''}</button>${note ? `<span class="note">${esc(note)}</span>` : ''}</span>
      ${ti && ti.total > 0 && !A.ui.noBars ? `<span class="bar ${barCls}"><i style="width:${Math.round(ti.pct * 100)}%"></i></span>` : ''}
    </div>
    ${A.ui.edit && !c.cc ? `<div class="editrow">
      <button class="ibtn" data-a="cMove" data-c="${c.id}" data-d="-1" aria-label="Move up">${I.up}</button>
      <button class="ibtn" data-a="cMove" data-c="${c.id}" data-d="1" aria-label="Move down">${I.down}</button>
      <button class="ibtn" data-a="cHide" data-c="${c.id}" aria-label="${c.hidden ? 'Unhide' : 'Hide'}">${c.hidden ? I.eye : I.eyeoff}</button></div>` : `
    <span class="ass-w w-ass"><input class="ass-in" inputmode="decimal" enterkeyhint="done" aria-label="Assigned to ${esc(c.name)}" data-assign="${c.id}" value="${fmtIn(x.assigned)}"><i class="ass-eur" aria-hidden="true">€</i></span>
    <button class="w-act hide-s num muted act actbtn" data-a="catActivity" data-c="${c.id}" title="See these transactions">${fmt(x.activity)}</button>
    <span class="w-av"><button class="pill ${s.cls}" data-a="pillTap" data-c="${c.id}">${pillIcon}${fmt(x.available)}</button></span>`}
  </div>`;
}
function inspector() {
  if (A.ui.selCats && A.ui.selCats.size) {
    const m = A.month, cs = A.plan.cats.filter(c => A.ui.selCats.has(c.id)); let as = 0, ac = 0, av = 0; for (const c of cs) { const x = catM(m, c.id); as += x.assigned; ac += x.activity; av += x.available; }
    const opts = autoOptions(m, cs);
    return `<div class="itop cat-top"><strong class="grow">${cs.length} categor${cs.length > 1 ? 'ies' : 'y'} selected</strong><button class="btn sm" data-a="catChkNone">Clear</button></div>
      <div class="ipanel"><div class="ibody" style="padding-top:12px"><div class="irow"><span>Assigned</span><b class="num">${fmt(as)}</b></div><div class="irow"><span>Activity</span><b class="num">${fmt(ac)}</b></div><div class="irow big"><span>Available</span><b class="num">${fmt(av)}</b></div></div></div>
      <div class="ipanel"><div class="ih" style="cursor:default"><span>${I.wand} Auto-Assign</span></div><div class="ibody">${opts.map(o => `<button class="aa" data-a="autoApply" data-k="${o.k}" data-sel="1" ${o.changes.length ? '' : 'disabled'}><span>${o.l}</span><b class="num">${fmt(Math.abs(o.delta))}</b></button>`).join('')}</div></div>`;
  }
  if (A.ui.selCat && L.cat[A.ui.selCat]) { const c = L.cat[A.ui.selCat]; return `<div class="itop cat-top"><button class="ibtn" data-a="catDesel" aria-label="Back to the month summary" title="Back to the month summary">${I.left}</button><strong class="grow ellip">${esc(catName(c.id))}</strong><button class="ibtn" data-a="inspToggle" aria-label="Hide this panel" title="Hide this panel">${I.right}</button></div><div class="icat">${catSheet(c.id, true)}</div>`; }
  const m = A.month, md = monthData(m), st = planStats(m), mn = MONTHS[+m.slice(5, 7) - 1];
  const prevLeft = md.rtaBase - md.income + md.assigned + md.prevCashOver;
  const income = A.plan.expectedIncome || 0;
  const opts = autoOptions(m, A.plan.cats.filter(c => !c.hidden));
  const aom = ageOfMoney().at(m === curMonth() ? '9999-12-31' : addMonths(m, 1) + '-00');
  const pct = income ? Math.min(100, Math.round(st.cost / income * 100)) : 0;
  const F = A.ui.inspFold || {};
  const head = (k, t) => `<button class="ih" data-a="inspFold" data-k="${k}" aria-expanded="${!F[k]}"><span>${t}</span><span class="ich ${F[k] ? 'shut' : ''}">${I.down}</span></button>`;
  const sec = (k, t, inner) => `<div class="ipanel">${head(k, t)}${F[k] ? '' : `<div class="ibody">${inner}</div>`}</div>`;
  return `<div class="itop"><button class="ibtn" data-a="inspToggle" aria-label="Hide this panel" title="Hide this panel">${I.right}</button></div>` + sec('sum', `${cap(mn)}'s Summary`, `
      <div class="irow"><span>Left Over from Last Month</span><b class="num">${fmt(prevLeft)}</b></div>
      <div class="irow"><span>Assigned in ${cap(mn)}</span><b class="num">${fmt(md.assigned)}</b></div>
      ${(() => { const ck = budgetCheck(m); return `<div class="irow"><span>Cash in budget accounts</span><b class="num">${fmt(ck.cash)}</b></div><div class="irow"><span>Check</span><b class="num" style="color:${ck.gap ? 'var(--bad)' : 'var(--good, inherit)'}">${ck.gap ? 'Gap ' + fmt(ck.gap) : '✓ matches'}</b></div>`; })()}
      <div class="irow"><span>Activity</span><b class="num">${fmt(md.activity)}</b></div>
      <div class="irow big"><span>Available</span><b class="num">${fmt(md.available)}</b></div>
      <div class="irow"><span>Age of Money</span><b class="num">${aom == null ? '—' : aom + (aom === 1 ? ' day' : ' days')}</b></div>`) + sec('cost', 'Cost to Be Me', `
      <div class="irow"><span>${cap(mn)}'s Targets</span><b class="num">${fmt(st.cost)}</b></div>
      <div class="bar ${income && st.cost > income ? 'bad' : ''}" style="margin-top:6px"><i style="width:${income ? pct : 0}%"></i></div>
      ${(() => { const nm = addMonths(m, 1); let nc = 0; for (const c of A.plan.cats) { if (c.hidden) continue; const ti = targetInfo(c, nm); if (ti) nc += ti.need; } return nc > st.cost ? `<div class="hint-box">Next month's targets could increase your total to ${fmt(nc)}</div>` : ''; })()}
      <div class="irow" style="margin-top:8px"><label for="expInc">Expected Income</label><input id="expInc" class="mini num" inputmode="decimal" value="${income ? fmtIn(income) : ''}" placeholder="0,00" data-set="expectedIncome"></div>`) + sec('auto', `${I.wand} Auto-Assign`, `
      ${opts.map(o => `<button class="aa" data-a="autoApply" data-k="${o.k}" ${o.changes.length ? '' : 'disabled'}><span>${o.l}</span><b class="num">${fmt(Math.abs(o.delta))}</b></button>`).join('')}`);
}

/* ---------- ACCOUNTS (mobile list) ---------- */
/* deferred-debit card of a checking account: a credit account whose name starts with the checking account's name ("SG" → "SG Card") */
const linkedCards = a => isCredit(a) || !onBudget(a) ? [] : A.plan.accounts.filter(c => !c.closed && isCredit(c) && c.name.toLowerCase().startsWith(a.name.toLowerCase() + ' '));
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
      for (const cd of linkedCards(a)) { const v = x.working + b[cd.id].working; h += `<button class="li sub" data-a="openAcct" data-id="${a.id}"><span class="ic" style="background:none"></span><span class="grow small muted">${esc(a.name)} − ${esc(cd.name)}</span><strong class="num ${v < 0 ? 'amt-bad' : ''}">${fmt(v)}</strong></button>`; }
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
const regView = () => ({ range: 'all', rec: true, bal: false, flags: true, img: true, ...(A.ui.rv || {}) });
function regRange(k) {
  const cm = curMonth(), end = m => addMonths(m, 1) + '-00', y = cm.slice(0, 4);
  return { tm: [cm + '-01', end(cm)], lm: [addMonths(cm, -1) + '-01', end(addMonths(cm, -1))], '3m': [addMonths(cm, -2) + '-01', end(cm)], ty: [y + '-01-01', y + '-12-31'], ly: [(+y - 1) + '-01-01', (+y - 1) + '-12-31'], custom: [(regView().from || '0000-01') + '-01', (regView().to || '9999-12') + '-31'] }[k] || ['0000', '9999'];
}
function regList() {
  const id = A.acct; const f = A.ui.regFilter; const q = A.ui.search.trim().toLowerCase();
  let list = id === 'all' ? A.tx.filter(t => L.acct[t.acct] && (A.view !== 'tx' || DESK() || onBudget(L.acct[t.acct]))) : A.tx.filter(t => t.acct === id);
  if (f === 'unapproved') list = list.filter(t => t.approved === false);
  else if (f === 'uncleared') list = list.filter(t => t.cleared === 'u');
  else if (f === 'cleared') list = list.filter(t => t.cleared !== 'u');
  else if (f === 'flagged') list = list.filter(t => t.flag);
  else if (f === 'uncat') list = list.filter(t => onBudget(L.acct[t.acct]) && !t.transferAcct && !(t.splits && t.splits.length) && !t.cat);
  const rv = regView();
  if (rv.range !== 'all') { const [from, to] = regRange(rv.range); list = list.filter(t => t.date >= from && t.date <= to); }
  if (!rv.rec) list = list.filter(t => t.cleared !== 'r');
  if (A.ui.catFilter) { const { cid, m } = A.ui.catFilter; list = list.filter(t => monthOf(t.date) === m && txLines(t).some(l => l.cat === cid)); }
  if (q) list = list.filter(t => [payeeName(t), t.memo, catName(t.cat), ...(t.splits || []).map(s => catName(s.cat) + ' ' + (s.memo || '')), fmtIn(Math.abs(t.amount)), L.acct[t.acct]?.name].join(' ').toLowerCase().includes(q));
  list = collapseLegs(list);
  const so = A.ui.sort || { k: 'date', d: -1 }, byDate = (a, b) => a.date === b.date ? (a.id < b.id ? -1 : 1) : a.date < b.date ? -1 : 1;
  const key = { acct: t => L.acct[t.acct]?.name || '', payee: t => (payeeName(t) || '').toLowerCase(), cat: t => (txCatLabel(t) || '').toLowerCase(), memo: t => (t.memo || '').toLowerCase(), out: t => t.amount < 0 ? -t.amount : 0, in: t => t.amount > 0 ? t.amount : 0, flag: t => t.flag ? 0 + t.flag : '~', clr: t => ({ u: 0, c: 1, r: 2 })[t.cleared] ?? 1 }[so.k];
  return list.sort((a, b) => { if (key) { const x = key(a), y = key(b); if (x !== y) return (x < y ? -1 : 1) * so.d; } return byDate(a, b) * (key ? -1 : so.d); });
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
async function diffSheet(acctId, bankV) {
  const x = bankAcctOf(acctId); if (!x) return;
  openSheet('Find the difference', `<div class="small muted">Comparing with your bank's last 60 days…</div>`, '');
  try {
    const from = addDays(todayISO(), -60), rows = []; let ck = null, guard = 0;
    do { const r = await bk('tx', { uid: x.uid, from, ...(ck ? { ck } : {}) }); for (const t of r.transactions || []) rows.push(ebRow(t)); ck = r.continuation_key || null; } while (ck && guard++ < 20);
    // deferred card: its pending lines count in the bank balance, and lines bought before the account's starting balance are already in it
    const isCard = Object.values(deferredCards()).some(l => l.includes(acctId));
    const sb = A.tx.find(t => t.acct === acctId && L.payee[t.payee]?.name === 'Starting Balance'); const start = isCard && sb ? sb.date : '';
    const opDate = r => { const m = String(r.payee || '').match(/CARTE\s+X\d+\s+(?:REMBT\s+|TRANSF\s+)?(\d{2})\/(\d{2})/i); if (!m) return r.date; const y = +r.date.slice(0, 4) - (+m[2] > +r.date.slice(5, 7) ? 1 : 0); return `${y}-${m[2]}-${m[1]}`; };
    const booked = rows.filter(r => (isCard || !r.pending) && r.date && r.amount && r.date >= from && (!start || opDate(r) > start));
    const here = A.tx.filter(t => t.acct === acctId && (isCard || !t.pend) && t.date >= from && t !== sb);
    const used = new Set(), missing = [];
    for (const r of booked) {
      const key = r.fitid ? 'eb:' + r.fitid : null;
      let m = key && here.find(t => !used.has(t.id) && t.importId === key);
      if (!m) m = here.filter(t => !used.has(t.id) && t.amount === r.amount && Math.abs(daysBetween(t.date, r.date)) <= 15).sort((p, q) => Math.abs(daysBetween(p.date, r.date)) - Math.abs(daysBetween(q.date, r.date)))[0];
      if (!m) { const pr = findPair(here.filter(t => !used.has(t.id)), r); if (pr) { used.add(pr[1].id); m = pr[0]; } }
      if (m) { used.add(m.id); if (key) here.filter(t => t.importId && t.importId.startsWith(key + '#')).forEach(t => used.add(t.id)); } else missing.push(r);
    }
    const extra = here.filter(t => !used.has(t.id));
    const sum = l => l.reduce((s, t) => s + t.amount, 0);
    const appV = balances()[acctId].working - (isCard ? 0 : sum(A.tx.filter(t => t.acct === acctId && t.pend)));
    const bankBefore = bankV - sum(booked), appBefore = appV - sum(here);
    A.ui.diffMissing = missing; A.ui.diffAcct = acctId;
    const row = t => `<button class="li" data-a="txEdit" data-id="${t.id}"><span class="grow"><strong>${esc(payeeName(t) || '—')}</strong><div class="small muted">${esc(fmtDate(t.date))}${t.transferAcct ? ' · transfer' : ''}${t.cat ? ' · ' + esc(catName(t.cat)) : ''}</div></span><span class="num">${fmt(t.amount)}</span></button>`;
    const isCardDebit = r => /(DEBIT MENSUEL|RELEVE CARTE|FACTURE CARTE|DEBIT DIFFERE)/i.test(r.payee + ' ' + (r.memo || ''));
    const brow = (r, i) => `<div class="li" style="flex-wrap:wrap"><span class="grow"><strong>${esc(r.payee)}</strong><div class="small muted">${esc(fmtDate(r.date))}</div>${isCardDebit(r) ? `<div class="small amt-bad">Monthly card debit: don't add it if you typed these card purchases one by one in this account. From now on it is a transfer to your card account.</div>` : ''}</span><span class="num">${fmt(r.amount)}</span>${isCardDebit(r) ? '' : `<button class="btn sm" data-a="diffAdd" data-i="${i}">Add</button>`}</div>`;
    const lumpRe = /(DEBIT MENSUEL|RELEVE CARTE|FACTURE CARTE|DEBIT DIFFERE)/i;
    const lumps = A.tx.filter(t => t.acct === acctId && isBankImp(t) && !t.approved && lumpRe.test(payeeName(t) || ''));
    const handCard = extra.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
    const diff = appV - bankV;
    const body = `<p class="small muted" style="margin:0">Here ${fmt(appV)} · bank ${fmt(bankV)} · difference <strong>${fmt(diff)}</strong> (pending payments left out on both sides).</p>
      ${lumps.length ? `<div class="sec-t"><span>Monthly card debits counted twice</span></div>
      <p class="small muted" style="margin:0">You typed your card purchases one by one in this account (${fmt(handCard)} below), so the bank's monthly card debit counts them a second time. Delete it.</p>
      <div class="card">${lumps.map(t => `<div class="li"><span class="grow"><strong>${esc(payeeName(t))}</strong><div class="small muted">${esc(fmtDate(t.date))}</div></span><span class="num">${fmt(t.amount)}</span><button class="btn sm danger" data-a="diffDel" data-id="${t.id}" data-acct="${acctId}" data-v="${bankV}">Delete</button></div>`).join('')}</div>` : ''}
      ${diff ? `<div class="card" style="padding:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap"><span class="grow small">Or simply align this account on the bank: adds one adjustment of <strong>${fmt(-diff)}</strong> (like YNAB's reconciliation).</span><button class="btn sm" data-a="diffAdjust" data-id="${acctId}" data-v="${-diff}">Adjust to ${fmt(bankV)}</button></div>` : '<div class="banner">✓ Matches the bank</div>'}
      <div class="sec-t"><span>At the bank, missing here (${fmt(sum(missing))})</span></div>
      <p class="small muted" style="margin:0">Add one only if you never recorded it at all (not even with another date or name).</p>
      <div class="card">${missing.map(brow).join('') || '<div class="li muted">None</div>'}</div>
      <div class="sec-t"><span>Here, not at the bank (${fmt(sum(extra))})</span></div>
      <p class="small muted" style="margin:0">Not found on your bank account in the last 60 days. Tap one to open it: delete it only if it really is not on your statement.</p>
      <div class="card">${extra.map(row).join('') || '<div class="li muted">None</div>'}</div>
      ${!isCard && bankBefore !== appBefore ? `<div class="banner warn">${I.info}<span>Before ${esc(fmtDate(from))} the balances already differ by ${fmt(appBefore - bankBefore)}: that part is older than 60 days (use Reconcile to fix it with one adjustment).</span></div>` : ''}`;
    $('.sheet-b') && ($('.sheet-b').innerHTML = body);
  } catch (e) { $('.sheet-b') && ($('.sheet-b').innerHTML = `<div class="banner bad">${I.info}<span>${esc(e.message)}</span></div>`); }
}
function viewRegister() {
  const id = A.acct, all = id === 'all', a = all ? null : L.acct[id], desk = DESK();
  if (!all && !a) { A.acct = null; return viewAccounts(); }
  if (['unapproved', 'uncat'].includes(A.ui.regFilter) && !A.ui.search && !regList().length) A.ui.regFilter = 'all'; // all approved / categorized: back to All, like YNAB
  const b = balances();
  const bal = all ? Object.entries(b).filter(([k]) => onBudget(L.acct[k])).map(([, v]) => v).reduce((s, x) => ({ cleared: s.cleared + x.cleared, uncleared: s.uncleared + x.uncleared, working: s.working + x.working }), { cleared: 0, uncleared: 0, working: 0 }) : b[id];
  const ago = d => { const n = daysBetween(d, todayISO()); return n < 1 ? 'today' : n < 31 ? n + ' day' + (n > 1 ? 's' : '') + ' ago' : n < 365 ? Math.round(n / 30) + ' month' + (Math.round(n / 30) > 1 ? 's' : '') + ' ago' : Math.round(n / 365) + ' year' + (Math.round(n / 365) > 1 ? 's' : '') + ' ago'; };
  const sub2 = all ? (A.view === 'tx' && !desk ? 'Cash and credit accounts' : 'Budget accounts') : [ACCT[a.type].label, bankAcctOf(id) ? 'Connected' : '', a.lastRec ? 'Reconciled ' + ago(a.lastRec) : ''].filter(Boolean).join(' · ');
  let h = desk ? `<div class="rhead"><div class="grow"><h1>${all ? 'All Accounts' : `${esc(a.name)} <button class="star ${a.star ? 'on' : ''}" data-a="acctStar" data-id="${id}" aria-label="${a.star ? 'Unstar' : 'Star'} this account" title="Toggle Starred">${a.star ? '★' : '☆'}</button>`}</h1><div class="sub">${esc(sub2)}</div></div>${all ? '' : `<button class="rh-edit" data-a="acctEdit" data-id="${id}" aria-label="Edit account" title="Edit Account">${I.edit}</button><button class="btn pri rh-rec" data-a="reconcile" data-id="${id}">Reconcile</button>`}</div>` : topBar(all ? (A.view === 'tx' && !desk ? 'Spending' : 'All Accounts') : `${esc(a.name)} <button class="star ${a.star ? 'on' : ''}" data-a="acctStar" data-id="${id}" aria-label="${a.star ? 'Unstar' : 'Star'} this account" title="Toggle Starred">${a.star ? '★' : '☆'}</button>`, sub2,
    A.view === 'tx' || desk ? undoBtns() : `<button class="ibtn" data-a="backAccts" aria-label="Back to accounts">${I.left}</button>`,
    all ? (A.view === 'tx' && !desk ? `<button class="ibtn" data-a="moreMenu" aria-label="More">${I.dots}</button>` : `<button class="ibtn" data-a="importSheet" aria-label="File Import">${I.upload}</button>`) : (desk ? `<button class="ibtn" data-a="acctEdit" data-id="${id}" aria-label="Edit account">${I.edit}</button>` : `<button class="ibtn" data-a="acctMore" data-id="${id}" aria-label="More">${I.dots}</button>`));
  h += `<div class="wrap">`;
  { const un = (all ? A.tx.filter(t => L.acct[t.acct]) : A.tx.filter(t => t.acct === id)).filter(t => t.approved === false).length;
    const spendTab = A.view === 'tx' && all && !desk;
    if (spendTab) { // YNAB mobile Spending tab: "N New transactions · Review" and "Show N uncleared transactions"
      const unc = A.tx.filter(t => L.acct[t.acct] && onBudget(L.acct[t.acct]) && t.cleared === 'u').length;
      if (un) h += `<div class="card" style="margin-top:8px"><div class="li"><span class="hnum">${un}</span><span class="grow">New transaction${un > 1 ? 's' : ''}</span><button class="btn sm soft" data-a="cardMode">Review</button></div></div>`;
      if (unc && A.ui.regFilter !== 'uncleared') h += `<button class="card li" style="margin-top:8px; width:100%" data-a="regFilter" data-f="uncleared"><span class="grow">Show <b class="hnum">${unc}</b> uncleared transactions</span>${I.right}</button>`;
    } else if (un && A.ui.regFilter !== 'unapproved') h += `<div class="banner info" style="margin-top:8px">${I.info}<span>${un} new transaction${un > 1 ? 's' : ''} to approve or categorize</span><button class="btn sm pri" data-a="regFilter" data-f="unapproved">View</button></div>`; }
  let bk0 = all ? null : bankBalLine(id, bal);
  const bdup = all || !bankAcctOf(id) ? [] : bankDupes(id);
  if (bdup.length) bk0 = `<div class="banner warn" style="margin-top:8px">${I.info}<span>${bdup.length} bank transaction${bdup.length > 1 ? 's were' : ' was'} imported twice (they were already here from YNAB or typed by hand)</span><button class="btn sm" data-a="bankDupMerge" data-id="${id}">Merge</button></div>` + (bk0 || '');
  if (!(A.view === 'tx' && all && !desk)) h += `<div class="balbar"><div><span class="num">${fmt(bal.cleared)}</span><small>Cleared Balance</small></div><span class="op">+</span><div><span class="num">${fmt(bal.uncleared)}</span><small>Uncleared Balance</small></div><span class="op">=</span><div><span class="num strong">${fmt(bal.working)}</span><small>Working Balance</small></div></div>${bk0 || ''}`;
  if (!all && ACCT[a.type]?.grp === 'loan') { try { h += loanPanel(a); } catch (e) { console.warn('loan panel', e); } }
  const dups = all ? [] : cardDups(id);
  if (dups.length) h += `<div class="banner warn">${I.info}<span>${dups.length} card purchase${dups.length > 1 ? 's are' : ' is'} also entered by hand in ${esc(L.acct[dups[0].main.acct].name)}</span><button class="btn sm" data-a="dupReview" data-id="${id}">Review</button></div>`;
  h += `<div class="toolbar">
    ${desk ? `<button class="tbtn" data-a="newTx">${I.plus} Add Transaction</button>` : ''}
    ${!all && !desk ? `<button class="tbtn" data-a="reconcile" data-id="${id}">${I.lock} Reconcile</button>` : ''}
    <button class="tbtn" data-a="importSheet" data-id="${all ? '' : id}">${I.upload} File Import</button>
    ${!all && isDebt(a) && ACCT[a.type]?.grp !== 'loan' ? `<button class="tbtn" data-a="loanPlanner" data-id="${id}">${I.target} Loan Planner</button>` : ''}
    ${!all && isCredit(a) ? `<button class="tbtn" data-a="ccPay" data-id="${id}">${I.swap} Record Payment</button>` : ''}
    ${desk ? `<button class="tbtn" data-a="undo" ${A.undo.length ? '' : 'disabled'}>${I.undo} Undo</button><button class="tbtn" data-a="redo" ${A.redo.length ? '' : 'disabled'}>${I.redo} Redo</button><span style="flex:1"></span>` : ''}
    ${desk ? `<button class="tbtn" data-a="regViewMenu">View${regView().range !== 'all' ? ' · ' + ({ tm: 'This Month', lm: 'Last Month', '3m': 'Latest 3 Months', ty: 'This Year', ly: 'Last Year', custom: 'Custom' })[regView().range] : ''}</button>` : ''}
    ${desk ? `<input id="regSearch" class="in rsearch" type="search" placeholder="Search ${esc(all ? 'All Accounts' : a.name)}" value="${esc(A.ui.search)}" data-i="search" aria-label="Search transactions">` : `<button class="tbtn ${A.ui.select ? 'on' : ''}" data-a="toggleSelect">${I.sel} ${A.ui.select ? 'Done' : 'Select'}</button>`}
  </div>`;
  if (!desk) h += `<input id="regSearch" class="in" type="search" placeholder="Search payee, category, memo, amount…" value="${esc(A.ui.search)}" data-i="search" aria-label="Search transactions" style="margin-top:8px">`;
  const rf = (f, l) => `<button class="chip ${A.ui.regFilter === f ? 'on' : ''}" data-a="regFilter" data-f="${f}">${l}</button>`;
  if (A.ui.catFilter) h += `<div class="banner info">${I.info}<span>${esc(catName(A.ui.catFilter.cid))} · ${esc(monthLabel(A.ui.catFilter.m))} · ${fmt(regList().reduce((s, t) => s + txLines(t).filter(l => l.cat === A.ui.catFilter.cid).reduce((a, l) => a + l.amount, 0), 0))}</span><button class="btn sm" data-a="catActivityOff">Show all</button></div>`;
  if (!desk || A.ui.regFilter !== 'all') h += `<div class="chips">${rf('all', 'All')}${rf('unapproved', 'Unapproved')}${rf('uncat', 'Category Needed')}${rf('uncleared', 'Uncleared')}${rf('cleared', 'Cleared')}${rf('flagged', 'Flagged')}</div>`;
  const sch = A.plan.scheduled.filter(s => all || s.acct === id || s.transferAcct === id).sort((x, y) => x.next < y.next ? -1 : 1);
  if (sch.length && A.ui.regFilter === 'all' && !A.ui.search) {
    h += `<div class="day">Scheduled</div><div class="card">`;
    for (const s of sch.slice(0, 8)) h += `<div class="tx"><span style="width:30px;color:var(--muted)">${I.repeat}</span>
      <button class="main-b" data-a="schEdit" data-id="${s.id}"><span class="p ellip">${esc(s.transferAcct ? trLabel(s.transferAcct, s.acct) : s.payee)}</span><span class="c">${fmtDate(s.next)} · ${FREQ[s.freq]}${s.cat ? ' · ' + esc(catName(s.cat)) : ''}</span></button>
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
      const rv = regView(), showBal = rv.bal && !all;
      h += `<div class="rtable-wrap"><table class="rtable"><thead><tr>${selOn() ? `<th style="width:28px"><input type="checkbox" class="chk" data-c="selAll" aria-label="Check all" ${list.length && list.slice(0, lim).every(t => A.ui.selected.has(t.id)) ? 'checked' : ''}></th>` : ''}${rv.flags ? `<th class="sortable icoth"><button class="sortb" data-a="regSort" data-k="flag" aria-label="Sort by flag" title="Sort by flag">${I.flag}</button></th>` : ''}${all ? sth('acct', 'Account') : ''}${sth('date', 'Date')}${sth('payee', 'Payee')}${sth('cat', 'Category')}${sth('memo', 'Memo')}${sth('out', 'Outflow', 'r')}${sth('in', 'Inflow', 'r')}${showBal ? '<th class="r">Balance</th>' : ''}<th class="sortable icoth"><button class="sortb" data-a="regSort" data-k="clr" aria-label="Sort by cleared" title="Sort by cleared">Ⓒ</button></th></tr></thead><tbody>`;
      if (A.ui.inl && A.ui.inl.id === 'new') h += inlRow(null, all, showBal, rv);
      const cols = (selOn() ? 1 : 0) + (rv.flags ? 1 : 0) + (all ? 1 : 0) + 6 + (showBal ? 1 : 0) + 1;
      const rowOf = t => A.ui.inl && A.ui.inl.id === t.id ? inlRow(t, all, showBal, rv) : txTr(t, all, showBal ? run[t.id] : null);
      const pend = list.filter(t => t.pend), rest = list.filter(t => !t.pend);
      if (pend.length) { h += `<tr class="pend-h"><td colspan="${cols}"><button class="cellbtn" data-a="pendToggle">${A.ui.pendCol ? I.right : I.down} Pending Transactions <span class="muted">(${pend.length})</span></button></td></tr>`; if (!A.ui.pendCol) for (const t of pend) h += rowOf(t); }
      for (const t of rest.slice(0, lim)) h += rowOf(t);
      h += `</tbody></table></div>`;
    } else {
      let day = '';
      for (const t of list.slice(0, lim)) {
        if (t.date !== day) { if (day) h += `</div>`; day = t.date; h += `<div class="day">${dayLabel(t.date)}</div><div class="card">`; }
        h += txRow(t, all, null);
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
  if (t._legs) {
    const rv = regView(), lead = t._legs[0];
    const head = `<tr data-tid="${lead.id}" data-a="grpEdit" data-id="${lead.id}" class="rowclick ${t._legs.some(l => l.approved === false) ? 'unapproved' : ''}">
      ${selOn() ? `<td><input type="checkbox" class="chk" data-c="selTx" data-id="${lead.id}" ${A.ui.selected.has(lead.id) ? 'checked' : ''} aria-label="Select"></td>` : ''}${rv.flags ? '<td></td>' : ''}${all ? `<td class="ellip" style="max-width:150px">${esc(L.acct[lead.acct]?.name || '')}</td>` : ''}
      <td class="num">${fmtDate(lead.date)}</td><td><strong>${esc(legPayee(t._legs))}</strong></td><td class="muted">Split (${t._legs.length})</td><td class="muted ellip" style="max-width:200px">${esc(lead.memo || '')}</td>
      <td class="r num">${t.amount < 0 ? fmt(-t.amount) : ''}</td><td class="r num amt-pos">${t.amount > 0 ? fmt(t.amount) : ''}</td>${runBal != null ? `<td class="r num muted">${fmt(runBal)}</td>` : ''}<td class="r">${t._legs.some(l => l.approved === false) ? `<button class="btn sm pri" data-a="grpApprove" data-id="${lead.id}">Approve</button>` : clrBtn(lead)}</td></tr>`;
    return head + t._legs.map(l => `<tr class="leg rowclick" data-a="txEditSheet" data-id="${l.id}">${selOn() ? '<td></td>' : ''}${rv.flags ? '<td></td>' : ''}${all ? '<td></td>' : ''}<td></td><td></td><td class="leg-c">↳ ${esc(legLabel(l))}</td><td class="muted">${esc(l.memo || '')}</td><td class="r num muted">${l.amount < 0 ? fmt(-l.amount) : ''}</td><td class="r num muted">${l.amount > 0 ? fmt(l.amount) : ''}</td>${runBal != null ? '<td></td>' : ''}<td></td></tr>`).join('');
  }
  const cl = txCatLabel(t); const need = cl === 'Category Needed';
  return `<tr data-tid="${t.id}" data-a="txEdit" data-id="${t.id}" class="rowclick ${t.approved === false ? 'unapproved' : ''}">
    ${selOn() ? `<td><input type="checkbox" class="chk" data-c="selTx" data-id="${t.id}" ${A.ui.selected.has(t.id) ? 'checked' : ''} aria-label="Select"></td>` : ''}
    ${regView().flags ? `<td style="width:10px">${t.flag ? `<span class="flag" style="background:var(--flag-${t.flag})" title="${esc(flagName(t.flag))}"></span>` : ''}</td>` : ''}
    ${all ? `<td class="ellip" style="max-width:150px">${esc(L.acct[t.acct]?.name || '')}</td>` : ''}
    <td class="num">${fmtDate(t.date)}</td>
    <td><button class="cellbtn" data-a="txEdit" data-id="${t.id}">${esc(payeeName(t) || '—')}</button>${t.img && regView().img ? ` <button class="cellbtn" data-a="imgView" data-id="${t.id}" title="View image" aria-label="View image">📎</button>` : ''}${t.matched ? ` <span class="muted" title="Matched with an imported bank transaction">⇄</span>` : ''}</td>
    <td class="${need ? 'todo' : ''}">${t.transferAcct && !t.cat ? esc(cl) : `<button class="cellbtn catcell ${need ? 'todo' : ''}" data-a="catPick" data-id="${t.id}">${t.cat && L.cat[t.cat] && L.group[L.cat[t.cat].gid] && !(t.splits && t.splits.length) ? `<span class="muted">${esc(L.group[L.cat[t.cat].gid].name)}: </span>` : ''}${esc(cl || '—')}</button>`}</td>
    <td class="muted ellip" style="max-width:200px">${esc(t.memo || '')}</td>
    <td class="r num">${t.amount < 0 ? fmt(-t.amount) : ''}</td>
    <td class="r num amt-pos">${t.amount > 0 ? fmt(t.amount) : ''}</td>
    ${runBal != null ? `<td class="r num muted">${fmt(runBal)}</td>` : ''}
    <td class="r">${clrBtn(t)}</td></tr>`;
}
function txRow(t, showAcct, runBal) {
  if (t._legs) { const lead = t._legs[0];
    return `<div data-tid="${lead.id}" class="tx ${t._legs.some(l => l.approved === false) ? 'unapproved' : ''}">
      <button class="main-b" data-a="grpEdit" data-id="${lead.id}"><span class="p ellip">${esc(legPayee(t._legs))}</span><span class="legchips">${t._legs.map(l => `<span class="legchip">${esc(legLabel(l))} <b class="num">${fmt(l.amount)}</b></span>`).join('')}</span></button>
      <div><div class="a ${t.amount > 0 ? 'amt-pos' : ''}">${t.amount > 0 ? '+' : ''}${fmt(t.amount)}</div>${runBal != null ? `<div class="rb num">${fmt(runBal)}</div>` : ''}</div>
      ${t._legs.some(l => l.approved === false) ? `<button class="btn sm pri" data-a="grpApprove" data-id="${lead.id}">Approve</button>` : clrBtn(lead)}</div>`; }
  let c = txCatLabel(t); const todo = c === 'Category Needed';
  if (showAcct) c = (L.acct[t.acct]?.name || '') + (c ? ' · ' + c : '');
  if (t.memo) c += (c ? ' · ' : '') + t.memo;
  return `<div data-tid="${t.id}" class="tx ${t.approved === false ? 'unapproved' : ''}">
    ${A.ui.select ? `<input type="checkbox" class="chk" data-c="selTx" data-id="${t.id}" ${A.ui.selected.has(t.id) ? 'checked' : ''} aria-label="Select">` : ''}
    ${t.flag ? `<span class="flag" style="background:var(--flag-${t.flag})"></span>` : ''}
    <button class="main-b" data-a="txEdit" data-id="${t.id}"><span class="p ellip">${esc(payeeName(t) || 'No payee')}</span><span class="c ellip ${todo ? 'todo' : ''}">${esc(c)}</span></button>
    <div><div class="a ${t.amount > 0 ? 'amt-pos' : ''}">${t.amount > 0 ? '+' : ''}${fmt(t.amount)}</div>${runBal != null ? `<div class="rb num">${fmt(runBal)}</div>` : ''}</div>
    ${clrBtn(t)}</div>`;
}
function actionBar() {
  const n = A.ui.selected.size, ts = A.tx.filter(t => A.ui.selected.has(t.id));
  const un = ts.some(t => t.approved === false), rj = ts.some(t => t.approved === false && isBankImp(t));
  return `<div role="toolbar" aria-label="Bulk actions"><button data-a="bulk" data-k="none" aria-label="Deselect all" title="Deselect all">${I.close.replace('<svg', '<svg width="16" height="16"')}</button><span style="padding:0 8px; font-weight:800; white-space:nowrap">${n} Transaction${n > 1 ? 's' : ''}</span>
    ${un ? `<button data-a="bulk" data-k="approve">${I.check} Approve</button>` : ''}${rj ? `<button data-a="bulk" data-k="reject">⊗ Reject</button>` : ''}<button data-a="bulk" data-k="cat">Categorize</button><button data-a="barMore">⋯ More</button></div>`;
}

/* ---------- loan account: YNAB-style progress (past balance, original schedule, current track) ---------- */
function loanPanel(a) {
  const own = A.tx.filter(t => t.acct === a.id).sort((x, y) => x.date < y.date ? -1 : 1);
  if (!own.length) return '';
  const cur = curMonth(), first = monthOf(own[0].date);
  const r = (a.rate || 0) / 100 / 12, P = a.minPay || 0;
  // YNAB accrues loan interest every month but hands it over as one balance adjustment: spread it back over the months (by balance) for the curve
  const isAdj = t => /^(YNAB balance adjustment|Ajustement YNAB)/i.test(L.payee[t.payee]?.name || '');
  const adj = own.filter(isAdj).reduce((x, t) => x + t.amount, 0);
  const past = []; let run = 0, i = 0; const rawB = [];
  for (let m = first; m <= cur; m = addMonths(m, 1)) { while (i < own.length && monthOf(own[i].date) <= m) { if (!isAdj(own[i])) run += own[i].amount; i++; } rawB.push([m, run]); }
  const firstPay = rawB.findIndex((x, k) => k && x[1] > rawB[k - 1][1]); // interest only builds up once repayments start
  const w = rawB.map((x, k) => k >= Math.max(0, firstPay) ? Math.max(0, -x[1]) : 0), wsum = w.reduce((x, y) => x + y, 0) || 1; let acc = 0;
  rawB.forEach((x, k) => { acc += adj * w[k] / wsum; past.push([x[0], Math.max(0, -Math.round(x[1] + acc))]); });
  const step = b => Math.max(0, b + Math.round(b * r) - P);
  // original schedule: like the bank's amortization table — flat while repayments are deferred, then the fixed monthly payment
  const fp = past.findIndex((x, k) => k && x[1] < past[k - 1][1] - (P ? P / 2 : 0));
  const orig = []; if (P > 0) { let b = past[0][1]; for (let m = first, k = 0; k < 600 && b > 0; m = addMonths(m, 1), k++) { if (fp > 0 && k >= fp) b = step(b); orig.push([m, b]); } if (b <= 0 && orig.length) orig.push([addMonths(orig[orig.length - 1][0], 1), 0]); }
  const bal = past[past.length - 1][1];
  const fut = []; if (P > 0 && bal > 0 && P > Math.round(bal * r)) { let b = bal; for (let m = cur, k = 0; k < 600; m = addMonths(m, 1), k++) { fut.push([m, b]); if (b <= 0) break; b = step(b); } }
  // a month's payment is made during that month (like YNAB): the loan is paid off in the month of the last payment
  const payoff = fut.length > 1 ? fut[fut.length - 2][0] : null, n = fut.length > 1 ? fut.length - 2 : 0;
  const top = Math.max(...past.map(x => x[1]), ...orig.map(x => x[1]), 1);
  const end = [past, orig, fut].reduce((mx, l) => l.length && l[l.length - 1][0] > mx ? l[l.length - 1][0] : mx, cur);
  const months = (x, y) => (+y.slice(0, 4) - +x.slice(0, 4)) * 12 + (+y.slice(5, 7) - +x.slice(5, 7));
  const span = Math.max(1, months(first, end)), W = DESK() ? 640 : 360, H = DESK() ? 220 : 200, L0 = 56, B = 26, T = 10, R = 8;
  const X = m => L0 + (W - L0 - R) * months(first, m) / span, Y = v => T + (H - T - B) * (1 - v / top);
  const path = l => l.map((pt, k) => (k ? 'L' : 'M') + X(pt[0]).toFixed(1) + ' ' + Y(pt[1]).toFixed(1)).join(' ');
  const raw = top / 4, pw = Math.pow(10, Math.floor(Math.log10(raw))); const tick = Math.ceil(raw / pw * 2) / 2 * pw;
  let grid = ''; for (let v = 0; v <= top; v += tick) grid += `<line x1="${L0}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="lg-grid"/><text x="${L0 - 6}" y="${Y(v) + 4}" text-anchor="end" class="lg-t">${Math.round(v / 100).toLocaleString('fr-FR')}€</text>`;
  let xl = ''; const years = new Set(); for (let m = first; m <= end; m = addMonths(m, 1)) if (m === first || m.endsWith('-01')) { const y = m.slice(2, 4); if (years.has(y)) continue; years.add(y); xl += `<text x="${X(m)}" y="${H - 6}" text-anchor="middle" class="lg-t">${MSHORT[+m.slice(5, 7) - 1]} '${y}</text>`; }
  if (years.size > 8) xl = xl.split('</text>').filter((t, k) => t && k % 2 === 0).map(t => t + '</text>').join('');
  const area = path(past) + ` L${X(past[past.length - 1][0]).toFixed(1)} ${Y(0)} L${X(first)} ${Y(0)} Z`;
  const pct = past[0][1] ? Math.round(bal / past[0][1] * 1000) / 10 : 0;
  const stat = (v, l) => `<div><span class="num">${v}</span><small>${l}</small></div>`;
  const yrs = Math.floor(n / 12), mos = n % 12;
  return `<div class="balbar loan-stats">${stat(fmt(bal), 'Remaining Balance')}${stat((a.rate || 0).toLocaleString('fr-FR') + '%', 'Interest Rate')}${stat(P ? fmt(P) : '—', 'Minimum Payment')}${stat(payoff ? MSHORT[+payoff.slice(5, 7) - 1] + ' ' + payoff.slice(0, 4) : '—', 'Payoff Date')}</div>
  <div class="card loan-card"><div class="loan-h"><strong>Your Loan's Progress</strong><span class="row" style="gap:8px"><button class="btn sm" data-a="loanUpd" data-id="${a.id}">Update Balance</button><button class="btn sm" data-a="loanPlanner" data-id="${a.id}">Open Payoff Simulator</button></span></div>
    <div class="small muted">Balance Remaining</div><div class="loan-big num">${fmt(bal)} <span class="muted" style="font-size:15px">(${pct.toLocaleString('fr-FR')}%)</span></div>
    <div class="loan-chart" data-loan='${esc(JSON.stringify({ W, L0, R, T, B, H, first, span, top, past, orig, fut }))}'><svg viewBox="0 0 ${W} ${H}" class="loan-svg" role="img" aria-label="Loan balance over time">${grid}<path d="${area}" class="lg-area"/><path d="${path(past)}" class="lg-past"/>${orig.length ? `<path d="${path(orig)}" class="lg-orig"/>` : ''}${fut.length ? `<path d="${path(fut)}" class="lg-fut"/>` : ''}${xl}<g class="lg-hov"></g></svg><div class="lg-tip" hidden></div></div>
    <div class="loan-leg small"><span><i class="lk past"></i>Past Balance</span>${orig.length ? '<span><i class="lk orig"></i>Original Payment Schedule</span>' : ''}${fut.length ? '<span><i class="lk fut"></i>Current Track</span>' : ''}</div>
    ${P ? `<div class="loan-track">${fut.length ? `Your monthly payment of <strong class="num">${fmt(P)}</strong> keeps you on track to pay off this loan in ${yrs ? yrs + ' yr' + (yrs > 1 ? 's' : '') + ', ' : ''}${mos} mo${mos > 1 ? 's' : ''}` : bal <= 0 ? 'Paid off 🎉' : 'Your payment does not cover the interest.'}</div>` : `<div class="loan-track">Add the minimum payment in <button class="linkbtn" data-a="acctEdit" data-id="${a.id}">Edit Account</button> to see your payoff date.</div>`}
  </div>`;
}

/* loan chart hover: month, original schedule, past balance / current track (like YNAB) */
document.addEventListener('pointermove', e => {
  const box = e.target.closest && e.target.closest('.loan-chart'); const all = document.querySelectorAll('.loan-chart .lg-tip:not([hidden])');
  if (!box) { all.forEach(t => { t.hidden = true; t.parentElement.querySelector('.lg-hov').innerHTML = ''; }); return; }
  let d; try { d = JSON.parse(box.dataset.loan); } catch (x) { return; }
  const svg = box.querySelector('svg'), r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * d.W;
  const k = Math.round((sx - d.L0) / (d.W - d.L0 - d.R) * d.span); if (k < 0 || k > d.span) return;
  const m = addMonths(d.first, k), find = l => (l.find(p => p[0] === m) || [])[1];
  const X = d.L0 + (d.W - d.L0 - d.R) * k / d.span, Y = v => d.T + (d.H - d.T - d.B) * (1 - v / d.top);
  const o = find(d.orig), pb = find(d.past), ft = find(d.fut);
  box.querySelector('.lg-hov').innerHTML = `<line x1="${X}" x2="${X}" y1="${d.T}" y2="${d.H - d.B}" class="lg-vl"/>` + (o != null ? `<circle cx="${X}" cy="${Y(o)}" r="5" class="lg-dot o"/>` : '') + (pb != null ? `<circle cx="${X}" cy="${Y(pb)}" r="5" class="lg-dot p"/>` : ft != null ? `<circle cx="${X}" cy="${Y(ft)}" r="5" class="lg-dot p"/>` : '');
  const tip = box.querySelector('.lg-tip'); const row = (cls, l, v) => `<div class="lt-r"><span><i class="lk ${cls}"></i>${l}</span><b class="num">${fmt(v)}</b></div>`;
  tip.innerHTML = `<div class="lt-h">${cap(MONTHS[+m.slice(5, 7) - 1])} ${m.slice(0, 4)}</div>` + (o != null ? row('orig', 'Original Payment Schedule', o) : '') + (pb != null ? row('', 'Past Balance', pb) : ft != null ? row('fut', 'Current Track', ft) : '');
  tip.hidden = false; const br = box.getBoundingClientRect(), px = e.clientX - br.left;
  tip.style.left = Math.min(Math.max(8, px + 14), br.width - tip.offsetWidth - 8) + 'px'; tip.style.top = Math.max(0, e.clientY - br.top - tip.offsetHeight - 12) + 'px';
});

/* ---------- inline transaction editing in the register (desktop), like YNAB ---------- */
function inlRow(t, all, showBal, rv) {
  const id = A.acct === 'all' ? null : A.acct;
  const acct = t ? t.acct : (A.ui.inl.acct || id || A.plan.accounts.find(a => !a.closed && onBudget(a))?.id);
  const tr = t?.transferAcct ? trLabel(t.transferAcct, t.acct) : (t ? payeeName(t) || '' : '');
  const a = L.acct[acct], tb = t?.transferAcct ? L.acct[t.transferAcct] : null;
  const catOff = !onBudget(a) || (tb && onBudget(tb));
  const out = t && t.amount < 0 ? fmtIn(-t.amount) : '', inn = t && t.amount > 0 ? fmtIn(t.amount) : '';
  const cols = (selOn() ? 1 : 0) + (rv.flags ? 1 : 0) + (all ? 1 : 0) + 6 + (showBal ? 1 : 0) + 1;
  const pl = A.plan.payees.filter(y => !/^(starting balance|transfer)/i.test(y.name)).map(y => `<option value="${esc(y.name)}">`).join('') + A.plan.accounts.filter(x => !x.closed && x.id !== acct).map(x => `<option value="${esc(trLabel(x.id, acct))}">`).join('');
  return `<tr class="inl" data-inl="${t ? t.id : 'new'}">
    ${selOn() ? '<td></td>' : ''}${rv.flags ? `<td style="width:10px">${t?.flag ? `<span class="flag" style="background:var(--flag-${t.flag})"></span>` : ''}</td>` : ''}
    ${all ? `<td><select class="in inl-in" id="inlAcct">${A.plan.accounts.filter(x => !x.closed).map(x => `<option value="${x.id}" ${x.id === acct ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></td>` : `<input type="hidden" id="inlAcct" value="${acct}">`}
    <td><input class="in inl-in" type="date" id="inlDate" value="${t ? t.date : (A.ui.inl.date || todayISO())}"></td>
    <td><input class="in inl-in" id="inlPayee" list="inlPayees" value="${esc(tr)}" placeholder="Payee" autocomplete="off"><datalist id="inlPayees">${pl}</datalist></td>
    <td>${t?.splits?.length ? `<button class="btn sm" data-a="inlMore">Split (Multiple Categories)…</button>` : `<select class="in inl-in" id="inlCat" ${catOff ? 'disabled' : ''}>${catOff ? '<option value="">Category not needed</option>' : catOptions(t?.cat || '', { amounts: true })}</select>`}</td>
    <td><input class="in inl-in" id="inlMemo" value="${esc(t?.memo || '')}" placeholder="Memo"></td>
    <td class="r"><input class="in inl-in r" id="inlOut" inputmode="decimal" value="${out}" placeholder="Outflow"></td>
    <td class="r"><input class="in inl-in r" id="inlIn" inputmode="decimal" value="${inn}" placeholder="Inflow"></td>
    ${showBal ? '<td></td>' : ''}<td></td></tr>
  <tr class="inl inl-btns"><td colspan="${cols}"><div class="row" style="justify-content:flex-end; gap:8px">
    <button class="btn sm" data-a="inlMore" title="Split, flag, repeat…">More…</button><span style="flex:1"></span>
    <button class="btn sm" data-a="inlCancel">Cancel</button>${t ? '' : `<button class="btn sm" data-a="inlSave" data-again="1">Save and add another</button>`}<button class="btn sm pri" data-a="inlSave">Save</button></div></td></tr>`;
}

/* sortable register columns (click a header, click again to reverse), like YNAB */
function sth(k, label, cls = '') {
  const so = A.ui.sort || { k: 'date', d: -1 }, on = so.k === k;
  return `<th class="${cls} sortable ${on ? 'on' : ''}" data-col="${k}" style="${(A.ui.colW || {})[k] ? `width:${A.ui.colW[k]}px` : ''}"><button class="sortb" data-a="regSort" data-k="${k}" aria-label="Sort by ${label}">${label}<span class="sarr">${on ? (so.d > 0 ? '▲' : '▼') : '▾'}</span></button><span class="colgrip" data-grip="${k}" aria-hidden="true"></span></th>`;
}

const selOn = () => A.ui.select || (DESK() && A.view !== 'plan' && A.view !== 'reflect' && A.view !== 'settings');

/* ---------- split groups: one bank line split between categories AND a transfer (YNAB sub-transactions) ---------- */
// legs share t.grp, or come from the same bank line (importId "x" + "x#2"…)
function legKey(t) { if (t.grp) return 'g:' + t.grp; if (t.importId && /^ebp?:/.test(t.importId)) return 'i:' + t.acct + ':' + t.importId.split('#')[0]; return null; }
function txLegs(t) { const k = legKey(t); if (!k) return [t]; const l = A.tx.filter(x => x.acct === t.acct && legKey(x) === k); return l.length > 1 ? l.sort((a, b) => (a.importId || '').length - (b.importId || '').length || (a.transferAcct ? 1 : 0) - (b.transferAcct ? 1 : 0)) : [t]; }
function collapseLegs(list) {
  const seen = new Set(), out = [];
  for (const t of list) { const k = legKey(t); if (!k) { out.push(t); continue; } if (seen.has(k)) continue; const legs = txLegs(t); if (legs.length < 2) { out.push(t); continue; } seen.add(k); out.push(Object.assign(Object.create(t), { _legs: legs, amount: legs.reduce((a, x) => a + x.amount, 0), id: legs[0].id })); }
  return out;
}
const legLabel = l => l.transferAcct ? trLabel(l.transferAcct, l.acct) : (txCatLabel(l) || 'Category Needed');
const legPayee = legs => { const p = legs.find(l => !l.transferAcct && l.payee); return p ? payeeName(p) : payeeName(legs[0]) || 'Split'; };
