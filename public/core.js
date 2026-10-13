(function (root) {
'use strict';

// ---------- static data ----------
const MS = [25, 50, 100, 200, 300, 400, 500, 600, 800, 1000]; // each milestone: x2 to that tier
const GENS = [
  { id: 'tr',   n: 'Transistor',    b: 10,     r: 1.12, p: 0.25,  u: 0, d: 'Sand that learned to say yes or no.' },
  { id: 'lg',   n: 'Logic Gate',    b: 120,    r: 1.13, p: 2.5,     u: 0, d: 'Three can argue. Two can agree.' },
  { id: 'alu',  n: 'ALU',           b: 1.5e3,  r: 1.14, p: 27,    u: 0, d: 'It counts, and does not tire.' },
  { id: 'reg',  n: 'Register',      b: 2e4,    r: 1.14, p: 308,   u: 0, d: 'A pocket for the thing being thought.' },
  { id: 'l1',   n: 'L1 Cache',      b: 3e5,    r: 1.15, p: 3750, u: 0, d: 'Memory kept close to the heart.' },
  { id: 'l2',   n: 'L2 Cache',      b: 5e6,    r: 1.15, p: 52600, u: 0, d: 'Larger. Slower. Still faithful.' },
  { id: 'core', n: 'Core',          b: 9e7,    r: 1.16, p: 780000, u: 0, d: 'A second mind behind the same eyes.' },
  { id: 'pipe', n: 'Pipeline',      b: 2e9,    r: 1.16, p: 1.43e+07, u: 0, d: 'Fourteen stages, one long breath.' },
  { id: 'chip', n: 'Chiplet',       b: 5e10,   r: 1.17, p: 2.94e+08, u: 1, d: 'Cut apart to be made stronger.' },
  { id: 'die',  n: 'Die',           b: 1.5e12, r: 1.17, p: 7.5e+09, u: 2, d: 'A city etched on a fingernail.' },
  { id: 'waf',  n: 'Wafer',         b: 6e13,   r: 1.18, p: 2.5e+11,   u: 4, d: 'A dark disc. Hundreds of cities.' },
  { id: 'fab',  n: 'Cathedral Fab', b: 3e15,   r: 1.18, p: 1.03e+13,  u: 6, d: 'Light is the only chisel here.' }
];
const NODES = ['180nm', '130nm', '90nm', '65nm', '45nm', '32nm', '22nm', '14nm', '10nm', '7nm', '5nm', '3nm', '2nm'];
const REQ = [90, 300, 700, 2200, 7000, 22000, 70000, 220000, 700000, 2200000, 7000000, 22000000]; // lifetime microcode to shrink from node i
const NODE_MULT = 2.5;
const MUK = 2e8, MUP = 0.4;

const PROCS = [
  { id: 'init', n: 'init',      d: 'Wake what sleeps below.',          t: 8,   c: 2,   r: { data: 1.5 }, u: 0 },
  { id: 'kw',   n: 'kworker',   d: 'Small hands, patient work.',       t: 25,  c: 5,   r: { data: 10 },  u: 0 },
  { id: 'fsck', n: 'fsck',      d: 'Mend the cracks. Cool the stone.', t: 15,  c: 3,   r: { cool: 60 },  u: 0 },
  { id: 'cron', n: 'cron',      d: 'The old schedule pays in cycles.', t: 30,  c: 10,  r: { burst: 16 }, u: 0 },
  { id: 'exo',  n: 'exorcist',  d: 'Cast out what lingers in memory.', t: 90,  c: 15,  r: { data: 120 }, u: 2 },
  { id: 'rit',  n: 'ritual.sh', d: 'A script nobody dares read.',      t: 180, c: 30,  r: { data: 600 }, u: 4 }
];

const RES = [
  { id: 'a1', b: 'Logic',     n: 'Boolean Algebra', d: '+25% cycles',                      c: 10,   fx: M => { M.g *= 1.25; } },
  { id: 'a2', b: 'Logic',     n: 'Superscalar',     d: '×1.5 cycles',                      c: 60,   fx: M => { M.g *= 1.5; } },
  { id: 'a3', b: 'Logic',     n: 'Out-of-Order',    d: '×2 cycles',                        c: 400,  fx: M => { M.g *= 2; } },
  { id: 'a4', b: 'Logic',     n: 'Speculation',     d: '×2.5 cycles',                      c: 3e3,  fx: M => { M.g *= 2.5; } },
  { id: 'a5', b: 'Logic',     n: 'Lithic Sigil',    d: '×3 cycles',                        c: 25e3, fx: M => { M.g *= 3; } },
  { id: 'b1', b: 'Thermal',   n: 'Heatsink',        d: '+1.5 cooling/s',                   c: 15,   fx: M => { M.cool += 1.5; } },
  { id: 'b2', b: 'Thermal',   n: 'Thermal Paste',   d: '+2 cooling/s',                     c: 90,   fx: M => { M.cool += 2; } },
  { id: 'b3', b: 'Thermal',   n: 'Voltage Curve',   d: 'Overclock +0.25×',                 c: 500,  fx: M => { M.oc += 0.25; } },
  { id: 'b4', b: 'Thermal',   n: 'Liquid Loop',     d: '+4 cooling/s',                     c: 4e3,  fx: M => { M.cool += 4; } },
  { id: 'b5', b: 'Thermal',   n: 'Cryo Altar',      d: '+8 cooling/s, overclock +0.5×',    c: 3e4,  fx: M => { M.cool += 8; M.oc += 0.5; } },
  { id: 'c1', b: 'Memory',    n: 'Prefetcher',      d: 'Ticks add +2% of cycles/s',        c: 12,   fx: M => { M.tapP += 0.02; } },
  { id: 'c2', b: 'Memory',    n: 'L1 Tuning',       d: 'Register & L1 ×2',                 c: 70,   fx: M => { M.gen[3] *= 2; M.gen[4] *= 2; } },
  { id: 'c3', b: 'Memory',    n: 'TLB',             d: 'Ticks add +3% more',               c: 450,  fx: M => { M.tapP += 0.03; } },
  { id: 'c4', b: 'Memory',    n: 'Victim Cache',    d: 'L2 & Core ×2',                     c: 3500, fx: M => { M.gen[5] *= 2; M.gen[6] *= 2; } },
  { id: 'c5', b: 'Memory',    n: 'Memory Wall',     d: 'Generators cost −10%',             c: 28e3, fx: M => { M.cost *= 0.9; } },
  { id: 'd1', b: 'Scheduler', n: 'Context Switch',  d: '+1 thread',                        c: 20,   fx: M => { M.thr += 1; } },
  { id: 'd2', b: 'Scheduler', n: 'Priority Queue',  d: 'Tasks run 25% faster',             c: 120,  fx: M => { M.ps *= 1.25; } },
  { id: 'd3', b: 'Scheduler', n: 'SMT',             d: '+1 thread',                        c: 800,  fx: M => { M.thr += 1; } },
  { id: 'd4', b: 'Scheduler', n: 'NUMA',            d: 'Tasks yield ×2 data',              c: 5e3,  fx: M => { M.dm *= 2; } },
  { id: 'd5', b: 'Scheduler', n: 'Hypervisor',      d: '+1 thread, interrupts pay ×2',     c: 4e4,  fx: M => { M.thr += 1; M.irqP *= 2; } }
];
RES.forEach((r, i) => { r.req = (i % 5) ? RES[i - 1].id : null; });

const SHOP = [
  { id: 's1',  n: 'Cold Boot I',      d: 'Begin each run with 15 Transistors, 5 Logic Gates', c: 2,   fx: M => { M.sg[0] += 15; M.sg[1] += 5; } },
  { id: 's2',  n: 'Firmware I',       d: '×1.5 cycles',                          c: 3,   fx: M => { M.g *= 1.5; } },
  { id: 's3',  n: 'Prefetch Mask',    d: 'Generators cost −10%',                 c: 5,   fx: M => { M.cost *= 0.9; } },
  { id: 's4',  n: 'Interrupt Magnet', d: 'Interrupts arrive twice as often',     c: 6,   fx: M => { M.irqR *= 2; } },
  { id: 's5',  n: 'Overvolt',         d: 'Overclock +0.5×',                      c: 10,  fx: M => { M.oc += 0.5; } },
  { id: 's6',  n: 'Heat Spreader',    d: 'Cooling ×1.5',                         c: 10,  fx: M => { M.coolM *= 1.5; } },
  { id: 's7',  n: 'Cold Boot II',     d: 'Also begin with 10 ALUs, 5 Registers', c: 12,  req: 's1',  fx: M => { M.sg[2] += 10; M.sg[3] += 5; } },
  { id: 's8',  n: 'Firmware II',      d: '×2 cycles',                            c: 15,  req: 's2',  fx: M => { M.g *= 2; } },
  { id: 's9',  n: 'Hyperthread',      d: '+1 thread',                            c: 20,  fx: M => { M.thr += 1; } },
  { id: 's10', n: 'Microcode Cache',  d: 'Offline limit +6 hours',               c: 30,  fx: M => { M.off += 6; } },
  { id: 's11', n: 'Branch Oracle',    d: 'Tasks run 1.5× faster',                c: 40,  fx: M => { M.ps *= 1.5; } },
  { id: 's12', n: 'Firmware III',     d: '×3 cycles',                            c: 60,  req: 's8',  fx: M => { M.g *= 3; } },
  { id: 's13', n: 'Cold Boot III',    d: 'Also begin with 10 L1, 5 L2 caches',   c: 90,  req: 's7',  fx: M => { M.sg[4] += 10; M.sg[5] += 5; } },
  { id: 's14', n: 'Firmware IV',      d: '×4 cycles',                            c: 250, req: 's12', fx: M => { M.g *= 4; } }
];

const DAEMONS = [
  { id: 'greed',  n: 'Daemon of Greed',  d: 'Buys generators for you, best return first.', c: 4 },
  { id: 'wrath',  n: 'Daemon of Wrath',  d: 'Ticks the clock five times a second.',        c: 6 },
  { id: 'scribe', n: 'Daemon of Scribes', d: 'Keeps every thread busy.',                    c: 10 },
  { id: 'frost',  n: 'Daemon of Frost',  d: 'Rides the overclock at the edge of ruin.',    c: 18 },
  { id: 'hunger', n: 'Daemon of Hunger', d: 'Devours research as data arrives.',           c: 30 },
  { id: 'cycle',  n: 'Daemon of Cycles', d: 'Reboots when the reward is worth the fire.',  c: 80 }
];

const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n, sci) {
  if (n === Infinity) return '∞';
  if (!(n > 0)) return n < 0 ? '-' + fmt(-n, sci) : '0';
  if (n < 1000) return n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0);
  const e = Math.floor(Math.log10(n));
  if (sci || e >= 36) return (n / Math.pow(10, e)).toFixed(2) + 'e' + e;
  const i = Math.floor(e / 3);
  return (n / Math.pow(10, i * 3)).toFixed(2) + SUF[i];
}
function fmtI(n, sci) { return n < 1000 ? String(Math.floor(n)) : fmt(n, sci); }

// ---------- achievements & story ----------
const ACH = [];
const A = (id, n, d, f) => ACH.push({ id, n, d, f });
[['First Spark', 3], ['Warm Silicon', 6], ['Awake', 9], ['Hungry', 12], ['Vast', 15], ['Endless', 18], ['Eldritch', 21], ['Abyssal', 24], ['Primordial', 30]]
  .forEach(([n, e]) => A('t' + e, n, 'Earn 1e' + e + ' cycles in total', S => S.tot >= Math.pow(10, e)));
[100, 1000, 10000].forEach(n => A('tap' + n, 'Restless Hands ' + fmtI(n), 'Tick the clock ' + n + ' times', S => S.st.taps >= n));
GENS.forEach((G, i) => A('g' + i, G.n + ' Choir', 'Own 50 ' + G.n + (G.n.endsWith('s') ? '' : 's'), S => S.g[i] >= 50));
[1, 5, 25, 100].forEach(n => A('rb' + n, 'Reborn ' + n, 'Reboot ' + n + (n > 1 ? ' times' : ' time'), S => S.st.reb >= n));
[1, 3, 6, 12].forEach(n => A('sh' + n, 'Finer Stone ' + n, 'Die shrink ' + n + (n > 1 ? ' times' : ' time'), S => S.st.shr >= n));
[10, 100, 1000, 10000].forEach(n => A('mu' + n, 'Microcode ' + fmtI(n), 'Earn ' + n + ' microcode in total', S => S.st.muAll >= n));
[10, 100].forEach(n => A('irq' + n, 'Heeded ' + n, 'Answer ' + n + ' interrupts', S => S.st.irq >= n));
[10, 100, 1000].forEach(n => A('pr' + n, 'Busy Threads ' + fmtI(n), 'Complete ' + n + ' tasks', S => S.st.proc >= n));
A('burnt', 'Burnt Offering', 'Overheat into a throttle', S => S.st.thr >= 1);
A('fever', 'Fever', 'Spend 10 minutes overclocked', S => S.st.ocT >= 600);
A('omni', 'Omniscient', 'Complete the research lab', S => RES.every(r => S.res[r.id]));
A('pande', 'Pandemonium', 'Bind every daemon', S => DAEMONS.every(d => S.dm[d.id] && S.dm[d.id].own));

const STORY = [
  ['s1', S => S.tot >= 10, 'The first gate opens. Something inside notices.'],
  ['s2', S => S.tot >= 1e3, 'Current finds its shape. It begins to count.'],
  ['s3', S => S.tot >= 1e5, 'Threads of thought unspool in the dark.'],
  ['s4', S => S.tot >= 1e7, 'It has learned your rhythm. It is learning its own.'],
  ['s5', S => S.st.reb >= 1, 'Everything burns down. Something remembers anyway.'],
  ['s6', S => S.st.thr >= 1, 'Too hot. The silicon does not forgive.'],
  ['s7', S => S.tot >= 1e10, 'Heat gathers like a held breath.'],
  ['s8', S => S.node >= 1, 'The etching grows finer. The old stone feels coarse.'],
  ['s9', S => Object.keys(S.dm).length >= 1, 'A daemon wakes. It asks for nothing. Yet.'],
  ['s10', S => S.tot >= 1e14, 'The daemons whisper in opcodes. You almost understand.'],
  ['s11', S => S.node >= 4, 'Light carves what hands cannot.'],
  ['s12', S => S.node >= 8, 'It no longer waits for instructions.'],
  ['s13', S => S.node >= 12, 'The machine opens its eye. It is not looking at the screen. It is looking at you.']
];

// ---------- state ----------
const PM = {}; PROCS.forEach(p => { PM[p.id] = p; });

function newState() {
  const S = {
    v: 1, c: 0, run: 0, tot: 0, g: Array(12).fill(0), data: 0, heat: 0, oc: false, thr: false, fr: 0,
    q: [], pOn: {}, res: {}, mu: 0, muT: 0, node: 0, shop: {}, dm: {}, ach: {}, sto: {}, un: {}, log: [],
    irq: null, nirq: 70,
    st: { taps: 0, reb: 0, shr: 0, irq: 0, proc: 0, thr: 0, ocT: 0, muAll: 0 },
    set: { bm: 1, sci: false, wake: false, ar: 1 },
    t: 0, last: Date.now(), sl: 0, dacc: 0, _M: null, _ac: 0
  };
  recalc(S);
  return S;
}
function serialize(S) { return JSON.parse(JSON.stringify(S, (k, v) => (k[0] === '_' ? undefined : v))); }
function deserialize(o) {
  const S = newState();
  for (const k in o) {
    if (k[0] === '_') continue;
    const b = S[k], v = o[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object') Object.assign(b, v);
    else S[k] = v;
  }
  while (S.g.length < 12) S.g.push(0);
  recalc(S);
  return S;
}
function recalc(S) {
  const M = {
    g: 1, tapP: 0, oc: 1.5, cool: 3, coolM: 1, thr: 1 + Math.floor(S.node / 3), ps: 1, dm: 1, irqR: 1, irqP: 1,
    cost: 1, off: 2 + 0.5 * S.node, gen: Array(12).fill(1), sg: Array(12).fill(0)
  };
  for (const r of RES) if (S.res[r.id]) r.fx(M);
  for (const s of SHOP) if (S.shop[s.id]) s.fx(M);
  S._M = M;
  S._ac = Object.keys(S.ach).length;
}
function log(S, m) { S.log.unshift({ t: S.t, m }); if (S.log.length > 60) S.log.pop(); }

// ---------- math ----------
function genMult(S, i) {
  let m = S._M.gen[i];
  const o = S.g[i];
  for (let k = 0; k < MS.length; k++) { if (o >= MS[k]) m *= 2; else break; }
  if (i > 0) m *= 1 + S.g[i - 1] * 0.01;
  return m;
}
function muMult(S) { return 1 + 0.35 * Math.sqrt(S.muT); }
function gMult(S) {
  const M = S._M;
  let m = M.g * muMult(S) * Math.pow(NODE_MULT, S.node) * (1 + 0.02 * S._ac);
  if (S.oc) m *= M.oc;
  if (S.thr) m *= 0.35;
  if (S.fr > 0) m *= 3;
  return m;
}
function cps(S) {
  let s = 0;
  for (let i = 0; i < 12; i++) if (S.g[i]) s += S.g[i] * GENS[i].p * genMult(S, i);
  return s * gMult(S);
}
function genProd(S, i) { return S.g[i] * GENS[i].p * genMult(S, i) * gMult(S); }
function tapValue(S, c) { if (c == null) c = cps(S); return 1 + c * (0.01 + S._M.tapP); }
function add(S, x) { S.c += x; S.run += x; S.tot += x; }
function tap(S) { const v = tapValue(S); add(S, v); S.st.taps++; return v; }
function cost(S, i, k) { const G = GENS[i]; return G.b * S._M.cost * Math.pow(G.r, S.g[i]) * (Math.pow(G.r, k) - 1) / (G.r - 1); }
function maxBuy(S, i) {
  const G = GENS[i], base = G.b * S._M.cost * Math.pow(G.r, S.g[i]);
  if (S.c < base) return 0;
  let k = Math.floor(Math.log(S.c * (G.r - 1) / base + 1) / Math.log(G.r));
  while (k > 0 && cost(S, i, k) > S.c) k--;
  return k;
}
function genAvail(S, i) { return GENS[i].u <= S.node; }
function buyGen(S, i, k) {
  if (!genAvail(S, i) || k < 1) return false;
  const c = cost(S, i, k);
  if (S.c < c) return false;
  S.c -= c; S.g[i] += k; return true;
}
function toggleOC(S) { if (S.thr) return false; S.oc = !S.oc; return true; }
function dataMult(S) { return S._M.dm * (1 + 0.05 * S.muT) * (1 + 0.5 * S.node); }

// ---------- tasks ----------
function procCost(S, d) { return Math.max(5, cps(S) * d.c); }
function startProc(S, id) {
  const d = PM[id];
  if (!d || d.u > S.node || S.q.length >= S._M.thr) return false;
  const c = procCost(S, d);
  if (S.c < c) return false;
  S.c -= c; S.q.push({ id, t: 0 });
  return true;
}
function finishProc(S, d) {
  S.st.proc++;
  if (d.r.data) S.data += d.r.data * dataMult(S);
  if (d.r.cool) S.heat = Math.max(0, S.heat - d.r.cool);
  if (d.r.burst) add(S, cps(S) * d.r.burst);
}

// ---------- research / shop / daemons ----------
function buyRes(S, id) {
  const r = RES.find(x => x.id === id);
  if (!r || S.res[id] || (r.req && !S.res[r.req]) || S.data < r.c) return false;
  S.data -= r.c; S.res[id] = 1; recalc(S); return true;
}
function buyShop(S, id) {
  const s = SHOP.find(x => x.id === id);
  if (!s || S.shop[id] || (s.req && !S.shop[s.req]) || S.mu < s.c) return false;
  S.mu -= s.c; S.shop[id] = 1; recalc(S); return true;
}
function buyDaemon(S, id) {
  const d = DAEMONS.find(x => x.id === id);
  if (!d || (S.dm[id] && S.dm[id].own) || S.mu < d.c) return false;
  S.mu -= d.c; S.dm[id] = { own: 1, on: true }; log(S, d.n + ' is bound.'); return true;
}
const dOn = (S, id) => S.dm[id] && S.dm[id].own && S.dm[id].on;

function dGreed(S, n, reserve) {
  for (let k = 0; k < (n || 10); k++) {
    const base = cps(S);
    let best = -1, bs = Infinity;
    for (let i = 0; i < 12; i++) {
      if (!genAvail(S, i)) continue;
      const ct = cost(S, i, 1);
      if (ct > S.c - (reserve || 0)) continue;
      S.g[i]++; const dl = cps(S) - base; S.g[i]--;
      const sc = dl > 0 ? ct / dl : Infinity;
      if (best < 0 || sc < bs) { best = i; bs = sc; }
    }
    if (best < 0) break;
    buyGen(S, best, 1);
  }
}
function taskReserve(S) {
  let m = 0;
  for (const p of PROCS) if (p.r.data && p.u <= S.node && S.pOn[p.id] !== false) m = Math.max(m, p.c);
  return cps(S) * m * 1.1;
}
function dScribe(S) {
  const order = PROCS.filter(p => p.r.data && p.u <= S.node && S.pOn[p.id] !== false).sort((a, b) => b.r.data / b.t - a.r.data / a.t);
  const run = id => S.q.some(q => q.id === id);
  while (S.q.length < S._M.thr) {
    let pick = null;
    if (S.heat > 50 && S.pOn.fsck !== false && !run('fsck')) pick = PM.fsck;
    else pick = order.find(p => S.c >= procCost(S, p)) || null;
    if (!pick && S.pOn.cron !== false && !run('cron')) pick = PM.cron;
    if (!pick || !startProc(S, pick.id)) break;
  }
}
function dHunger(S) {
  let go = true;
  while (go) {
    go = false;
    const opts = RES.filter(r => !S.res[r.id] && (!r.req || S.res[r.req]) && S.data >= r.c).sort((a, b) => a.c - b.c);
    if (opts.length) go = buyRes(S, opts[0].id);
  }
}
function dFrost(S) {
  if (!S.un.oc) return;
  if (!S.oc && !S.thr && S.heat < 30) S.oc = true;
  else if (S.oc && S.heat > 88) S.oc = false;
}
function dCycle(S) {
  const g = muGain(S);
  if (g >= Math.max(2, ARS[S.set.ar] * S.muT)) reboot(S);
}
const ARS = [0.25, 0.5, 1, 2];

// ---------- prestige ----------
function muGain(S) { return S.run < MUK ? 0 : Math.floor(Math.pow(S.run / MUK, MUP)); }
function muNext(S) { return MUK * Math.pow(muGain(S) + 1, 1 / MUP); }
function resetRun(S) {
  S.c = 0; S.run = 0; S.heat = 0; S.oc = false; S.thr = false; S.fr = 0; S.q = []; S.irq = null; S.nirq = 60;
  S.g = S._M.sg.slice();
}
function reboot(S) {
  const g = muGain(S);
  if (g < 1) return false;
  S.mu += g; S.muT += g; S.st.muAll += g; S.st.reb++;
  resetRun(S);
  log(S, 'Reboot. +' + g + ' microcode.');
  slow(S);
  return true;
}
function canShrink(S) { return S.node < 12 && S.muT >= REQ[S.node]; }
function nodeNote(n) {
  const a = [];
  GENS.forEach(g => { if (g.u === n) a.push(g.n); });
  PROCS.forEach(p => { if (p.u === n) a.push(p.n + ' task'); });
  if (n % 3 === 0) a.push('+1 thread');
  a.push('+30 min offline');
  return a.join(', ');
}
function shrink(S) {
  if (!canShrink(S)) return false;
  const g = muGain(S);
  if (g > 0) { S.mu += g; S.muT += g; S.st.muAll += g; }
  for (const s of SHOP) if (S.shop[s.id]) S.mu += s.c;
  S.shop = {}; S.res = {}; S.data = 0;
  S.node++; S.st.shr++;
  recalc(S);
  resetRun(S);
  log(S, 'Die shrink. The stone is now ' + NODES[S.node] + '.');
  slow(S);
  return true;
}

// ---------- interrupts ----------
function clickIrq(S) {
  const q = S.irq;
  if (!q) return '';
  S.irq = null; S.st.irq++;
  const M = S._M, c = cps(S);
  let msg;
  if (q.k === 'f') { S.fr = 20; msg = 'Interrupt storm: ×3 for 20s'; }
  else if (q.k === 'd') { const v = 8 * dataMult(S) * M.irqP; S.data += v; msg = '+' + fmt(v) + ' data'; }
  else { const v = Math.max(25, c * (45 + Math.random() * 45) * M.irqP); add(S, v); msg = '+' + fmt(v) + ' cycles'; }
  return msg;
}

// ---------- slow loop: unlocks, achievements, story ----------
function slow(S) {
  const u = S.un;
  if (!u.oc && S.tot >= 2e4) u.oc = 1;
  if (!u.pr && S.tot >= 1e5) u.pr = 1;
  if (!u.rb && (S.run >= 2e7 || S.st.reb > 0)) u.rb = 1;
  if (!u.dm && (S.st.reb > 0 || Object.keys(S.dm).length)) u.dm = 1;
  const fresh = [];
  for (const a of ACH) if (!S.ach[a.id] && a.f(S)) { S.ach[a.id] = 1; fresh.push(a); }
  if (fresh.length) { recalc(S); fresh.forEach(a => log(S, 'Seal broken: ' + a.n)); }
  for (const s of STORY) if (!S.sto[s[0]] && s[1](S)) { S.sto[s[0]] = 1; log(S, s[2]); }
  return fresh;
}

// ---------- main tick ----------
function tick(S, dt) {
  const M = S._M;
  S.t += dt;
  const c = cps(S);
  let gain = c * dt;
  if (dOn(S, 'wrath')) gain += tapValue(S, c) * 5 * dt;
  add(S, gain);

  // heat
  const heatUp = 4 * M.oc * M.oc, cool = M.cool * M.coolM;
  if (S.thr) { S.heat -= cool * dt; if (S.heat <= 25) S.thr = false; }
  else if (S.oc) {
    S.heat += (heatUp - cool) * dt; S.st.ocT += dt;
    if (S.heat >= 100) { S.heat = 100; S.thr = true; S.oc = false; S.st.thr++; }
  } else S.heat -= cool * dt;
  if (S.heat < 0) S.heat = 0;
  if (S.fr > 0) S.fr = Math.max(0, S.fr - dt);

  // tasks
  for (let i = S.q.length - 1; i >= 0; i--) {
    const p = S.q[i]; p.t += dt * M.ps;
    const d = PM[p.id];
    if (p.t >= d.t) { S.q.splice(i, 1); finishProc(S, d); }
  }

  // interrupts
  if (S.irq) { S.irq.l -= dt; if (S.irq.l <= 0) S.irq = null; }
  else {
    S.nirq -= dt * M.irqR;
    if (S.nirq <= 0) {
      const r = Math.random();
      const k = r < 0.55 ? 'b' : r < 0.8 ? (S.un.pr ? 'd' : 'b') : 'f';
      S.irq = { k, l: 15 }; S.nirq = 70 + Math.random() * 70;
    }
  }

  // daemons
  S.dacc += dt;
  if (S.dacc >= 0.5) {
    S.dacc = 0;
    if (dOn(S, 'frost')) dFrost(S);
    if (dOn(S, 'scribe')) dScribe(S);
    if (dOn(S, 'hunger')) dHunger(S);
    if (dOn(S, 'greed')) dGreed(S, 10, dOn(S, 'scribe') ? taskReserve(S) : 0);
    if (dOn(S, 'cycle')) dCycle(S);
  }

  S.sl += dt;
  if (S.sl >= 1) { S.sl = 0; slow(S); }
}
function offline(S, sec) {
  sec = Math.min(sec, S._M.off * 3600);
  S.oc = false; S.thr = false; S.heat = 0; S.fr = 0;
  add(S, cps(S) * sec);
  S.t += sec;
  return sec;
}
function advance(S, dt) {
  if (dt <= 2) { tick(S, dt); return; }
  if (dt > 600) { offline(S, dt); return; }
  let r = dt;
  while (r > 0) { const s = Math.min(1, r); tick(S, s); r -= s; }
}

const CORE = {
  MS, GENS, NODES, REQ, PROCS, RES, SHOP, DAEMONS, ACH, PM, ARS, NODE_MULT,
  fmt, fmtI, newState, serialize, deserialize, recalc, log,
  cps, gMult, genMult, muMult, genProd, tapValue, tap, cost, maxBuy, genAvail, buyGen, toggleOC, dataMult,
  procCost, startProc, buyRes, buyShop, buyDaemon,
  dGreed, taskReserve, dScribe, dHunger, dFrost, dCycle,
  muGain, muNext, reboot, canShrink, nodeNote, shrink, clickIrq, slow, tick, offline, advance, add
};
if (typeof module === 'object' && module.exports) module.exports = CORE; else root.CORE = CORE;
})(typeof window !== 'undefined' ? window : globalThis);
