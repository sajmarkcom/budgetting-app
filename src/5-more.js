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
  return map[p] || map['3m'];
}
function spendingLines(from, to) {
  const out = [];
  for (const t of A.tx) {
    const a = L.acct[t.acct]; if (!onBudget(a)) continue; const m = monthOf(t.date); if (m < from || m > to) continue;
    if (t.transferAcct && onBudget(L.acct[t.transferAcct])) continue;
    for (const ln of txLines(t)) { if (!ln.cat || ln.cat === 'rta' || ln.cat === '__start' || !L.cat[ln.cat]) continue; out.push({ m, cat: ln.cat, payee: t.payee, amount: ln.amount }); }
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
  const W = Math.max(320, months.length * 46), H = 220, pl = 54, pb = 26, pt = 10, ch = H - pb - pt, cw = W - pl - 8;
  let max = 0, min = 0;
  months.forEach((_, i) => { let pos = 0, neg = 0; series.forEach(s => { const v = s.values[i] || 0; if (v > 0) pos += v; else neg += v; }); max = Math.max(max, pos); min = Math.min(min, neg); });
  if (opts.line) opts.line.forEach(v => { max = Math.max(max, v); min = Math.min(min, v); });
  if (max === min) max = min + 100;
  const raw = (max - min) / 4, p10 = Math.pow(10, Math.floor(Math.log10(raw || 1))); const step = [1, 2, 2.5, 5, 10].map(k => k * p10).find(k => k >= raw) || 10 * p10;
  max = Math.ceil(max / step) * step; min = Math.floor(min / step) * step; const nT = Math.round((max - min) / step);
  const y = v => pt + (max - v) / (max - min) * ch; const bw = Math.min(28, cw / months.length * 0.6);
  let g = '';
  for (let k = 0; k <= nT; k++) { const v = min + step * k; g += `<line x1="${pl}" x2="${W - 8}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${pl - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="var(--muted)" font-family="Manrope, sans-serif">${esc(fmtS(v))}</text>`; }
  months.forEach((m, i) => {
    const cx = pl + cw * (i + 0.5) / months.length; let pos = 0, neg = 0;
    series.forEach(s => { const v = s.values[i] || 0; if (!v) return; let y0, y1; if (v > 0) { y0 = y(pos + v); y1 = y(pos); pos += v; } else { y0 = y(neg); y1 = y(neg + v); neg += v; } g += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, y1 - y0).toFixed(1)}" rx="3" fill="var(${s.color})"><title>${esc(s.label)} · ${esc(monthLabel(m))} : ${esc(fmt(v))}</title></rect>`; });
    g += `<text x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="var(--muted)" font-family="Manrope, sans-serif">${esc(monthLabel(m, true))}</text>`;
  });
  if (opts.line) {
    const pts = opts.line.map((v, i) => [pl + cw * (i + 0.5) / months.length, y(v)]);
    g += `<polyline points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--fg)" stroke-width="2.2"/>` + pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3}" fill="var(--fg)"><title>${esc(opts.lineLabel || '')} : ${esc(fmt(opts.line[i]))}</title></circle>`).join('');
  }
  if (min < 0) g += `<line x1="${pl}" x2="${W - 8}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" stroke="var(--muted)" stroke-width="1"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W, 640)}px" role="img" aria-label="${esc(opts.aria || 'Graphique')}">${g}</svg>`;
}
function monthsBetween(a, b) { const out = []; for (let m = a; m <= b; m = addMonths(m, 1)) out.push(m); return out; }
function viewReflect() {
  const tabs = [['spending', 'Spending Breakdown'], ['trends', 'Spending Trends'], ['networth', 'Net Worth'], ['ie', 'Income v Expense'], ['aom', 'Age of Money']];
  const per = [['m', 'This Month'], ['lm', 'Last Month'], ['3m', 'Last 3 Months'], ['6m', 'Last 6 Months'], ['ytd', 'Year to Date'], ['12m', 'Last 12 Months'], ['all', 'All Dates']];
  let h = topBar('Reflect', esc(A.plan.name));
  h += `<div class="wrap"><div class="chips">${tabs.map(([k, l]) => `<button class="chip ${A.ui.reflect === k ? 'on' : ''}" data-a="reflectTab" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="chips" style="padding-top:2px">${per.map(([k, l]) => `<button class="chip ${A.ui.period === k ? 'on' : ''}" data-a="period" data-k="${k}">${l}</button>`).join('')}</div>`;
  const [from, to] = periodRange(); const months = monthsBetween(from, to);
  const R = A.ui.reflect;
  if (R === 'spending') {
    const lines = spendingLines(from, to); const by = {};
    const keyOf = l => A.ui.groupBy === 'group' ? L.cat[l.cat].gid : A.ui.groupBy === 'cat' ? l.cat : (l.payee || '—');
    const nameOf = k => A.ui.groupBy === 'group' ? (L.group[k]?.name || '') : A.ui.groupBy === 'cat' ? catName(k) : (L.payee[k]?.name || 'No payee');
    for (const l of lines) { const k = keyOf(l); by[k] = (by[k] || 0) - l.amount; }
    let items = Object.entries(by).map(([k, v]) => ({ k, v, n: nameOf(k) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    if (items.length > 8) { const rest = items.slice(7).reduce((s, x) => s + x.v, 0); items = items.slice(0, 7).concat([{ k: '_o', v: rest, n: 'Other' }]); }
    const total = items.reduce((s, x) => s + x.v, 0);
    h += `<div class="seg" style="margin-top:6px"><button class="${A.ui.groupBy === 'group' ? 'on' : ''}" data-a="groupBy" data-k="group">Category Groups</button><button class="${A.ui.groupBy === 'cat' ? 'on' : ''}" data-a="groupBy" data-k="cat">Categories</button><button class="${A.ui.groupBy === 'payee' ? 'on' : ''}" data-a="groupBy" data-k="payee">Payees</button></div>
      <div class="kpis" style="margin-top:10px"><div class="kpi"><span>Total Spending</span><b class="num">${fmt(total)}</b></div><div class="kpi"><span>Average Monthly</span><b class="num">${fmt(Math.round(total / months.length))}</b></div><div class="kpi"><span>Average Daily</span><b class="num">${fmt(Math.round(total / Math.max(1, months.length * 30.4)))}</b></div><div class="kpi"><span>Items</span><b>${items.length}</b></div></div>
      <div class="chartbox" style="margin-top:10px"><div style="max-width:260px; margin:0 auto">${donut(items, total)}</div>
      <div class="legend">${items.map((x, i) => `<div class="li"><span class="dot" style="background:var(${COLORS[i % 8]})"></span><span class="grow ellip">${esc(x.n)}</span><span class="small muted">${total ? Math.round(x.v / total * 100) : 0} %</span><strong class="num" style="width:96px; text-align:right">${fmt(x.v)}</strong></div>`).join('') || '<div class="muted small" style="padding:8px">No spending in this period.</div>'}</div></div>`;
  } else if (R === 'trends') {
    const lines = spendingLines(from, to); const gids = A.plan.groups.map(g => g.id);
    const series = gids.map((gid, i) => ({ key: gid, label: L.group[gid].name, color: COLORS[i % 8], values: months.map(m => lines.filter(l => l.m === m && L.cat[l.cat].gid === gid).reduce((s, l) => s - l.amount, 0)) })).filter(s => s.values.some(v => v));
    const tot = months.map((_, i) => series.reduce((s, x) => s + x.values[i], 0));
    const avg = Math.round(tot.reduce((a, b) => a + b, 0) / months.length);
    h += `<div class="kpis" style="margin-top:6px"><div class="kpi"><span>Average Monthly</span><b class="num">${fmt(avg)}</b></div><div class="kpi"><span>Highest Month</span><b class="num">${fmt(Math.max(0, ...tot))}</b></div></div>
      <div class="chartbox" style="margin-top:10px">${bars(months, series, { aria: 'Spending by month' })}<div class="legend">${series.map(s => `<div class="li"><span class="dot" style="background:var(${s.color})"></span><span class="grow">${esc(s.label)}</span><strong class="num">${fmt(s.values.reduce((a, b) => a + b, 0))}</strong></div>`).join('')}</div></div>`;
  } else if (R === 'networth') {
    const acc = A.plan.accounts; const assets = [], debts = [], net = [];
    for (const m of months) { let as = 0, de = 0; for (const a of acc) { const b = A.tx.filter(t => t.acct === a.id && monthOf(t.date) <= m).reduce((s, t) => s + t.amount, 0); if (b >= 0) as += b; else de += b; } assets.push(as); debts.push(de); net.push(as + de); }
    const last = net.length - 1; const ch = net[last] - net[0];
    h += `<div class="kpis" style="margin-top:6px"><div class="kpi"><span>Net Worth</span><b class="num">${fmt(net[last])}</b></div><div class="kpi"><span>Change</span><b class="num" style="color:${ch >= 0 ? 'var(--accent-strong)' : 'var(--bad)'}">${ch >= 0 ? '+' : ''}${fmt(ch)}</b></div><div class="kpi"><span>Assets</span><b class="num">${fmt(assets[last])}</b></div><div class="kpi"><span>Debts</span><b class="num">${fmt(debts[last])}</b></div></div>
      <div class="chartbox" style="margin-top:10px">${bars(months, [{ label: 'Assets', color: '--c1', values: assets }, { label: 'Debts', color: '--c5', values: debts }], { line: net, lineLabel: 'Net', aria: 'Net worth by month' })}
      <div class="legend"><div class="li"><span class="dot" style="background:var(--c1)"></span><span class="grow">Assets</span></div><div class="li"><span class="dot" style="background:var(--c5)"></span><span class="grow">Debts</span></div><div class="li"><span class="dot" style="background:var(--fg); border-radius:99px"></span><span class="grow">Net Worth</span></div></div></div>`;
  } else if (R === 'ie') {
    const lines = spendingLines(from, to);
    const notIncome = t => ['Solde initial', 'Ajustement de rapprochement', 'Starting Balance', 'Reconciliation Balance Adjustment'].includes(L.payee[t.payee]?.name);
    const inc = months.map(m => A.tx.filter(t => monthOf(t.date) === m && onBudget(L.acct[t.acct]) && !notIncome(t)).reduce((s, t) => s + txLines(t).filter(l => l.cat === 'rta').reduce((x, l) => x + l.amount, 0), 0));
    const rows = A.plan.groups.map(g => ({ g, v: months.map(m => lines.filter(l => l.m === m && L.cat[l.cat].gid === g.id).reduce((s, l) => s + l.amount, 0)) })).filter(r => r.v.some(x => x));
    const exp = months.map((_, i) => rows.reduce((s, r) => s + r.v[i], 0));
    const sum = a => a.reduce((x, y) => x + y, 0);
    h += `<div class="kpis" style="margin-top:6px"><div class="kpi"><span>Income</span><b class="num">${fmt(sum(inc))}</b></div><div class="kpi"><span>Expenses</span><b class="num">${fmt(sum(exp))}</b></div><div class="kpi"><span>Net Income</span><b class="num">${fmt(sum(inc) + sum(exp))}</b></div><div class="kpi"><span>Savings Rate</span><b>${sum(inc) ? Math.round((sum(inc) + sum(exp)) / sum(inc) * 100) : 0} %</b></div></div>
      <div class="chartbox" style="margin-top:10px">${bars(months, [{ label: 'Income', color: '--c1', values: inc }, { label: 'Expenses', color: '--c3', values: exp }], { line: months.map((_, i) => inc[i] + exp[i]), lineLabel: 'Net', aria: 'Income and expenses' })}</div>
      <div class="chartbox" style="margin-top:10px; padding:0"><table class="tbl"><thead><tr><th>Category Group</th>${months.map(m => `<th>${esc(monthLabel(m, true))}</th>`).join('')}<th>Total</th></tr></thead><tbody>
        <tr class="tot"><td>Total Income</td>${inc.map(v => `<td>${fmt(v)}</td>`).join('')}<td>${fmt(sum(inc))}</td></tr>
        ${rows.map(r => `<tr><td>${esc(r.g.name)}</td>${r.v.map(v => `<td>${fmt(v)}</td>`).join('')}<td>${fmt(sum(r.v))}</td></tr>`).join('')}
        <tr class="tot"><td>Total Expenses</td>${exp.map(v => `<td>${fmt(v)}</td>`).join('')}<td>${fmt(sum(exp))}</td></tr>
        <tr class="tot"><td>Net Income</td>${months.map((_, i) => `<td>${fmt(inc[i] + exp[i])}</td>`).join('')}<td>${fmt(sum(inc) + sum(exp))}</td></tr></tbody></table></div>`;
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
    <div class="card">${A.index.plans.map(x => `<button class="li" data-a="switchPlan" data-id="${x.id}" ${x.id === p.id ? 'aria-current="true"' : ''}><span class="ic">${x.id === p.id ? I.check : I.plan}</span><span class="grow"><strong>${esc(x.name)}</strong>${x.id === p.id ? '<div class="small muted">Open</div>' : ''}</span></button>`).join('')}
      <button class="li" data-a="newPlan"><span class="ic">${I.plus}</span><span class="grow"><strong>New Plan</strong></span></button></div>
    ${driveSettingsHtml()}
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
function exportJson() { saveFile(`budget-${A.plan.name.replace(/[^\w-]+/g, '_')}-${todayISO()}.json`, JSON.stringify({ app: 'pecule', v: 1, plan: A.plan, tx: A.tx }, null, 1), 'application/json'); }
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
