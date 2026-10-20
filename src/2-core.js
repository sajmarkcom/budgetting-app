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
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MSHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function monthLabel(m, short) { const [y, mo] = m.split('-').map(Number); return short ? MSHORT[mo - 1] + ' ' + String(y).slice(2) : cap(MONTHS[mo - 1]) + ' ' + y; }
function parseISO(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
function dayLabel(iso) {
  const t = todayISO();
  if (iso === t) return "Aujourd'hui";
  if (iso === addDays(t, -1)) return 'Hier';
  if (iso === addDays(t, 1)) return 'Demain';
  const d = parseISO(iso);
  return cap(DAYS[d.getDay()]) + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
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
  return _nf.format(Object.is(v, -0) ? 0 : v).replace('-', '−');
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
  checking: { label: 'Compte courant', grp: 'budget' },
  savings: { label: 'Épargne', grp: 'budget' },
  cash: { label: 'Espèces', grp: 'budget' },
  credit: { label: 'Carte de crédit', grp: 'budget', credit: true },
  loc: { label: 'Ligne de crédit / découvert', grp: 'budget', credit: true },
  mortgage: { label: 'Prêt immobilier', grp: 'loan', debt: true },
  auto: { label: 'Prêt auto', grp: 'loan', debt: true },
  student: { label: 'Prêt étudiant', grp: 'loan', debt: true },
  personal: { label: 'Prêt personnel', grp: 'loan', debt: true },
  medical: { label: 'Dette médicale', grp: 'loan', debt: true },
  otherdebt: { label: 'Autre dette', grp: 'loan', debt: true },
  asset: { label: 'Actif (suivi)', grp: 'tracking' },
  liability: { label: 'Passif (suivi)', grp: 'tracking', debt: true },
};
const onBudget = a => !!a && ACCT[a.type]?.grp === 'budget';
const isCredit = a => !!a && !!ACCT[a.type]?.credit;
const isDebt = a => !!a && !!ACCT[a.type]?.debt;

const FREQ = {
  never: 'Jamais', daily: 'Chaque jour', weekly: 'Chaque semaine', biweekly: 'Toutes les 2 semaines', twicemonth: 'Deux fois par mois',
  every4w: 'Toutes les 4 semaines', monthly: 'Chaque mois', bimonthly: 'Tous les 2 mois', quarterly: 'Chaque trimestre', every4m: 'Tous les 4 mois',
  semiannual: 'Deux fois par an', yearly: 'Chaque année', every2y: 'Tous les 2 ans'
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

const FLAGS = [['red', 'Rouge'], ['orange', 'Orange'], ['yellow', 'Jaune'], ['green', 'Vert'], ['blue', 'Bleu'], ['purple', 'Violet']];

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
    g('Charges fixes', ['Loyer', 'Électricité & gaz', 'Internet & mobile', 'Assurances', 'Abonnements']),
    g('Quotidien', ['Courses', 'Transport', 'Restaurants & sorties', 'Santé', 'Shopping']),
    g('Objectifs', ['Épargne de précaution', 'Vacances', 'Cadeaux']),
    g('Plaisirs', ['Loisirs', 'Imprévus']),
  ];
  const p = {
    id: uid(), name: name || 'Mon budget', currency: 'EUR', dateFmt: 'dmy', startMonth: curMonth(), createdAt: Date.now(), updatedAt: Date.now(), rev: '',
    accounts: [], groups: [{ id: 'g_cc', name: 'Paiements carte de crédit', sys: 'cc' }], cats: [], assigned: {}, moves: [], payees: [], rules: [], scheduled: [], notes: {},
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
const catName = id => id === 'rta' ? 'Revenu à répartir' : (L.cat[id] ? ((L.cat[id].emoji ? L.cat[id].emoji + ' ' : '') + L.cat[id].name) : '');
function payeeName(t) {
  if (t.transferAcct) return 'Virement ' + (t.amount < 0 ? '→ ' : '← ') + (L.acct[t.transferAcct]?.name || 'compte supprimé');
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
      if (ln.cat === 'rta') { income[m] = (income[m] || 0) + ln.amount; continue; }
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
  monthly: 'Chaque mois', weekly: 'Chaque semaine', yearly: 'Chaque année', date: 'À une date', balance: 'Avoir un solde de', debt: 'Remboursement mensuel'
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
  if (snoozed) label = 'Objectif en pause ce mois-ci';
  else if (under > 0) label = 'Encore ' + fmt(under) + ' ce mois-ci';
  else if (['yearly', 'date', 'balance'].includes(t.type) && x.carry + x.assigned >= t.amount) label = 'Objectif atteint';
  else label = 'Financé pour ce mois-ci';
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
  if (_aom && _aomV === A.calcV) return _aom;
  const inflows = [], outflows = [];
  for (const t of A.tx) {
    const a = L.acct[t.acct]; if (!onBudget(a) || isCredit(a)) continue;
    if (t.transferAcct && onBudget(L.acct[t.transferAcct]) && !isCredit(L.acct[t.transferAcct])) continue;
    if (t.amount > 0) inflows.push({ date: t.date, left: t.amount }); else if (t.amount < 0) outflows.push({ date: t.date, amt: -t.amount });
  }
  inflows.sort((a, b) => a.date < b.date ? -1 : 1); outflows.sort((a, b) => a.date < b.date ? -1 : 1);
  let qi = 0; const ages = [];
  for (const o of outflows) {
    let need = o.amt, w = 0, got = 0;
    while (need > 0 && qi < inflows.length) {
      const inf = inflows[qi]; if (inf.date > o.date) break;
      const take = Math.min(need, inf.left); w += take * daysBetween(inf.date, o.date); got += take; need -= take; inf.left -= take; if (inf.left <= 0) qi++;
    }
    if (got > 0) ages.push({ date: o.date, age: w / got });
  }
  const at = upto => { const s = ages.filter(a => a.date <= upto).slice(-10); return s.length ? Math.round(s.reduce((x, y) => x + y.age, 0) / s.length) : null; };
  _aom = { now: at('9999-12-31'), at }; _aomV = A.calcV;
  return _aom;
}

/* ---------- storage: local cache + db sync ---------- */
const LKEY = 'pecule.v1';
let DB = null, unsubCore = null, saveTimer = null, lastSavedMonths = {}, lastRev = '';
function localSaveAll() {
  try {
    const raw = localStorage.getItem(LKEY); const all = raw ? JSON.parse(raw) : { plans: {} };
    all.index = A.index; if (A.plan) all.plans[A.plan.id] = { plan: A.plan, tx: A.tx };
    localStorage.setItem(LKEY, JSON.stringify(all));
  } catch (e) { }
}
function localLoad() { try { const raw = localStorage.getItem(LKEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function localGetPlan(id) { const all = localLoad(); return all?.plans?.[id] || null; }
function localDeletePlan(id) { try { const all = localLoad(); if (all?.plans) { delete all.plans[id]; localStorage.setItem(LKEY, JSON.stringify(all)); } } catch (e) { } }

function scheduleSave() {
  A.calcV++; rebuildLookups();
  if (A.plan) { A.plan.updatedAt = Date.now(); A.plan.rev = uid(); }
  A.index.updatedAt = Date.now();
  const ent = A.index.plans.find(x => x.id === A.plan?.id); if (ent) ent.name = A.plan.name;
  localSaveAll();
  clearTimeout(saveTimer); saveTimer = setTimeout(dbSave, 700);
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
      A.plan = got.plan; A.tx = got.tx; A.calcV++; rebuildLookups(); localSaveAll(); render(); toast('Mis à jour depuis un autre appareil');
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
  if (!got) { toast('Budget introuvable'); return; }
  A.plan = got.plan; A.tx = got.tx; A.index.current = id; A.undo = []; A.redo = [];
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
  const s = JSON.parse(u.snap); A.plan = s.plan; A.tx = s.tx; scheduleSave(); render(); toast('Annulé : ' + u.label);
}
function redo() {
  const r = A.redo.pop(); if (!r) return;
  A.undo.push({ snap: snapshot(), label: r.label });
  const s = JSON.parse(r.snap); A.plan = s.plan; A.tx = s.tx; scheduleSave(); render(); toast('Rétabli : ' + r.label);
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
    A.tx.push({ id: uid(), acct: a.id, date: date || todayISO(), payee: getPayee('Solde initial').id, cat, memo: '', amount: balance, cleared: 'c', flag: null, approved: true });
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
