/* ================= Budget — sheets (bottom panels) ================= */
let SH = null; // { render(), onClose }
function openSheet(title, body, foot = '', opts = {}) {
  closeSheet(true);
  const s = document.createElement('div'); s.className = 'scrim'; s.id = 'scrim';
  s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheet-h"><button class="ibtn" data-a="closeSheet" aria-label="Close">${I.close}</button><h2>${esc(title)}</h2>${opts.right || '<span style="width:44px"></span>'}</div>
    <div class="sheet-b wrap">${body}</div>${foot ? `<div class="sheet-f wrap">${foot}</div>` : ''}</div>`;
  s.addEventListener('click', e => { if (e.target === s) closeSheet(); });
  document.body.appendChild(s);
  document.body.style.overflow = 'hidden';
  const f = opts.focus && $(opts.focus, s); if (f) setTimeout(() => { f.focus(); if (f.select) f.select(); }, 60);
  return s;
}
function closeSheet(silent) { const s = $('#scrim'); if (s) s.remove(); document.body.style.overflow = ''; SH = null; }
function refreshSheetBody(html) { const b = $('#scrim .sheet-b'); if (b) b.innerHTML = html; }

function catOptions(sel, { rta = true, none = true, m = A.month, noneLabel = 'Category Needed', amounts = true } = {}) {
  let o = none ? `<option value="">${noneLabel}</option>` : '';
  if (rta) o += `<option value="rta" ${sel === 'rta' ? 'selected' : ''}>💶 Inflow: Ready to Assign${amounts ? ' (' + fmt(monthData(m).rta) + ')' : ''}</option>`;
  for (const g of A.plan.groups) {
    if (g.sys === 'cc') continue;
    const cats = A.plan.cats.filter(c => c.gid === g.id && (!c.hidden || c.id === sel)); if (!cats.length) continue;
    o += `<optgroup label="${esc(g.name)}">` + cats.map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(catName(c.id))}${amounts ? ' · ' + fmt(catM(m, c.id).available) : ''}</option>`).join('') + `</optgroup>`;
  }
  return o;
}
function acctOptions(sel, filter = () => true) {
  return A.plan.accounts.filter(a => !a.closed && filter(a)).map(a => `<option value="${a.id}" ${sel === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
}

/* ---------- category sheet ---------- */
function catSheet(cid, asHtml) {
  const c = L.cat[cid]; if (!c) return;
  if (!asHtml && DESK() && A.view === 'plan' && A.ui.selCat === cid && !A.ui.inspHide) { closeSheet && $('#scrim') && closeSheet(); render._keepScroll = true; render(); return; }
  const m = A.month, x = catM(m, cid), ti = targetInfo(c, m, x);
  const t = c.target || {};
  const recent = A.tx.filter(tx => monthOf(tx.date) === m && txLines(tx).some(l => l.cat === cid)).sort((a, b) => a.date < b.date ? 1 : -1);
  const prev = addMonths(m, -1), pm = catM(prev, cid);
  const last12 = []; for (let i = 1; i <= 12; i++) last12.push(catM(addMonths(m, -i), cid));
  const nAvg = Math.max(1, Math.min(12, monthDiff(calc().minM, m))); const l12 = last12.slice(0, nAvg);
  const avgA = Math.round(l12.reduce((s, y) => s + y.assigned, 0) / nAvg), avgS = Math.round(l12.reduce((s, y) => s + Math.max(0, -y.activity), 0) / nAvg);
  const quick = [
    ti && ti.under > 0 ? ['Fund target', getAssigned(m, cid) + ti.under] : null,
    ['Assigned Last Month', pm.assigned], ['Spent Last Month', Math.max(0, -pm.activity)],
    ['Average Assigned', avgA], ['Average Spent', avgS],
    x.available > 0 ? ['Reset Available Amount', getAssigned(m, cid) - x.available] : null,
    ['Reset Assigned Amount', 0],
  ].filter(Boolean);
  const body = `
    <div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="kpi"><span>Assigned</span><b class="num" style="font-size:17px">${fmt(x.assigned)}</b></div>
      <div class="kpi"><span>Activity</span><b class="num" style="font-size:17px">${fmt(x.activity)}</b></div>
      <div class="kpi"><span>Available</span><b class="num" style="font-size:17px; color:${x.available < 0 ? 'var(--bad)' : 'inherit'}">${fmt(x.available)}</b></div>
    </div>
    <details class="card avb"><summary class="li"><span class="grow">Available Balance</span><strong class="num">${fmt(x.available)}</strong></summary>
      <div class="li small"><span class="grow muted">Cash Left Over From ${monthLabel(prev)}</span><span class="num">${fmt(x.carry)}</span></div>
      <div class="li small"><span class="grow muted">Assigned This Month</span><span class="num">${x.assigned >= 0 ? '+' : ''}${fmt(x.assigned)}</span></div>
      <div class="li small"><span class="grow muted">Cash Spending</span><span class="num">${fmt(x.cashAct || 0)}</span></div>
      <div class="li small"><span class="grow muted">Credit Spending</span><span class="num">${fmt(x.credAct || 0)}</span></div></details>
    ${x.available < 0 ? `<div class="banner bad">${I.info}<span>${x.creditOver && !x.cashOver ? 'Overspent on credit: this becomes debt you will need to pay.' : 'Overspent: cover it with money from another category.'}</span></div>
      <button class="btn pri block" data-a="coverSheet" data-c="${cid}">Cover Overspending (${fmt(-x.available)})</button>` : ''}
    <div class="row"><button class="btn grow" data-a="moveSheet" data-c="${cid}">${I.swap} Move Money</button></div>
    ${c.cc ? ccInfo(c) : targetEditor(c)}
    <div class="sec-t" style="padding-top:4px"><span>Auto-Assign</span></div>
    <div class="card">${quick.map(([l, v]) => `<button class="li" data-a="setAssign" data-c="${cid}" data-v="${v}"><span class="grow">${l}</span><strong class="num">${fmt(v)}</strong></button>`).join('')}</div>
    <div class="sec-t"><span>Details</span></div>
    <div class="grid2" style="grid-template-columns:76px minmax(0,1fr)">
      <div class="field"><label for="cEmoji">Icon</label><input id="cEmoji" class="in" maxlength="4" value="${esc(c.emoji || '')}" placeholder="Emoji" data-cf="emoji" data-c="${cid}"></div>
      <div class="field"><label for="cName">Name</label><input id="cName" class="in" value="${esc(c.name)}" data-cf="name" data-c="${cid}" ${c.cc ? 'disabled' : ''}></div>
    </div>
    <div class="field"><label for="cNote">Note</label><textarea id="cNote" class="in" data-cf="note" data-c="${cid}" placeholder="e.g. rent due on the 5th">${esc(c.note || '')}</textarea></div>
    ${!c.cc ? `<div class="field"><label for="cGroup">Category Group</label><select id="cGroup" class="in" data-cf="gid" data-c="${cid}">${A.plan.groups.filter(g => !g.sys).map(g => `<option value="${g.id}" ${g.id === c.gid ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>` : ''}
    <div class="sec-t"><span>${monthLabel(m)} Activity</span><span class="num">${recent.length}</span></div>
    ${recent.length ? `<div class="card">${recent.slice(0, 30).map(t => txRow(t, true)).join('')}</div>` : `<div class="muted small">No transactions this month.</div>`}
    ${!c.cc ? `<div class="row" style="margin-top:6px"><button class="btn grow" data-a="cHide" data-c="${cid}">${c.hidden ? I.eye + ' Unhide' : I.eyeoff + ' Hide'}</button><button class="btn danger grow" data-a="catDelete" data-c="${cid}">${I.trash} Delete</button></div>` : ''}`;
  if (asHtml) return body;
  const open = $('#scrim .sheet');
  if (open && open.dataset.cat === cid) { const b = $('#scrim .sheet-b'), st = b.scrollTop; b.innerHTML = body; b.scrollTop = st; return; }
  const s = openSheet(c.name, body); const sh = s && $('.sheet', s); if (sh) sh.dataset.cat = cid;
}
function ccInfo(c) {
  const bal = balances()[c.cc]?.working || 0, x = catM(A.month, c.id);
  const gap = -bal - x.available;
  return `<div class="sec-t"><span>Credit Card</span></div><div class="card">
    <div class="li"><span class="grow">Card Balance</span><strong class="num">${fmt(bal)}</strong></div>
    <div class="li"><span class="grow">Available for Payment</span><strong class="num">${fmt(x.available)}</strong></div>
    <div class="li"><span class="grow">${gap > 0 ? 'Needed to pay in full' : 'Paid in full'}</span><strong class="num">${gap > 0 ? fmt(gap) : '✓'}</strong></div></div>
    ${gap > 0 ? `<button class="btn block" data-a="setAssign" data-c="${c.id}" data-v="${getAssigned(A.month, c.id) + gap}">Assign ${fmt(gap)} to pay in full</button>` : ''}
    <button class="btn pri block" data-a="ccPay" data-id="${c.cc}">${I.swap} Record Payment</button>`;
}
// YNAB's target editor: Weekly / Monthly / Yearly / Custom tabs
function targetTab(t) { if (!t || !t.type) return ''; if (t.type === 'date' || t.type === 'balance') return 'custom'; return t.type; }
function targetEditor(c) {
  const t = c.target || {}, tab = targetTab(t);
  const ti = targetInfo(c, A.month);
  const opt = (v, l, cur) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`;
  const amt = t.amount ? fmt(t.amount) : fmt(0);
  const tabs = [['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly'], ['custom', 'Custom']];
  const need = `<div class="field"><label for="tAmt">I need</label><input id="tAmt" class="in" inputmode="decimal" value="${t.amount ? fmtIn(t.amount) : ''}" placeholder="0,00" data-tf="amount" data-c="${c.id}"></div>`;
  const mode = (next, per = '') => `<div class="field"><label for="tModeSel">${next}</label><select id="tModeSel" class="in" data-tf="mode" data-c="${c.id}">${opt('set', 'Set aside another ' + amt + per, t.mode || 'set')}${opt('refill', 'Refill up to ' + amt + per, t.mode || 'set')}</select>
    <div class="small muted" style="margin-top:4px">${t.mode === 'refill' ? 'Whatever you don’t spend is applied toward the next ' + amt + '.' : 'Most people choose this. Adds ' + amt + ' every time, even if money is left over.'}</div></div>`;
  let body = '';
  if (tab === 'weekly') body = need + `<div class="field"><label for="tWd">Every</label><select id="tWd" class="in" data-tf="weekday" data-c="${c.id}">${[0, 1, 2, 3, 4, 5, 6].map(d => opt(d, cap(DAYS[d]), t.weekday ?? 1)).join('')}</select></div>` + mode('Next month I want to', '/week');
  else if (tab === 'monthly' || t.type === 'debt') body = need + `<div class="field"><label for="tDay">By</label><select id="tDay" class="in" data-tf="day" data-c="${c.id}">${opt(0, 'Last Day of Month', t.day || 0)}${Array.from({ length: 31 }, (_, k) => 31 - k).map(d => opt(d, ordinal(d), t.day || 0)).join('')}</select></div>` + (t.type === 'debt' ? '<div class="small muted">Monthly debt payment</div>' : mode('Next month I want to'));
  else if (tab === 'yearly') body = need + `<div class="field"><label>By</label><div class="row" style="gap:8px"><select id="tYDay" class="in" aria-label="Day" data-tf="day" data-c="${c.id}">${opt(0, 'Last day', t.day || 0)}${Array.from({ length: 31 }, (_, k) => k + 1).map(d => opt(d, ordinal(d), t.day || 0)).join('')}</select><select id="tMo" class="in" aria-label="Month" data-tf="month" data-c="${c.id}">${MONTHS.map((n, k) => opt(k + 1, cap(n), t.month || 12)).join('')}</select></div></div>` + mode('Next year I want to');
  else if (tab === 'custom') {
    const want = t.type === 'balance' ? 'balance' : t.mode === 'refill' ? 'fill' : 'set';
    const rep = t.repeat || 0, unit = rep && rep % 12 === 0 ? 'y' : 'm', every = rep ? (unit === 'y' ? rep / 12 : rep) : 1;
    body = `<div class="field"><label for="tAmt">Amount</label><input id="tAmt" class="in" inputmode="decimal" value="${t.amount ? fmtIn(t.amount) : ''}" placeholder="0,00" data-tf="amount" data-c="${c.id}"></div>
      <div class="field"><label for="tWant">I want to</label><select id="tWant" class="in" data-tf="want" data-c="${c.id}">${opt('set', 'Set aside ' + amt, want)}${opt('fill', 'Fill up to ' + amt, want)}${opt('balance', 'Have a balance of ' + amt, want)}</select>
      <div class="small muted" style="margin-top:4px">${want === 'balance' ? 'Reach this amount by a specific time and refrain from spending until you reach it.' : want === 'fill' ? 'Use what is already in this category and fill it up.' : 'Add the amount to this category, regardless of its current balance.'}</div></div>
      <div class="field"><label for="tDate">Due on${want === 'balance' ? ' (optional)' : ''}</label><input id="tDate" class="in" type="month" value="${t.date || ''}" data-tf="date" data-c="${c.id}"></div>
      <label class="row" style="gap:8px"><input type="checkbox" class="chk" data-tf="repOn" data-c="${c.id}" ${rep ? 'checked' : ''}> Repeat</label>
      ${rep ? `<div class="row" style="gap:8px"><span class="small muted">Every</span><select class="in" aria-label="Interval" data-tf="repN" data-c="${c.id}">${Array.from({ length: 11 }, (_, k) => opt(k + 1, k + 1, every)).join('')}</select><select class="in" aria-label="Unit" data-tf="repU" data-c="${c.id}">${opt('m', 'Month', unit)}${opt('y', 'Year', unit)}</select></div>` : ''}`;
  }
  return `<div class="sec-t"><span>Target</span>${ti ? `<span>${Math.round(ti.pct * 100)} %</span>` : ''}</div>
  <div class="card" style="padding:14px; display:flex; flex-direction:column; gap:12px" id="tgtBox">
    <div class="seg" role="tablist" aria-label="Target type">${tabs.map(([k, l]) => `<button role="tab" class="${tab === k || (k === 'monthly' && t.type === 'debt') ? 'on' : ''}" data-a="tTab" data-c="${c.id}" data-v="${k}">${l}</button>`).join('')}</div>
    ${tab ? body + `<div class="field"><label for="tStart">Starting</label><input id="tStart" class="in" type="month" value="${t.start || ''}" data-tf="start" data-c="${c.id}"></div>` : `<div class="small muted">How much do you need for ${esc(c.name)}? Pick a type to create a target.</div>`}
    ${ti ? `<div class="bar ${ti.under > 0 ? 'warn' : ''}"><i style="width:${Math.round(ti.pct * 100)}%"></i></div><div class="small"><strong>${esc(targetText(c, A.month, catStatus(c, A.month)) || ti.label)}</strong>${ti.need ? ' · needed this month: ' + fmt(ti.need) : ''}</div>
      <div class="row" style="gap:8px"><button class="btn sm" data-a="tSnooze" data-c="${c.id}">${ti.snoozed ? 'Unsnooze' : 'Snooze this month'}</button><span class="grow"></span><button class="btn sm danger" data-a="tDel" data-c="${c.id}">Delete Target</button></div>` : tab ? `<button class="btn sm danger" data-a="tDel" data-c="${c.id}" style="align-self:flex-end">Delete Target</button>` : ''}
  </div>`;
}

/* ---------- RTA breakdown ---------- */
function rtaSheet() {
  const m = A.month, md = monthData(m);
  const prevLeft = md.rtaBase - md.income + md.assigned + md.prevCashOver;
  const body = `<div class="card">
    <div class="li"><span class="grow">Left Over from ${monthLabel(addMonths(m, -1))}</span><strong class="num">${fmt(prevLeft)}</strong></div>
    <div class="li"><span class="grow">Income for ${monthLabel(m)}</span><strong class="num amt-pos">+${fmt(md.income)}</strong></div>
    <div class="li"><span class="grow">Overspent in ${monthLabel(addMonths(m, -1))}</span><strong class="num">${fmt(-md.prevCashOver)}</strong></div>
    <div class="li"><span class="grow">Assigned in ${monthLabel(m)}</span><strong class="num">${fmt(-md.assigned)}</strong></div>
    <div class="li"><span class="grow">Assigned in Future</span><strong class="num">${fmt(-md.future)}</strong></div>
    <div class="li"><strong class="grow">Ready to Assign</strong><strong class="num">${fmt(md.rta)}</strong></div></div>
    ${md.uncat ? `<div class="banner warn">${I.info}<span>${fmt(md.uncat)} of uncategorized transactions is counted here.</span></div>` : ''}
    <div class="grid2"><div class="kpi"><span>Assigned in ${esc(monthLabel(m))}</span><b class="num" style="font-size:20px">${fmt(md.assigned)}</b></div><div class="kpi"><span>Total Available</span><b class="num">${fmt(md.available)}</b></div></div>
    ${(() => { const ck = budgetCheck(m); return `<div class="sec-t"><span>Check against your accounts</span></div><div class="card">
      <div class="li"><span class="grow">Cash in budget accounts${m === curMonth() ? '' : ' (end of month)'}</span><strong class="num">${fmt(ck.cash)}</strong></div>
      <div class="li"><span class="grow muted">Ready to Assign</span><span class="num">${fmt(ck.rta)}</span></div>
      ${ck.future ? `<div class="li"><span class="grow muted">Assigned in later months</span><span class="num">${fmt(ck.future)}</span></div>` : ''}
      <div class="li"><span class="grow muted">Available in categories</span><span class="num">${fmt(ck.available)}</span></div>
      ${ck.creditOver ? `<div class="li"><span class="grow muted">Spent on credit, not covered yet</span><span class="num">${fmt(ck.creditOver)}</span></div>` : ''}
      <div class="li"><strong class="grow">${ck.gap ? 'Gap' : 'Matches your accounts'}</strong><strong class="num" style="color:${ck.gap ? 'var(--bad)' : 'inherit'}">${ck.gap ? fmt(ck.gap) : '✓'}</strong></div></div>
      <div class="small muted">Credit cards are left out: their balance is covered by the credit card payment categories.</div>`; })()}
    <div class="grid2"><div class="kpi"><span>Activity</span><b class="num">${fmt(md.activity)}</b></div><div class="kpi"><span>Income</span><b class="num">${fmt(md.income)}</b></div></div>
    <div class="field"><label for="mNote">Month note</label><textarea id="mNote" class="in" data-mnote="${m}" placeholder="Enter a note…">${esc(A.plan.notes?.[m] || '')}</textarea></div>
    <button class="btn pri block" data-a="assignSheet">${I.wand} Auto-Assign</button>`;
  openSheet('Ready to Assign — ' + monthLabel(m), body);
}

/* ---------- auto-assign ---------- */
function autoOptions(m, cats) {
  const prev = addMonths(m, -1);
  const opts = {
    under: { l: 'Underfunded', f: c => { const ti = targetInfo(c, m); return ti ? getAssigned(m, c.id) + ti.under : null; } },
    lastA: { l: 'Assigned Last Month', f: c => catM(prev, c.id).assigned },
    lastS: { l: 'Spent Last Month', f: c => Math.max(0, -catM(prev, c.id).activity) },
    avgA: { l: 'Average Assigned', f: c => { const n = Math.max(1, Math.min(12, monthDiff(calc().minM, m))); let s = 0; for (let i = 1; i <= n; i++) s += catM(addMonths(m, -i), c.id).assigned; return Math.round(s / n); } },
    avgS: { l: 'Average Spent', f: c => { const n = Math.max(1, Math.min(12, monthDiff(calc().minM, m))); let s = 0; for (let i = 1; i <= n; i++) s += Math.max(0, -catM(addMonths(m, -i), c.id).activity); return Math.round(s / n); } },
    reduceOver: { l: 'Reduce Overfunding', f: c => { const ti = targetInfo(c, m), x = catM(m, c.id); if (!ti || ti.snoozed || !(ti.total > 0) || x.available <= ti.total) return null; return Math.max(0, getAssigned(m, c.id) - (x.available - ti.total)); } },
    resetAv: { l: 'Reset Available Amounts', f: c => { const x = catM(m, c.id); return x.available > 0 ? getAssigned(m, c.id) - x.available : null; } },
    resetAs: { l: 'Reset Assigned Amounts', f: () => 0 },
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
  const body = `<div class="small muted">Applies to every visible category in ${monthLabel(m)}. You can undo right after.</div>
    <div class="card">${opts.map(o => `<button class="li" data-a="autoApply" data-k="${o.k}" ${o.changes.length ? '' : 'disabled'}><span class="grow"><strong>${o.l}</strong><div class="small muted">${o.changes.length} categor${o.changes.length > 1 ? 'ies' : 'y'}</div></span><strong class="num ${o.delta > 0 ? '' : 'amt-pos'}">${o.delta > 0 ? '' : '+'}${fmt(-o.delta)}</strong></button>`).join('')}</div>
    <div class="small muted">Amounts show the effect on Ready to Assign (currently ${fmt(monthData(m).rta)}).</div>`;
  openSheet('Auto-Assign', body);
}

/* ---------- move money / cover ---------- */
let MV = null;
function moveSheet(fromCid, toCid, amount, title) {
  if (!DESK() && fromCid && fromCid !== 'rta' && !toCid && !title) { const av = catM(A.month, fromCid).available; MV = { cid: fromCid, dir: av >= 0 ? 'from' : 'to', other: null, amount: amount || Math.abs(av), pick: false, q: '' }; return moveYnab(); }
  const m = A.month;
  const opts = sel => `<option value="rta" ${sel === 'rta' ? 'selected' : ''}>Ready to Assign (${fmt(monthData(m).rta)})</option>` + A.plan.groups.map(g => {
    const cs = A.plan.cats.filter(c => c.gid === g.id && !c.hidden); if (!cs.length) return '';
    return `<optgroup label="${esc(g.name)}">${cs.map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(catName(c.id))} · ${fmt(catM(m, c.id).available)}</option>`).join('')}</optgroup>`;
  }).join('');
  const body = `<input id="mvAmt" class="bigamt in-amt" inputmode="decimal" value="${amount ? fmtIn(amount) : ''}" placeholder="0,00" aria-label="Amount">
    <div class="field"><label for="mvFrom">From</label><select id="mvFrom" class="in">${opts(fromCid || 'rta')}</select></div>
    <div class="field"><label for="mvTo">To</label><select id="mvTo" class="in">${opts(toCid || 'rta')}</select></div>`;
  openSheet(title || 'Move Money', body, `<button class="btn pri block" data-a="moveDo">Move</button>`, { focus: '#mvAmt' });
}
// YNAB app "Move From / Move To": green header, amount pill, From/To switch, category picker
function moveYnab() {
  const m = A.month, c = L.cat[MV.cid], av = id => id === 'rta' ? monthData(m).rta : catM(m, id).available;
  const pillCls = v => v > 0 ? 'good' : v < 0 ? 'bad' : 'zero';
  const row = id => `<button class="li mvrow" data-a="mvPick" data-c="${id}"><span class="grow ellip">${id === 'rta' ? 'Ready to Assign' : esc(catName(id))}</span><span class="pill ${pillCls(av(id))}">${fmt(av(id))}</span></button>`;
  let picker = '';
  if (MV.pick) {
    const q = (MV.q || '').toLowerCase(), ok = id => id !== MV.cid && (!q || (id === 'rta' ? 'ready to assign' : catName(id).toLowerCase()).includes(q));
    const pins = (A.plan.pins || []).filter(id => L.cat[id] && !L.cat[id].hidden && ok(id));
    picker = `<div class="mvpick"><h3>${MV.dir === 'from' ? 'Move to' : 'Move from'}</h3><input class="in mvq" data-c="mvQ" placeholder="Search Categories" value="${esc(MV.q || '')}" autocomplete="off">
      ${pins.length ? `<div class="mvh">Pinned</div><div class="card">${pins.map(row).join('')}</div>` : ''}
      ${ok('rta') ? `<div class="mvh">Inflow</div><div class="card">${row('rta')}</div>` : ''}
      ${A.plan.groups.map(g => { const cs = A.plan.cats.filter(x => x.gid === g.id && !x.hidden && ok(x.id)); return cs.length ? `<div class="mvh">${esc(g.name)}</div><div class="card">${cs.map(x => row(x.id)).join('')}</div>` : ''; }).join('')}</div>`;
  }
  const other = MV.other;
  const body = `<div class="mvhead ${av(MV.cid) < 0 ? 'neg' : ''}"><div class="mvcat">${esc(catName(MV.cid))}</div>
      <input id="mvAmt" class="mvamt" inputmode="decimal" value="${MV.amount ? fmtIn(MV.amount) : ''}" placeholder="0,00" aria-label="Amount" data-c="mvAmt">
      <button class="mvsw ${MV.dir}" data-a="mvSwap" aria-label="Switch direction"><i>${MV.dir === 'from' ? '↓' : '↑'}</i></button><div class="mvdir">${MV.dir === 'from' ? 'To' : 'From'}</div></div>
    <button class="mvsel" data-a="mvOpenPick">${other ? `<span class="grow ellip">${other === 'rta' ? 'Ready to Assign' : esc(catName(other))}</span><span class="pill ${pillCls(av(other))}">${fmt(av(other))}</span>` : `${I.plus} Select Category`}</button>
    <input type="hidden" id="mvFrom" value="${MV.dir === 'from' ? MV.cid : (other || '')}"><input type="hidden" id="mvTo" value="${MV.dir === 'from' ? (other || '') : MV.cid}">
    ${picker}`;
  const t = MV.dir === 'from' ? 'Move From' : 'Move To';
  const open = $('#scrim .sheet'); if (open && open.dataset.mv) { $('#scrim .sheet-b').innerHTML = body; const h = $('#scrim .sheet-h h2'); if (h) h.textContent = t; const f = $('#scrim .sheet-f'); if (f) f.innerHTML = mvFoot(); }
  else { const sc = openSheet(t, body, mvFoot()); const sh = sc && $('.sheet', sc); if (sh) { sh.dataset.mv = '1'; sh.classList.add('mvsheet'); } }
  if (MV.pick) setTimeout(() => $('.mvq')?.focus({ preventScroll: true }), 30);
}
const mvFoot = () => `<button class="btn pri block" data-a="moveDo" ${MV && MV.other ? '' : 'disabled'}>Done</button>`;
function coverSheet(cid) {
  const m = A.month, need = -catM(m, cid).available;
  const best = A.plan.cats.filter(c => c.id !== cid && !c.hidden && !c.cc && catM(m, c.id).available >= need) // never the card payment money: it is set aside to pay the card.sort((a, b) => catM(m, b.id).available - catM(m, a.id).available)[0];
  moveSheet(monthData(m).rta >= need ? 'rta' : (best?.id || 'rta'), cid, need, 'Cover Overspending');
}
function movesSheet() {
  const m = A.month; const list = A.plan.moves.filter(x => x.m === m).sort((a, b) => b.at - a.at);
  const nm = id => id === 'rta' ? 'Ready to Assign' : catName(id) || 'Deleted category';
  const body = list.length ? `<div class="card">${list.map(x => `<div class="li"><span class="ic">${I.swap}</span><span class="grow"><strong class="ellip" style="display:block">${esc(nm(x.from))} → ${esc(nm(x.to))}</strong><span class="small muted">${new Date(x.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${x.why ? ' · ' + esc(x.why) : ''}</span></span><strong class="num">${fmt(x.amount)}</strong></div>`).join('')}</div>`
    : `<div class="empty"><strong>No moves in ${monthLabel(m)}</strong><span>Money you move between categories shows up here.</span></div>`;
  openSheet('Recent Moves — ' + monthLabel(m), body, `<button class="btn block" data-a="moveSheet">${I.swap} Move Money</button>`);
}

/* ---------- transaction editor ---------- */
let D = null;
function txSheet(id, preset = {}) {
  if (id) {
    const t = A.tx.find(x => x.id === id); if (!t) return;
    D = { img: t.img || null, id: t.id, acct: t.acct, date: t.date, payee: L.payee[t.payee]?.name || '', cat: t.cat || '', memo: t.memo || '', amount: Math.abs(t.amount), kind: t.transferAcct ? 'transfer' : t.amount > 0 ? 'in' : 'out', cleared: t.cleared, flag: t.flag, transferAcct: t.transferAcct || '', approved: t.approved !== false, splits: t.splits ? t.splits.map(s => ({ ...s, amount: Math.abs(s.amount), sign: Math.sign(s.amount) || -1 })) : null, freq: 'never' };
    if (t.transferAcct && t.amount > 0) { // show transfer from the outgoing side
      const pair = A.tx.find(x => x.id === t.transferId);
      if (pair) { D.id = pair.id; D.acct = pair.acct; D.transferAcct = pair.transferAcct; D.cat = pair.cat || t.cat || ''; D.pairCat = t.cat || ''; }
    }
  } else {
    const last = A.ui.lastAcct && L.acct[A.ui.lastAcct] && !L.acct[A.ui.lastAcct].closed ? A.ui.lastAcct : A.plan.accounts.find(a => !a.closed && onBudget(a))?.id || A.plan.accounts.find(a => !a.closed)?.id;
    D = { acct: (A.acct && A.acct !== 'all') ? A.acct : last, date: todayISO(), payee: '', cat: '', memo: '', amount: 0, kind: 'out', cleared: 'u', flag: null, transferAcct: '', approved: true, splits: null, freq: 'never', ...preset };
  }
  openSheet(id ? 'Edit Transaction' : 'Add Transaction', txBody(), txFoot(), { focus: id ? null : '#txAmt' });
}
function txBody() {
  const a = L.acct[D.acct];
  const tb = D.transferAcct ? L.acct[D.transferAcct] : null;
  const needCat = D.kind === 'transfer' ? (onBudget(a) && tb && !onBudget(tb)) : onBudget(a);
  const payees = A.plan.payees.slice().sort((x, y) => x.name.localeCompare(y.name)).map(y => `<option value="${esc(y.name)}"></option>`).join('');
  let splitHtml = '';
  if (D.splits) {
    const sum = D.splits.reduce((s, x) => s + x.amount, 0);
    splitHtml = `<div class="sec-t" style="padding-top:0"><span>Split</span><span class="num" id="spStatus" style="color:${sum === D.amount ? 'var(--good)' : 'var(--warn)'}">${sum === D.amount ? 'Balanced' : 'Remaining ' + fmt(D.amount - sum)}</span></div>
      ${D.splits.map((s, i) => `<div class="split"><select class="in" data-sp="cat" data-i="${i}" aria-label="Category ${i + 1}">${catOptions(s.cat, { m: monthOf(D.date) })}</select>
        <input class="in num" inputmode="decimal" data-sp="amount" data-i="${i}" value="${s.amount ? fmtIn(s.amount) : ''}" placeholder="0,00" aria-label="Amount ${i + 1}">
        <button class="ibtn" data-a="spDel" data-i="${i}" aria-label="Remove">${I.close}</button>
        <input class="in" style="grid-column:1/-1; height:40px; font-size:14px" data-sp="memo" data-i="${i}" value="${esc(s.memo || '')}" placeholder="Memo (optional)" aria-label="Memo ${i + 1}"></div>`).join('')}
      <div class="row"><button class="btn sm" data-a="spAdd">${I.plus} Add split</button>${sum !== D.amount ? `<button class="btn sm" data-a="spFill">Put remainder on last line</button>` : ''}<button class="btn sm ghost" data-a="spOff">Remove split</button></div>`;
  }
  const lastSp = (() => { try { const t = D.id && A.tx.find(x => x.id === D.id); if (!t || t.transferAcct || (t.splits && t.splits.length) || txLegs(t).length > 1 || (t.cat && t.approved !== false)) return null; return lastSplitLike(t); } catch (e) { return null; } })();
  const row = (icn, label, ctrl, extra = '') => `<div class="yrow ${extra}"><span class="yic">${icn}</span><div class="ylab"><small>${label}</small>${ctrl}</div></div>`;
  const cal = () => { // inline calendar like YNAB's sheet
    const cm = D.calM || monthOf(D.date || todayISO()), [y, mo] = cm.split('-').map(Number), first = new Date(y, mo - 1, 1), off = (first.getDay() + 6) % 7, n = new Date(y, mo, 0).getDate();
    let g = ''; for (let k = 0; k < off; k++) g += '<span></span>';
    for (let d = 1; d <= n; d++) { const iso = cm + '-' + pad(d); g += `<button class="${iso === D.date ? 'on' : ''} ${iso === todayISO() ? 'today' : ''}" data-a="txCalDay" data-v="${iso}">${d}</button>`; }
    return `<div class="ycal"><div class="row"><strong class="grow">${esc(cap(MONTHS[mo - 1]))} ${y}</strong><button class="ibtn" data-a="txCalNav" data-d="-1" aria-label="Previous month">${I.left}</button><button class="ibtn" data-a="txCalNav" data-d="1" aria-label="Next month">${I.right}</button></div>
      <div class="ycal-g">${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(x => `<i>${x}</i>`).join('')}${g}</div></div>`;
  };
  return `<div class="ytx">` + (lastSp ? `<button class="btn block sp-last" data-a="splitLastFor" data-id="${D.id}">↺ Same as last time: ${lastSp.map(l => esc(legLabel(l)) + ' ' + fmt(Math.abs(l.amount))).join(' + ')}</button>` : '') + `
    <input id="txAmt" class="bigamt ybig ${D.kind === 'in' ? 'in' : 'out'}" inputmode="decimal" value="${D.amount ? fmtIn(D.amount) : ''}" placeholder="0,00" data-d="amount" aria-label="Amount">
    <div class="ykind"><select class="ykind-s" data-c="kindSel" aria-label="Type">${[['out', 'Spending'], ['in', 'Income'], ['transfer', 'Transfer']].map(([k, l]) => `<option value="${k}" ${D.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    ${D.approved === false ? `<div class="banner info">${I.info}<span>Imported transaction: check the category, then approve.</span></div>` : ''}
    <div class="ycard">
      ${D.kind === 'transfer' ? row(I.swap, 'To account', `<select id="txTo" class="yin" data-d="transferAcct"><option value="">Choose…</option>${acctOptions(D.transferAcct, x => x.id !== D.acct)}</select>`)
        : row(I.people, 'Payee', `<input id="txPayee" class="yin" list="payeeList" value="${esc(D.payee)}" data-d="payee" placeholder="Choose a payee" autocomplete="off"><datalist id="payeeList">${payees}</datalist>`)}
      ${needCat && !D.splits ? row(I.plan, 'Category', `<div class="row"><select id="txCat" class="yin grow" data-d="cat">${catOptions(D.cat, { m: monthOf(D.date || todayISO()), rta: D.kind !== 'transfer' })}</select>${D.kind !== 'transfer' ? `<button class="ibtn" data-a="spOn" aria-label="Split" title="Split">${I.split}</button>` : ''}</div>`) : ''}
      ${row(I.accts, D.kind === 'transfer' ? 'From account' : 'Account', `<select id="txAcct" class="yin" data-d="acct">${acctOptions(D.acct)}</select>`)}
      ${row(I.cal, 'Date', `<button class="yin ydate" data-a="txCalToggle">${esc(new Date(D.date + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^(\d+) (\w+)/, '$2 $1,'))}</button><input id="txDate" type="hidden" value="${D.date}" data-d="date">`, D.calOpen ? 'open' : '')}
      ${D.calOpen ? cal() : ''}
    </div>
    ${D.kind === 'transfer' && tb && onBudget(a) && onBudget(tb) ? `<div class="small muted">Transfer between budget accounts: no category needed.${isCredit(tb) ? ' This payment comes out of the card payment category.' : ''}</div>` : ''}
    ${splitHtml}
    <div class="ycard">
      ${row('📷', 'Photo', D.img ? `<div class="row" style="gap:8px; align-items:center"><img src="${D.img}" alt="Receipt" style="max-height:90px; border-radius:8px; border:1px solid var(--line)"><button class="btn sm" data-a="imgRemove">Remove</button></div>` : `<label class="yin" style="cursor:pointer">Add a photo<input type="file" accept="image/*" data-c="imgPick" hidden></label>`)}
      ${row(I.note, 'Memo', `<input id="txMemo" class="yin" value="${esc(D.memo)}" data-d="memo" placeholder="Add a memo">`)}
    </div>
    <div class="ycard">
      ${row(I.flag, 'Flag', `<div class="flags"><button class="${!D.flag ? 'on' : ''}" style="background:var(--surface-2)" data-a="dFlag" data-v="" aria-label="No flag"></button>${flagList().map(([k, l]) => `<button class="${D.flag === k ? 'on' : ''}" style="background:var(--flag-${k})" data-a="dFlag" data-v="${k}" aria-label="${l}"></button>`).join('')}</div>`)}
      ${row(D.cleared === 'r' ? I.lock || '🔒' : 'Ⓒ', D.cleared === 'r' ? 'Reconciled' : 'Cleared', `<span class="small muted">${D.cleared === 'r' ? 'Locked: matched your bank at reconciliation' : 'Shows on your bank statement'}</span>`, 'ysw') .replace('</div></div>', `</div><input type="checkbox" class="tgl" id="txClr" data-d="cleared" ${D.cleared !== 'u' ? 'checked' : ''} ${D.cleared === 'r' ? 'disabled' : ''} aria-label="Cleared"></div>`)}
      ${row(I.repeat, 'Repeat', `<select id="txFreq" class="yin" data-d="freq" ${D.id ? 'disabled' : ''}>${Object.entries(FREQ).map(([k, l]) => `<option value="${k}" ${D.freq === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
    </div>
    ${D.id ? `<button class="btn danger block ydel" data-a="txDelete">Delete Transaction</button>` : ''}</div>`;
}
function updSplitStatus() { const el = $('#spStatus'); if (!el || !D?.splits) return; const sum = D.splits.reduce((s, x) => s + x.amount, 0); el.textContent = sum === D.amount ? 'Balanced' : 'Remaining ' + fmt(D.amount - sum); el.style.color = sum === D.amount ? 'var(--good)' : 'var(--warn)'; }
function txFoot() { return `${D.id ? `<button class="btn danger" data-a="txDelete" aria-label="Delete transaction" title="Delete transaction" style="flex:0 0 auto">${I.trash}</button>` : ''}<button class="btn pri block" data-a="txSave">${D.approved === false ? 'Approve' : D.id ? 'Save' : 'Save'}</button>${!D.id ? `<button class="btn" data-a="txSaveNew" aria-label="Save and add another">Save & Add Another</button>` : ''}`; }
function txRefresh() { const y = $('#scrim .sheet-b')?.scrollTop; refreshSheetBody(txBody()); const f = $('#scrim .sheet-f'); if (f) f.innerHTML = txFoot(); if (y != null) $('#scrim .sheet-b').scrollTop = y; }
function txCommit(again) {
  const amtEl = $('#txAmt'); if (amtEl) { const v = evalExpr(amtEl.value); D.amount = v == null ? 0 : Math.abs(v); }
  if (!D.acct) { toast('Choose an account'); return; }
  if (!D.amount) { toast('Enter an amount'); $('#txAmt')?.focus(); return; }
  if (D.kind === 'transfer' && !D.transferAcct) { toast('Choose the destination account'); return; }
  if (D.splits) { const s = D.splits.reduce((x, y) => x + y.amount, 0); if (s !== D.amount) { toast('Splits must add up to the total (remaining ' + fmt(D.amount - s) + ')'); return; } }
  const sign = D.kind === 'in' ? 1 : -1;
  const draft = { ...D, amount: sign * D.amount, cat: D.cat || null, cleared: D.cleared, transferAcct: D.kind === 'transfer' ? D.transferAcct : null, approved: true,
    splits: D.splits ? D.splits.map(s => ({ cat: s.cat || null, amount: sign * s.amount, memo: s.memo })) : null };
  if (D.kind !== 'transfer' && !draft.cat && !draft.splits && D.payee) { const y = L.payeeByName[D.payee.trim().toLowerCase()]; if (y?.lastCat && L.cat[y.lastCat]) draft.cat = y.lastCat; }
  const freq = D.freq; const isFuture = D.date > todayISO();
  mutate(D.id ? 'Transaction saved' : (freq !== 'never' || isFuture) ? 'Transaction scheduled' : 'Transaction added', () => {
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
  const groups = { budget: 'Budget Accounts', loan: 'Loans', tracking: 'Tracking Accounts' };
  const grouped = Object.entries(groups).map(([g, l]) => `<optgroup label="${l}">${Object.entries(ACCT).filter(([, v]) => v.grp === g).map(([k, v]) => `<option value="${k}" ${(a?.type || 'checking') === k ? 'selected' : ''}>${v.label}</option>`).join('')}</optgroup>`).join('');
  const debt = a ? isDebt(a) : false;
  const body = `<div class="field"><label for="aName">Account nickname</label><input id="aName" class="in" value="${esc(a?.name || '')}" placeholder="e.g. SG Checking"></div>
    <div class="field"><label for="aType">Account type</label><select id="aType" class="in" ${a ? 'disabled' : ''} data-c="aTypeChange">${grouped}</select></div>
    ${!a ? `<div class="grid2"><div class="field"><label for="aBal">Current balance</label><input id="aBal" class="in" inputmode="decimal" placeholder="0,00"></div><div class="field"><label for="aDate">As of</label><input id="aDate" class="in" type="date" value="${todayISO()}"></div></div>
      <div class="small muted" id="aHint">For a card or a loan, enter the amount owed (it is recorded as negative).</div>` : ''}
    <div id="loanBox" ${(!a && true) || debt ? '' : 'hidden'}><div class="grid2"><div class="field"><label for="aRate">Interest rate (%)</label><input id="aRate" class="in" inputmode="decimal" value="${a?.rate ? String(a.rate).replace('.', ',') : ''}" placeholder="e.g. 1,2"></div>
      <div class="field"><label for="aMin">Minimum payment</label><input id="aMin" class="in" inputmode="decimal" value="${a?.minPay ? fmtIn(a.minPay) : ''}" placeholder="0,00"></div></div></div>
    <div class="field"><label for="aNote">Account notes</label><textarea id="aNote" class="in" rows="2" placeholder="Optional">${esc(a?.note || '')}</textarea></div>
    ${a && ['checking', 'savings', 'cash'].includes(a.type) ? `<div class="field"><label for="aOver">Authorized overdraft</label><input id="aOver" class="in" inputmode="decimal" value="${a.overdraft ? fmtIn(a.overdraft) : ''}" placeholder="0,00"><div class="small muted">How far below zero your bank lets this account go (e.g. 500). Used to warn you before a card debit.</div></div>` : ''}
    ${a ? `<div class="field"><label for="aWork">Working balance</label><input id="aWork" class="in" inputmode="decimal" value="${fmtIn(balances()[a.id].working)}"><div class="small muted">An adjustment transaction is created automatically if you change this amount.</div></div>` : ''}
    ${a ? (() => { const lk = (A.plan.bank?.conns || []).flatMap(c => c.accounts.map(x => ({ c, x }))).find(o => o.x.acct === a.id); if (!lk) return ''; const mins = lk.x.lastSync ? Math.round((Date.now() - lk.x.lastSync) / 60000) : null; const ago = mins == null ? 'never' : mins < 60 ? mins + ' min ago' : mins < 1440 ? Math.round(mins / 60) + ' hours ago' : Math.round(mins / 1440) + ' days ago';
      return `<div class="field"><span class="lbl2">Bank Connection</span><div class="small">Linked with ${esc(lk.x.name)}${lk.x.iban ? ' (' + esc(lk.x.iban.slice(-4)) + ')' : ''} at ${esc(lk.c.bank)}.</div><div class="small muted">Last updated ${ago}.</div>
        <button class="btn sm" style="margin-top:6px; align-self:flex-start" data-a="acctUnlink" data-id="${a.id}">Unlink Account</button></div>`; })() : ''}
    ${a ? `<div class="row"><button class="btn grow" data-a="acctClose" data-id="${a.id}">${a.closed ? 'Reopen Account' : 'Close Account'}</button><button class="btn danger grow" data-a="acctDelete" data-id="${a.id}">${I.trash} Delete</button></div>` : ''}`;
  openSheet(a ? 'Edit Account' : 'Add Account', body, `<button class="btn pri block" data-a="acctSave" data-id="${id || ''}">${a ? 'Save' : 'Add Account'}</button>`, { focus: a ? null : '#aName' });
  if (!a) { const sel = $('#aType'); const upd = () => { $('#loanBox').hidden = !ACCT[sel.value].debt && !ACCT[sel.value].credit; }; sel.addEventListener('change', upd); upd(); }
}

/* ---------- reconcile ---------- */
function reconcileSheet(id, step = 1) {
  const a = L.acct[id], bal = balances()[id];
  let body;
  if (step === 1) body = `<p style="margin:0">The <strong>cleared</strong> balance of ${esc(a.name)} is</p><div class="bigamt num">${fmt(bal.cleared)}</div><p class="muted small" style="margin:0">Is this your current balance at the bank (excluding pending transactions)?</p>
    <div class="grid2"><button class="btn pri" data-a="recYes" data-id="${id}">Yes</button><button class="btn" data-a="recNo" data-id="${id}">No</button></div>`;
  else body = `<div class="field"><label for="recBal">Your bank's cleared balance</label><input id="recBal" class="in" inputmode="decimal" placeholder="0,00"></div>
    <div class="small muted">Clear any missing transactions first. If a difference remains, a reconciliation adjustment is created.</div>
    <button class="btn pri block" data-a="recAdjust" data-id="${id}">Create Adjustment & Finish</button>`;
  openSheet('Reconcile Account', body, '', { focus: step === 2 ? '#recBal' : null });
}

/* ---------- loan planner ---------- */
function loanSheet(id, extra = 0) {
  const a = L.acct[id], bal = -(balances()[id].working); const r = (a.rate || 0) / 100 / 12; const P = a.minPay || 0;
  const sim = pay => { let b = bal, n = 0, int = 0; if (pay <= 0) return null; while (b > 0 && n < 1200) { const i = Math.round(b * r); int += i; b = b + i - pay; n++; if (pay <= i) return null; } return { n, int }; };
  const base = sim(P), withX = sim(P + extra);
  const when = n => { const d = new Date(); d.setMonth(d.getMonth() + n); return cap(MONTHS[d.getMonth()]) + ' ' + d.getFullYear(); };
  const body = `<div class="kpis" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="kpi"><span>Balance</span><b class="num">${fmt(bal)}</b></div><div class="kpi"><span>Rate · payment</span><b class="num" style="font-size:16px">${(a.rate || 0).toLocaleString('fr-FR')} % · ${fmt(P)}</b></div></div>
    ${!P ? `<div class="banner warn">${I.info}<span>Add the interest rate and minimum payment in the account settings.</span><button class="btn sm" data-a="acctEdit" data-id="${id}">Edit</button></div>` : ''}
    <div class="field"><label for="lxRange">Extra monthly payment: <strong id="lxVal">${fmt(extra)}</strong></label><input id="lxRange" type="range" min="0" max="${Math.max(50000, Math.round(P * 2))}" step="1000" value="${extra}" data-c="loanX" data-id="${id}" style="width:100%; accent-color:var(--accent)"></div>
    <div class="card"><div class="li"><span class="grow">Current payoff date</span><strong>${base ? when(base.n) : '—'}</strong></div>
      <div class="li"><span class="grow">Remaining interest</span><strong class="num">${base ? fmt(base.int) : '—'}</strong></div>
      <div class="li"><span class="grow">With ${fmt(extra)} extra</span><strong>${withX ? when(withX.n) : '—'}</strong></div>
      <div class="li"><span class="grow">You save</span><strong class="amt-pos">${base && withX ? (base.n - withX.n) + ' months · ' + fmt(base.int - withX.int) : '—'}</strong></div></div>
    ${!base && P ? `<div class="banner bad">${I.info}<span>The payment does not cover the interest.</span></div>` : ''}
    <button class="btn pri block" data-a="loanTarget" data-id="${id}" data-x="${extra}">${I.target} Create debt payment category (${fmt(P + extra)} / month)</button>
    <button class="btn block" data-a="loanInterest" data-id="${id}">Add this month's interest (${fmt(Math.round(bal * r))})</button>`;
  if ($('#scrim') && $('#lxRange')) { refreshSheetBody(body); return; }
  openSheet('Loan Planner — ' + a.name, body);
}

/* ---------- credit card payment ---------- */
function ccPaySheet(cardId) {
  const card = L.acct[cardId]; const c = L.ccCat[cardId]; const avail = c ? catM(A.month, c.id).available : 0;
  const from = A.plan.accounts.find(x => onBudget(x) && !isCredit(x) && !x.closed);
  txSheet(null, { kind: 'transfer', acct: from?.id, transferAcct: cardId, amount: Math.max(0, Math.min(avail, -(balances()[cardId].working))) || Math.max(0, -(balances()[cardId].working)), memo: 'Payment ' + card.name });
}

/* ---------- scheduled ---------- */
function schSheet(id) {
  const s = A.plan.scheduled.find(x => x.id === id); if (!s) return;
  const body = `<div class="field"><label for="sAmt">Amount (negative = outflow)</label><input id="sAmt" class="in" inputmode="decimal" value="${(s.amount / 100).toFixed(2).replace('.', ',')}"></div>
    ${!s.transferAcct ? `<div class="field"><label for="sPayee">Payee</label><input id="sPayee" class="in" value="${esc(s.payee || '')}"></div>
    <div class="field"><label for="sCat">Category</label><select id="sCat" class="in">${catOptions(s.cat)}</select></div>` : `<div class="small muted">Transfer to ${esc(L.acct[s.transferAcct]?.name || '')}</div>`}
    <div class="field"><label for="sAcct">Account</label><select id="sAcct" class="in">${acctOptions(s.acct)}</select></div>
    <div class="grid2"><div class="field"><label for="sNext">Next date</label><input id="sNext" type="date" class="in" value="${s.next}"></div>
    <div class="field"><label for="sFreq">Frequency</label><select id="sFreq" class="in">${Object.entries(FREQ).map(([k, l]) => `<option value="${k}" ${s.freq === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="field"><label for="sMemo">Memo</label><input id="sMemo" class="in" value="${esc(s.memo || '')}"></div>
    <div class="row"><button class="btn grow" data-a="schSkip" data-id="${id}">Skip Next</button><button class="btn danger grow" data-a="schDel" data-id="${id}">${I.trash} Delete</button></div>`;
  openSheet('Scheduled Transaction', body, `<button class="btn pri block" data-a="schSave" data-id="${id}">Save</button>`);
}
function schListSheet() {
  const list = A.plan.scheduled.slice().sort((a, b) => a.next < b.next ? -1 : 1);
  const body = list.length ? `<div class="card">${list.map(s => `<button class="li" data-a="schEdit" data-id="${s.id}"><span class="ic">${I.repeat}</span><span class="grow"><strong class="ellip" style="display:block">${esc(s.transferAcct ? trLabel(s.transferAcct, s.acct) : s.payee || 'No payee')}</strong><span class="small muted">${fmtDate(s.next)} · ${FREQ[s.freq]} · ${esc(L.acct[s.acct]?.name || '')}</span></span><strong class="num ${s.amount > 0 ? 'amt-pos' : ''}">${fmt(s.amount)}</strong></button>`).join('')}</div>`
    : `<div class="empty"><strong>No scheduled transactions</strong><span>When adding a transaction, pick Repeat or a future date.</span></div>`;
  openSheet('Scheduled Transactions', body, `<button class="btn block" data-a="newTx">${I.plus} Add Transaction</button>`);
}

/* ---------- payees & rules ---------- */
function payeesSheet() {
  const cnt = {}; for (const t of A.tx) if (t.payee) cnt[t.payee] = (cnt[t.payee] || 0) + 1;
  const list = A.plan.payees.slice().sort((a, b) => a.name.localeCompare(b.name));
  const body = `<div class="small muted">Rename a payee to another payee's name to combine them. The default category is suggested when you add or import transactions.</div>
    <input class="in" type="search" placeholder="Search payees…" aria-label="Search payees" oninput="const q=this.value.toLowerCase(); this.nextElementSibling.querySelectorAll('.li').forEach(r => { const i = r.querySelector('input'); r.style.display = !q || (i && i.value.toLowerCase().includes(q)) ? '' : 'none'; })">
    <div class="card">${list.map(y => `<div class="li" style="flex-wrap:wrap"><div class="grow" style="min-width:150px"><input class="in" value="${esc(y.name)}" data-py="name" data-id="${y.id}" aria-label="Payee name" style="height:40px"></div>
      <select class="in" style="height:40px; width:auto; max-width:46%" data-py="lastCat" data-id="${y.id}" aria-label="Default category">${catOptions(y.lastCat, { noneLabel: 'No default category', amounts: false })}</select>
      <span class="small muted" style="width:56px; text-align:right">${cnt[y.id] || 0} txns</span>
      ${!cnt[y.id] ? `<button class="ibtn" data-a="pyDel" data-id="${y.id}" aria-label="Delete">${I.trash}</button>` : ''}</div>`).join('') || '<div class="li muted">No payees</div>'}</div>
    <div class="sec-t"><span>Rename rules (imports)</span></div>
    <div class="card">${A.plan.rules.map((r, i) => `<div class="li"><span class="grow small">If the bank name contains <strong>${esc(r.contains)}</strong> → <strong>${esc(r.payee)}</strong></span><button class="ibtn" data-a="ruleDel" data-i="${i}" aria-label="Delete rule">${I.trash}</button></div>`).join('') || '<div class="li muted small">No rules</div>'}</div>
    <div class="grid2"><input id="ruleC" class="in" placeholder="Bank name contains… (e.g. CB LIDL)"><input id="ruleP" class="in" placeholder="Rename to… (e.g. Lidl)"></div>
    <button class="btn block" data-a="ruleAdd">${I.plus} Add Rule</button>`;
  openSheet('Manage Payees', body);
}

/* ---------- groups / categories ---------- */
function groupSheet(gid) {
  const g = gid ? L.group[gid] : null;
  const body = `<div class="field"><label for="gName">Category group name</label><input id="gName" class="in" value="${esc(g?.name || '')}" placeholder="e.g. Car"></div>
    ${g ? `<div class="row"><button class="btn grow" data-a="gHide" data-g="${g.id}">${g.hidden ? 'Unhide' : 'Hide'} Group</button><button class="btn danger grow" data-a="gDelete" data-g="${g.id}">${I.trash} Delete</button></div>` : ''}`;
  openSheet(g ? 'Edit Category Group' : 'New Category Group', body, `<button class="btn pri block" data-a="gSave" data-g="${gid || ''}">Save</button>`, { focus: '#gName' });
}
function catNewSheet(gid) {
  const body = `<div class="field"><label for="ncName">Category name</label><input id="ncName" class="in" placeholder="e.g. Gas"></div>`;
  openSheet('New Category', body, `<button class="btn pri block" data-a="catCreate" data-g="${gid}">Add</button>`, { focus: '#ncName' });
}
function catDeleteSheet(cid) {
  const c = L.cat[cid]; const used = A.tx.some(t => txLines(t).some(l => l.cat === cid)) || Object.values(A.plan.assigned).some(o => o[cid]);
  const body = used ? `<p style="margin:0">“${esc(c.name)}” has transactions or assigned money. Choose a category to move them to.</p>
    <div class="field"><label for="repCat">Move to</label><select id="repCat" class="in">${catOptions(null, { rta: false, none: false }).replace(`value="${cid}"`, `value="${cid}" disabled`)}</select></div>`
    : `<p style="margin:0">Delete “${esc(c.name)}”? You can undo right after.</p>`;
  openSheet('Delete Category', body, `<button class="btn danger block" data-a="catDeleteDo" data-c="${cid}">Delete</button>`);
}
