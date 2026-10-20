/* ================= Budget — events & boot ================= */
const ACT = {
  nav: el => { A.view = el.dataset.v; A.acct = null; if (A.view === 'tx') { A.ui.regFilter = 'all'; A.ui.search = ''; A.ui.regLimit = 150; } A.ui.select = false; A.ui.selected.clear(); window.scrollTo(0, 0); render(); },
  undo: () => undo(), redo: () => redo(),
  closeSheet: () => closeSheet(),
  month: el => { A.month = addMonths(A.month, +el.dataset.d); render(); },
  filter: el => { A.ui.filter = el.dataset.f; if (A.view !== 'plan') A.view = 'plan'; render(); },
  toggleEdit: () => { A.ui.edit = !A.ui.edit; render(); },
  toggleEditPlan: () => { A.view = 'plan'; A.ui.edit = true; render(); },
  toggleHidden: () => { A.ui.showHidden = !A.ui.showHidden; render(); },
  collapse: el => { const g = el.dataset.g; A.ui.collapsed[g] = !A.ui.collapsed[g]; try { localStorage.setItem('pecule.ui', JSON.stringify({ collapsed: A.ui.collapsed })); } catch (e) { } render._keepScroll = true; render(); },
  rtaSheet: (el, e) => { if (e.target.closest('.cta')) return; rtaSheet(); },
  assignSheet: (el, e) => { e.stopPropagation(); assignSheet(); },
  fixOver: (el, e) => { e.stopPropagation(); const m = A.month; const c = A.plan.cats.filter(c => getAssigned(m, c.id) > 0).sort((a, b) => catM(m, b.id).available - catM(m, a.id).available)[0]; if (c) moveSheet(c.id, 'rta', Math.min(-monthData(m).rta, Math.max(0, catM(m, c.id).available)), 'Retirer de l\'argent'); else toast('Rien à retirer ce mois-ci'); },
  statInfo: el => {
    const k = el.dataset.k;
    if (k === 'aom') openSheet('Âge de l\'argent', `<p style="margin:0">Nombre moyen de jours entre l'arrivée d'un euro et sa dépense (10 dernières dépenses). Objectif : dépasser 30 jours pour payer ce mois-ci avec l'argent du mois dernier.</p><button class="btn block" data-a="goReflect" data-k="aom">Voir l'historique</button>`);
    else { const m = A.month; const rows = A.plan.cats.map(c => ({ c, ti: targetInfo(c, m) })).filter(x => x.ti && x.ti.need).sort((a, b) => b.ti.need - a.ti.need);
      openSheet('Coût de ma vie', `<p style="margin:0" class="muted">Somme de ce que tes objectifs demandent en ${monthLabel(m)}.</p><div class="card">${rows.map(x => `<button class="li" data-a="catSheet" data-c="${x.c.id}"><span class="grow">${esc(catName(x.c.id))}</span><strong class="num">${fmt(x.ti.need)}</strong></button>`).join('') || '<div class="li muted">Aucun objectif. Ajoute-en depuis une enveloppe.</div>'}</div>`); }
  },
  goReflect: el => { closeSheet(); A.view = 'reflect'; A.ui.reflect = el.dataset.k; render(); },
  catSheet: el => catSheet(el.dataset.c),
  pillTap: el => { const c = el.dataset.c; if (catM(A.month, c).available < 0) coverSheet(c); else moveSheet(c, 'rta', 0); },
  setAssign: el => { const c = el.dataset.c, v = +el.dataset.v; mutate('Réparti modifié', () => setAssigned(A.month, c, v)); catSheet(c); },
  coverSheet: el => coverSheet(el.dataset.c),
  moveSheet: el => moveSheet(el.dataset.c || 'rta', null, 0),
  moveDo: () => {
    const amt = evalExpr($('#mvAmt').value), from = $('#mvFrom').value, to = $('#mvTo').value;
    if (!amt || amt < 0) { toast('Indique un montant positif'); return; }
    if (from === to) { toast('Choisis deux enveloppes différentes'); return; }
    mutate('Argent déplacé', () => moveMoney(A.month, from, to, amt)); closeSheet();
  },
  moves: () => movesSheet(),
  autoApply: el => {
    const o = autoOptions(A.month, A.plan.cats.filter(c => !c.hidden)).find(x => x.k === el.dataset.k); if (!o) return;
    mutate(o.l, () => { for (const [cid, v] of o.changes) setAssigned(A.month, cid, v); }); closeSheet();
  },
  tMode: el => { const c = L.cat[el.dataset.c]; mutate('Objectif modifié', () => { c.target.mode = el.dataset.v; }, { silent: true }); catSheet(c.id); },
  tSnooze: el => { const c = L.cat[el.dataset.c]; mutate('Objectif mis à jour', () => { c.target.snooze = c.target.snooze === A.month ? null : A.month; }); catSheet(c.id); },
  cMove: el => { const cs = A.plan.cats, i = cs.findIndex(c => c.id === el.dataset.c), d = +el.dataset.d; const g = cs[i].gid; let j = i + d; while (j >= 0 && j < cs.length && cs[j].gid !== g) j += d; if (j < 0 || j >= cs.length) return; mutate('Ordre modifié', () => { [cs[i], cs[j]] = [cs[j], cs[i]]; }, { silent: true }); },
  gMove: el => { const gs = A.plan.groups, i = gs.findIndex(g => g.id === el.dataset.g), d = +el.dataset.d; let j = i + d; while (j >= 0 && j < gs.length && gs[j].sys) j += d; if (j < 0 || j >= gs.length) return; mutate('Ordre modifié', () => { [gs[i], gs[j]] = [gs[j], gs[i]]; }, { silent: true }); },
  cHide: el => { const c = L.cat[el.dataset.c]; mutate(c.hidden ? 'Enveloppe affichée' : 'Enveloppe masquée', () => { c.hidden = !c.hidden; }); if ($('#scrim')) closeSheet(); },
  gEdit: el => groupSheet(el.dataset.g), groupNew: () => groupSheet(null),
  gSave: el => { const n = $('#gName').value.trim(); if (!n) return toast('Donne un nom au groupe'); const g = L.group[el.dataset.g]; mutate(g ? 'Groupe renommé' : 'Groupe créé', () => { if (g) g.name = n; else A.plan.groups.push({ id: uid(), name: n }); }); closeSheet(); },
  gHide: el => { const g = L.group[el.dataset.g]; mutate('Groupe mis à jour', () => { g.hidden = !g.hidden; }); closeSheet(); },
  gDelete: el => { const g = L.group[el.dataset.g]; if (A.plan.cats.some(c => c.gid === g.id)) { toast('Déplace ou supprime d\'abord ses enveloppes'); return; } mutate('Groupe supprimé', () => { A.plan.groups = A.plan.groups.filter(x => x.id !== g.id); }); closeSheet(); },
  catNew: el => catNewSheet(el.dataset.g),
  catCreate: el => { const n = $('#ncName').value.trim(); if (!n) return toast('Donne un nom à l\'enveloppe'); mutate('Enveloppe créée', () => { A.plan.cats.push({ id: uid(), gid: el.dataset.g, name: n, note: '', target: null }); }); closeSheet(); },
  catDelete: el => catDeleteSheet(el.dataset.c),
  catDeleteDo: el => {
    const cid = el.dataset.c, rep = $('#repCat')?.value || null;
    mutate('Enveloppe supprimée', () => {
      if (rep) { for (const t of A.tx) { if (t.cat === cid) t.cat = rep; if (t.splits) for (const s of t.splits) if (s.cat === cid) s.cat = rep; } for (const o of Object.values(A.plan.assigned)) if (o[cid]) { o[rep] = (o[rep] || 0) + o[cid]; delete o[cid]; } for (const y of A.plan.payees) if (y.lastCat === cid) y.lastCat = rep; }
      A.plan.cats = A.plan.cats.filter(c => c.id !== cid);
    }); closeSheet();
  },
  // accounts
  acctNew: () => acctSheet(null), acctEdit: el => acctSheet(el.dataset.id),
  acctSave: el => {
    const id = el.dataset.id; const name = $('#aName').value.trim(); if (!name) return toast('Donne un nom au compte');
    const rate = parseFloat(($('#aRate')?.value || '0').replace(',', '.')) || 0; const minPay = evalExpr($('#aMin')?.value) || 0; const note = $('#aNote').value;
    if (id) { const a = L.acct[id]; mutate('Compte modifié', () => { a.name = name; a.rate = rate; a.minPay = Math.abs(minPay); a.note = note; const c = L.ccCat[id]; if (c) c.name = name; }); }
    else {
      const type = $('#aType').value; let bal = evalExpr($('#aBal').value) || 0; if (ACCT[type].debt || ACCT[type].credit) bal = -Math.abs(bal);
      let created; mutate('Compte ajouté', () => { created = addAccount({ name, type, balance: bal, date: $('#aDate').value || todayISO(), rate, minPay: Math.abs(minPay) }); created.note = note; });
      A.view = 'accounts'; A.acct = created.id; render();
    }
    closeSheet();
  },
  acctClose: el => { const a = L.acct[el.dataset.id]; if (!a.closed && balances()[a.id].working !== 0) { toast('Le solde doit être à 0 pour clôturer'); return; } mutate(a.closed ? 'Compte rouvert' : 'Compte clôturé', () => { a.closed = !a.closed; }); closeSheet(); },
  acctDelete: el => confirmSheet('Supprimer le compte', 'Toutes ses opérations seront supprimées. Tu pourras annuler juste après.', 'Supprimer', 'acctDeleteDo', { id: el.dataset.id }),
  acctDeleteDo: el => { const id = el.dataset.id; mutate('Compte supprimé', () => { deleteTx(A.tx.filter(t => t.acct === id).map(t => t.id)); A.plan.accounts = A.plan.accounts.filter(a => a.id !== id); A.plan.cats = A.plan.cats.filter(c => c.cc !== id); A.plan.scheduled = A.plan.scheduled.filter(s => s.acct !== id && s.transferAcct !== id); }); closeSheet(); A.acct = null; render(); },
  openAcct: el => { A.acct = el.dataset.id; A.ui.regFilter = 'all'; A.ui.search = ''; A.ui.regLimit = 150; window.scrollTo(0, 0); render(); },
  openAll: el => { A.view = 'tx'; A.acct = 'all'; A.ui.regFilter = el.dataset.f; A.ui.search = ''; window.scrollTo(0, 0); render(); },
  backAccts: () => { A.acct = null; A.ui.select = false; A.ui.selected.clear(); render(); },
  regFilter: el => { A.ui.regFilter = el.dataset.f; render(); },
  more: () => { A.ui.regLimit = (A.ui.regLimit || 150) + 300; render._keepScroll = true; render(); },
  toggleSelect: () => { A.ui.select = !A.ui.select; A.ui.selected.clear(); render._keepScroll = true; render(); },
  clr: el => { const t = A.tx.find(x => x.id === el.dataset.id); if (!t || t.cleared === 'r') { if (t) toast('Opération rapprochée : modifie-la pour la déverrouiller'); return; } render._keepScroll = true; mutate(t.cleared === 'u' ? 'Pointée' : 'Dépointée', () => { t.cleared = t.cleared === 'u' ? 'c' : 'u'; }, { silent: true }); },
  approve: el => { const t = A.tx.find(x => x.id === el.dataset.id); if (!t) return; if (!t.cat && !t.splits && onBudget(L.acct[t.acct]) && !t.transferAcct) { txSheet(t.id); return; } render._keepScroll = true; mutate('Opération validée', () => { t.approved = true; }, { silent: true }); },
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
  txDelete: () => { const id = D.id; mutate('Opération supprimée', () => deleteTx([id])); closeSheet(); },
  bulk: el => {
    const k = el.dataset.k, ids = [...A.ui.selected]; const ts = A.tx.filter(t => A.ui.selected.has(t.id));
    if (k === 'none') { A.ui.selected.clear(); render(); return; }
    if (k === 'approve') mutate(`${ids.length} validées`, () => ts.forEach(t => t.approved = true));
    else if (k === 'clear') mutate(`${ids.length} pointées`, () => ts.forEach(t => { if (t.cleared === 'u') t.cleared = 'c'; }));
    else if (k === 'del') { mutate(`${ids.length} supprimées`, () => deleteTx(ids)); A.ui.selected.clear(); }
    else if (k === 'cat') openSheet('Catégoriser ' + ids.length + ' opérations', `<div class="field"><label for="bkCat">Catégorie</label><select id="bkCat" class="in">${catOptions('')}</select></div><label class="switch"><span>Valider en même temps</span><input type="checkbox" id="bkAp" checked></label>`, `<button class="btn pri block" data-a="bulkCatDo">Appliquer</button>`);
    else if (k === 'flag') openSheet('Drapeau', `<div class="flags"><button style="background:var(--surface-2)" data-a="bulkFlagDo" data-v="" aria-label="Aucun"></button>${FLAGS.map(([f, l]) => `<button style="background:var(--flag-${f})" data-a="bulkFlagDo" data-v="${f}" aria-label="${l}"></button>`).join('')}</div>`);
    else if (k === 'date') openSheet('Changer la date', `<input type="date" id="bkDate" class="in" value="${todayISO()}">`, `<button class="btn pri block" data-a="bulkDateDo">Appliquer</button>`);
  },
  bulkCatDo: () => { const c = $('#bkCat').value || null, ap = $('#bkAp').checked; const ts = A.tx.filter(t => A.ui.selected.has(t.id) && !t.transferAcct); mutate(`${ts.length} catégorisées`, () => ts.forEach(t => { t.cat = c; t.splits = null; if (ap) t.approved = true; const y = L.payee[t.payee]; if (y && c) y.lastCat = c; })); closeSheet(); },
  bulkFlagDo: el => { const ts = A.tx.filter(t => A.ui.selected.has(t.id)); mutate('Drapeaux modifiés', () => ts.forEach(t => t.flag = el.dataset.v || null)); closeSheet(); },
  bulkDateDo: () => { const d = $('#bkDate').value; if (!d) return; const ts = A.tx.filter(t => A.ui.selected.has(t.id)); mutate('Dates modifiées', () => ts.forEach(t => { t.date = d; const p = t.transferId && A.tx.find(x => x.id === t.transferId); if (p) p.date = d; })); closeSheet(); },
  reconcile: el => reconcileSheet(el.dataset.id, 1),
  recYes: el => { const id = el.dataset.id; mutate('Compte rapproché', () => { A.tx.forEach(t => { if (t.acct === id && t.cleared === 'c') t.cleared = 'r'; }); L.acct[id].lastRec = todayISO(); }); closeSheet(); },
  recNo: el => reconcileSheet(el.dataset.id, 2),
  recAdjust: el => {
    const id = el.dataset.id; const v = evalExpr($('#recBal').value); if (v == null) return toast('Indique le solde de la banque');
    const diff = v - balances()[id].cleared; const a = L.acct[id];
    mutate(diff ? 'Ajustement de ' + fmt(diff) + ' et rapprochement' : 'Compte rapproché', () => {
      if (diff) A.tx.push({ id: uid(), acct: id, date: todayISO(), payee: getPayee('Ajustement de rapprochement').id, cat: onBudget(a) && !isCredit(a) ? 'rta' : '__start', memo: '', amount: diff, cleared: 'c', flag: null, approved: true });
      A.tx.forEach(t => { if (t.acct === id && t.cleared === 'c') t.cleared = 'r'; }); a.lastRec = todayISO();
    }); closeSheet();
  },
  loanPlanner: el => loanSheet(el.dataset.id, 0),
  loanTarget: el => {
    const a = L.acct[el.dataset.id], amt = (a.minPay || 0) + (+el.dataset.x || 0); if (!amt) return toast('Indique d\'abord la mensualité');
    mutate('Enveloppe de remboursement prête', () => {
      let g = A.plan.groups.find(x => x.name === 'Dettes' && !x.sys); if (!g) { g = { id: uid(), name: 'Dettes' }; A.plan.groups.push(g); }
      let c = A.plan.cats.find(x => x.loan === a.id); if (!c) { c = { id: uid(), gid: g.id, name: 'Remboursement ' + a.name, note: '', loan: a.id }; A.plan.cats.push(c); }
      c.target = { type: 'debt', amount: amt };
      const from = A.plan.accounts.find(x => onBudget(x) && !isCredit(x) && !x.closed);
      if (from && !A.plan.scheduled.some(s => s.transferAcct === a.id)) A.plan.scheduled.push({ id: uid(), acct: from.id, transferAcct: a.id, payee: '', cat: c.id, memo: 'Mensualité', amount: -amt, freq: 'monthly', next: addMonths(curMonth(), 1) + '-05' });
    }); closeSheet();
  },
  loanInterest: el => { const a = L.acct[el.dataset.id]; const i = Math.round(-(balances()[a.id].working) * (a.rate || 0) / 100 / 12); if (!i) return toast('Pas d\'intérêts à ajouter'); mutate('Intérêts ajoutés', () => { A.tx.push({ id: uid(), acct: a.id, date: todayISO(), payee: getPayee('Intérêts').id, cat: '__start', memo: '', amount: -i, cleared: 'c', flag: null, approved: true }); }); loanSheet(a.id, +($('#lxRange')?.value || 0)); },
  ccPay: el => ccPaySheet(el.dataset.id),
  importSheet: el => importSheet(el.dataset.id || (A.acct && A.acct !== 'all' ? A.acct : null)),
  impBuild: () => impBuildCSV(), impDo: () => impDo(),
  ynSheet: () => ynSheet(), ynDo: () => ynDo(),
  schEdit: el => schSheet(el.dataset.id), schList: () => schListSheet(),
  schNow: el => { const s = A.plan.scheduled.find(x => x.id === el.dataset.id); mutate('Opération saisie', () => { saveTx({ acct: s.acct, date: todayISO(), payee: s.payee, cat: s.cat, memo: s.memo, amount: s.amount, transferAcct: s.transferAcct, splits: s.splits, cleared: 'u', approved: true }); s.next = s.freq === 'never' ? null : nextDate(s.next, s.freq); A.plan.scheduled = A.plan.scheduled.filter(x => x.next); }); },
  schSkip: el => { const s = A.plan.scheduled.find(x => x.id === el.dataset.id); mutate('Prochaine échéance sautée', () => { s.next = s.freq === 'never' ? null : nextDate(s.next, s.freq); A.plan.scheduled = A.plan.scheduled.filter(x => x.next); }); closeSheet(); },
  schDel: el => { mutate('Programmation supprimée', () => { A.plan.scheduled = A.plan.scheduled.filter(x => x.id !== el.dataset.id); }); closeSheet(); },
  schSave: el => { const s = A.plan.scheduled.find(x => x.id === el.dataset.id); const amt = evalExpr($('#sAmt').value); if (amt == null) return toast('Montant invalide'); mutate('Programmation modifiée', () => { s.amount = amt; s.acct = $('#sAcct').value; s.next = $('#sNext').value; s.freq = $('#sFreq').value; s.memo = $('#sMemo').value; if ($('#sPayee')) { s.payee = $('#sPayee').value; s.cat = $('#sCat').value || null; } runScheduled(); }); closeSheet(); },
  payees: () => payeesSheet(),
  pyDel: el => { mutate('Bénéficiaire supprimé', () => { A.plan.payees = A.plan.payees.filter(y => y.id !== el.dataset.id); }, { silent: true }); payeesSheet(); },
  ruleAdd: () => { const c = $('#ruleC').value.trim(), p = $('#ruleP').value.trim(); if (!c || !p) return toast('Remplis les deux champs'); mutate('Règle ajoutée', () => A.plan.rules.push({ contains: c, payee: p }), { silent: true }); payeesSheet(); },
  ruleDel: el => { mutate('Règle supprimée', () => A.plan.rules.splice(+el.dataset.i, 1), { silent: true }); payeesSheet(); },
  // reflect
  reflectTab: el => { A.ui.reflect = el.dataset.k; render(); }, period: el => { A.ui.period = el.dataset.k; render(); }, groupBy: el => { A.ui.groupBy = el.dataset.k; render(); },
  // settings
  switchPlan: el => { if (el.dataset.id !== A.plan.id) { localSaveAll(); switchPlan(el.dataset.id); } },
  newPlan: () => openSheet('Nouveau budget', `<div class="field"><label for="npName">Nom</label><input id="npName" class="in" value="Nouveau budget"></div>`, `<button class="btn pri block" data-a="newPlanDo">Créer</button>`, { focus: '#npName' }),
  newPlanDo: () => { const n = $('#npName').value.trim() || 'Nouveau budget'; closeSheet(); createPlan(n); },
  createPlan: () => createPlan($('#obName')?.value.trim() || 'Mon budget'),
  demoPlan: () => createPlan('Exemple', true),
  exportJson: () => exportJson(), exportCsv: () => exportCsv(),
  freshStart: () => confirmSheet('Nouveau départ', 'Le budget actuel est archivé (toujours consultable dans « Mes budgets »). Un nouveau budget reprend tes comptes avec leur solde du jour, tes enveloppes et tes objectifs.', 'Repartir de zéro', 'freshDo'),
  freshDo: () => { closeSheet(); freshStart(); },
  resetPlan: () => confirmSheet('Remettre la répartition à zéro', 'Tout l\'argent réparti, sur tous les mois, sera effacé. Tes comptes et opérations restent.', 'Remettre à zéro', 'resetDo'),
  resetDo: () => { mutate('Répartition remise à zéro', () => { A.plan.assigned = {}; A.plan.moves = []; }); closeSheet(); },
  deletePlan: () => confirmSheet('Supprimer ce budget', `« ${esc(A.plan.name)} » et toutes ses opérations seront supprimés définitivement. Exporte une sauvegarde avant si tu as un doute.`, 'Supprimer définitivement', 'deletePlanDo'),
  deletePlanDo: async () => {
    const id = A.plan.id; closeSheet();
    if (DB) { try { await DB.doc('plans/' + id).delete(); const snap = await DB.collection('plans/' + id + '/tx').get(); for (const d of snap.docs) await DB.doc('plans/' + id + '/tx/' + d.id).delete(); } catch (e) { } }
    localDeletePlan(id);
    A.index.plans = A.index.plans.filter(x => x.id !== id); A.index.current = A.index.plans[0]?.id || null; A.plan = null; A.tx = [];
    if (A.index.current) await switchPlan(A.index.current); else { A.index.updatedAt = Date.now(); localSaveAll(); if (DB) DB.doc('meta/index').set(JSON.parse(JSON.stringify(A.index))).catch(() => { }); render(); }
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.a]; if (f) { f(el, e); }
});
// assigned inline inputs
function applyAssign(inp) {
  const cid = inp.dataset.assign; const cur = getAssigned(A.month, cid); let raw = inp.value.trim();
  if (raw === fmtIn(cur)) return;
  let v;
  if (/^[+*/]/.test(raw) || (/^-/.test(raw) && raw.length > 1 && cur !== 0)) { v = evalExpr(fmtIn(cur).replace(',', '.') + raw.replace(',', '.')); }
  else v = evalExpr(raw === '' ? '0' : raw);
  if (v == null) { inp.value = fmtIn(cur); toast('Montant non reconnu'); return; }
  render._keepScroll = true;
  mutate('Réparti : ' + catName(cid) + ' ' + fmt(v), () => setAssigned(A.month, cid, v), { silent: true });
}
document.addEventListener('focusin', e => { if (e.target.matches('.ass-in, .bigamt, [data-sp="amount"]')) setTimeout(() => e.target.select?.(), 0); });
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
  if (el.dataset.cf) { const c = L.cat[el.dataset.c]; const k = el.dataset.cf; const v = el.value; if (k === 'name' && !v.trim()) return; mutate('Enveloppe modifiée', () => { c[k] = k === 'name' ? v.trim() : v; }, { silent: true }); return; }
  if (el.dataset.tf) {
    const c = L.cat[el.dataset.c]; const k = el.dataset.tf;
    mutate('Objectif modifié', () => {
      if (k === 'type') { if (!el.value) c.target = null; else c.target = { ...(c.target || { amount: 0, mode: 'set' }), type: el.value }; return; }
      c.target ||= { type: 'monthly', amount: 0 };
      if (k === 'amount') c.target.amount = Math.abs(evalExpr(el.value) || 0);
      else if (['weekday', 'month', 'repeat'].includes(k)) c.target[k] = +el.value;
      else c.target[k] = el.value || null;
    }, { silent: true });
    catSheet(c.id); return;
  }
  if (el.dataset.mnote) { const m = el.dataset.mnote; mutate('Note du mois enregistrée', () => { (A.plan.notes ||= {})[m] = el.value; }, { silent: true }); return; }
  if (el.dataset.set) { const k = el.dataset.set; mutate('Réglage enregistré', () => { A.plan[k] = k === 'name' ? (el.value.trim() || A.plan.name) : el.value; }); _nfKey = ''; return; }
  if (el.dataset.py) {
    const y = L.payee[el.dataset.id]; const k = el.dataset.py;
    if (k === 'name') {
      const n = el.value.trim(); if (!n) return; const other = L.payeeByName[n.toLowerCase()];
      if (other && other.id !== y.id) { mutate('Bénéficiaires fusionnés', () => { A.tx.forEach(t => { if (t.payee === y.id) t.payee = other.id; }); A.plan.payees = A.plan.payees.filter(p => p.id !== y.id); }); payeesSheet(); }
      else mutate('Bénéficiaire renommé', () => { y.name = n; }, { silent: true });
    } else mutate('Catégorie par défaut enregistrée', () => { y.lastCat = el.value || null; }, { silent: true });
    return;
  }
  if (el.dataset.mp && IMP) { IMP.map[el.dataset.mp] = el.type === 'checkbox' ? el.checked : (el.dataset.mp === 'dfmt' ? el.value : +el.value); return; }
  if (el.dataset.c === 'impFile' && el.files[0]) { onImportFile(el.files[0]); return; }
  if (el.dataset.c === 'ynFile' && el.files.length) { ynFiles([...el.files]); return; }
  if (el.dataset.c === 'restore' && el.files[0]) { restoreFile(el.files[0]); el.value = ''; return; }
  if (el.dataset.c === 'selTx') { if (el.checked) A.ui.selected.add(el.dataset.id); else A.ui.selected.delete(el.dataset.id); $('#actionbar').innerHTML = A.ui.selected.size ? actionBar() : ''; return; }
});
$('#fab').addEventListener('click', () => txSheet(null));

/* ---------- boot ---------- */
(function boot() {
  try { const u = JSON.parse(localStorage.getItem('pecule.ui') || '{}'); if (u.collapsed) A.ui.collapsed = u.collapsed; } catch (e) { }
  const all = localLoad();
  if (all?.index?.plans?.length) {
    A.index = all.index; const cur = all.plans?.[A.index.current] || all.plans?.[A.index.plans[0].id];
    if (cur) { A.plan = cur.plan; A.tx = cur.tx; A.index.current = cur.plan.id; }
  }
  rebuildLookups();
  if (A.plan) { const n = runScheduled(); if (n) localSaveAll(); }
  render();
  initDb();
})();
