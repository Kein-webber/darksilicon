(function (root) {
'use strict';
// Schematic renderer. Modules appear (spawn) as the matching systems unlock; the next slot is drawn as a dashed ghost.
const W = 360, H = 200;
const COL = { line: '#2a2a31', dim: '#1a1a1e', teal: '#b08d57', grn: '#7a9a68', amb: '#c98a3a', red: '#b8403f', txt: '#6d6a63', pan: '#101013' };
let cv = null, cx = null;
const first = {}, bursts = [];
let T = 0, S = null, hot = COL.teal, act = 0.5;

function init(canvas) { cv = canvas; cx = cv.getContext && cv.getContext('2d'); }
function views(St) {
  const v = ['chip'];
  if (St.g[8] > 0 || St.node >= 1) v.push('board');
  if (St.sled > 0 || St.st.boards > 0) v.push('rack');
  return v;
}
function pulse(kind) { bursts.push({ t: T, k: kind }); if (bursts.length > 6) bursts.shift(); }

function pop(id, present) {
  if (!present) return 0;
  if (first[id] == null) first[id] = T;
  const k = Math.min(1, (T - first[id]) / 650);
  return 1 - Math.pow(1 - k, 3);
}
function box(x, y, w, h, a, o) {
  o = o || {};
  if (a <= 0) return;
  const mx = x + w / 2, my = y + h / 2;
  cx.save(); cx.globalAlpha = a; cx.translate(mx, my); const s = 0.85 + 0.15 * a; cx.scale(s, s); cx.translate(-mx, -my);
  if (o.ghost) {
    cx.setLineDash([3, 3]); cx.strokeStyle = COL.line; cx.lineWidth = 1; cx.strokeRect(x + .5, y + .5, w, h); cx.setLineDash([]);
  } else {
    cx.fillStyle = o.fill || COL.pan; cx.fillRect(x, y, w, h);
    cx.strokeStyle = o.stroke || '#4a4640'; cx.lineWidth = 1; cx.strokeRect(x + .5, y + .5, w, h);
    cx.fillStyle = o.stroke || '#4a4640'; cx.fillRect(x, y, 4, 1.5); cx.fillRect(x, y, 1.5, 4);
  }
  cx.textBaseline = 'top';
  if (o.label) { cx.fillStyle = o.ghost ? '#36332e' : COL.txt; cx.font = '600 7px "Chakra Petch",sans-serif'; cx.fillText(o.label, x + 4, y + 3); }
  if (o.val) { cx.fillStyle = '#bdb8ad'; cx.font = '600 8px "JetBrains Mono",monospace'; cx.textAlign = 'right'; cx.fillText(o.val, x + w - 3, y + 3); cx.textAlign = 'left'; }
  cx.restore();
}
function trace(x1, y1, x2, y2, id) {
  cx.strokeStyle = '#35322d'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke();
  const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.floor(L / 40));
  for (let i = 0; i < n; i++) {
    const f = ((T / (S.oc ? 500 : 900)) + i / n + (id || 0) * 0.17) % 1;
    cx.fillStyle = hot; cx.globalAlpha = 0.9; cx.fillRect(x1 + (x2 - x1) * f - 1, y1 + (y2 - y1) * f - 1, 2, 2); cx.globalAlpha = 1;
  }
}
function lit(i, f) { return f * (0.5 + 0.5 * Math.sin(T / (S.oc ? 140 : 300) + i * 1.9) * Math.sin(T / 1100 + i * 0.7)); }
function fan(x, y, r, spin) {
  cx.strokeStyle = '#4a4640'; cx.lineWidth = 1; cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.stroke();
  cx.save(); cx.translate(x, y); cx.rotate(spin); cx.fillStyle = hot; cx.globalAlpha = 0.8;
  for (let i = 0; i < 4; i++) { cx.rotate(1.5708); cx.fillRect(1, -1.2, r - 2, 2.4); }
  cx.restore(); cx.globalAlpha = 1;
}
function ring(color, r0, r1, kind) {
  for (const b of bursts) {
    const f = (T - b.t) / 700; if (f > 1) continue;
    cx.strokeStyle = b.k === 'board' ? COL.amb : color; cx.globalAlpha = 1 - f; cx.lineWidth = 1.5;
    cx.beginPath(); cx.arc(180, 100, r0 + f * r1, 0, 6.283); cx.stroke(); cx.globalAlpha = 1;
  }
}

function sigil() {
  const heatC = S.thr ? '#b8403f' : S.heat / S._M.hcap > 0.7 ? '#c98a3a' : '#b08d57';
  const px = 180, py = 100, a = T / 12000, big = S.node >= 6 ? 1 : 0;
  cx.save(); cx.translate(px, py); cx.strokeStyle = heatC; cx.fillStyle = heatC; cx.lineWidth = 1;
  cx.globalAlpha = 0.2; cx.beginPath(); cx.arc(0, 0, 92, 0, 6.283); cx.stroke();
  cx.setLineDash([2, 4]); cx.beginPath(); cx.arc(0, 0, 84, 0, 6.283); cx.stroke(); cx.setLineDash([]);
  cx.save(); cx.rotate(a);
  for (let i = 0; i < 36; i++) { cx.rotate(6.283 / 36); cx.fillRect(88, -0.5, i % 3 === 0 ? 6 : 3, 1); }
  cx.restore();
  cx.save(); cx.rotate(-a * 1.4); cx.globalAlpha = 0.14;
  for (let k = 0; k < 2; k++) { cx.rotate(k * 3.1416 / 3); cx.beginPath(); for (let i = 0; i < 3; i++) { const t = i * 2.0944; cx.lineTo(Math.cos(t) * 78, Math.sin(t) * 78); } cx.closePath(); cx.stroke(); }
  cx.restore();
  // rune ring: one rune per finer node reached, drawn from deterministic strokes
  for (let i = 0; i < 12; i++) {
    const on = i < S.node, ang = i / 12 * 6.283 - 1.5708;
    cx.save(); cx.rotate(ang); cx.translate(98, 0); cx.rotate(1.5708);
    cx.globalAlpha = on ? 0.75 : 0.13; cx.strokeStyle = on ? '#b08d57' : heatC; cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(0, -3); cx.lineTo(0, 3);
    if (i % 3 === 0) { cx.moveTo(-2.5, -1); cx.lineTo(0, -3); cx.lineTo(2.5, -1); }
    if (i % 3 === 1) { cx.moveTo(-2.5, 3); cx.lineTo(0, 0); cx.lineTo(2.5, 3); }
    if (i % 3 === 2) { cx.moveTo(-2.5, 0); cx.lineTo(2.5, 0); }
    cx.stroke(); cx.restore();
  }
  if (S.bf > 0) { cx.globalAlpha = 0.35; cx.strokeStyle = '#c4572f'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(0, 0, 80 + Math.sin(T / 200) * 2, 0, 6.283); cx.stroke(); }
  if (big) { cx.globalAlpha = 0.07; cx.beginPath(); cx.arc(0, 0, 70, 0, 6.283); cx.stroke(); }
  cx.restore(); cx.globalAlpha = 1;
}
function embers(w, h) {
  const n = S.oc ? 26 : 14;
  for (let i = 0; i < n; i++) {
    const seed = i * 97.13, sp = 0.012 + (i % 5) * 0.004, f = ((T * sp / 1000) + (seed % 1)) % 1;
    const x = ((Math.sin(seed) * 0.5 + 0.5) * W) + Math.sin(T / 900 + seed) * 6, y = H - f * (H + 10);
    cx.fillStyle = S.thr ? '#b8403f' : i % 3 ? '#c4572f' : '#c98a3a'; cx.globalAlpha = (1 - f) * (S.oc ? 0.7 : 0.45);
    cx.fillRect(x, y, 1.5, 1.5);
  }
  cx.globalAlpha = 1;
}
function chipView() {
  sigil();
  const C = root.CORE, L = id => S.rig[id] || 0, g = S.g;
  const cores = 2 + L('cor'), clus = Math.min(4, 1 + L('clu'));
  box(95, 30, 170, 140, 1, { label: 'CHIP-01 · ' + C.NODES[S.node], stroke: hot === COL.teal ? '#4a4640' : hot });
  for (let c = 0; c < 4; c++) {
    const x = 101 + (c % 2) * 80, y = 42 + Math.floor(c / 2) * 62, w = 76, h = 58;
    const own = c < clus, ghost = c === clus && S.tot >= 2e5 && L('clu') < 3;
    if (!own && !ghost) continue;
    if (ghost) { box(x, y, w, h, 0.9, { ghost: true, label: 'C' + (c + 1) }); continue; }
    box(x, y, w, h, pop('cl' + c, true), { label: 'C' + (c + 1), fill: '#101013' });
    const per = Math.min(12, Math.max(1, Math.ceil(cores / clus)));
    for (let i = 0; i < 12; i++) {
      const px = x + 5 + (i % 4) * 17, py = y + 13 + Math.floor(i / 4) * 14;
      if (i < per) {
        const cell = pop('co' + c + '_' + i, true) * lit(i + c * 5, act);
        cx.fillStyle = hot; cx.globalAlpha = 0.18 + 0.75 * Math.max(0, cell); cx.fillRect(px, py, 14, 11); cx.globalAlpha = 1;
      } else if (i === per && S.un.cmp && L('cor') < 8 + 4 * S.node) {
        cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(px + .5, py + .5, 13, 10); cx.setLineDash([]);
      }
    }
  }
  const n = C.GENS.length, mw = 158, bw = mw / n - 1.5;
  for (let t = 0; t < n; t++) {
    if (!C.genAvail(S, t)) continue;
    cx.fillStyle = COL.dim; cx.fillRect(101 + t * (bw + 1.5), 164, bw, 3);
    if (g[t] > 0) { const a = pop('tier' + t, true); cx.fillStyle = hot; cx.globalAlpha = 0.85; cx.fillRect(101 + t * (bw + 1.5), 164, bw * Math.min(1, Math.log10(1 + g[t]) / 2.4) * a, 3); cx.globalAlpha = 1; }
  }
  if (S.un.cmp) {
    const a = pop('clk', true);
    box(12, 32, 66, 34, a, { label: 'CLOCK', val: (1 + 0.15 * L('clk')).toFixed(2) + 'G' });
    cx.save(); cx.globalAlpha = a; cx.strokeStyle = hot; cx.lineWidth = 1; cx.beginPath();
    const per = S.oc ? 7 : 11, off = T / 90; let ly = null;
    for (let i = 0; i <= 54; i++) {
      const px = 17 + i, py = (Math.floor((i + off) / per) % 2) ? 52 : 60;
      if (ly === null) cx.moveTo(px, py); else { if (py !== ly) cx.lineTo(px, py); cx.lineTo(px, py); }
      ly = py;
    }
    cx.stroke(); cx.restore();
    trace(78, 49, 95, 49, 1);
  } else if (S.tot >= 100) box(12, 32, 66, 34, 0.9, { ghost: true, label: 'CLOCK' });
  if (g[3] > 0 || g[4] > 0) {
    const a = pop('mem', true);
    box(12, 74, 66, 44, a, { label: 'CACHE', val: g[5] > 0 ? 'L2' : 'L1' });
    const bars = 1 + (g[4] > 0) + (g[5] > 0) + (g[6] > 0);
    for (let i = 0; i < 4; i++) {
      cx.globalAlpha = a;
      if (i < bars) { cx.fillStyle = hot; cx.globalAlpha = a * (0.3 + 0.5 * Math.abs(Math.sin(T / 500 + i))); } else cx.fillStyle = COL.dim;
      cx.fillRect(18, 86 + i * 7, 54, 4); cx.globalAlpha = 1;
    }
    trace(78, 96, 95, 96, 2);
  } else if (S.un.cmp) box(12, 74, 66, 44, 0.9, { ghost: true, label: 'CACHE' });
  if (S.un.pw) {
    const a = pop('psu', true);
    box(12, 126, 66, 42, a, { label: 'PSU', val: '+' + (1.5 * L('psu')) + '%' });
    for (let i = 0; i < 6; i++) { cx.globalAlpha = a; cx.fillStyle = i < L('vrm') ? COL.grn : COL.dim; cx.fillRect(18 + i * 9, 150, 7, 12); cx.globalAlpha = 1; }
    cx.fillStyle = COL.txt; cx.font = '600 6px "Chakra Petch"'; cx.fillText('VRM', 18, 141);
    trace(78, 147, 95, 147, 3);
  } else if (S.tot >= 1e5) box(12, 126, 66, 42, 0.9, { ghost: true, label: 'PSU' });
  if (S.un.oc) {
    const nf = L('fan'), hp = S.heat / S._M.hcap;
    box(272, 32, 76, 52, 1, { label: 'AIRFLOW', val: nf + '/6' });
    for (let i = 0; i < 6; i++) {
      const fx = 286 + (i % 3) * 24, fy = 52 + Math.floor(i / 3) * 24;
      if (i < nf) { cx.globalAlpha = pop('fan' + i, true); fan(fx, fy, 9, T / (S.oc ? 70 : 160) * (1 + i * 0.1)); cx.globalAlpha = 1; }
      else if (i === nf) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.beginPath(); cx.arc(fx, fy, 9, 0, 6.283); cx.stroke(); cx.setLineDash([]); }
    }
    const fins = Math.min(12, 2 + L('fin'));
    box(272, 92, 76, 40, 1, { label: 'HEATSINK', val: '+' + (0.7 * L('fin')).toFixed(1) });
    for (let i = 0; i < 12; i++) { cx.fillStyle = i < fins ? '#6a5a3a' : COL.dim; cx.fillRect(277 + i * 5.6, 108, 3, 20); }
    for (let i = 0; i < 3; i++) {
      const f = ((T / 900) + i / 3) % 1;
      cx.fillStyle = S.thr ? COL.red : COL.amb; cx.globalAlpha = (1 - f) * Math.min(1, 0.2 + hp * 1.4); cx.fillRect(286 + i * 24, 138 - f * 14, 3, 5); cx.globalAlpha = 1;
    }
    trace(265, 110, 272, 110, 4);
    cx.fillStyle = COL.dim; cx.fillRect(272, 148, 76, 5);
    cx.fillStyle = S.thr ? COL.red : hp > 0.7 ? COL.amb : COL.grn; cx.fillRect(272, 148, 76 * hp, 5);
    cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('HEAT-OUT ' + Math.round(hp * 100) + '%', 272, 158);
    cx.fillText('CEIL ' + Math.round(S._M.hcap) + '°', 272, 168);
  } else if (S.tot >= 5e3) box(272, 32, 76, 52, 0.9, { ghost: true, label: 'AIRFLOW' });
  if (S.un.ct) {
    const a = pop('nic', true), ci = C.ctInfo(S);
    box(124, 176, 112, 20, a, { label: 'NIC · ' + ci.cl.n.toUpperCase() });
    cx.fillStyle = COL.dim; cx.fillRect(128, 190, 104, 3);
    cx.fillStyle = COL.grn; cx.fillRect(128, 190, 104 * Math.min(1, ci.p / ci.size), 3);
    const rate = Math.min(8, 2 + C.ctRate(S) / 8);
    for (let i = 0; i < rate; i++) {
      const f = ((T / 1200) + i / rate) % 1;
      cx.fillStyle = COL.grn; cx.globalAlpha = (1 - f) * a; cx.fillRect(130 + ((i * 37) % 100), 176 - f * 6, 2, 2); cx.globalAlpha = 1;
    }
    cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('BOARD ' + (ci.b + 1) + ' · CONTRACT ' + (ci.k + 1) + '/5', 100, 20);
  } else if (S.tot >= 5e4) box(124, 176, 112, 20, 0.9, { ghost: true, label: 'NIC' });
  if ((S.rig.eye || 0) > 0) {
    const ex = 245, ey = 22, open = 0.5 + 0.5 * Math.min(1, (S.rig.eye || 0) / 10), blink = Math.sin(T / 2500) > 0.97 ? 0.2 : 1;
    cx.save(); cx.translate(ex, ey); cx.globalAlpha = pop('eye', true);
    cx.strokeStyle = '#b08d57'; cx.lineWidth = 1; cx.beginPath();
    cx.moveTo(-9, 0); cx.quadraticCurveTo(0, -7 * open * blink, 9, 0); cx.quadraticCurveTo(0, 7 * open * blink, -9, 0); cx.stroke();
    cx.fillStyle = COL.red; cx.beginPath(); cx.arc(Math.sin(T / 1500) * 2, 0, 2.2 * blink, 0, 6.283); cx.fill();
    cx.restore();
  }
  ring(COL.teal, 20, 70);
}

function boardView() {
  const C = root.CORE;
  const have = Math.max(1, Math.min(4, 1 + Math.floor(S.g[8] / 6) + (S.g[9] > 0 ? 1 : 0) + (S.g[10] > 0 ? 1 : 0)));
  box(6, 28, 348, 148, 1, { label: 'BOARD-01 · PCIe 5.0', stroke: '#3a3732', fill: '#0d0d10' });
  for (let i = 0; i < 4; i++) {
    const x = 16 + i * 84, y = 42, w = 76, h = 100;
    if (i < have) {
      const a = pop('bd' + i, true);
      box(x, y, w, h, a, { label: 'GPU-' + (i + 1) });
      for (let k = 0; k < 9; k++) {
        const px = x + 6 + (k % 3) * 22, py = y + 14 + Math.floor(k / 3) * 18;
        cx.fillStyle = hot; cx.globalAlpha = a * (0.15 + 0.7 * Math.max(0, lit(k + i * 3, act))); cx.fillRect(px, py, 18, 14); cx.globalAlpha = 1;
      }
      cx.globalAlpha = a; fan(x + w / 2, y + h - 16, 10, T / (S.oc ? 60 : 150) + i); cx.globalAlpha = 1;
      cx.fillStyle = '#4a4640'; cx.fillRect(x + 8, y + h, w - 16, 4);
      trace(x + w / 2, y + h + 4, x + w / 2, 160, i);
    } else if (i === have) box(x, y, w, h, 0.9, { ghost: true, label: 'GPU-' + (i + 1) });
  }
  cx.strokeStyle = '#4a4640'; cx.beginPath(); cx.moveTo(16, 160); cx.lineTo(344, 160); cx.stroke();
  cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('PCIe BUS · ' + C.fmt(C.cps(S)) + ' cycles/s', 18, 164);
  cx.fillText(have + '/4 BOARDS', 300, 164);
  ring(COL.teal, 20, 70);
}

function rackView() {
  const C = root.CORE;
  box(100, 14, 160, 176, 1, { label: 'RACK-01', val: S.sled + '/' + C.maxSleds(S), stroke: '#3a3732', fill: '#0a0a0c' });
  const NS = Math.max(12, C.maxSleds(S)), rh = 156 / NS;
  for (let i = 0; i < NS; i++) {
    const y = 28 + (NS - 1 - i) * rh, x = 106, w = 148, h = rh - 2;
    if (i < S.sled) {
      cx.globalAlpha = pop('sl' + i, true); cx.fillStyle = '#121215'; cx.fillRect(x, y, w, h); cx.strokeStyle = '#4a4640'; cx.strokeRect(x + .5, y + .5, w - 1, h - 1);
      for (let k = 0; k < 10; k++) { cx.fillStyle = (Math.sin(T / 260 + i * 2 + k * 1.3) > 0.4) ? hot : '#26241f'; cx.fillRect(x + 6 + k * 5, y + 4, 3, 3); }
      cx.fillStyle = COL.grn; cx.fillRect(x + w - 12, y + 4, 4, 3); cx.fillStyle = '#26241f'; cx.fillRect(x + w - 40, y + 3, 22, 5);
      cx.globalAlpha = 1;
    } else if (i === S.sled) { cx.setLineDash([3, 3]); cx.strokeStyle = COL.line; cx.strokeRect(x + .5, y + .5, w - 1, h - 1); cx.setLineDash([]); }
    else { cx.fillStyle = COL.dim; cx.fillRect(x, y + 5, w, 1); }
  }
  const ci = C.ctInfo(S);
  cx.textBaseline = 'top';
  cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('CLIENT', 12, 34);
  cx.fillStyle = '#bdb8ad'; cx.font = '600 9px "JetBrains Mono"'; cx.fillText(ci.cl.n, 12, 46);
  cx.fillStyle = COL.dim; cx.fillRect(12, 60, 76, 4); cx.fillStyle = COL.grn; cx.fillRect(12, 60, 76 * Math.min(1, ci.p / ci.size), 4);
  cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('CONTRACT ' + (ci.k + 1) + '/5', 12, 72); cx.fillText('BOARDS CLEARED', 12, 100);
  cx.fillStyle = COL.amb; cx.font = '600 14px "JetBrains Mono"'; cx.fillText(String(S.st.boards), 12, 112);
  cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('SLED BONUS', 272, 34);
  cx.fillStyle = COL.grn; cx.font = '600 12px "JetBrains Mono"'; cx.fillText('+' + ((C.sledMult(S) - 1) * 100).toFixed(0) + '%', 272, 46);
  trace(88, 80, 100, 80, 1); trace(260, 80, 272, 80, 2);
  ring(COL.amb, 40, 90);
}

function draw(St, ts, view) {
  if (!cv || !cx) return;
  S = St; T = ts;
  const w = cv.clientWidth, h = cv.clientHeight, dpr = root.devicePixelRatio || 1;
  if (!w || !h) return;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.fillStyle = '#08080a'; cx.fillRect(0, 0, w, h);
  cx.strokeStyle = '#111114'; cx.lineWidth = 1; cx.beginPath();
  for (let x = 0; x < w; x += 16) { cx.moveTo(x + .5, 0); cx.lineTo(x + .5, h); }
  for (let y = 0; y < h; y += 16) { cx.moveTo(0, y + .5); cx.lineTo(w, y + .5); }
  cx.stroke();
  const sc = Math.min(w / W, h / H);
  cx.save(); cx.translate((w - W * sc) / 2, (h - H * sc) / 2); cx.scale(sc, sc);
  hot = S.thr ? COL.red : S.heat / S._M.hcap > 0.7 ? COL.amb : COL.teal;
  act = S.thr ? 0.25 : S.oc ? 1 : 0.7;
  cx.textBaseline = 'top';
  if (view !== 'rack' && view !== 'board') {} 
  embers();
  if (view === 'board') boardView(); else if (view === 'rack') rackView(); else chipView();
  cx.restore();
}
root.SCENE = { init, draw, views, pulse };
})(typeof window !== 'undefined' ? window : globalThis);
