/* ================= Budget — menus: right-click on transactions, plan menu, quick category rename ================= */
let POP_TRIGGER = null, POP_SWALLOW = false;
function closePop() { $$('.pmenu').forEach(e => e.remove()); POP_TRIGGER = null; }
function popMenu(x, y, html, cls = '') {
  closePop();
  const d = document.createElement('div'); d.className = 'pmenu ' + cls; d.setAttribute('role', 'menu'); d.innerHTML = html;
  document.body.appendChild(d);
  const r = d.getBoundingClientRect();
  d.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
  d.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
  d.querySelector('input')?.focus(); d.querySelector('input')?.select?.();
  POP_TRIGGER = popMenu._trigger || null; popMenu._trigger = null;
  return d;
}
const mi = (icon, label, act, data = '', kbd = '', off = false, danger = false) =>
  `<button class="pm-i ${danger ? 'danger' : ''}" role="menuitem" data-a="${act}" ${data} ${off ? 'disabled' : ''}><span class="pm-ic">${icon || ''}</span><span class="grow">${label}</span>${kbd ? `<kbd>${kbd}</kbd>` : ''}</button>`;
const msep = '<div class="pm-sep"></div>';
// clicking the button that opened a menu closes it (instead of reopening it), like YNAB
document.addEventListener('mousedown', e => { if (e.target.closest('.pmenu')) return; const trig = POP_TRIGGER; if ($('.pmenu') && trig && trig.contains(e.target)) POP_SWALLOW = true; closePop(); }, true);
document.addEventListener('click', e => { if (POP_SWALLOW) { POP_SWALLOW = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
// remember which element opened the menu
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el && !el.closest('.pmenu')) popMenu._trigger = el; }, true);
document.addEventListener('click', e => { if (e.target.closest('.pmenu [data-a]:not([data-keep])')) setTimeout(closePop, 0); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePop(); });
window.addEventListener('resize', closePop);
document.addEventListener('scroll', e => { if (!e.target.closest?.('.pmenu')) closePop(); }, true);

/* ---------- right-click on a transaction (or on a selection) ---------- */
function ctxTargets() { return A.tx.filter(t => A.ui.selected.has(t.id)); }
document.addEventListener('contextmenu', e => {
  const row = e.target.closest('[data-tid]'); if (!row) return;
  e.preventDefault(); ctxOpen(row, e.clientX, e.clientY, false);
});
// long-press on a transaction (phone), like YNAB's iOS app
(() => {
  let tm = null, x0 = 0, y0 = 0, fired = false;
  const cancel = () => { clearTimeout(tm); tm = null; $$('.tx.lp').forEach(r => r.classList.remove('lp')); };
  document.addEventListener('touchstart', e => {
    const row = e.target.closest('[data-tid]'); if (!row || e.touches.length > 1) return;
    fired = false; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; row.classList.add('lp');
    tm = setTimeout(() => { tm = null; fired = true; row.classList.remove('lp'); try { navigator.vibrate?.(10); } catch (_) { } ctxOpen(row, x0, y0, true); }, 480);
  }, { passive: true });
  document.addEventListener('touchmove', e => { if (tm && Math.hypot(e.touches[0].clientX - x0, e.touches[0].clientY - y0) > 8) cancel(); }, { passive: true });
  document.addEventListener('touchend', e => { if (tm) cancel(); else if (fired) { e.preventDefault(); fired = false; } }, { passive: false });
  document.addEventListener('touchcancel', cancel);
  document.addEventListener('click', e => { if (fired) { e.preventDefault(); e.stopPropagation(); fired = false; } }, true);
})();
function ctxOpen(row, x, y, touch) {
  const id = row.dataset.tid; if (!A.ui.selected.has(id) || touch && !selOn()) A.ui.selected = new Set([id]);
  const ts = ctxTargets(), n = ts.length; if (!n) return;
  const unappr = ts.some(t => t.approved === false), uncl = ts.some(t => t.cleared === 'u'), cl = ts.some(t => t.cleared === 'c');
  const s = n > 1 ? n + ' Transactions' : '1 Transaction';
  if (touch) { // the short menu of YNAB's iOS app
    popMenu(x, y,
      (unappr ? mi(I.check, 'Approve', 'bulk', 'data-k="approve"') : '') +
      mi(I.accts, 'Move', 'ctxMove', '', '', ts.flatMap(txLegs).some(t => t.transferAcct)) +
      (uncl ? mi('Ⓒ', 'Clear', 'ctxClear', 'data-v="c"') : mi('Ⓒ', 'Unclear', 'ctxClear', 'data-v="u"', '', !cl)) +
      mi(I.flag, 'Flag', 'bulk', 'data-k="flag"') +
      mi('⇄', 'Match', 'ctxMatch', '', '', n !== 2) +
      mi(I.file, 'Duplicate', 'ctxDup') +
      mi('⑂', 'Split', 'ctxSplit', '', '', n !== 1) +
      msep + mi(I.trash, 'Delete', 'bulk', 'data-k="del"', '', false, true), 'touch');
    return;
  }
  popMenu(x, y,
    mi(I.check, 'Approve', 'bulk', 'data-k="approve"', 'A', !unappr) +
    msep +
    mi('Ⓒ', 'Mark as Cleared', 'ctxClear', 'data-v="c"', 'C', !uncl) +
    mi('Ⓒ', 'Mark as Uncleared', 'ctxClear', 'data-v="u"', 'C', !cl) +
    msep +
    mi(I.file, 'Duplicate', 'ctxDup', '', 'shift D', false) +
    mi(I.repeat, 'Make Repeating', 'ctxRepeat', '', 'shift T', n !== 1) +
    mi('⇄', 'Match', 'ctxMatch', '', 'M', n !== 2) +
    mi('⇆', 'Unmatch', 'ctxUnmatch', '', 'shift U', !(n === 1 && ts[0].matched)) +
    mi('⑂', 'Split', 'ctxSplit', '', 'S', n !== 1) +
    msep +
    mi(I.flag, 'Flag', 'bulk', 'data-k="flag"') +
    mi(I.note, 'Memo…', 'ctxMemo') +
    mi('▤', 'Categorize', 'bulk', 'data-k="cat"', '', ts.every(t => t.transferAcct)) +
    mi(I.cal, 'Change Date', 'bulk', 'data-k="date"') +
    mi(I.accts, 'Move to Account', 'ctxMove', '', '', ts.some(t => t.transferAcct)) +
    msep +
    mi(I.download, 'Export ' + s, 'ctxExport') +
    msep +
    mi(I.trash, 'Delete', 'bulk', 'data-k="del"', 'delete', false, true));
}
// keyboard shortcuts on the right-clicked / selected transactions, like YNAB
document.addEventListener('keydown', e => {
  if (!$('.pmenu') || e.target.matches?.('input, textarea, select')) return;
  const k = e.key.toLowerCase(), go = (a, extra = {}) => { e.preventDefault(); const b = document.createElement('button'); b.dataset.a = a; Object.assign(b.dataset, extra); ACT[a](b, e); closePop(); };
  if (k === 'a') go('bulk', { k: 'approve' }); else if (k === 'c') go('ctxClear', { v: ctxTargets().some(t => t.cleared === 'u') ? 'c' : 'u' }); else if (k === 'delete' || k === 'backspace') go('bulk', { k: 'del' });
});

Object.assign(ACT, {
  ctxClear: el => { const ts = ctxTargets(), v = el.dataset.v; mutate(v === 'c' ? 'Marked as cleared' : 'Marked as uncleared', () => [...new Set(ts.flatMap(txLegs))].forEach(t => { if (t.cleared !== 'r') t.cleared = v; })); },
  ctxDup: () => {
    const ts = ctxTargets(), grps = {};
    mutate(ts.length > 1 ? ts.length + ' transactions duplicated' : 'Transaction duplicated', () => [...new Set(ts.flatMap(txLegs))].forEach(t => {
      const g = t.grp ? (grps[t.grp] ||= uid()) : undefined; // a split is copied whole, as a new split
      if (t.transferAcct) { const had = new Set(A.tx.map(x => x.id)); saveTx({ acct: t.acct, date: t.date, payee: '', cat: t.cat, memo: t.memo, amount: t.amount, cleared: 'u', approved: true, flag: t.flag, transferAcct: t.transferAcct }); if (g) { const nt = A.tx.find(x => !had.has(x.id) && x.acct === t.acct); if (nt) nt.grp = g; } }
      else A.tx.push({ ...JSON.parse(JSON.stringify(t)), id: uid(), importId: undefined, rawPayee: undefined, pend: undefined, matched: undefined, grp: g, cleared: 'u', approved: true });
    }));
  },
  ctxRepeat: () => { const t = ctxTargets()[0]; if (!t) return; txSheet(t.id); setTimeout(() => { const r = $('#txRep') || $$('.sheet select').find(s => /never/i.test(s.options[s.selectedIndex]?.text || '')); if (r) { r.focus(); r.scrollIntoView({ block: 'center' }); } toast('Choose how often it repeats, then Save'); }, 80); },
  ctxMemo: () => { const ts = ctxTargets(); openSheet('Memo', `<input id="ctxMemoIn" class="in" value="${esc(ts.length === 1 ? ts[0].memo || '' : '')}" placeholder="Memo">`, `<button class="btn pri block" data-a="ctxMemoDo">Save</button>`, { focus: '#ctxMemoIn' }); },
  ctxMemoDo: () => { const v = $('#ctxMemoIn').value, ts = ctxTargets(); mutate('Memo updated', () => ts.forEach(t => { t.memo = v; })); closeSheet(); },
  ctxMove: () => { openSheet('Move to Account', `<div class="field"><label for="ctxAcct">Account</label><select id="ctxAcct" class="in">${A.plan.accounts.filter(a => !a.closed).map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div>`, `<button class="btn pri block" data-a="ctxMoveDo">Move</button>`); },
  ctxMoveDo: () => { const to = $('#ctxAcct').value, ts = ctxTargets().filter(t => !t.transferAcct); mutate(`${ts.length} moved to ${L.acct[to].name}`, () => ts.forEach(t => { t.acct = to; if (!onBudget(L.acct[to])) t.cat = null; })); closeSheet(); },
  ctxExport: () => {
    const ts = ctxTargets(); const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const csv = ['Account,Date,Payee,Category,Memo,Outflow,Inflow,Cleared'].concat(ts.map(t => [L.acct[t.acct]?.name, t.date, payeeName(t), txCatLabel(t), t.memo, t.amount < 0 ? fmtIn(-t.amount) : '', t.amount > 0 ? fmtIn(t.amount) : '', t.cleared].map(q).join(','))).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `transactions-${todayISO()}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },

  /* ---------- plan menu (click on the plan name, top left) ---------- */
  planMenu: el => {
    const r = el.getBoundingClientRect();
    popMenu(r.left, r.bottom + 6,
      mi(I.plus, 'New Plan', 'newPlan') + mi(I.plan, 'View All Plans', 'pmGo', 'data-v="plans"') + msep +
      `<div class="pm-h">Current Plan</div>` +
      mi(I.gear, 'Plan Settings', 'pmGo', 'data-v="settings"') + mi(I.accts, 'Manage Payees', 'payees') + mi(I.flag, 'Edit Flags', 'flagsEdit') + mi(I.eye, 'Display Options', 'displayOpts') +
      mi(I.bank, 'Manage Bank Connections', 'pmGo', 'data-v="bank"') + mi(I.download, 'Export Plan', 'exportJson') +
      mi('🌱', 'Make a Fresh Start', 'freshStart') + msep +
      mi(document.body.classList.contains('hideamt') ? '👁' : '◌', document.body.classList.contains('hideamt') ? 'Show Amounts' : 'Hide Amounts', 'pmHide') +
      mi(I.sync, 'Sync Now', 'pmSync') + mi('⌨', 'Keyboard Shortcuts', 'shortcutsHelp'), 'pm-plan');
  },
  pmGo: el => {
    A.view = 'settings'; A.acct = null; render();
    const target = { plans: () => $$('.sec-t').find(x => /my plans/i.test(x.textContent)), bank: () => $$('.sec-t').find(x => /bank connections/i.test(x.textContent)) }[el.dataset.v];
    setTimeout(() => (target?.() || $('#app'))?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30);
  },
  pmHide: () => { document.body.classList.toggle('hideamt'); try { localStorage.setItem('budget.hideamt', document.body.classList.contains('hideamt') ? '1' : ''); } catch (e) { } },
  pmSync: () => { if (typeof gdSync === 'function') gdSync(); },
});
try { if (localStorage.getItem('budget.hideamt')) document.body.classList.add('hideamt'); } catch (e) { }

/* ---------- click on a category name on the computer: rename / hide / delete in place, like YNAB ---------- */
{
  const openCat = ACT.catSheet;
  ACT.catSheet = (el, e) => {
    if (!DESK() || A.ui.edit) return openCat(el, e);
    const c = L.cat[el.dataset.c]; if (!c) return; const r = el.getBoundingClientRect();
    popMenu(r.left, r.bottom + 6, `<div class="pm-form"><input id="pmCatName" class="in" value="${esc((c.emoji ? c.emoji + ' ' : '') + c.name)}" aria-label="Category name">
      <div class="row" style="gap:8px; margin-top:12px"><button class="btn sm" data-a="cHide" data-c="${c.id}">${c.hidden ? 'Unhide' : 'Hide'}</button>${c.cc ? '' : `<button class="btn sm danger" data-a="catDelete" data-c="${c.id}">Delete</button>`}<span class="grow"></span>
      <button class="btn sm" data-a="pmCatMore" data-c="${c.id}">Target…</button><button class="btn sm" data-a="closePop">Cancel</button><button class="btn sm pri" data-a="pmCatOk" data-c="${c.id}">OK</button></div></div>`, 'pm-cat');
  };
  Object.assign(ACT, {
    closePop: () => closePop(),
    pmCatMore: el => { closePop(); if (DESK()) { A.ui.selCat = el.dataset.c; A.ui.inspHide = false; render._keepScroll = true; render(); } else openCat(el); },
    pmCatOk: el => {
      const c = L.cat[el.dataset.c]; const raw = ($('#pmCatName')?.value || '').trim(); if (!c || !raw) return;
      const m = raw.match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*(.*)$/u);
      const emoji = m ? m[1] : '', name = (m ? m[2] : raw).trim() || c.name;
      if (name !== c.name || emoji !== (c.emoji || '')) mutate('Category renamed', () => { c.name = name; c.emoji = emoji; });
    },
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'pmCatName') { e.preventDefault(); $('.pmenu [data-a=pmCatOk]')?.click(); } });
}

/* ---------- housekeeping at start: bank lines dated in the future are not real yet ---------- */
function dropFutureBankLines() {
  if (!A.plan) return; const today = todayISO();
  const fut = A.tx.filter(t => t.importId && /^ebp?:/.test(t.importId) && !t.approved && t.date > today).map(t => t.id);
  if (fut.length) { A.tx = A.tx.filter(t => !fut.includes(t.id)); scheduleSave(); render(); }
}
setTimeout(dropFutureBankLines, 1500);
setTimeout(() => { try { if (A.plan && !A.plan.learnedCat) { backfillLearnedCat(); scheduleSave(); } } catch (e) { } }, 2500);
setTimeout(() => { try { if (A.plan) { let n = 0; mutate('Card lines updated', () => { n = mergeCardPendingDupes(); alignLegs(); }, { silent: true }); if (n) toast(n + ' card purchase' + (n > 1 ? 's' : '') + ' now booked by the bank (duplicate pending line merged)'); } } catch (e) { } }, 3000);

/* ---------- click on a category in the register: quick picker, best guesses first ---------- */
function suggestCats(t) {
  const out = [], add = c => { if (c && c !== '__start' && (c === 'rta' || (L.cat[c] && !L.cat[c].cc && !L.cat[c].hidden)) && !out.includes(c)) out.push(c); };
  const a = L.acct[t.acct]; const y = L.payee[t.payee]; const raw = t.rawPayee || y?.name || '';
  if (t.amount > 0 && onBudget(a) && !isCredit(a)) add('rta');
  try { if (typeof catForRaw === 'function') add(catForRaw(t.rawPayee)); } catch (e) { }
  try { const g = (typeof learnedPayee === 'function' && learnedPayee(raw)) || (typeof guessPayee === 'function' && guessPayee(raw)); add(g?.lastCat); } catch (e) { }
  add(y?.lastCat);
  // a category whose name appears in the bank label (e.g. “PHARMACIE …” → Santé/Pharmacie)
  const words = new Set(norm(raw + ' ' + (y?.name || '')).split(/[^\p{L}]+/u).filter(w => w.length >= 4));
  for (const c of A.plan.cats) if (!c.cc && !c.hidden && norm(c.name).split(/[^\p{L}]+/u).some(w => w.length >= 4 && words.has(w))) add(c.id);
  // past payees whose name appears in the label (e.g. a payee “IONOS” you used before)
  for (const p of A.plan.payees) { const pn = norm(p.name.replace(/^\p{Extended_Pictographic}\s*/u, '')); if (p.lastCat && pn.length >= 4 && (words.has(pn) || norm(raw).includes(pn))) add(p.lastCat); }
  // what you chose for similar payees, then your most used categories lately
  const key = norm((typeof cleanPayee === 'function' ? cleanPayee(raw) : raw)).split(' ')[0] || '';
  const cnt = {}, recent = {}; const since = addDays(todayISO(), -120);
  for (const x of A.tx) {
    if (!x.cat || x === t) continue;
    const n = norm(payeeName(x) || '');
    if (key.length >= 3 && n.split(' ')[0] === key) cnt[x.cat] = (cnt[x.cat] || 0) + 3;
    if (x.date >= since && Math.sign(x.amount) === Math.sign(t.amount)) recent[x.cat] = (recent[x.cat] || 0) + 1;
  }
  Object.entries(cnt).sort((p, q) => q[1] - p[1]).forEach(([c]) => add(c));
  Object.entries(recent).sort((p, q) => q[1] - p[1]).forEach(([c]) => add(c));
  return out;
}
/* the other side already exists as a transfer with a line you typed in another account (not from the bank): relink it to this bank line */
function trRelink(t, to) {
  for (const o of A.tx) {
    if (o.acct !== to || o.amount !== -t.amount || !o.transferAcct || o.transferAcct === t.acct || Math.abs(daysBetween(o.date, t.date)) > 7) continue;
    const old = A.tx.find(x => x.id === o.transferId); if (!old || (typeof isBankImp === "function" ? isBankImp(old) : old.importId)) continue;
    return { o, old };
  }
  return null;
}
function catPickList(t, q) {
  q = norm(q || '');
  const sug = q ? [] : suggestCats(t).slice(0, 5);
  const row = c => `<button class="pm-i" data-a="catPickDo" data-c="${c}" data-id="${t.id}"><span class="grow">${esc(c === 'rta' ? 'Inflow: Ready to Assign' : catName(c))}</span>${c !== 'rta' ? `<span class="small muted num">${fmt(catM(monthOf(t.date), c).available)}</span>` : ''}</button>`;
  const raw = t.rawPayee || L.payee[t.payee]?.name || '';
  const trTo = !q && typeof ownAcctInLabel === 'function' ? ownAcctInLabel(raw, t.acct) : null;
  const trRow = id => { const rl = trRelink(t, id); return `<button class="pm-i" data-a="catPickTr" data-ac="${id}" data-id="${t.id}"><span class="grow">${t.amount < 0 ? 'Transfer to' : 'Transfer from'} ${esc(L.acct[id].name)}${rl ? `<span class="small muted" style="display:block">replaces the ${fmt(Math.abs(rl.old.amount))} typed in ${esc(L.acct[rl.old.acct]?.name || '')} on ${fmtDate(rl.old.date)}</span>` : ''}</span><span class="small muted">no category</span></button>`; };
  let h = (trTo ? `<div class="pm-h">Looks like a transfer</div>` + trRow(trTo) + msep : '') + (sug.length ? `<div class="pm-h">Suggested</div>` + sug.map(row).join('') + msep : '');
  for (const g of A.plan.groups) {
    if (g.sys === 'cc') continue;
    const cats = A.plan.cats.filter(c => c.gid === g.id && !c.hidden && (!q || norm(catName(c.id)).includes(q) || norm(g.name).includes(q)));
    if (cats.length) h += `<div class="pm-h">${esc(g.name)}</div>` + cats.map(c => row(c.id)).join('');
  }
  if (!q || 'inflow ready to assign'.includes(q)) h += msep + row('rta');
  if (!q || 'split'.includes(q)) h += msep + `<button class="pm-i" data-a="splitOpen" data-id="${t.id}"><span class="grow">⑂ Split (categories and transfers)…</span></button>`;
  const accs = A.plan.accounts.filter(a => a.id !== t.acct && !a.closed && (!q || norm(a.name).includes(q) || 'transfer'.includes(q) || q.startsWith('transf')));
  if (accs.length) h += msep + `<div class="pm-h">Transfer (no category)</div>` + accs.map(a => trRow(a.id)).join('');
  return h || '<div class="pm-h">No category found</div>';
}
Object.assign(ACT, {
  catPick: (el, e) => {
    const t = A.tx.find(x => x.id === el.dataset.id); if (!t) return; const r = el.getBoundingClientRect();
    const d = popMenu(r.left, r.bottom + 4, `<div style="padding:4px 4px 6px"><input id="catPickQ" class="in" placeholder="Search categories" autocomplete="off" aria-label="Search categories"></div><div id="catPickL">${catPickList(t, '')}</div>`, 'pm-pick');
    const inp = d.querySelector('#catPickQ');
    inp.addEventListener('input', () => { d.querySelector('#catPickL').innerHTML = catPickList(t, inp.value); });
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); d.querySelector('#catPickL [data-a=catPickDo]')?.click(); } });
  },
  catPickTr: el => {
    const t = A.tx.find(x => x.id === el.dataset.id); const to = el.dataset.ac; if (!t || !L.acct[to]) return;
    mutate((t.amount < 0 ? 'Transfer to ' : 'Transfer from ') + L.acct[to].name, () => {
      // the other side may already be there (imported from that bank or typed by hand); otherwise add it
      let o = A.tx.find(x => x.acct === to && !x.transferAcct && x.amount === -t.amount && Math.abs(daysBetween(x.date, t.date)) <= 5);
      const rl = !o && trRelink(t, to); // already recorded as a transfer from another account (e.g. typed in YNAB as SG → Revolut): move it here
      if (rl) { o = rl.o; const i = A.tx.indexOf(rl.old); if (i >= 0) A.tx.splice(i, 1); }
      if (!o) { o = { id: uid(), acct: to, date: t.date, payee: null, cat: null, memo: t.memo || '', amount: -t.amount, cleared: 'u', flag: null, approved: true }; A.tx.push(o); }
      t.transferAcct = to; t.transferId = o.id; t.payee = null; t.cat = null; t.splits = null; t.approved = true; t.self = true; delete t.auto;
      o.transferAcct = t.acct; o.transferId = t.id; o.payee = null; if (rl) toast('Linked to the existing ' + L.acct[to].name + ' line; the copy typed in ' + (L.acct[rl.old.acct]?.name || '') + ' was replaced'); o.cat = null; o.splits = null; o.approved = true;
      if (t.rawPayee && typeof learnKey === 'function') { const k = learnKey(t.rawPayee); if (k) A.plan.learnedTr = { ...(A.plan.learnedTr || {}), [k]: to }; }
    });
  },
  catPickDo: el => {
    const t = A.tx.find(x => x.id === el.dataset.id); const c = el.dataset.c; if (!t) return;
    mutate('Categorized and approved: ' + (c === 'rta' ? 'Ready to Assign' : catName(c)), () => {
      t.cat = c; t.splits = null; t.approved = true; if (typeof learnCat === 'function') learnCat(t);
      const y = L.payee[t.payee]; if (y && c !== 'rta') y.lastCat = c;
      if (y && t.importId && /^ebp?:/.test(t.importId) && typeof learnKey === 'function') { const k = learnKey(t.rawPayee || y.name); if (k) A.plan.learned = { ...(A.plan.learned || {}), [k]: y.name }; }
    });
  },
});

/* ---------- Apple Pay: an iPhone Shortcut sends each payment to your script; the app picks them up ---------- */
function apParseAmount(v) { let s = String(v || '').replace(/[^\d,.\-]/g, ''); if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(',', '.'); const n = Math.round(parseFloat(s) * 100); return isFinite(n) ? n : 0; }
function apAccount(card) {
  const w = new Set(norm(card || '').split(/[^\p{L}\p{N}]+/u).filter(x => x.length >= 2));
  const open = A.plan.accounts.filter(a => !a.closed && onBudget(a));
  let best = null, score = 0;
  for (const a of open) { const s = norm(a.name).split(/[^\p{L}\p{N}]+/u).filter(x => w.has(x)).length; if (s > score) { best = a; score = s; } }
  if (best) return best.id;
  try { const last = localStorage.getItem('budget.apAcct'); if (last && L.acct[last]) return last; } catch (e) { }
  return (open.find(a => isCredit(a)) || open[0])?.id;
}
let apBusy = false;
async function applePayPull() {
  if (apBusy || !A.plan || typeof viaScript !== 'function' || !viaScript()) return; apBusy = true;
  try {
    const r = await px('inboxTake'); const items = r.items || []; if (!items.length) return;
    let last = null;
    mutate(items.length > 1 ? items.length + ' Apple Pay payments added' : 'Apple Pay payment added', () => {
      for (const it of items) {
        const amt = -Math.abs(apParseAmount(it.amount)); if (!amt) continue;
        const acct = apAccount(it.card); if (!acct) continue;
        const raw = it.payee || 'Apple Pay';
        const y = (typeof learnedPayee === 'function' && learnedPayee(raw)) || getPayee(typeof cleanPayee === 'function' ? cleanPayee(raw) : raw);
        const t = { id: uid(), acct, date: isoOf(new Date(it.at || Date.now())), payee: y.id, cat: y.lastCat && L.cat[y.lastCat] ? y.lastCat : null, memo: 'Apple Pay' + (it.card ? ' · ' + it.card : ''), amount: amt, cleared: 'u', flag: null, approved: false, rawPayee: raw };
        A.tx.push(t); last = t;
      }
    });
    if (last && document.visibilityState === 'visible') setTimeout(() => txSheet(last.id), 200);
  } catch (e) { if (e.code !== 'unknown_action') console.warn('applePay', e); }
  finally { apBusy = false; }
}
setTimeout(applePayPull, 2500);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(applePayPull, 800); });
Object.assign(ACT, {
  apSetup: () => {
    const c = typeof proxyCfg === 'function' ? proxyCfg() : null;
    if (!c) return toast('Connect your Apps Script first (Bank Connections)');
    openSheet('Apple Pay shortcut', `<p class="small muted" style="margin:0">Each Apple Pay payment on your iPhone is sent to your own script; the app adds it here (unapproved, category guessed) and opens it so you can check it. The bank line that arrives later is matched with it, not duplicated.</p>
      <div class="card" style="padding:14px; display:flex; flex-direction:column; gap:8px">
      <strong>On your iPhone: Shortcuts → Automation → + → Transaction</strong>
      <span class="small">1. Choose your cards, “Is tapped”, then <b>Run Immediately</b>.</span>
      <span class="small">2. New blank automation → add <b>Get Contents of URL</b>.</span>
      <span class="small">3. URL: tap Copy below and paste it.</span>
      <span class="small">4. Method <b>POST</b>, Request Body <b>JSON</b>, add 5 Text fields:<br>action = <b>inboxAdd</b> · key = <i>Copy key below</i> · amount = <i>Amount</i> · payee = <i>Merchant</i> · card = <i>Card or Pass</i> (the last three come from “Shortcut Input”).</span>
      </div>
      <div class="row" style="gap:8px"><button class="btn grow" data-a="apCopy" data-v="url">Copy URL</button><button class="btn grow" data-a="apCopy" data-v="key">Copy key</button></div>
      <p class="small muted" style="margin:0">The key is your private password for the script: don't share it.</p>`, `<button class="btn pri block" data-a="apTest">Check for payments now</button>`);
  },
  apCopy: async el => { const c = proxyCfg(); const v = el.dataset.v === 'url' ? c.url : c.key; try { await navigator.clipboard.writeText(v); toast(el.dataset.v === 'url' ? 'URL copied' : 'Key copied'); } catch (e) { toast('Copy failed'); } },
  apTest: () => { closeSheet(); applePayPull().then(() => toast('Checked')); },
});


/* ---------- YNAB menus: register View options, Display Options, Edit Flags, Keyboard Shortcuts ---------- */
function applyTheme() { let t = ''; try { t = localStorage.getItem('budget.theme') || ''; } catch (e) { } if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
applyTheme();
Object.assign(ACT, {
  regViewMenu: el => {
    const rv = regView(), r = el.getBoundingClientRect();
    const rc = (k, l) => `<button class="chip ${rv.range === k ? 'on' : ''}" data-a="rvSet" data-k="range" data-v="${k}">${l}</button>`;
    const ck = (k, l) => `<label class="pm-chk"><input type="checkbox" data-c="rvChk" data-k="${k}" ${rv[k] ? 'checked' : ''}> ${l}</label>`;
    popMenu(Math.max(8, r.right - 360), r.bottom + 6, `<div class="pm-form" style="width:340px"><div class="pm-h" style="padding-left:0">View Options</div>
      <div class="chips" style="flex-wrap:wrap; margin:4px 0 10px">${rc('tm', 'This Month')}${rc('lm', 'Last Month')}${rc('3m', 'Latest 3 Months')}${rc('ty', 'This Year')}${rc('ly', 'Last Year')}${rc('all', 'All Dates')}</div>
      ${ck('rec', 'Show Reconciled Transactions')}${ck('bal', 'Show Running Balance')}${ck('flags', 'Show Flags')}</div>`, 'pm-view');
  },
  rvSet: el => { A.ui.rv = { ...regView(), [el.dataset.k]: el.dataset.v }; savePref('rv', A.ui.rv); closePop(); render._keepScroll = true; render(); },
  displayOpts: () => {
    let t = ''; try { t = localStorage.getItem('budget.theme') || ''; } catch (e) { }
    const opt = (v, l) => `<button class="${t === v ? 'on' : ''}" data-a="dispTheme" data-v="${v}">${l}</button>`;
    openSheet('Display Options', `<div class="field"><span class="lbl2">Theme</span><div class="seg">${opt('light', 'Default')}${opt('dark', 'Dark')}${opt('', 'Match System')}</div></div>
      <div class="field"><span class="lbl2">Progress Bars</span><div class="seg"><button class="${A.ui.noBars ? '' : 'on'}" data-a="dispBars" data-v="0">On</button><button class="${A.ui.noBars ? 'on' : ''}" data-a="dispBars" data-v="1">Off</button></div></div>
      <div class="field"><span class="lbl2">Balance Style</span><div class="seg"><button class="${A.ui.balStyle === 'paren' ? '' : 'on'}" data-a="dispBal" data-v="">−10,00€</button><button class="${A.ui.balStyle === 'paren' ? 'on' : ''}" data-a="dispBal" data-v="paren">(10,00€)</button></div></div>
      <label class="pm-chk"><input type="checkbox" data-c="dispNoColor" ${document.body.classList.contains('nocolor') ? 'checked' : ''}> Differentiate Without Color</label>
      <div class="field"><span class="lbl2">Amounts</span><div class="seg"><button class="${document.body.classList.contains('hideamt') ? '' : 'on'}" data-a="dispAmt" data-v="0">Show</button><button class="${document.body.classList.contains('hideamt') ? 'on' : ''}" data-a="dispAmt" data-v="1">Hide</button></div></div>`);
  },
  dispTheme: el => { try { localStorage.setItem('budget.theme', el.dataset.v); } catch (e) { } applyTheme(); ACT.displayOpts(); },
  dispBars: el => { A.ui.noBars = el.dataset.v === '1'; savePref('noBars', A.ui.noBars); render._keepScroll = true; render(); ACT.displayOpts(); },
  dispAmt: el => { document.body.classList.toggle('hideamt', el.dataset.v === '1'); try { localStorage.setItem('budget.hideamt', el.dataset.v === '1' ? '1' : ''); } catch (e) { } ACT.displayOpts(); },
  flagsEdit: () => {
    openSheet('Edit Flags', `<p class="small muted" style="margin:0">Name your flags to give them a meaning (e.g. “To reimburse”).</p>` + FLAGS.map(([f, l]) => `<div class="field" style="display:flex; align-items:center; gap:10px"><span class="flag" style="background:var(--flag-${f}); width:14px; height:14px; flex:none"></span><input class="in" data-flagname="${f}" value="${esc((A.plan.flagNames || {})[f] || '')}" placeholder="${l}"></div>`).join(''),
      `<button class="btn pri block" data-a="flagsSave">Save</button>`);
  },
  flagsSave: () => { const n = {}; $$('[data-flagname]').forEach(i => { if (i.value.trim()) n[i.dataset.flagname] = i.value.trim(); }); mutate('Flags renamed', () => { A.plan.flagNames = n; }); closeSheet(); },
  shortcutsHelp: () => {
    const k = (keys, l) => `<div class="li"><span class="grow">${l}</span><span>${keys.map(x => `<kbd>${x}</kbd>`).join(' ')}</span></div>`;
    openSheet('Keyboard Shortcuts', `<div class="sec-t"><span>Universal</span></div><div class="card">${k(['?'], 'Open Keyboard Shortcuts Help')}${k(['shift', '.'], 'Expand/Collapse Sidebar')}${k(['⌘', 'Z'], 'Undo')}${k(['⌘', 'shift', 'Z'], 'Redo')}${k(['+', '-', 'x', '/'], 'Math operations in amounts')}${k(['esc'], 'Close / deselect')}</div>
      <div class="sec-t"><span>Plan Actions</span></div><div class="card">${k(['←', '→'], 'Previous / next month')}${k(['shift', 'Z'], 'Snooze target (selected category)')}${k(['⌘', '↑/↓'], 'Collapse/expand groups')}</div>
      <div class="sec-t"><span>Account Actions</span></div><div class="card">${k(['N'], 'Add new transaction')}${k(['A'], 'Approve (selected)')}${k(['C'], 'Toggle cleared (selected)')}${k(['delete'], 'Delete (selected)')}${k(['shift', 'E'], 'Reconcile')}${k(['⌘', 'shift', 'F'], 'Focus on the search bar')}</div>`);
  },
  sideToggle: () => { A.ui.sideHide = !A.ui.sideHide; savePref('sideHide', A.ui.sideHide); render._keepScroll = true; render(); },
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset?.c === 'rvChk') { A.ui.rv = { ...regView(), [el.dataset.k]: el.checked }; savePref('rv', A.ui.rv); render._keepScroll = true; render(); } });
document.addEventListener('keydown', e => {
  if (e.target.matches?.('input, textarea, select') || $('#scrim') || !A.plan) return;
  if (e.key === '?') { e.preventDefault(); ACT.shortcutsHelp(); }
  else if (e.shiftKey && (e.key === '>' || e.key === '.')) { e.preventDefault(); ACT.sideToggle(); }
  else if (e.key === 'Escape' && A.ui.selCat) { A.ui.selCat = null; render._keepScroll = true; render(); }
  else if (e.shiftKey && (e.key === 'Z') && !e.metaKey && !e.ctrlKey && A.view === 'plan' && A.ui.selCat && L.cat[A.ui.selCat]?.target) { e.preventDefault(); ACT.tSnooze({ dataset: { c: A.ui.selCat } }); }
  else if (e.shiftKey && e.key === 'E' && A.acct && A.acct !== 'all' && (A.view === 'tx' || A.view === 'accounts')) { e.preventDefault(); ACT.reconcile?.({ dataset: { id: A.acct } }); }
  else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') { const s = $('#regSearch'); if (s) { e.preventDefault(); s.focus(); } }
  else if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && A.view === 'plan') { e.preventDefault(); ACT.collapseAll(); }
});

/* loan: Update Balance (like YNAB) — the bank's figure includes interest; the gap is recorded as an interest adjustment */
Object.assign(ACT, {
  loanUpd: el => {
    const id = el.dataset.id, cur = -balances()[id].working;
    openSheet('Update Balance', `<p class="small muted" style="margin:0">Enter the remaining balance shown by your bank. The difference is recorded as interest.</p><input id="luAmt" class="bigamt in-amt" inputmode="decimal" value="${fmtIn(cur)}" aria-label="Remaining balance">`,
      `<button class="btn pri block" data-a="loanUpdDo" data-id="${id}">Update</button>`, { focus: '#luAmt' });
  },
  loanUpdDo: el => {
    const id = el.dataset.id, v = evalExpr($("#luAmt").value); if (v == null) return;
    const diff = -Math.abs(v) - balances()[id].working; if (!diff) return closeSheet();
    mutate('Balance updated', () => A.tx.push({ id: uid(), acct: id, date: todayISO(), payee: getPayee('Balance adjustment (interest)').id, cat: '__start', memo: '', amount: diff, cleared: 'c', flag: null, approved: true }));
    closeSheet();
  },
});

/* ---------- Plan custom views (YNAB “Views Menu”: New View / Manage Views) ---------- */
Object.assign(ACT, {
  viewsMenu: el => { const r = el.getBoundingClientRect(); popMenu(r.left, r.bottom + 6, mi(I.edit, 'Manage Views', 'viewsManage') + mi(I.plus, 'New View', 'viewEdit'), 'pm-views'); },
  viewsManage: () => {
    const vs = A.plan.views || [];
    openSheet('Manage Views', vs.length ? `<div class="card">${vs.map(v => `<div class="li"><span class="grow"><strong>${esc(v.name)}</strong><div class="small muted">${v.cats.length} categor${v.cats.length > 1 ? 'ies' : 'y'}</div></span><button class="btn sm" data-a="viewEdit" data-id="${v.id}">Edit</button><button class="btn sm danger" data-a="viewDel" data-id="${v.id}">Delete</button></div>`).join('')}</div>` : '<div class="muted">No custom views yet.</div>', `<button class="btn pri block" data-a="viewEdit">${I.plus} New View</button>`);
  },
  viewEdit: el => {
    closePop(); const v = (A.plan.views || []).find(x => x.id === el?.dataset?.id) || { id: '', name: '', cats: [] };
    const body = `<p class="small muted" style="margin:0">Choose a set of categories to include in this custom view.</p>
      <div class="field"><label for="vwName">View Name</label><input id="vwName" class="in" value="${esc(v.name)}" placeholder="e.g. Bills"></div>
      <div class="vw-list">${A.plan.groups.filter(g => g.sys !== 'cc').map(g => { const cs = A.plan.cats.filter(c => c.gid === g.id && !c.hidden); if (!cs.length) return ''; return `<label class="pm-chk vw-g"><input type="checkbox" data-vwg="${g.id}" ${cs.every(c => v.cats.includes(c.id)) ? 'checked' : ''}> <b>${esc(g.name)}</b></label>` + cs.map(c => `<label class="pm-chk vw-c"><input type="checkbox" data-vwc="${c.id}" data-g="${g.id}" ${v.cats.includes(c.id) ? 'checked' : ''}> ${esc(catName(c.id))}</label>`).join(''); }).join('')}</div>`;
    openSheet(v.id ? 'Edit Custom View' : 'New Custom View', body, `<button class="btn pri block" data-a="viewSave" data-id="${v.id}">Save</button>`, { focus: '#vwName' });
  },
  viewSave: el => {
    const name = ($('#vwName')?.value || '').trim(); const cats = $$('[data-vwc]').filter(i => i.checked).map(i => i.dataset.vwc);
    if (!name) { toast('Give the view a name'); return; } if (!cats.length) { toast('Pick at least one category'); return; }
    let id = el.dataset.id;
    mutate('View saved', () => { const vs = [...(A.plan.views || [])]; if (id) { const i = vs.findIndex(x => x.id === id); vs[i] = { ...vs[i], name, cats }; } else { id = uid(); vs.push({ id, name, cats }); } A.plan.views = vs; });
    closeSheet(); A.ui.filter = 'v:' + id; render();
  },
  viewDel: el => { const id = el.dataset.id; mutate('View deleted', () => { A.plan.views = (A.plan.views || []).filter(v => v.id !== id); }); if (A.ui.filter === 'v:' + id) A.ui.filter = 'all'; ACT.viewsManage(); },
});
document.addEventListener('change', e => { const g = e.target.dataset?.vwg; if (g) $$(`[data-vwc][data-g="${g}"]`).forEach(i => { i.checked = e.target.checked; }); });

/* ================= YNAB parity, round 3 ================= */
Object.assign(ACT, {
  pendToggle: () => { A.ui.pendCol = !A.ui.pendCol; savePref('pendCol', A.ui.pendCol); render._keepScroll = true; render(); },
  acctStar: el => { const a = L.acct[el.dataset.id]; if (!a) return; mutate(a.star ? 'Unstarred' : 'Starred', () => { a.star = !a.star; }, { silent: true }); },
  imgView: el => { const t = A.tx.find(x => x.id === el.dataset.id); if (!t?.img) return; openSheet(payeeName(t) || 'Image', `<img src="${t.img}" alt="Receipt" style="width:100%; border-radius:12px">`, `<button class="btn block" data-a="txEditSheet" data-id="${t.id}">Edit Transaction</button>`); },
  txEditSheet: el => { closeSheet(); txSheet(el.dataset.id); },
  imgRemove: () => { D.img = null; refreshSheetBody(txBody()); },
  // months: jump directly (click on “Oct 2026”)
  monthPick: (el, e) => {
    const r = el.getBoundingClientRect(); const y = +(A.ui.mpYear || A.month.slice(0, 4)); A.ui.mpYear = y;
    popMenu(r.left, r.bottom + 6, `<div class="mp"><div class="mp-h"><button class="ibtn" data-a="mpYear" data-d="-1" data-keep="1" aria-label="Previous year">${I.left}</button><strong>${y}</strong><button class="ibtn" data-a="mpYear" data-d="1" data-keep="1" aria-label="Next year">${I.right}</button></div>
      <div class="mp-g">${MSHORT.map((n, i) => { const m = y + '-' + String(i + 1).padStart(2, '0'); return `<button class="mp-m ${m === A.month ? 'on' : ''} ${m === curMonth() ? 'today' : ''}" data-a="mpGo" data-m="${m}">${n}</button>`; }).join('')}</div></div>`, 'pm-month');
  },
  mpYear: el => { A.ui.mpYear = (+A.ui.mpYear) + (+el.dataset.d); const t = $('.mpick'); closePop(); setTimeout(() => ACT.monthPick(t), 0); },
  mpGo: el => { A.month = el.dataset.m; A.ui.mpYear = null; render(); },
  catChkNone: () => { A.ui.selCats = new Set(); render._keepScroll = true; render(); },
  // manual Match / Unmatch of an imported bank line with a transaction you entered
  ctxMatch: () => {
    const ts = ctxTargets(); if (ts.length !== 2) return; const imp = ts.find(t => isBankImp(t)), man = ts.find(t => t !== imp);
    if (!imp || !man || isBankImp(man) || imp.amount !== man.amount || imp.acct !== man.acct) { toast('Select one imported and one entered transaction with the same account and amount'); return; }
    mutate('Transactions matched', () => { man.matched = { importId: imp.importId, rawPayee: imp.rawPayee || '', date: imp.date, payee: imp.payee, memo: imp.memo || '', pend: !!imp.pend }; man.importId = imp.importId; man.rawPayee = imp.rawPayee; if (imp.pend) man.pend = true; if (man.cleared === 'u' && !imp.pend) man.cleared = 'c'; man.approved = true; A.tx = A.tx.filter(t => t !== imp); });
    A.ui.selected.clear();
  },
  ctxUnmatch: () => {
    const t = ctxTargets()[0]; if (!t?.matched) return; const m = t.matched;
    mutate('Transactions unmatched', () => { A.tx.push({ id: uid(), acct: t.acct, date: m.date, payee: m.payee, cat: null, memo: m.memo, amount: t.amount, cleared: m.pend ? 'u' : 'c', flag: null, approved: false, importId: m.importId, rawPayee: m.rawPayee, ...(m.pend ? { pend: true } : {}) }); t.importId = null; t.rawPayee = null; delete t.pend; delete t.matched; });
    A.ui.selected.clear();
  },
  ctxSplit: () => { const t = ctxTargets()[0]; if (!t) return; closePop(); txSheet(t.id); setTimeout(() => { if (D && !D.splits && ACT.spOn) ACT.spOn(); }, 50); },
});
// image picker: shrink the photo so the budget file stays light
document.addEventListener('change', e => {
  const el = e.target; if (el.dataset?.c !== 'imgPick' || !el.files?.[0]) return;
  const f = el.files[0], img = new Image(); img.onload = () => { const s = Math.min(1, 900 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); D.img = c.toDataURL('image/jpeg', 0.6); URL.revokeObjectURL(img.src); refreshSheetBody(txBody()); }; img.src = URL.createObjectURL(f);
});
// category checkboxes (multi-select, like YNAB)
document.addEventListener('change', e => {
  const el = e.target; const S = A.ui.selCats || (A.ui.selCats = new Set());
  if (el.dataset?.c === 'catChk') { el.checked ? S.add(el.dataset.id) : S.delete(el.dataset.id); A.ui.selCat = null; render._keepScroll = true; render(); }
  else if (el.dataset?.c === 'grpChk') { const ids = A.plan.cats.filter(c => c.gid === el.dataset.g && (!c.hidden || A.ui.showHidden)).map(c => c.id); ids.forEach(id => el.checked ? S.add(id) : S.delete(id)); A.ui.selCat = null; render._keepScroll = true; render(); }
});
document.addEventListener('click', e => { if (e.target.matches?.('.cchk')) e.stopPropagation(); }, true);
// drag & drop categories between rows and groups
{
  let dragC = null;
  document.addEventListener('dragstart', e => { const el = e.target.closest?.('[data-cdrag]'); if (!el) return; dragC = el.dataset.cdrag; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragC); } catch (x) { } el.classList.add('dragging'); });
  document.addEventListener('dragend', () => { dragC = null; $$('.dragging,.drop-before,.drop-into').forEach(x => x.classList.remove('dragging', 'drop-before', 'drop-into')); });
  document.addEventListener('dragover', e => { if (!dragC) return; const row = e.target.closest?.('[data-cdrag]'), gh = e.target.closest?.('.ghead'); if (!row && !gh) return; e.preventDefault(); $$('.drop-before,.drop-into').forEach(x => x.classList.remove('drop-before', 'drop-into')); (row || gh).classList.add(row ? 'drop-before' : 'drop-into'); });
  document.addEventListener('drop', e => {
    if (!dragC) return; const row = e.target.closest?.('[data-cdrag]'), gh = e.target.closest?.('.ghead'); if (!row && !gh) return; e.preventDefault();
    const c = L.cat[dragC]; if (!c) return; const before = row ? row.dataset.cdrag : null; const gid = row ? L.cat[before]?.gid : gh.querySelector('[data-gdrop]')?.dataset.gdrop;
    if (!gid || before === dragC || L.group[gid]?.sys) return;
    mutate('Category moved', () => { const cs = A.plan.cats.filter(x => x.id !== dragC); c.gid = gid; let i = before ? cs.findIndex(x => x.id === before) : -1; if (i < 0) { i = cs.length; for (let k = cs.length - 1; k >= 0; k--) if (cs[k].gid === gid) { i = k + 1; break; } } cs.splice(i, 0, c); A.plan.cats = cs; });
  });
}
// account shortcuts on selected transactions (like YNAB): A, C, shift+L, shift+D, K, S, M, shift+U, shift+F then 0-6, shift+T, delete
{
  let flagWait = 0;
  document.addEventListener('keydown', e => {
    if (e.target.matches?.('input, textarea, select') || $('#scrim') || $('.pmenu') || !A.plan || A.view === 'plan' || A.view === 'reflect' || A.view === 'settings') return;
    const ts = ctxTargets(); const run = a => { e.preventDefault(); const b = document.createElement('button'); b.dataset.a = a[0]; Object.assign(b.dataset, a[1] || {}); ACT[a[0]](b, e); };
    if (flagWait && Date.now() - flagWait < 2000 && /^[0-6]$/.test(e.key)) { flagWait = 0; if (ts.length) { e.preventDefault(); const f = e.key === '0' ? null : FLAGS[+e.key - 1][0]; mutate('Flags updated', () => ts.forEach(t => t.flag = f)); } return; }
    if (e.shiftKey && e.key === 'L') { const un = regList().filter(t => t.approved === false); if (un.length) { e.preventDefault(); mutate(un.length + ' approved', () => un.forEach(t => t.approved = true)); } return; }
    if (!ts.length) return;
    if (e.shiftKey && e.key === 'F') { e.preventDefault(); flagWait = Date.now(); toast('Flag: press 1-6 (0 = none)'); }
    else if (e.shiftKey && e.key === 'D') run(['ctxDup']);
    else if (e.shiftKey && e.key === 'T' && ts.length === 1) run(['ctxRepeat']);
    else if (e.shiftKey && e.key === 'U') run(['ctxUnmatch']);
    else if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const k = e.key.toLowerCase();
      if (k === 'a') run(['bulk', { k: 'approve' }]); else if (k === 'c') run(['ctxClear', { v: ts.some(t => t.cleared === 'u') ? 'c' : 'u' }]);
      else if (k === 'k') run(['bulk', { k: 'cat' }]); else if (k === 's' && ts.length === 1) run(['ctxSplit']); else if (k === 'm') run(['ctxMatch']);
      else if (k === 'delete' || k === 'backspace') run(['bulk', { k: 'del' }]);
    }
  });
}

/* Reflect: date range arrows, category filter, export */
Object.assign(ACT, {
  reflNav: el => { A.ui.reflOff = Math.min(0, (A.ui.reflOff || 0) + (+el.dataset.d)); render(); },
  reflCats: el => {
    const ex = A.ui.reflEx || new Set(), r = el.getBoundingClientRect();
    popMenu(Math.max(8, r.right - 300), r.bottom + 6, `<div class="pm-form" style="width:300px; max-height:60vh; overflow:auto"><div class="row" style="gap:6px; margin-bottom:6px"><button class="btn sm" data-a="reflCatsAll" data-v="1" data-keep="1">Select All</button><button class="btn sm" data-a="reflCatsAll" data-v="0" data-keep="1">Select None</button></div>
      ${A.plan.groups.map(g => { const cs = A.plan.cats.filter(c => c.gid === g.id && !c.hidden && !c.cc); if (!cs.length) return ''; return `<div class="pm-h" style="padding-left:0">${esc(g.name)}</div>` + cs.map(c => `<label class="pm-chk"><input type="checkbox" data-c="reflCat" data-id="${c.id}" ${ex.has(c.id) ? '' : 'checked'}> ${esc(catName(c.id))}</label>`).join(''); }).join('')}</div>`, 'pm-rcats');
  },
  reflCatsAll: el => { A.ui.reflEx = el.dataset.v === '1' ? new Set() : new Set(A.plan.cats.map(c => c.id)); $$('[data-c=reflCat]').forEach(i => { i.checked = el.dataset.v === '1'; }); render._keepScroll = true; render(); },
  reflExport: () => {
    const [from, to] = periodRange(); const lines = spendingLines(from, to); const by = {};
    for (const l of lines) { const k = l.cat + '|' + l.m; by[k] = (by[k] || 0) - l.amount; }
    const months = monthsBetween(from, to); let csv = 'Category Group;Category;' + months.join(';') + ';Total\n';
    for (const c of A.plan.cats) { const vals = months.map(m => by[c.id + '|' + m] || 0); const tot = vals.reduce((a, b) => a + b, 0); if (!tot) continue; csv += `"${(L.group[c.gid]?.name || '').replace(/"/g, '""')}";"${catName(c.id).replace(/"/g, '""')}";` + vals.map(v => fmtIn(v)).join(';') + ';' + fmtIn(tot) + '\n'; }
    saveFile(`reflect-${from}_${to}.csv`, '﻿' + csv, 'text/csv');
  },
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset?.c !== 'reflCat') return; const ex = A.ui.reflEx || (A.ui.reflEx = new Set()); el.checked ? ex.delete(el.dataset.id) : ex.add(el.dataset.id); render._keepScroll = true; render(); });

Object.assign(ACT, { dispBal: el => { A.ui.balStyle = el.dataset.v || ''; savePref('balStyle', A.ui.balStyle); render._keepScroll = true; render(); ACT.displayOpts(); } });
document.addEventListener('change', e => { if (e.target.dataset?.c !== 'dispNoColor') return; document.body.classList.toggle('nocolor', e.target.checked); try { localStorage.setItem('budget.nocolor', e.target.checked ? '1' : ''); } catch (x) { } });
try { if (localStorage.getItem('budget.nocolor')) document.body.classList.add('nocolor'); } catch (e) { }

Object.assign(ACT, { regSort: el => { const k = el.dataset.k, so = A.ui.sort || { k: 'date', d: -1 }; A.ui.sort = so.k === k ? { k, d: -so.d } : { k, d: k === 'date' || k === 'out' || k === 'in' ? -1 : 1 }; savePref('sort', A.ui.sort); render._keepScroll = true; render(); } });
// resize register columns by dragging the header edge (widths are remembered)
{
  let g = null;
  document.addEventListener('pointerdown', e => { const h = e.target.closest?.('[data-grip]'); if (!h) return; e.preventDefault(); e.stopPropagation(); const th = h.closest('th'); g = { k: h.dataset.grip, x: e.clientX, w: th.getBoundingClientRect().width, th }; document.body.classList.add('colresize'); });
  document.addEventListener('pointermove', e => { if (!g) return; const w = Math.max(60, Math.round(g.w + e.clientX - g.x)); g.th.style.width = w + 'px'; g.nw = w; });
  document.addEventListener('pointerup', () => { if (!g) return; if (g.nw) { A.ui.colW = { ...(A.ui.colW || {}), [g.k]: g.nw }; savePref('colW', A.ui.colW); } g = null; document.body.classList.remove('colresize'); });
}

/* ---------- calculator bar above the phone keyboard (like YNAB's keypad: + − × ÷ =) ---------- */
(function calcBar() {
  if (!matchMedia('(pointer:coarse)').matches) return;
  const SEL = 'input[inputmode="decimal"]';
  const bar = document.createElement('div'); bar.className = 'calcbar'; bar.hidden = true; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Calculator');
  const ops = [['+', '+', 'Plus'], ['−', '-', 'Minus'], ['×', '*', 'Times'], ['÷', '/', 'Divided by'], ['=', '=', 'Equals']];
  bar.innerHTML = ops.map(([l, v, a]) => `<button type="button" data-op="${v}" class="${v === '=' ? 'eq' : ''}" aria-label="${a}">${l}</button>`).join('');
  document.body.appendChild(bar);
  let cur = null;
  const place = () => { const vv = window.visualViewport; const off = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0; bar.style.bottom = off + 'px'; };
  document.addEventListener('focusin', e => { if (e.target.matches?.(SEL)) { cur = e.target; bar.hidden = false; place(); } });
  document.addEventListener('focusout', () => setTimeout(() => { if (!document.activeElement?.matches?.(SEL)) { bar.hidden = true; cur = null; } }, 80));
  window.visualViewport?.addEventListener('resize', place); window.visualViewport?.addEventListener('scroll', place);
  const fire = el => el.dispatchEvent(new Event('input', { bubbles: true }));
  // the press is handled on touchstart and its default cancelled, so the field keeps the focus and the keyboard stays open
  bar.addEventListener('touchstart', e => { e.preventDefault(); act(e.target.closest('[data-op]')); }, { passive: false });
  bar.addEventListener('mousedown', e => { e.preventDefault(); act(e.target.closest('[data-op]')); });
  function act(b) {
    if (!b || !cur || !document.body.contains(cur)) return;
    const op = b.dataset.op, el = cur;
    if (op === '=') {
      let raw = el.value.trim();
      // assigned field: "+20" means 20 more than what is already assigned (same rule as when leaving the field)
      if (el.dataset.assign && /^[+*/×x−-]/.test(raw)) { const now = getAssigned(A.month, el.dataset.assign); raw = fmtIn(now) + raw; }
      const v = evalExpr(raw); if (v == null) { toast('Amount not recognized'); return; }
      el.value = fmtIn(v); fire(el); return;
    }
    const v = el.value, s = el.selectionStart ?? v.length, en = el.selectionEnd ?? v.length;
    const all = s === 0 && en === v.length && v.length > 0; // whole value selected on focus: keep it and add the operator after it
    const a = all ? v.length : s, z = all ? v.length : en;
    el.value = v.slice(0, a) + op + v.slice(z); const p = a + 1;
    try { el.setSelectionRange(p, p); } catch (x) { }
    fire(el);
  }
})();

/* ---------- split a bank line between categories and transfers (YNAB sub-transactions) ---------- */
let SP = null;
function splitTargets(sel, acct) {
  const a = L.acct[acct]; let o = `<option value="">Category Needed</option>`;
  if (onBudget(a)) o += A.plan.groups.filter(g => g.sys !== 'cc').map(g => { const cs = A.plan.cats.filter(c => c.gid === g.id && (!c.hidden || c.id === sel)); return cs.length ? `<optgroup label="${esc(g.name)}">${cs.map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(catName(c.id))}</option>`).join('')}</optgroup>` : ''; }).join('');
  o += `<optgroup label="Transfer">${A.plan.accounts.filter(x => !x.closed && x.id !== acct).map(x => `<option value="tr:${x.id}" ${sel === 'tr:' + x.id ? 'selected' : ''}>Transfer : ${esc(x.name)}</option>`).join('')}</optgroup>`;
  return o;
}
function lastSplitLike(t) {
  const legs = txLegs(t), total = legs.reduce((a, x) => a + x.amount, 0), key = t.rawPayee ? learnKey(t.rawPayee) : null, pn = (payeeName(t) || '').toLowerCase();
  const seen = new Set();
  for (const x of A.tx.filter(x => x.acct === t.acct && x.date < t.date).sort((a, b) => a.date < b.date ? 1 : -1)) {
    const k = legKey(x); if (!k || seen.has(k)) continue; seen.add(k); const g = txLegs(x); if (g.length < 2 || g.some(l => legs.includes(l))) continue;
    if (g.reduce((a, l) => a + l.amount, 0) !== total) continue;
    const gp = (legPayee(g) || '').toLowerCase(), gk = g[0].rawPayee ? learnKey(g[0].rawPayee) : null;
    if ((key && gk && key.split(' ')[0] === gk.split(' ')[0]) || (pn && gp === pn) || true) return g;
  }
  return null;
}
function splitSheet(id) {
  const t = A.tx.find(x => x.id === id); if (!t) return; const legs = txLegs(t), sign = legs.reduce((a, x) => a + x.amount, 0) < 0 ? -1 : 1;
  SP = { id: legs[0].id, acct: t.acct, total: Math.abs(legs.reduce((a, x) => a + x.amount, 0)), sign, rows: legs.map(l => ({ amt: Math.abs(l.amount), to: l.transferAcct ? 'tr:' + l.transferAcct : (l.cat || ''), memo: l.memo || '' })) };
  if (SP.rows.length < 2) SP.rows.push({ amt: 0, to: '', memo: '' });
  splitRender();
}
function splitRender() {
  const left = SP.total - SP.rows.reduce((a, r) => a + r.amt, 0), last = lastSplitLike(A.tx.find(x => x.id === SP.id));
  const body = `<div class="kpis" style="grid-template-columns:1fr 1fr"><div class="kpi"><span>Total</span><b class="num">${fmt(SP.sign * SP.total)}</b></div><div class="kpi"><span>Left to split</span><b class="num" style="color:${left ? 'var(--warn)' : 'var(--good)'}">${fmt(left)}</b></div></div>
    ${last && txLegs(A.tx.find(x => x.id === SP.id)).length < 2 ? `<button class="btn block sp-last" data-a="splitLast">↺ Same as last time: ${last.map(l => esc(legLabel(l)) + ' ' + fmt(Math.abs(l.amount))).join(' + ')}</button>` : ''}
    ${SP.rows.map((r, i) => `<div class="sp-row"><select class="in" data-sp="to" data-i="${i}">${splitTargets(r.to, SP.acct)}</select><input class="in num" inputmode="decimal" data-sp="amt" data-i="${i}" value="${r.amt ? fmtIn(r.amt) : ''}" placeholder="0,00"><input class="in" data-sp="memo" data-i="${i}" value="${esc(r.memo)}" placeholder="Memo">${SP.rows.length > 2 ? `<button class="ibtn" data-a="splitDel" data-i="${i}" aria-label="Remove line">${I.trash}</button>` : ''}</div>`).join('')}
    <button class="btn block" data-a="splitAdd">${I.plus} Add another split</button>`;
  if ($('#scrim') && $('.sp-row')) refreshSheetBody(body); else openSheet('Split Transaction', body, `<button class="btn pri block" data-a="splitSave">Save</button>`);
}
document.addEventListener('change', e => { const el = e.target; if (!SP || !el.dataset?.sp) return; const r = SP.rows[+el.dataset.i]; if (el.dataset.sp === 'amt') { r.amt = Math.abs(evalExpr(el.value) || 0); const left = SP.total - SP.rows.reduce((a, x) => a + x.amt, 0); const nx = SP.rows.find((x, k) => k !== +el.dataset.i && !x.amt); if (nx && left > 0) nx.amt = left; splitRender(); } else r[el.dataset.sp] = el.value; });
Object.assign(ACT, {
  grpEdit: (el, e) => { if (e?.target?.closest?.('input,select,textarea,label')) return; splitSheet(el.dataset.id); },
  grpApprove: el => { const legs = txLegs(A.tx.find(x => x.id === el.dataset.id)); mutate('Approved', () => legs.forEach(l => { l.approved = true; })); },
  splitAdd: () => { const left = SP.total - SP.rows.reduce((a, r) => a + r.amt, 0); SP.rows.push({ amt: Math.max(0, left), to: '', memo: '' }); splitRender(); },
  splitDel: el => { SP.rows.splice(+el.dataset.i, 1); splitRender(); },
  splitLast: () => { const g = lastSplitLike(A.tx.find(x => x.id === SP.id)); if (!g) return; SP.rows = g.map(l => ({ amt: Math.abs(l.amount), to: l.transferAcct ? 'tr:' + l.transferAcct : (l.cat || ''), memo: '' })); SP.pname = legPayee(g); splitRender(); },
  splitOpen: el => { closePop(); splitSheet(el.dataset.id); },
  splitLastFor: el => { closeSheet(); splitSheet(el.dataset.id); ACT.splitLast(); ACT.splitSave(); },
  splitSave: () => {
    const rows = SP.rows.filter(r => r.amt); const sum = rows.reduce((a, r) => a + r.amt, 0);
    if (sum !== SP.total) { toast('The lines must add up to ' + fmt(SP.total) + ' (left: ' + fmt(SP.total - sum) + ')'); return; }
    const lead = A.tx.find(x => x.id === SP.id), legs = txLegs(lead), base = lead.importId ? lead.importId.split('#')[0] : null, grp = lead.grp || uid();
    const pname = SP.pname || (legPayee(legs) && legPayee(legs) !== 'Split' ? legPayee(legs) : (payeeName(lead) || ''));
    mutate('Split saved', () => {
      rows.forEach((r, i) => {
        const old = legs[i]; const tr = r.to.startsWith('tr:') ? r.to.slice(3) : null;
        const t = saveTx({ id: old?.id, acct: SP.acct, date: lead.date, payee: tr ? '' : pname, cat: tr ? null : (r.to || null), memo: r.memo, amount: SP.sign * r.amt, cleared: lead.cleared, flag: lead.flag, approved: true, transferAcct: tr, splits: null });
        if (!t) return; t.grp = grp; if (base) t.importId = i ? base + '#' + (i + 1) : base; if (lead.rawPayee) t.rawPayee = lead.rawPayee; if (lead.pend) t.pend = true; delete t.auto;
      });
      for (const old of legs.slice(rows.length)) { const ids = new Set([old.id, old.transferId].filter(Boolean)); A.tx = A.tx.filter(x => !ids.has(x.id)); }
    });
    closeSheet(); SP = null;
  },
});
