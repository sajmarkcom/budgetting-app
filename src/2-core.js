/* ================= Budget — core: utils, model, storage, budget engine ================= */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const todayISO = () => isoOf(new Date());
const curMonth = () => todayISO().slice(0, 7);
const monthOf = iso => iso.slice(0, 7);
function addMonths(m, n) { let [y, mo] = m.split('-').map(Number); mo += n; y += Math.floor((mo - 1) / 12); mo = ((mo - 1) % 12 + 12) % 12 + 1; return y + '-' + pad(mo); }
function monthDiff(a, b) { const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number); return (by - ay) * 12 + (bm - am); }
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MSHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function monthLabel(m, short) { const [y, mo] = m.split('-').map(Number); return short ? MSHORT[mo - 1] + ' ' + String(y).slice(2) : cap(MONTHS[mo - 1]) + ' ' + y; }
function parseISO(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
function dayLabel(iso) {
  const t = todayISO();
  if (iso === t) return 'Today';
  if (iso === addDays(t, -1)) return 'Yesterday';
  if (iso === addDays(t, 1)) return 'Tomorrow';
  const d = parseISO(iso);
  return cap(DAYS[d.getDay()]) + ', ' + cap(MONTHS[d.getMonth()]) + ' ' + d.getDate() + (d.getFullYear() !== new Date().getFullYear() ? ', ' + d.getFullYear() : '');
}
function fmtDate(iso) {
  if (!iso) return '';
  const f = A.plan?.dateFmt || 'dmy';
  const [y, m, d] = iso.split('-');
  return f === 'ymd' ? iso : f === 'mdy' ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
}
let _nf = null, _nfKey = '';
function fmt(c, opts = {}) {
  const cur = A.plan?.currency || 'EUR';
  const key = cur + (opts.short ? 's' : '');
  if (_nfKey !== key) { _nf = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur, minimumFractionDigits: opts.short ? 0 : 2, maximumFractionDigits: opts.short ? 0 : 2 }); _nfKey = key; }
  const v = (c || 0) / 100;
  return _nf.format(Object.is(v, -0) ? 0 : v).replace('-', '−').replace(/\s(?=[€$£])/, '');
}
const fmtS = c => fmt(c, { short: true });
const fmtIn = c => (c / 100).toFixed(2).replace('.', ',');

/* amount expression parser: "12,50", "50+12.5", "3*20" */
function evalExpr(raw) {
  let s = String(raw ?? '').replace(/[\s€$£]/g, '').replace(/−/g, '-');
  s = s.replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2').replace(/,/g, '.');
  if (!s) return null;
  if (!/^[-+*/().\d]+$/.test(s)) return null;
  let i = 0;
  const num = () => { const st = i; while (i < s.length && /[\d.]/.test(s[i])) i++; const v = parseFloat(s.slice(st, i)); if (isNaN(v)) throw 0; return v; };
  const factor = () => { if (s[i] === '-') { i++; return -factor(); } if (s[i] === '+') { i++; return factor(); } if (s[i] === '(') { i++; const v = expr(); if (s[i] !== ')') throw 0; i++; return v; } return num(); };
  const term = () => { let v = factor(); while (s[i] === '*' || s[i] === '/') { const op = s[i++]; const f = factor(); v = op === '*' ? v * f : v / f; } return v; };
  const expr = () => { let v = term(); while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const t = term(); v = op === '+' ? v + t : v - t; } return v; };
  try { const v = expr(); if (i !== s.length || !isFinite(v)) return null; return Math.round(v * 100); } catch (e) { return null; }
}

/* ---------- account types ---------- */
const ACCT = {
  checking: { label: 'Checking', grp: 'budget' },
  savings: { label: 'Savings', grp: 'budget' },
  cash: { label: 'Cash', grp: 'budget' },
  credit: { label: 'Credit Card', grp: 'budget', credit: true },
  loc: { label: 'Line of Credit', grp: 'budget', credit: true },
  mortgage: { label: 'Mortgage', grp: 'loan', debt: true },
  auto: { label: 'Auto Loan', grp: 'loan', debt: true },
  student: { label: 'Student Loan', grp: 'loan', debt: true },
  personal: { label: 'Personal Loan', grp: 'loan', debt: true },
  medical: { label: 'Medical Debt', grp: 'loan', debt: true },
  otherdebt: { label: 'Other Debt', grp: 'loan', debt: true },
  asset: { label: 'Asset (Tracking)', grp: 'tracking' },
  liability: { label: 'Liability (Tracking)', grp: 'tracking', debt: true },
};
const onBudget = a => !!a && ACCT[a.type]?.grp === 'budget';
const isCredit = a => !!a && !!ACCT[a.type]?.credit;
const isDebt = a => !!a && !!ACCT[a.type]?.debt;

const FREQ = {
  never: 'Never', daily: 'Daily', weekly: 'Weekly', biweekly: 'Every other week', twicemonth: 'Twice a month',
  every4w: 'Every 4 weeks', monthly: 'Monthly', bimonthly: 'Every other month', quarterly: 'Every 3 months', every4m: 'Every 4 months',
  semiannual: 'Twice a year', yearly: 'Yearly', every2y: 'Every other year'
};
function nextDate(iso, f) {
  const d = parseISO(iso);
  const addM = n => { const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); };
  switch (f) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'every4w': d.setDate(d.getDate() + 28); break;
    case 'twicemonth': if (d.getDate() < 15) d.setDate(d.getDate() + 15); else { d.setDate(d.getDate() - 15); addM(1); } break;
    case 'monthly': addM(1); break;
    case 'bimonthly': addM(2); break;
    case 'quarterly': addM(3); break;
    case 'every4m': addM(4); break;
    case 'semiannual': addM(6); break;
    case 'yearly': addM(12); break;
    case 'every2y': addM(24); break;
    default: return null;
  }
  return isoOf(d);
}

const FLAGS = [['red', 'Red'], ['orange', 'Orange'], ['yellow', 'Yellow'], ['green', 'Green'], ['blue', 'Blue'], ['purple', 'Purple']];

/* ---------- app state ---------- */
const A = {
  index: { plans: [], current: null, updatedAt: 0 },
  plan: null,    // current plan core
  tx: [],        // current plan transactions
  view: 'plan', month: curMonth(), acct: null, // acct: id | 'all'
  ui: { filter: 'all', edit: false, collapsed: {}, showHidden: false, regFilter: 'all', search: '', select: false, selected: new Set(), reflect: 'spending', period: '3m', groupBy: 'group' },
  undo: [], redo: [],
  sync: 'local', // local | syncing | synced | error
  calcV: 0,
};

function defaultPlan(name) {
  const g = (n, cats) => ({ id: uid(), name: n, cats });
  const groups = [
    g('Bills', ['Rent', 'Utilities', 'Phone & Internet', 'Insurance', 'Subscriptions']),
    g('Needs', ['Groceries', 'Transportation', 'Dining Out', 'Health', 'Shopping']),
    g('Goals', ['Emergency Fund', 'Vacation', 'Gifts']),
    g('Fun Money', ['Hobbies', 'Stuff I Forgot to Budget For']),
  ];
  const p = {
    id: uid(), name: name || 'My Plan', currency: 'EUR', dateFmt: 'dmy', startMonth: curMonth(), createdAt: Date.now(), updatedAt: Date.now(), rev: '',
    accounts: [], groups: [{ id: 'g_cc', name: 'Credit Card Payments', sys: 'cc' }], cats: [], assigned: {}, moves: [], payees: [], rules: [], scheduled: [], notes: {},
  };
  for (const gr of groups) { p.groups.push({ id: gr.id, name: gr.name }); for (const c of gr.cats) p.cats.push({ id: uid(), gid: gr.id, name: c, note: '', target: null }); }
  return p;
}

/* ---------- lookups (rebuilt on every change) ---------- */
let L = {};
function rebuildLookups() {
  const p = A.plan; L = { acct: {}, cat: {}, group: {}, payee: {}, payeeByName: {}, ccCat: {} };
  if (!p) return;
  for (const a of p.accounts) L.acct[a.id] = a;
  for (const g of p.groups) L.group[g.id] = g;
  for (const c of p.cats) { L.cat[c.id] = c; if (c.cc) L.ccCat[c.cc] = c; }
  for (const y of p.payees) { L.payee[y.id] = y; L.payeeByName[y.name.toLowerCase()] = y; }
}
const catName = id => id === 'rta' ? 'Inflow: Ready to Assign' : (L.cat[id] ? ((L.cat[id].emoji ? L.cat[id].emoji + ' ' : '') + L.cat[id].name) : '');
function payeeName(t) {
  if (t.transferAcct) return 'Transfer : ' + (L.acct[t.transferAcct]?.name || 'deleted account');
  return L.payee[t.payee]?.name || '';
}
function getPayee(name, create = true) {
  name = (name || '').trim(); if (!name) return null;
  let y = L.payeeByName[name.toLowerCase()];
  if (!y && create) { y = { id: uid(), name, lastCat: null }; A.plan.payees.push(y); L.payee[y.id] = y; L.payeeByName[name.toLowerCase()] = y; }
  return y;
}
function ensureCcCat(acct) {
  if (!isCredit(acct) || L.ccCat[acct.id]) return;
  const c = { id: uid(), gid: 'g_cc', name: acct.name, cc: acct.id, note: '', target: null };
  A.plan.cats.push(c); L.cat[c.id] = c; L.ccCat[acct.id] = c;
}
const txLines = t => (t.splits && t.splits.length) ? t.splits : [{ cat: t.cat, amount: t.amount, memo: t.memo }];

/* ---------- balances ---------- */
function balances() {
  const b = {};
  for (const a of A.plan.accounts) b[a.id] = { cleared: 0, uncleared: 0, working: 0 };
  for (const t of A.tx) { const x = b[t.acct]; if (!x) continue; if (t.cleared === 'u') x.uncleared += t.amount; else x.cleared += t.amount; x.working += t.amount; }
  return b;
}

/* ---------- budget engine ---------- */
let _calc = null, _calcV = -1, _calcTo = '';
function calc(toMonth) {
  toMonth = toMonth || A.month;
  const want = [toMonth, curMonth()].sort().pop();
  if (_calc && _calcV === A.calcV && _calcTo >= want) return _calc;
  const p = A.plan;
  const income = {}, cash = {}, cred = {}, credBy = {}, ccPay = {}, uncat = {};
  let minM = p.startMonth;
  for (const t of A.tx) {
    const a = L.acct[t.acct]; if (!onBudget(a)) continue;
    const m = monthOf(t.date); if (m < minM) minM = m;
    const ta = t.transferAcct ? L.acct[t.transferAcct] : null;
    if (t.transferAcct && onBudget(ta)) {
      // transfer between two budget accounts: neutral, except cash → credit = card payment
      if (isCredit(a) && !isCredit(ta)) { (ccPay[m] ||= {}); ccPay[m][a.id] = (ccPay[m][a.id] || 0) + t.amount; }
      continue;
    }
    for (const ln of txLines(t)) {
      if (ln.cat === 'rta') { if (!(isCredit(a) && ln.amount < 0)) income[m] = (income[m] || 0) + ln.amount; continue; }
      if (ln.cat === '__start') continue;
      if (!ln.cat || !L.cat[ln.cat]) { uncat[m] = (uncat[m] || 0) + ln.amount; income[m] = (income[m] || 0) + ln.amount; continue; }
      if (isCredit(a)) {
        (cred[m] ||= {}); cred[m][ln.cat] = (cred[m][ln.cat] || 0) + ln.amount;
        (credBy[m] ||= {}); (credBy[m][ln.cat] ||= {}); credBy[m][ln.cat][a.id] = (credBy[m][ln.cat][a.id] || 0) + ln.amount;
      } else { (cash[m] ||= {}); cash[m][ln.cat] = (cash[m][ln.cat] || 0) + ln.amount; }
    }
  }
  for (const m of Object.keys(p.assigned)) if (m < minM && Object.values(p.assigned[m]).some(v => v)) minM = m;
  const assignedTotalBy = {};
  for (const [m, o] of Object.entries(p.assigned)) assignedTotalBy[m] = Object.values(o).reduce((s, v) => s + v, 0);
  const res = { months: {}, minM };
  const normal = p.cats.filter(c => !c.cc), ccs = p.cats.filter(c => c.cc);
  let prev = null, rtaBase = 0, prevCashOver = 0;
  for (let m = minM; m <= want; m = addMonths(m, 1)) {
    const M = { cats: {}, income: income[m] || 0, uncat: uncat[m] || 0, assigned: 0, activity: 0, available: 0, cashOver: 0, creditOver: 0, prevCashOver };
    const fundedTo = {};
    for (const c of normal) {
      const pc = prev?.cats[c.id];
      const carry = pc && pc.available > 0 ? pc.available : 0;
      const a = p.assigned[m]?.[c.id] || 0, ca = cash[m]?.[c.id] || 0, cr = cred[m]?.[c.id] || 0;
      const base = carry + a + ca;
      const spend = -cr;
      let funded = 0;
      if (cr !== 0) {
        const by = credBy[m][c.id];
        if (spend > 0) {
          funded = Math.max(0, Math.min(spend, base));
          let left = funded; const ids = Object.keys(by).filter(k => by[k] < 0);
          ids.forEach((k, i) => { const part = i === ids.length - 1 ? left : Math.round(funded * (-by[k]) / spend); left -= part; fundedTo[k] = (fundedTo[k] || 0) + part; });
          for (const k of Object.keys(by)) if (by[k] > 0) fundedTo[k] = (fundedTo[k] || 0) - by[k];
        } else { for (const k of Object.keys(by)) fundedTo[k] = (fundedTo[k] || 0) - by[k]; }
      }
      const available = base + cr;
      let creditOver = 0, cashOver = 0;
      if (available < 0) { creditOver = Math.min(-available, Math.max(0, spend - funded)); cashOver = -available - creditOver; }
      M.cats[c.id] = { carry, assigned: a, activity: ca + cr, available, cashOver, creditOver, cashAct: ca, credAct: cr };
      M.cashOver += cashOver; M.creditOver += creditOver;
    }
    for (const c of ccs) {
      const pc = prev?.cats[c.id];
      const carry = pc && pc.available > 0 ? pc.available : 0;
      const a = p.assigned[m]?.[c.id] || 0;
      const activity = (fundedTo[c.cc] || 0) - (ccPay[m]?.[c.cc] || 0);
      const available = carry + a + activity;
      const cashOver = available < 0 ? -available : 0;
      M.cats[c.id] = { carry, assigned: a, activity, available, cashOver, creditOver: 0, payments: ccPay[m]?.[c.cc] || 0 };
      M.cashOver += cashOver;
    }
    for (const c of p.cats) { const x = M.cats[c.id]; M.assigned += x.assigned; M.activity += x.activity; M.available += x.available; }
    rtaBase += M.income - (assignedTotalBy[m] || 0) - prevCashOver;
    M.rtaBase = rtaBase;
    prevCashOver = M.cashOver;
    res.months[m] = M; prev = M;
  }
  // RTA shown for a month also subtracts money assigned in later months
  const ms = Object.keys(res.months);
  for (const m of ms) {
    let future = 0; for (const [fm, v] of Object.entries(assignedTotalBy)) if (fm > m) future += v;
    res.months[m].future = future;
    res.months[m].rta = res.months[m].rtaBase - future;
  }
  _calc = res; _calcV = A.calcV; _calcTo = want;
  return res;
}
function monthData(m) { const c = calc(m); return c.months[m] || (m < c.minM ? emptyMonth() : c.months[m]); }
function emptyMonth() { return { cats: {}, income: 0, uncat: 0, assigned: 0, activity: 0, available: 0, cashOver: 0, creditOver: 0, rta: 0, future: 0, prevCashOver: 0 }; }
function catM(m, id) { return monthData(m).cats[id] || { carry: 0, assigned: 0, activity: 0, available: 0, cashOver: 0, creditOver: 0 }; }

/* ---------- targets ---------- */
const TARGET_TYPES = {
  monthly: 'Monthly', weekly: 'Weekly', yearly: 'Yearly', date: 'By date', balance: 'Have a balance of', debt: 'Monthly debt payment'
};
function countWeekday(m, wd) { const [y, mo] = m.split('-').map(Number); const n = new Date(y, mo, 0).getDate(); let k = 0; for (let d = 1; d <= n; d++) if (new Date(y, mo - 1, d).getDay() === wd) k++; return k; }
function dueMonth(t, m) {
  if (t.type === 'yearly') { const mo = t.month || 12; const y = Number(m.slice(0, 4)); let due = y + '-' + pad(mo); if (due < m) due = (y + 1) + '-' + pad(mo); return due; }
  if (t.date && t.repeat && t.repeat > 0) { let due = t.date; while (due < m) due = addMonths(due, t.repeat); return due; }
  return t.date || null;
}
function targetInfo(c, m, x) {
  const t = c.target; if (!t || !t.amount) return null;
  x = x || catM(m, c.id);
  if (t.start && m < t.start) return null;
  const snoozed = t.snooze === m;
  let need = 0, funded = 0, total = t.amount, label = '', base = 0;
  switch (t.type) {
    case 'monthly': case 'weekly': case 'debt': {
      total = t.type === 'weekly' ? t.amount * countWeekday(m, t.weekday ?? 1) : t.amount;
      funded = (t.mode === 'refill' && t.type !== 'debt') ? x.carry + x.assigned : x.assigned;
      need = total; break;
    }
    case 'yearly': case 'date': case 'balance': {
      const due = (t.type === 'balance' && !t.date) ? null : dueMonth(t, m);
      base = x.carry;
      if (!due) { need = Math.max(0, t.amount - base); }
      else { const left = Math.max(1, monthDiff(m, due) + 1); need = Math.max(0, Math.ceil((t.amount - base) / left)); }
      funded = x.assigned; total = need;
      break;
    }
  }
  const under = snoozed ? 0 : Math.max(0, need - funded);
  let pct;
  if (['yearly', 'date', 'balance'].includes(t.type)) pct = t.amount ? Math.min(1, Math.max(0, (x.carry + x.assigned) / t.amount)) : 1;
  else pct = total ? Math.min(1, Math.max(0, funded / total)) : 1;
  if (snoozed) label = 'Snoozed';
  else if (under > 0) label = fmt(under) + ' more needed';
  else if (['yearly', 'date', 'balance'].includes(t.type) && x.carry + x.assigned >= t.amount) label = 'Funded';
  else label = 'Funded';
  return { need, funded, under, pct, label, snoozed, total };
}
function catStatus(c, m) {
  const x = catM(m, c.id); const ti = targetInfo(c, m, x);
  if (x.available < 0) return { cls: x.creditOver > 0 && x.cashOver === 0 ? 'credit' : 'bad', x, ti };
  if (ti && ti.under > 0) return { cls: 'warn', x, ti };
  if (x.available > 0) return { cls: 'good', x, ti };
  return { cls: 'zero', x, ti };
}

/* ---------- age of money ---------- */
let _aom = null, _aomV = -1;
function ageOfMoney() {
  // Same rules as YNAB: income to "À répartir" (no starting balances) is spent first-in first-out by the cash outflows of
  // budget accounts (card payments included, transfers between cash accounts excluded); average of the last 10 outflows.
  if (_aom && _aomV === A.calcV) return _aom;
  const inflows = [], outflows = [];
  const startIds = new Set([L.payeeByName['solde initial']?.id, L.payeeByName['starting balance']?.id].filter(Boolean));
  for (const t of A.tx) {
    const a = L.acct[t.acct]; if (!onBudget(a) || isCredit(a)) continue;
    const ta = t.transferAcct ? L.acct[t.transferAcct] : null;
    if (ta && onBudget(ta) && !isCredit(ta)) continue;
    if (startIds.has(t.payee)) continue;
    for (const ln of txLines(t)) {
      if (ln.amount > 0) { if (ln.cat === 'rta') inflows.push({ date: t.date, left: ln.amount }); }
      else if (ln.amount < 0) outflows.push({ date: t.date, amt: -ln.amount });
    }
  }
  inflows.sort((a, b) => a.date < b.date ? -1 : 1); outflows.sort((a, b) => a.date < b.date ? -1 : 1);
  let qi = 0; const ages = [];
  for (const o of outflows) {
    let need = o.amt, w = 0, got = 0;
    while (need > 0 && qi < inflows.length) {
      const inf = inflows[qi]; if (inf.date > o.date) break;
      const take = Math.min(need, inf.left); w += take * daysBetween(inf.date, o.date); got += take; need -= take; inf.left -= take; if (inf.left <= 0) qi++;
    }
    ages.push({ date: o.date, age: got > 0 ? w / got : 0 });
  }
  const at = upto => { const s = ages.filter(a => a.date <= upto).slice(-10); return s.length >= 10 ? Math.round(s.reduce((x, y) => x + y.age, 0) / s.length) : null; };
  _aom = { now: at('9999-12-31'), at }; _aomV = A.calcV;
  return _aom;
}

/* ---------- storage: local cache + db sync ---------- */
const LKEY = 'pecule.v1';
let DB = null, unsubCore = null, saveTimer = null, lastSavedMonths = {}, lastRev = '';
/* All plans live in memory (ALL) and are persisted to IndexedDB (no 5 MB limit); localStorage is only a legacy fallback. */
let ALL = { index: { plans: [], current: null, updatedAt: 0 }, plans: {} };
let _idb = null;
function idb() {
  if (_idb) return _idb;
  _idb = new Promise((ok, ko) => { try { const r = indexedDB.open('budget-app', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); } catch (e) { ko(e); } });
  return _idb;
}
async function idbGet(key) { const d = await idb(); return new Promise((ok, ko) => { const t = d.transaction('kv').objectStore('kv').get(key); t.onsuccess = () => ok(t.result); t.onerror = () => ko(t.error); }); }
async function idbSet(key, val) { const d = await idb(); return new Promise((ok, ko) => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(val, key); tx.oncomplete = () => ok(); tx.onerror = () => ko(tx.error); }); }
let _persistTimer = null, _persistChain = Promise.resolve();
function persistNow() { const snap = JSON.parse(JSON.stringify(ALL)); _persistChain = _persistChain.then(() => idbSet('all', snap)).catch(e => { console.warn('save', e); try { localStorage.setItem(LKEY, JSON.stringify(snap)); } catch (x) { toast('Could not save on this device: storage is full'); } }); return _persistChain; }
function localSaveAll() {
  ALL.index = A.index; if (A.plan) ALL.plans[A.plan.id] = { plan: A.plan, tx: A.tx };
  clearTimeout(_persistTimer); _persistTimer = setTimeout(persistNow, 150);
}
function localLoad() { return ALL; }
function localGetPlan(id) { return ALL.plans[id] ? JSON.parse(JSON.stringify(ALL.plans[id])) : null; }
function localDeletePlan(id) { delete ALL.plans[id]; ALL.index = A.index; persistNow(); }
async function storageBoot() {
  let got = null; try { got = await idbGet('all'); } catch (e) { }
  if (!got) { try { const raw = localStorage.getItem(LKEY); if (raw) { got = JSON.parse(raw); await idbSet('all', got); localStorage.removeItem(LKEY); } } catch (e) { } }
  if (got && got.plans) ALL = got;
  ALL.index ||= { plans: [], current: null, updatedAt: 0 }; ALL.plans ||= {};
}

/* ---------- change stamps: every record carries the time it last changed, deletions leave a tombstone,
   so two devices editing the same plan merge record by record instead of one overwriting the other ---------- */
const COLL = ['accounts', 'groups', 'cats', 'payees', 'scheduled', 'moves'];
let _stampHash = new Map();
const strip = o => { const { u, ...rest } = o; return JSON.stringify(rest); };
function stampAll(baseline) {
  const p = A.plan; if (!p) return; const now = Date.now(); p.del ||= {}; p.au ||= {};
  const doList = (name, list) => {
    const prev = _stampHash.get(name) || new Map(); const next = new Map(); (p.del[name] ||= {});
    for (const o of list) { if (!o || !o.id) continue; const h = strip(o); if (!baseline && prev.get(o.id) !== h) o.u = now; else if (baseline && !o.u) o.u = p.updatedAt || 1; next.set(o.id, h); }
    if (!baseline) for (const id of prev.keys()) if (!next.has(id)) p.del[name][id] = now;
    _stampHash.set(name, next);
  };
  doList('tx', A.tx);
  for (const c of COLL) doList(c, p[c] || []);
  if (p.bank) doList('conns', p.bank.conns || []);
  const prevA = _stampHash.get('assigned') || new Map(); const nextA = new Map();
  for (const [m, o] of Object.entries(p.assigned || {})) for (const [cid, v] of Object.entries(o)) { const k = m + '|' + cid; nextA.set(k, v); if (!baseline && prevA.get(k) !== v) p.au[k] = now; }
  if (!baseline) for (const k of prevA.keys()) if (!nextA.has(k)) p.au[k] = now;
  _stampHash.set('assigned', nextA);
  _stampHash.set('_plan', p.id);
}
function stampBaseline() { _stampHash = new Map(); stampAll(true); }
function mergeList(L, R, delL, delR) {
  const del = { ...(delR || {}) }; for (const [k, v] of Object.entries(delL || {})) del[k] = Math.max(del[k] || 0, v);
  const byId = new Map(); const order = [];
  for (const o of L || []) { byId.set(o.id, o); order.push(o.id); }
  for (const o of R || []) { const cur = byId.get(o.id); if (!cur) { byId.set(o.id, o); order.push(o.id); } else if ((o.u || 0) > (cur.u || 0)) byId.set(o.id, o); }
  return { list: order.map(id => byId.get(id)).filter(o => !(del[o.id] && del[o.id] >= (o.u || 0))), del };
}
function mergePlanPair(l, r) {
  // l, r: {plan, tx}; returns merged {plan, tx}
  const lp = l.plan, rp = r.plan; const newer = (rp.updatedAt || 0) > (lp.updatedAt || 0) ? rp : lp;
  const out = JSON.parse(JSON.stringify(newer)); out.del = {};
  for (const c of COLL) { const m = mergeList(lp[c], rp[c], lp.del?.[c], rp.del?.[c]); out[c] = m.list; out.del[c] = m.del; }
  const tm = mergeList(l.tx, r.tx, lp.del?.tx, rp.del?.tx); out.del.tx = tm.del;
  if (lp.bank || rp.bank) { const bm = mergeList(lp.bank?.conns, rp.bank?.conns, lp.del?.conns, rp.del?.conns); const seen = new Set(); out.bank = { ...(newer.bank || lp.bank || rp.bank), conns: bm.list.filter(c => !c.session || (seen.has(c.session) ? false : seen.add(c.session))) }; out.del.conns = bm.del; }
  out.au = { ...(lp.au || {}) }; out.assigned = JSON.parse(JSON.stringify(lp.assigned || {}));
  const keys = new Set([...Object.keys(lp.au || {}), ...Object.keys(rp.au || {})]);
  for (const k of keys) {
    const lu = lp.au?.[k] || 0, ru = rp.au?.[k] || 0; if (ru <= lu) continue;
    const [m, cid] = k.split('|'); const v = rp.assigned?.[m]?.[cid];
    (out.assigned[m] ||= {}); if (v) out.assigned[m][cid] = v; else delete out.assigned[m][cid]; out.au[k] = ru;
  }
  for (const [m, o] of Object.entries(rp.assigned || {})) for (const [cid, v] of Object.entries(o)) { const k = m + '|' + cid; if (!out.au[k] && out.assigned[m]?.[cid] == null) { (out.assigned[m] ||= {})[cid] = v; } }
  out.updatedAt = Math.max(lp.updatedAt || 0, rp.updatedAt || 0);
  return { plan: out, tx: tm.list };
}
function scheduleSave() {
  if (A.plan && _stampHash.get('_plan') !== A.plan.id) stampBaseline();
  if (A.plan) stampAll(false);
  A.calcV++; rebuildLookups();
  if (A.plan) { A.plan.updatedAt = Date.now(); A.plan.rev = uid(); }
  A.index.updatedAt = Date.now();
  const ent = A.index.plans.find(x => x.id === A.plan?.id); if (ent) ent.name = A.plan.name;
  localSaveAll();
  clearTimeout(saveTimer); saveTimer = setTimeout(dbSave, 700); if (typeof gdSchedule === 'function') gdSchedule();
}
function txByMonth() { const g = {}; for (const t of A.tx) (g[monthOf(t.date)] ||= []).push(t); return g; }
async function dbSave() {
  if (!DB || !A.plan) return;
  A.sync = 'syncing'; paintSync();
  try {
    const p = A.plan; lastRev = p.rev;
    await DB.doc('meta/index').set(JSON.parse(JSON.stringify(A.index)));
    await DB.doc('plans/' + p.id).set(JSON.parse(JSON.stringify(p)));
    const g = txByMonth(); const prev = lastSavedMonths[p.id] || {}; const now = {};
    const months = new Set([...Object.keys(g), ...Object.keys(prev)]);
    for (const m of months) {
      const items = g[m] || []; const s = JSON.stringify(items); now[m] = s;
      if (prev[m] === s) continue;
      await DB.doc('plans/' + p.id + '/tx/' + m).set({ items: JSON.parse(s), m });
    }
    lastSavedMonths[p.id] = now;
    A.sync = 'synced';
  } catch (e) { console.warn('sync', e); A.sync = e?.code === 'quota_exceeded' ? 'quota' : 'error'; }
  paintSync();
}
async function dbLoadPlan(id) {
  const core = await DB.doc('plans/' + id).get(); if (!core.exists) return null;
  const snap = await DB.collection('plans/' + id + '/tx').get();
  const tx = []; const saved = {};
  for (const d of snap.docs) { const items = d.data().items || []; tx.push(...items); saved[d.id] = JSON.stringify(items); }
  lastSavedMonths[id] = saved;
  return { plan: JSON.parse(JSON.stringify(core.data())), tx: JSON.parse(JSON.stringify(tx)) };
}
function watchCore() {
  if (unsubCore) { unsubCore(); unsubCore = null; }
  if (!DB || !A.plan) return;
  const id = A.plan.id;
  unsubCore = DB.doc('plans/' + id).onSnapshot(async snap => {
    if (!snap.exists || snap.metadata.hasPendingWrites) return;
    const d = snap.data();
    if (d.rev && d.rev !== A.plan.rev && d.rev !== lastRev && (d.updatedAt || 0) > (A.plan.updatedAt || 0)) {
      const got = await dbLoadPlan(id); if (!got || A.plan?.id !== id) return;
      A.plan = got.plan; A.tx = got.tx; A.calcV++; rebuildLookups(); localSaveAll(); render(); toast('Updated from another device');
    }
  }, () => { });
}
async function initDb() {
  try { DB = await window.claude?.use?.('db'); } catch (e) { DB = null; }
  if (!DB) { A.sync = 'local'; paintSync(); return; }
  try {
    A.sync = 'syncing'; paintSync();
    const idx = await DB.doc('meta/index').get();
    if (idx.exists && (idx.data().updatedAt || 0) > (A.index.updatedAt || 0)) {
      A.index = JSON.parse(JSON.stringify(idx.data()));
      const cur = A.index.current || A.index.plans[0]?.id;
      if (cur) { const got = await dbLoadPlan(cur); if (got) { A.plan = got.plan; A.tx = got.tx; A.calcV++; rebuildLookups(); runScheduled(); localSaveAll(); render(); } }
      A.sync = 'synced';
    } else if (A.plan) { await dbSave(); }
    else A.sync = 'synced';
    watchCore();
  } catch (e) { console.warn(e); A.sync = 'error'; }
  paintSync();
}
async function switchPlan(id) {
  let got = null;
  if (DB) { try { got = await dbLoadPlan(id); } catch (e) { } }
  if (!got) got = localGetPlan(id);
  if (!got) { toast('Plan not found'); return; }
  A.plan = got.plan; A.tx = got.tx; A.index.current = id; A.undo = []; A.redo = []; stampBaseline();
  A.month = curMonth(); A.view = 'plan'; A.acct = null;
  rebuildLookups(); A.calcV++; runScheduled(); scheduleSave(); watchCore(); render();
}

/* ---------- mutations with undo ---------- */
function snapshot() { return JSON.stringify({ plan: A.plan, tx: A.tx }); }
function mutate(label, fn, opts = {}) {
  const snap = snapshot();
  const r = fn();
  if (r === false) return false;
  A.undo.push({ snap, label }); if (A.undo.length > 40) A.undo.shift(); A.redo = [];
  scheduleSave(); render();
  if (!opts.silent) toast(label, true);
  return r;
}
function undo() {
  const u = A.undo.pop(); if (!u) return;
  A.redo.push({ snap: snapshot(), label: u.label });
  const s = JSON.parse(u.snap); A.plan = s.plan; A.tx = s.tx; scheduleSave(); render(); toast('Undone: ' + u.label);
}
function redo() {
  const r = A.redo.pop(); if (!r) return;
  A.undo.push({ snap: snapshot(), label: r.label });
  const s = JSON.parse(r.snap); A.plan = s.plan; A.tx = s.tx; scheduleSave(); render(); toast('Redone: ' + r.label);
}

/* ---------- domain operations ---------- */
function setAssigned(m, cid, v) { (A.plan.assigned[m] ||= {}); if (v) A.plan.assigned[m][cid] = v; else delete A.plan.assigned[m][cid]; }
function getAssigned(m, cid) { return A.plan.assigned[m]?.[cid] || 0; }
function moveMoney(m, from, to, amt, why) {
  if (from !== 'rta') setAssigned(m, from, getAssigned(m, from) - amt);
  if (to !== 'rta') setAssigned(m, to, getAssigned(m, to) + amt);
  A.plan.moves.push({ id: uid(), m, from, to, amount: amt, at: Date.now(), why: why || '' });
}
function addAccount({ name, type, balance, date, rate, minPay }) {
  const a = { id: uid(), name, type, closed: false, note: '', rate: rate || 0, minPay: minPay || 0, lastRec: null };
  A.plan.accounts.push(a); L.acct[a.id] = a; ensureCcCat(a);
  if (balance) {
    const cat = onBudget(a) && !isCredit(a) ? 'rta' : '__start';
    A.tx.push({ id: uid(), acct: a.id, date: date || todayISO(), payee: getPayee('Starting Balance').id, cat, memo: '', amount: balance, cleared: 'c', flag: null, approved: true });
  }
  return a;
}
function saveTx(d) {
  // d: draft { id?, acct, date, payee(name), cat, memo, amount, cleared, flag, splits, transferAcct, approved }
  const isNew = !d.id;
  const t = isNew ? { id: uid() } : A.tx.find(x => x.id === d.id);
  if (!t) return;
  const old = { ...t };
  t.acct = d.acct; t.date = d.date; t.memo = d.memo || ''; t.amount = d.amount; t.cleared = d.cleared || 'u'; t.flag = d.flag || null; t.approved = d.approved !== false;
  const a = L.acct[t.acct];
  if (d.transferAcct) {
    const b = L.acct[d.transferAcct];
    t.transferAcct = d.transferAcct; t.payee = null; t.splits = null;
    const needCat = onBudget(a) && !onBudget(b);
    t.cat = needCat ? (d.cat || null) : null;
    let pair = old.transferId ? A.tx.find(x => x.id === old.transferId) : null;
    if (!pair) { pair = { id: uid(), cleared: 'u', flag: null, approved: true }; A.tx.push(pair); }
    pair.acct = d.transferAcct; pair.date = t.date; pair.amount = -t.amount; pair.memo = t.memo; pair.transferAcct = t.acct; pair.transferId = t.id; pair.payee = null; pair.splits = null;
    pair.cat = (onBudget(b) && !onBudget(a)) ? (d.pairCat || pair.cat || null) : null;
    t.transferId = pair.id;
  } else {
    if (old.transferId) { A.tx = A.tx.filter(x => x.id !== old.transferId); }
    t.transferAcct = null; t.transferId = null;
    const y = getPayee(d.payee); t.payee = y ? y.id : null;
    if (d.splits && d.splits.length > 1) { t.splits = d.splits.map(s => ({ cat: s.cat || null, amount: s.amount, memo: s.memo || '' })); t.cat = null; }
    else { t.splits = null; t.cat = onBudget(a) ? (d.splits?.length === 1 ? d.splits[0].cat : d.cat) || null : (d.cat === '__start' ? '__start' : null); }
    if (y && t.cat && t.cat !== '__start') y.lastCat = t.cat;
  }
  if (isNew) A.tx.push(t);
  return t;
}
function deleteTx(ids) {
  const set = new Set(ids);
  for (const t of A.tx) if (set.has(t.id) && t.transferId) set.add(t.transferId);
  A.tx = A.tx.filter(t => !set.has(t.id));
}
function runScheduled() {
  if (!A.plan) return 0;
  const today = todayISO(); let n = 0;
  for (const s of A.plan.scheduled) {
    let guard = 0;
    while (s.next && s.next <= today && guard++ < 400) {
      saveTx({ acct: s.acct, date: s.next, payee: s.payee, cat: s.cat, memo: s.memo, amount: s.amount, transferAcct: s.transferAcct || null, splits: s.splits, cleared: 'u', approved: true, flag: s.flag });
      n++;
      s.next = s.freq === 'never' ? null : nextDate(s.next, s.freq);
    }
  }
  A.plan.scheduled = A.plan.scheduled.filter(s => s.next);
  if (n) { A.calcV++; rebuildLookups(); }
  return n;
}
function payeeRuleApply(raw) {
  const low = (raw || '').toLowerCase();
  for (const r of A.plan.rules) if (r.contains && low.includes(r.contains.toLowerCase())) return r.payee;
  return raw;
}
