/* ================= Budget — import from a YNAB export (runs fully on the device) ================= */
let YN = null;
const YN_MONTHS = { jan: 1, janv: 1, janvier: 1, january: 1, feb: 2, fev: 2, fevr: 2, fevrier: 2, february: 2, mar: 3, mars: 3, march: 3, apr: 4, avr: 4, avril: 4, april: 4, may: 5, mai: 5, jun: 6, juin: 6, june: 6, jul: 7, juil: 7, juillet: 7, july: 7, aug: 8, aou: 8, aout: 8, august: 8, sep: 9, sept: 9, septembre: 9, september: 9, oct: 10, octobre: 10, october: 10, nov: 11, novembre: 11, november: 11, dec: 12, decembre: 12, december: 12 };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
function ynMonth(s) {
  s = norm(s).replace(/\./g, '');
  let m = s.match(/^([a-z]+)\s+(\d{4})$/); if (m && YN_MONTHS[m[1]]) return m[2] + '-' + pad(YN_MONTHS[m[1]]);
  m = s.match(/^(\d{4})[-/](\d{1,2})/); if (m) return m[1] + '-' + pad(+m[2]);
  m = s.match(/^(\d{1,2})[-/.](\d{4})$/); if (m) return m[2] + '-' + pad(+m[1]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); if (m) return m[3] + '-' + pad(+m[2]);
  return null;
}
function ynSheet() {
  YN = { files: [], reg: null, plan: null };
  const body = `<p style="margin:0">Importe ton historique YNAB complet : comptes, enveloppes, réparti mois par mois et toutes les opérations. Tout se passe sur ce téléphone, rien n'est envoyé nulle part.</p>
    <div class="card" style="padding:14px; display:flex; flex-direction:column; gap:8px">
      <strong>1. Exporter depuis YNAB (sur ordinateur)</strong>
      <span class="small muted">app.ynab.com → menu du budget (en haut à gauche) → « Export Plan ». YNAB télécharge un fichier .zip. Range-le dans ton Google Drive.</span>
      <strong>2. Le choisir ici</strong>
      <span class="small muted">Sélectionne le .zip, ou les deux fichiers qu'il contient (Plan et Register).</span>
    </div>
    <label class="btn pri block" for="ynFile">${I.file} Choisir l'export YNAB</label><input id="ynFile" type="file" multiple accept=".zip,.csv,.tsv,.txt,application/zip,text/csv" hidden data-c="ynFile">
    <div id="ynStep"></div>`;
  openSheet('Importer depuis YNAB', body);
}
async function loadJSZip() {
  if (window.JSZip) return window.JSZip;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.JSZip;
}
async function ynFiles(fileList) {
  const step = $('#ynStep'); step.innerHTML = `<div class="muted small">Lecture…</div>`;
  const texts = [];
  try {
    for (const f of fileList) {
      if (/\.zip$/i.test(f.name) || f.type.includes('zip')) {
        const JSZip = await loadJSZip(); const z = await JSZip.loadAsync(await f.arrayBuffer());
        for (const name of Object.keys(z.files)) { if (z.files[name].dir || !/\.(csv|tsv|txt)$/i.test(name)) continue; texts.push(decodeFile(await z.files[name].async('arraybuffer'))); }
      } else texts.push(decodeFile(await f.arrayBuffer()));
    }
  } catch (e) { step.innerHTML = `<div class="banner bad">${I.info}<span>Impossible d'ouvrir le fichier. Si c'est un .zip, ouvre-le dans l'app Fichiers puis choisis les deux fichiers qu'il contient.</span></div>`; return; }
  for (const t of texts) {
    const rows = parseCSV(t); if (!rows.length) continue;
    const h = rows[0].map(norm);
    if (h.includes('payee') && h.includes('account')) YN.reg = rows;
    else if (h.includes('month') && (h.includes('assigned') || h.includes('budgeted'))) YN.plan = rows;
  }
  if (!YN.reg) { step.innerHTML = `<div class="banner bad">${I.info}<span>Je ne trouve pas le fichier des opérations (Register). Vérifie que c'est bien l'export « Export Plan » de YNAB.</span></div>`; return; }
  ynAnalyse(); ynPreview();
}
function ynAnalyse() {
  const H = YN.reg[0].map(norm); const col = n => H.indexOf(n);
  const c = { acct: col('account'), flag: col('flag'), date: col('date'), payee: col('payee'), gc: col('category group/category'), g: col('category group'), cat: col('category'), memo: col('memo'), out: col('outflow'), inn: col('inflow'), clr: col('cleared') };
  const rows = YN.reg.slice(1).filter(r => r[c.acct]);
  // date format: look for a first or second part > 12
  let dfmt = 'dmy';
  for (const r of rows) { const m = (r[c.date] || '').match(/^(\d{1,2})[./-](\d{1,2})[./-]\d{2,4}/); if (!m) continue; if (+m[1] > 12) { dfmt = 'dmy'; break; } if (+m[2] > 12) { dfmt = 'mdy'; break; } }
  const accts = {};
  const tx = [];
  for (const r of rows) {
    const date = parseDateAny(r[c.date], dfmt); if (!date) continue;
    const amount = (parseMoney(r[c.inn]) || 0) - Math.abs(parseMoney(r[c.out]) || 0);
    const a = r[c.acct].trim(); (accts[a] ||= { name: a, n: 0, bal: 0, cats: 0 }); accts[a].n++; accts[a].bal += amount;
    if ((r[c.cat] || '').trim()) accts[a].cats++;
    tx.push({ acct: a, date, payee: (r[c.payee] || '').trim(), group: (r[c.g] || '').trim(), cat: (r[c.cat] || '').trim(), memo: (r[c.memo] || '').trim(), amount, cleared: norm(r[c.clr]), flag: norm(c.flag >= 0 ? r[c.flag] : '') });
  }
  for (const a of Object.values(accts)) {
    const n = norm(a.name);
    a.type = /carte|card|visa|amex|mastercard|credit|differe/.test(n) ? 'credit' : /livret|epargne|saving|pel\b|lep\b|ldd/.test(n) ? 'savings' : /pret|loan|emprunt|credit immo/.test(n) ? 'personal' : /espece|cash|liquide/.test(n) ? 'cash' : 'checking';
    if (a.cats === 0 && !/transfer/.test(n)) { /* no categorised rows: maybe a tracking account; keep guess, user can change */ }
  }
  YN.dfmt = dfmt; YN.accts = accts; YN.tx = tx;
  // plan file
  YN.months = {}; YN.cats = []; YN.avail = {};
  if (YN.plan) {
    const P = YN.plan[0].map(norm); const pc = n => P.indexOf(n);
    const k = { m: pc('month'), g: pc('category group'), cat: pc('category'), as: pc('assigned') >= 0 ? pc('assigned') : pc('budgeted'), av: pc('available') };
    const seen = new Set();
    for (const r of YN.plan.slice(1)) {
      const m = ynMonth(r[k.m]); const g = (r[k.g] || '').trim(), ct = (r[k.cat] || '').trim(); if (!m || !ct) continue;
      const key = g + '\u0001' + ct; if (!seen.has(key)) { seen.add(key); YN.cats.push({ g, c: ct }); }
      (YN.months[m] ||= {})[key] = parseMoney(r[k.as]) || 0;
      if (k.av >= 0) (YN.avail[m] ||= {})[key] = parseMoney(r[k.av]) || 0;
    }
  }
}
function ynPreview() {
  const A_ = Object.values(YN.accts);
  const mN = Object.keys(YN.months).length;
  const opts = sel => Object.entries(ACCT).map(([k, v]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${v.label}</option>`).join('');
  $('#ynStep').innerHTML = `<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="kpi"><span>Opérations</span><b>${YN.tx.length}</b></div><div class="kpi"><span>Comptes</span><b>${A_.length}</b></div><div class="kpi"><span>Mois de budget</span><b>${mN || '—'}</b></div></div>
    ${YN.plan ? '' : `<div class="banner warn">${I.info}<span>Fichier Plan absent : les opérations seront importées, mais pas le réparti mois par mois.</span></div>`}
    <div class="sec-t"><span>Type de chaque compte</span></div>
    <div class="small muted">Vérifie surtout les cartes de crédit (débit différé) et les comptes de suivi : ça change les calculs.</div>
    <div class="card">${A_.map((a, i) => `<div class="li" style="flex-wrap:wrap"><span class="grow" style="min-width:140px"><strong class="ellip" style="display:block">${esc(a.name)}</strong><span class="small muted">${a.n} opérations · ${fmt(a.bal)}</span></span>
      <select class="in" style="height:40px; width:auto; max-width:55%" data-yn="${i}" aria-label="Type de ${esc(a.name)}">${opts(a.type)}</select></div>`).join('')}</div>
    <div class="small muted">Dates lues au format ${YN.dfmt === 'mdy' ? 'MM/JJ/AAAA' : 'JJ/MM/AAAA'}. L'import crée un nouveau budget « Import YNAB » : ton budget actuel n'est pas touché.</div>
    <button class="btn pri block" data-a="ynDo">Importer dans un nouveau budget</button>`;
  $$('[data-yn]').forEach(s => s.addEventListener('change', () => { A_[+s.dataset.yn].type = s.value; }));
}
function ynDo() {
  if (A.plan) localSaveAll();
  const p = defaultPlan('Import YNAB'); p.groups = p.groups.filter(g => g.sys); p.cats = [];
  A.plan = p; A.tx = []; rebuildLookups();
  const isInflowGroup = g => /^inflow$|^revenus?$|^entrees?$/.test(norm(g));
  const isCcGroup = g => /credit card payments|paiements? (de )?carte/.test(norm(g));
  const isHiddenGroup = g => /hidden categories|categories masquees/.test(norm(g));
  // accounts
  const acctId = {};
  for (const a of Object.values(YN.accts)) {
    const acc = { id: uid(), name: a.name, type: a.type, closed: false, note: '', rate: 0, minPay: 0, lastRec: null };
    p.accounts.push(acc); acctId[a.name] = acc.id;
  }
  rebuildLookups(); for (const acc of p.accounts) ensureCcCat(acc); rebuildLookups();
  // groups & categories (plan file order first, then any category only seen in transactions)
  const gId = {}, cId = {};
  const ensureCat = (g, c) => {
    if (!c || isInflowGroup(g)) return null;
    if (isCcGroup(g)) { const acc = p.accounts.find(x => x.name === c); return acc ? L.ccCat[acc.id]?.id || null : null; }
    const key = g + '\u0001' + c; if (cId[key]) return cId[key];
    const hidden = isHiddenGroup(g); const gname = hidden ? 'Enveloppes masquées' : (g || 'Divers');
    if (!gId[gname]) { const ng = { id: uid(), name: gname, hidden: false }; p.groups.push(ng); gId[gname] = ng.id; }
    const nc = { id: uid(), gid: gId[gname], name: c, note: '', target: null, hidden }; p.cats.push(nc); cId[key] = nc.id; return nc.id;
  };
  for (const x of YN.cats) ensureCat(x.g, x.c);
  // transactions (merge splits, link transfers)
  const flagMap = { red: 'red', rouge: 'red', orange: 'orange', yellow: 'yellow', jaune: 'yellow', green: 'green', vert: 'green', blue: 'blue', bleu: 'blue', purple: 'purple', violet: 'purple' };
  const clrMap = v => /reconcil|rapproch/.test(v) ? 'r' : /^cleared|^pointe|^oui|^c$/.test(v) ? 'c' : 'u';
  const out = []; let lastSplit = null;
  for (const r of YN.tx) {
    const acct = acctId[r.acct]; const a = L.acct[acct];
    const tm = r.payee.match(/^(?:transfer|virement)\s*:\s*(.+)$/i);
    let cat = null;
    if (isInflowGroup(r.group) || /ready to assign|a repartir|to be budgeted/.test(norm(r.cat))) cat = onBudget(a) ? 'rta' : '__start';
    else if (r.cat) cat = ensureCat(r.group, r.cat);
    const sm = r.memo.match(/^split \((\d+)\/(\d+)\)\s*(.*)$/i);
    const base = { acct, date: r.date, amount: r.amount, cleared: clrMap(r.cleared), flag: flagMap[r.flag] || null, approved: true };
    if (sm) {
      const line = { cat, amount: r.amount, memo: sm[3] || '', transfer: tm ? tm[1].trim() : null };
      if (sm[1] === '1' || !lastSplit || lastSplit.acct !== acct || lastSplit.date !== r.date) { lastSplit = { ...base, id: uid(), payee: tm ? null : r.payee, splits: [line], total: +sm[2], memo: '' }; out.push(lastSplit); }
      else { lastSplit.splits.push(line); lastSplit.amount += r.amount; }
      continue;
    }
    lastSplit = null;
    if (tm && acctId[tm[1].trim()]) out.push({ ...base, id: uid(), transferName: tm[1].trim(), cat: (cat === 'rta' || cat === '__start') ? null : cat, memo: r.memo });
    else out.push({ ...base, id: uid(), payee: r.payee === 'Starting Balance' ? 'Solde initial' : r.payee, cat: r.payee === 'Starting Balance' && !cat ? (onBudget(a) && !isCredit(a) ? 'rta' : '__start') : cat, memo: r.memo });
  }
  // pair transfers: each side appears once per account
  const pool = out.filter(t => t.transferName); const used = new Set();
  for (const t of pool) {
    if (used.has(t.id)) continue; used.add(t.id);
    const other = acctId[t.transferName];
    const mate = pool.find(u => !used.has(u.id) && u.acct === other && L.acct[t.acct].name === u.transferName && u.amount === -t.amount && Math.abs(daysBetween(u.date, t.date)) <= 3);
    t.transferAcct = other;
    if (mate) { used.add(mate.id); mate.transferAcct = t.acct; t.transferId = mate.id; mate.transferId = t.id; }
    else { const m2 = { id: uid(), acct: other, date: t.date, amount: -t.amount, cleared: 'u', flag: null, approved: true, transferAcct: t.acct, transferId: t.id, memo: t.memo, cat: null }; t.transferId = m2.id; out.push(m2); }
  }
  for (const t of out) {
    const y = t.payee ? getPayee(t.payee) : null;
    const tx = { id: t.id, acct: t.acct, date: t.date, payee: y ? y.id : null, cat: t.splits ? null : t.cat, memo: t.memo || '', amount: t.amount, cleared: t.cleared, flag: t.flag, approved: true };
    if (t.splits) tx.splits = t.splits.map(s => ({ cat: s.cat, amount: s.amount, memo: s.memo }));
    if (t.transferAcct) { tx.transferAcct = t.transferAcct; tx.transferId = t.transferId; tx.payee = null; const a = L.acct[t.acct], b = L.acct[t.transferAcct]; if (!(onBudget(a) && !onBudget(b))) tx.cat = null; }
    if (y && tx.cat && tx.cat !== 'rta' && tx.cat !== '__start') y.lastCat = tx.cat;
    A.tx.push(tx);
  }
  // assigned per month
  let first = curMonth();
  for (const t of A.tx) if (monthOf(t.date) < first) first = monthOf(t.date);
  for (const [m, o] of Object.entries(YN.months)) {
    for (const [key, v] of Object.entries(o)) { if (!v) continue; const [g, c] = key.split('\u0001'); const id = ensureCat(g, c); if (id) setAssigned(m, id, (getAssigned(m, id) || 0) + v); }
    if (m < first && Object.values(o).some(v => v)) first = m;
  }
  p.startMonth = first;
  A.index.plans.push({ id: p.id, name: p.name }); A.index.current = p.id; A.undo = []; A.redo = [];
  rebuildLookups(); A.calcV++;
  // verification against YNAB's own "Available" for the latest month
  let ok = 0, tot = 0; const bad = [];
  const months = Object.keys(YN.avail).sort(); const lm = months[months.length - 1];
  if (lm) for (const [key, v] of Object.entries(YN.avail[lm])) {
    const [g, c] = key.split('\u0001'); if (isInflowGroup(g)) continue;
    const id = isCcGroup(g) ? L.ccCat[p.accounts.find(x => x.name === c)?.id]?.id : cId[key]; if (!id) continue;
    tot++; const mine = catM(lm, id).available; if (mine === v) ok++; else bad.push(`${c} : YNAB ${fmt(v)} / ici ${fmt(mine)}`);
  }
  YN.check = { ok, tot, bad, lm };
  scheduleSave(); watchCore(); A.view = 'plan'; A.month = curMonth(); closeSheet(); render();
  const msg = tot ? `${A.tx.length} opérations importées · ${ok}/${tot} enveloppes identiques à YNAB (${monthLabel(lm)})` : `${A.tx.length} opérations importées`;
  openSheet('Import terminé', `<p style="margin:0"><strong>${esc(msg)}</strong></p>
    ${bad.length ? `<div class="banner warn">${I.info}<span>Écarts à vérifier (souvent un type de compte à corriger, par exemple une carte de crédit) :</span></div><div class="card">${bad.slice(0, 20).map(b => `<div class="li small">${esc(b)}</div>`).join('')}</div>` : (tot ? `<div class="banner info">${I.check}<span>Tous les soldes d'enveloppes correspondent à YNAB.</span></div>` : '')}
    <div class="small muted">Les objectifs et les notes ne sont pas dans l'export YNAB : ajoute-les depuis chaque enveloppe.</div>`, `<button class="btn pri block" data-a="closeSheet">Voir mon budget</button>`);
}
