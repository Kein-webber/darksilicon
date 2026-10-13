(function () {
'use strict';
const C = CORE, G = C.GENS;
const KEY = 'darksilicon_v1';
const $ = s => document.querySelector(s);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const setT = (e, t) => { if (e._t !== t) { e._t = t; e.textContent = t; } };
const setD = (e, v) => { if (e._d !== v) { e._d = v; e.disabled = v; } };
const show = (e, v) => { const d = v ? '' : 'none'; if (e._s !== d) { e._s = d; e.style.display = d; } };
const setC = (e, c, v) => { if (e._c !== undefined && e._c[c] === v) return; (e._c = e._c || {})[c] = v; e.classList.toggle(c, !!v); };

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

// ---------- shell ----------
let cur = 'core', view = null, navSig = '', seen = {};
const main = $('#main'), nav = $('#nav');
const TABS = [
  { id: 'core', n: 'Core', ok: () => true, build: buildCore },
  { id: 'tasks', n: 'Tasks', ok: () => S.un.pr, build: buildTasks },
  { id: 'lab', n: 'Lab', ok: () => S.un.pr, build: buildLab },
  { id: 'daemons', n: 'Daemons', ok: () => S.un.dm, build: buildDaemons },
  { id: 'reboot', n: 'Reboot', ok: () => S.un.rb, build: buildReboot },
  { id: 'more', n: 'More', ok: () => true, build: buildMore }
];
function setTab(id) {
  cur = id; seen[id] = 1;
  main.innerHTML = ''; main.scrollTop = 0;
  view = TABS.find(t => t.id === id).build(main);
  navSig = ''; renderNav();
}
function renderNav() {
  const vis = TABS.filter(t => t.ok());
  const sig = vis.map(t => t.id).join() + cur + vis.map(t => seen[t.id] ? 1 : 0).join('');
  if (sig === navSig) return;
  navSig = sig; nav.innerHTML = '';
  vis.forEach(t => {
    const b = h('button', (t.id === cur ? 'act ' : '') + (!seen[t.id] ? 'new' : ''), t.n);
    b.onclick = () => setTab(t.id);
    nav.append(b);
  });
}
function toast(m) {
  const d = h('div', '', m); $('#toasts').append(d);
  setTimeout(() => d.remove(), 3300);
}
function modal(title, body, label) {
  const m = $('#modal'); m.innerHTML = '';
  const b = h('div', 'box'); b.append(h('h3', '', title), h('p', '', body));
  const ok = h('button', '', label || 'Continue'); ok.onclick = () => { m.hidden = true; };
  b.append(ok); m.append(b); m.hidden = false;
}
function armBtn(b, label, fn) {
  b.textContent = label; let t = 0;
  b.onclick = () => {
    if (b.disabled) return;
    if (t) { clearTimeout(t); t = 0; b.textContent = label; b.classList.remove('arm'); fn(); }
    else { b.textContent = 'Tap again to confirm'; b.classList.add('arm'); t = setTimeout(() => { t = 0; b.textContent = label; b.classList.remove('arm'); }, 3000); }
  };
}
function floatTxt(x, y, t) {
  const fx = $('#fx'); if (fx.children.length > 14) return;
  const s = h('span', '', t); s.style.left = x + 'px'; s.style.top = y + 'px'; fx.append(s);
  setTimeout(() => s.remove(), 850);
}

// ---------- die map ----------
const COLS = 36, ROWS = 10, CNT = [8, 12, 16, 20, 28, 32, 48, 48, 48, 36, 36, 28];
const CELLT = []; CNT.forEach((n, t) => { for (let k = 0; k < n; k++) CELLT.push([t, k]); });
let dieCv = null;
function drawDie(ts) {
  if (!dieCv || cur !== 'core' || document.hidden) return;
  const w = dieCv.clientWidth, hh = dieCv.clientHeight, dpr = window.devicePixelRatio || 1;
  if (!w) return;
  if (dieCv.width !== Math.round(w * dpr)) { dieCv.width = Math.round(w * dpr); dieCv.height = Math.round(hh * dpr); }
  const cx = dieCv.getContext('2d'); if (!cx) return;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, w, hh);
  const pad = 8, cw = (w - pad * 2) / COLS, ch = (hh - pad * 2) / ROWS;
  const col = S.thr ? '#9a2f2f' : S.heat > 70 ? '#c4572f' : '#b08d57';
  cx.fillStyle = col;
  const frac = G.map((g, t) => Math.min(1, Math.log10(1 + S.g[t]) / 2.3));
  const speed = S.oc ? 220 : 420;
  for (let i = 0; i < CELLT.length; i++) {
    const [t, k] = CELLT[i];
    const x = pad + Math.floor(i / ROWS) * cw, y = pad + (i % ROWS) * ch;
    let a;
    if (G[t].u > S.node) a = 0.035;
    else if (k < frac[t] * CNT[t]) {
      a = 0.22 + 0.6 * (0.5 + 0.5 * Math.sin(ts / speed + i * 0.9));
      if (S.thr) a *= 0.5;
    } else a = 0.08;
    cx.globalAlpha = a;
    cx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
  }
  cx.globalAlpha = 1;
}
function frame(ts) { drawDie(ts); requestAnimationFrame(frame); }

// ---------- core tab ----------
function buildCore(r) {
  const cv = h('canvas', 'die'); r.append(cv); dieCv = cv;
  const info = h('div', 'dieinfo'); const i1 = h('span'), i2 = h('span'); info.append(i1, i2); r.append(info);

  const tp = h('button', 'tick');
  const tv = h('span', 'tv'); tp.append(h('span', 'tl', 'Tick the clock'), tv);
  tp.addEventListener('pointerdown', e => { e.preventDefault(); const v = C.tap(S); floatTxt(e.clientX, e.clientY, '+' + F(v)); });
  tp.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); C.tap(S); } });
  r.append(tp);

  const op = h('div', 'panel');
  const oh = h('div', 'prow'); const ol = h('span', 'lbl', 'Overclock'); const os = h('span', 'sub');
  const ob = h('button', '', 'Engage'); ob.onclick = () => { C.toggleOC(S); };
  const left = h('div'); left.append(ol, h('br'), os); oh.append(left, ob);
  const bar = h('div', 'bar'); const bf = h('i'); bar.append(bf);
  const hs = h('div', 'sub');
  op.append(oh, bar, hs); r.append(op);

  const mo = h('div', 'modes'); const mb = [];
  [[1, '×1'], [10, '×10'], [100, '×100'], ['max', 'Max']].forEach(([v, l]) => {
    const b = h('button', '', l); b.onclick = () => { S.set.bm = v; }; mb.push([v, b]); mo.append(b);
  });
  r.append(mo);

  const list = h('div'); r.append(list);
  const rows = G.map((g, i) => {
    const row = h('div', 'row');
    const inf = h('div', 'info'); const nm = h('div', 'nm'); const b = h('b', '', g.n); const own = h('span', 'own');
    nm.append(b, own); const sub = h('div', 'sub'); inf.append(nm, sub);
    const buy = h('button', 'act');
    buy.onclick = () => {
      const bm = S.set.bm, k = bm === 'max' ? C.maxBuy(S, i) : bm;
      if (k > 0) C.buyGen(S, i, k);
    };
    row.append(inf, buy); list.append(row);
    return { row, b, own, sub, buy };
  });
  const tease = h('div', 'hint'); tease.style.marginTop = '10px'; r.append(tease);

  return {
    upd() {
      const c = C.cps(S);
      setT(i1, 'Heat map'); setT(i2, 'Tier lit by count');
      setT(tv, '+' + F(C.tapValue(S, c)));
      show(op, S.un.oc);
      if (S.un.oc) {
        const M = S._M, up = 4 * M.oc * M.oc, cool = M.cool * M.coolM;
        setT(os, S.thr ? 'Throttled' : S.oc ? 'Running ×' + M.oc.toFixed(2) : 'Idle');
        setT(ob, S.oc ? 'Disengage' : 'Engage');
        setD(ob, S.thr);
        bf.style.width = S.heat.toFixed(1) + '%';
        setC(bar, 'hot', S.heat > 70 && !S.thr); setC(bar, 'thr', S.thr);
        const net = (S.oc ? up : 0) - cool;
        setT(hs, 'Heat ' + S.heat.toFixed(0) + '%  ·  ' + (net >= 0 ? '+' : '') + net.toFixed(1) + '/s  ·  cooling ' + cool.toFixed(1) + '/s' + (S.fr > 0 ? '  ·  storm ' + S.fr.toFixed(0) + 's' : ''));
      }
      mb.forEach(([v, b]) => setC(b, 'on', S.set.bm === v));
      let hid = null;
      rows.forEach((o, i) => {
        const g = G[i], open = C.genAvail(S, i), vis = open && (S.g[i] > 0 || S.run >= g.b * 0.25);
        show(o.row, vis);
        if (!vis) { if (!open && hid === null && i > 0 && S.g[i - 1] > 0) hid = i; return; }
        const bm = S.set.bm, k = bm === 'max' ? Math.max(1, C.maxBuy(S, i)) : bm, ct = C.cost(S, i, k);
        setT(o.own, FI(S.g[i]));
        const nx = C.MS.find(m => m > S.g[i]);
        setT(o.sub, F(C.genProd(S, i)) + '/s' + (nx ? '  ·  ×2 at ' + nx : ''));
        setT(o.buy, '+' + FI(k) + '\n' + F(ct));
        o.buy.style.whiteSpace = 'pre';
        setD(o.buy, S.c < ct);
        o.row.title = g.d;
      });
      // teaser for gated tier
      const nt = G.findIndex((g, i) => g.u > S.node && S.run >= g.b * 0.05);
      const gate = G.find(g => g.u === S.node + 1);
      if (gate && S.g[0] > 0) setT(tease, '??? · needs ' + C.NODES[S.node + 1] + ' die shrink'); else setT(tease, '');
    }
  };
}

// ---------- tasks tab ----------
function buildTasks(r) {
  r.append(h('h2', '', 'Threads'));
  const sl = []; const sw = h('div'); r.append(sw);
  for (let i = 0; i < 12; i++) {
    const row = h('div', 'slot'); const n = h('span', 'sn'), b = h('div', 'sb'), f = h('i'), p = h('span', 'sp');
    b.append(f); row.append(n, b, p); sw.append(row); sl.push({ row, n, f, p });
  }
  r.append(h('h2', '', 'Processes'));
  const lst = h('div'); r.append(lst);
  const rows = C.PROCS.map(d => {
    const row = h('div', 'row'); const inf = h('div', 'info');
    const nm = h('div', 'nm', d.n); const ds = h('div', 'hint', d.d); const sub = h('div', 'sub');
    const au = h('button', '', ''); au.style.cssText = 'padding:2px 8px;font-size:11px;margin-top:5px';
    au.onclick = () => { S.pOn[d.id] = S.pOn[d.id] === false; };
    inf.append(nm, ds, sub, au);
    const go = h('button', 'act', 'Run'); go.onclick = () => { C.startProc(S, d.id); };
    row.append(inf, go); lst.append(row);
    return { d, row, sub, go, au };
  });
  const dm = () => C.dataMult(S);
  return {
    upd() {
      const thr = S._M.thr;
      sl.forEach((o, i) => {
        show(o.row, i < thr);
        if (i >= thr) return;
        const q = S.q[i];
        if (q) {
          const d = C.PM[q.id];
          setT(o.n, d.n); o.f.style.width = Math.min(100, q.t / d.t * 100).toFixed(1) + '%';
          setT(o.p, Math.floor(q.t / d.t * 100) + '%');
        } else { setT(o.n, 'idle'); o.f.style.width = '0'; setT(o.p, ''); }
      });
      const scribe = S.dm.scribe && S.dm.scribe.own;
      rows.forEach(o => {
        const d = o.d, open = d.u <= S.node;
        show(o.row, open);
        if (!open) return;
        const cost = C.procCost(S, d);
        const rw = d.r.data ? '+' + F(d.r.data * dm()) + ' data' : d.r.cool ? '−' + d.r.cool + '% heat' : '+' + d.r.burst + 's of cycles';
        setT(o.sub, Math.round(d.t / S._M.ps) + 's  ·  costs ' + F(cost) + '  ·  ' + rw);
        setD(o.go, S.q.length >= thr || S.c < cost);
        show(o.au, scribe);
        setT(o.au, 'auto: ' + (S.pOn[d.id] === false ? 'off' : 'on'));
        setC(o.au, 'on', S.pOn[d.id] !== false);
      });
    }
  };
}

// ---------- lab tab ----------
function buildLab(r) {
  const hd = h('div', 'panel prow'); const dl = h('span', 'lbl', 'Data'); const dv = h('span', 'good'); hd.append(dl, dv); r.append(hd);
  const items = []; let br = '';
  C.RES.forEach(x => {
    if (x.b !== br) { br = x.b; r.append(h('h2', '', br)); }
    const row = h('div', 'row'); const inf = h('div', 'info');
    inf.append(h('div', 'nm', x.n), h('div', 'sub', x.d));
    const b = h('button', 'act'); b.onclick = () => { C.buyRes(S, x.id); };
    row.append(inf, b); r.append(row);
    items.push({ x, row, b });
  });
  return {
    upd() {
      setT(dv, F(S.data));
      items.forEach(o => {
        const x = o.x, own = S.res[x.id], avail = !x.req || S.res[x.req];
        setC(o.row, 'have', own); setC(o.row, 'lock', !own && !avail);
        setT(o.b, own ? 'Owned' : avail ? F(x.c) + ' data' : 'Locked');
        setD(o.b, own || !avail || S.data < x.c);
      });
    }
  };
}

// ---------- daemons tab ----------
function buildDaemons(r) {
  const hd = h('div', 'panel prow'); hd.append(h('span', 'lbl', 'Microcode'));
  const mv = h('span', 'good'); hd.append(mv); r.append(hd);
  r.append(h('div', 'hint', 'Daemons are bound with microcode and survive every reboot and shrink.'));
  const rows = C.DAEMONS.map(d => {
    const row = h('div', 'row'); const inf = h('div', 'info');
    inf.append(h('div', 'nm', d.n), h('div', 'sub', d.d));
    let extra = null;
    if (d.id === 'cycle') {
      extra = h('button', '', ''); extra.style.cssText = 'padding:2px 8px;font-size:11px;margin-top:5px';
      extra.onclick = () => { S.set.ar = (S.set.ar + 1) % C.ARS.length; };
      inf.append(extra);
    }
    const b = h('button', 'act');
    b.onclick = () => { if (S.dm[d.id] && S.dm[d.id].own) S.dm[d.id].on = !S.dm[d.id].on; else C.buyDaemon(S, d.id); };
    row.append(inf, b); r.append(row);
    return { d, row, b, extra };
  });
  return {
    upd() {
      setT(mv, FI(S.mu) + ' µ');
      rows.forEach(o => {
        const own = S.dm[o.d.id] && S.dm[o.d.id].own, on = own && S.dm[o.d.id].on;
        setC(o.row, 'have', on);
        setT(o.b, own ? (on ? 'Active' : 'Dormant') : 'Bind · ' + o.d.c + ' µ');
        setD(o.b, !own && S.mu < o.d.c);
        setC(o.b, 'on', on);
        if (o.extra) { show(o.extra, own); setT(o.extra, 'reboot at +' + Math.round(C.ARS[S.set.ar] * 100) + '% lifetime µ'); }
      });
    }
  };
}

// ---------- reboot tab ----------
function buildReboot(r) {
  r.append(h('h2', '', 'Reboot'));
  const p1 = h('div', 'panel');
  p1.append(h('div', 'hint', 'Burn the run to embers. What the fire teaches stays.'));
  const g1 = h('div', 'prow'); g1.style.marginTop = '8px';
  const pl = h('span', 'lbl', 'Pending'); const pv = h('span', 'good'); g1.append(pl, pv);
  const nx = h('div', 'sub'); const ml = h('div', 'sub');
  const rb = h('button'); rb.style.cssText = 'width:100%;margin-top:8px';
  armBtn(rb, 'Reboot', () => { if (C.reboot(S)) toast('Rebooted'); });
  p1.append(g1, nx, ml, rb); r.append(p1);

  r.append(h('h2', '', 'Microcode'));
  const mv = h('div', 'sub'); r.append(mv);
  const items = C.SHOP.map(s => {
    const row = h('div', 'row'); const inf = h('div', 'info');
    inf.append(h('div', 'nm', s.n), h('div', 'sub', s.d));
    const b = h('button', 'act'); b.onclick = () => { C.buyShop(S, s.id); };
    row.append(inf, b); r.append(row);
    return { s, row, b };
  });

  r.append(h('h2', '', 'Die shrink'));
  const p2 = h('div', 'panel'); r.append(p2);
  const st = h('div', 'nm'); const sd = h('div', 'sub'); const sr = h('div', 'sub'); const sn = h('div', 'hint');
  sn.style.marginTop = '6px';
  const sb = h('button'); sb.style.cssText = 'width:100%;margin-top:8px';
  armBtn(sb, 'Shrink', () => { if (C.shrink(S)) { toast('Die shrunk to ' + C.NODES[S.node]); setTab('reboot'); } });
  p2.append(st, sd, sr, sn, sb);
  return {
    upd() {
      const g = C.muGain(S);
      setT(pv, '+' + FI(g) + ' µ');
      setT(nx, g ? 'Next µ at ' + F(C.muNext(S)) + ' cycles this run' : 'First µ at ' + F(C.muNext(S)) + ' cycles this run');
      setT(ml, 'Lifetime ' + FI(S.muT) + ' µ  ·  cycles ×' + F(C.muMult(S)));
      setD(rb, g < 1);
      setT(mv, 'Available: ' + FI(S.mu) + ' µ');
      items.forEach(o => {
        const own = S.shop[o.s.id], avail = !o.s.req || S.shop[o.s.req];
        setC(o.row, 'have', own); setC(o.row, 'lock', !own && !avail);
        setT(o.b, own ? 'Owned' : avail ? o.s.c + ' µ' : 'Locked');
        setD(o.b, own || !avail || S.mu < o.s.c);
      });
      const n = S.node;
      if (n >= 12) {
        setT(st, C.NODES[n] + '  ·  smallest stone'); setT(sd, 'Nothing finer can be etched. For now.'); setT(sr, ''); setT(sn, '');
        show(sb, false);
      } else {
        const need = C.REQ[n];
        setT(st, C.NODES[n] + '  →  ' + C.NODES[n + 1]);
        setT(sd, 'Cycles ×' + C.NODE_MULT + ' per node. Resets run, data, research. Spent µ is refunded.');
        setT(sr, 'Needs ' + FI(need) + ' lifetime µ  (you: ' + FI(S.muT) + ')');
        setT(sn, 'Unlocks: ' + C.nodeNote(n + 1));
        show(sb, true); setD(sb, !C.canShrink(S));
      }
    }
  };
}

// ---------- more tab ----------
function buildMore(r) {
  r.append(h('h2', '', 'Stats'));
  const sg = h('div', 'cols'); r.append(sg);
  const sv = {};
  [['t', 'Played'], ['tot', 'Cycles, lifetime'], ['run', 'Cycles, this run'], ['taps', 'Ticks'], ['reb', 'Reboots'], ['shr', 'Die shrinks'], ['irq', 'Interrupts'], ['proc', 'Tasks done'], ['thr', 'Throttles'], ['ach', 'Seals broken']].forEach(([k, l]) => {
    const a = h('span', '', l), b = h('span'); sg.append(a, b); sv[k] = b;
  });

  r.append(h('h2', '', 'Settings'));
  const sbox = h('div'); sbox.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px';
  const nb = h('button'); nb.onclick = () => { S.set.sci = !S.set.sci; };
  const wb = h('button'); wb.onclick = () => { S.set.wake = !S.set.wake; applyWake(); };
  const svb = h('button', '', 'Save now'); svb.onclick = () => { save(); toast('Saved'); };
  const exb = h('button', '', 'Export save'); const imb = h('button', '', 'Import save');
  sbox.append(nb, wb, svb, exb, imb);
  const rs = h('button'); armBtn(rs, 'Erase everything', () => { try { localStorage.removeItem(KEY); } catch (e) {} S = C.newState(); seen = {}; setTab('core'); toast('Erased'); });
  sbox.append(rs); r.append(sbox);
  const ta = h('textarea'); ta.rows = 4; ta.hidden = true; ta.style.marginTop = '8px'; r.append(ta);
  const go = h('button', '', 'Load from text'); go.hidden = true; go.style.marginTop = '6px'; r.append(go);
  exb.onclick = () => {
    ta.hidden = false; go.hidden = true; ta.value = btoa(unescape(encodeURIComponent(JSON.stringify(C.serialize(S)))));
    ta.select(); try { navigator.clipboard.writeText(ta.value); toast('Copied'); } catch (e) {}
  };
  imb.onclick = () => { ta.hidden = false; go.hidden = false; ta.value = ''; ta.focus(); };
  go.onclick = () => {
    try { S = C.deserialize(JSON.parse(decodeURIComponent(escape(atob(ta.value.trim()))))); S.last = Date.now(); save(); seen = {}; setTab('core'); toast('Loaded'); }
    catch (e) { toast('Invalid save'); }
  };

  r.append(h('h2', '', 'Seals'));
  const al = h('div'); r.append(al);
  const arows = C.ACH.map(a => {
    const row = h('div', 'ach'); const mk = h('span', 'mk'); const tx = h('span', '', a.n + ' — ' + a.d);
    row.append(mk, tx); al.append(row); return { a, row, mk };
  });
  r.append(h('h2', '', 'Chronicle'));
  const lg = h('div'); r.append(lg);
  let lgSig = -1;

  return {
    upd() {
      setT(sv.t, fmtTime(S.t)); setT(sv.tot, F(S.tot)); setT(sv.run, F(S.run)); setT(sv.taps, FI(S.st.taps));
      setT(sv.reb, FI(S.st.reb)); setT(sv.shr, FI(S.st.shr)); setT(sv.irq, FI(S.st.irq)); setT(sv.proc, FI(S.st.proc));
      setT(sv.thr, FI(S.st.thr)); setT(sv.ach, S._ac + ' / ' + C.ACH.length);
      setT(nb, 'Numbers: ' + (S.set.sci ? 'scientific' : 'short'));
      setT(wb, 'Keep awake: ' + (S.set.wake ? 'on' : 'off'));
      arows.forEach(o => { const on = S.ach[o.a.id]; setC(o.row, 'no', !on); setT(o.mk, on ? '◆' : '·'); });
      const sig = S.log.length + '|' + (S.log[0] ? S.log[0].m : '');
      if (sig !== lgSig) {
        lgSig = sig; lg.innerHTML = '';
        S.log.forEach(e => { const d = h('div', 'logl'); d.append(h('span', '', fmtTime(e.t)), document.createTextNode(e.m)); lg.append(d); });
      }
    }
  };
}

// ---------- wake lock ----------
let wl = null;
async function applyWake() {
  try {
    if (S.set.wake && 'wakeLock' in navigator && !document.hidden) { if (!wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } }
    else if (wl) { await wl.release(); wl = null; }
  } catch (e) { wl = null; }
}

// ---------- interrupt chip ----------
const irqB = $('#irq');
irqB.addEventListener('pointerdown', e => {
  e.preventDefault();
  const m = C.clickIrq(S); if (m) toast(m);
});
const IRQN = { b: 'IRQ · cycles', d: 'IRQ · data', f: 'IRQ · storm' };
function updIrq() {
  if (S.irq) { irqB.hidden = false; const t = IRQN[S.irq.k] + '  ' + Math.ceil(S.irq.l) + 's'; if (irqB._t !== t) { irqB._t = t; irqB.textContent = t; } }
  else irqB.hidden = true;
}

// ---------- main loop ----------
let lastWall = Date.now(), lastPaint = 0, lastSave = Date.now(), prevAch = S._ac;
function loop() {
  const now = Date.now();
  let dt = (now - lastWall) / 1000; lastWall = now;
  if (dt < 0) dt = 0;
  if (dt > 0) {
    const before = S.tot;
    C.advance(S, dt);
    if (dt > 60) {
      const gain = S.tot - before, used = dt > 600 ? Math.min(dt, S._M.off * 3600) : dt;
      if (gain > 0) modal('While you were away', 'About ' + fmtTime(used) + ' passed.\n+' + F(gain) + ' cycles gathered in the dark.' + (dt > used ? '\nThe machine stopped waiting after ' + fmtTime(used) + '.' : ''), 'Return');
    }
  }
  if (S._ac !== prevAch) { if (S._ac > prevAch) toast('Seal broken · +2% cycles'); prevAch = S._ac; }
  if (now - lastSave > 10000) { lastSave = now; save(); }
  if (now - lastPaint > 100) {
    lastPaint = now; paint();
  }
}
function paint() {
  setT($('#cyc'), F(S.c));
  setT($('#cps'), F(C.cps(S)) + ' cycles/s');
  setT($('#mult'), '×' + F(C.gMult(S)));
  setT($('#node'), C.NODES[S.node]);
  const lg = S.log[0]; setT($('#ticker'), lg ? lg.m : '');
  updIrq();
  renderNav();
  // new tab toast
  TABS.forEach(t => { if (t.ok() && !seen[t.id] && !t._t) { t._t = 1; if (t.id !== 'core' && t.id !== 'more') toast('New: ' + t.n); } });
  if (view) view.upd();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(); else { lastWall = Date.now() - Math.min(Date.now() - lastWall, 1e12); applyWake(); }
});
window.addEventListener('pagehide', save);
document.addEventListener('contextmenu', e => e.preventDefault());

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ---------- boot ----------
(function boot() {
  const away = (Date.now() - S.last) / 1000;
  C.slow(S);
  if (away > 60) {
    const before = S.tot, used = C.offline(S, away);
    const gain = S.tot - before;
    if (gain > 0) modal('While you were away', 'About ' + fmtTime(used) + ' passed.\n+' + F(gain) + ' cycles gathered in the dark.' + (away > used ? '\nThe machine stopped waiting after ' + fmtTime(used) + '.' : ''), 'Return');
  }
  S.last = Date.now(); lastWall = Date.now();
  if (!S.log.length) C.log(S, 'Power. Nothing yet. Tick the clock.');
  prevAch = S._ac;
  TABS.forEach(t => { if (t.ok()) { t._t = 1; seen[t.id] = 1; } });
  setTab('core');
  setInterval(loop, 100);
  requestAnimationFrame(frame);
  applyWake();
})();
window.__S = () => S;
})();
