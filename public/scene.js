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
  if (St.st.reb >= 1) v.push('mem');
  if (St.node >= 1) v.push('fab');
  if (St.node >= 2) v.push('crypt');
  if (St.node >= 4) v.push('altar');
  if (St.node >= 6) v.push('abyss');
  if (St.node >= 7) v.push('ossuary');
  if (St.node >= 8) v.push('void');
  if (St.node >= 9) v.push('star');
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
  // drifting dust, a little more of it the deeper you go
  const nd = 14 + S.node * 2;
  for (let i = 0; i < nd; i++) {
    const seed = i * 53.7, x = (((seed * 7.3) % 1 + 1) % 1 * W + T * (0.004 + (i % 4) * 0.002) * (i % 2 ? 1 : -1) + W * 4) % W, y = (((Math.sin(seed) * 0.5 + 0.5) * H) + Math.sin(T / 2200 + seed) * 5);
    cx.fillStyle = '#8d8a7c'; cx.globalAlpha = 0.10 + 0.08 * Math.sin(T / 1500 + seed); cx.fillRect(x, y, 1, 1);
  }
  cx.globalAlpha = 1;
  const n = (S.oc ? 26 : 14) + S.node * 3;
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

  // data packets crossing the die between clusters
  if (S.un.cmp) {
    const np = Math.min(14, 3 + Math.floor(Math.log10(1 + C.cps(S)) * 1.6));
    cx.strokeStyle = '#1e1c19'; cx.beginPath(); cx.moveTo(101, 102.5); cx.lineTo(257, 102.5); cx.moveTo(179.5, 40); cx.lineTo(179.5, 164); cx.stroke();
    for (let i = 0; i < np; i++) {
      const f = (T / (S.oc ? 1400 : 2600) + i / np) % 1, horiz = i % 2 === 0;
      cx.fillStyle = hot; cx.globalAlpha = 0.55 * pop('clk', true);
      if (horiz) cx.fillRect(101 + f * 156 - 1, 101.5, 3, 2); else cx.fillRect(178.5, 40 + f * 124 - 1, 2, 3);
    }
    cx.globalAlpha = 1;
  }
  // occult attachments
  const nrun = Math.min(8, L('run')), ngar = L('gar'), nbld = L('bld'), nsol = L('sol'), nhrn = L('hrn');
  for (let i = 0; i < nrun; i++) {
    const x = 106 + i * 17, a = pop('run' + i, true);
    cx.save(); cx.globalAlpha = a * (0.45 + 0.4 * Math.sin(T / 700 + i)); cx.strokeStyle = COL.amb; cx.lineWidth = 1; cx.beginPath();
    cx.moveTo(x, 6); cx.lineTo(x, 15);
    if (i % 3 === 0) { cx.moveTo(x - 3, 9); cx.lineTo(x, 6); cx.lineTo(x + 3, 9); }
    if (i % 3 === 1) { cx.moveTo(x - 3, 15); cx.lineTo(x, 11); cx.lineTo(x + 3, 15); }
    if (i % 3 === 2) { cx.moveTo(x - 3, 10); cx.lineTo(x + 3, 12); }
    cx.stroke(); cx.restore();
  }
  if (ngar > 0) {
    const a = pop('gar', true), sc = 0.8 + Math.min(0.5, ngar * 0.03), fl = Math.sin(T / 500) * 0.12;
    cx.save(); cx.globalAlpha = a; cx.translate(310, 31); cx.scale(sc, sc);
    cx.fillStyle = '#17171b'; cx.strokeStyle = '#4a4640';
    cx.beginPath(); cx.moveTo(-14, 0); cx.lineTo(14, 0); cx.lineTo(10, -6); cx.lineTo(0, -10); cx.lineTo(-10, -6); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(-8, -7); cx.lineTo(-20, -16 - fl * 20); cx.lineTo(-13, -3); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.moveTo(8, -7); cx.lineTo(20, -16 - fl * 20); cx.lineTo(13, -3); cx.closePath(); cx.fill(); cx.stroke();
    cx.beginPath(); cx.arc(0, -13, 5, 0, 6.283); cx.fill(); cx.stroke();
    cx.fillStyle = COL.red; cx.fillRect(-3, -14, 2, 2); cx.fillRect(1, -14, 2, 2);
    cx.restore();
    for (let i = 0; i < 3; i++) { const f = (T / 1600 + i / 3) % 1; cx.fillStyle = '#8fa6a8'; cx.globalAlpha = (1 - f) * 0.5 * a; cx.fillRect(306 + Math.sin(T / 400 + i) * 3 + i * 4, 18 - f * 14, 2, 2); }
    cx.globalAlpha = 1;
  }
  if (nbld > 0) {
    const a = pop('bld', true);
    cx.strokeStyle = '#5a1f1f'; cx.globalAlpha = a; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(86.5, 34); cx.lineTo(86.5, 162); cx.stroke(); cx.lineWidth = 1;
    const np = Math.min(8, 1 + nbld);
    for (let i = 0; i < np; i++) { const f = (T / 1800 + i / np) % 1; cx.fillStyle = '#d0504a'; cx.fillRect(85, 162 - f * 128, 3, 3); }
    cx.globalAlpha = 1;
  }
  for (let i = 0; i < 4; i++) {
    const x = 14 + i * 18, y = 176;
    if (i < Math.ceil(nsol / 2)) {
      const a = pop('sol' + i, true); cx.save(); cx.globalAlpha = a;
      cx.fillStyle = '#0d0d10'; cx.strokeStyle = '#4a4640'; cx.fillRect(x, y + 4, 12, 15); cx.strokeRect(x + .5, y + 4.5, 11, 14); cx.fillRect(x + 3, y, 6, 4); cx.strokeRect(x + 3.5, y + .5, 5, 3);
      const by = y + 11 + Math.sin(T / 600 + i * 2) * 2.5;
      cx.fillStyle = '#9bb98a'; cx.globalAlpha = a * (0.55 + 0.4 * Math.sin(T / 400 + i)); cx.beginPath(); cx.arc(x + 6, by, 2.6, 0, 6.283); cx.fill();
      cx.restore();
    } else if (i === Math.ceil(nsol / 2) && S.st.reb >= 3) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x + .5, y + 4.5, 11, 14); cx.setLineDash([]); }
  }
  if (nhrn > 0) {
    const a = pop('hrn', true); cx.save(); cx.globalAlpha = a; cx.translate(52, 16);
    cx.strokeStyle = COL.red; cx.beginPath(); cx.arc(0, 0, 9, 0, 6.283); cx.stroke();
    cx.rotate(T / 2500); cx.beginPath(); for (let i = 0; i < 5; i++) { const t = i * 2.5133; cx.lineTo(Math.cos(t) * 9, Math.sin(t) * 9); } cx.closePath(); cx.stroke();
    cx.fillStyle = COL.amb; for (let i = 0; i < nhrn; i++) { const t = i * 6.283 / Math.max(1, nhrn); cx.fillRect(Math.cos(t) * 9 - 1, Math.sin(t) * 9 - 1, 2.5, 2.5); }
    cx.restore();
  } else if (S.node >= 2) ghostRing(52, 16, 9);
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
      const pa = pop('sl' + i, true); cx.save(); cx.translate(-(1 - pa) * 60, 0);
      cx.globalAlpha = pa; cx.fillStyle = '#121215'; cx.fillRect(x, y, w, h); cx.strokeStyle = (S.rig.sld || 0) > 0 ? GOLDD : '#4a4640'; cx.strokeRect(x + .5, y + .5, w - 1, h - 1);
      if ((S.rig.sld || 0) > 0) { const sh = ((T / 1800 + i * 0.13) % 1) * (w + 20) - 10; cx.fillStyle = '#b08d57'; cx.globalAlpha = pa * Math.min(0.5, 0.1 + 0.03 * S.rig.sld); cx.fillRect(Math.max(x, x + sh), y + 1, Math.max(0, Math.min(6, w - sh)), h - 2); cx.globalAlpha = pa; }
      for (let k = 0; k < 10; k++) { cx.fillStyle = (Math.sin(T / 260 + i * 2 + k * 1.3) > 0.4) ? hot : '#26241f'; cx.fillRect(x + 6 + k * 5, y + 4, 3, 3); }
      cx.fillStyle = COL.grn; cx.fillRect(x + w - 12, y + 4, 4, 3); cx.fillStyle = '#26241f'; cx.fillRect(x + w - 40, y + 3, 22, 5);
      cx.restore(); cx.globalAlpha = 1;
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
  // cold aisle: fans and frost drifting through the sleds
  const nf = Math.min(8, S.rig.rcl || 0);
  for (let i = 0; i < 8; i++) {
    const fx = 296 + (i % 2) * 28, fy = 84 + Math.floor(i / 2) * 24;
    if (i < nf) { cx.globalAlpha = pop('rcl' + i, true); fan(fx, fy, 8, T / 110 * (1 + i * 0.07)); cx.globalAlpha = 1; for (let k = 0; k < 2; k++) { const f = (T / 1300 + k / 2 + i * 0.21) % 1; cx.fillStyle = '#8fa6a8'; cx.globalAlpha = (1 - f) * 0.55; cx.fillRect(fx - 10 - f * 36, fy + k * 4 - 2, 3, 1.5); cx.globalAlpha = 1; } }
    else if (i === nf && S.sled > 0) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.beginPath(); cx.arc(fx, fy, 8, 0, 6.283); cx.stroke(); cx.setLineDash([]); }
  }
  if (nf > 0) { cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('COLD AISLE ' + nf + '/8', 272, 70); }
  // cabling: a patch panel whose ports light up and pulse into the rack
  const nc = Math.min(8, S.rig.rcb || 0);
  if (S.sled > 0) {
    box(12, 126, 76, 56, 1, { label: 'CABLING', val: String(S.rig.rcb || 0) });
    for (let i = 0; i < 8; i++) {
      const px = 22 + (i % 4) * 16, py = 146 + Math.floor(i / 4) * 16;
      if (i < nc) {
        const a = pop('rcb' + i, true); cx.globalAlpha = a; cx.fillStyle = '#10150f'; cx.strokeStyle = COL.grn; cx.fillRect(px - 5, py - 4, 10, 8); cx.strokeRect(px - 4.5, py - 3.5, 9, 7);
        cx.strokeStyle = '#4a4640'; cx.beginPath(); cx.moveTo(px + 5, py); cx.quadraticCurveTo(94, py, 100, 34 + ((i * 17) % 140)); cx.stroke();
        const f = (T / 1100 + i * 0.19) % 1; cx.fillStyle = COL.grn; cx.fillRect(px + 5 + (100 - px - 5) * f - 1, py + (34 + ((i * 17) % 140) - py) * f * f - 1, 2.5, 2.5); cx.globalAlpha = 1;
      } else { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(px - 4.5, py - 3.5, 9, 7); cx.setLineDash([]); }
    }
  }
  trace(88, 80, 100, 80, 1); trace(260, 80, 272, 80, 2);
  ring(COL.amb, 40, 90);
}

// ---- THE CRYPT: coffins, bone ribs, ravens, ghoul archivists ----
const STONE = '#3a3732', GOLDD = '#6a5a3a';
function ghostRing(x, y, r) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.stroke(); cx.setLineDash([]); }
function cryptView() {
  const L = id => S.rig[id] || 0;
  box(6, 14, 348, 176, 1, { label: 'THE CRYPT · ARCHIVE', val: 'DATA ×' + S._M.dm.toFixed(2), stroke: STONE, fill: '#09090b' });
  cx.strokeStyle = STONE; cx.lineWidth = 2; cx.beginPath(); cx.arc(180, 168, 132, Math.PI, 0); cx.stroke(); cx.lineWidth = 1;
  cx.beginPath(); cx.moveTo(48, 168); cx.lineTo(48, 172); cx.moveTo(312, 168); cx.lineTo(312, 172); cx.moveTo(20, 172); cx.lineTo(340, 172); cx.stroke();
  // ribs hanging from the arch
  for (let i = 0; i < 6; i++) {
    const th = Math.PI + 0.55 + i * (Math.PI - 1.1) / 5, px = 180 + 132 * Math.cos(th), py = 168 + 132 * Math.sin(th);
    const own = i < L('bon'), next = i === L('bon');
    if (!own && !next) continue;
    const a = own ? pop('bon' + i, true) : 0.7;
    cx.globalAlpha = a; cx.strokeStyle = own ? '#bdb8ad' : COL.line; cx.setLineDash(own ? [] : [2, 2]);
    cx.beginPath(); cx.moveTo(px, py); cx.quadraticCurveTo(px + (180 - px) * 0.25, py + 8, px + (180 - px) * 0.12, py + 30); cx.stroke();
    if (own) for (let k = 1; k < 4; k++) { const f = k / 4; cx.beginPath(); cx.moveTo(px + (180 - px) * 0.1 * f - 3, py + 30 * f); cx.lineTo(px + (180 - px) * 0.1 * f + 3, py + 30 * f); cx.stroke(); }
    cx.setLineDash([]); cx.globalAlpha = 1;
  }
  // ravens perched on the arch
  for (let i = 0; i < 8; i++) {
    const th = Math.PI + 0.3 + i * (Math.PI - 0.6) / 7, px = 180 + 138 * Math.cos(th), py = 168 + 138 * Math.sin(th);
    if (i < L('rat')) {
      const a = pop('rat' + i, true), bob = Math.sin(T / 700 + i * 2) * 0.8;
      cx.save(); cx.globalAlpha = a; cx.translate(px, py - 2 + bob);
      cx.fillStyle = '#16161a'; cx.beginPath(); cx.ellipse(0, 0, 5, 3, 0, 0, 6.283); cx.fill();
      cx.beginPath(); cx.arc(4, -2.5, 2, 0, 6.283); cx.fill();
      cx.fillStyle = COL.amb; cx.beginPath(); cx.moveTo(5.5, -2.8); cx.lineTo(8.5, -2); cx.lineTo(5.5, -1.4); cx.fill();
      cx.fillStyle = COL.red; cx.fillRect(4, -3, 1, 1);
      cx.restore();
    } else if (i === L('rat')) ghostRing(px, py - 2, 4);
  }
  // coffins on the floor
  for (let i = 0; i < 8; i++) {
    const x = 62 + i * 30, y = 156, w = 24, h = 14;
    if (i < L('cof')) {
      const a = pop('cof' + i, true); cx.globalAlpha = a;
      cx.fillStyle = '#14110e'; cx.strokeStyle = GOLDD; cx.beginPath(); cx.moveTo(x + 4, y); cx.lineTo(x + w - 4, y); cx.lineTo(x + w, y + 5); cx.lineTo(x + w - 3, y + h); cx.lineTo(x + 3, y + h); cx.lineTo(x, y + 5); cx.closePath(); cx.fill(); cx.stroke();
      cx.strokeStyle = hot; cx.globalAlpha = a * (0.4 + 0.4 * Math.sin(T / 600 + i)); cx.beginPath(); cx.moveTo(x + w / 2, y + 3); cx.lineTo(x + w / 2, y + 11); cx.moveTo(x + w / 2 - 3, y + 6); cx.lineTo(x + w / 2 + 3, y + 6); cx.stroke();
      cx.globalAlpha = 1;
    } else if (i === L('cof')) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x + .5, y + .5, w - 1, h - 1); cx.setLineDash([]); }
  }
  // ghoul archivists standing among the coffins
  for (let i = 0; i < 6; i++) {
    const x = 75 + i * 42, y = 150;
    if (i < L('ghl')) {
      const a = pop('ghl' + i, true), sw = Math.sin(T / 900 + i) * 1.5;
      cx.save(); cx.globalAlpha = a; cx.translate(x + sw, 0);
      cx.fillStyle = '#121216'; cx.beginPath(); cx.moveTo(-7, y); cx.lineTo(7, y); cx.lineTo(0, y - 20); cx.closePath(); cx.fill();
      cx.fillStyle = Math.sin(T / 1700 + i * 3) > 0.96 ? '#121216' : COL.red; cx.fillRect(-3, y - 11, 2, 2); cx.fillRect(1, y - 11, 2, 2);
      cx.fillStyle = COL.amb; cx.globalAlpha = a * 0.9; cx.fillRect(9 + Math.sin(T / 500 + i) * 1.5, y - 6, 2, 3);
      cx.restore();
    } else if (i === L('ghl')) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.beginPath(); cx.moveTo(x - 7, y); cx.lineTo(x + 7, y); cx.lineTo(x, y - 20); cx.closePath(); cx.stroke(); cx.setLineDash([]); }
  }
  ring(COL.amb, 20, 70);
}

// ---- THE ALTAR: candles, chalice, standing stones, scrying orb ----
function altarView() {
  const L = id => S.rig[id] || 0;
  box(6, 14, 348, 176, 1, { label: 'THE ALTAR · RITE', val: '+' + (1.5 * L('can')).toFixed(1) + '%', stroke: STONE, fill: '#09090b' });
  // ground circle in perspective
  cx.save(); cx.translate(180, 160); cx.scale(1, 0.26); cx.strokeStyle = COL.red; cx.globalAlpha = 0.35; cx.lineWidth = 1.5;
  cx.beginPath(); cx.arc(0, 0, 118, 0, 6.283); cx.stroke(); cx.rotate(T / 9000); cx.beginPath();
  for (let i = 0; i < 5; i++) { const t = i * 2.5133 - 1.5708; cx.lineTo(Math.cos(t) * 118, Math.sin(t) * 118); } cx.closePath(); cx.stroke(); cx.restore(); cx.globalAlpha = 1;
  // altar block
  cx.fillStyle = '#17140f'; cx.strokeStyle = GOLDD; cx.fillRect(138, 126, 84, 16); cx.strokeRect(138.5, 126.5, 83, 15);
  cx.fillRect(150, 142, 60, 22); cx.strokeRect(150.5, 142.5, 59, 21);
  cx.strokeStyle = COL.red; cx.globalAlpha = 0.5; cx.beginPath(); cx.moveTo(168, 150); cx.lineTo(192, 150); cx.moveTo(180, 146); cx.lineTo(180, 160); cx.stroke(); cx.globalAlpha = 1;
  // chalice: fills with blood per level
  const bl = L('bsn') / 8;
  cx.strokeStyle = '#bdb8ad'; cx.fillStyle = '#0f0f12';
  cx.beginPath(); cx.moveTo(171, 108); cx.lineTo(189, 108); cx.quadraticCurveTo(188, 121, 180, 122); cx.quadraticCurveTo(172, 121, 171, 108); cx.fill(); cx.stroke();
  cx.fillRect(179, 122, 2, 4); cx.fillRect(175, 125, 10, 1.5);
  if (bl > 0) { const a = pop('bsn', true); cx.fillStyle = '#8a2a2a'; cx.globalAlpha = a; cx.fillRect(172, 118 - 8 * bl, 16, 8 * bl + 0.5); cx.globalAlpha = 1; }
  else ghostRing(180, 112, 8);
  // black candles on an arc
  for (let i = 0; i < 12; i++) {
    const th = Math.PI + 0.3 + i * (Math.PI - 0.6) / 11, x = 180 + 134 * Math.cos(th), y = 152 + 82 * Math.sin(th);
    if (i < L('can')) {
      const a = pop('can' + i, true); cx.globalAlpha = a;
      cx.fillStyle = '#d8d2c4'; cx.fillRect(x - 1.5, y, 3, 9);
      const f = 1 + Math.sin(T / 90 + i * 5) * 0.2; cx.fillStyle = '#f0a83a'; cx.beginPath(); cx.moveTo(x, y - 6 * f); cx.quadraticCurveTo(x + 3, y - 1, x, y + 1); cx.quadraticCurveTo(x - 3, y - 1, x, y - 6 * f); cx.fill();
      cx.fillStyle = '#fff1bf'; cx.fillRect(x - 0.5, y - 2, 1, 2);
      cx.globalAlpha = a * 0.12; cx.fillStyle = '#f0a83a'; cx.beginPath(); cx.arc(x, y - 2, 9, 0, 6.283); cx.fill(); cx.globalAlpha = 1;
    } else { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x - 1.5, y + .5, 3, 8); cx.setLineDash([]); if (i > L('can')) { cx.fillStyle = '#09090b'; cx.globalAlpha = 0.65; cx.fillRect(x - 3, y - 1, 6, 12); cx.globalAlpha = 1; } }
  }
  // standing stones: three each side
  const xs = [24, 46, 68, 292, 314, 336];
  for (let i = 0; i < 6; i++) {
    const x = xs[i], base = 170, h = 34 + (i % 3) * 5;
    if (i < L('sig')) {
      const a = pop('sig' + i, true); cx.globalAlpha = a;
      cx.fillStyle = '#16161a'; cx.strokeStyle = STONE; cx.beginPath(); cx.moveTo(x - 7, base); cx.lineTo(x - 5, base - h); cx.lineTo(x + 3, base - h - 4); cx.lineTo(x + 7, base); cx.closePath(); cx.fill(); cx.stroke();
      cx.strokeStyle = COL.amb; cx.globalAlpha = a * (0.5 + 0.4 * Math.sin(T / 700 + i)); cx.beginPath(); cx.moveTo(x, base - h + 6); cx.lineTo(x, base - h + 16); cx.moveTo(x - 3, base - h + 11); cx.lineTo(x + 3, base - h + 11); cx.moveTo(x - 2, base - h + 22); cx.lineTo(x + 2, base - h + 26); cx.stroke();
      cx.globalAlpha = 1;
    } else if (i === L('sig')) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.beginPath(); cx.moveTo(x - 7, base); cx.lineTo(x - 5, base - h); cx.lineTo(x + 3, base - h - 4); cx.lineTo(x + 7, base); cx.closePath(); cx.stroke(); cx.setLineDash([]); }
  }
  // scrying orb above the altar
  const ol = L('orb');
  if (ol > 0) {
    const a = pop('orb', true), r = 6 + ol * 3, y = 56 + Math.sin(T / 900) * 2;
    cx.save(); cx.globalAlpha = a; cx.translate(180, y);
    cx.fillStyle = '#120d14'; cx.strokeStyle = hot; cx.beginPath(); cx.arc(0, 0, r, 0, 6.283); cx.fill(); cx.stroke();
    cx.fillStyle = hot; for (let k = 0; k < 3; k++) { const t = T / 600 + k * 2.09; cx.globalAlpha = a * 0.8; cx.fillRect(Math.cos(t) * r * 0.55 - 1, Math.sin(t) * r * 0.55 - 1, 2, 2); }
    cx.restore();
  } else ghostRing(180, 56, 9);
  ring(COL.red, 20, 70);
}

// ---- THE ABYSS: portal, eyes, tentacles, tide ----
function abyssView() {
  const L = id => S.rig[id] || 0;
  box(6, 14, 348, 176, 1, { label: 'THE ABYSS · MAW', val: '×' + Math.pow(1.12, L('prt')).toFixed(2), stroke: '#2f2430', fill: '#060507' });
  const g = cx.createRadialGradient(180, 92, 4, 180, 92, 120); g.addColorStop(0, '#2a0f16'); g.addColorStop(1, '#060507');
  cx.fillStyle = g; cx.fillRect(7, 15, 346, 174);
  // portal core and rings
  cx.save(); cx.translate(180, 92);
  cx.fillStyle = '#000'; cx.beginPath(); cx.arc(0, 0, 22, 0, 6.283); cx.fill(); cx.strokeStyle = '#5a2a2a'; cx.stroke();
  const pl = L('prt');
  for (let k = 0; k < 3; k++) {
    const r = 32 + k * 14;
    if (k < pl) { cx.save(); cx.globalAlpha = pop('prt' + k, true); cx.rotate(T / (4000 + k * 1500) * (k % 2 ? -1 : 1)); cx.strokeStyle = k === 2 ? COL.amb : '#b08d57'; cx.setLineDash([8, 4]); cx.beginPath(); cx.arc(0, 0, r, 0, 6.283); cx.stroke(); cx.setLineDash([]); cx.restore(); }
    else if (k === pl) { cx.setLineDash([2, 4]); cx.strokeStyle = COL.line; cx.beginPath(); cx.arc(0, 0, r, 0, 6.283); cx.stroke(); cx.setLineDash([]); }
  }
  const blink = Math.sin(T / 3000) > 0.985 ? 0.15 : 1;
  cx.strokeStyle = COL.red; cx.beginPath(); cx.moveTo(-16, 0); cx.quadraticCurveTo(0, -10 * blink, 16, 0); cx.quadraticCurveTo(0, 10 * blink, -16, 0); cx.stroke();
  cx.fillStyle = COL.red; cx.fillRect(-1 + Math.sin(T / 1300) * 4, -5 * blink, 2.5, 10 * blink);
  cx.restore();
  // floating eyes around
  const EP = [[44, 52], [316, 56], [70, 112], [292, 108], [112, 40], [250, 38], [40, 96], [322, 100]];
  for (let i = 0; i < 8; i++) {
    const [ex, ey0] = EP[i], ey = ey0 + Math.sin(T / 1000 + i) * 3;
    if (i < L('eyr')) {
      const a = pop('eyr' + i, true), bl = Math.sin(T / 2600 + i * 4) > 0.97 ? 0.2 : 1;
      cx.save(); cx.globalAlpha = a; cx.translate(ex, ey); cx.strokeStyle = '#b08d57';
      cx.beginPath(); cx.moveTo(-7, 0); cx.quadraticCurveTo(0, -5 * bl, 7, 0); cx.quadraticCurveTo(0, 5 * bl, -7, 0); cx.stroke();
      cx.fillStyle = COL.red; cx.beginPath(); cx.arc(Math.sin(T / 1200 + i) * 1.5, 0, 1.8 * bl, 0, 6.283); cx.fill(); cx.restore();
    } else if (i === L('eyr')) { cx.globalAlpha = 0.9; ghostRing(ex, ey, 5); cx.globalAlpha = 1; }
  }
  // tentacles rising from the bottom
  for (let i = 0; i < 12; i++) {
    const bx = 24 + i * 28, h = 40 + ((i * 17) % 26);
    if (i < L('tnt')) {
      const a = pop('tnt' + i, true); cx.globalAlpha = a; cx.strokeStyle = '#5a2e2e'; cx.lineCap = 'round';
      cx.lineWidth = 3.2; cx.beginPath();
      for (let k = 0; k <= 12; k++) { const t = k / 12, x = bx + Math.sin(T / 700 + i * 1.3 + t * 4) * 9 * t, y = 188 - t * h * a; if (k === 0) cx.moveTo(x, y); else cx.lineTo(x, y); }
      cx.stroke(); cx.lineWidth = 1; cx.lineCap = 'butt';
      cx.fillStyle = '#b08d57'; cx.globalAlpha = a * 0.6;
      for (let k = 2; k < 10; k += 3) { const t = k / 12, x = bx + Math.sin(T / 700 + i * 1.3 + t * 4) * 9 * t; cx.fillRect(x - 0.5, 188 - t * h * a, 1.5, 1.5); }
      cx.globalAlpha = 1;
    } else if (i === L('tnt')) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.beginPath(); cx.ellipse(bx, 186, 5, 2, 0, 0, 6.283); cx.stroke(); cx.setLineDash([]); }
  }
  // tide of whispers
  const tl = L('tid');
  if (tl > 0) for (let k = 0; k < 1 + Math.floor(tl / 2); k++) {
    cx.strokeStyle = '#b08d57'; cx.globalAlpha = 0.22; cx.beginPath();
    for (let x = 10; x <= 350; x += 6) { const y = 176 - k * 4 + Math.sin(x / 18 + T / 500 + k) * 2; if (x === 10) cx.moveTo(x, y); else cx.lineTo(x, y); }
    cx.stroke(); cx.globalAlpha = 1;
  }
  ring(COL.red, 20, 70);
}

// ---- THE MEMORY BUS: RAM sticks, lanes of traffic, prefetcher, branch oracle, wards ----
function memView() {
  const L = id => S.rig[id] || 0, nr = L('ram'), nl = Math.min(8, L('lan')), np = Math.min(8, L('pre')), nb = Math.min(6, L('brp')), ne = L('ecc');
  box(6, 14, 348, 176, 1, { label: 'MEMORY BUS · BOARD', val: 'RAM ' + nr + ' · LANES ' + L('lan'), stroke: '#3a3732', fill: '#0b0b0e' });
  box(14, 28, 74, 60, 1, { label: 'CPU', stroke: hot });
  for (let i = 0; i < 9; i++) { cx.fillStyle = hot; cx.globalAlpha = 0.2 + 0.6 * Math.max(0, lit(i, act)); cx.fillRect(22 + (i % 3) * 20, 42 + Math.floor(i / 3) * 14, 16, 10); cx.globalAlpha = 1; }
  cx.strokeStyle = '#35322d'; cx.beginPath(); cx.moveTo(88, 58); cx.lineTo(96, 58); cx.moveTo(96.5, 40); cx.lineTo(96.5, 186); cx.stroke();
  // RAM sticks slide into their slots
  for (let i = 0; i < 4; i++) {
    const x = 106 + i * 60, y = 28, w = 50, h = 84;
    cx.fillStyle = '#0f0f12'; cx.fillRect(x - 2, y + h - 2, w + 4, 4);
    if (nr > i * 2) {
      const a = pop('ram' + i, true); cx.save(); cx.globalAlpha = a; cx.translate(0, -(1 - a) * 36);
      cx.fillStyle = '#14130f'; cx.fillRect(x, y, w, h); cx.strokeStyle = '#4a4640'; cx.strokeRect(x + .5, y + .5, w - 1, h - 1);
      for (let k = 0; k < 8; k++) { cx.fillStyle = hot; cx.globalAlpha = a * (0.2 + 0.7 * Math.max(0, lit(k + i * 3, act))); cx.fillRect(x + 6 + (k % 2) * 22, y + 8 + Math.floor(k / 2) * 17, 16, 12); }
      cx.globalAlpha = a; cx.fillStyle = GOLDD; for (let k = 0; k < 10; k++) cx.fillRect(x + 3 + k * 4.5, y + h - 5, 2.5, 4);
      cx.restore();
      const f = (T / (S.oc ? 500 : 900) + i * 0.23) % 1; cx.fillStyle = hot; cx.globalAlpha = 0.8; cx.fillRect(x + w / 2 - 1, y + h + 2 + f * 8, 2, 3); cx.globalAlpha = 1;
    } else if (nr === i * 2) { cx.setLineDash([3, 3]); cx.strokeStyle = COL.line; cx.strokeRect(x + .5, y + .5, w - 1, h - 1); cx.setLineDash([]); }
    else { cx.strokeStyle = COL.dim; cx.strokeRect(x + .5, y + .5, w - 1, h - 1); }
  }
  // bus lanes with traffic
  cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('LANES', 100, 118);
  for (let k = 0; k < 8; k++) {
    const y = 130 + k * 7.5;
    if (k < Math.max(1, nl)) {
      cx.strokeStyle = '#2a2824'; cx.beginPath(); cx.moveTo(100, y); cx.lineTo(268, y); cx.stroke();
      const a = k === 0 && nl === 0 ? 1 : pop('lan' + k, true), n = 4, dir = k % 2 ? -1 : 1;
      for (let j = 0; j < n; j++) { let f = (T / (S.oc ? 800 : 1500) * (1 + k * 0.08) + j / n + k * 0.17) % 1; if (dir < 0) f = 1 - f; cx.fillStyle = hot; cx.globalAlpha = 0.85 * a; cx.fillRect(100 + f * 166, y - 1, 5, 2); }
      cx.globalAlpha = 1;
    } else if (k === Math.max(1, nl)) { cx.setLineDash([2, 3]); cx.strokeStyle = COL.line; cx.beginPath(); cx.moveTo(100, y); cx.lineTo(268, y); cx.stroke(); cx.setLineDash([]); }
  }
  // prefetcher: chevrons marching ahead of the traffic
  box(278, 118, 68, 66, 1, { label: 'PREFETCH', val: String(L('pre')) });
  for (let i = 0; i < 8; i++) {
    const x = 286 + (i % 2) * 28, y = 134 + Math.floor(i / 2) * 12;
    if (i < np) { const a = pop('pre' + i, true), ph = 0.35 + 0.65 * Math.max(0, Math.sin(T / 260 - i * 0.7)); cx.strokeStyle = COL.grn; cx.globalAlpha = a * ph; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + 5, y + 3.5); cx.lineTo(x, y + 7); cx.moveTo(x + 7, y); cx.lineTo(x + 12, y + 3.5); cx.lineTo(x + 7, y + 7); cx.stroke(); cx.globalAlpha = 1; }
    else if (i === np) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x + .5, y + .5, 14, 7); cx.setLineDash([]); }
  }
  // branch oracle: a tree whose path flickers
  box(14, 112, 74, 72, 1, { label: 'ORACLE', val: String(L('brp')) });
  const NP = [[51, 128], [33, 144], [69, 144], [24, 162], [42, 162], [60, 162], [78, 162]], PA = [[0, 1, 3], [0, 1, 4], [0, 2, 5], [0, 2, 6]], ph = Math.floor(T / 800) % 4;
  for (let i = 1; i < 7; i++) {
    const par = i < 3 ? 0 : i < 5 ? 1 : 2;
    if (i <= nb) { cx.strokeStyle = '#4a4640'; cx.beginPath(); cx.moveTo(NP[par][0], NP[par][1]); cx.lineTo(NP[i][0], NP[i][1]); cx.stroke(); }
  }
  for (let i = 0; i < 7; i++) {
    const [x, y] = NP[i];
    if (i <= nb) { const on = PA[ph].indexOf(i) >= 0; cx.fillStyle = on ? hot : '#26241f'; cx.globalAlpha = pop('brp' + i, true); cx.beginPath(); cx.arc(x, y, 3.2, 0, 6.283); cx.fill(); cx.globalAlpha = 1; }
    else if (i === nb + 1) ghostRing(x, y, 3.2);
  }
  // warding shields under the CPU
  for (let i = 0; i < 3; i++) {
    const x = 26 + i * 25, y = 94;
    cx.beginPath(); cx.moveTo(x - 7, y); cx.lineTo(x + 7, y); cx.lineTo(x + 7, y + 8); cx.lineTo(x, y + 14); cx.lineTo(x - 7, y + 8); cx.closePath();
    if (i < ne) { cx.fillStyle = '#10150f'; cx.globalAlpha = pop('ecc' + i, true); cx.fill(); cx.strokeStyle = COL.grn; cx.stroke(); cx.globalAlpha = 0.4 + 0.5 * Math.sin(T / 500 + i); cx.fillStyle = COL.grn; cx.fillRect(x - 1, y + 4, 2, 4); cx.globalAlpha = 1; }
    else if (i === ne) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.stroke(); cx.setLineDash([]); }
  }
  ring(COL.teal, 20, 70);
}

// ---- THE FOUNDRY: laser, lens stack, wafer belt, cleanroom filters ----
function fabView() {
  const C = root.CORE, L = id => S.rig[id] || 0, lr = Math.min(6, L('lsr')), nl = Math.min(4, L('lns')), nw = Math.min(8, L('wfr')), nc = Math.min(8, L('clr'));
  box(6, 14, 348, 176, 1, { label: 'THE FOUNDRY · LITHOGRAPHY', val: C.NODES[S.node], stroke: '#3a3732', fill: '#0a0a0d' });
  // cleanroom filter panels with falling clean air
  for (let i = 0; i < 8; i++) {
    const x = i < 4 ? 16 + i * 26 : 244 + (i - 4) * 26, y = 24;
    if (i < nc) {
      const a = pop('clr' + i, true); cx.globalAlpha = a; cx.fillStyle = '#0f1112'; cx.fillRect(x, y, 22, 8); cx.strokeStyle = '#4a4640'; cx.strokeRect(x + .5, y + .5, 21, 7);
      cx.fillStyle = '#8fa6a8'; for (let k = 0; k < 3; k++) { const f = (T / 1400 + k / 3 + i * 0.13) % 1; cx.globalAlpha = a * (1 - f) * 0.6; cx.fillRect(x + 4 + k * 7, y + 9 + f * 90, 1.5, 4); }
      cx.globalAlpha = 1;
    } else if (i === nc) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x + .5, y + .5, 21, 7); cx.setLineDash([]); }
  }
  // laser head
  box(150, 22, 60, 26, 1, { label: 'LASER', val: String(L('lsr')) });
  // lens stack
  for (let k = 0; k < 4; k++) {
    const y = 58 + k * 10, rx = 22 - k * 3;
    if (k < nl) { const a = pop('lns' + k, true); cx.globalAlpha = a; cx.strokeStyle = '#8fa6a8'; cx.fillStyle = '#10181a'; cx.beginPath(); cx.ellipse(180, y, rx, 3.2, 0, 0, 6.283); cx.fill(); cx.stroke(); cx.globalAlpha = 1; }
    else if (k === nl) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.beginPath(); cx.ellipse(180, y, rx, 3.2, 0, 0, 6.283); cx.stroke(); cx.setLineDash([]); }
  }
  // wafer stage and the scanning beam
  const sx = 180 + Math.sin(T / (S.oc ? 350 : 700)) * 34;
  cx.fillStyle = '#17171b'; cx.fillRect(110, 124, 140, 5); cx.strokeStyle = '#4a4640'; cx.strokeRect(110.5, 124.5, 139, 4);
  cx.fillStyle = '#1d1c18'; cx.strokeStyle = GOLDD; cx.beginPath(); cx.ellipse(180, 122, 44, 4, 0, 0, 6.283); cx.fill(); cx.stroke();
  for (let i = 0; i < 14; i++) { const x = 146 + i * 5.2; cx.fillStyle = hot; cx.globalAlpha = Math.abs(x - sx) < 14 ? 0.9 : (x < sx ? 0.35 : 0.08); cx.fillRect(x, 120.5, 3, 3); }
  cx.globalAlpha = 1;
  if (lr > 0) {
    const bw = 2 + lr * 1.1; cx.fillStyle = hot; cx.globalAlpha = 0.12 + 0.04 * lr;
    cx.beginPath(); cx.moveTo(180 - 5, 48); cx.lineTo(180 + 5, 48); cx.lineTo(sx + bw / 2, 121); cx.lineTo(sx - bw / 2, 121); cx.closePath(); cx.fill();
    cx.globalAlpha = 0.9; cx.fillRect(sx - 1, 119, 2, 3); cx.globalAlpha = 1;
  } else { cx.setLineDash([2, 3]); cx.strokeStyle = COL.line; cx.beginPath(); cx.moveTo(180, 48); cx.lineTo(180, 120); cx.stroke(); cx.setLineDash([]); }
  // wafer belt
  cx.strokeStyle = '#35322d'; cx.beginPath(); cx.moveTo(14, 156); cx.lineTo(346, 156); cx.moveTo(14, 170); cx.lineTo(346, 170); cx.stroke();
  const roll = (T / 40) % 16; cx.fillStyle = '#2a2824'; for (let x = 14 + roll; x < 346; x += 16) cx.fillRect(x, 162, 6, 1.5);
  for (let i = 0; i < 8; i++) {
    if (i < nw) {
      const f = (T / 7000 + i / Math.max(2, nw)) % 1, x = 14 + f * 332, a = Math.min(1, pop('wfr' + i, true), f * 8, (1 - f) * 8);
      cx.globalAlpha = a; cx.fillStyle = '#26241f'; cx.strokeStyle = '#bdb8ad'; cx.beginPath(); cx.ellipse(x, 158, 10, 3, 0, 0, 6.283); cx.fill(); cx.stroke();
      cx.fillStyle = hot; cx.globalAlpha = a * 0.7; cx.fillRect(x - 3, 157, 2, 1.5); cx.fillRect(x + 1, 157, 2, 1.5); cx.globalAlpha = 1;
    }
  }
  if (nw < 8) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.beginPath(); cx.ellipse(24, 158, 10, 3, 0, 0, 6.283); cx.stroke(); cx.setLineDash([]); }
  cx.fillStyle = COL.txt; cx.font = '600 7px "Chakra Petch"'; cx.fillText('WAFERS ' + L('wfr') + '/' + C.rigCap(S, C.RIG.find(u => u.id === 'wfr')), 16, 176);
  cx.fillText('LENSES ' + L('lns') + '/4', 300, 176);
  ring(COL.teal, 20, 70);
}

// ---- THE OSSUARY: skull choir, reliquaries, grave wind, lich vessels ----
function ossuaryView() {
  const L = id => S.rig[id] || 0, ns = L('skl'), nr = L('rel'), nw = L('gwd'), nl = L('lch');
  box(6, 14, 348, 176, 1, { label: 'THE OSSUARY · CHOIR', val: 'SKULLS ' + ns, stroke: '#4a4540', fill: '#09080a' });
  cx.strokeStyle = '#1f1d1b';
  for (let i = 0; i < 6; i++) { const x = 20 + i * 62; cx.beginPath(); cx.moveTo(x, 188); cx.lineTo(x, 60); cx.quadraticCurveTo(x + 31, 18, x + 62, 60); cx.lineTo(x + 62, 188); cx.stroke(); }
  for (let i = 0; i < 10; i++) {
    const x = 36 + (i % 5) * 70, y = 44 + Math.floor(i / 5) * 34;
    cx.fillStyle = '#17161a'; cx.fillRect(x - 14, y + 10, 28, 3);
    if (i < ns) {
      const a = pop('skl' + i, true), sing = Math.max(0, Math.sin(T / 500 + i * 1.7)), open = sing * 3.5;
      cx.save(); cx.globalAlpha = a; cx.translate(x, y);
      cx.fillStyle = '#bdb8ad'; cx.beginPath(); cx.ellipse(0, 0, 8, 7.5, 0, 0, 6.283); cx.fill();
      cx.fillRect(-5, 5, 10, 3 + open); cx.fillStyle = '#09080a'; cx.fillRect(-2, 7, 1.5, 2 + open * 0.8); cx.fillRect(1, 7, 1.5, 2 + open * 0.8);
      cx.beginPath(); cx.arc(-3, -1, 2, 0, 6.283); cx.arc(3, -1, 2, 0, 6.283); cx.fill();
      cx.fillStyle = hot; cx.globalAlpha = a * (0.4 + 0.6 * sing); cx.fillRect(-3.5, -1.5, 1.5, 1.5); cx.fillRect(2, -1.5, 1.5, 1.5);
      if (sing > 0.8) { cx.strokeStyle = hot; cx.globalAlpha = a * 0.3; cx.beginPath(); cx.arc(0, 0, 11 + (sing - 0.8) * 30, 0, 6.283); cx.stroke(); }
      cx.restore();
    } else if (i === ns) ghostRing(x, y, 8);
  }
  for (let i = 0; i < 8; i++) {
    const x = 26 + i * 41, y = 148;
    if (i < nr) {
      const a = pop('rel' + i, true); cx.globalAlpha = a; cx.fillStyle = '#12110f'; cx.fillRect(x, y, 26, 16); cx.strokeStyle = GOLDD; cx.strokeRect(x + .5, y + .5, 25, 15);
      cx.fillStyle = hot; cx.globalAlpha = a * (0.5 + 0.5 * Math.sin(T / 700 + i)); cx.fillRect(x + 12, y + 3, 2, 10); cx.fillRect(x + 8, y + 6, 10, 2); cx.globalAlpha = 1;
    } else if (i === nr) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x + .5, y + .5, 25, 15); cx.setLineDash([]); }
  }
  for (let k = 0; k < Math.min(8, nw); k++) {
    cx.strokeStyle = '#8fa6a8'; cx.globalAlpha = 0.16; cx.beginPath();
    for (let x = 10; x <= 350; x += 6) { const y = 64 + k * 12 + Math.sin(x / 22 + T / 420 + k * 1.3) * 3; if (x === 10) cx.moveTo(x, y); else cx.lineTo(x, y); }
    cx.stroke(); cx.globalAlpha = 1;
  }
  for (let k = 0; k < 3; k++) {
    const x = 114 + k * 66, y = 110;
    if (k < nl) {
      const a = pop('lch' + k, true), pu = 0.5 + 0.5 * Math.sin(T / 650 + k * 2);
      cx.globalAlpha = a; cx.fillStyle = '#0f1512'; cx.strokeStyle = '#6a7a5a'; cx.beginPath(); cx.moveTo(x - 7, y - 10); cx.lineTo(x + 7, y - 10); cx.lineTo(x + 10, y + 8); cx.lineTo(x - 10, y + 8); cx.closePath(); cx.fill(); cx.stroke();
      cx.fillStyle = '#9ab07a'; cx.globalAlpha = a * (0.4 + 0.6 * pu); cx.beginPath(); cx.arc(x, y - 1, 3 + pu * 2, 0, 6.283); cx.fill(); cx.globalAlpha = 1;
    } else if (k === nl) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x - 9.5, y - 10.5, 19, 19); cx.setLineDash([]); }
  }
  ring(COL.teal, 20, 70);
}

// ---- THE VOID FOUNDRY: null wafers, event horizon, singularity coils, entropy sinks ----
function voidView() {
  const L = id => S.rig[id] || 0, nw = L('vwf'), nh = L('evh'), nc = L('sng'), ne = L('ent');
  box(6, 14, 348, 176, 1, { label: 'THE VOID FOUNDRY · NULL', val: 'NULL ×' + nw, stroke: '#2b2540', fill: '#050409' });
  const g = cx.createRadialGradient(180, 100, 4, 180, 100, 120); g.addColorStop(0, '#1a1030'); g.addColorStop(1, '#050409'); cx.fillStyle = g; cx.fillRect(7, 15, 346, 174);
  // entropy sinks: dim motes falling into the well
  for (let i = 0; i < 8; i++) {
    if (i >= ne) break;
    const a = pop('ent' + i, true), x = i < 4 ? 26 + i * 18 : 262 + (i - 4) * 18;
    for (let k = 0; k < 3; k++) { const f = (T / 1800 + k / 3 + i * 0.21) % 1; cx.fillStyle = '#8f80c8'; cx.globalAlpha = a * (1 - f) * 0.5; cx.fillRect(x + Math.sin(f * 6 + i) * 3, 24 + f * 150, 1.5, 5); }
    cx.globalAlpha = 1;
  }
  // singularity coils: jagged arcs reaching the centre
  const CP = [[20, 24], [340, 24], [20, 176], [340, 176], [180, 20], [180, 180], [24, 100], [336, 100]];
  for (let i = 0; i < 8; i++) {
    const [x, y] = CP[i];
    if (i < nc) {
      const a = pop('sng' + i, true); cx.strokeStyle = '#b39ddb'; cx.globalAlpha = a * (0.25 + 0.5 * Math.max(0, Math.sin(T / 190 + i * 2.1))); cx.beginPath(); cx.moveTo(x, y);
      for (let k = 1; k <= 6; k++) { const t = k / 6; cx.lineTo(x + (180 - x) * t * 0.78 + Math.sin(T / 120 + i * k) * 5, y + (100 - y) * t * 0.78 + Math.cos(T / 140 + i + k) * 5); }
      cx.stroke(); cx.fillStyle = '#b39ddb'; cx.fillRect(x - 2, y - 2, 4, 4); cx.globalAlpha = 1;
    } else if (i === nc) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x - 2.5, y - 2.5, 5, 5); cx.setLineDash([]); }
  }
  // event horizon rings, expanding and fading
  for (let k = 0; k < 3; k++) if (k < nh) { const f = (T / 2600 + k / 3) % 1; cx.strokeStyle = '#b08d57'; cx.globalAlpha = (1 - f) * 0.55 * pop('evh' + k, true); cx.beginPath(); cx.arc(180, 100, 22 + f * 70, 0, 6.283); cx.stroke(); cx.globalAlpha = 1; }
  // the well
  cx.fillStyle = '#000'; cx.beginPath(); cx.arc(180, 100, 17, 0, 6.283); cx.fill();
  cx.save(); cx.translate(180, 100); cx.rotate(-0.35); cx.strokeStyle = '#c98a3a'; cx.globalAlpha = 0.7; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(0, 0, 30, 7, 0, 0, 6.283); cx.stroke(); cx.lineWidth = 1; cx.restore(); cx.globalAlpha = 1;
  // null wafers in orbit
  for (let i = 0; i < 10; i++) {
    if (i >= nw) { if (i === nw) { const an = T / 6000 + i / 10 * 6.283; ghostRing(180 + Math.cos(an) * 74, 100 + Math.sin(an) * 30, 5); } continue; }
    const a = pop('vwf' + i, true), an = T / 6000 * (1 + (i % 3) * 0.12) + i / 10 * 6.283, x = 180 + Math.cos(an) * (62 + (i % 3) * 12), y = 100 + Math.sin(an) * (26 + (i % 3) * 5), front = Math.sin(an) > 0 ? 1 : 0.5;
    cx.globalAlpha = a * front; cx.fillStyle = '#000'; cx.strokeStyle = '#b39ddb'; cx.beginPath(); cx.ellipse(x, y, 8, 3, 0, 0, 6.283); cx.fill(); cx.stroke(); cx.globalAlpha = 1;
  }
  ring(COL.teal, 20, 70);
}

// ---- THE STAR FORGE: stellar core, pulsar beams, neutron anvils, supernova rings ----
function starView() {
  const L = id => S.rig[id] || 0, ns = L('stc'), np = L('pls'), na = L('anv'), nn = L('nov');
  box(6, 14, 348, 176, 1, { label: 'THE STAR FORGE · CORE', val: 'CORE ' + ns + '/12', stroke: '#4a3a24', fill: '#07060a' });
  const R = 12 + ns * 1.4, pu = 1 + Math.sin(T / 600) * 0.05;
  const gl = cx.createRadialGradient(180, 92, 2, 180, 92, 90); gl.addColorStop(0, 'rgba(255,214,150,' + (0.25 + ns * 0.03) + ')'); gl.addColorStop(1, 'rgba(255,214,150,0)'); cx.fillStyle = gl; cx.fillRect(7, 15, 346, 174);
  for (let k = 0; k < 4; k++) if (k < nn) { const f = (T / 3200 + k / 4) % 1; cx.strokeStyle = '#ffd596'; cx.globalAlpha = (1 - f) * 0.5 * pop('nov' + k, true); cx.lineWidth = 1.5; cx.beginPath(); cx.arc(180, 92, R + f * 100, 0, 6.283); cx.stroke(); cx.globalAlpha = 1; cx.lineWidth = 1; }
  for (let k = 0; k < 8; k++) {
    if (k < np) { const an = T / (1800 - k * 90) * (k % 2 ? -1 : 1) + k * 0.8; cx.save(); cx.translate(180, 92); cx.rotate(an); cx.globalAlpha = 0.3 * pop('pls' + k, true); cx.fillStyle = '#ffe9c4'; cx.beginPath(); cx.moveTo(0, -1.5); cx.lineTo(120, -0.4); cx.lineTo(120, 0.4); cx.lineTo(0, 1.5); cx.fill(); cx.restore(); cx.globalAlpha = 1; }
    else if (k === np) { cx.setLineDash([2, 3]); cx.strokeStyle = COL.line; cx.beginPath(); cx.moveTo(180, 92); cx.lineTo(180 + Math.cos(k * 0.8) * 90, 92 + Math.sin(k * 0.8) * 90); cx.stroke(); cx.setLineDash([]); }
  }
  cx.fillStyle = '#ffd596'; cx.beginPath(); cx.arc(180, 92, R * pu, 0, 6.283); cx.fill();
  cx.fillStyle = '#fff3d9'; cx.beginPath(); cx.arc(180, 92, R * 0.55 * pu, 0, 6.283); cx.fill();
  for (let i = 0; i < 12; i++) if (i < ns) { const an = i / 12 * 6.283 + T / 9000; cx.fillStyle = '#c98a3a'; cx.globalAlpha = 0.7; cx.fillRect(180 + Math.cos(an) * (R + 6) - 1, 92 + Math.sin(an) * (R + 6) - 1, 2, 2); cx.globalAlpha = 1; }
  for (let k = 0; k < 3; k++) {
    const x = 70 + k * 110, y = 160;
    if (k < na) {
      const a = pop('anv' + k, true), st = Math.max(0, Math.sin(T / 500 + k * 2));
      cx.globalAlpha = a; cx.fillStyle = '#1a1a1e'; cx.strokeStyle = '#8d8a7c'; cx.beginPath(); cx.moveTo(x - 16, y - 8); cx.lineTo(x + 16, y - 8); cx.lineTo(x + 10, y); cx.lineTo(x + 6, y + 6); cx.lineTo(x + 12, y + 12); cx.lineTo(x - 12, y + 12); cx.lineTo(x - 6, y + 6); cx.lineTo(x - 10, y); cx.closePath(); cx.fill(); cx.stroke();
      if (st > 0.9) { cx.fillStyle = '#ffd596'; for (let q = 0; q < 5; q++) cx.fillRect(x - 4 + q * 3 + Math.sin(T / 40 + q) * 3, y - 14 - (st - 0.9) * 90 * (0.4 + q * 0.2), 1.5, 1.5); }
      cx.globalAlpha = 1;
    } else if (k === na) { cx.setLineDash([2, 2]); cx.strokeStyle = COL.line; cx.strokeRect(x - 15.5, y - 7.5, 31, 20); cx.setLineDash([]); }
  }
  ring(COL.amb, 20, 70);
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
  const hf = Math.min(1, S.heat / S._M.hcap), mc = S.thr ? '184,64,63' : hf > 0.7 ? '201,138,58' : '176,141,87';
  const mg = cx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, Math.max(w, h) * 0.65);
  mg.addColorStop(0, 'rgba(' + mc + ',' + (0.03 + 0.17 * hf * (0.75 + 0.25 * Math.sin(T / (1200 - 800 * hf)))).toFixed(3) + ')'); mg.addColorStop(1, 'rgba(' + mc + ',0)');
  cx.fillStyle = mg; cx.fillRect(0, 0, w, h);
  const sc = Math.min(w / W, h / H);
  cx.save(); cx.translate((w - W * sc) / 2, (h - H * sc) / 2); cx.scale(sc, sc);
  hot = S.thr ? COL.red : S.heat / S._M.hcap > 0.7 ? COL.amb : COL.teal;
  act = S.thr ? 0.25 : S.oc ? 1 : 0.7;
  cx.textBaseline = 'top';
  if (view !== 'rack' && view !== 'board') {} 
  embers();
  if (view === 'board') boardView(); else if (view === 'rack') rackView(); else if (view === 'mem') memView(); else if (view === 'fab') fabView(); else if (view === 'crypt') cryptView(); else if (view === 'altar') altarView(); else if (view === 'abyss') abyssView(); else if (view === 'ossuary') ossuaryView(); else if (view === 'void') voidView(); else if (view === 'star') starView(); else chipView();
  cx.restore();
}
root.SCENE = { init, draw, views, pulse };
})(typeof window !== 'undefined' ? window : globalThis);
