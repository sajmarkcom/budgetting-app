/* ================= Budget — UI: shell, plan, accounts, register ================= */
const ico = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const I = {
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
let toastTimer;
function toast(msg, withUndo) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.innerHTML = `<span>${esc(msg)}</span>${withUndo ? `<button data-a="undo">Annuler</button>` : ''}`;
  t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3800);
}
function paintSync() { const el = $('#syncState'); if (el) el.innerHTML = syncLabel(); }
function syncLabel() {
  return { local: 'Stocké sur cet appareil', syncing: 'Synchronisation…', synced: 'Synchronisé sur tous tes appareils', error: 'Synchro en échec — données gardées sur cet appareil', quota: 'Espace de synchro plein — exporte une sauvegarde' }[A.sync];
}

/* ---------- shell ---------- */
function render() {
  const app = $('#app');
  if (!A.plan) { app.innerHTML = viewOnboarding(); $('#nav').innerHTML = ''; return; }
  let html = '';
  if (A.view === 'plan') html = viewPlan();
  else if (A.view === 'accounts') html = A.acct ? viewRegister() : viewAccounts();
  else if (A.view === 'tx') { A.acct = 'all'; html = viewRegister(); }
  else if (A.view === 'reflect') html = viewReflect();
  else if (A.view === 'settings') html = viewSettings();
  const y = window.scrollY;
  app.innerHTML = html;
  if (render._keepScroll) window.scrollTo(0, y); render._keepScroll = false;
  $('#nav').innerHTML = `<div>
    ${navBtn('plan', 'Budget', I.plan)}${navBtn('accounts', 'Comptes', I.accts)}${navBtn('tx', 'Opérations', I.list)}${navBtn('reflect', 'Bilan', I.reflect)}${navBtn('settings', 'Réglages', I.gear)}
  </div>`;
  const showFab = (A.view === 'plan' || A.view === 'accounts' || A.view === 'tx') && !A.ui.select && A.plan.accounts.some(a => !a.closed);
  $('#fab').hidden = !showFab;
  if (A.ui.select && A.ui.selected.size) $('#actionbar').innerHTML = actionBar(); else $('#actionbar').innerHTML = '';
}
const navBtn = (v, l, icn) => `<button data-a="nav" data-v="${v}" class="${A.view === v ? 'on' : ''}" aria-current="${A.view === v ? 'page' : 'false'}">${icn}<span>${l}</span></button>`;
function topBar(title, sub, left = '', right = '') {
  return `<div class="top wrap"><div class="top-bar">${left || '<span style="width:44px"></span>'}<div class="top-title"><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${right || '<span style="width:44px"></span>'}</div></div>`;
}
const undoBtns = () => `<button class="ibtn" data-a="undo" aria-label="Annuler" ${A.undo.length ? '' : 'disabled'}>${I.undo}</button>`;

/* ---------- onboarding ---------- */
function viewOnboarding() {
  return `<div class="wrap hero">
    <h1>Mon budget</h1>
    <p>Chaque euro reçoit une mission. Tu répartis l'argent que tu as vraiment, enveloppe par enveloppe, et tu sais à tout moment ce que tu peux dépenser.</p>
    <div class="steps">
      <div class="stepc"><b>1</b><div><strong>Ajoute tes comptes</strong><div class="muted small">Compte courant, épargne, carte, prêts — avec leur solde du jour.</div></div></div>
      <div class="stepc"><b>2</b><div><strong>Répartis ce que tu as</strong><div class="muted small">Le montant « À répartir » va dans tes enveloppes jusqu'à zéro.</div></div></div>
      <div class="stepc"><b>3</b><div><strong>Note ou importe tes dépenses</strong><div class="muted small">Saisie rapide ou import du relevé CSV / OFX / QIF de ta banque.</div></div></div>
    </div>
    <div class="field"><label for="obName">Nom du budget</label><input id="obName" class="in" value="Mon budget" autocomplete="off"></div>
    <button class="btn pri block" data-a="createPlan">Créer mon budget</button>
    <button class="btn block" data-a="ynSheet">Importer mon budget YNAB</button>
    <button class="btn block" data-a="demoPlan">Explorer avec un budget d'exemple</button>
    <label class="btn ghost block" for="restoreFile">${I.upload} Restaurer une sauvegarde</label>
    <input id="restoreFile" type="file" accept=".json,application/json" hidden data-c="restore">
  </div>`;
}

/* ---------- PLAN ---------- */
function viewPlan() {
  const m = A.month, md = monthData(m), p = A.plan;
  const rta = md.rta;
  const rtaCls = rta > 0 ? 'pos' : rta < 0 ? 'neg' : 'zero';
  const rtaLbl = rta > 0 ? 'À répartir' : rta < 0 ? 'Trop réparti' : 'Tout est réparti';
  let under = 0, cost = 0, overN = 0;
  for (const c of p.cats) { if (c.hidden) continue; const s = catStatus(c, m); if (s.ti) { under += s.ti.under; cost += s.ti.need; } if (s.x.available < 0) overN++; }
  const aom = ageOfMoney().at(m === curMonth() ? '9999-12-31' : addMonths(m, 1) + '-00');
  const unapproved = A.tx.filter(t => t.approved === false).length;
  const uncatN = A.tx.filter(t => onBudget(L.acct[t.acct]) && !t.transferAcct && !(t.splits && t.splits.length) && !t.cat).length;
  let h = topBar(monthLabel(m), esc(p.name),
    `<button class="ibtn" data-a="month" data-d="-1" aria-label="Mois précédent">${I.left}</button>`,
    `<button class="ibtn" data-a="month" data-d="1" aria-label="Mois suivant">${I.right}</button>`);
  h += `<div class="wrap">
    <button class="rta ${rtaCls}" data-a="rtaSheet" aria-label="Détail de l'argent à répartir">
      <div><div class="lbl">${rtaLbl}</div><div class="amt num">${fmt(rta)}</div></div>
      ${rta !== 0 ? `<span class="cta" data-a="${rta > 0 ? 'assignSheet' : 'fixOver'}">${rta > 0 ? 'Répartir' : 'Corriger'}</span>` : `<span class="cta" data-a="assignSheet">Auto-répartir</span>`}
    </button>
    <div class="stats">
      <button class="stat" data-a="statInfo" data-k="aom"><span>Âge de l'argent</span><b class="num">${aom == null ? '—' : aom + ' j'}</b></button>
      <button class="stat" data-a="statInfo" data-k="cost"><span>Coût de ma vie</span><b class="num">${fmt(cost)}</b></button>
      <button class="stat" data-a="filter" data-f="under"><span>Sous-financé</span><b class="num">${fmt(under)}</b></button>
      <button class="stat" data-a="nav" data-v="reflect"><span>Dépensé ce mois</span><b class="num">${fmt(-Math.min(0, md.activity))}</b></button>
    </div>`;
  if (overN) h += `<div class="banner bad">${I.info}<span>${overN} enveloppe${overN > 1 ? 's' : ''} en dépassement</span><button class="btn sm danger btn" data-a="filter" data-f="over">Voir</button></div>`;
  if (unapproved) h += `<div class="banner info">${I.info}<span>${unapproved} opération${unapproved > 1 ? 's' : ''} importée${unapproved > 1 ? 's' : ''} à valider</span><button class="btn sm" data-a="openAll" data-f="unapproved">Valider</button></div>`;
  if (uncatN) h += `<div class="banner warn">${I.info}<span>${uncatN} opération${uncatN > 1 ? 's' : ''} sans catégorie</span><button class="btn sm" data-a="openAll" data-f="uncat">Catégoriser</button></div>`;
  if (md.prevCashOver > 0) h += `<div class="banner warn">${I.info}<span>Dépassement de ${monthLabel(addMonths(m, -1))} : ${fmt(md.prevCashOver)} retirés de l'argent à répartir</span></div>`;
  const F = A.ui.filter;
  h += `<div class="chips" role="toolbar" aria-label="Filtres">
    ${chip('all', 'Tout')}${chip('under', 'Sous-financé')}${chip('over', 'Dépassé')}${chip('avail', 'Argent dispo')}${chip('snoozed', 'En pause')}
    <span style="flex:1"></span>
    <button class="chip" data-a="moves">${I.swap}Mouvements</button>
    <button class="chip ${A.ui.edit ? 'on' : ''}" data-a="toggleEdit">${I.edit}${A.ui.edit ? 'Terminer' : 'Modifier'}</button>
    ${undoBtns()}
  </div>`;
  h += `<div class="colhead"><span class="c-name">Enveloppe</span><span class="w-ass">Réparti</span><span class="w-act hide-s">Activité</span><span class="w-av">Disponible</span></div>`;
  const groups = p.groups.filter(g => g.sys !== 'cc' || p.cats.some(c => c.gid === g.id && !c.hidden));
  let shown = 0;
  for (const g of groups) {
    if (g.hidden && !A.ui.edit) continue;
    let cats = p.cats.filter(c => c.gid === g.id && (!c.hidden || A.ui.edit && A.ui.showHidden));
    const st = c => catStatus(c, m);
    if (F !== 'all') cats = cats.filter(c => { const s = st(c); return F === 'under' ? s.ti && s.ti.under > 0 : F === 'over' ? s.x.available < 0 : F === 'avail' ? s.x.available > 0 : F === 'snoozed' ? s.ti && s.ti.snoozed : true; });
    if (!cats.length && (F !== 'all' || (!A.ui.edit && g.sys))) continue;
    const col = !!A.ui.collapsed[g.id] && F === 'all';
    let ga = 0, gact = 0, gav = 0; for (const c of cats) { const x = catM(m, c.id); ga += x.assigned; gact += x.activity; gav += x.available; }
    h += `<section class="group" aria-label="${esc(g.name)}">
      <div class="ghead ${col ? 'collapsed' : ''}">
        <button class="gname" data-a="collapse" data-g="${g.id}" aria-expanded="${!col}">${I.down}<span style="text-align:left; line-height:1.2">${esc(g.name)}${g.hidden ? ' (masqué)' : ''}</span></button>
        ${A.ui.edit && !g.sys ? `<div class="editrow">
          <button class="ibtn" data-a="gMove" data-g="${g.id}" data-d="-1" aria-label="Monter le groupe">${I.up}</button>
          <button class="ibtn" data-a="gMove" data-g="${g.id}" data-d="1" aria-label="Descendre le groupe">${I.down}</button>
          <button class="ibtn" data-a="gEdit" data-g="${g.id}" aria-label="Modifier le groupe">${I.edit}</button></div>`
        : `<span class="gsum num w-ass">${fmt(ga)}</span><span class="gsum num w-act hide-s">${fmt(gact)}</span><span class="gsum num w-av">${fmt(gav)}</span>`}
      </div>`;
    if (!col) {
      for (const c of cats) { h += catRow(c, m); shown++; }
      if (A.ui.edit && !g.sys) h += `<div class="addline"><button class="btn sm" data-a="catNew" data-g="${g.id}">${I.plus} Ajouter une enveloppe</button></div>`;
    }
    h += `</section>`;
  }
  if (F !== 'all' && !shown) h += `<div class="empty"><strong>Aucune enveloppe dans ce filtre</strong><button class="btn sm" data-a="filter" data-f="all">Tout afficher</button></div>`;
  if (A.ui.edit) {
    const hid = p.cats.filter(c => c.hidden).length;
    h += `<div class="row" style="margin-top:14px; flex-wrap:wrap">
      <button class="btn" data-a="groupNew">${I.plus} Nouveau groupe</button>
      ${hid ? `<button class="btn" data-a="toggleHidden">${A.ui.showHidden ? I.eyeoff : I.eye} ${A.ui.showHidden ? 'Cacher' : 'Afficher'} les enveloppes masquées (${hid})</button>` : ''}
    </div>`;
  }
  if (!p.accounts.length) h += `<div class="banner info" style="margin-top:16px">${I.info}<span>Commence par ajouter ton compte courant avec son solde du jour.</span><button class="btn sm pri" data-a="acctNew">Ajouter</button></div>`;
  h += `<p class="kbd-hint" style="margin-top:14px">Astuce : dans « Réparti », tape <b>+50</b> pour ajouter 50 € ou <b>120/3</b> pour calculer.</p>`;
  h += `</div>`;
  return h;
}
const chip = (f, l) => `<button class="chip ${A.ui.filter === f ? 'on' : ''}" data-a="filter" data-f="${f}">${l}</button>`;
function catRow(c, m) {
  const s = catStatus(c, m), x = s.x, ti = s.ti;
  const barCls = s.cls === 'bad' || s.cls === 'credit' ? 'bad' : s.cls === 'warn' ? 'warn' : '';
  let note = '';
  if (x.available < 0) note = x.creditOver > 0 && !x.cashOver ? 'Dépassé sur carte de crédit : ' + fmt(x.creditOver) : 'Dépassé de ' + fmt(-x.available);
  else if (ti) note = ti.label;
  else if (c.cc) note = 'Paiement de carte · solde ' + fmt(-(balances()[c.cc]?.working || 0));
  return `<div class="cat ${c.hidden ? 'muted' : ''}">
    <button class="cname" data-a="catSheet" data-c="${c.id}">
      <span class="t">${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}${c.hidden ? ' (masquée)' : ''}</span>
      ${ti && ti.total > 0 ? `<span class="bar ${barCls}"><i style="width:${Math.round(ti.pct * 100)}%"></i></span>` : ''}
      ${note ? `<span class="note ellip">${esc(note)}</span>` : ''}
    </button>
    ${A.ui.edit && !c.cc ? `<div class="editrow">
      <button class="ibtn" data-a="cMove" data-c="${c.id}" data-d="-1" aria-label="Monter">${I.up}</button>
      <button class="ibtn" data-a="cMove" data-c="${c.id}" data-d="1" aria-label="Descendre">${I.down}</button>
      <button class="ibtn" data-a="cHide" data-c="${c.id}" aria-label="${c.hidden ? 'Afficher' : 'Masquer'}">${c.hidden ? I.eye : I.eyeoff}</button></div>` : `
    <input class="ass-in w-ass" inputmode="decimal" enterkeyhint="done" aria-label="Réparti pour ${esc(c.name)}" data-assign="${c.id}" value="${fmtIn(x.assigned)}">
    <span class="w-act hide-s num muted" style="font-weight:700; font-size:13.5px">${fmt(x.activity)}</span>
    <span class="w-av"><button class="pill ${s.cls}" data-a="pillTap" data-c="${c.id}">${fmt(x.available)}</button></span>`}
  </div>`;
}

/* ---------- ACCOUNTS ---------- */
function viewAccounts() {
  const p = A.plan, b = balances();
  const sections = [['budget', 'Comptes du budget'], ['loan', 'Prêts'], ['tracking', 'Comptes de suivi']];
  let net = 0; for (const a of p.accounts) if (!a.closed) net += b[a.id].working;
  let h = topBar('Comptes', 'Patrimoine net ' + fmt(net), undoBtns(), `<button class="ibtn" data-a="acctNew" aria-label="Ajouter un compte">${I.plus}</button>`);
  h += `<div class="wrap">`;
  if (!p.accounts.length) {
    h += `<div class="empty"><strong>Aucun compte pour l'instant</strong><span>Ajoute ton compte courant avec le solde affiché par ta banque aujourd'hui.</span><button class="btn pri" data-a="acctNew">${I.plus} Ajouter un compte</button></div></div>`;
    return h;
  }
  for (const [grp, lbl] of sections) {
    const list = p.accounts.filter(a => ACCT[a.type].grp === grp && !a.closed);
    if (!list.length) continue;
    const tot = list.reduce((s, a) => s + b[a.id].working, 0);
    h += `<div class="sec-t"><span>${lbl}</span><span class="num">${fmt(tot)}</span></div><div class="card">`;
    for (const a of list) {
      const x = b[a.id]; const unap = A.tx.filter(t => t.acct === a.id && t.approved === false).length;
      h += `<button class="li" data-a="openAcct" data-id="${a.id}"><span class="ic">${acctIcon(a)}</span>
        <span class="grow"><strong class="ellip" style="display:block">${esc(a.name)}</strong><span class="small muted">${ACCT[a.type].label}${unap ? ` · <b style="color:var(--info)">${unap} à valider</b>` : ''}${a.lastRec ? ' · rapproché le ' + fmtDate(a.lastRec) : ''}</span></span>
        <strong class="num ${x.working < 0 ? 'amt-bad' : ''}">${fmt(x.working)}</strong></button>`;
    }
    h += `</div>`;
  }
  const closed = p.accounts.filter(a => a.closed);
  if (closed.length) {
    h += `<div class="sec-t"><span>Comptes clôturés</span></div><div class="card">`;
    for (const a of closed) h += `<button class="li" data-a="openAcct" data-id="${a.id}"><span class="ic">${acctIcon(a)}</span><span class="grow muted">${esc(a.name)}</span><span class="num muted">${fmt(b[a.id].working)}</span></button>`;
    h += `</div>`;
  }
  h += `<div class="row" style="margin-top:16px; flex-wrap:wrap"><button class="btn" data-a="acctNew">${I.plus} Ajouter un compte</button><button class="btn" data-a="importSheet">${I.upload} Importer un relevé</button></div></div>`;
  return h;
}

function regList() {
  const id = A.acct; const f = A.ui.regFilter; const q = A.ui.search.trim().toLowerCase();
  let list = id === 'all' ? A.tx.filter(t => L.acct[t.acct]) : A.tx.filter(t => t.acct === id);
  if (f === 'unapproved') list = list.filter(t => t.approved === false);
  else if (f === 'uncleared') list = list.filter(t => t.cleared === 'u');
  else if (f === 'cleared') list = list.filter(t => t.cleared !== 'u');
  else if (f === 'flagged') list = list.filter(t => t.flag);
  else if (f === 'uncat') list = list.filter(t => onBudget(L.acct[t.acct]) && !t.transferAcct && !(t.splits && t.splits.length) && !t.cat);
  if (q) list = list.filter(t => {
    const hay = [payeeName(t), t.memo, catName(t.cat), ...(t.splits || []).map(s => catName(s.cat) + ' ' + (s.memo || '')), fmtIn(Math.abs(t.amount)), L.acct[t.acct]?.name].join(' ').toLowerCase();
    return hay.includes(q);
  });
  return list.sort((a, b) => a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1);
}
function viewRegister() {
  const id = A.acct, all = id === 'all', a = all ? null : L.acct[id];
  if (!all && !a) { A.acct = null; return viewAccounts(); }
  const b = balances();
  const bal = all ? Object.entries(b).filter(([k]) => onBudget(L.acct[k])).map(([, v]) => v).reduce((s, x) => ({ cleared: s.cleared + x.cleared, uncleared: s.uncleared + x.uncleared, working: s.working + x.working }), { cleared: 0, uncleared: 0, working: 0 }) : b[id];
  let h = topBar(all ? 'Opérations' : esc(a.name), all ? 'Comptes du budget · ' + fmt(bal.working) : ACCT[a.type].label,
    A.view === 'tx' ? undoBtns() : `<button class="ibtn" data-a="backAccts" aria-label="Retour aux comptes">${I.left}</button>`,
    all ? (A.view === 'tx' ? `<button class="ibtn" data-a="importSheet" aria-label="Importer un relevé">${I.upload}</button>` : undoBtns()) : `<button class="ibtn" data-a="acctEdit" data-id="${id}" aria-label="Modifier le compte">${I.edit}</button>`);
  h += `<div class="wrap">`;
  h += `<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">
    <div class="kpi"><span>Pointé</span><b class="num" style="font-size:17px">${fmt(bal.cleared)}</b></div>
    <div class="kpi"><span>Non pointé</span><b class="num" style="font-size:17px">${fmt(bal.uncleared)}</b></div>
    <div class="kpi"><span>Solde</span><b class="num" style="font-size:17px">${fmt(bal.working)}</b></div></div>`;
  h += `<div class="row" style="margin-top:10px; flex-wrap:wrap">
    ${!all ? `<button class="btn sm" data-a="reconcile" data-id="${id}">${I.lock} Rapprocher</button>` : ''}
    ${!all ? `<button class="btn sm" data-a="importSheet" data-id="${id}">${I.upload} Importer</button>` : ''}
    ${!all && isDebt(a) ? `<button class="btn sm" data-a="loanPlanner" data-id="${id}">${I.target} Simulateur de remboursement</button>` : ''}
    ${!all && isCredit(a) ? `<button class="btn sm" data-a="ccPay" data-id="${id}">${I.swap} Payer la carte</button>` : ''}
    <button class="btn sm ${A.ui.select ? 'pri' : ''}" data-a="toggleSelect">${I.sel} ${A.ui.select ? 'Terminer' : 'Sélectionner'}</button>
  </div>`;
  h += `<div class="row" style="margin-top:10px"><div class="grow" style="position:relative"><input id="regSearch" class="in" type="search" placeholder="Rechercher bénéficiaire, catégorie, montant…" value="${esc(A.ui.search)}" data-i="search" aria-label="Rechercher"></div></div>`;
  const rf = (f, l) => `<button class="chip ${A.ui.regFilter === f ? 'on' : ''}" data-a="regFilter" data-f="${f}">${l}</button>`;
  h += `<div class="chips">${rf('all', 'Toutes')}${rf('unapproved', 'À valider')}${rf('uncat', 'Sans catégorie')}${rf('uncleared', 'Non pointées')}${rf('cleared', 'Pointées')}${rf('flagged', 'Avec drapeau')}</div>`;
  // scheduled
  const sch = A.plan.scheduled.filter(s => all || s.acct === id || s.transferAcct === id).sort((x, y) => x.next < y.next ? -1 : 1);
  if (sch.length && A.ui.regFilter === 'all' && !A.ui.search) {
    h += `<div class="day">À venir</div><div class="card">`;
    for (const s of sch.slice(0, 8)) h += `<div class="tx"><span class="ic" style="width:30px;color:var(--muted)">${I.repeat}</span>
      <button class="main" data-a="schEdit" data-id="${s.id}"><span class="p ellip">${esc(s.transferAcct ? 'Virement → ' + (L.acct[s.transferAcct]?.name || '') : s.payee)}</span><span class="c">${fmtDate(s.next)} · ${FREQ[s.freq]}${s.cat ? ' · ' + esc(catName(s.cat)) : ''}</span></button>
      <span class="a num ${s.amount > 0 ? 'amt-pos' : ''}">${fmt(s.amount)}</span>
      <button class="btn sm" data-a="schNow" data-id="${s.id}">Saisir</button></div>`;
    h += `</div>`;
  }
  const list = regList();
  if (!list.length) {
    h += `<div class="empty"><strong>${A.ui.search || A.ui.regFilter !== 'all' ? 'Aucune opération ne correspond' : 'Aucune opération'}</strong>${!A.ui.search && A.ui.regFilter === 'all' ? `<span>Ajoute une dépense avec le bouton + ou importe un relevé.</span>` : ''}</div>`;
  } else {
    // running balance (per account only, unfiltered)
    const run = {};
    if (!all) { let r = 0; const asc = A.tx.filter(t => t.acct === id).sort((x, y) => x.date === y.date ? (x.id < y.id ? -1 : 1) : x.date < y.date ? -1 : 1); for (const t of asc) { r += t.amount; run[t.id] = r; } }
    let day = '';
    const lim = A.ui.regLimit || 150;
    for (const t of list.slice(0, lim)) {
      if (t.date !== day) { if (day) h += `</div>`; day = t.date; h += `<div class="day">${dayLabel(t.date)}</div><div class="card">`; }
      h += txRow(t, all, run[t.id]);
    }
    h += `</div>`;
    if (list.length > lim) h += `<div style="text-align:center; margin-top:12px"><button class="btn" data-a="more">Afficher plus (${list.length - lim})</button></div>`;
  }
  h += `</div>`;
  return h;
}
function txRow(t, showAcct, runBal) {
  const a = L.acct[t.acct];
  let c = '';
  const todo = onBudget(a) && !t.transferAcct && !(t.splits && t.splits.length) && !t.cat;
  if (t.splits && t.splits.length) c = 'Fractionnée · ' + t.splits.length + ' catégories';
  else if (t.cat === '__start') c = 'Solde initial';
  else if (t.cat) c = catName(t.cat);
  else if (t.transferAcct) c = onBudget(a) && onBudget(L.acct[t.transferAcct]) ? 'Virement entre comptes du budget' : '';
  else if (todo) c = 'À catégoriser';
  if (showAcct) c = esc(a?.name || '') + (c ? ' · ' + c : '');
  if (t.memo) c += (c ? ' · ' : '') + t.memo;
  const sel = A.ui.select;
  return `<div class="tx ${t.approved === false ? 'unapproved' : ''}">
    ${sel ? `<input type="checkbox" class="chk" data-c="selTx" data-id="${t.id}" ${A.ui.selected.has(t.id) ? 'checked' : ''} aria-label="Sélectionner">` : ''}
    ${t.flag ? `<span class="flag" style="background:var(--flag-${t.flag})" title="Drapeau"></span>` : ''}
    <button class="main" data-a="txEdit" data-id="${t.id}"><span class="p ellip">${esc(payeeName(t) || 'Sans bénéficiaire')}</span><span class="c ellip ${todo ? 'todo' : ''}">${esc(c)}</span></button>
    <div><div class="a ${t.amount > 0 ? 'amt-pos' : ''}">${t.amount > 0 ? '+' : ''}${fmt(t.amount)}</div>${runBal != null ? `<div class="rb num">${fmt(runBal)}</div>` : ''}</div>
    ${t.approved === false ? `<button class="btn sm pri" data-a="approve" data-id="${t.id}" aria-label="Valider">${I.check}</button>` :
      `<button class="clr ${t.cleared}" data-a="clr" data-id="${t.id}" aria-label="${t.cleared === 'u' ? 'Non pointée' : t.cleared === 'c' ? 'Pointée' : 'Rapprochée'}">${t.cleared === 'r' ? I.lock.replace('<svg', '<svg width="14" height="14"') : 'P'}</button>`}
  </div>`;
}
function actionBar() {
  const n = A.ui.selected.size;
  return `<div role="toolbar" aria-label="Actions groupées"><span style="padding:0 8px; font-weight:800; white-space:nowrap">${n}</span>
    <button data-a="bulk" data-k="cat">Catégoriser</button><button data-a="bulk" data-k="approve">Valider</button><button data-a="bulk" data-k="clear">Pointer</button>
    <button data-a="bulk" data-k="flag">Drapeau</button><button data-a="bulk" data-k="date">Date</button><button data-a="bulk" data-k="del">Supprimer</button><button data-a="bulk" data-k="none" aria-label="Tout désélectionner">${I.close.replace('<svg', '<svg width="18" height="18"')}</button></div>`;
}
