function savePref(k, v) { try { const u = JSON.parse(localStorage.getItem('pecule.ui') || '{}'); u[k] = v; localStorage.setItem('pecule.ui', JSON.stringify(u)); } catch (e) { } }
/* ================= Budget — events & boot ================= */
const ACT = {
  nav: el => { A.ui.catFilter = null; A.view = el.dataset.v; A.acct = null; if (A.view === 'tx') { A.ui.regFilter = 'all'; A.ui.search = ''; A.ui.regLimit = 150; } A.ui.select = false; A.ui.selected.clear(); window.scrollTo(0, 0); render(); },
  undo: () => undo(), redo: () => redo(),
  closeSheet: () => closeSheet(),
  monthToday: () => { A.month = curMonth(); render(); },
  month: el => { A.month = addMonths(A.month, +el.dataset.d); render(); },
  filter: el => { A.ui.filter = el.dataset.f; if (A.view !== 'plan') A.view = 'plan'; render(); },
  setCompact: el => { A.ui.compact = el.dataset.v === '1'; savePref('compact', A.ui.compact); render._keepScroll = true; render(); },
  toggleEdit: () => { A.ui.edit = !A.ui.edit; render(); },
  toggleEditPlan: () => { A.view = 'plan'; A.ui.edit = true; render(); },
  toggleHidden: () => { A.ui.showHidden = !A.ui.showHidden; render(); },
  collapse: el => { const g = el.dataset.g; A.ui.collapsed[g] = !A.ui.collapsed[g]; savePref('collapsed', A.ui.collapsed); render._keepScroll = true; render(); },
  collapseAll: () => { const gs = A.plan.groups; const allCol = gs.every(g => A.ui.collapsed[g.id]); A.ui.collapsed = {}; if (!allCol) for (const g of gs) A.ui.collapsed[g.id] = true; savePref('collapsed', A.ui.collapsed); render._keepScroll = true; render(); },
  catSel: (el, e) => { if (e && e.target.closest && e.target.closest('input,textarea,select')) return; if (!DESK()) return catSheet(el.dataset.c); A.ui.selCat = A.ui.selCat === el.dataset.c ? null : el.dataset.c; if (A.ui.inspHide) { A.ui.inspHide = false; savePref('inspHide', false); } render._keepScroll = true; render(); },
  catDesel: () => { A.ui.selCat = null; render._keepScroll = true; render(); },
  inspToggle: () => { A.ui.inspHide = !A.ui.inspHide; savePref('inspHide', A.ui.inspHide); render._keepScroll = true; render(); },
  inspFold: el => { const k = el.dataset.k; A.ui.inspFold = { ...(A.ui.inspFold || {}), [k]: !(A.ui.inspFold || {})[k] }; savePref('inspFold', A.ui.inspFold); render._keepScroll = true; render(); },
  rtaSheet: (el, e) => { if (e.target.closest('.cta')) return; rtaSheet(); },
  assignSheet: (el, e) => { e.stopPropagation(); assignSheet(); },
  fixOver: (el, e) => { e.stopPropagation(); const m = A.month; const c = A.plan.cats.filter(c => !c.cc && !c.hidden && getAssigned(m, c.id) > 0 && catM(m, c.id).available > 0).sort((a, b) => catM(m, b.id).available - catM(m, a.id).available)[0]; if (c) moveSheet(c.id, 'rta', Math.min(-monthData(m).rta, Math.max(0, catM(m, c.id).available)), 'Fix This'); else toast('Nothing to take back this month'); },
  statInfo: el => {
    const k = el.dataset.k;
    if (k === 'aom') openSheet('Age of Money', `<p style="margin:0">The average number of days between earning money and spending it, based on your last 10 cash outflows. Aim for 30+ days so this month is paid with last month's income.</p><button class="btn block" data-a="goReflect" data-k="aom">View history</button>`);
    else { const m = A.month; const rows = A.plan.cats.map(c => ({ c, ti: targetInfo(c, m) })).filter(x => x.ti && x.ti.need).sort((a, b) => b.ti.need - a.ti.need);
      openSheet('Cost to Be Me', `<p style="margin:0" class="muted">What your targets need in ${monthLabel(m)}.</p><div class="card">${rows.map(x => `<button class="li" data-a="catSheet" data-c="${x.c.id}"><span class="grow">${esc(catName(x.c.id))}</span><strong class="num">${fmt(x.ti.need)}</strong></button>`).join('') || '<div class="li muted">No targets yet. Add one from any category.</div>'}</div>`); }
  },
  goReflect: el => { closeSheet(); A.view = 'reflect'; A.ui.reflect = el.dataset.k; render(); },
  catSheet: el => catSheet(el.dataset.c),
  pillTap: el => { const c = el.dataset.c; if (catM(A.month, c).available < 0) coverSheet(c); else moveSheet(c, 'rta', 0); },
  setAssign: el => { const c = el.dataset.c, v = +el.dataset.v; mutate('Assigned updated', () => setAssigned(A.month, c, v)); catSheet(c); },
  coverSheet: el => coverSheet(el.dataset.c),
  moveSheet: el => moveSheet(el.dataset.c || 'rta', null, 0),
  moveDo: () => {
    const amt = evalExpr($('#mvAmt').value), from = $('#mvFrom').value, to = $('#mvTo').value;
    if (!amt || amt < 0) { toast('Enter a positive amount'); return; }
    if (from === to) { toast('Choose two different categories'); return; }
    mutate('Money moved', () => moveMoney(A.month, from, to, amt)); closeSheet();
  },
  moves: () => movesSheet(),
  autoApply: el => {
    const o = autoOptions(A.month, A.plan.cats.filter(c => !c.hidden)).find(x => x.k === el.dataset.k); if (!o) return;
    mutate(o.l, () => { for (const [cid, v] of o.changes) setAssigned(A.month, cid, v); }); closeSheet();
  },
  tMode: el => { const c = L.cat[el.dataset.c]; mutate('Target updated', () => { c.target.mode = el.dataset.v; }, { silent: true }); catSheet(c.id); },
  tSnooze: el => { const c = L.cat[el.dataset.c]; mutate('Target updated', () => { c.target.snooze = c.target.snooze === A.month ? null : A.month; }); catSheet(c.id); },
  cMove: el => { const cs = A.plan.cats, i = cs.findIndex(c => c.id === el.dataset.c), d = +el.dataset.d; const g = cs[i].gid; let j = i + d; while (j >= 0 && j < cs.length && cs[j].gid !== g) j += d; if (j < 0 || j >= cs.length) return; mutate('Order updated', () => { [cs[i], cs[j]] = [cs[j], cs[i]]; }, { silent: true }); },
  gMove: el => { const gs = A.plan.groups, i = gs.findIndex(g => g.id === el.dataset.g), d = +el.dataset.d; let j = i + d; while (j >= 0 && j < gs.length && gs[j].sys) j += d; if (j < 0 || j >= gs.length) return; mutate('Order updated', () => { [gs[i], gs[j]] = [gs[j], gs[i]]; }, { silent: true }); },
  cHide: el => { const c = L.cat[el.dataset.c]; mutate(c.hidden ? 'Category unhidden' : 'Category hidden', () => { c.hidden = !c.hidden; }); if ($('#scrim')) closeSheet(); },
  gEdit: el => groupSheet(el.dataset.g), groupNew: () => groupSheet(null),
  gSave: el => { const n = $('#gName').value.trim(); if (!n) return toast('Enter a group name'); const g = L.group[el.dataset.g]; mutate(g ? 'Group renamed' : 'Group created', () => { if (g) g.name = n; else A.plan.groups.push({ id: uid(), name: n }); }); closeSheet(); },
  gHide: el => { const g = L.group[el.dataset.g]; mutate('Group updated', () => { g.hidden = !g.hidden; }); closeSheet(); },
  gDelete: el => { const g = L.group[el.dataset.g]; if (A.plan.cats.some(c => c.gid === g.id)) { toast('Move or delete its categories first'); return; } mutate('Group deleted', () => { A.plan.groups = A.plan.groups.filter(x => x.id !== g.id); }); closeSheet(); },
  catNew: el => catNewSheet(el.dataset.g),
  catCreate: el => { const n = $('#ncName').value.trim(); if (!n) return toast('Enter a category name'); mutate('Category created', () => { A.plan.cats.push({ id: uid(), gid: el.dataset.g, name: n, note: '', target: null }); }); closeSheet(); },
  catDelete: el => catDeleteSheet(el.dataset.c),
  catDeleteDo: el => {
    const cid = el.dataset.c, rep = $('#repCat')?.value || null;
    mutate('Category deleted', () => {
      if (rep) { for (const t of A.tx) { if (t.cat === cid) t.cat = rep; if (t.splits) for (const s of t.splits) if (s.cat === cid) s.cat = rep; } for (const o of Object.values(A.plan.assigned)) if (o[cid]) { o[rep] = (o[rep] || 0) + o[cid]; delete o[cid]; } for (const y of A.plan.payees) if (y.lastCat === cid) y.lastCat = rep; }
      A.plan.cats = A.plan.cats.filter(c => c.id !== cid);
    }); closeSheet();
  },
  // accounts
  acctNew: () => acctSheet(null), acctEdit: el => acctSheet(el.dataset.id),
  acctSave: el => {
    const id = el.dataset.id; const name = $('#aName').value.trim(); if (!name) return toast('Enter an account name');
    const rate = parseFloat(($('#aRate')?.value || '0').replace(',', '.')) || 0; const minPay = evalExpr($('#aMin')?.value) || 0; const note = $('#aNote').value;
    if (id) { const a = L.acct[id]; const wv = $('#aWork') ? evalExpr($('#aWork').value) : null; const diff = wv == null ? 0 : wv - balances()[id].working;
      const ov = $('#aOver') ? Math.abs(evalExpr($('#aOver').value || '0') || 0) : (a.overdraft || 0);
      mutate('Account updated', () => { a.overdraft = ov || 0; a.name = name; a.rate = rate; a.minPay = Math.abs(minPay); a.note = note; const c = L.ccCat[id]; if (c) c.name = name;
        if (diff) A.tx.push({ id: uid(), acct: id, date: todayISO(), payee: getPayee('Balance adjustment').id, cat: onBudget(a) && !isCredit(a) ? 'rta' : '__start', memo: '', amount: diff, cleared: 'c', flag: null, approved: true }); }); }
    else {
      const type = $('#aType').value; let bal = evalExpr($('#aBal').value) || 0; if (ACCT[type].debt || ACCT[type].credit) bal = -Math.abs(bal);
      let created; mutate('Account added', () => { created = addAccount({ name, type, balance: bal, date: $('#aDate').value || todayISO(), rate, minPay: Math.abs(minPay) }); created.note = note; });
      A.view = 'accounts'; A.acct = created.id; render();
    }
    closeSheet();
  },
  acctClose: el => { const a = L.acct[el.dataset.id]; if (!a.closed && balances()[a.id].working !== 0) { toast('The balance must be 0 to close the account'); return; } mutate(a.closed ? 'Account reopened' : 'Account closed', () => { a.closed = !a.closed; }); closeSheet(); },
  acctDelete: el => confirmSheet('Delete Account', 'All its transactions will be deleted. You can undo right after.', 'Delete', 'acctDeleteDo', { id: el.dataset.id }),
  acctDeleteDo: el => { const id = el.dataset.id; mutate('Account deleted', () => { deleteTx(A.tx.filter(t => t.acct === id).map(t => t.id)); A.plan.accounts = A.plan.accounts.filter(a => a.id !== id); A.plan.cats = A.plan.cats.filter(c => c.cc !== id); A.plan.scheduled = A.plan.scheduled.filter(s => s.acct !== id && s.transferAcct !== id); }); closeSheet(); A.acct = null; render(); },
  openAcctNav: el => { A.ui.catFilter = null; A.view = 'accounts'; A.acct = el.dataset.id; A.ui.regFilter = 'all'; A.ui.search = ''; A.ui.regLimit = 150; A.ui.select = false; A.ui.selected.clear(); render(); },
  collapseClosed: () => { A.ui.collapsed.s_closed = A.ui.collapsed.s_closed === false ? true : false; render._keepScroll = true; render(); },
  toggleReorder: () => { A.ui.reorder = !A.ui.reorder; render(); },
  aMove: el => { moveAccount(el.dataset.id, +el.dataset.d); },
  openAcct: el => { A.acct = el.dataset.id; A.ui.regFilter = 'all'; A.ui.search = ''; A.ui.regLimit = 150; window.scrollTo(0, 0); render(); },
  catActivity: el => { A.view = 'tx'; A.acct = 'all'; A.ui.regFilter = 'all'; A.ui.search = ''; A.ui.catFilter = { cid: el.dataset.c, m: A.month }; window.scrollTo(0, 0); render(); },
  approveCat: () => { const ts = A.tx.filter(t => t.approved === false && (t.cat || t.transferAcct || (t.splits && t.splits.length))); if (!ts.length) return toast('Nothing to approve: give them a category first'); mutate(ts.length + ' transactions approved', () => ts.forEach(t => { t.approved = true; })); },
  catActivityOff: () => { A.ui.catFilter = null; render(); },
  openAll: el => { A.ui.catFilter = null; A.view = 'tx'; A.acct = 'all'; A.ui.regFilter = el.dataset.f; A.ui.search = ''; window.scrollTo(0, 0); render(); },
  backAccts: () => { A.acct = null; A.ui.select = false; A.ui.selected.clear(); render(); },
  regFilter: el => { A.ui.regFilter = el.dataset.f; render(); },
  more: () => { A.ui.regLimit = (A.ui.regLimit || 150) + 300; render._keepScroll = true; render(); },
  toggleSelect: () => { A.ui.select = !A.ui.select; A.ui.selected.clear(); render._keepScroll = true; render(); },
  clr: el => { const t = A.tx.find(x => x.id === el.dataset.id); if (!t || t.cleared === 'r') { if (t) toast('Reconciled transaction: edit it to unlock'); return; } render._keepScroll = true; mutate(t.cleared === 'u' ? 'Cleared' : 'Uncleared', () => { t.cleared = t.cleared === 'u' ? 'c' : 'u'; }, { silent: true }); },
  approve: el => { const t = A.tx.find(x => x.id === el.dataset.id); if (!t) return; if (!t.cat && !t.splits && onBudget(L.acct[t.acct]) && !t.transferAcct) { txSheet(t.id); return; } render._keepScroll = true; mutate('Transaction approved', () => { t.approved = true; }, { silent: true }); },
  newTx: () => { closeSheet(); txSheet(null); },
  txEdit: el => txSheet(el.dataset.id),
  kind: el => { D.kind = el.dataset.v; if (D.kind === 'transfer') { D.splits = null; } else D.transferAcct = ''; if (D.kind === 'in' && !D.cat) D.cat = 'rta'; if (D.kind === 'out' && D.cat === 'rta') D.cat = ''; txRefresh(); },
  dFlag: el => { D.flag = el.dataset.v || null; txRefresh(); },
  spOn: () => { D.splits = [{ cat: D.cat || '', amount: D.amount, memo: '' }, { cat: '', amount: 0, memo: '' }]; txRefresh(); },
  spOff: () => { D.cat = D.splits?.[0]?.cat || ''; D.splits = null; txRefresh(); },
  spAdd: () => { D.splits.push({ cat: '', amount: 0, memo: '' }); txRefresh(); },
  spDel: el => { D.splits.splice(+el.dataset.i, 1); if (D.splits.length < 2) { D.cat = D.splits[0]?.cat || ''; D.splits = null; } txRefresh(); },
  spFill: () => { const s = D.splits; const rest = D.amount - s.slice(0, -1).reduce((x, y) => x + y.amount, 0); s[s.length - 1].amount = Math.max(0, rest); txRefresh(); },
  txSave: () => txCommit(false), txSaveNew: () => txCommit(true),
  txDelete: () => { const id = D.id; mutate('Transaction deleted', () => deleteTx([id])); closeSheet(); },
  bulk: el => {
    const k = el.dataset.k, ids = [...A.ui.selected]; const ts = A.tx.filter(t => A.ui.selected.has(t.id));
    if (k === 'none') { A.ui.selected.clear(); render(); return; }
    if (k === 'approve') mutate(`${ids.length} approved`, () => ts.forEach(t => t.approved = true));
    else if (k === 'clear') mutate(`${ids.length} cleared`, () => ts.forEach(t => { if (t.cleared === 'u') t.cleared = 'c'; }));
    else if (k === 'del') { mutate(`${ids.length} deleted`, () => deleteTx(ids)); A.ui.selected.clear(); }
    else if (k === 'cat') openSheet('Categorize ' + ids.length + ' transactions', `<div class="field"><label for="bkCat">Category</label><select id="bkCat" class="in">${catOptions('')}</select></div><label class="switch"><span>Approve at the same time</span><input type="checkbox" id="bkAp" checked></label>`, `<button class="btn pri block" data-a="bulkCatDo">Apply</button>`);
    else if (k === 'flag') openSheet('Flag', `<div class="flags"><button style="background:var(--surface-2)" data-a="bulkFlagDo" data-v="" aria-label="None"></button>${flagList().map(([f, l]) => `<button style="background:var(--flag-${f})" data-a="bulkFlagDo" data-v="${f}" aria-label="${l}"></button>`).join('')}</div>`);
    else if (k === 'date') openSheet('Change Date', `<input type="date" id="bkDate" class="in" value="${todayISO()}">`, `<button class="btn pri block" data-a="bulkDateDo">Apply</button>`);
  },
  bulkCatDo: () => { const c = $('#bkCat').value || null, ap = $('#bkAp').checked; const ts = A.tx.filter(t => A.ui.selected.has(t.id) && !t.transferAcct); mutate(`${ts.length} categorized`, () => ts.forEach(t => { t.cat = c; t.splits = null; if (ap) t.approved = true; const y = L.payee[t.payee]; if (y && c) y.lastCat = c; })); closeSheet(); },
  bulkFlagDo: el => { const ts = A.tx.filter(t => A.ui.selected.has(t.id)); mutate('Flags updated', () => ts.forEach(t => t.flag = el.dataset.v || null)); closeSheet(); },
  bulkDateDo: () => { const d = $('#bkDate').value; if (!d) return; const ts = A.tx.filter(t => A.ui.selected.has(t.id)); mutate('Dates updated', () => ts.forEach(t => { t.date = d; const p = t.transferId && A.tx.find(x => x.id === t.transferId); if (p) p.date = d; })); closeSheet(); },
  reconcile: el => reconcileSheet(el.dataset.id, 1),
  recYes: el => { const id = el.dataset.id; mutate('Account reconciled', () => { A.tx.forEach(t => { if (t.acct === id && t.cleared === 'c') t.cleared = 'r'; }); L.acct[id].lastRec = todayISO(); }); closeSheet(); },
  recNo: el => reconcileSheet(el.dataset.id, 2),
  recAdjust: el => {
    const id = el.dataset.id; const v = evalExpr($('#recBal').value); if (v == null) return toast('Enter your bank balance');
    const diff = v - balances()[id].cleared; const a = L.acct[id];
    mutate(diff ? 'Adjustment of ' + fmt(diff) + ' created, account reconciled' : 'Account reconciled', () => {
      if (diff) A.tx.push({ id: uid(), acct: id, date: todayISO(), payee: getPayee('Balance adjustment').id, cat: onBudget(a) && !isCredit(a) ? 'rta' : '__start', memo: '', amount: diff, cleared: 'c', flag: null, approved: true });
      A.tx.forEach(t => { if (t.acct === id && t.cleared === 'c') t.cleared = 'r'; }); a.lastRec = todayISO();
    }); closeSheet();
  },
  loanPlanner: el => loanSheet(el.dataset.id, 0),
  loanTarget: el => {
    const a = L.acct[el.dataset.id], amt = (a.minPay || 0) + (+el.dataset.x || 0); if (!amt) return toast('Add the minimum payment first');
    mutate('Debt payment category ready', () => {
      let g = A.plan.groups.find(x => x.name === 'Debt Payments' && !x.sys); if (!g) { g = { id: uid(), name: 'Debt Payments' }; A.plan.groups.push(g); }
      let c = A.plan.cats.find(x => x.loan === a.id); if (!c) { c = { id: uid(), gid: g.id, name: a.name + ' Payment', note: '', loan: a.id }; A.plan.cats.push(c); }
      c.target = { type: 'debt', amount: amt };
      const from = A.plan.accounts.find(x => onBudget(x) && !isCredit(x) && !x.closed);
      if (from && !A.plan.scheduled.some(s => s.transferAcct === a.id)) A.plan.scheduled.push({ id: uid(), acct: from.id, transferAcct: a.id, payee: '', cat: c.id, memo: 'Loan payment', amount: -amt, freq: 'monthly', next: addMonths(curMonth(), 1) + '-05' });
    }); closeSheet();
  },
  loanInterest: el => { const a = L.acct[el.dataset.id]; const i = Math.round(-(balances()[a.id].working) * (a.rate || 0) / 100 / 12); if (!i) return toast('No interest to add'); mutate('Interest added', () => { A.tx.push({ id: uid(), acct: a.id, date: todayISO(), payee: getPayee('Interest Charge').id, cat: '__start', memo: '', amount: -i, cleared: 'c', flag: null, approved: true }); }); loanSheet(a.id, +($('#lxRange')?.value || 0)); },
  ccPay: el => ccPaySheet(el.dataset.id),
  importSheet: el => importSheet(el.dataset.id || (A.acct && A.acct !== 'all' ? A.acct : null)),
  impBuild: () => impBuildCSV(), impDo: () => impDo(),
  ynSheet: () => ynSheet(), ynDo: () => ynDo(),
  pairShow: () => { const c = pairCode(); openSheet('Link another device', `<p style="margin:0" class="small">On your other device, open the app and paste this code in “Paste a pairing code” on the welcome screen. It gives access to your budget: share it with no one and never post it.</p><textarea class="in" readonly id="pairOut" style="font-family:monospace; font-size:12px; min-height:110px">${esc(c)}</textarea>`, `<button class="btn pri block" data-a="pairCopy">Copy code</button>`); },
  pairCopy: () => { const t = $('#pairOut'); try { navigator.clipboard.writeText(t.value).then(() => toast('Code copied'), () => { t.select(); }); } catch (e) { t.select(); } },
  pairUse: () => { const v = $('#pairIn')?.value || ''; if (!usePairCode(v)) { toast('This pairing code is not valid'); return; } toast('Restoring…'); gdSync(); },
  gdLogin: () => gdAuth(false), gdNow: () => gdSync(), gdOff: () => gdDisconnect(),
  bankSetup: () => bankSetupSheet(), bankConnect: () => bankConnect(), bankLinkSheet: () => bankLinkSheet(), bankLink: el => bankLink(el.dataset.bank),
  bankMap: el => bankMapSheet(el.dataset.id), bankMapSave: el => bankMapSave(el.dataset.id), bankSyncNow: () => bankSync(true),
  bankCancel: () => { pendSave(pendAll().filter(x => x.plan !== A.plan.id)); clearInterval(bankPoll); bankPoll = null; render(); },
  bankCheck: () => bankCheckOnce(true),
  dupReview: el => dupReviewSheet(el.dataset.id),
  autoCat: () => autoCategorize(),
  yLearn: () => yLearnSheet(), yLearnGo: el => yLearnGo(el.dataset.i != null ? +el.dataset.i : null),
  bankDupMerge: el => { const n = mergeBankDupes(el.dataset.id); A.ui.bankBal = {}; toast(n + ' duplicate' + (n > 1 ? 's' : '') + ' merged: your categories are kept'); },
  diffDel: el => { mutate('Card debit deleted', () => deleteTx([el.dataset.id])); A.ui.bankBal = {}; diffSheet(el.dataset.acct, +el.dataset.v); },
  diffAdjust: el => { const v = +el.dataset.v, id = el.dataset.id; if (!v) return; const nid = uid(); mutate('Balance adjusted to the bank', () => { A.tx.push({ id: nid, acct: id, date: todayISO(), payee: getPayee('Balance adjustment').id, cat: onBudget(L.acct[id]) && !isCredit(L.acct[id]) ? 'rta' : null, memo: 'Aligned on the bank balance', amount: v, cleared: 'c', flag: null, approved: true }); }); A.ui.bankBal = {}; closeSheet(); setTimeout(() => txSheet(nid), 50); toast('Adjusted: pick its category (e.g. the expense it corrects)'); },
  diffSheet: el => diffSheet(el.dataset.id, +el.dataset.v),
  diffAdd: el => { const r = A.ui.diffMissing?.[+el.dataset.i]; const id = A.ui.diffAcct; if (!r || !id) return; mutate('Bank transaction added', () => importRows(id, [r])); el.closest('.li').remove(); toast('Added (unapproved): categorize it in the register'); },
  dupRemove: el => { const d = cardDups(el.dataset.id); mutate(`Removed ${d.length} duplicate${d.length > 1 ? 's' : ''}`, () => { for (const x of d) { if (!x.card.cat && x.main.cat) x.card.cat = x.main.cat; if (!x.card.cat && x.main.splits) x.card.splits = x.main.splits; if (x.card.memo === '' && x.main.memo) x.card.memo = x.main.memo; const i = A.tx.indexOf(x.main); if (i >= 0) A.tx.splice(i, 1); } }); closeSheet(); },
  bankRemove: el => confirmSheet('Disconnect bank', 'Stops importing from this bank and revokes the access at Enable Banking. Transactions already imported stay.', 'Disconnect', 'bankRemoveDo', { id: el.dataset.id }),
  bankRemoveDo: async el => { const c = A.plan.bank.conns.find(x => x.id === el.dataset.id); closeSheet(); if (!c) return; try { await bk('delete', { session: c.session }); } catch (e) { } mutate('Bank disconnected', () => { A.plan.bank.conns = A.plan.bank.conns.filter(x => x !== c); }); },
  yLoad: () => yLoad(), yPick: el => yPick(+el.dataset.i), yDo: () => yDo(),
  schEdit: el => schSheet(el.dataset.id), schList: () => schListSheet(),
  schNow: el => { const s = A.plan.scheduled.find(x => x.id === el.dataset.id); mutate('Transaction entered', () => { saveTx({ acct: s.acct, date: todayISO(), payee: s.payee, cat: s.cat, memo: s.memo, amount: s.amount, transferAcct: s.transferAcct, splits: s.splits, cleared: 'u', approved: true }); s.next = s.freq === 'never' ? null : nextDate(s.next, s.freq); A.plan.scheduled = A.plan.scheduled.filter(x => x.next); }); },
  schSkip: el => { const s = A.plan.scheduled.find(x => x.id === el.dataset.id); mutate('Next occurrence skipped', () => { s.next = s.freq === 'never' ? null : nextDate(s.next, s.freq); A.plan.scheduled = A.plan.scheduled.filter(x => x.next); }); closeSheet(); },
  schDel: el => { mutate('Scheduled transaction deleted', () => { A.plan.scheduled = A.plan.scheduled.filter(x => x.id !== el.dataset.id); }); closeSheet(); },
  schSave: el => { const s = A.plan.scheduled.find(x => x.id === el.dataset.id); const amt = evalExpr($('#sAmt').value); if (amt == null) return toast('Invalid amount'); mutate('Scheduled transaction saved', () => { s.amount = amt; s.acct = $('#sAcct').value; s.next = $('#sNext').value; s.freq = $('#sFreq').value; s.memo = $('#sMemo').value; if ($('#sPayee')) { s.payee = $('#sPayee').value; s.cat = $('#sCat').value || null; } runScheduled(); }); closeSheet(); },
  payees: () => payeesSheet(),
  pyDel: el => { mutate('Payee deleted', () => { A.plan.payees = A.plan.payees.filter(y => y.id !== el.dataset.id); }, { silent: true }); payeesSheet(); },
  ruleAdd: () => { const c = $('#ruleC').value.trim(), p = $('#ruleP').value.trim(); if (!c || !p) return toast('Fill in both fields'); mutate('Rule added', () => A.plan.rules.push({ contains: c, payee: p }), { silent: true }); payeesSheet(); },
  ruleDel: el => { mutate('Rule deleted', () => A.plan.rules.splice(+el.dataset.i, 1), { silent: true }); payeesSheet(); },
  // reflect
  reflectTab: el => { A.ui.reflect = el.dataset.k; render(); }, period: el => { A.ui.period = el.dataset.k; render(); }, groupBy: el => { A.ui.groupBy = el.dataset.k; render(); },
  // settings
  switchPlan: el => { if (el.dataset.id !== A.plan.id) { localSaveAll(); switchPlan(el.dataset.id); } },
  newPlan: () => openSheet('New Plan', `<div class="field"><label for="npName">Plan name</label><input id="npName" class="in" value="New Plan"></div>`, `<button class="btn pri block" data-a="newPlanDo">Create Plan</button>`, { focus: '#npName' }),
  newPlanDo: () => { const n = $('#npName').value.trim() || 'New Plan'; closeSheet(); createPlan(n); },
  createPlan: () => createPlan($('#obName')?.value.trim() || 'My Plan'),
  demoPlan: () => createPlan('Sample Plan', true),
  exportJson: () => exportJson(), exportCsv: () => exportCsv(),
  freshStart: () => confirmSheet('Fresh Start', 'Your current plan is archived (still available under My Plans). A new plan starts with your accounts at today\'s balances, your categories and your targets.', 'Start Fresh', 'freshDo'),
  freshDo: () => { closeSheet(); freshStart(); },
  resetPlan: () => confirmSheet('Reset Assigned', 'Every assigned amount, in every month, will be cleared. Accounts and transactions stay.', 'Reset', 'resetDo'),
  resetDo: () => { mutate('Assigned amounts reset', () => { A.plan.assigned = {}; A.plan.moves = []; }); closeSheet(); },
  deletePlan: () => confirmSheet('Delete This Plan', `“${esc(A.plan.name)}” and all its transactions will be permanently deleted. Export a backup first if in doubt.`, 'Delete Permanently', 'deletePlanDo'),
  deletePlanAsk: el => { const id = el.dataset.id, x = A.index.plans.find(p => p.id === id); if (!x) return; confirmSheet('Delete Plan', `“${esc(x.name)}” and all its transactions will be permanently deleted, on every device.`, 'Delete Permanently', 'deletePlanDo', { id }); },
  deletePlanDo: async el => {
    const id = el?.dataset?.id || A.plan.id; closeSheet();
    if (DB) { try { await DB.doc('plans/' + id).delete(); const snap = await DB.collection('plans/' + id + '/tx').get(); for (const d of snap.docs) await DB.doc('plans/' + id + '/tx/' + d.id).delete(); } catch (e) { } }
    A.index.deleted = [...(A.index.deleted || []), id];
    A.index.plans = A.index.plans.filter(x => x.id !== id);
    localDeletePlan(id);
    if (A.plan && A.plan.id !== id) { A.index.updatedAt = Date.now(); localSaveAll(); gdSchedule(); render(); toast('Plan deleted'); return; }
    A.index.current = A.index.plans[0]?.id || null; A.plan = null; A.tx = [];
    if (A.index.current) await switchPlan(A.index.current); else { A.index.updatedAt = Date.now(); localSaveAll(); if (DB) DB.doc('meta/index').set(JSON.parse(JSON.stringify(A.index))).catch(() => { }); render(); }
    gdSchedule(); toast('Plan deleted');
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.a]; if (f) { f(el, e); }
});
// assigned inline inputs
function applyAssign(inp) {
  if (inp.dataset.done) return;
  const cid = inp.dataset.assign; const cur = getAssigned(A.month, cid); let raw = inp.value.trim();
  if (raw === fmtIn(cur)) return;
  inp.dataset.done = '1';
  let v;
  if (!raw.startsWith(fmtIn(cur)) && (/^[+*/x×]/i.test(raw) || (/^-/.test(raw) && raw.length > 1 && cur !== 0))) { v = evalExpr(fmtIn(cur).replace(',', '.') + raw.replace(',', '.')); }
  else v = evalExpr(raw === '' ? '0' : raw);
  if (v == null) { delete inp.dataset.done; inp.value = fmtIn(cur); toast('Amount not recognized'); return; }
  render._keepScroll = true;
  mutate('Assigned: ' + catName(cid) + ' ' + fmt(v), () => setAssigned(A.month, cid, v), { silent: true });
}
document.addEventListener('focusin', e => { if (e.target.matches('.ass-in, .bigamt, [data-sp="amount"]')) { const el = e.target, v0 = el.value; setTimeout(() => { if (el.value === v0) el.select?.(); }, 0); } });
// calculator in amounts, like YNAB: typing + - * x / on a selected amount keeps it and appends the operator (e.g. +9,99)
document.addEventListener('keydown', e => {
  const el = e.target; if (!el.matches?.('.ass-in, .bigamt, [data-sp="amount"]')) return;
  if (!['+', '-', '*', '/', 'x', 'X', '×'].includes(e.key)) return;
  const all = el.selectionStart === 0 && el.selectionEnd === el.value.length && el.value.length > 0;
  if (!all) return;
  e.preventDefault(); el.value = el.value + (e.key === 'x' || e.key === 'X' || e.key === '×' ? '*' : e.key); el.setSelectionRange(el.value.length, el.value.length);
});
document.addEventListener('keydown', e => {
  if (e.target.matches?.('.ass-in') && e.key === 'Enter') { e.preventDefault(); const all = $$('.ass-in'); const i = all.indexOf(e.target); const nextId = all[i + 1]?.dataset.assign; applyAssign(e.target); if (nextId) setTimeout(() => $(`[data-assign="${nextId}"]`)?.focus(), 0); return; }
  if (e.key === 'Escape' && $('#scrim')) { closeSheet(); return; }
  const typing = e.target.matches?.('input, textarea, select');
  if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (typing || $('#scrim') || !A.plan) return;
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); txSheet(null); }
  if (A.view === 'plan' && e.key === 'ArrowLeft') { A.month = addMonths(A.month, -1); render(); }
  if (A.view === 'plan' && e.key === 'ArrowRight') { A.month = addMonths(A.month, 1); render(); }
});
document.addEventListener('focusout', e => { if (e.target.matches?.('.ass-in') && document.body.contains(e.target)) applyAssign(e.target); });
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.d && D) {
    const k = el.dataset.d;
    if (k === 'amount') { const v = evalExpr(el.value); D.amount = v == null ? D.amount : Math.abs(v); return; }
    if (k === 'cleared') return;
    D[k] = el.value; return;
  }
  if (el.dataset.sp && D?.splits) { const s = D.splits[+el.dataset.i]; if (el.dataset.sp === 'amount') { const v = evalExpr(el.value); s.amount = v == null ? 0 : Math.abs(v); } else s[el.dataset.sp] = el.value; return; }
  if (el.dataset.i === 'search') { A.ui.search = el.value; clearTimeout(el._t); el._t = setTimeout(() => { const pos = el.selectionStart; render(); const n = $('#regSearch'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 220); return; }
  if (el.dataset.c === 'loanX') { loanSheet(el.dataset.id, +el.value); return; }
  if (el.dataset.c === 'bkSearch') { bankListRender(el.value); return; }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.d && D) {
    const k = el.dataset.d;
    if (k === 'cleared') { D.cleared = el.checked ? 'c' : 'u'; return; }
    if (k === 'amount') { updSplitStatus(); return; }
    D[k] = el.value;
    if (k === 'acct' && D.transferAcct === D.acct) D.transferAcct = '';
    if (k === 'payee') { if (!D.cat && !D.splits) { const y = L.payeeByName[el.value.trim().toLowerCase()]; if (y?.lastCat && L.cat[y.lastCat]) { D.cat = y.lastCat; const sel = $('#txCat'); if (sel) sel.value = y.lastCat; } } return; }
    if (['acct', 'transferAcct', 'date'].includes(k)) txRefresh();
    return;
  }
  if (el.dataset.sp && D?.splits) { if (el.dataset.sp === 'amount') updSplitStatus(); else D.splits[+el.dataset.i][el.dataset.sp] = el.value; return; }
  if (el.dataset.cf) { const c = L.cat[el.dataset.c]; const k = el.dataset.cf; const v = el.value; if (k === 'name' && !v.trim()) return; mutate('Category updated', () => { c[k] = k === 'name' ? v.trim() : v; }, { silent: true }); return; }
  if (el.dataset.tf) {
    const c = L.cat[el.dataset.c]; const k = el.dataset.tf;
    mutate('Target updated', () => {
      if (k === 'type') { if (!el.value) c.target = null; else c.target = { ...(c.target || { amount: 0, mode: 'set' }), type: el.value }; return; }
      c.target ||= { type: 'monthly', amount: 0 };
      if (k === 'amount') c.target.amount = Math.abs(evalExpr(el.value) || 0);
      else if (['weekday', 'month', 'repeat'].includes(k)) c.target[k] = +el.value;
      else c.target[k] = el.value || null;
    }, { silent: true });
    catSheet(c.id); return;
  }
  if (el.dataset.mnote) { const m = el.dataset.mnote; mutate('Note saved', () => { (A.plan.notes ||= {})[m] = el.value; }, { silent: true }); return; }
  if (el.dataset.set) { const k = el.dataset.set; mutate('Setting saved', () => { A.plan[k] = k === 'name' ? (el.value.trim() || A.plan.name) : k === 'expectedIncome' ? Math.abs(evalExpr(el.value) || 0) : el.value; }); _nfKey = ''; return; }
  if (el.dataset.py) {
    const y = L.payee[el.dataset.id]; const k = el.dataset.py;
    if (k === 'name') {
      const n = el.value.trim(); if (!n) return; const other = L.payeeByName[n.toLowerCase()];
      if (other && other.id !== y.id) { mutate('Payees combined', () => { A.tx.forEach(t => { if (t.payee === y.id) t.payee = other.id; }); A.plan.payees = A.plan.payees.filter(p => p.id !== y.id); }); payeesSheet(); }
      else mutate('Payee renamed', () => { y.name = n; }, { silent: true });
    } else mutate('Default category saved', () => { y.lastCat = el.value || null; }, { silent: true });
    return;
  }
  if (el.dataset.mp && IMP) { IMP.map[el.dataset.mp] = el.type === 'checkbox' ? el.checked : (el.dataset.mp === 'dfmt' ? el.value : +el.value); return; }
  if (el.dataset.c === 'impFile' && el.files[0]) { onImportFile(el.files[0]); return; }
  if (el.dataset.c === 'gClient') { try { localStorage.setItem('budget.gclient', el.value.trim()); } catch (e) { } render(); return; }
  if (el.dataset.c === 'bkSearch') { bankListRender(el.value); return; }
  if (el.dataset.c === 'ynFile' && el.files.length) { ynFiles([...el.files]); return; }
  if (el.dataset.c === 'restore' && el.files[0]) { restoreFile(el.files[0]); el.value = ''; return; }
  if (el.dataset.c === 'selTx') { if (el.checked) A.ui.selected.add(el.dataset.id); else A.ui.selected.delete(el.dataset.id); $('#actionbar').innerHTML = A.ui.selected.size ? actionBar() : ''; return; }
});
$('#fab').addEventListener('click', () => txSheet(null));

/* ---------- account order ---------- */
const sectionOf = a => a.closed ? 'closed' : (SECTIONS.find(([, , fn]) => fn(a)) || ['x'])[0];
function moveAccount(id, d) {
  const list = A.plan.accounts, i = list.findIndex(a => a.id === id); if (i < 0) return;
  const sec = sectionOf(list[i]); let j = i + d;
  while (j >= 0 && j < list.length && sectionOf(list[j]) !== sec) j += d;
  if (j < 0 || j >= list.length) return;
  render._keepScroll = true; mutate('Account order updated', () => { [list[i], list[j]] = [list[j], list[i]]; }, { silent: true });
}
function dropAccount(dragId, targetId) {
  const list = A.plan.accounts, a = list.find(x => x.id === dragId), b = list.find(x => x.id === targetId);
  if (!a || !b || a === b || sectionOf(a) !== sectionOf(b)) return;
  mutate('Account order updated', () => { const from = list.indexOf(a); list.splice(from, 1); const to = list.indexOf(b); list.splice(from <= to ? to + 1 : to, 0, a); }, { silent: true });
}
let dragAcct = null;
document.addEventListener('dragstart', e => { const el = e.target.closest?.('[data-drag]'); if (!el) return; dragAcct = el.dataset.drag; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragAcct); } catch (x) { } el.classList.add('dragging'); });
document.addEventListener('dragover', e => { const el = e.target.closest?.('[data-drag]'); if (!el || !dragAcct) return; e.preventDefault(); $$('.drop-over').forEach(x => x.classList.remove('drop-over')); el.classList.add('drop-over'); });
document.addEventListener('drop', e => { const el = e.target.closest?.('[data-drag]'); if (!el || !dragAcct) return; e.preventDefault(); const id = dragAcct; dragAcct = null; dropAccount(id, el.dataset.drag); });
document.addEventListener('dragend', () => { dragAcct = null; $$('.drop-over,.dragging').forEach(x => x.classList.remove('drop-over', 'dragging')); });

window.addEventListener('pagehide', () => { if (A.plan) { localSaveAll(); clearTimeout(_persistTimer); persistNow(); } });
window.addEventListener('pageshow', () => { if (A.plan) bankWatchPending(); });
window.addEventListener('focus', () => { if (A.plan) bankWatchPending(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && A.plan) bankWatchPending(); if (document.visibilityState === 'hidden' && A.plan) { localSaveAll(); clearTimeout(_persistTimer); persistNow(); } });
/* ---------- boot ---------- */
(async function boot() {
  try { const u = JSON.parse(localStorage.getItem('pecule.ui') || '{}'); if (u.collapsed) A.ui.collapsed = u.collapsed; if (u.compact) A.ui.compact = true; if (u.inspHide) A.ui.inspHide = true; if (u.inspFold) A.ui.inspFold = u.inspFold; if (u.rv) A.ui.rv = u.rv; if (u.noBars) A.ui.noBars = true; if (u.sideHide) A.ui.sideHide = true; } catch (e) { }
  gdReadHash(); gdLoadToken();
  await storageBoot();
  const all = ALL;
  if (all?.index?.plans?.length) {
    A.index = all.index; const cur = all.plans?.[A.index.current] || all.plans?.[A.index.plans[0].id];
    if (cur) { A.plan = cur.plan; A.tx = cur.tx; A.index.current = cur.plan.id; stampBaseline(); }
  }
  rebuildLookups();
  if (A.plan) { const n = runScheduled(); if (n) localSaveAll(); }
  render();
  initDb().then(() => gdSync()).then(() => { if (A.plan) { bankWatchPending(); bankAutoSync(); } });
})();
