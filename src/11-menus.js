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
  e.preventDefault();
  const id = row.dataset.tid; if (!A.ui.selected.has(id)) A.ui.selected = new Set([id]);
  const ts = ctxTargets(), n = ts.length; if (!n) return;
  const unappr = ts.some(t => t.approved === false), uncl = ts.some(t => t.cleared === 'u'), cl = ts.some(t => t.cleared === 'c');
  const s = n > 1 ? n + ' Transactions' : '1 Transaction';
  popMenu(e.clientX, e.clientY,
    mi(I.check, 'Approve', 'bulk', 'data-k="approve"', 'A', !unappr) +
    msep +
    mi('Ⓒ', 'Mark as Cleared', 'ctxClear', 'data-v="c"', 'C', !uncl) +
    mi('Ⓒ', 'Mark as Uncleared', 'ctxClear', 'data-v="u"', 'C', !cl) +
    msep +
    mi(I.file, 'Duplicate', 'ctxDup', '', '', false) +
    mi(I.repeat, 'Make Repeating', 'ctxRepeat', '', '', n !== 1) +
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
});
// keyboard shortcuts on the right-clicked / selected transactions, like YNAB
document.addEventListener('keydown', e => {
  if (!$('.pmenu') || e.target.matches?.('input, textarea, select')) return;
  const k = e.key.toLowerCase(), go = (a, extra = {}) => { e.preventDefault(); const b = document.createElement('button'); b.dataset.a = a; Object.assign(b.dataset, extra); ACT[a](b, e); closePop(); };
  if (k === 'a') go('bulk', { k: 'approve' }); else if (k === 'c') go('ctxClear', { v: ctxTargets().some(t => t.cleared === 'u') ? 'c' : 'u' }); else if (k === 'delete' || k === 'backspace') go('bulk', { k: 'del' });
});

Object.assign(ACT, {
  ctxClear: el => { const ts = ctxTargets(), v = el.dataset.v; mutate(v === 'c' ? 'Marked as cleared' : 'Marked as uncleared', () => ts.forEach(t => { if (t.cleared !== 'r') t.cleared = v; })); },
  ctxDup: () => {
    const ts = ctxTargets();
    mutate(ts.length > 1 ? ts.length + ' transactions duplicated' : 'Transaction duplicated', () => ts.forEach(t => {
      if (t.transferAcct) saveTx({ acct: t.acct, date: t.date, payee: '', cat: t.cat, memo: t.memo, amount: t.amount, cleared: 'u', approved: true, flag: t.flag, transferAcct: t.transferAcct });
      else A.tx.push({ ...JSON.parse(JSON.stringify(t)), id: uid(), importId: undefined, rawPayee: undefined, pend: undefined, cleared: 'u', approved: true });
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
      mi(I.gear, 'Plan Settings', 'pmGo', 'data-v="settings"') + mi(I.accts, 'Manage Payees', 'payees') +
      mi(I.bank, 'Manage Bank Connections', 'pmGo', 'data-v="bank"') + mi(I.download, 'Export Plan', 'exportJson') +
      mi('🌱', 'Make a Fresh Start', 'freshStart') + msep +
      mi(document.body.classList.contains('hideamt') ? '👁' : '◌', document.body.classList.contains('hideamt') ? 'Show Amounts' : 'Hide Amounts', 'pmHide') +
      mi(I.sync, 'Sync Now', 'pmSync'), 'pm-plan');
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
    pmCatMore: el => openCat(el),
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

/* ---------- click on a category in the register: quick picker, best guesses first ---------- */
function suggestCats(t) {
  const out = [], add = c => { if (c && c !== '__start' && (c === 'rta' || (L.cat[c] && !L.cat[c].cc && !L.cat[c].hidden)) && !out.includes(c)) out.push(c); };
  const a = L.acct[t.acct]; const y = L.payee[t.payee]; const raw = t.rawPayee || y?.name || '';
  if (t.amount > 0 && onBudget(a) && !isCredit(a)) add('rta');
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
function catPickList(t, q) {
  q = norm(q || '');
  const sug = q ? [] : suggestCats(t).slice(0, 5);
  const row = c => `<button class="pm-i" data-a="catPickDo" data-c="${c}" data-id="${t.id}"><span class="grow">${esc(c === 'rta' ? 'Inflow: Ready to Assign' : catName(c))}</span>${c !== 'rta' ? `<span class="small muted num">${fmt(catM(monthOf(t.date), c).available)}</span>` : ''}</button>`;
  let h = sug.length ? `<div class="pm-h">Suggested</div>` + sug.map(row).join('') + msep : '';
  for (const g of A.plan.groups) {
    if (g.sys === 'cc') continue;
    const cats = A.plan.cats.filter(c => c.gid === g.id && !c.hidden && (!q || norm(catName(c.id)).includes(q) || norm(g.name).includes(q)));
    if (cats.length) h += `<div class="pm-h">${esc(g.name)}</div>` + cats.map(c => row(c.id)).join('');
  }
  if (!q || 'inflow ready to assign'.includes(q)) h += msep + row('rta');
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
  catPickDo: el => {
    const t = A.tx.find(x => x.id === el.dataset.id); const c = el.dataset.c; if (!t) return;
    mutate('Categorized and approved: ' + (c === 'rta' ? 'Ready to Assign' : catName(c)), () => {
      t.cat = c; t.splits = null; t.approved = true;
      const y = L.payee[t.payee]; if (y && c !== 'rta') y.lastCat = c;
      if (y && t.importId && /^ebp?:/.test(t.importId) && typeof learnKey === 'function') { const k = learnKey(t.rawPayee || y.name); if (k) A.plan.learned = { ...(A.plan.learned || {}), [k]: y.name }; }
    });
  },
});
