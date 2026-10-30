/* ================= Budget — import, reflect, settings ================= */

/* ---------- file import (CSV / OFX / QFX / QIF) ---------- */
let IMP = null;
function importSheet(acctId) {
  IMP = { acct: acctId || A.plan.accounts.find(a => !a.closed && onBudget(a))?.id, rows: null, csv: null, map: null };
  const body = `<div class="field"><label for="impAcct">Compte</label><select id="impAcct" class="in">${acctOptions(IMP.acct)}</select></div>
    <label class="btn block" for="impFile">${I.file} Choose bank file</label><input id="impFile" type="file" accept=".csv,.txt,.ofx,.qfx,.qif,text/csv" hidden data-c="impFile">
    <div class="small muted">Supported: CSV (any bank), OFX, QFX, QIF. Duplicates are skipped, and transactions you already entered by hand are matched automatically.</div>
    <div id="impStep"></div>`;
  openSheet('File Import', body);
}
function decodeFile(buf) {
  let txt = new TextDecoder('utf-8').decode(buf);
  if (txt.includes('\uFFFD')) txt = new TextDecoder('windows-1252').decode(buf);
  return txt.replace(/^﻿/, '');
}
function parseCSV(txt) {
  const first = txt.split(/\r?\n/).find(l => l.trim()) || '';
  const cands = [';', ',', '\t', '|']; const delim = cands.sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell.trim()); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; row.push(cell.trim()); if (row.some(c => c)) rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  row.push(cell.trim()); if (row.some(c => c)) rows.push(row);
  return rows;
}
function parseDateAny(s, fmtHint) {
  s = (s || '').trim().slice(0, 10);
  let m;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/))) {
    let y = +m[3]; if (y < 100) y += 2000;
    const [d, mo] = fmtHint === 'mdy' ? [+m[2], +m[1]] : [+m[1], +m[2]];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}
function parseMoney(s) {
  s = String(s || '').replace(/[\s €$£]/g, '').replace(/−/g, '-');
  if (!s) return null;
  let neg = false; if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.endsWith('-')) { neg = true; s = s.slice(0, -1); }
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > ld) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
  const v = parseFloat(s); if (isNaN(v)) return null;
  return Math.round((neg ? -v : v) * 100);
}
function guessMap(head) {
  const h = head.map(x => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const find = (...keys) => h.findIndex(x => keys.some(k => x.includes(k)));
  return {
    date: find('date op', 'date de l', 'date', 'jour', 'booking'),
    payee: find('libelle', 'beneficiaire', 'description', 'payee', 'tiers', 'nom', 'label', 'intitule'),
    memo: find('memo', 'detail', 'note', 'commentaire', 'information', 'reference'),
    amount: find('montant', 'amount', 'somme', 'valeur'),
    out: find('debit', 'sortie', 'outflow', 'retrait'),
    in: find('credit', 'entree', 'inflow', 'versement'),
  };
}
async function onImportFile(file) {
  const buf = await file.arrayBuffer(); const txt = decodeFile(buf);
  IMP.acct = $('#impAcct').value;
  const name = file.name.toLowerCase();
  if (/\.(ofx|qfx)$/.test(name) || /<OFX>/i.test(txt)) { IMP.rows = parseOFX(txt); return impPreview(); }
  if (/\.qif$/.test(name) || /^!Type:/m.test(txt)) { IMP.rows = parseQIF(txt); return impPreview(); }
  const rows = parseCSV(txt);
  if (rows.length < 2) { $('#impStep').innerHTML = `<div class="banner bad">${I.info}<span>Fichier vide ou illisible.</span></div>`; return; }
  let hi = rows.findIndex(r => r.length >= 3 && r.some(c => /date/i.test(c))); if (hi < 0) hi = 0;
  IMP.csv = { head: rows[hi], body: rows.slice(hi + 1) };
  IMP.map = guessMap(rows[hi]);
  IMP.map.dfmt = 'dmy'; IMP.map.invert = false;
  impMapping();
}
function impMapping() {
  const { head, body } = IMP.csv, mp = IMP.map;
  const opts = (k, opt) => `<option value="-1">${opt ? '— none —' : 'Choose…'}</option>` + head.map((h, i) => `<option value="${i}" ${mp[k] === i ? 'selected' : ''}>${esc(h || 'Column ' + (i + 1))}</option>`).join('');
  const sample = body.slice(0, 3).map(r => `<tr>${head.map((_, i) => `<td>${esc(r[i] || '')}</td>`).join('')}</tr>`).join('');
  $('#impStep').innerHTML = `<div class="sec-t"><span>File columns</span></div>
    <div style="overflow-x:auto" class="card"><table class="tbl"><thead><tr>${head.map(h => `<th style="text-align:left">${esc(h)}</th>`).join('')}</tr></thead><tbody>${sample}</tbody></table></div>
    <div class="grid2">
      <div class="field"><label for="mpDate">Date</label><select id="mpDate" class="in" data-mp="date">${opts('date')}</select></div>
      <div class="field"><label for="mpFmt">Date format</label><select id="mpFmt" class="in" data-mp="dfmt"><option value="dmy" ${mp.dfmt === 'dmy' ? 'selected' : ''}>DD/MM/YYYY</option><option value="mdy" ${mp.dfmt === 'mdy' ? 'selected' : ''}>MM/DD/YYYY</option></select></div>
      <div class="field"><label for="mpPayee">Payee / description</label><select id="mpPayee" class="in" data-mp="payee">${opts('payee')}</select></div>
      <div class="field"><label for="mpMemo">Memo</label><select id="mpMemo" class="in" data-mp="memo">${opts('memo', 1)}</select></div>
      <div class="field"><label for="mpAmt">Amount (single column)</label><select id="mpAmt" class="in" data-mp="amount">${opts('amount', 1)}</select></div>
      <div class="field"><label for="mpOut">Or Outflow</label><select id="mpOut" class="in" data-mp="out">${opts('out', 1)}</select></div>
      <div class="field"><label for="mpIn">and Inflow</label><select id="mpIn" class="in" data-mp="in">${opts('in', 1)}</select></div>
      <label class="switch"><span class="small"><strong>Flip amounts</strong></span><input type="checkbox" data-mp="invert" ${mp.invert ? 'checked' : ''}></label>
    </div>
    <button class="btn pri block" data-a="impBuild">Preview import</button>`;
}
function impBuildCSV() {
  const { body } = IMP.csv, mp = IMP.map; const out = [];
  for (const r of body) {
    const date = parseDateAny(r[mp.date], mp.dfmt); if (!date) continue;
    let amt = null;
    if (mp.amount >= 0 && r[mp.amount]) amt = parseMoney(r[mp.amount]);
    else { const o = mp.out >= 0 ? parseMoney(r[mp.out]) : null, i = mp.in >= 0 ? parseMoney(r[mp.in]) : null; if (o != null || i != null) amt = (i ? Math.abs(i) : 0) - (o ? Math.abs(o) : 0); }
    if (amt == null || amt === 0) continue;
    if (mp.invert) amt = -amt;
    out.push({ date, amount: amt, payee: (r[mp.payee] || '').replace(/\s+/g, ' ').trim(), memo: mp.memo >= 0 ? (r[mp.memo] || '').trim() : '' });
  }
  IMP.rows = out; impPreview();
}
function parseOFX(txt) {
  const out = []; const blocks = txt.split(/<STMTTRN>/i).slice(1);
  const tag = (b, t) => { const m = b.match(new RegExp('<' + t + '>([^<\\r\\n]*)', 'i')); return m ? m[1].trim() : ''; };
  for (const b of blocks) { const date = parseDateAny(tag(b, 'DTPOSTED')); const amount = parseMoney(tag(b, 'TRNAMT')); if (!date || amount == null) continue; out.push({ date, amount, payee: tag(b, 'NAME') || tag(b, 'PAYEE'), memo: tag(b, 'MEMO'), fitid: tag(b, 'FITID') }); }
  return out;
}
function parseQIF(txt) {
  const out = []; let cur = {};
  for (const line of txt.split(/\r?\n/)) {
    const k = line[0], v = line.slice(1).trim();
    if (k === 'D') cur.date = parseDateAny(v.replace(/'/g, '/'), 'dmy');
    else if (k === 'T' || k === 'U') cur.amount = parseMoney(v);
    else if (k === 'P') cur.payee = v; else if (k === 'M') cur.memo = v;
    else if (k === '^') { if (cur.date && cur.amount != null) out.push({ payee: '', memo: '', ...cur }); cur = {}; }
  }
  return out;
}
function impPlan() {
  const acct = IMP.acct; const existing = A.tx.filter(t => t.acct === acct);
  const ids = new Set(existing.map(t => t.importId).filter(Boolean)); const used = new Set();
  const res = [];
  const seen = {};
  for (const r of IMP.rows) {
    const key0 = r.fitid || `${r.date}|${r.amount}|${r.payee.toLowerCase()}`;
    seen[key0] = (seen[key0] || 0) + 1; const key = r.fitid ? key0 : key0 + '|' + seen[key0];
    if (ids.has(key)) { res.push({ r, key, kind: 'dup' }); continue; }
    const match = existing.find(t => !t.importId && !used.has(t.id) && t.amount === r.amount && Math.abs(daysBetween(t.date, r.date)) <= 10);
    if (match) { used.add(match.id); res.push({ r, key, kind: 'match', t: match }); continue; }
    res.push({ r, key, kind: 'new' });
  }
  return res;
}
function impPreview() {
  if (!IMP.rows.length) { $('#impStep').innerHTML = `<div class="banner bad">${I.info}<span>No transactions found. Check the columns.</span></div>`; if (IMP.csv) impMapping(); return; }
  const plan = impPlan(); const n = k => plan.filter(x => x.kind === k).length;
  $('#impStep').innerHTML = `<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="kpi"><span>New</span><b>${n('new')}</b></div><div class="kpi"><span>Matched</span><b>${n('match')}</b></div><div class="kpi"><span>Duplicates</span><b>${n('dup')}</b></div></div>
    <div class="card">${plan.slice(0, 12).map(x => `<div class="li"><span class="grow"><strong class="ellip" style="display:block">${esc(payeeRuleApply(x.r.payee) || '—')}</strong><span class="small muted">${fmtDate(x.r.date)} · ${x.kind === 'new' ? 'new' : x.kind === 'match' ? 'matches an entered transaction' : 'already imported'}</span></span><strong class="num ${x.r.amount > 0 ? 'amt-pos' : ''}">${fmt(x.r.amount)}</strong></div>`).join('')}</div>
    ${plan.length > 12 ? `<div class="small muted">… and ${plan.length - 12} more</div>` : ''}
    <button class="btn pri block" data-a="impDo" ${n('new') + n('match') ? '' : 'disabled'}>Import ${n('new') + n('match')} transaction${n('new') + n('match') > 1 ? 's' : ''}</button>`;
}
function impDo() {
  const plan = impPlan(); let nn = 0, nm = 0;
  mutate('File imported', () => {
    for (const x of plan) {
      if (x.kind === 'dup') continue;
      if (x.kind === 'match') { x.t.importId = x.key; if (x.t.cleared === 'u') x.t.cleared = 'c'; nm++; continue; }
      const name = payeeRuleApply(x.r.payee) || x.r.payee || 'No description';
      const y = getPayee(name);
      const cat = y?.lastCat && L.cat[y.lastCat] && onBudget(L.acct[IMP.acct]) ? y.lastCat : null;
      A.tx.push({ id: uid(), acct: IMP.acct, date: x.r.date, payee: y?.id || null, cat, memo: x.r.memo || '', amount: x.r.amount, cleared: 'c', flag: null, approved: false, importId: x.key });
      nn++;
    }
  }, { silent: true });
  closeSheet(); toast(`${nn} imported, ${nm} matched`, true);
  A.view = 'accounts'; A.acct = IMP.acct; A.ui.regFilter = nn ? 'unapproved' : 'all'; render();
}

/* ---------- REFLECT ---------- */
const COLORS = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8'];
function periodRange() {
  const cm = curMonth(), p = A.ui.period;
  const map = { m: [cm, cm], lm: [addMonths(cm, -1), addMonths(cm, -1)], '3m': [addMonths(cm, -2), cm], '6m': [addMonths(cm, -5), cm], ytd: [cm.slice(0, 4) + '-01', cm], '12m': [addMonths(cm, -11), cm], all: [calc().minM, cm] };
  const r = map[p] || map['3m']; const off = A.ui.reflOff || 0; if (!off || p === 'all') return r;
  const len = monthDiff(r[0], r[1]) + 1; return [addMonths(r[0], off * len), addMonths(r[1], off * len)];
}
function spendingLines(from, to) {
  const out = [];
  for (const t of A.tx) {
    const a = L.acct[t.acct]; if (!onBudget(a) || (A.ui.reflAx && A.ui.reflAx.has(t.acct))) continue; const m = monthOf(t.date); if (m < from || m > to) continue;
    if (t.transferAcct && onBudget(L.acct[t.transferAcct])) continue;
    for (const ln of txLines(t)) { if (!ln.cat || ln.cat === 'rta' || ln.cat === '__start' || !L.cat[ln.cat] || (A.ui.reflEx && A.ui.reflEx.has(ln.cat))) continue; out.push({ m, cat: ln.cat, payee: t.payee, amount: ln.amount, tid: t.id, date: t.date }); }
  }
  return out;
}
function donut(items, total) {
  const R = 80, r = 52, cx = 100, cy = 100; let a0 = -Math.PI / 2; let paths = '';
  if (!total) return `<svg viewBox="0 0 200 200" role="img" aria-label="No spending"><circle cx="100" cy="100" r="66" fill="none" stroke="var(--surface-2)" stroke-width="28"/></svg>`;
  items.forEach((it, i) => {
    const frac = it.v / total; if (frac <= 0) return; const a1 = a0 + frac * Math.PI * 2;
    if (frac >= 0.9999) { paths += `<circle cx="100" cy="100" r="66" fill="none" stroke="var(${COLORS[i % 8]})" stroke-width="28"/>`; a0 = a1; return; }
    const lg = a1 - a0 > Math.PI ? 1 : 0; const p = (rad, ang) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)].map(n => n.toFixed(2)).join(' ');
    paths += `<path d="M${p(R, a0)} A${R} ${R} 0 ${lg} 1 ${p(R, a1)} L${p(r, a1)} A${r} ${r} 0 ${lg} 0 ${p(r, a0)}Z" fill="var(${COLORS[i % 8]})" stroke="var(--surface)" stroke-width="1.5"/>`; a0 = a1;
  });
  return `<svg viewBox="0 0 200 200" role="img" aria-label="Spending breakdown">${paths}<text x="100" y="96" text-anchor="middle" font-size="11" font-weight="700" fill="var(--muted)" font-family="Manrope, sans-serif">Total</text><text x="100" y="115" text-anchor="middle" font-size="16" font-weight="800" fill="var(--fg)" font-family="Manrope, sans-serif">${esc(fmtS(total))}</text></svg>`;
}
function bars(months, series, opts = {}) {
  // series: [{key,label,color,values:[]}] stacked if opts.stack; line: opts.line values
  const avail = Math.max(300, Math.floor(DESK() ? innerWidth - 270 - (A.view === 'plan' ? 340 : 0) - 90 : innerWidth - 64)); const W = Math.max(avail, months.length * 16), H = 240, pl = 54, pb = 26, pt = 10, ch = H - pb - pt, cw = W - pl - 8;
  let max = 0, min = 0;
  months.forEach((_, i) => { let pos = 0, neg = 0; series.forEach(s => { const v = s.values[i] || 0; if (v > 0) pos += v; else neg += v; }); max = Math.max(max, pos); min = Math.min(min, neg); });
  if (opts.line) opts.line.forEach(v => { max = Math.max(max, v); min = Math.min(min, v); });
  if (max === min) max = min + 100;
  const raw = (max - min) / 4, p10 = Math.pow(10, Math.floor(Math.log10(raw || 1))); const step = [1, 2, 2.5, 5, 10].map(k => k * p10).find(k => k >= raw) || 10 * p10;
  max = Math.ceil(max / step) * step; min = Math.floor(min / step) * step; const nT = Math.round((max - min) / step);
  const y = v => pt + (max - v) / (max - min) * ch; const bw = Math.min(36, cw / months.length * 0.6); const lblEvery = Math.max(1, Math.ceil(46 / (cw / months.length)));
  let g = '';
  for (let k = 0; k <= nT; k++) { const v = min + step * k; g += `<line x1="${pl}" x2="${W - 8}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${pl - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="var(--muted)" font-family="Manrope, sans-serif">${esc(fmtS(v))}</text>`; }
  months.forEach((m, i) => {
    const cx = pl + cw * (i + 0.5) / months.length; let pos = 0, neg = 0;
    series.forEach(s => { const v = s.values[i] || 0; if (!v) return; let y0, y1; if (v > 0) { y0 = y(pos + v); y1 = y(pos); pos += v; } else { y0 = y(neg); y1 = y(neg + v); neg += v; } g += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, y1 - y0).toFixed(1)}" rx="3" fill="var(${s.color})"><title>${esc(s.label)} · ${esc(monthLabel(m))} : ${esc(fmt(v))}</title></rect>`; });
    if (i % lblEvery === 0) g += `<text x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="Manrope, sans-serif">${esc(monthLabel(m, true))}</text>`;
  });
  if (opts.line) {
    const pts = opts.line.map((v, i) => [pl + cw * (i + 0.5) / months.length, y(v)]);
    g += `<polyline points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--fg)" stroke-width="2.2"/>` + pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3}" fill="var(--fg)"><title>${esc(opts.lineLabel || '')} : ${esc(fmt(opts.line[i]))}</title></circle>`).join('');
  }
  if (min < 0) g += `<line x1="${pl}" x2="${W - 8}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" stroke="var(--muted)" stroke-width="1"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="width:${W}px; height:${H}px; max-width:none" role="img" aria-label="${esc(opts.aria || 'Graphique')}">${g}</svg>`;
}
function monthsBetween(a, b) { const out = []; for (let m = a; m <= b; m = addMonths(m, 1)) out.push(m); return out; }
function viewReflect() {
  const tabs = [['spending', 'Spending Breakdown'], ['trends', 'Spending Trends'], ['networth', 'Net Worth'], ['ie', 'Income v Expense'], ['aom', 'Age of Money']];
  const per = [['m', 'This Month'], ['lm', 'Last Month'], ['3m', 'Last 3 Months'], ['6m', 'Last 6 Months'], ['ytd', 'Year to Date'], ['12m', 'Last 12 Months'], ['all', 'All Dates']];
  if (!DESK() && !A.ui.reflDetail) return reflectOverview();
  let h = topBar('Reflect', esc(A.plan.name), !DESK() ? `<button class="ibtn" data-a="reflBack" aria-label="Back">${I.left}</button>` : '');
  h += `<div class="wrap"><div class="chips">${tabs.map(([k, l]) => `<button class="chip ${A.ui.reflect === k ? 'on' : ''}" data-a="reflectTab" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="chips" style="padding-top:2px">${per.map(([k, l]) => `<button class="chip ${A.ui.period === k ? 'on' : ''}" data-a="period" data-k="${k}">${l}</button>`).join('')}</div>`;
  const [from, to] = periodRange(); const months = monthsBetween(from, to);
  { const lab = from === to ? monthLabel(from) : `${MSHORT[+from.slice(5, 7) - 1]} ${from.slice(0, 4)} – ${MSHORT[+to.slice(5, 7) - 1]} ${to.slice(0, 4)}`; const ex = A.ui.reflEx ? A.ui.reflEx.size : 0;
    h += `<div class="rnav"><button class="ibtn" data-a="reflNav" data-d="-1" aria-label="Previous date range" ${A.ui.period === 'all' ? 'disabled' : ''}>${I.left}</button><strong>${lab}</strong><button class="ibtn" data-a="reflNav" data-d="1" aria-label="Next date range" ${A.ui.period === 'all' || to >= curMonth() ? 'disabled' : ''}>${I.right}</button>
      <span style="flex:1"></span><button class="tbtn" data-a="reflCats">${ex ? A.plan.cats.filter(c => !c.hidden).length - ex + ' Categories' : 'All Categories'} ▾</button><button class="tbtn" data-a="reflAccts">${A.ui.reflAx && A.ui.reflAx.size ? A.plan.accounts.filter(a => onBudget(a) && !a.closed && !A.ui.reflAx.has(a.id)).length + ' Accounts' : 'All Accounts'} ▾</button><button class="tbtn" data-a="reflExport">${I.download} Export</button></div>`; }
  const R = A.ui.reflect;
  if (R === 'spending') {
    const lines = spendingLines(from, to); const by = {};
    const keyOf = l => A.ui.groupBy === 'group' ? L.cat[l.cat].gid : A.ui.groupBy === 'cat' ? l.cat : (l.payee || '—');
    const nameOf = k => A.ui.groupBy === 'group' ? (L.group[k]?.name || '') : A.ui.groupBy === 'cat' ? catName(k) : (L.payee[k]?.name || 'No payee');
    for (const l of lines) { const k = keyOf(l); by[k] = (by[k] || 0) - l.amount; }
    let items = Object.entries(by).map(([k, v]) => ({ k, v, n: nameOf(k) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    const full = items.slice(); // the list shows every line (like YNAB); only the donut groups the small ones
    if (items.length > 8) { const rest = items.slice(7).reduce((s, x) => s + x.v, 0); items = items.slice(0, 7).concat([{ k: '_o', v: rest, n: 'Other' }]); }
    const total = items.reduce((s, x) => s + x.v, 0);
    h += `<div class="seg" style="margin-top:6px"><button class="${A.ui.groupBy === 'group' ? 'on' : ''}" data-a="groupBy" data-k="group">Category Groups</button><button class="${A.ui.groupBy === 'cat' ? 'on' : ''}" data-a="groupBy" data-k="cat">Categories</button><button class="${A.ui.groupBy === 'payee' ? 'on' : ''}" data-a="groupBy" data-k="payee">Payees</button></div>
      ${(() => { const today = todayISO(), d0 = from + '-01', d1 = to === curMonth() ? today : addMonths(to, 1) + '-01'; const days = Math.max(1, daysBetween(d0, d1) + (to === curMonth() ? 1 : 0));
        const cnt = {}; for (const l of lines) if (l.amount < 0) (cnt[l.cat] ||= new Set()).add(l.tid); const freq = Object.entries(cnt).sort((a, b) => b[1].size - a[1].size)[0];
        const big = lines.filter(l => l.amount < 0).sort((a, b) => a.amount - b.amount)[0];
        return `<div class="kpis refl-kpis" style="margin-top:10px"><div class="kpi"><span>Total Spending</span><b class="num">${fmt(total)}</b></div><div class="kpi"><span>Average Monthly Spending</span><b class="num">${fmt(Math.round(total / months.length))}</b></div><div class="kpi"><span>Average Daily Spending</span><b class="num">${fmt(Math.round(total / days))}</b></div>
          <div class="kpi"><span>Most Frequent Category</span><b class="ellip" style="font-size:15px">${freq ? esc(catName(freq[0])) : '—'}</b><span class="small muted">${freq ? freq[1].size + ' transactions' : ''}</span></div><div class="kpi"><span>Largest Outflow</span><b class="ellip" style="font-size:15px">${big ? esc(L.payee[big.payee]?.name || '—') : '—'}</b><span class="small muted num">${big ? fmt(-big.amount) : ''}</span></div></div>`; })()}
      <div class="chartbox" style="margin-top:10px"><div style="max-width:260px; margin:0 auto">${donut(items, total)}</div>
      <div class="legend">${full.map((x, i) => `<div class="li"><span class="dot" style="background:var(${COLORS[Math.min(i, 7) % 8]})"></span><span class="grow ellip">${esc(x.n)}</span><span class="small muted">${total ? (x.v / total < 0.01 ? '<1' : Math.round(x.v / total * 100)) : 0} %</span><strong class="num" style="width:96px; text-align:right">${fmt(x.v)}</strong></div>`).join('') || '<div class="muted small" style="padding:8px">No spending in this period.</div>'}</div></div>`;
  } else if (R === 'trends') {
    const lines = spendingLines(from, to); const gids = A.plan.groups.map(g => g.id);
    const series = gids.map((gid, i) => ({ key: gid, label: L.group[gid].name, color: COLORS[i % 8], values: months.map(m => lines.filter(l => l.m === m && L.cat[l.cat].gid === gid).reduce((s, l) => s - l.amount, 0)) })).filter(s => s.values.some(v => v));
    const tot = months.map((_, i) => series.reduce((s, x) => s + x.values[i], 0));
    const avg = Math.round(tot.reduce((a, b) => a + b, 0) / months.length);
    h += `<div class="kpis" style="margin-top:6px"><div class="kpi"><span>Average Monthly Spending</span><b class="num">${fmt(avg)}</b></div><div class="kpi"><span>Total Spending</span><b class="num">${fmt(tot.reduce((a, b) => a + b, 0))}</b></div><div class="kpi"><span>Highest Month</span><b class="num">${fmt(Math.max(0, ...tot))}</b></div></div>
      <div class="chartbox" style="margin-top:10px">${bars(months, series, { aria: 'Spending by month' })}<div class="legend">${series.map(s => `<div class="li"><span class="dot" style="background:var(${s.color})"></span><span class="grow">${esc(s.label)}</span><strong class="num">${fmt(s.values.reduce((a, b) => a + b, 0))}</strong></div>`).join('')}</div></div>
      <div class="chartbox" style="margin-top:10px; padding:0"><table class="tbl"><thead><tr><th>Month</th><th>Total Spending</th><th>Compared to Average</th></tr></thead><tbody>
        ${months.map((m, i) => ({ m, v: tot[i] })).reverse().map(({ m, v }) => { const d = v - avg; return `<tr><td>${esc(monthLabel(m))}</td><td>${fmt(v)}</td><td class="${d > 0 ? 'amt-bad' : 'amt-pos'}">${d >= 0 ? '+' : ''}${fmt(d)} (${avg ? Math.abs(Math.round(d / avg * 1000) / 10).toString().replace('.', ',') : 0}%)</td></tr>`; }).join('')}
        <tr class="tot"><td>Total</td><td>${fmt(tot.reduce((a, b) => a + b, 0))}</td><td></td></tr></tbody></table></div>`;
  } else if (R === 'networth') {
    const acc = A.plan.accounts; const assets = [], debts = [], net = [];
    for (const m of months) { let as = 0, de = 0; for (const a of acc) { const b = A.tx.filter(t => t.acct === a.id && monthOf(t.date) <= m).reduce((s, t) => s + t.amount, 0); if (b >= 0) as += b; else de += b; } assets.push(as); debts.push(de); net.push(as + de); }
    const last = net.length - 1; const ch = net[last] - net[0];
    h += `<div class="kpis" style="margin-top:6px"><div class="kpi"><span>Net Worth</span><b class="num">${fmt(net[last])}</b></div><div class="kpi"><span>Change in Net Worth</span><b class="num" style="color:${ch >= 0 ? 'var(--accent-strong)' : 'var(--bad)'}">${ch >= 0 ? '+' : ''}${fmt(ch)}</b></div><div class="kpi"><span>Assets</span><b class="num">${fmt(assets[last])}</b></div><div class="kpi"><span>Debts</span><b class="num">${fmt(debts[last])}</b></div></div>
      <div class="chartbox" style="margin-top:10px">${bars(months, [{ label: 'Assets', color: '--c1', values: assets }, { label: 'Debts', color: '--c5', values: debts }], { line: net, lineLabel: 'Net', aria: 'Net worth by month' })}
      <div class="legend"><div class="li"><span class="dot" style="background:var(--c1)"></span><span class="grow">Assets</span></div><div class="li"><span class="dot" style="background:var(--c5)"></span><span class="grow">Debts</span></div><div class="li"><span class="dot" style="background:var(--fg); border-radius:99px"></span><span class="grow">Net Worth</span></div></div></div>
      <div class="chartbox" style="margin-top:10px; padding:0"><table class="tbl"><thead><tr><th>Month</th><th>Net Worth</th><th>Monthly Change</th></tr></thead><tbody>
        ${months.map((m, i) => ({ m, i })).reverse().map(({ m, i }) => { const prev = i ? net[i - 1] : null; const d = prev == null ? null : net[i] - prev; return `<tr><td>${esc(monthLabel(m))}</td><td>${fmt(net[i])}</td><td class="${d == null ? '' : d >= 0 ? 'amt-pos' : 'amt-bad'}">${d == null ? '—' : (d >= 0 ? '+' : '') + fmt(d) + (prev ? ' (' + (Math.round(d / Math.abs(prev) * 1000) / 10).toString().replace('.', ',') + '%)' : '')}</td></tr>`; }).join('')}</tbody></table></div>`;
  } else if (R === 'ie') {
    const lines = spendingLines(from, to);
    const notIncome = t => ['Solde initial', 'Ajustement de rapprochement', 'Starting Balance', 'Reconciliation Balance Adjustment'].includes(L.payee[t.payee]?.name);
    const inc = months.map(m => A.tx.filter(t => monthOf(t.date) === m && onBudget(L.acct[t.acct]) && !notIncome(t) && !(A.ui.reflAx && A.ui.reflAx.has(t.acct))).reduce((s, t) => s + txLines(t).filter(l => l.cat === 'rta').reduce((x, l) => x + l.amount, 0), 0));
    const rows = A.plan.groups.map(g => ({ g, v: months.map(m => lines.filter(l => l.m === m && L.cat[l.cat].gid === g.id).reduce((s, l) => s + l.amount, 0)) })).filter(r => r.v.some(x => x));
    const exp = months.map((_, i) => rows.reduce((s, r) => s + r.v[i], 0));
    const srcBy = {}; for (const t of A.tx) { const mi = months.indexOf(monthOf(t.date)); if (mi < 0 || !onBudget(L.acct[t.acct]) || notIncome(t) || (A.ui.reflAx && A.ui.reflAx.has(t.acct))) continue; const v = txLines(t).filter(l => l.cat === 'rta').reduce((x, l) => x + l.amount, 0); if (!v) continue; const k = t.transferAcct ? trLabel(t.transferAcct, t.acct) : (L.payee[t.payee]?.name || 'No payee'); (srcBy[k] ||= months.map(() => 0))[mi] += v; }
    const srcs = Object.entries(srcBy).sort((a, b) => a[0].localeCompare(b[0]));
    const sum = a => a.reduce((x, y) => x + y, 0);
    h += `<div class="kpis" style="margin-top:6px"><div class="kpi"><span>Income</span><b class="num">${fmt(sum(inc))}</b></div><div class="kpi"><span>Expenses</span><b class="num">${fmt(sum(exp))}</b></div><div class="kpi"><span>Net Income</span><b class="num">${fmt(sum(inc) + sum(exp))}</b></div><div class="kpi"><span>Savings Rate</span><b>${sum(inc) ? Math.round((sum(inc) + sum(exp)) / sum(inc) * 100) : 0} %</b></div></div>
      <div class="chartbox" style="margin-top:10px">${bars(months, [{ label: 'Income', color: '--c1', values: inc }, { label: 'Expenses', color: '--c3', values: exp }], { line: months.map((_, i) => inc[i] + exp[i]), lineLabel: 'Net', aria: 'Income and expenses' })}</div>
      <div class="chartbox" style="margin-top:10px; padding:0"><table class="tbl"><thead><tr><th></th>${months.map(m => `<th>${esc(monthLabel(m, true))}</th>`).join('')}<th>Average</th><th>Total</th></tr></thead><tbody>
        <tr class="sub"><td colspan="${months.length + 3}"><strong>Income</strong></td></tr>
        ${srcs.map(([k, v]) => `<tr><td class="ellip" style="max-width:260px" title="${esc(k)}">${esc(k)}</td>${v.map(x => `<td>${fmt(x)}</td>`).join('')}<td>${fmt(Math.round(sum(v) / months.length))}</td><td>${fmt(sum(v))}</td></tr>`).join('')}
        <tr class="tot"><td>Total Income</td>${inc.map(v => `<td>${fmt(v)}</td>`).join('')}<td>${fmt(Math.round(sum(inc) / months.length))}</td><td>${fmt(sum(inc))}</td></tr>
        <tr class="sub"><td colspan="${months.length + 3}"><strong>Expenses</strong></td></tr>
        ${rows.map(r => `<tr><td>${esc(r.g.name)}</td>${r.v.map(v => `<td>${fmt(v)}</td>`).join('')}<td>${fmt(Math.round(sum(r.v) / months.length))}</td><td>${fmt(sum(r.v))}</td></tr>`).join('')}
        <tr class="tot"><td>Total Expenses</td>${exp.map(v => `<td>${fmt(v)}</td>`).join('')}<td>${fmt(Math.round(sum(exp) / months.length))}</td><td>${fmt(sum(exp))}</td></tr>
        <tr class="tot"><td>Net Income</td>${months.map((_, i) => `<td>${fmt(inc[i] + exp[i])}</td>`).join('')}<td>${fmt(Math.round((sum(inc) + sum(exp)) / months.length))}</td><td>${fmt(sum(inc) + sum(exp))}</td></tr></tbody></table></div>`;
  } else {
    const ag = ageOfMoney(); const vals = months.map(m => ag.at(m === curMonth() ? '9999-12-31' : addMonths(m, 1) + '-00') || 0);
    h += `<div class="kpis" style="margin-top:6px"><div class="kpi"><span>Age of Money</span><b>${ag.now ?? '—'} days</b></div></div>
      <div class="chartbox" style="margin-top:10px">${bars(months, [{ label: 'Age (days)', color: '--c2', values: vals.map(v => v * 100) }], { aria: 'Age of money by month' }).replace(/€| €/g, '').replace(/(\d),00/g, '$1')}</div>
      <p class="muted small">Age of Money is the average number of days between earning money and spending it, based on your last 10 cash outflows. Past 30 days, you are living on last month's income.</p>`;
  }
  h += `</div>`;
  return h;
}

/* ---------- SETTINGS ---------- */
function viewSettings() {
  const p = A.plan;
  let h = topBar('Settings', esc(p.name));
  h += `<div class="wrap">
    <div class="sec-t"><span>Plan Settings</span></div>
    <div class="card" style="padding:14px; display:flex; flex-direction:column; gap:12px">
      <div class="field"><label for="sName">Plan name</label><input id="sName" class="in" value="${esc(p.name)}" data-set="name"></div>
      <div class="grid2"><div class="field"><label for="sCur">Currency</label><select id="sCur" class="in" data-set="currency">${['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'MAD', 'XOF'].map(c => `<option ${p.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="sDf">Date format</label><select id="sDf" class="in" data-set="dateFmt"><option value="dmy" ${p.dateFmt === 'dmy' ? 'selected' : ''}>31/12/2026</option><option value="ymd" ${p.dateFmt === 'ymd' ? 'selected' : ''}>2026-12-31</option><option value="mdy" ${p.dateFmt === 'mdy' ? 'selected' : ''}>12/31/2026</option></select></div></div>
    </div>
    <div class="card" style="margin-top:10px">
      <button class="li" data-a="schList"><span class="ic">${I.repeat}</span><span class="grow"><strong>Scheduled Transactions</strong><div class="small muted">${p.scheduled.length} active</div></span>${I.right}</button>
      <button class="li" data-a="payees"><span class="ic">${I.people}</span><span class="grow"><strong>Manage Payees</strong><div class="small muted">${p.payees.length} payees · ${p.rules.length} rename rules</div></span>${I.right}</button>
      <button class="li" data-a="toggleEditPlan"><span class="ic">${I.edit}</span><span class="grow"><strong>Edit Categories</strong><div class="small muted">Rename, reorder, hide</div></span>${I.right}</button>
      <button class="li" data-a="ynSheet"><span class="ic">${I.download}</span><span class="grow"><strong>Import from YNAB</strong><div class="small muted">Accounts, categories, targets, assigned money and full history</div></span>${I.right}</button>
      <button class="li" data-a="importSheet"><span class="ic">${I.upload}</span><span class="grow"><strong>File Import</strong><div class="small muted">CSV, OFX, QFX, QIF from your bank</div></span>${I.right}</button>
    </div>
    <div class="sec-t"><span>My Plans</span></div>
    <div class="card">${A.index.plans.map(x => `<div class="li" style="padding:0 6px 0 0"><button class="li" style="border:none" data-a="switchPlan" data-id="${x.id}" ${x.id === p.id ? 'aria-current="true"' : ''}><span class="ic">${x.id === p.id ? I.check : I.plan}</span><span class="grow"><strong>${esc(x.name)}</strong>${x.id === p.id ? '<div class="small muted">Open</div>' : ''}</span></button><button class="ibtn" data-a="deletePlanAsk" data-id="${x.id}" aria-label="Delete ${esc(x.name)}">${I.trash}</button></div>`).join('')}
      <button class="li" data-a="newPlan"><span class="ic">${I.plus}</span><span class="grow"><strong>New Plan</strong></span></button></div>
    ${driveSettingsHtml()}
    ${bankSettingsHtml()}
    <div class="sec-t"><span>Backup</span></div>
    <div class="card">
      <button class="li" data-a="exportJson"><span class="ic">${I.download}</span><span class="grow"><strong>Export backup (JSON)</strong><div class="small muted">Keep a copy in your Google Drive</div></span></button>
      <button class="li" data-a="exportCsv"><span class="ic">${I.file}</span><span class="grow"><strong>Export transactions (CSV)</strong><div class="small muted">Opens in Google Sheets</div></span></button>
      <label class="li" for="restoreFile2" style="cursor:pointer"><span class="ic">${I.upload}</span><span class="grow"><strong>Restore a backup file</strong><div class="small muted">Adds the plan from the file to your list</div></span></label>
      <input id="restoreFile2" type="file" accept=".json,application/json" hidden data-c="restore">
    </div>
    <div class="sec-t"><span>Start Over</span></div>
    <div class="card">
      <button class="li" data-a="freshStart"><span class="ic">${I.repeat}</span><span class="grow"><strong>Fresh Start</strong><div class="small muted">Archives this plan and starts a new one with the same accounts, categories and targets</div></span></button>
      <button class="li" data-a="resetPlan"><span class="ic">${I.undo}</span><span class="grow"><strong>Reset Assigned</strong><div class="small muted">Keeps accounts and transactions, clears every assigned amount</div></span></button>
      <button class="li" data-a="deletePlan"><span class="ic" style="color:var(--bad)">${I.trash}</span><span class="grow"><strong style="color:var(--bad)">Delete This Plan</strong></span></button>
    </div>
    <p class="muted small" style="margin-top:16px">Keyboard shortcuts: <b>N</b> add transaction, <b>Ctrl+Z</b> undo, <b>Ctrl+Shift+Z</b> redo, <b>←/→</b> change month.</p>
  </div>`;
  return h;
}
function confirmSheet(title, text, btn, act, data = {}) {
  const attrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  openSheet(title, `<p style="margin:0">${text}</p>`, `<button class="btn block" data-a="closeSheet">Annuler</button><button class="btn danger block" data-a="${act}" ${attrs}>${btn}</button>`);
}
async function saveFile(filename, data, mime) {
  try { const dl = await window.claude?.use?.('downloads'); if (dl) { await dl.save({ filename, data }); toast('File ready: ' + filename); return; } } catch (e) { if (e?.code === 'declined') return; }
  try { const url = URL.createObjectURL(new Blob([data], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
  catch (e) { toast('Export is not available here'); }
}
function exportJson() { const plan = JSON.parse(JSON.stringify(A.plan)); if (plan.bank) plan.bank = { url: '', key: '', conns: [], pending: null }; saveFile(`budget-${A.plan.name.replace(/[^\w-]+/g, '_')}-${todayISO()}.json`, JSON.stringify({ app: 'pecule', v: 1, plan, tx: A.tx }, null, 1), 'application/json'); }
function exportCsv() {
  const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const rows = [['Account', 'Date', 'Payee', 'Category', 'Memo', 'Outflow', 'Inflow', 'Cleared'].map(q).join(';')];
  for (const t of A.tx.slice().sort((a, b) => a.date < b.date ? -1 : 1)) for (const ln of txLines(t)) rows.push([L.acct[t.acct]?.name, fmtDate(t.date), payeeName(t), ln.cat === '__start' ? 'Starting Balance' : catName(ln.cat), ln.memo || t.memo, ln.amount < 0 ? fmtIn(-ln.amount) : '', ln.amount > 0 ? fmtIn(ln.amount) : '', t.cleared === 'u' ? 'Uncleared' : t.cleared === 'r' ? 'Reconciled' : 'Cleared'].map(q).join(';'));
  saveFile(`budget-transactions-${todayISO()}.csv`, '﻿' + rows.join('\r\n'), 'text/csv');
}
async function restoreFile(file) {
  try {
    const d = JSON.parse(decodeFile(await file.arrayBuffer()));
    if (d.app !== 'pecule' || !d.plan) throw 0;
    const plan = d.plan; const exists = A.index.plans.some(x => x.id === plan.id);
    if (exists) { plan.id = uid(); plan.name += ' (restored)'; }
    if (A.plan) { localSaveAll(); }
    A.plan = plan; A.tx = d.tx || []; A.index.plans.push({ id: plan.id, name: plan.name }); A.index.current = plan.id;
    A.undo = []; A.redo = []; rebuildLookups(); scheduleSave(); watchCore(); A.view = 'plan'; render(); toast('Backup restored');
  } catch (e) { toast('This file is not a backup from this app'); }
}
function createPlan(name, demo) {
  if (A.plan) localSaveAll();
  const p = defaultPlan(name);
  A.plan = p; A.tx = []; A.index.plans.push({ id: p.id, name: p.name }); A.index.current = p.id; A.undo = []; A.redo = [];
  rebuildLookups(); if (demo) buildDemo(); scheduleSave(); watchCore(); A.view = 'plan'; A.month = curMonth(); render();
}
function freshStart() {
  const old = A.plan, b = balances();
  localSaveAll();
  const oldEnt = A.index.plans.find(x => x.id === old.id); if (oldEnt) oldEnt.name = old.name + ' (archived ' + fmtDate(todayISO()) + ')';
  const archived = { ...old, name: oldEnt?.name || old.name };
  if (DB) { DB.doc('plans/' + old.id).set(JSON.parse(JSON.stringify(archived))).catch(() => { }); }
  if (ALL.plans[old.id]) ALL.plans[old.id].plan = archived;
  const p = JSON.parse(JSON.stringify(old)); p.id = uid(); p.assigned = {}; p.moves = []; p.notes = {}; p.startMonth = curMonth(); p.createdAt = Date.now();
  const idMap = {}; p.accounts = p.accounts.filter(a => !a.closed).map(a => { const n = { ...a, id: uid(), lastRec: null }; idMap[a.id] = n.id; return n; });
  p.cats = p.cats.filter(c => !c.cc || idMap[c.cc]).map(c => c.cc ? { ...c, cc: idMap[c.cc] } : c);
  p.scheduled = p.scheduled.filter(s => idMap[s.acct]).map(s => ({ ...s, acct: idMap[s.acct], transferAcct: s.transferAcct ? idMap[s.transferAcct] || null : null }));
  A.plan = p; A.tx = []; rebuildLookups();
  for (const a of old.accounts) if (idMap[a.id] && b[a.id].working) {
    const na = L.acct[idMap[a.id]];
    A.tx.push({ id: uid(), acct: na.id, date: todayISO(), payee: getPayee('Starting Balance').id, cat: onBudget(na) && !isCredit(na) ? 'rta' : '__start', memo: '', amount: b[a.id].working, cleared: 'r', flag: null, approved: true });
  }
  A.index.plans.push({ id: p.id, name: p.name }); A.index.current = p.id; A.undo = []; A.redo = [];
  scheduleSave(); watchCore(); A.month = curMonth(); A.view = 'plan'; render(); toast('Fresh Start: previous plan archived');
}

/* ---------- demo data (clearly labelled example) ---------- */
function buildDemo() {
  const p = A.plan; p.name = 'Sample Plan';
  const ent = A.index.plans.find(x => x.id === p.id); if (ent) ent.name = p.name;
  const cm = curMonth(), m1 = addMonths(cm, -1), m2 = addMonths(cm, -2);
  const byName = n => p.cats.find(c => c.name === n);
  const day = (m, d) => m + '-' + pad(d);
  const chk = addAccount({ name: 'Checking (sample)', type: 'checking', balance: 120000, date: day(m2, 1) });
  const sav = addAccount({ name: 'Savings (sample)', type: 'savings', balance: 300000, date: day(m2, 1) });
  const cc = addAccount({ name: 'Credit Card (sample)', type: 'credit', balance: 0, date: day(m2, 1) });
  addAccount({ name: 'Student Loan (sample)', type: 'student', balance: -1200000, date: day(m2, 1), rate: 0.9, minPay: 21000 });
  rebuildLookups();
  const tg = (n, t) => { const c = byName(n); if (c) c.target = t; };
  tg('Rent', { type: 'monthly', amount: 65000, mode: 'set' }); tg('Groceries', { type: 'monthly', amount: 28000, mode: 'refill' });
  tg('Phone & Internet', { type: 'monthly', amount: 3500, mode: 'set' }); tg('Emergency Fund', { type: 'balance', amount: 300000 });
  tg('Vacation', { type: 'date', amount: 90000, date: addMonths(cm, 8) }); tg('Insurance', { type: 'yearly', amount: 42000, month: 1 });
  tg('Transportation', { type: 'weekly', amount: 1500, weekday: 1, mode: 'set' });
  byName('Groceries').emoji = '🛒'; byName('Rent').emoji = '🏠'; byName('Vacation').emoji = '🌴';
  const add = (acct, date, payee, cat, amount, extra = {}) => saveTx({ acct, date, payee, cat: cat ? byName(cat)?.id || cat : null, amount, cleared: date < todayISO().slice(0, 8) + '01' ? 'c' : 'u', approved: true, ...extra });
  for (const m of [m2, m1, cm]) {
    const pay = 230000;
    add(chk.id, day(m, 1), 'Paycheck (sample)', 'rta', pay);
    const as = { Rent: 65000, 'Utilities': 4500, 'Phone & Internet': 3500, Insurance: 3500, Subscriptions: 2500, Groceries: 28000, Transportation: 6000, 'Dining Out': 12000, Health: 3000, Shopping: 8000, 'Emergency Fund': 20000, Vacation: 10000, Gifts: 4000, Hobbies: 6000, 'Stuff I Forgot to Budget For': 5000 };
    for (const [n, v] of Object.entries(as)) setAssigned(m, byName(n).id, m === cm && ['Shopping', 'Gifts', 'Stuff I Forgot to Budget For'].includes(n) ? 0 : v);
    const isCur = m === cm; const lim = isCur ? Math.min(28, Number(todayISO().slice(8))) : 28;
    const list = [[5, 'Landlord', 'Rent', -65000], [6, 'EDF', 'Utilities', -4380], [8, 'Free', 'Phone & Internet', -2999], [3, 'Lidl', 'Groceries', -4218], [10, 'Lidl', 'Groceries', -5630], [17, 'Carrefour', 'Groceries', -7480], [24, 'Lidl', 'Groceries', -3912],
      [4, 'Tisséo', 'Transportation', -1020], [12, 'SNCF', 'Transportation', -3450], [9, 'Le Bar Basque', 'Dining Out', -2300], [20, 'Pizzeria', 'Dining Out', -3150], [14, 'Pharmacy', 'Health', -1890], [15, 'Netflix', 'Subscriptions', -1349], [15, 'Spotify', 'Subscriptions', -1199], [21, 'Cinema', 'Hobbies', -2400], [11, 'MAIF', 'Insurance', -3500]];
    for (const [d, py, ct, v] of list) if (d <= lim) add(chk.id, day(m, d), py, ct, v);
    if (lim >= 18) add(cc.id, day(m, 18), 'Decathlon', 'Shopping', -6490);
    if (lim >= 2) saveTx({ acct: chk.id, date: day(m, 2), transferAcct: sav.id, amount: -20000, cleared: 'c', memo: 'Monthly savings', approved: true });
    if (!isCur && lim >= 25) saveTx({ acct: chk.id, date: day(m, 25), transferAcct: cc.id, amount: -6490, cleared: 'c', memo: 'Card payment', approved: true });
  }
  rebuildLookups();
  add(chk.id, todayISO(), 'Unknown card payment', null, -1990, { approved: false, cleared: 'c' });
  p.scheduled.push({ id: uid(), acct: chk.id, payee: 'Paycheck (sample)', cat: 'rta', memo: '', amount: 230000, freq: 'monthly', next: addMonths(cm, 1) + '-01' });
  p.scheduled.push({ id: uid(), acct: chk.id, payee: 'Landlord', cat: byName('Rent').id, memo: '', amount: -65000, freq: 'monthly', next: addMonths(cm, 1) + '-05' });
  p.rules.push({ contains: 'CB LIDL', payee: 'Lidl' });
  A.calcV++; rebuildLookups();
  const extra = monthData(cm).rta - 32000;
  if (extra > 0) setAssigned(m2, byName('Emergency Fund').id, getAssigned(m2, byName('Emergency Fund').id) + extra);
  A.calcV++;
}

/* ---------- HOME (YNAB mobile): alerts, pinned categories, current goal, month summary, month ahead ---------- */
function viewHome() {
  const m = curMonth(), md = monthData(m), rta = md.rta;
  const unap = A.tx.filter(t => t.approved === false && L.acct[t.acct] && !L.acct[t.acct].closed);
  const over = A.plan.cats.filter(c => !c.hidden && catM(m, c.id).available < 0);
  const first = (A.plan.ownerName || A.plan.name.replace(/['’]s budget$/i, '') || '').trim();
  let h = `<div class="top wrap"><div class="top-bar"><span style="width:44px"></span><div class="top-title"><div class="sub" style="font-weight:700">${esc(A.plan.name)}</div></div><button class="ibtn" data-a="moreMenu" aria-label="More">${I.dots}</button></div></div>`;
  h += `<div class="wrap home"><h1 class="home-h">${esc(A.plan.name)}</h1>`;
  const todo = [];
  if (unap.length) todo.push(`<div class="li"><span class="hnum">${unap.length}</span><span class="grow">New transaction${unap.length > 1 ? 's' : ''}</span><button class="btn sm soft" data-a="cardMode">Review</button></div>`);
  if (over.length) todo.push(`<div class="li"><span class="hnum bad">${over.length}</span><span class="grow">Overspent categor${over.length > 1 ? 'ies' : 'y'}</span><button class="btn sm soft" data-a="homeOver">Cover</button></div>`);
  if (rta > 0) todo.push(`<div class="li"><span class="pill good">${fmt(rta)}</span><span class="grow">Ready to assign</span><button class="btn sm soft" data-a="nav" data-v="plan">Assign</button></div>`);
  if (rta < 0) todo.push(`<div class="li"><span class="pill bad">${fmt(rta)}</span><span class="grow">Assigned too much</span><button class="btn sm soft" data-a="nav" data-v="plan">Fix</button></div>`);
  h += `<div class="card hhello"><div class="hh-t"><strong>${todo.length ? 'Lookin’ good' : 'All caught up'}${first ? ', ' + esc(first) : ''}</strong><span class="small muted">${todo.length ? 'Just a few things to do' : 'Every euro has a job.'}</span></div>${todo.join('')}</div>`;
  // pinned categories
  const pins = (A.plan.pins || []).filter(id => L.cat[id] && !L.cat[id].hidden);
  h += `<details class="hsec" open><summary><span class="grow">Pinned</span><button class="btn sm soft" data-a="pinEdit">${pins.length ? 'Edit' : 'Add'}</button></summary>`;
  h += pins.length ? `<div class="card">${pins.map(id => { const c = L.cat[id], st = catStatus(c, m), x = st.x; return `<button class="li" data-a="catSheet" data-c="${id}"><span class="grow ellip">${esc(catName(id))}</span><span class="pill ${st.cls}">${fmt(x.available)}</span></button>`; }).join('')}</div>`
    : `<button class="card hempty" data-a="pinEdit">${I.pin} Pin the categories you check most often</button>`;
  h += `</details>`;
  // current goal
  const gid = A.plan.goalCat && L.cat[A.plan.goalCat] && L.cat[A.plan.goalCat].target ? A.plan.goalCat : null;
  h += `<details class="hsec" open><summary><span class="grow">Current Goal</span>${gid ? `<button class="btn sm soft" data-a="goalPick">Change</button>` : ''}</summary>`;
  if (gid) { const c = L.cat[gid], x = catM(m, gid), ti = targetInfo(c, m, x), tot = c.target.amount, have = Math.max(0, ['yearly', 'date', 'balance'].includes(c.target.type) ? x.carry + x.assigned : x.available), pct = tot ? Math.min(1, have / tot) : 0;
    h += `<button class="card hgoal" data-a="catSheet" data-c="${gid}"><div class="row"><strong class="grow ellip">${esc(catName(gid))}</strong><span class="num">${fmt(have)} / ${fmt(tot)}</span></div><div class="bar ${ti && ti.under > 0 ? 'warn' : ''}"><i style="width:${Math.round(pct * 100)}%"></i></div><div class="small muted">${esc(targetText(c, m, catStatus(c, m)) || '')} · ${Math.round(pct * 100)} %</div></button>`; }
  else h += `<div class="card hgoal" style="text-align:center"><strong>What are you saving for?</strong><span class="small muted">Pick one category to track. We’ll show your progress here.</span><button class="btn sm soft" style="align-self:center" data-a="goalPick">${I.plus} Add Goal</button></div>`;
  h += `</details>`;
  // month summary (YNAB tiles)
  let tTot = 0, under = 0; for (const c of A.plan.cats) { if (c.hidden) continue; const ti = targetInfo(c, m); if (ti) { tTot += ti.need; under += ti.under; } }
  const spent = -A.plan.cats.reduce((sm, c) => sm + Math.min(0, catM(m, c.id).activity), 0);
  const tile = (icn, l, v, a) => `<button class="htile" data-a="${a}">${icn}<span class="small muted">${l}</span><strong class="num">${fmt(v)}</strong></button>`;
  h += `<details class="hsec" open><summary><span class="grow">${esc(MONTHS[+m.slice(5) - 1] ? cap(MONTHS[+m.slice(5) - 1]) : monthLabel(m))} Summary</span></summary><div class="htiles">
    ${tile(I.target, 'Total Targets', tTot, 'costToBeMe')}${tile(I.reflect, 'Underfunded', under, 'homeUnder')}${tile(I.plan, 'Assigned', md.assigned, 'nav" data-v="plan')}${tile(I.cash, 'Spent', spent, 'goReflect')}</div></details>`;
  // assigned in future months
  const nm = addMonths(m, 1);
  h += `<details class="hsec" open><summary><span class="grow">Assigned in Future Months</span></summary><div class="card"><button class="li" data-a="monthNext"><span class="grow">${esc(cap(MONTHS[+nm.slice(5) - 1]))}</span><span class="num">${fmt(monthData(nm).assigned || 0)}</span>${I.right}</button></div></details>`;
  return h + `</div>`;
}
function cardModeSheet() {
  const q = A.tx.filter(t => t.approved === false && L.acct[t.acct] && !L.acct[t.acct].closed && !(A.ui.cmSkip || new Set()).has(t.id)).sort((a, b) => a.date < b.date ? 1 : -1);
  const t = q[0];
  if (!t) { closeSheet(); A.ui.cmSkip = null; toast('All transactions reviewed'); render(); return; }
  const cl = txCatLabel(t) || 'Category Needed', need = cl === 'Category Needed';
  const body = `<div class="small muted" style="text-align:center">${q.length} left · swipe right to approve, left to skip</div>
    <div class="cmcard" id="cmCard" data-id="${t.id}">
      <div class="small muted">${esc(L.acct[t.acct]?.name || '')} · ${esc(fmtDate(t.date))}</div>
      <div class="cm-amt num ${t.amount > 0 ? 'amt-pos' : ''}">${fmt(t.amount)}</div>
      <div class="cm-payee">${esc(payeeName(t) || '—')}</div>
      ${t.rawPayee && t.rawPayee !== payeeName(t) ? `<div class="small muted ellip">${esc(t.rawPayee)}</div>` : ''}
      <button class="btn block ${need ? 'warn' : ''}" data-a="catPick" data-id="${t.id}" style="margin-top:12px">${esc(cl)}</button>
      ${t.memo ? `<div class="small muted" style="margin-top:6px">${esc(t.memo)}</div>` : ''}
    </div>
    <div class="grid2"><button class="btn" data-a="cmSkip" data-id="${t.id}">Skip For Now</button><button class="btn pri" data-a="cmApprove" data-id="${t.id}">${I.check} Approve</button></div>
    <button class="btn block" data-a="cmList" style="margin-top:6px">${I.list} List mode</button>`;
  const open = $('#scrim .sheet'); if (open && open.dataset.cm) { $('#scrim .sheet-b').innerHTML = body; } else { const s = openSheet('Review', body); const sh = s && $('.sheet', s); if (sh) sh.dataset.cm = '1'; }
  const card = $('#cmCard'); if (!card) return; let x0 = null, dx = 0;
  card.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; dx = 0; card.style.transition = 'none'; }, { passive: true });
  card.addEventListener('touchmove', e => { if (x0 == null) return; dx = e.touches[0].clientX - x0; card.style.transform = `translateX(${dx}px) rotate(${dx / 30}deg)`; card.style.background = dx > 40 ? 'var(--good-bg, rgba(34,197,94,.12))' : dx < -40 ? 'var(--surface-2, rgba(0,0,0,.05))' : ''; }, { passive: true });
  card.addEventListener('touchend', () => { card.style.transition = 'transform .2s'; if (dx > 90) ACT.cmApprove({ dataset: { id: card.dataset.id } }); else if (dx < -90) ACT.cmSkip({ dataset: { id: card.dataset.id } }); else { card.style.transform = ''; card.style.background = ''; } x0 = null; });
}
document.addEventListener('change', e => { const el = e.target; if (el.dataset?.c !== 'pinChk') return; mutate('Pinned categories updated', () => { const p = new Set(A.plan.pins || []); el.checked ? p.add(el.dataset.id) : p.delete(el.dataset.id); A.plan.pins = [...p]; }, { silent: true }); render._keepScroll = true; render(); });

/* Reflect on a phone opens on summary cards, like YNAB's app */
function reflectOverview() {
  const m = curMonth(), lines = spendingLines(m, m), by = {};
  for (const l of lines) by[l.cat] = (by[l.cat] || 0) - l.amount;
  const uncat = -A.tx.filter(t => monthOf(t.date) === m && onBudget(L.acct[t.acct]) && !t.transferAcct && !t.cat && !(t.splits && t.splits.length) && t.amount < 0).reduce((s2, t) => s2 + t.amount, 0);
  let items = Object.entries(by).filter(([, v]) => v > 0).map(([k, v]) => ({ n: catName(k), v })); if (uncat > 0) items.push({ n: 'Uncategorized Transactions', v: uncat });
  items.sort((a, b) => b.v - a.v); const total = items.reduce((s2, x) => s2 + x.v, 0); const top = items.slice(0, 5), rest = items.slice(5).reduce((s2, x) => s2 + x.v, 0);
  const seg = top.map((x, i) => `<i style="flex:${x.v};background:var(${COLORS[i % 8]})"></i>`).join('') + (rest ? `<i style="flex:${rest};background:var(--muted)"></i>` : '');
  const acc = A.plan.accounts; let as = 0, de = 0; for (const a of acc) { const b = A.tx.filter(t => t.acct === a.id).reduce((s2, t) => s2 + t.amount, 0); if (b >= 0) as += b; else de += b; }
  const months = monthsBetween(addMonths(m, -2), m); const inc = months.map(mm => A.tx.filter(t => monthOf(t.date) === mm && onBudget(L.acct[t.acct])).reduce((s2, t) => s2 + txLines(t).filter(l => l.cat === 'rta').reduce((x, l) => x + l.amount, 0), 0));
  const exp = months.map(mm => -spendingLines(mm, mm).reduce((s2, l) => s2 + l.amount, 0)); const ai = inc.reduce((a, b) => a + b, 0), ae = exp.reduce((a, b) => a + b, 0);
  const verdict = !ai ? 'No income recorded recently.' : ae > ai * 1.05 ? 'On average, you’re spending more than you make.' : ae < ai * 0.95 ? 'On average, you’re making more than you spend.' : 'On average, you’re spending about as much as you make.';
  const card = (k, title, inner) => `<button class="card rcard" data-a="reflOpen" data-k="${k}"><div class="row"><span class="small rc-t">${title}</span><span class="grow"></span>${I.right}</div>${inner}</button>`;
  let h = `<div class="top wrap"><div class="top-bar"><span style="width:44px"></span><div class="top-title"></div><button class="ibtn" data-a="moreMenu" aria-label="More">${I.dots}</button></div></div><div class="wrap home"><h1 class="home-h">Reflect</h1>`;
  h += card('spending', 'Spending Breakdown', `<div class="small muted">${esc(monthLabel(m))}</div><div class="rc-big num">${fmt(total)}</div><div class="rc-seg">${seg}</div>
    <div class="row small muted" style="margin-top:8px"><span class="grow">Top Categories</span><span>Spent</span></div>${top.map((x, i) => `<div class="row small"><span class="dot" style="background:var(${COLORS[i % 8]})"></span><span class="grow ellip">${esc(x.n)}</span><span class="num">${fmt(x.v)}</span></div>`).join('')}${rest ? `<div class="row small"><span class="dot" style="background:var(--muted)"></span><span class="grow">All Others</span><span class="num">${fmt(rest)}</span></div>` : ''}`);
  h += card('networth', 'Net Worth', `<div class="rc-big num">${fmt(as + de)}</div><div class="row small"><span class="grow" style="color:var(--accent-strong)">Assets</span><span class="num">${fmt(as)}</span></div><div class="row small"><span class="grow" style="color:var(--bad)">Debts</span><span class="num">${fmt(de)}</span></div>`);
  h += card('aom', 'Age of Money', `<div class="rc-big">${ageOfMoney().now ?? '—'} Days</div>`);
  h += card('ie', 'Income vs. Spending', `<div style="font-weight:700; margin-top:4px">${verdict}</div><div class="small muted" style="margin-top:4px">Last 3 months: ${fmt(ai)} in · ${fmt(ae)} out</div>`);
  return h + `</div>`;
}
