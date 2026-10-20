/* ================= Budget — direct import from the YNAB API (token stays on the device, used once) ================= */
const YAPI = 'https://api.ynab.com/v1';
let YA = null;
async function yGet(path, token) {
  const r = await fetch(YAPI + path, { headers: { Authorization: 'Bearer ' + token } });
  if (r.status === 401) throw new Error('YNAB rejected the token: check it or create a new one.');
  if (r.status === 429) throw new Error('Too many requests to YNAB: try again in an hour.');
  if (!r.ok) throw new Error('YNAB responded ' + r.status);
  return (await r.json()).data;
}
function yApiBox() {
  return `<div class="card" style="padding:14px; display:flex; flex-direction:column; gap:10px">
    <strong>Recommended: direct connection</strong>
    <span class="small muted">Gets everything: accounts (closed, loans and tracking included), categories with targets and notes, assigned money for every month, transactions, splits, transfers and scheduled transactions.</span>
    <span class="small muted">On app.ynab.com → Account Settings → Developer Settings → “New Token”. Paste it here: it is used once, never saved, and only sent to YNAB. Delete it in YNAB right after.</span>
    <input id="yTok" class="in" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="YNAB personal access token" aria-label="YNAB personal access token">
    <button class="btn pri block" data-a="yLoad">Connect to YNAB</button>
    <div id="yStep"></div></div>
    <div class="sec-t"><span>Ou avec le fichier d'export</span></div>`;
}
async function yLoad() {
  const tok = ($('#yTok')?.value || '').trim(); if (!tok) return toast('Paste your YNAB token');
  const st = $('#yStep'); st.innerHTML = `<div class="small muted">Connecting…</div>`;
  try {
    let d; try { d = await yGet('/plans', tok); } catch (e) { if (/401|429/.test(e.message) || /Jeton|Trop/.test(e.message)) throw e; d = await yGet('/budgets', tok); }
    const list = d.plans || d.budgets || [];
    YA = { tok, list };
    st.innerHTML = list.length ? `<div class="card">${list.map((b, i) => `<button class="li" data-a="yPick" data-i="${i}"><span class="grow"><strong>${esc(b.name)}</strong><div class="small muted">Last modified ${esc((b.last_modified_on || '').slice(0, 10))}</div></span>${I.right}</button>`).join('')}</div>` : `<div class="banner warn">${I.info}<span>No plans found on this account.</span></div>`;
  } catch (e) { st.innerHTML = `<div class="banner bad">${I.info}<span>${esc(e.message || 'Could not connect')}</span></div>`; }
}
async function yPick(i) {
  const b = YA.list[i]; const st = $('#yStep'); st.innerHTML = `<div class="small muted">Downloading “${esc(b.name)}”…</div>`;
  try {
    let d; try { d = await yGet('/plans/' + b.id, YA.tok); } catch (e) { if (/Jeton|Trop/.test(e.message)) throw e; d = await yGet('/budgets/' + b.id, YA.tok); }
    YA.b = d.plan || d.budget; YA.tok = null; const yt = $('#yTok'); if (yt) yt.value = '';
    const B = YA.b, live = x => !x.deleted;
    st.innerHTML = `<div class="kpis" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <div class="kpi"><span>Accounts</span><b>${B.accounts.filter(live).length}</b></div><div class="kpi"><span>Categories</span><b>${B.categories.filter(live).length}</b></div>
      <div class="kpi"><span>Transactions</span><b>${B.transactions.filter(live).length}</b></div><div class="kpi"><span>Months</span><b>${(B.months || []).length}</b></div></div>
      <div class="small muted">The import creates a new plan “${esc(B.name)}”; your current plan is untouched.</div>
      <button class="btn pri block" data-a="yDo">Import everything</button>`;
  } catch (e) { st.innerHTML = `<div class="banner bad">${I.info}<span>${esc(e.message || 'Download failed')}</span></div>`; }
}
function yDo() {
  const B = YA.b; const live = x => !x.deleted; const c = v => Math.round((v || 0) / 10); // milliunits → cents
  if (A.plan) localSaveAll();
  const p = defaultPlan(B.name); p.groups = p.groups.filter(g => g.sys); p.cats = [];
  if (B.currency_format?.iso_code) p.currency = B.currency_format.iso_code;
  A.plan = p; A.tx = []; rebuildLookups();
  const TYPE = { checking: 'checking', savings: 'savings', cash: 'cash', creditCard: 'credit', lineOfCredit: 'loc', otherAsset: 'asset', otherLiability: 'liability', mortgage: 'mortgage', autoLoan: 'auto', studentLoan: 'student', personalLoan: 'personal', medicalDebt: 'medical', otherDebt: 'otherdebt' };
  const lastVal = o => { if (!o) return 0; const k = Object.keys(o).sort(); return k.length ? o[k[k.length - 1]] : 0; };
  const aId = {};
  for (const a of B.accounts.filter(live)) {
    let type = TYPE[a.type] || (a.on_budget ? 'checking' : 'asset');
    const acc = { id: uid(), name: a.name, type, closed: !!a.closed, note: a.note || '', rate: (lastVal(a.debt_interest_rates) || 0) / 1000, minPay: Math.abs(c(lastVal(a.debt_minimum_payments))), lastRec: a.last_reconciled_at ? a.last_reconciled_at.slice(0, 10) : null };
    p.accounts.push(acc); aId[a.id] = acc.id;
  }
  rebuildLookups(); for (const acc of p.accounts) ensureCcCat(acc); rebuildLookups();
  // groups & categories
  const gMap = {}, cMap = {}; let rtaId = null;
  const ccGroupIds = new Set();
  for (const g of B.category_groups.filter(live)) {
    if (/internal master category/i.test(g.name)) { gMap[g.id] = 'internal'; continue; }
    if (/credit card payments/i.test(g.name)) { gMap[g.id] = 'cc'; ccGroupIds.add(g.id); continue; }
    const ng = { id: uid(), name: g.name, hidden: !!g.hidden }; p.groups.push(ng); gMap[g.id] = ng.id;
  }
  const accByName = n => p.accounts.find(a => a.name === n);
  for (const k of B.categories.filter(live)) {
    const gm = gMap[k.category_group_id];
    if (gm === 'internal') { if (/ready to assign|to be budgeted/i.test(k.name)) rtaId = k.id; continue; }
    if (gm === 'cc') { const acc = accByName(k.name); if (acc && L.ccCat[acc.id]) cMap[k.id] = L.ccCat[acc.id].id; continue; }
    if (!gm) continue;
    const nc = { id: uid(), gid: gm, name: k.name, note: k.note || '', hidden: !!k.hidden, target: yGoal(k) };
    p.cats.push(nc); cMap[k.id] = nc.id;
  }
  rebuildLookups();
  const catOf = (id, accId) => { if (!id) return null; if (id === rtaId) return onBudget(L.acct[accId]) ? 'rta' : null; return cMap[id] || null; };
  // payees
  const yName = {}; for (const y of (B.payees || [])) yName[y.id] = y.name;
  const pay = id => { const n = yName[id]; if (!n || /^transfer\s*:/i.test(n)) return null; return getPayee(n === 'Starting Balance' ? 'Starting Balance' : n).id; };
  // transactions
  const subs = {}; for (const s of (B.subtransactions || []).filter(live)) (subs[s.transaction_id] ||= []).push(s);
  const tId = {}; const ytx = B.transactions.filter(live).filter(t => aId[t.account_id]);
  for (const t of ytx) tId[t.id] = uid();
  // split lines that are transfers (e.g. a loan payment inside a split) become their own transfer transactions
  const subT = {};
  for (const t of ytx) {
    const ss = subs[t.id]; if (!ss) continue;
    const keep = [];
    for (const s of ss) {
      if (s.transfer_account_id && aId[s.transfer_account_id]) {
        const acct = aId[t.account_id];
        const nt = { id: uid(), acct, date: t.date, payee: null, cat: catOf(s.category_id, acct), memo: s.memo || t.memo || '', amount: c(s.amount), cleared: t.cleared === 'reconciled' ? 'r' : t.cleared === 'cleared' ? 'c' : 'u', flag: t.flag_color || null, approved: true, transferAcct: aId[s.transfer_account_id] };
        if (!(onBudget(L.acct[acct]) && !onBudget(L.acct[nt.transferAcct]))) nt.cat = null;
        A.tx.push(nt); subT[nt.acct + '|' + nt.transferAcct + '|' + t.date + '|' + nt.amount] = nt;
      } else keep.push(s);
    }
    subs[t.id] = keep; t._splitOnlyTransfers = !keep.length;
  }
  for (const t of ytx) {
    if (t._splitOnlyTransfers) continue;
    const acct = aId[t.account_id];
    const tx = { id: tId[t.id], acct, date: t.date, payee: pay(t.payee_id), cat: catOf(t.category_id, acct), memo: t.memo || '', amount: c(t.amount),
      cleared: t.cleared === 'reconciled' ? 'r' : t.cleared === 'cleared' ? 'c' : 'u', flag: t.flag_color || null, approved: t.approved !== false };
    if (t.import_id) tx.importId = t.import_id;
    const ss = subs[t.id];
    if (ss && ss.length > 1) { tx.cat = null; tx.splits = ss.map(s => ({ cat: catOf(s.category_id, acct), amount: c(s.amount), memo: s.memo || '' })); tx.amount = tx.splits.reduce((x, y) => x + y.amount, 0); }
    else if (ss && ss.length === 1) { tx.cat = catOf(ss[0].category_id, acct); tx.amount = c(ss[0].amount); if (ss[0].memo) tx.memo = ss[0].memo; }
    if (t.transfer_account_id && aId[t.transfer_account_id]) {
      tx.transferAcct = aId[t.transfer_account_id]; tx.payee = null;
      if (t.transfer_transaction_id && tId[t.transfer_transaction_id]) tx.transferId = tId[t.transfer_transaction_id];
      else { const mate = subT[tx.transferAcct + '|' + acct + '|' + t.date + '|' + (-tx.amount)]; if (mate && !mate.transferId) { mate.transferId = tx.id; tx.transferId = mate.id; } }
      const a = L.acct[acct], b2 = L.acct[tx.transferAcct]; if (!(onBudget(a) && !onBudget(b2))) tx.cat = null;
    }
    const y = tx.payee && L.payee[tx.payee]; if (y && tx.cat && tx.cat !== 'rta') y.lastCat = tx.cat;
    A.tx.push(tx);
  }
  // transfers whose other side was not exported: create it so both registers balance
  for (const tx of A.tx.slice()) if (tx.transferAcct && !tx.transferId) { const m = { id: uid(), acct: tx.transferAcct, date: tx.date, amount: -tx.amount, memo: tx.memo, cleared: 'u', flag: null, approved: true, transferAcct: tx.acct, transferId: tx.id, payee: null, cat: null }; tx.transferId = m.id; A.tx.push(m); }
  // off-budget accounts (loans, tracking): YNAB can hold a balance not explained by transactions (accrued interest) — align it
  { const bal = balances(); for (const a of B.accounts.filter(live)) { const id = aId[a.id]; if (!id || onBudget(L.acct[id])) continue; const diff = c(a.balance) - bal[id].working; if (diff) A.tx.push({ id: uid(), acct: id, date: todayISO(), payee: getPayee('YNAB balance adjustment (interest)').id, cat: '__start', memo: '', amount: diff, cleared: 'c', flag: null, approved: true }); } }
  // assigned per month + month notes
  let first = curMonth();
  for (const mo of (B.months || [])) {
    const m = mo.month.slice(0, 7);
    if (mo.note) p.notes[m] = mo.note;
    for (const k of (mo.categories || [])) { const id = cMap[k.id]; if (id && k.budgeted) { setAssigned(m, id, c(k.budgeted)); if (m < first) first = m; } }
  }
  for (const t of A.tx) if (monthOf(t.date) < first) first = monthOf(t.date);
  p.startMonth = first;
  // scheduled
  const FQ = { never: 'never', daily: 'daily', weekly: 'weekly', everyOtherWeek: 'biweekly', twiceAMonth: 'twicemonth', every4Weeks: 'every4w', monthly: 'monthly', everyOtherMonth: 'bimonthly', every3Months: 'quarterly', every4Months: 'every4m', twiceAYear: 'semiannual', yearly: 'yearly', everyOtherYear: 'every2y' };
  const ssubs = {}; for (const s of (B.scheduled_subtransactions || []).filter(live)) (ssubs[s.scheduled_transaction_id] ||= []).push(s);
  for (const s of (B.scheduled_transactions || []).filter(live)) {
    const acct = aId[s.account_id]; if (!acct) continue;
    const sp = ssubs[s.id];
    p.scheduled.push({ id: uid(), acct, payee: (yName[s.payee_id] && !/^transfer\s*:/i.test(yName[s.payee_id])) ? yName[s.payee_id] : '', cat: catOf(s.category_id, acct), memo: s.memo || '', amount: c(s.amount),
      transferAcct: s.transfer_account_id ? aId[s.transfer_account_id] || null : null, splits: sp && sp.length ? sp.map(x => ({ cat: catOf(x.category_id, acct), amount: c(x.amount), memo: x.memo || '' })) : null,
      freq: FQ[s.frequency] || 'monthly', next: s.date_next || s.date_first, flag: s.flag_color || null });
  }
  A.index.plans.push({ id: p.id, name: p.name }); A.index.current = p.id; A.undo = []; A.redo = [];
  rebuildLookups(); A.calcV++;
  // verification against YNAB's balances for the current month
  const cm = curMonth(); const ym = (B.months || []).find(mo => mo.month.slice(0, 7) === cm);
  let ok = 0, tot = 0; const bad = [];
  if (ym) for (const k of ym.categories || []) { if (k.deleted) continue; const id = cMap[k.id]; if (!id) continue; tot++; const mine = catM(cm, id).available, theirs = c(k.balance); if (mine === theirs) ok++; else bad.push(`${k.name}: YNAB ${fmt(theirs)} / here ${fmt(mine)}`); }
  let accOk = 0, accTot = 0; const bal = balances();
  for (const a of B.accounts.filter(live)) { const id = aId[a.id]; if (!id) continue; accTot++; if (bal[id].working === c(a.balance)) accOk++; else bad.unshift(`Account ${a.name}: YNAB ${fmt(c(a.balance))} / here ${fmt(bal[id].working)}`); }
  const rtaY = ym && typeof ym.to_be_budgeted === 'number' ? c(ym.to_be_budgeted) : null;
  YA = null;
  scheduleSave(); watchCore(); A.view = 'plan'; A.month = cm; closeSheet(); render();
  const rtaMine = monthData(cm).rta;
  openSheet('Import Complete', `<p style="margin:0"><strong>${A.tx.length} transactions · ${accOk}/${accTot} accounts and ${ok}/${tot} categories match YNAB</strong></p>
    ${rtaY != null ? `<div class="small">Ready to Assign: YNAB ${fmt(rtaY)} · here ${fmt(rtaMine)} ${rtaY === rtaMine ? '✓' : ''}</div>` : ''}
    ${bad.length ? `<div class="banner warn">${I.info}<span>Differences to check:</span></div><div class="card">${bad.slice(0, 25).map(x => `<div class="li small">${esc(x)}</div>`).join('')}</div>` : `<div class="banner info">${I.check}<span>Everything matches YNAB.</span></div>`}
    <div class="small muted">Delete the token in YNAB now (Developer Settings).</div>`, `<button class="btn pri block" data-a="closeSheet">View my plan</button>`);
}
function yGoal(k) {
  if (!k.goal_type) return null;
  const amt = Math.round((k.goal_target || 0) / 10); const tm = k.goal_target_month ? k.goal_target_month.slice(0, 7) : null;
  const snooze = k.goal_snoozed_at ? curMonth() : null;
  switch (k.goal_type) {
    case 'MF': return { type: 'monthly', amount: amt, mode: 'set', snooze };
    case 'TB': return { type: 'balance', amount: amt, date: null, snooze };
    case 'TBD': return { type: 'balance', amount: amt, date: tm, snooze };
    case 'DEBT': return { type: 'debt', amount: amt, snooze };
    case 'NEED': {
      const mode = k.goal_needs_whole_amount === false ? 'refill' : 'set';
      const cad = k.goal_cadence; const freq = k.goal_frequency;
      if (freq === 'weekly' || cad === 2) return { type: 'weekly', amount: amt, weekday: k.goal_day ?? 1, mode, snooze };
      if (freq === 'yearly' || cad === 13) return { type: 'yearly', amount: amt, month: tm ? +tm.slice(5, 7) : 12, snooze };
      if (freq === 'monthly' || cad === 1) return { type: 'monthly', amount: amt, mode, snooze };
      if (tm) return { type: 'date', amount: amt, date: tm, repeat: cad >= 3 && cad <= 14 ? (cad === 14 ? 24 : cad - 2) : 0, snooze };
      return { type: 'monthly', amount: amt, mode, snooze };
    }
  }
  return null;
}
