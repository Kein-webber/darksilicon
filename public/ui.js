(function () {
'use strict';
const C = CORE, G = C.GENS;
const KEY = 'darksilicon_v1';
const $ = s => document.querySelector(s);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const setT = (e, t) => { if (e._t !== t) { e._t = t; e.textContent = t; } };
const setD = (e, v) => { v = !!v; if (e._d !== v) { e._d = v; e.disabled = v; } };
const setC = (e, c, v) => { v = !!v; e._c = e._c || {}; if (e._c[c] === v) return; e._c[c] = v; e.classList.toggle(c, v); };
const show = (e, v) => { const d = v ? '' : 'none'; if (e._s !== d) { e._s = d; e.style.display = d; } };

function load() {
  try { const r = localStorage.getItem(KEY); if (r) return C.deserialize(JSON.parse(r)); } catch (e) { console.warn(e); }
  return C.newState();
}
let S = load();
const F = n => C.fmt(n, S.set.sci);
const FI = n => C.fmtI(n, S.set.sci);
function save() { S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(C.serialize(S))); } catch (e) {} }
function fmtTime(s) {
  s = Math.floor(s);
  const d = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  return (d ? d + 'd ' : '') + (hh ? hh + 'h ' : '') + (m ? m + 'm ' : '') + (!d && !hh ? ss + 's' : '');
}
const pct = (a, b) => Math.max(0, Math.min(100, b > 0 ? a / b * 100 : 0));

// ---------- toast / modal / helpers ----------
function toast(m) {
  const t = $('#toasts'); if (t.children.length > 2) return;
  const d = h('div', '', m); t.append(d); setTimeout(() => d.remove(), 3300);
}
let modalOpen = false;
function closeModal() { $('#modal').hidden = true; modalOpen = false; }
function modal(steps, done) {
  if (!Array.isArray(steps)) steps = [steps];
  let i = 0; modalOpen = true;
  const m = $('#modal');
  const render = () => {
    m.innerHTML = '';
    const s = steps[i], b = h('div', 'box');
    b.append(h('h3', '', s.t));
    if (steps.length > 1) { const d = h('div', 'dots'); steps.forEach((_, k) => d.append(h('i', k <= i ? 'on' : ''))); b.append(d); }
    b.append(h('p', '', s.b));
    const row = h('div', 'btns');
    if (steps.length > 1 && i === 0 && s.skip) { const sk = h('button', '', 'Skip'); sk.onclick = () => { closeModal(); done && done(); }; row.append(sk); }
    const ok = h('button', 'bigbtn', i < steps.length - 1 ? 'Next' : (s.ok || 'Got it'));
    ok.style.padding = '10px'; ok.style.flex = '2';
    ok.onclick = () => { if (i < steps.length - 1) { i++; render(); } else { closeModal(); done && done(); } };
    row.append(ok); b.append(row); m.append(b);
  };
  render(); m.hidden = false;
}
function armBtn(b, label, fn, cls) {
  b.textContent = label; let t = 0;
  b.onclick = () => {
    if (b.disabled || b.classList.contains('off')) return;
    if (t) { clearTimeout(t); t = 0; b.textContent = label; b.classList.remove('arm'); fn(); }
    else { b.textContent = 'TAP AGAIN TO CONFIRM'; b.classList.add('arm'); t = setTimeout(() => { t = 0; b.textContent = label; b.classList.remove('arm'); }, 3000); }
  };
}
function floatTxt(x, y, t) {
  const fx = $('#fx'); if (fx.children.length > 14) return;
  const s = h('span', '', t); s.style.left = x + 'px'; s.style.top = y + 'px'; fx.append(s);
  setTimeout(() => s.remove(), 850);
}

// ---------- shell: tabs and subtabs ----------
const TABS = [
  { id: 'rig', n: 'FORGE', ok: () => true },
  { id: 'work', n: 'RITES', ok: () => S.un.pr || S.un.ct },
  { id: 'lab', n: 'GRIMOIRE', ok: () => S.un.pr },
  { id: 'rebirth', n: 'REBIRTH', ok: () => S.un.rb },
  { id: 'dom', n: 'DOMAIN', ok: () => S.node >= 2 },
  { id: 'more', n: 'CODEX', ok: () => true }
];
const SUBS = {
  rig: [['units', 'Units', () => true], ['cmp', 'Compute', () => S.un.cmp], ['th', 'Thermal', () => S.un.oc], ['ing', 'Ingress', () => S.un.ct], ['pw', 'Power', () => S.un.pw], ['rk', 'Rack', () => S.sled > 0 || S.st.boards > 0], ['occ', 'Occult', () => S.node >= 1 || S.st.reb >= 2]],
  work: [['procs', 'Incantations', () => S.un.pr], ['cl', 'Pacts', () => S.un.ct]],
  lab: [],
  dom: [['crp', 'The Crypt', () => S.node >= 2], ['alt', 'The Altar', () => S.node >= 4], ['aby', 'The Abyss', () => S.node >= 6]],
  rebirth: [['reboot', 'Reboot', () => S.un.rb], ['shop', 'Shop', () => S.un.rb], ['dm', 'Daemons', () => S.un.dm], ['shr', 'Shrink', () => S.un.rb], ['asc', 'Ascend', () => S.un.asc]],
  more: [['stats', 'Stats', () => true], ['guide', 'Guide', () => true], ['seals', 'Seals', () => true], ['log', 'Chronicle', () => true], ['set', 'Settings', () => true]]
};
let curTab = 'rig', curSub = { rig: 'units', work: 'procs', lab: '', rebirth: 'reboot', dom: 'crp', more: 'stats' };
const seenT = {}, seenS = {};
let view = null, navSig = '', subSig = '';
const main = $('#main'), nav = $('#nav'), subsEl = $('#subs');
function subsFor(t) { return SUBS[t].filter(s => s[2]()); }
const SITEVIEW = { crp: 'crypt', alt: 'altar', aby: 'abyss', rk: 'rack' };
function syncView() { const v = SITEVIEW[curSub[curTab]]; if (v && (curTab === 'dom' || curTab === 'rig') && SCENE.views(S).indexOf(v) >= 0) { sceneView = v; renderViews(); } }
function setTab(id) {
  curTab = id; seenT[id] = 1;
  const vs = subsFor(id);
  if (vs.length && !vs.find(s => s[0] === curSub[id])) curSub[id] = vs[0][0];
  if (vs.length) seenS[id + '.' + curSub[id]] = 1;
  rebuild(true); renderNav(); syncView();
}
function setSub(id) { curSub[curTab] = id; seenS[curTab + '.' + id] = 1; rebuild(true); renderNav(); syncView(); }
function renderNav() {
  const vis = TABS.filter(t => t.ok());
  const subs = subsFor(curTab);
  const sig = vis.map(t => t.id + (seenT[t.id] ? 1 : 0)).join() + curTab + '|' + subs.map(s => s[0] + (seenS[curTab + '.' + s[0]] ? 1 : 0)).join() + curSub[curTab];
  if (sig === navSig) return;
  navSig = sig; nav.innerHTML = ''; subsEl.innerHTML = '';
  vis.forEach(t => {
    const b = h('button', (t.id === curTab ? 'act ' : '') + (!seenT[t.id] ? 'new' : ''), t.n);
    b.onclick = () => setTab(t.id); nav.append(b);
  });
  if (subs.length > 1) subs.forEach(s => {
    const b = h('button', (s[0] === curSub[curTab] ? 'act ' : '') + (!seenS[curTab + '.' + s[0]] ? 'new' : ''), s[1]);
    b.onclick = () => setSub(s[0]); subsEl.append(b);
  });
}
function viewFor(t, s) {
  if (t === 'rig') return s === 'units' ? vUnits() : vRig(s);
  if (t === 'work') return s === 'cl' ? vClients() : vProcs();
  if (t === 'lab') return vLab();
  if (t === 'dom') return vRig(s);
  if (t === 'rebirth') return { reboot: vReboot, shop: vShop, dm: vDaemons, shr: vShrink, asc: vAscend }[s]();
  return { stats: vStats, guide: vGuide, seals: vSeals, log: vLog, set: vSettings }[s]();
}
function rebuild(reset) {
  const top = reset ? 0 : main.scrollTop;
  main.innerHTML = '';
  view = viewFor(curTab, curSub[curTab]);
  view.build(main); view.s = view.sig ? view.sig() : '';
  view.upd && view.upd();
  main.scrollTop = top;
}

// ---------- RIG: units ----------
let bm = 1;
function vUnits() {
  const rows = {};
  const vis = () => G.map((g, i) => i).filter(i => C.genAvail(S, i) && (i === 0 || S.g[i - 1] > 0 || S.g[i] > 0));
  const lockedNext = () => { const i = G.findIndex((g, k) => !C.genAvail(S, k) && (k === 0 || S.g[k - 1] > 0)); return i; };
  return {
    sig: () => vis().join() + '|' + lockedNext(),
    build(r) {
      r.append(h('h2', '', 'Units'));
      const m = h('div', 'mult');
      [[1, 'x1'], [10, 'x10'], [100, 'x100'], [0, 'MAX']].forEach(([v, l]) => {
        const b = h('button', bm === v ? 'act' : '', l); b.onclick = () => { bm = v; [...m.children].forEach(c => c.classList.toggle('act', c === b)); }; m.append(b);
      });
      r.append(m);
      vis().forEach(i => {
        const row = h('div', 'row'), info = h('div', 'info');
        const nm = h('div', 'nm'); const own = h('span', 'own'); nm.append(G[i].n, own);
        const p1 = h('div', 'sub'), p2 = h('div', 'sub', G[i].d), bar = h('div', 'bar'); const bi = h('i'); bar.append(bi);
        info.append(nm, p1, bar, p2);
        const b = h('button', 'buy act'); const bl = h('small'); b.append(h('span'), bl);
        b.onclick = () => { const k = bm || Math.max(1, C.maxBuy(S, i)); if (C.buyGen(S, i, k)) { } };
        row.append(info, b); r.append(row);
        rows[i] = { own, p1, bi, b, bs: b.firstChild, bl };
      });
      const ln = lockedNext();
      if (ln >= 0) { const row = h('div', 'row lock'); const info = h('div', 'info'); info.append(h('div', 'nm', '??? ' + G[ln].n), h('div', 'sub', 'Needs a finer die: ' + C.NODES[G[ln].u])); row.append(info); r.append(row); }
    },
    upd() {
      for (const i in rows) {
        const R = rows[i], n = S.g[i];
        setT(R.own, '×' + FI(n));
        const per = G[i].p * C.genMult(S, +i) * C.gMult(S);
        const nx = C.MS.find(m => m > n);
        setT(R.p1, F(per) + '/s each · ' + F(C.genProd(S, +i)) + '/s' + (nx ? ' · ×2 at ' + nx : ''));
        const prev = C.MS.filter(m => m <= n).pop() || 0;
        R.bi.style.width = (nx ? pct(n - prev, nx - prev) : 100) + '%';
        const k = bm || Math.max(1, C.maxBuy(S, +i));
        const c = C.cost(S, +i, k);
        setT(R.bs, F(c)); setT(R.bl, 'BUY ×' + k);
        setC(R.b, 'off', S.c < c);
      }
    }
  };
}

// ---------- RIG: upgrade tiles ----------
let bestCache = { t: 0, id: '' };
function bestRig() {
  const now = performance.now();
  if (now - bestCache.t < 600) return bestCache.id;
  bestCache.t = now; let best = '', bs = Infinity;
  for (const u of C.RIG) {
    if (!u.unl(S)) continue; const L = C.rigLv(S, u.id); if (L >= C.rigCap(S, u)) continue;
    const d = C.rigDelta(S, u.id); if (d <= 0) continue;
    const sc = C.rigCost(S, u, L) / d; if (sc < bs) { bs = sc; best = u.id; }
  }
  bestCache.id = best; return best;
}
function vRig(cat) {
  const items = C.RIG.filter(u => u.cat === cat);
  const tiles = {};
  return {
    sig: () => items.map(u => u.unl(S) ? 1 : 0).join() + C.NODES[S.node],
    build(r) {
      const titles = { cmp: 'Compute', th: 'Thermal', ing: 'Ingress', pw: 'Power', rk: 'The Rack', occ: 'The Occult', crp: 'The Crypt', alt: 'The Altar', aby: 'The Abyss' };
      r.append(h('h2', '', titles[cat]));
      const hints = { cmp: 'Output upgrades. Every level multiplies your cycles. A die shrink raises the level caps.', th: 'Cooling keeps you overclocked longer. Heat above 100% throttles the chip.', ing: 'Ingress feeds the client rack: faster contracts, bigger payouts, better interrupts.', pw: 'Clean power: steady output and stronger overclock.', rk: 'Upgrade the rack itself: richer sleds, more bays, cold aisles and cabling.', occ: 'Forbidden parts. Each is a small bargain with the dark, paid for in cycles.', crp: 'A vault beneath the chip. Every upgrade attaches to the view: coffins of data, bone ribs, ravens, ghouls.', alt: 'A rite of fire and blood. Candles, a chalice, standing stones and a scrying orb appear as you buy them.', aby: 'Something old looks back. Tentacles, floating eyes, a void portal and a tide of whispers.' };
      r.append(h('div', 'note', hints[cat]));
      const g = h('div', 'grid'); r.append(g);
      items.forEach(u => {
        const t = h('div', 'tile');
        if (!u.unl(S)) { t.classList.add('max'); t.append(h('div', 'tg', u.tag), h('div', 'nm', '???'), h('div', 'nt', 'Keep growing to reveal this part.')); g.append(t); return; }
        const lv = h('span', 'lv'), best = h('span', 'tag-best', 'BEST BUY');
        const ba = h('div', 'ba'), nt = h('div', 'nt', u.note);
        const bar = h('div', 'tbar'); const bi = h('i'); bar.append(bi);
        const b = h('button', 'buy'); const bs = h('span'), bl = h('small', '', 'UPGRADE'); b.append(bs, bl);
        b.onclick = () => { C.buyRig(S, u.id); };
        t.append(h('div', 'tg', u.tag), h('div', 'nm', u.n), lv, best, ba, nt, bar, b); g.append(t);
        tiles[u.id] = { t, lv, best, ba, bi, b, bs, bl, u };
      });
    },
    upd() {
      const bid = bestRig();
      for (const id in tiles) {
        const T = tiles[id], u = T.u, L = C.rigLv(S, id), cap = C.rigCap(S, u);
        setT(T.lv, 'LV ' + L + '/' + cap);
        const a = u.f(C.rigVal(S, u, L)), max = L >= cap;
        let txt = max ? a : a + ' → ' + u.f(C.rigVal(S, u, L + 1));
        if (!max && !(L === 0 && false)) { const d = C.rigDelta(S, id), c0 = C.cps(S); if (d > 0 && c0 > 0) txt += '  (+' + (d / c0 * 100).toFixed(1) + '%)'; }
        setT(T.ba, txt);
        T.bi.style.width = pct(L, cap) + '%';
        const c = max ? 0 : C.rigCost(S, u, L);
        setT(T.bs, max ? 'MAX' : F(c)); setT(T.bl, max ? 'MAXED' : 'UPGRADE');
        setC(T.b, 'off', max || S.c < c);
        setC(T.t, 'max', max); setC(T.t, 'best', bid === id && !max);
        show(T.best, bid === id && !max);
      }
    }
  };
}

// ---------- WORK ----------
function vProcs() {
  const ps = () => C.PROCS.filter(p => p.u <= S.node);
  const rows = {}, slots = [];
  return {
    sig: () => ps().length + '/' + S._M.thr + '/' + (C.dOn(S, 'scribe') ? 1 : 0),
    build(r) {
      r.append(h('h2', '', 'Threads'));
      for (let k = 0; k < S._M.thr; k++) {
        const s = h('div', 'slot'); const sn = h('span', 'sn'), sb = h('div', 'sb'), si = h('i'), sp = h('span', 'sp'); sb.append(si); s.append(sn, sb, sp); r.append(s);
        slots.push({ sn, si, sp });
      }
      r.append(h('h2', '', 'Incantations'));
      r.append(h('div', 'note', 'Incantations cost cycles and run on a free thread. Most pay data for the Grimoire.'));
      ps().forEach(p => {
        const row = h('div', 'row'), info = h('div', 'info');
        const rw = p.r.data ? '+' + 'data' : p.r.cool ? 'cools ' + p.r.cool + '%' : 'bursts cycles';
        info.append(h('div', 'nm', p.n), h('div', 'sub', p.d)); const rs = h('div', 'sub tl'); info.append(rs);
        const b = h('button', 'buy act'); const bs = h('span'), bl = h('small', '', 'RUN ' + p.t + 's'); b.append(bs, bl);
        b.onclick = () => { if (!C.startProc(S, p.id)) toast(S.q.length >= S._M.thr ? 'No free thread' : 'Not enough cycles'); };
        row.append(info, b);
        if (C.dOn(S, 'scribe') && (p.r.data || p.id === 'fsck' || p.id === 'cron')) {
          const a = h('button', S.pOn[p.id] === false ? '' : 'on', 'AUTO'); a.style.cssText = 'width:52px;font-size:9px;padding:4px'; a.onclick = () => { S.pOn[p.id] = S.pOn[p.id] === false; a.className = S.pOn[p.id] === false ? '' : 'on'; };
          row.append(a);
        }
        r.append(row); rows[p.id] = { p, rs, b, bs };
      });
    },
    upd() {
      slots.forEach((s, k) => {
        const q = S.q[k];
        if (q) { const d = C.PM[q.id]; setT(s.sn, d.n); s.si.style.width = pct(q.t, d.t) + '%'; setT(s.sp, Math.max(0, Math.ceil((d.t - q.t) / S._M.ps)) + 's'); }
        else { setT(s.sn, 'idle'); s.si.style.width = '0'; setT(s.sp, ''); }
      });
      for (const id in rows) {
        const R = rows[id], p = R.p, c = C.procCost(S, p);
        const rw = p.r.data ? '+' + F(p.r.data * C.dataMult(S)) + ' data' : p.r.cool ? 'Cools ' + p.r.cool + '% of heat' : '+' + F(C.cps(S) * p.r.burst) + ' cycles';
        setT(R.rs, rw); setT(R.bs, F(c)); setC(R.b, 'off', S.c < c || S.q.length >= S._M.thr);
      }
    }
  };
}
function vClients() {
  let nodes = [];
  return {
    sig: () => 'c',
    build(r) {
      r.append(h('h2', '', 'Pact board'));
      r.append(h('div', 'note', 'Patrons send requests on their own, even while you are away. Each pact is a pile of requests; when the bar fills, you are paid cycles and data. Five pacts make one board. Clear a board and a sled slides into your rack (+3% cycles each, max 12). Upgrading Ingress parts (NIC, balancer, edge cache) makes contracts fill faster and pay more. You do not need to tap anything.'));
      const bd = h('div', 'board'); for (let k = 0; k < 5; k++) { const n = h('div', 'node', '#' + (k + 1)); n.append(h('i')); bd.append(n); nodes.push(n); } r.append(bd);
      const p = h('div', 'panel');
      p.append(h('div', 'prow')); const pr = p.firstChild; const cn = h('b', 'tl'), st = h('span', 'sub'); pr.append(cn, st);
      const ds = h('div', 'sub'); const bar = h('div', 'bar grn'), bi = h('i'); bar.append(bi);
      const rw = h('div', 'sub'), sp = h('div', 'sub');
      const sb = h('button', 'buy'); const sbs = h('span'), sbl = h('small'); sb.append(sbs, sbl); sb.style.marginTop = '8px';
      sb.onclick = () => { if (!C.speedUp(S)) toast(S._su > 0 ? 'Cooling down' : 'Needs data'); };
      p.append(ds, bar, rw, sp, sb); r.append(p);
      r.append(h('h2', '', 'Rack'));
      const rk = h('div', 'panel'); const rs = h('div', 'sub'); rk.append(rs); r.append(rk);
      r.append(h('div', 'note', 'Clear a board of five contracts to slide a sled into the rack. Each sled adds cycles; bays cap how many fit. Upgrade the rack in FORGE, Rack. Upgrade the part a client stresses to finish faster.'));
      this.e = { cn, st, ds, bi, rw, sp, sb, sbs, sbl, rs };
    },
    upd() {
      const E = this.e, i = C.ctInfo(S);
      nodes.forEach((n, k) => { setC(n, 'done', k < i.k); setC(n, 'now', k === i.k); if (k === i.k) n.lastChild.style.width = pct(i.p, i.size) + '%'; });
      setT(E.cn, i.cl.n); setT(E.st, 'stresses ' + C.STRESS_NAME[i.key]);
      setT(E.ds, i.cl.d); E.bi.style.width = pct(i.p, i.size) + '%';
      setT(E.rw, 'Pays ' + F(i.rew.c) + ' cycles + ' + F(i.rew.d) + ' data');
      setT(E.sp, F(i.rate) + ' req/s · ' + (i.left < 1 ? '<1' : Math.ceil(i.left)) + 's left');
      setT(E.sbs, S._su > 0 ? 'COOLING ' + Math.ceil(S._su) + 's' : 'SURGE ' + F(C.speedCost(S)) + ' data'); setT(E.sbl, 'Instantly push 20s of requests');
      setC(E.sb, 'off', S._su > 0 || S.data < C.speedCost(S));
      setT(E.rs, 'Sleds ' + S.sled + '/' + C.maxSleds(S) + ' · +' + ((C.sledMult(S) - 1) * 100).toFixed(1) + '% cycles · boards cleared ' + S.st.boards + ' · upgrade it in FORGE, Rack');
    }
  };
}

// ---------- LAB ----------
function vLab() {
  const rows = {}, rr = {};
  return {
    sig: () => (C.rrOpen(S) ? 1 : 0) + '' + C.NODES[S.node],
    build(r) {
      const top = h('div', 'panel'); const dl = h('div', 'prow'); const dv = h('b', 'tl'); dl.append(h('span', 'lbl', 'Data'), dv); top.append(dl); r.append(top); this.dv = dv;
      let branch = '';
      C.RES.forEach(x => {
        if (x.b !== branch) { branch = x.b; r.append(h('h2', '', branch)); }
        const row = h('div', 'row'), info = h('div', 'info');
        info.append(h('div', 'nm', x.n), h('div', 'sub', x.d));
        const b = h('button', 'buy act'); const bs = h('span'), bl = h('small', '', 'RESEARCH'); b.append(bs, bl);
        b.onclick = () => { C.buyRes(S, x.id); };
        row.append(info, b); r.append(row); rows[x.id] = { x, row, b, bs, bl };
      });
      if (C.rrOpen(S)) {
        r.append(h('h2', '', 'Repeatable'));
        r.append(h('div', 'note', 'Endless levels that turn spare data into slow, steady growth. Reset on a die shrink.'));
        C.RR.forEach(x => {
          const row = h('div', 'row'), info = h('div', 'info'); const nm = h('div', 'nm'); const own = h('span', 'own'); nm.append(x.n, own);
          info.append(nm, h('div', 'sub', x.d));
          const b = h('button', 'buy act'); const bs = h('span'), bl = h('small'); b.append(bs, bl); b.onclick = () => { C.buyRR(S, x.id); };
          row.append(info, b); r.append(row); rr[x.id] = { x, own, b, bs, bl };
        });
      }
    },
    upd() {
      setT(this.dv, F(S.data));
      for (const id in rows) {
        const R = rows[id], x = R.x, have = !!S.res[id], lock = x.req && !S.res[x.req];
        setC(R.row, 'have', have); setC(R.row, 'lock', lock && !have);
        setT(R.bs, have ? 'OWNED' : F(x.c)); setT(R.bl, have ? '' : lock ? 'LOCKED' : 'RESEARCH');
        setC(R.b, 'off', have || lock || S.data < x.c);
      }
      for (const id in rr) {
        const R = rr[id], L = S.rr[id] || 0, cap = C.rrCap(S), c = C.rrCost(S, R.x);
        setT(R.own, 'LV ' + L + '/' + cap); setT(R.bs, L >= cap ? 'MAX' : F(c)); setT(R.bl, 'LEVEL UP');
        setC(R.b, 'off', L >= cap || S.data < c);
      }
    }
  };
}

// ---------- REBIRTH ----------
function vReboot() {
  const mrows = {}, mil = [];
  return {
    sig: () => String(S.st.reb >= 5) + (S.st.reb >= 10) + (S.st.reb >= 25) + (S.st.reb >= 50),
    build(r) {
      r.append(h('h2', '', 'Reboot'));
      const p = h('div', 'panel'); const l1 = h('div', 'prow'), l2 = h('div', 'prow'), l3 = h('div', 'sub');
      const gv = h('b', 'grn'), mv = h('b', 'tl'); l1.append(h('span', 'lbl', 'Microcode on reboot'), gv); l2.append(h('span', 'lbl', 'Microcode held'), mv);
      p.append(l1, l2, l3); r.append(p);
      const bb = h('button', 'bigbtn'); r.append(bb); armBtn(bb, 'REBOOT', () => { if (C.reboot(S)) { toast('Rebooted'); SCENE.pulse('board'); } });
      r.append(h('div', 'note', 'Resets cycles, units and heat. Keeps rig, microcode, daemons and the die. Microcode multiplies cycles for good.'));
      r.append(h('h2', '', 'Boot mode'));
      const md = h('div', 'modes'); r.append(md);
      C.MODE_IDS.forEach(id => {
        const m = C.MODES[id]; const b = h('button', ''); b.append(h('b', '', m.n), h('small', '', m.d + (m.mx > 1 ? ' µ ×' + m.mx : '')));
        b.onclick = () => { if (C.setMode(S, id)) toast('Next boot: ' + m.n); }; md.append(b); mrows[id] = { b, m };
      });
      r.append(h('div', 'note', 'Applied on the next reboot. The active mode multiplies the microcode that run pays.'));
      r.append(h('h2', '', 'Milestones'));
      C.MIL.forEach(m => { const row = h('div', 'ach'); const mk = h('span', 'mk'); row.append(mk, h('span', '', m.n + ' reboots · ' + m.t + ' — ' + m.d)); r.append(row); mil.push({ row, mk, m }); });
      this.e = { gv, mv, l3, bb };
    },
    upd() {
      const E = this.e, g = C.muGain(S);
      setT(E.gv, '+' + FI(g) + ' µ'); setT(E.mv, FI(S.mu) + ' µ (lifetime ' + FI(S.muT) + ')');
      setT(E.l3, g > 0 ? 'Next +1 µ at ' + F(C.muNext(S)) + ' run cycles (now ' + F(S.run) + ')' : 'Reach ' + F(C.muNext(S)) + ' cycles in one run (now ' + F(S.run) + ')');
      setC(E.bb, 'off', g < 1);
      for (const id in mrows) { const R = mrows[id], ok = S.st.reb >= R.m.need; setC(R.b, 'off', !ok); setC(R.b, 'act', S.nmode === id); R.b.style.opacity = ok ? '' : '.45'; if (!ok) setT(R.b.lastChild, 'Needs ' + R.m.need + ' reboots'); }
      mil.forEach(R => { const ok = S.st.reb >= R.m.n; setT(R.mk, ok ? '◆' : '◇'); setC(R.row, 'no', !ok); });
    }
  };
}
function vShop() {
  const rows = {};
  return {
    sig: () => C.SHOP.map(s => (!s.req || S.shop[s.req]) ? 1 : 0).join(''),
    build(r) {
      const top = h('div', 'panel'); const pr = h('div', 'prow'); const mv = h('b', 'tl'); pr.append(h('span', 'lbl', 'Microcode'), mv); top.append(pr); r.append(top); this.mv = mv;
      r.append(h('div', 'note', 'Permanent until a die shrink, which refunds what you spent here.'));
      C.SHOP.forEach(s => {
        if (s.req && !S.shop[s.req] && !S.shop[s.id]) return;
        const row = h('div', 'row'), info = h('div', 'info'); info.append(h('div', 'nm', s.n), h('div', 'sub', s.d));
        const b = h('button', 'buy act'); const bs = h('span'), bl = h('small', '', 'µ'); b.append(bs, bl); b.onclick = () => { C.buyShop(S, s.id); };
        row.append(info, b); r.append(row); rows[s.id] = { s, row, b, bs, bl };
      });
    },
    upd() {
      setT(this.mv, FI(S.mu) + ' µ');
      for (const id in rows) { const R = rows[id], have = !!S.shop[id]; setC(R.row, 'have', have); setT(R.bs, have ? 'OWNED' : FI(R.s.c)); setT(R.bl, have ? '' : 'µ'); setC(R.b, 'off', have || S.mu < R.s.c); }
    }
  };
}
function vDaemons() {
  const rows = {};
  return {
    sig: () => C.DAEMONS.map(d => S.dm[d.id] ? 1 : 0).join(),
    build(r) {
      const top = h('div', 'panel'); const pr = h('div', 'prow'); const mv = h('b', 'tl'); pr.append(h('span', 'lbl', 'Microcode'), mv); top.append(pr); r.append(top); this.mv = mv;
      r.append(h('div', 'note', 'Daemons stay bound through reboots and shrinks. Blind boot silences them.'));
      C.DAEMONS.forEach(d => {
        const row = h('div', 'row'), info = h('div', 'info'); info.append(h('div', 'nm', d.n), h('div', 'sub', d.d));
        const b = h('button', 'buy act'); const bs = h('span'), bl = h('small'); b.append(bs, bl);
        b.onclick = () => { const o = S.dm[d.id]; if (o && o.own) { o.on = !o.on; } else C.buyDaemon(S, d.id); };
        row.append(info, b); r.append(row); rows[d.id] = { d, row, b, bs, bl };
      });
    },
    upd() {
      setT(this.mv, FI(S.mu) + ' µ');
      for (const id in rows) {
        const R = rows[id], o = S.dm[id];
        if (o && o.own) { setT(R.bs, o.on ? 'ON' : 'OFF'); setT(R.bl, 'TAP TO SWITCH'); setC(R.b, 'off', false); setC(R.row, 'have', o.on); }
        else { setT(R.bs, FI(R.d.c) + ' µ'); setT(R.bl, 'BIND'); setC(R.b, 'off', S.mu < R.d.c); }
      }
    }
  };
}
function vShrink() {
  let nodes = [];
  return {
    sig: () => 'n' + S.node,
    build(r) {
      r.append(h('h2', '', 'Die shrink'));
      const bd = h('div', 'board'); bd.style.flexWrap = 'wrap';
      C.NODES.forEach((n, i) => { const e = h('div', 'node', n); e.style.cssText = 'flex:1 0 14%;margin:0 0 -1px -1px'; bd.append(e); nodes.push(e); }); r.append(bd);
      const p = h('div', 'panel'); const i1 = h('div', 'prow'), i2 = h('div', 'sub'), i3 = h('div', 'sub');
      const nv = h('b', 'tl'), rq = h('span', 'sub'); i1.append(nv, rq);
      const bar = h('div', 'bar'), bi = h('i'); bar.append(bi); p.append(i1, bar, i2, i3); r.append(p);
      const sb = h('button', 'bigbtn v'); r.append(sb);
      armBtn(sb, 'SHRINK THE DIE', () => { if (C.shrink(S)) { toast('Die shrunk to ' + C.NODES[S.node]); SCENE.pulse('board'); } });
      r.append(h('div', 'note', 'Each shrink: ×2.5 cycles, new units, more threads, higher rig caps, longer offline time. Resets the run, lab and shop (shop microcode is refunded). The next shrink costs more lifetime microcode.'));
      this.e = { nv, rq, bi, i2, i3, sb };
    },
    upd() {
      const E = this.e;
      nodes.forEach((e, i) => { setC(e, 'done', i < S.node); setC(e, 'now', i === S.node); });
      if (S.node >= 12) { setT(E.nv, 'Final node: 2nm'); setT(E.rq, ''); E.bi.style.width = '100%'; setT(E.i2, 'There is nothing finer.'); setT(E.i3, ''); setC(E.sb, 'off', true); return; }
      const need = C.REQ[S.node];
      setT(E.nv, C.NODES[S.node] + ' → ' + C.NODES[S.node + 1]); setT(E.rq, FI(S.muT) + ' / ' + FI(need) + ' µ');
      E.bi.style.width = pct(S.muT, need) + '%';
      setT(E.i2, 'Unlocks: ' + C.nodeNote(S.node + 1)); setT(E.i3, 'Lifetime microcode counts, including what the shrink itself pays out.');
      setC(E.sb, 'off', !C.canShrink(S));
    }
  };
}
function vAscend() {
  const rows = {};
  return {
    sig: () => Object.keys(S.qp).join(),
    build(r) {
      r.append(h('h2', '', 'Ascension'));
      const p = h('div', 'panel'); const a = h('div', 'prow'), b = h('div', 'prow'), c = h('div', 'sub');
      const qv = h('b', 'tl'), gv = h('b', 'grn'); a.append(h('span', 'lbl', 'Qubits'), qv); b.append(h('span', 'lbl', 'On ascend'), gv); p.append(a, b, c); r.append(p);
      const bb = h('button', 'bigbtn v'); r.append(bb);
      armBtn(bb, 'ASCEND', () => { if (C.ascend(S)) { toast('Ascended'); SCENE.pulse('board'); } });
      r.append(h('div', 'note', 'Burns microcode, the shop, the lab and the die into qubits. Each qubit: +50% cycles, +10% microcode gain. Spend them on perks below, then climb faster.'));
      r.append(h('h2', '', 'Perks'));
      C.QP.forEach(q => {
        if (q.req && !S.qp[q.req] && !S.qp[q.id]) return;
        const row = h('div', 'row'), info = h('div', 'info'); info.append(h('div', 'nm', q.n), h('div', 'sub', q.d));
        const bt = h('button', 'buy act'); const bs = h('span'), bl = h('small', '', 'QUBITS'); bt.append(bs, bl); bt.onclick = () => { C.buyQP(S, q.id); };
        row.append(info, bt); r.append(row); rows[q.id] = { q, row, bt, bs, bl };
      });
      this.e = { qv, gv, c, bb };
    },
    upd() {
      const E = this.e, g = C.qGain(S);
      setT(E.qv, S.qb + ' (total ' + S.qbT + ')'); setT(E.gv, '+' + g + ' Q');
      setT(E.c, g > 0 ? 'Next qubit at ' + FI(C.qNext(S)) + ' lifetime µ' : 'Needs ' + FI(C.ASC_MU) + ' lifetime µ (now ' + FI(S.muT) + ')');
      setC(E.bb, 'off', g < 1);
      for (const id in rows) { const R = rows[id], have = !!S.qp[id]; setC(R.row, 'have', have); setT(R.bs, have ? 'OWNED' : R.q.c + ' Q'); setT(R.bl, have ? '' : 'QUBITS'); setC(R.bt, 'off', have || S.qb < R.q.c); }
    }
  };
}

// ---------- MORE ----------
function vStats() {
  const keys = [];
  return {
    build(r) {
      r.append(h('h2', '', 'Statistics'));
      const g = h('div', 'cols'); r.append(g);
      [['Total cycles', () => F(S.tot)], ['This run', () => F(S.run)], ['Output', () => F(C.cps(S)) + '/s'], ['Play time', () => fmtTime(S.t)],
       ['Ticks', () => FI(S.st.taps)], ['Reboots', () => FI(S.st.reb)], ['Die shrinks', () => FI(S.st.shr)], ['Ascensions', () => FI(S.st.asc)],
       ['Microcode earned', () => FI(S.st.muAll)], ['Tasks done', () => FI(S.st.proc)], ['Contracts', () => FI(S.st.cont)], ['Boards cleared', () => FI(S.st.boards)],
       ['Interrupts', () => FI(S.st.irq)], ['Omens heeded', () => FI(S.st.omen || 0)], ['Throttles', () => FI(S.st.thr)], ['Overclocked', () => fmtTime(S.st.ocT)], ['Forge levels', () => FI(C.rigTotal(S))],
       ['Seal bonus', () => '+' + (1.2 * S._ac).toFixed(1) + '%'], ['Offline cap', () => S._M.off.toFixed(1) + ' h']
      ].forEach(([k, f]) => { const a = h('span', '', k), b = h('span'); g.append(a, b); keys.push([b, f]); });
    },
    upd() { keys.forEach(([b, f]) => setT(b, f())); }
  };
}
function vGuide() {
  return {
    build(r) {
      r.append(h('h2', '', 'Guide'));
      r.append(h('div', 'note', 'Topics open as you discover the systems.'));
      C.HELP.forEach(t => {
        const ok = t.u(S), d = h('details', 'help' + (ok ? '' : ' lk')); d.append(h('summary', '', ok ? t.t : '???'));
        d.append(h('p', '', ok ? t.b : 'Keep playing to uncover this.'));
        if (!ok) d.addEventListener('click', e => e.preventDefault());
        r.append(d);
      });
      const b = h('button', 'bigbtn'); b.textContent = 'REPLAY INTRO'; b.style.marginTop = '12px'; b.onclick = () => intro(); r.append(b);
    }
  };
}
function vSeals() {
  const rows = [];
  return {
    build(r) {
      r.append(h('h2', '', 'Seals'));
      const t = h('div', 'note'); r.append(t); this.t = t;
      C.ACH.forEach(a => { const row = h('div', 'ach'); const mk = h('span', 'mk'); row.append(mk, h('span', '', a.n + ' — ' + a.d)); r.append(row); rows.push([a, row, mk]); });
    },
    upd() {
      setT(this.t, S._ac + '/' + C.ACH.length + ' broken · each gives +1.2% cycles');
      rows.forEach(([a, row, mk]) => { const ok = !!S.ach[a.id]; setT(mk, ok ? '◆' : '◇'); setC(row, 'no', !ok); });
    }
  };
}
function vLog() {
  return {
    sig: () => String(S.log.length) + (S.log[0] ? S.log[0].t : 0),
    build(r) {
      r.append(h('h2', '', 'Chronicle'));
      if (!S.log.length) r.append(h('div', 'note', 'Nothing yet.'));
      S.log.forEach(l => { const d = h('div', 'logl'); d.append(h('span', '', fmtTime(l.t)), l.m); r.append(d); });
    }
  };
}
let wl = null;
async function wake(on) { try { if (on && navigator.wakeLock) wl = await navigator.wakeLock.request('screen'); else if (wl) { await wl.release(); wl = null; } } catch (e) {} }
function vSettings() {
  return {
    build(r) {
      r.append(h('h2', '', 'Settings'));
      const tog = (label, get, set) => { const row = h('div', 'tog'); row.append(h('span', '', label)); const b = h('button', get() ? 'on' : '', get() ? 'ON' : 'OFF'); b.onclick = () => { set(); b.className = get() ? 'on' : ''; b.textContent = get() ? 'ON' : 'OFF'; }; row.append(b); r.append(row); };
      tog('Scientific notation', () => S.set.sci, () => { S.set.sci = !S.set.sci; });
      tog('Keep screen awake', () => S.set.wake, () => { S.set.wake = !S.set.wake; wake(S.set.wake); });
      if (S.dm.cycle && S.dm.cycle.own) {
        const row = h('div', 'tog'); row.append(h('span', '', 'Cycles daemon reboots at')); const b = h('button', '', '×' + C.ARS[S.set.ar] + ' held µ');
        b.onclick = () => { S.set.ar = (S.set.ar + 1) % C.ARS.length; b.textContent = '×' + C.ARS[S.set.ar] + ' held µ'; }; row.append(b); r.append(row);
      }
      r.append(h('h2', '', 'Save'));
      const ta = h('textarea'); ta.rows = 4; ta.placeholder = 'Paste a save code here to import'; r.append(ta);
      const row = h('div', 'btns'); row.style.cssText = 'display:flex;gap:8px;margin:8px 0';
      const ex = h('button', '', 'EXPORT'), im = h('button', '', 'IMPORT'); ex.style.flex = im.style.flex = '1';
      ex.onclick = () => { save(); ta.value = btoa(unescape(encodeURIComponent(JSON.stringify(C.serialize(S))))); ta.select(); try { navigator.clipboard.writeText(ta.value); toast('Save copied'); } catch (e) { toast('Select and copy the code'); } };
      im.onclick = () => { try { const o = JSON.parse(decodeURIComponent(escape(atob(ta.value.trim())))); S = C.deserialize(o); save(); toast('Imported'); rebuild(true); } catch (e) { toast('That code is not valid'); } };
      row.append(ex, im); r.append(row);
      const hr = h('button', 'bigbtn'); r.append(hr);
      armBtn(hr, 'ERASE EVERYTHING', () => { try { localStorage.removeItem(KEY); } catch (e) {} S = C.newState(); save(); location.reload(); });
      r.append(h('div', 'note', 'Progress is stored on this device only. Export a code to move it elsewhere.'));
    }
  };
}

// ---------- onboarding and coach ----------
const INTRO = [
  { t: 'The silicon wakes', b: 'You are a dead processor: a dark slab of silicon sleeping beneath the stone. Every cycle you earn wakes something older inside it. Tick the clock to begin.', skip: 1 },
  { t: 'Spend cycles on units', b: 'Open the FORGE, then Units. Buy Transistors, then Logic Gates and beyond. Each tier feeds the one below it, and 25, 50, 100 and 200 owned doubles a unit.' },
  { t: 'The schematic grows', b: 'The panel at the top is your machine. Outlines are parts you have not built yet. New modules appear as you buy upgrades and reach new totals.' },
  { t: 'Follow the goal bar', b: 'The bar under the header always shows the next goal, with a small reward. The tip line under it reacts to what is happening. Everything is explained in the CODEX, Guide.', ok: 'Start' }
];
function intro() { modal(INTRO, () => { S.tut.intro = 1; save(); }); }
const COACH = [
  ['cmp', () => S.un.cmp, 'The Forge stirs', 'The FORGE now has a Compute tab. Upgrade Clock and Cores: each tile shows the value before and after. A new Clock module just appeared on the schematic.'],
  ['oc', () => S.un.oc, 'Overclock', 'The OVERCLOCK button multiplies all output but builds heat. At 100% heat the chip throttles. Thermal upgrades (heatsink, fans) let you push longer. Airflow modules have spawned on the schematic.'],
  ['pr', () => S.un.pr, 'Rites and the Grimoire', 'RITES casts incantations on threads for data, and the GRIMOIRE spends data on permanent research. Keep every thread busy.'],
  ['ct', () => S.un.ct, 'Patrons arrive', 'RITES, Pacts: finish pacts in boards of five. A NIC module is now on the schematic. Clear boards to slide sleds into the rack for a permanent bonus.'],
  ['pw', () => S.un.pw, 'Clean power', 'The FORGE now has a Power tab. PSU and VRM upgrades raise output and overclock strength.'],
  ['rb', () => S.un.rb, 'Reboot', 'REBIRTH lets you reboot: reset the run for microcode that multiplies everything for good. The first reboot is best done once the reward is more than a trickle.'],
  ['dm', () => S.un.dm, 'Daemons', 'Microcode can bind daemons that automate the game: buying, ticking, overclock, research and more. They survive reboots.'],
  ['bd', () => S.g[8] > 0, 'Board view', 'A Chiplet appeared. The schematic now has a BOARD view, and later a RACK view, selectable on its top-left corner.'],
  ['shr', () => S.node >= 1, 'Finer stone', 'The die is smaller. Units from higher tiers unlock per node, rig caps rise by 4, and the cost of future upgrades climbs with your power.'],
  ['rk', () => S.sled > 0 || S.st.boards > 0, 'The rack is yours', 'Your first sled slid into the rack. FORGE now has a Rack tab: richer sleds, more bays, cold aisles and faster pacts.'],
  ['occ', () => S.node >= 1 || S.st.reb >= 2, 'The Occult', 'The old stone whispers. FORGE now has an Occult tab with forbidden parts: runic etching, a watching eye, a gargoyle heatsink, and more that wake as you reboot and shrink the die.'],
  ['crp', () => S.node >= 2, 'The Crypt', 'A vault opened beneath the chip. DOMAIN, The Crypt: every upgrade you buy attaches to the CRYPT view: coffins of data, bone ribs, ravens and ghouls.'],
  ['alt', () => S.node >= 4, 'The Altar', 'An altar rose from the stone. DOMAIN, The Altar: candles, a blood chalice, standing stones and a scrying orb. More cycles, more microcode.'],
  ['aby', () => S.node >= 6, 'The Abyss', 'The floor gave way. DOMAIN, The Abyss: tentacles, floating eyes, a void portal and the tide of whispers. Something looks back.'],
  ['asc', () => S.un.asc, 'Ascension', 'You are close to the third reset. REBIRTH, Ascend turns lifetime microcode into qubits: permanent multipliers and perks that let you restart further along.']
];
function coachCheck() {
  if (modalOpen || !S.tut.intro) return;
  for (const c of COACH) if (!S.tut.seen[c[0]] && c[1]()) { S.tut.seen[c[0]] = 1; modal({ t: c[2], b: c[3] }); save(); return; }
}

function omenModal() {
  if (modalOpen) return; modalOpen = true;
  const m = $('#modal'); m.innerHTML = '';
  const b = h('div', 'box'); b.append(h('h3', '', 'A voice in the dark'));
  b.append(h('p', '', 'The silicon hums a tune no one taught it. Three roads open before you.'));
  C.OMEN.forEach((o, i) => {
    const btn = h('button', i === 1 ? 'bigbtn v' : 'bigbtn');
    btn.style.cssText = 'margin:6px 0;text-align:left;padding:10px 12px';
    btn.append(h('div', '', o.n.toUpperCase())); const sm = h('small', '', o.d); sm.style.cssText = 'display:block;font:italic 400 12px var(--lore);letter-spacing:0;text-transform:none;margin-top:3px;opacity:.85'; btn.append(sm);
    btn.onclick = () => { const msg = C.omen(S, i); closeModal(); if (msg) { toast(msg); SCENE.pulse('board'); } };
    b.append(btn);
  });
  const later = h('button', '', 'Leave it'); later.style.cssText = 'width:100%;margin-top:4px'; later.onclick = closeModal; b.append(later);
  m.append(b); m.hidden = false;
}

// ---------- scene views ----------
let sceneView = 'chip', knownViews = 1;
function renderViews() {
  const vs = SCENE.views(S), box = $('#views');
  if (vs.length > knownViews) { sceneView = vs[vs.length - 1]; }
  knownViews = vs.length;
  if (vs.indexOf(sceneView) < 0) sceneView = 'chip';
  const sig = vs.join() + sceneView;
  if (box._sig === sig) return; box._sig = sig; box.innerHTML = '';
  if (vs.length < 2) { const b = h('button', 'act', 'CHIP'); box.append(b); return; }
  vs.forEach(v => { const b = h('button', v === sceneView ? 'act' : '', v.toUpperCase()); b.onclick = () => { sceneView = v; renderViews(); }; box.append(b); });
}

// ---------- HUD ----------
const TITLES = ['Dormant Shard', 'Stirring Shard', 'Awakened Slab', 'Hungering Slab', 'Shaper of Light', 'Whispering Die', 'Burning Die', 'Ancient Wafer', 'Vast Wafer', 'Eldritch Wafer', 'Abyssal Wafer', 'Primordial Wafer', 'Sovereign Mind'];
const el = { cyc: $('#cyc'), cps: $('#cps'), mult: $('#mult'), heatv: $('#heatv'), heat: $('#heatbar'), node: $('#node'), gtag: $('#gtag'), gtxt: $('#gtxt'), gnum: $('#gnum'), gfill: $('#gfill'), goal: $('#goal'),
  hc: $('#hintchip'), htag: $('#htag'), htxt: $('#htxt'), tick: $('#tickbtn'), tickv: $('#tickv'), oc: $('#ocbtn'), ocv: $('#ocv'), irq: $('#irq') };
function hud() {
  setT($('#lore'), S.log[0] ? S.log[0].m : 'The silicon sleeps.');
  setT(el.cyc, F(S.c));
  const c = C.cps(S);
  setT(el.cps, F(c) + '/s'); setT(el.mult, '×' + F(C.gMult(S)));
  const hp = C.heatPct(S);
  setT(el.heatv, Math.round(hp) + '%' + (S.thr ? ' THROTTLE' : ''));
  el.heat.style.width = hp + '%'; el.heat.style.background = S.thr ? 'var(--red)' : hp > 70 ? 'var(--amb)' : 'var(--grn)';
  setT(el.node, C.NODES[S.node] + ' · ' + TITLES[S.node] + (S.qbT ? ' · Q' + S.qbT : ''));
  const gi = C.goalInfo(S);
  show(el.goal, !!gi);
  if (gi) { setT(el.gtag, gi.g.tag); setT(el.gtxt, gi.g.t); setT(el.gnum, gi.g.big ? F(gi.cur) + '/' + F(gi.max) : gi.cur + '/' + gi.max); el.gfill.style.width = pct(gi.cur, gi.max) + '%'; }
  const hn = C.hint(S);
  setT(el.htag, hn.tag); setT(el.htxt, hn.t); el.hc.className = 'hintchip ' + hn.tone;
  setT(el.tickv, '+' + F(C.tapValue(S, c)));
  show(el.oc, S.un.oc);
  if (S.un.oc) {
    setT(el.ocv, S._M.noOC ? 'LOCKED' : S.thr ? 'THROTTLED' : S.oc ? 'ON ×' + S._M.oc.toFixed(2) : 'OFF');
    setC(el.oc, 'on', S.oc); setC(el.oc, 'thr', S.thr);
  }
  el.irq.hidden = !S.irq;
  if (S.irq) setT(el.irq, (S.irq.k === 'o' ? 'AN OMEN' : S.irq.k === 'f' ? 'STORM' : S.irq.k === 'd' ? 'DATA PACKET' : 'INTERRUPT') + ' · TAP ' + Math.ceil(S.irq.l) + 's');
}

// ---------- events ----------
function handleEvents() {
  const ev = S._ev; if (!ev.length) return;
  for (const e of ev) {
    if (e.k === 'job') SCENE.pulse('job');
    else if (e.k === 'board') { SCENE.pulse('board'); toast('Board cleared. A sled slides in.'); }
    else if (e.k === 'goal') toast('Goal done: +' + F(e.c) + ' cycles' + (e.d ? ' +' + F(e.d) + ' data' : ''));
  }
  ev.length = 0;
}

// ---------- boot ----------
function init() {
  SCENE.init($('#scene'));
  const tp = el.tick;
  tp.addEventListener('pointerdown', e => { e.preventDefault(); const v = C.tap(S); floatTxt(e.clientX, e.clientY, '+' + F(v)); });
  tp.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); C.tap(S); } });
  el.oc.onclick = () => { if (!C.toggleOC(S)) toast(S._M.noOC ? 'Overclock is locked' : 'Chip is throttled'); };
  el.irq.onclick = () => {
    if (S.irq && S.irq.k === 'o') { omenModal(); return; }
    const m = C.clickIrq(S); if (m) { toast(m); SCENE.pulse('job'); }
  };
  $('#fold').onclick = () => { const s = $('#stage'); s.classList.toggle('fold'); $('#fold').textContent = s.classList.contains('fold') ? '▾' : '▴'; };
  // away time
  const away = (Date.now() - S.last) / 1000;
  if (away > 30 && S.tot > 0) {
    const c0 = S.c, got = C.offline(S, away); C.slow(S);
    if (got > 0) setTimeout(() => toast('Away ' + fmtTime(away) + ' · +' + F(S.c - c0) + ' cycles'), 600);
  }
  C.slow(S);
  knownViews = SCENE.views(S).length;
  setTab('rig');
  let last = performance.now(), lastSave = 0, lastUi = 0;
  function frame(ts) {
    const dt = Math.min(5, (ts - last) / 1000); last = ts;
    if (!document.hidden) {
      C.advance(S, dt);
      handleEvents();
      SCENE.draw(S, ts, sceneView);
      if (ts - lastUi > 200) {
        lastUi = ts; hud(); renderViews(); renderNav();
        if (view) { const s = view.sig ? view.sig() : ''; if (s !== view.s) rebuild(false); else view.upd && view.upd(); }
        coachCheck();
        const vs = subsFor(curTab); if (vs.length && !vs.find(x => x[0] === curSub[curTab])) setSub(vs[0][0]);
      }
      if (ts - lastSave > 10000) { lastSave = ts; save(); }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else { const a = (Date.now() - S.last) / 1000; last = performance.now(); if (a > 5) { const c0 = S.c; C.advance(S, a); if (a > 60) toast('Away ' + fmtTime(a) + ' · +' + F(S.c - c0) + ' cycles'); } if (S.set.wake) wake(true); }
  });
  window.addEventListener('pagehide', save);
  if (!S.tut.intro) setTimeout(intro, 300);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.__ds = { get S() { return S; }, C, setTab, setSub };
init();
})();
