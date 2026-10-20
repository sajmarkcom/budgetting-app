/* ================= Pécule — sheets (bottom panels) ================= */
let SH = null; // { render(), onClose }
function openSheet(title, body, foot = '', opts = {}) {
  closeSheet(true);
  const s = document.createElement('div'); s.className = 'scrim'; s.id = 'scrim';
  s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheet-h"><button class="ibtn" data-a="closeSheet" aria-label="Fermer">${I.close}</button><h2>${esc(title)}</h2>${opts.right || '<span style="width:44px"></span>'}</div>
    <div class="sheet-b wrap">${body}</div>${foot ? `<div class="sheet-f wrap">${foot}</div>` : ''}</div>`;
  s.addEventListener('click', e => { if (e.target === s) closeSheet(); });
  document.body.appendChild(s);
  document.body.style.overflow = 'hidden';
  const f = opts.focus && $(opts.focus, s); if (f) setTimeout(() => { f.focus(); if (f.select) f.select(); }, 60);
  return s;
}
function closeSheet(silent) { const s = $('#scrim'); if (s) s.remove(); document.body.style.overflow = ''; SH = null; }
function refreshSheetBody(html) { const b = $('#scrim .sheet-b'); if (b) b.innerHTML = html; }

function catOptions(sel, { rta = true, none = true, m = A.month, noneLabel = 'À catégoriser' } = {}) {
  let o = none ? `<option value="">${noneLabel}</option>` : '';
  if (rta) o += `<option value="rta" ${sel === 'rta' ? 'selected' : ''}>💶 Revenu à répartir (${fmt(monthData(m).rta)})</option>`;
  for (const g of A.plan.groups) {
    if (g.sys === 'cc') continue;
    const cats = A.plan.cats.filter(c => c.gid === g.id && (!c.hidden || c.id === sel)); if (!cats.length) continue;
    o += `<optgroup label="${esc(g.name)}">` + cats.map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(catName(c.id))} · ${fmt(catM(m, c.id).available)}</option>`).join('') + `</optgroup>`;
  }
  return o;
}
function acctOptions(sel, filter = () => true) {
  return A.plan.accounts.filter(a => !a.closed && filter(a)).map(a => `<option value="${a.id}" ${sel === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
}

/* ---------- category sheet ---------- */
function catSheet(cid) {
  const c = L.cat[cid]; if (!c) return;
  const m = A.month, x = catM(m, cid), ti = targetInfo(c, m, x);
  const t = c.target || {};
  const recent = A.tx.filter(tx => monthOf(tx.date) === m && txLines(tx).some(l => l.cat === cid)).sort((a, b) => a.date < b.date ? 1 : -1);
  const prev = addMonths(m, -1), pm = catM(prev, cid);
  const last12 = []; for (let i = 1; i <= 12; i++) last12.push(catM(addMonths(m, -i), cid));
  const nAvg = Math.max(1, Math.min(12, monthDiff(calc().minM, m))); const l12 = last12.slice(0, nAvg);
  const avgA = Math.round(l12.reduce((s, y) => s + y.assigned, 0) / nAvg), avgS = Math.round(l12.reduce((s, y) => s + Math.max(0, -y.activity), 0) / nAvg);
  const quick = [
    ti && ti.under > 0 ? ['Financer l\'objectif', getAssigned(m, cid) + ti.under] : null,
    ['Réparti le mois dernier', pm.assigned], ['Dépensé le mois dernier', Math.max(0, -pm.activity)],
    ['Moyenne répartie', avgA], ['Moyenne dépensée', avgS],
    x.available > 0 ? ['Remettre le dispo à zéro', getAssigned(m, cid) - x.available] : null,
    ['Remettre le réparti à zéro', 0],
  ].filter(Boolean);
  const body = `
    <div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="kpi"><span>Réparti</span><b class="num" style="font-size:17px">${fmt(x.assigned)}</b></div>
      <div class="kpi"><span>Activité</span><b class="num" style="font-size:17px">${fmt(x.activity)}</b></div>
      <div class="kpi"><span>Disponible</span><b class="num" style="font-size:17px; color:${x.available < 0 ? 'var(--bad)' : 'inherit'}">${fmt(x.available)}</b></div>
    </div>
    <div class="small muted">Report de ${monthLabel(prev)} : ${fmt(x.carry)}</div>
    ${x.available < 0 ? `<div class="banner bad">${I.info}<span>${x.creditOver && !x.cashOver ? 'Dépassement sur carte : cette somme devient de la dette à rembourser.' : 'Dépassement : couvre-le avec une autre enveloppe.'}</span></div>
      <button class="btn pri block" data-a="coverSheet" data-c="${cid}">Couvrir le dépassement de ${fmt(-x.available)}</button>` : ''}
    <div class="row"><button class="btn grow" data-a="moveSheet" data-c="${cid}">${I.swap} Déplacer de l'argent</button></div>
    <div class="sec-t" style="padding-top:4px"><span>Répartition automatique</span></div>
    <div class="card">${quick.map(([l, v]) => `<button class="li" data-a="setAssign" data-c="${cid}" data-v="${v}"><span class="grow">${l}</span><strong class="num">${fmt(v)}</strong></button>`).join('')}</div>
    ${c.cc ? ccInfo(c) : targetEditor(c)}
    <div class="sec-t"><span>Détails</span></div>
    <div class="grid2" style="grid-template-columns:76px minmax(0,1fr)">
      <div class="field"><label for="cEmoji">Icône</label><input id="cEmoji" class="in" maxlength="4" value="${esc(c.emoji || '')}" placeholder="Emoji" data-cf="emoji" data-c="${cid}"></div>
      <div class="field"><label for="cName">Nom</label><input id="cName" class="in" value="${esc(c.name)}" data-cf="name" data-c="${cid}" ${c.cc ? 'disabled' : ''}></div>
    </div>
    <div class="field"><label for="cNote">Note</label><textarea id="cNote" class="in" data-cf="note" data-c="${cid}" placeholder="Ex. : loyer payé le 5">${esc(c.note || '')}</textarea></div>
    ${!c.cc ? `<div class="field"><label for="cGroup">Groupe</label><select id="cGroup" class="in" data-cf="gid" data-c="${cid}">${A.plan.groups.filter(g => !g.sys).map(g => `<option value="${g.id}" ${g.id === c.gid ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>` : ''}
    <div class="sec-t"><span>Opérations de ${monthLabel(m)}</span><span class="num">${recent.length}</span></div>
    ${recent.length ? `<div class="card">${recent.slice(0, 30).map(t => txRow(t, true)).join('')}</div>` : `<div class="muted small">Aucune opération ce mois-ci.</div>`}
    ${!c.cc ? `<div class="row" style="margin-top:6px"><button class="btn grow" data-a="cHide" data-c="${cid}">${c.hidden ? I.eye + ' Afficher' : I.eyeoff + ' Masquer'}</button><button class="btn danger grow" data-a="catDelete" data-c="${cid}">${I.trash} Supprimer</button></div>` : ''}`;
  openSheet(c.name, body);
}
function ccInfo(c) {
  const bal = balances()[c.cc]?.working || 0, x = catM(A.month, c.id);
  const gap = -bal - x.available;
  return `<div class="sec-t"><span>Carte de crédit</span></div><div class="card">
    <div class="li"><span class="grow">Solde de la carte</span><strong class="num">${fmt(bal)}</strong></div>
    <div class="li"><span class="grow">Prêt pour le paiement</span><strong class="num">${fmt(x.available)}</strong></div>
    <div class="li"><span class="grow">${gap > 0 ? 'Il manque pour tout payer' : 'Payée en totalité'}</span><strong class="num">${gap > 0 ? fmt(gap) : '✓'}</strong></div></div>
    ${gap > 0 ? `<button class="btn block" data-a="setAssign" data-c="${c.id}" data-v="${getAssigned(A.month, c.id) + gap}">Répartir ${fmt(gap)} pour solder la carte</button>` : ''}
    <button class="btn pri block" data-a="ccPay" data-id="${c.cc}">${I.swap} Enregistrer un paiement</button>`;
}
function targetEditor(c) {
  const t = c.target || {};
  const type = t.type || '';
  const wd = t.weekday ?? 1;
  const ti = targetInfo(c, A.month);
  const opt = (v, l, cur) => `<option value="${v}" ${cur == v ? 'selected' : ''}>${l}</option>`;
  return `<div class="sec-t"><span>Objectif</span>${ti ? `<span>${Math.round(ti.pct * 100)} %</span>` : ''}</div>
  <div class="card" style="padding:14px; display:flex; flex-direction:column; gap:12px" id="tgtBox">
    <div class="field"><label for="tType">Type d'objectif</label><select id="tType" class="in" data-tf="type" data-c="${c.id}">
      ${opt('', 'Aucun objectif', type)}${Object.entries(TARGET_TYPES).map(([k, l]) => opt(k, l, type)).join('')}</select></div>
    ${type ? `<div class="field"><label for="tAmt">Montant</label><input id="tAmt" class="in" inputmode="decimal" value="${t.amount ? fmtIn(t.amount) : ''}" placeholder="0,00" data-tf="amount" data-c="${c.id}"></div>` : ''}
    ${type === 'weekly' ? `<div class="field"><label for="tWd">Chaque</label><select id="tWd" class="in" data-tf="weekday" data-c="${c.id}">${[1, 2, 3, 4, 5, 6, 0].map(d => opt(d, cap(DAYS[d]), wd)).join('')}</select></div>` : ''}
    ${type === 'yearly' ? `<div class="field"><label for="tMo">Pour le mois de</label><select id="tMo" class="in" data-tf="month" data-c="${c.id}">${MONTHS.map((n, i) => opt(i + 1, cap(n), t.month || 12)).join('')}</select></div>` : ''}
    ${type === 'date' || type === 'balance' ? `<div class="field"><label for="tDate">${type === 'balance' ? 'Avant (facultatif)' : 'Avant le mois de'}</label><input id="tDate" class="in" type="month" value="${t.date || ''}" data-tf="date" data-c="${c.id}"></div>` : ''}
    ${type === 'date' ? `<div class="field"><label for="tRep">Répéter</label><select id="tRep" class="in" data-tf="repeat" data-c="${c.id}">${opt(0, 'Ne pas répéter', t.repeat || 0)}${opt(1, 'Tous les mois', t.repeat)}${opt(3, 'Tous les 3 mois', t.repeat)}${opt(6, 'Tous les 6 mois', t.repeat)}${opt(12, 'Tous les ans', t.repeat)}${opt(24, 'Tous les 2 ans', t.repeat)}</select></div>` : ''}
    ${type === 'monthly' || type === 'weekly' ? `<div class="seg" role="group" aria-label="Mode">
      <button class="${t.mode !== 'refill' ? 'on' : ''}" data-a="tMode" data-c="${c.id}" data-v="set">Mettre de côté</button>
      <button class="${t.mode === 'refill' ? 'on' : ''}" data-a="tMode" data-c="${c.id}" data-v="refill">Remplir jusqu'à</button></div>
      <div class="small muted">${t.mode === 'refill' ? 'Le disponible est complété jusqu\'au montant (le reste du mois précédent compte).' : 'Le montant est ajouté chaque mois, même s\'il reste de l\'argent.'}</div>` : ''}
    ${type ? `<div class="field"><label for="tStart">À partir de</label><input id="tStart" class="in" type="month" value="${t.start || ''}" data-tf="start" data-c="${c.id}"></div>` : ''}
    ${ti ? `<div class="bar ${ti.under > 0 ? 'warn' : ''}"><i style="width:${Math.round(ti.pct * 100)}%"></i></div><div class="small"><strong>${esc(ti.label)}</strong>${ti.need ? ' · besoin ce mois-ci : ' + fmt(ti.need) : ''}</div>
      <button class="btn sm" data-a="tSnooze" data-c="${c.id}">${ti.snoozed ? 'Réactiver ce mois-ci' : 'Mettre en pause ce mois-ci'}</button>` : ''}
  </div>`;
}

/* ---------- RTA breakdown ---------- */
function rtaSheet() {
  const m = A.month, md = monthData(m);
  const prevLeft = md.rtaBase - md.income + md.assigned + md.prevCashOver;
  const body = `<div class="card">
    <div class="li"><span class="grow">Reste de ${monthLabel(addMonths(m, -1))}</span><strong class="num">${fmt(prevLeft)}</strong></div>
    <div class="li"><span class="grow">Revenus de ${monthLabel(m)}</span><strong class="num amt-pos">+${fmt(md.income)}</strong></div>
    <div class="li"><span class="grow">Dépassement de ${monthLabel(addMonths(m, -1))}</span><strong class="num">${fmt(-md.prevCashOver)}</strong></div>
    <div class="li"><span class="grow">Réparti en ${monthLabel(m)}</span><strong class="num">${fmt(-md.assigned)}</strong></div>
    <div class="li"><span class="grow">Réparti sur les mois suivants</span><strong class="num">${fmt(-md.future)}</strong></div>
    <div class="li"><strong class="grow">À répartir</strong><strong class="num">${fmt(md.rta)}</strong></div></div>
    ${md.uncat ? `<div class="banner warn">${I.info}<span>${fmt(md.uncat)} d'opérations sans catégorie comptent ici.</span></div>` : ''}
    <div class="grid2"><div class="kpi"><span>Total disponible</span><b class="num">${fmt(md.available)}</b></div><div class="kpi"><span>Activité du mois</span><b class="num">${fmt(md.activity)}</b></div></div>
    <div class="field"><label for="mNote">Note du mois</label><textarea id="mNote" class="in" data-mnote="${m}" placeholder="Ex. : prime reçue, voyage à prévoir…">${esc(A.plan.notes?.[m] || '')}</textarea></div>
    <button class="btn pri block" data-a="assignSheet">${I.wand} Répartition automatique</button>`;
  openSheet('À répartir — ' + monthLabel(m), body);
}

/* ---------- auto-assign ---------- */
function autoOptions(m, cats) {
  const prev = addMonths(m, -1);
  const opts = {
    under: { l: 'Objectifs sous-financés', f: c => { const ti = targetInfo(c, m); return ti ? getAssigned(m, c.id) + ti.under : null; } },
    lastA: { l: 'Réparti le mois dernier', f: c => catM(prev, c.id).assigned },
    lastS: { l: 'Dépensé le mois dernier', f: c => Math.max(0, -catM(prev, c.id).activity) },
    avgA: { l: 'Moyenne répartie (12 mois max)', f: c => { const n = Math.max(1, Math.min(12, monthDiff(calc().minM, m))); let s = 0; for (let i = 1; i <= n; i++) s += catM(addMonths(m, -i), c.id).assigned; return Math.round(s / n); } },
    avgS: { l: 'Moyenne dépensée (12 mois max)', f: c => { const n = Math.max(1, Math.min(12, monthDiff(calc().minM, m))); let s = 0; for (let i = 1; i <= n; i++) s += Math.max(0, -catM(addMonths(m, -i), c.id).activity); return Math.round(s / n); } },
    resetAv: { l: 'Remettre le disponible à zéro', f: c => { const x = catM(m, c.id); return x.available > 0 ? getAssigned(m, c.id) - x.available : null; } },
    resetAs: { l: 'Remettre le réparti à zéro', f: () => 0 },
  };
  const out = [];
  for (const [k, o] of Object.entries(opts)) {
    let delta = 0; const changes = [];
    for (const c of cats) { const v = o.f(c); if (v == null) continue; const cur = getAssigned(m, c.id); if (v !== cur) { delta += v - cur; changes.push([c.id, v]); } }
    out.push({ k, l: o.l, delta, changes });
  }
  return out;
}
function assignSheet() {
  const m = A.month; const cats = A.plan.cats.filter(c => !c.hidden);
  const opts = autoOptions(m, cats);
  const body = `<div class="small muted">S'applique à toutes les enveloppes visibles de ${monthLabel(m)}. Tu peux annuler juste après.</div>
    <div class="card">${opts.map(o => `<button class="li" data-a="autoApply" data-k="${o.k}" ${o.changes.length ? '' : 'disabled'}><span class="grow"><strong>${o.l}</strong><div class="small muted">${o.changes.length} enveloppe${o.changes.length > 1 ? 's' : ''}</div></span><strong class="num ${o.delta > 0 ? '' : 'amt-pos'}">${o.delta > 0 ? '' : '+'}${fmt(-o.delta)}</strong></button>`).join('')}</div>
    <div class="small muted">Le montant affiché est l'effet sur « À répartir » (${fmt(monthData(m).rta)} actuellement).</div>`;
  openSheet('Répartition automatique', body);
}

/* ---------- move money / cover ---------- */
function moveSheet(fromCid, toCid, amount, title) {
  const m = A.month;
  const opts = sel => `<option value="rta" ${sel === 'rta' ? 'selected' : ''}>À répartir (${fmt(monthData(m).rta)})</option>` + A.plan.groups.map(g => {
    const cs = A.plan.cats.filter(c => c.gid === g.id && !c.hidden); if (!cs.length) return '';
    return `<optgroup label="${esc(g.name)}">${cs.map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(catName(c.id))} · ${fmt(catM(m, c.id).available)}</option>`).join('')}</optgroup>`;
  }).join('');
  const body = `<input id="mvAmt" class="bigamt in-amt" inputmode="decimal" value="${amount ? fmtIn(amount) : ''}" placeholder="0,00" aria-label="Montant">
    <div class="field"><label for="mvFrom">Depuis</label><select id="mvFrom" class="in">${opts(fromCid || 'rta')}</select></div>
    <div class="field"><label for="mvTo">Vers</label><select id="mvTo" class="in">${opts(toCid || 'rta')}</select></div>`;
  openSheet(title || 'Déplacer de l\'argent', body, `<button class="btn pri block" data-a="moveDo">Déplacer</button>`, { focus: '#mvAmt' });
}
function coverSheet(cid) {
  const m = A.month, need = -catM(m, cid).available;
  const best = A.plan.cats.filter(c => c.id !== cid && !c.hidden && catM(m, c.id).available >= need).sort((a, b) => catM(m, b.id).available - catM(m, a.id).available)[0];
  moveSheet(monthData(m).rta >= need ? 'rta' : (best?.id || 'rta'), cid, need, 'Couvrir le dépassement');
}
function movesSheet() {
  const m = A.month; const list = A.plan.moves.filter(x => x.m === m).sort((a, b) => b.at - a.at);
  const nm = id => id === 'rta' ? 'À répartir' : catName(id) || 'Enveloppe supprimée';
  const body = list.length ? `<div class="card">${list.map(x => `<div class="li"><span class="ic">${I.swap}</span><span class="grow"><strong class="ellip" style="display:block">${esc(nm(x.from))} → ${esc(nm(x.to))}</strong><span class="small muted">${new Date(x.at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${x.why ? ' · ' + esc(x.why) : ''}</span></span><strong class="num">${fmt(x.amount)}</strong></div>`).join('')}</div>`
    : `<div class="empty"><strong>Aucun mouvement en ${monthLabel(m)}</strong><span>Les déplacements entre enveloppes apparaîtront ici.</span></div>`;
  openSheet('Mouvements — ' + monthLabel(m), body, `<button class="btn block" data-a="moveSheet">${I.swap} Déplacer de l'argent</button>`);
}

/* ---------- transaction editor ---------- */
let D = null;
function txSheet(id, preset = {}) {
  if (id) {
    const t = A.tx.find(x => x.id === id); if (!t) return;
    D = { id: t.id, acct: t.acct, date: t.date, payee: L.payee[t.payee]?.name || '', cat: t.cat || '', memo: t.memo || '', amount: Math.abs(t.amount), kind: t.transferAcct ? 'transfer' : t.amount > 0 ? 'in' : 'out', cleared: t.cleared, flag: t.flag, transferAcct: t.transferAcct || '', approved: t.approved !== false, splits: t.splits ? t.splits.map(s => ({ ...s, amount: Math.abs(s.amount), sign: Math.sign(s.amount) || -1 })) : null, freq: 'never' };
    if (t.transferAcct && t.amount > 0) { // show transfer from the outgoing side
      const pair = A.tx.find(x => x.id === t.transferId);
      if (pair) { D.id = pair.id; D.acct = pair.acct; D.transferAcct = pair.transferAcct; D.cat = pair.cat || t.cat || ''; D.pairCat = t.cat || ''; }
    }
  } else {
    const last = A.ui.lastAcct && L.acct[A.ui.lastAcct] && !L.acct[A.ui.lastAcct].closed ? A.ui.lastAcct : A.plan.accounts.find(a => !a.closed && onBudget(a))?.id || A.plan.accounts.find(a => !a.closed)?.id;
    D = { acct: (A.acct && A.acct !== 'all') ? A.acct : last, date: todayISO(), payee: '', cat: '', memo: '', amount: 0, kind: 'out', cleared: 'u', flag: null, transferAcct: '', approved: true, splits: null, freq: 'never', ...preset };
  }
  openSheet(id ? 'Modifier l\'opération' : 'Nouvelle opération', txBody(), txFoot(), { focus: id ? null : '#txAmt' });
}
function txBody() {
  const a = L.acct[D.acct];
  const tb = D.transferAcct ? L.acct[D.transferAcct] : null;
  const needCat = D.kind === 'transfer' ? (onBudget(a) && tb && !onBudget(tb)) : onBudget(a);
  const payees = A.plan.payees.slice().sort((x, y) => x.name.localeCompare(y.name)).map(y => `<option value="${esc(y.name)}"></option>`).join('');
  let splitHtml = '';
  if (D.splits) {
    const sum = D.splits.reduce((s, x) => s + x.amount, 0);
    splitHtml = `<div class="sec-t" style="padding-top:0"><span>Fractionnement</span><span class="num" id="spStatus" style="color:${sum === D.amount ? 'var(--good)' : 'var(--warn)'}">${sum === D.amount ? 'Équilibré' : 'Reste ' + fmt(D.amount - sum)}</span></div>
      ${D.splits.map((s, i) => `<div class="split"><select class="in" data-sp="cat" data-i="${i}" aria-label="Catégorie ${i + 1}">${catOptions(s.cat, { m: monthOf(D.date) })}</select>
        <input class="in num" inputmode="decimal" data-sp="amount" data-i="${i}" value="${s.amount ? fmtIn(s.amount) : ''}" placeholder="0,00" aria-label="Montant ${i + 1}">
        <button class="ibtn" data-a="spDel" data-i="${i}" aria-label="Retirer">${I.close}</button>
        <input class="in" style="grid-column:1/-1; height:40px; font-size:14px" data-sp="memo" data-i="${i}" value="${esc(s.memo || '')}" placeholder="Mémo (facultatif)" aria-label="Mémo ${i + 1}"></div>`).join('')}
      <div class="row"><button class="btn sm" data-a="spAdd">${I.plus} Ligne</button>${sum !== D.amount ? `<button class="btn sm" data-a="spFill">Mettre le reste sur la dernière ligne</button>` : ''}<button class="btn sm ghost" data-a="spOff">Annuler le fractionnement</button></div>`;
  }
  return `<div class="seg" role="group" aria-label="Type">
      <button class="${D.kind === 'out' ? 'on' : ''}" data-a="kind" data-v="out">Dépense</button>
      <button class="${D.kind === 'in' ? 'on' : ''}" data-a="kind" data-v="in">Revenu</button>
      <button class="${D.kind === 'transfer' ? 'on' : ''}" data-a="kind" data-v="transfer">Virement</button></div>
    <input id="txAmt" class="bigamt ${D.kind === 'in' ? 'in' : 'out'}" inputmode="decimal" value="${D.amount ? fmtIn(D.amount) : ''}" placeholder="0,00" data-d="amount" aria-label="Montant">
    ${D.approved === false ? `<div class="banner info">${I.info}<span>Opération importée : vérifie la catégorie puis valide.</span></div>` : ''}
    <div class="field"><label for="txAcct">${D.kind === 'transfer' ? 'Depuis le compte' : 'Compte'}</label><select id="txAcct" class="in" data-d="acct">${acctOptions(D.acct)}</select></div>
    ${D.kind === 'transfer' ? `<div class="field"><label for="txTo">Vers le compte</label><select id="txTo" class="in" data-d="transferAcct"><option value="">Choisir…</option>${acctOptions(D.transferAcct, x => x.id !== D.acct)}</select></div>`
      : `<div class="field"><label for="txPayee">Bénéficiaire</label><input id="txPayee" class="in" list="payeeList" value="${esc(D.payee)}" data-d="payee" placeholder="Ex. : Lidl, Salaire…" autocomplete="off"><datalist id="payeeList">${payees}</datalist></div>`}
    ${needCat && !D.splits ? `<div class="field"><label for="txCat">Catégorie</label><div class="row"><select id="txCat" class="in grow" data-d="cat">${catOptions(D.cat, { m: monthOf(D.date || todayISO()), rta: D.kind !== 'transfer' })}</select>${D.kind !== 'transfer' ? `<button class="ibtn" data-a="spOn" aria-label="Fractionner">${I.split}</button>` : ''}</div></div>` : ''}
    ${D.kind === 'transfer' && tb && onBudget(a) && onBudget(tb) ? `<div class="small muted">Virement entre deux comptes du budget : aucune catégorie nécessaire.${isCredit(tb) ? ' Ce paiement réduit l\'enveloppe de paiement de la carte.' : ''}</div>` : ''}
    ${splitHtml}
    <div class="grid2"><div class="field"><label for="txDate">Date</label><input id="txDate" class="in" type="date" value="${D.date}" data-d="date"></div>
      <div class="field"><label for="txFreq">Répéter</label><select id="txFreq" class="in" data-d="freq" ${D.id ? 'disabled' : ''}>${Object.entries(FREQ).map(([k, l]) => `<option value="${k}" ${D.freq === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="field"><label for="txMemo">Mémo</label><input id="txMemo" class="in" value="${esc(D.memo)}" data-d="memo" placeholder="Facultatif"></div>
    <div class="field"><span class="lbl2">Drapeau</span><div class="flags"><button class="${!D.flag ? 'on' : ''}" style="background:var(--surface-2)" data-a="dFlag" data-v="" aria-label="Aucun drapeau"></button>${FLAGS.map(([k, l]) => `<button class="${D.flag === k ? 'on' : ''}" style="background:var(--flag-${k})" data-a="dFlag" data-v="${k}" aria-label="${l}"></button>`).join('')}</div></div>
    <label class="switch"><span><strong>Pointée</strong><div class="small muted">Apparue sur le relevé de la banque</div></span><input type="checkbox" id="txClr" data-d="cleared" ${D.cleared !== 'u' ? 'checked' : ''} ${D.cleared === 'r' ? 'disabled' : ''}></label>
    ${D.id ? `<button class="btn danger block" data-a="txDelete">${I.trash} Supprimer l'opération</button>` : ''}`;
}
function updSplitStatus() { const el = $('#spStatus'); if (!el || !D?.splits) return; const sum = D.splits.reduce((s, x) => s + x.amount, 0); el.textContent = sum === D.amount ? 'Équilibré' : 'Reste ' + fmt(D.amount - sum); el.style.color = sum === D.amount ? 'var(--good)' : 'var(--warn)'; }
function txFoot() { return `<button class="btn pri block" data-a="txSave">${D.approved === false ? 'Valider' : D.id ? 'Enregistrer' : 'Ajouter'}</button>${!D.id ? `<button class="btn" data-a="txSaveNew" aria-label="Ajouter et saisir une autre">+1</button>` : ''}`; }
function txRefresh() { const y = $('#scrim .sheet-b')?.scrollTop; refreshSheetBody(txBody()); const f = $('#scrim .sheet-f'); if (f) f.innerHTML = txFoot(); if (y != null) $('#scrim .sheet-b').scrollTop = y; }
function txCommit(again) {
  const amtEl = $('#txAmt'); if (amtEl) { const v = evalExpr(amtEl.value); D.amount = v == null ? 0 : Math.abs(v); }
  if (!D.acct) { toast('Choisis un compte'); return; }
  if (!D.amount) { toast('Indique un montant'); $('#txAmt')?.focus(); return; }
  if (D.kind === 'transfer' && !D.transferAcct) { toast('Choisis le compte de destination'); return; }
  if (D.splits) { const s = D.splits.reduce((x, y) => x + y.amount, 0); if (s !== D.amount) { toast('Le fractionnement doit égaler le montant (reste ' + fmt(D.amount - s) + ')'); return; } }
  const sign = D.kind === 'in' ? 1 : -1;
  const draft = { ...D, amount: sign * D.amount, cat: D.cat || null, cleared: D.cleared, transferAcct: D.kind === 'transfer' ? D.transferAcct : null, approved: true,
    splits: D.splits ? D.splits.map(s => ({ cat: s.cat || null, amount: sign * s.amount, memo: s.memo })) : null };
  if (D.kind !== 'transfer' && !draft.cat && !draft.splits && D.payee) { const y = L.payeeByName[D.payee.trim().toLowerCase()]; if (y?.lastCat && L.cat[y.lastCat]) draft.cat = y.lastCat; }
  const freq = D.freq; const isFuture = D.date > todayISO();
  mutate(D.id ? 'Opération modifiée' : (freq !== 'never' || isFuture) ? 'Opération programmée' : 'Opération ajoutée', () => {
    if (!D.id && (freq !== 'never' || isFuture)) {
      A.plan.scheduled.push({ id: uid(), acct: draft.acct, payee: D.payee, cat: draft.cat, memo: draft.memo, amount: draft.amount, transferAcct: draft.transferAcct, splits: draft.splits, freq, next: D.date, flag: D.flag });
      runScheduled();
    } else saveTx(draft);
    A.ui.lastAcct = draft.acct;
  });
  if (again) { const keep = { acct: D.acct, date: D.date, kind: D.kind }; closeSheet(); txSheet(null, keep); } else closeSheet();
}

/* ---------- accounts ---------- */
function acctSheet(id) {
  const a = id ? L.acct[id] : null;
  const typeOpts = Object.entries(ACCT).map(([k, v]) => `<option value="${k}" ${a?.type === k ? 'selected' : ''}>${v.label}</option>`);
  const groups = { budget: 'Budget (dépenses courantes)', loan: 'Prêts et dettes', tracking: 'Suivi (hors budget)' };
  const grouped = Object.entries(groups).map(([g, l]) => `<optgroup label="${l}">${Object.entries(ACCT).filter(([, v]) => v.grp === g).map(([k, v]) => `<option value="${k}" ${(a?.type || 'checking') === k ? 'selected' : ''}>${v.label}</option>`).join('')}</optgroup>`).join('');
  const debt = a ? isDebt(a) : false;
  const body = `<div class="field"><label for="aName">Nom</label><input id="aName" class="in" value="${esc(a?.name || '')}" placeholder="Ex. : Compte courant Boursorama"></div>
    <div class="field"><label for="aType">Type</label><select id="aType" class="in" ${a ? 'disabled' : ''} data-c="aTypeChange">${grouped}</select></div>
    ${!a ? `<div class="grid2"><div class="field"><label for="aBal">Solde actuel</label><input id="aBal" class="in" inputmode="decimal" placeholder="0,00"></div><div class="field"><label for="aDate">Au</label><input id="aDate" class="in" type="date" value="${todayISO()}"></div></div>
      <div class="small muted" id="aHint">Pour une carte ou un prêt, indique le montant dû (il sera compté en négatif).</div>` : ''}
    <div id="loanBox" ${(!a && true) || debt ? '' : 'hidden'}><div class="grid2"><div class="field"><label for="aRate">Taux annuel (%)</label><input id="aRate" class="in" inputmode="decimal" value="${a?.rate ? String(a.rate).replace('.', ',') : ''}" placeholder="Ex. : 1,2"></div>
      <div class="field"><label for="aMin">Mensualité</label><input id="aMin" class="in" inputmode="decimal" value="${a?.minPay ? fmtIn(a.minPay) : ''}" placeholder="0,00"></div></div></div>
    <div class="field"><label for="aNote">Note</label><input id="aNote" class="in" value="${esc(a?.note || '')}" placeholder="Facultatif"></div>
    ${a ? `<div class="row"><button class="btn grow" data-a="acctClose" data-id="${a.id}">${a.closed ? 'Rouvrir le compte' : 'Clôturer le compte'}</button><button class="btn danger grow" data-a="acctDelete" data-id="${a.id}">${I.trash} Supprimer</button></div>` : ''}`;
  openSheet(a ? 'Modifier le compte' : 'Nouveau compte', body, `<button class="btn pri block" data-a="acctSave" data-id="${id || ''}">${a ? 'Enregistrer' : 'Ajouter le compte'}</button>`, { focus: a ? null : '#aName' });
  if (!a) { const sel = $('#aType'); const upd = () => { $('#loanBox').hidden = !ACCT[sel.value].debt && !ACCT[sel.value].credit; }; sel.addEventListener('change', upd); upd(); }
}

/* ---------- reconcile ---------- */
function reconcileSheet(id, step = 1) {
  const a = L.acct[id], bal = balances()[id];
  let body;
  if (step === 1) body = `<p style="margin:0">Le solde <strong>pointé</strong> de ${esc(a.name)} est de</p><div class="bigamt num">${fmt(bal.cleared)}</div><p class="muted small" style="margin:0">Est-ce le solde affiché par ta banque aujourd'hui (hors opérations en attente) ?</p>
    <div class="grid2"><button class="btn pri" data-a="recYes" data-id="${id}">Oui</button><button class="btn" data-a="recNo" data-id="${id}">Non</button></div>`;
  else body = `<div class="field"><label for="recBal">Solde affiché par la banque</label><input id="recBal" class="in" inputmode="decimal" placeholder="0,00"></div>
    <div class="small muted">Pointe d'abord les opérations manquantes dans le registre. S'il reste un écart, Pécule crée un ajustement.</div>
    <button class="btn pri block" data-a="recAdjust" data-id="${id}">Calculer l'écart et rapprocher</button>`;
  openSheet('Rapprocher', body, '', { focus: step === 2 ? '#recBal' : null });
}

/* ---------- loan planner ---------- */
function loanSheet(id, extra = 0) {
  const a = L.acct[id], bal = -(balances()[id].working); const r = (a.rate || 0) / 100 / 12; const P = a.minPay || 0;
  const sim = pay => { let b = bal, n = 0, int = 0; if (pay <= 0) return null; while (b > 0 && n < 1200) { const i = Math.round(b * r); int += i; b = b + i - pay; n++; if (pay <= i) return null; } return { n, int }; };
  const base = sim(P), withX = sim(P + extra);
  const when = n => { const d = new Date(); d.setMonth(d.getMonth() + n); return cap(MONTHS[d.getMonth()]) + ' ' + d.getFullYear(); };
  const body = `<div class="kpis" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="kpi"><span>Restant dû</span><b class="num">${fmt(bal)}</b></div><div class="kpi"><span>Taux · mensualité</span><b class="num" style="font-size:16px">${(a.rate || 0).toLocaleString('fr-FR')} % · ${fmt(P)}</b></div></div>
    ${!P ? `<div class="banner warn">${I.info}<span>Indique la mensualité et le taux dans les réglages du compte.</span><button class="btn sm" data-a="acctEdit" data-id="${id}">Modifier</button></div>` : ''}
    <div class="field"><label for="lxRange">Remboursement en plus chaque mois : <strong id="lxVal">${fmt(extra)}</strong></label><input id="lxRange" type="range" min="0" max="${Math.max(50000, Math.round(P * 2))}" step="1000" value="${extra}" data-c="loanX" data-id="${id}" style="width:100%; accent-color:var(--accent)"></div>
    <div class="card"><div class="li"><span class="grow">Fin du prêt actuelle</span><strong>${base ? when(base.n) : '—'}</strong></div>
      <div class="li"><span class="grow">Intérêts restants</span><strong class="num">${base ? fmt(base.int) : '—'}</strong></div>
      <div class="li"><span class="grow">Avec ${fmt(extra)} de plus</span><strong>${withX ? when(withX.n) : '—'}</strong></div>
      <div class="li"><span class="grow">Tu gagnes</span><strong class="amt-pos">${base && withX ? (base.n - withX.n) + ' mois · ' + fmt(base.int - withX.int) : '—'}</strong></div></div>
    ${!base && P ? `<div class="banner bad">${I.info}<span>La mensualité ne couvre pas les intérêts.</span></div>` : ''}
    <button class="btn pri block" data-a="loanTarget" data-id="${id}" data-x="${extra}">${I.target} Créer l'enveloppe de remboursement (${fmt(P + extra)} / mois)</button>
    <button class="btn block" data-a="loanInterest" data-id="${id}">Ajouter les intérêts du mois (${fmt(Math.round(bal * r))})</button>`;
  if ($('#scrim') && $('#lxRange')) { refreshSheetBody(body); return; }
  openSheet('Simulateur — ' + a.name, body);
}

/* ---------- credit card payment ---------- */
function ccPaySheet(cardId) {
  const card = L.acct[cardId]; const c = L.ccCat[cardId]; const avail = c ? catM(A.month, c.id).available : 0;
  const from = A.plan.accounts.find(x => onBudget(x) && !isCredit(x) && !x.closed);
  txSheet(null, { kind: 'transfer', acct: from?.id, transferAcct: cardId, amount: Math.max(0, Math.min(avail, -(balances()[cardId].working))) || Math.max(0, -(balances()[cardId].working)), memo: 'Paiement ' + card.name });
}

/* ---------- scheduled ---------- */
function schSheet(id) {
  const s = A.plan.scheduled.find(x => x.id === id); if (!s) return;
  const body = `<div class="field"><label for="sAmt">Montant (négatif = dépense)</label><input id="sAmt" class="in" inputmode="decimal" value="${(s.amount / 100).toFixed(2).replace('.', ',')}"></div>
    ${!s.transferAcct ? `<div class="field"><label for="sPayee">Bénéficiaire</label><input id="sPayee" class="in" value="${esc(s.payee || '')}"></div>
    <div class="field"><label for="sCat">Catégorie</label><select id="sCat" class="in">${catOptions(s.cat)}</select></div>` : `<div class="small muted">Virement vers ${esc(L.acct[s.transferAcct]?.name || '')}</div>`}
    <div class="field"><label for="sAcct">Compte</label><select id="sAcct" class="in">${acctOptions(s.acct)}</select></div>
    <div class="grid2"><div class="field"><label for="sNext">Prochaine date</label><input id="sNext" type="date" class="in" value="${s.next}"></div>
    <div class="field"><label for="sFreq">Fréquence</label><select id="sFreq" class="in">${Object.entries(FREQ).map(([k, l]) => `<option value="${k}" ${s.freq === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="field"><label for="sMemo">Mémo</label><input id="sMemo" class="in" value="${esc(s.memo || '')}"></div>
    <div class="row"><button class="btn grow" data-a="schSkip" data-id="${id}">Sauter la prochaine</button><button class="btn danger grow" data-a="schDel" data-id="${id}">${I.trash} Supprimer</button></div>`;
  openSheet('Opération programmée', body, `<button class="btn pri block" data-a="schSave" data-id="${id}">Enregistrer</button>`);
}
function schListSheet() {
  const list = A.plan.scheduled.slice().sort((a, b) => a.next < b.next ? -1 : 1);
  const body = list.length ? `<div class="card">${list.map(s => `<button class="li" data-a="schEdit" data-id="${s.id}"><span class="ic">${I.repeat}</span><span class="grow"><strong class="ellip" style="display:block">${esc(s.transferAcct ? 'Virement → ' + (L.acct[s.transferAcct]?.name || '') : s.payee || 'Sans bénéficiaire')}</strong><span class="small muted">${fmtDate(s.next)} · ${FREQ[s.freq]} · ${esc(L.acct[s.acct]?.name || '')}</span></span><strong class="num ${s.amount > 0 ? 'amt-pos' : ''}">${fmt(s.amount)}</strong></button>`).join('')}</div>`
    : `<div class="empty"><strong>Aucune opération programmée</strong><span>Dans une nouvelle opération, choisis « Répéter » ou une date future.</span></div>`;
  openSheet('Opérations programmées', body, `<button class="btn block" data-a="newTx">${I.plus} Nouvelle opération</button>`);
}

/* ---------- payees & rules ---------- */
function payeesSheet() {
  const cnt = {}; for (const t of A.tx) if (t.payee) cnt[t.payee] = (cnt[t.payee] || 0) + 1;
  const list = A.plan.payees.slice().sort((a, b) => a.name.localeCompare(b.name));
  const body = `<div class="small muted">Renomme un bénéficiaire avec le nom d'un autre pour les fusionner. La catégorie par défaut est proposée automatiquement à la saisie et à l'import.</div>
    <div class="card">${list.map(y => `<div class="li" style="flex-wrap:wrap"><div class="grow" style="min-width:150px"><input class="in" value="${esc(y.name)}" data-py="name" data-id="${y.id}" aria-label="Nom du bénéficiaire" style="height:40px"></div>
      <select class="in" style="height:40px; width:auto; max-width:46%" data-py="lastCat" data-id="${y.id}" aria-label="Catégorie par défaut">${catOptions(y.lastCat, { noneLabel: 'Aucune catégorie' })}</select>
      <span class="small muted" style="width:56px; text-align:right">${cnt[y.id] || 0} op.</span>
      ${!cnt[y.id] ? `<button class="ibtn" data-a="pyDel" data-id="${y.id}" aria-label="Supprimer">${I.trash}</button>` : ''}</div>`).join('') || '<div class="li muted">Aucun bénéficiaire</div>'}</div>
    <div class="sec-t"><span>Règles de renommage (import)</span></div>
    <div class="card">${A.plan.rules.map((r, i) => `<div class="li"><span class="grow small">Si le libellé contient <strong>${esc(r.contains)}</strong> → <strong>${esc(r.payee)}</strong></span><button class="ibtn" data-a="ruleDel" data-i="${i}" aria-label="Supprimer la règle">${I.trash}</button></div>`).join('') || '<div class="li muted small">Aucune règle</div>'}</div>
    <div class="grid2"><input id="ruleC" class="in" placeholder="Le libellé contient… (ex. CB LIDL)"><input id="ruleP" class="in" placeholder="Renommer en… (ex. Lidl)"></div>
    <button class="btn block" data-a="ruleAdd">${I.plus} Ajouter la règle</button>`;
  openSheet('Bénéficiaires', body);
}

/* ---------- groups / categories ---------- */
function groupSheet(gid) {
  const g = gid ? L.group[gid] : null;
  const body = `<div class="field"><label for="gName">Nom du groupe</label><input id="gName" class="in" value="${esc(g?.name || '')}" placeholder="Ex. : Voiture"></div>
    ${g ? `<div class="row"><button class="btn grow" data-a="gHide" data-g="${g.id}">${g.hidden ? 'Afficher' : 'Masquer'} le groupe</button><button class="btn danger grow" data-a="gDelete" data-g="${g.id}">${I.trash} Supprimer</button></div>` : ''}`;
  openSheet(g ? 'Modifier le groupe' : 'Nouveau groupe', body, `<button class="btn pri block" data-a="gSave" data-g="${gid || ''}">Enregistrer</button>`, { focus: '#gName' });
}
function catNewSheet(gid) {
  const body = `<div class="field"><label for="ncName">Nom de l'enveloppe</label><input id="ncName" class="in" placeholder="Ex. : Essence"></div>`;
  openSheet('Nouvelle enveloppe', body, `<button class="btn pri block" data-a="catCreate" data-g="${gid}">Ajouter</button>`, { focus: '#ncName' });
}
function catDeleteSheet(cid) {
  const c = L.cat[cid]; const used = A.tx.some(t => txLines(t).some(l => l.cat === cid)) || Object.values(A.plan.assigned).some(o => o[cid]);
  const body = used ? `<p style="margin:0">« ${esc(c.name)} » a des opérations ou de l'argent réparti. Choisis l'enveloppe qui les récupère.</p>
    <div class="field"><label for="repCat">Transférer vers</label><select id="repCat" class="in">${catOptions(null, { rta: false, none: false }).replace(`value="${cid}"`, `value="${cid}" disabled`)}</select></div>`
    : `<p style="margin:0">Supprimer « ${esc(c.name)} » ? Tu pourras annuler juste après.</p>`;
  openSheet('Supprimer l\'enveloppe', body, `<button class="btn danger block" data-a="catDeleteDo" data-c="${cid}">Supprimer</button>`);
}
