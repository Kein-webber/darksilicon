(function (root) {
'use strict';

// =====================================================================
//  DARK SILICON — core logic (no DOM). Used by ui.js, scene.js and the balance sim.
// =====================================================================

// ---------- static data ----------
const MS = [25, 50, 100, 200, 300, 400, 500, 600, 800, 1000]; // each milestone: x2 to that tier
const GENS = [
  { id: 'tr',   n: 'Transistor',    b: 12,     r: 1.13, p: 0.25,     u: 0, d: 'Sand that learned to say yes or no.' },
  { id: 'lg',   n: 'Logic Gate',    b: 160,    r: 1.14, p: 2.5,      u: 0, d: 'Three can argue. Two can agree.' },
  { id: 'alu',  n: 'ALU',           b: 1.5e3,  r: 1.14, p: 27,       u: 0, d: 'It counts, and does not tire.' },
  { id: 'reg',  n: 'Register',      b: 2e4,    r: 1.14, p: 308,      u: 0, d: 'A pocket for the thing being thought.' },
  { id: 'l1',   n: 'L1 Cache',      b: 3e5,    r: 1.15, p: 3750,     u: 0, d: 'Memory kept close to the heart.' },
  { id: 'l2',   n: 'L2 Cache',      b: 5e6,    r: 1.15, p: 52600,    u: 0, d: 'Larger. Slower. Still faithful.' },
  { id: 'core', n: 'Core',          b: 9e7,    r: 1.16, p: 780000,   u: 0, d: 'A second mind behind the same eyes.' },
  { id: 'pipe', n: 'Pipeline',      b: 2e9,    r: 1.16, p: 1.43e7,   u: 0, d: 'Fourteen stages, one long breath.' },
  { id: 'chip', n: 'Chiplet',       b: 5e10,   r: 1.17, p: 2.94e8,   u: 1, d: 'Cut apart to be made stronger.' },
  { id: 'die',  n: 'Die',           b: 1.5e12, r: 1.17, p: 7.5e9,    u: 2, d: 'A city etched on a fingernail.' },
  { id: 'waf',  n: 'Wafer',         b: 6e13,   r: 1.18, p: 2.5e11,   u: 4, d: 'A dark disc. Hundreds of cities.' },
  { id: 'fab',  n: 'Cathedral Fab', b: 3e15,   r: 1.18, p: 1.03e13,  u: 6, d: 'Light is the only chisel here.' }
];
const NODES = ['180nm', '130nm', '90nm', '65nm', '45nm', '32nm', '22nm', '14nm', '10nm', '7nm', '5nm', '3nm', '2nm'];
const REQ = Array.from({ length: 12 }, (_, i) => Math.round(130 * Math.pow(17.5, i))); // lifetime µ to shrink from node i
const NODE_MULT = 2.5;
const MUK = 2e8, MUP = 0.33;
const ASC_MU = 3e7, ASC_DIV = 1e7; // ascension threshold / divisor

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

// repeatable research (data sink, resets on die shrink with the rest of the lab)
const RR = [
  { id: 'bp', n: 'Branch predictor', d: '+1.5% cycles per level',                 b: 40, r: 1.45, fx: (M, L) => { M.gA += 0.015 * L; } },
  { id: 'pf', n: 'Prefetch depth',   d: '+4% data per level',                   b: 30, r: 1.40, fx: (M, L) => { M.dm *= 1 + 0.04 * L; } },
  { id: 'tl', n: 'Telemetry',        d: '+5% interrupt pay, +1% contract pay',  b: 30, r: 1.40, fx: (M, L) => { M.irqP *= 1 + 0.05 * L; M.ctRew *= 1 + 0.01 * L; } }
];

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
  { id: 's14', n: 'Firmware IV',      d: '×4 cycles',                            c: 400, req: 's12', fx: M => { M.g *= 4; } },
  { id: 's15', n: 'Rack Rails',       d: 'Client contracts pay ×1.25',           c: 25,  fx: M => { M.ctRew *= 1.25; } },
  { id: 's16', n: 'Wide Bus',         d: 'Requests arrive ×1.5 faster',          c: 35,  fx: M => { M.reqX *= 1.5; } },
  { id: 's17', n: 'Heat Fuses',       d: 'Heat ceiling +25',                     c: 45,  fx: M => { M.hcap += 25; } },
  { id: 's18', n: 'Data Compression', d: 'Tasks yield ×2 data',                  c: 55,  fx: M => { M.dm *= 2; } },
  { id: 's19', n: 'Interrupt Oracle', d: 'Interrupts pay ×2',                    c: 90,  fx: M => { M.irqP *= 2; } },
  { id: 's20', n: 'Microcode Cache II', d: 'Offline limit +12 hours',            c: 120, req: 's10', fx: M => { M.off += 12; } },
  { id: 's21', n: 'Warm Cache',       d: 'Ticks add +5% of cycles/s',            c: 150, req: 's13', fx: M => { M.tapP += 0.05; } },
  { id: 's22', n: 'Thermal Interface', d: 'Cooling ×2',                          c: 200, req: 's6', fx: M => { M.coolM *= 2; } },
  { id: 's23', n: 'Prefetch Mask II', d: 'Generators cost −15%',                 c: 300, req: 's3', fx: M => { M.cost *= 0.85; } },
  { id: 's24', n: 'Firmware V',       d: '×1.5 cycles',                          c: 4000, req: 's14', fx: M => { M.g *= 1.5; } },
  { id: 's25', n: 'Firmware VI',      d: '×2 cycles',                            c: 40000, req: 's24', fx: M => { M.g *= 2; } },
  { id: 's26', n: 'Singular Cache',   d: 'Generators cost −20%',                 c: 12000, req: 's23', fx: M => { M.cost *= 0.8; } },
  { id: 's27', n: 'Firmware VII',     d: '×2.5 cycles',                          c: 400000, req: 's25', fx: M => { M.g *= 2.5; } }
];

const DAEMONS = [
  { id: 'greed',  n: 'Daemon of Greed',   d: 'Buys generators and rig upgrades, best return first.', c: 4 },
  { id: 'wrath',  n: 'Daemon of Wrath',   d: 'Ticks the clock five times a second.',                 c: 6 },
  { id: 'mirror', n: 'Daemon of Mirrors', d: 'Answers every interrupt the moment it appears.',       c: 9 },
  { id: 'scribe', n: 'Daemon of Scribes', d: 'Keeps every thread busy.',                             c: 12 },
  { id: 'frost',  n: 'Daemon of Frost',   d: 'Rides the overclock at the edge of ruin.',             c: 20 },
  { id: 'hunger', n: 'Daemon of Hunger',  d: 'Devours research as data arrives.',                    c: 32 },
  { id: 'cycle',  n: 'Daemon of Cycles',  d: 'Reboots when the reward is worth the fire.',           c: 80 }
];

// ---------- rig upgrades (levels persist through reboot and shrink, reset on ascension) ----------
const RIG = [
  { id: 'clk', cat: 'cmp', n: 'Clock',        tag: 'CLK', b: 60,  r: 1.55, unl: S => S.un.cmp,
    val: L => 1 + 0.15 * L, f: v => v.toFixed(2) + ' GHz', note: '+3% cycles, runs hotter' },
  { id: 'cor', cat: 'cmp', n: 'Cores',        tag: 'COR', b: 140, r: 1.6,  unl: S => S.un.cmp && S.tot >= 2000,
    val: L => 2 + L, f: v => v + ' cores', note: '+2.5% cycles per core' },
  { id: 'clu', cat: 'cmp', n: 'Clusters',     tag: 'CLU', costs: [4e5, 6e7, 8e9], unl: S => S.tot >= 2e5,
    val: L => 1 + L, f: v => v + (v === 1 ? ' cluster' : ' clusters'), note: '×1.2 cycles each' },
  { id: 'fin', cat: 'th',  n: 'Heatsink',     tag: 'FIN', b: 80,  r: 1.5,  unl: S => S.un.oc,
    val: L => 0.7 * L, f: v => '+' + v.toFixed(1) + '/s', note: 'Extra cooling per second' },
  { id: 'fan', cat: 'th',  n: 'Case fans',    tag: 'FAN', costs: [800, 8e3, 8e4, 8e5, 8e6, 8e7], unl: S => S.un.oc,
    val: L => L, f: v => v + (v === 1 ? ' fan' : ' fans'), note: '+1.1 cooling each' },
  { id: 'ceil', cat: 'th', n: 'Heat ceiling', tag: 'CAP', b: 400, r: 1.7,  unl: S => S.un.oc && S.tot >= 2e5,
    val: L => 83 + 2 * L, f: v => v + '°', note: 'Throttle later' },
  { id: 'nic', cat: 'ing', n: 'NIC',          tag: 'NIC', b: 200, r: 1.5,  unl: S => S.un.ct,
    val: (L, S) => refRate(S) * (1 + 0.04 * L), f: v => fmt(v) + ' req/s', note: 'Patrons send work faster' },
  { id: 'bal', cat: 'ing', n: 'Load balancer', tag: 'BAL', b: 500, r: 1.6, unl: S => S.un.ct,
    val: L => 4 * L, f: v => '+' + v + '%', note: 'Contracts pay +4% each' },
  { id: 'edg', cat: 'ing', n: 'Edge cache',   tag: 'EDG', b: 300, r: 1.55, unl: S => S.un.ct,
    val: L => 8 * L, f: v => '+' + v + '%', note: 'Interrupts pay more, come sooner' },
  { id: 'psu', cat: 'pw',  n: 'PSU',          tag: 'PSU', b: 150, r: 1.55, unl: S => S.un.pw,
    val: L => 1.5 * L, f: v => '+' + v + '%', note: '+1.5% cycles per level' },
  { id: 'vrm', cat: 'pw',  n: 'VRM phases',   tag: 'VRM', b: 600, r: 1.6,  unl: S => S.un.pw && S.un.oc,
    val: L => 1.5 + 0.03 * L, f: v => '×' + v.toFixed(2), note: 'Overclock multiplier +0.03' }
];
const rackOk = S => S.sled > 0 || S.st.boards > 0;
RIG.push(
  { id: 'sld', cat: 'rk', n: 'Sled lacquer', tag: 'LAQ', b: 300, r: 1.6, unl: rackOk,
    val: L => 3 + 0.15 * L, f: v => '+' + v.toFixed(2) + '% per sled', note: 'Each sled feeds the chip more' },
  { id: 'slt', cat: 'rk', n: 'Rack bays', tag: 'BAY', costs: [5e5, 5e7, 5e9, 5e11], unl: rackOk,
    val: L => 12 + 2 * L, f: v => v + ' bays', note: 'Room for more sleds' },
  { id: 'rcl', cat: 'rk', n: 'Cold aisle', tag: 'AIS', b: 400, r: 1.6, unl: rackOk,
    val: L => 0.12 * L, f: v => '+' + v.toFixed(2) + '/s per sled', note: 'Every sled helps cool the chip' },
  { id: 'rcb', cat: 'rk', n: 'Cabling', tag: 'CAB', b: 350, r: 1.55, unl: rackOk,
    val: L => 3 * L, f: v => '+' + v + '% pact speed', note: 'Pacts fill faster' },
  // the occult: forbidden parts, one small bargain each
  { id: 'run', cat: 'occ', n: 'Runic etching', tag: 'RUN', b: 500, r: 1.55, unl: S => S.node >= 1 || S.st.reb >= 2,
    val: L => 1.5 * L, f: v => '+' + v.toFixed(1) + '% cycles', note: 'Sigils cut into the die' },
  { id: 'eye', cat: 'occ', n: 'Watching Eye', tag: 'EYE', b: 450, r: 1.55, unl: S => S.node >= 1 || S.st.reb >= 2,
    val: L => 1.5 * L, f: v => '+' + v.toFixed(1) + '% tick', note: 'It watches your hand and learns' },
  { id: 'gar', cat: 'occ', n: 'Gargoyle sink', tag: 'GAR', b: 600, r: 1.6, unl: S => S.node >= 1,
    val: L => 1.4 * L, f: v => '+' + v.toFixed(1) + '/s', note: 'Stone wings drink the heat' },
  { id: 'bld', cat: 'occ', n: 'Blood conduit', tag: 'BLD', b: 700, r: 1.6, unl: S => S.st.reb >= 3,
    val: L => 6 * L, f: v => '+' + v + '% omens', note: 'Omens come sooner and pay more' },
  { id: 'sol', cat: 'occ', n: 'Soul jar', tag: 'SOL', b: 800, r: 1.65, unl: S => S.st.reb >= 3,
    val: L => 6 * L, f: v => '+' + v + '% data', note: 'Incantations yield more data' },
  { id: 'cry', cat: 'occ', n: 'Crypt cache', tag: 'CRY', b: 900, r: 1.7, unl: S => S.st.reb >= 5,
    val: L => 0.5 * L, f: v => '+' + v.toFixed(1) + ' h', note: 'The chip dreams longer while you are away' },
  { id: 'hrn', cat: 'occ', n: 'Summoning circle', tag: 'SUM', costs: [2e7, 4e9, 8e11], unl: S => S.node >= 2,
    val: L => L, f: v => '+' + v + (v === 1 ? ' thread' : ' threads'), note: 'Another mind answers the call' }
);
// ---- the Domain: three dark sites that grow visible attachments as you upgrade them ----
const siteCrypt = S => S.node >= 2, siteAltar = S => S.node >= 4, siteAbyss = S => S.node >= 6;
RIG.push(
  // The Crypt: coffins of data, bone, ravens and ghoul archivists
  { id: 'cof', cat: 'crp', n: 'Sarcophagi', tag: 'COF', b: 1200, r: 1.6, cap: 8, unl: siteCrypt,
    val: L => 7 * L, f: v => '+' + v + '% data', note: 'Each coffin hoards more data' },
  { id: 'bon', cat: 'crp', n: 'Bone lattice', tag: 'BON', b: 1500, r: 1.6, cap: 6, unl: siteCrypt,
    val: L => 0.9 * L, f: v => '+' + v.toFixed(1) + '/s cooling', note: 'Ribs carry the heat away' },
  { id: 'rat', cat: 'crp', n: 'Ravens', tag: 'RAV', b: 1400, r: 1.6, cap: 8, unl: siteCrypt,
    val: L => 4 * L, f: v => '+' + v + '% omen rate', note: 'They fetch interrupts and omens' },
  { id: 'ghl', cat: 'crp', n: 'Ghoul archivists', tag: 'GHL', b: 1800, r: 1.65, cap: 6, unl: siteCrypt,
    val: L => 3 * L, f: v => '+' + v + '% rite speed', note: 'Incantations finish faster' },
  // The Altar: candles, a chalice of blood, standing stones and a scrying orb
  { id: 'can', cat: 'alt', n: 'Black candles', tag: 'CAN', b: 6000, r: 1.6, cap: 12, unl: siteAltar,
    val: L => 1.5 * L, f: v => '+' + v.toFixed(1) + '% cycles', note: 'Each flame feeds the chip' },
  { id: 'bsn', cat: 'alt', n: 'Blood chalice', tag: 'BLO', b: 7000, r: 1.65, cap: 8, unl: siteAltar,
    val: L => 1.5 * L, f: v => '+' + v.toFixed(1) + '% microcode', note: 'Reboots pay more microcode' },
  { id: 'sig', cat: 'alt', n: 'Standing stones', tag: 'STN', b: 6500, r: 1.7, cap: 6, unl: siteAltar,
    val: L => 3 * L, f: v => '+' + v + '° ceiling', note: 'Overclock hotter, longer' },
  { id: 'orb', cat: 'alt', n: 'Scrying orb', tag: 'ORB', costs: [8e4, 8e6, 8e8], unl: siteAltar,
    val: L => 10 * L, f: v => '+' + v + '% pacts', note: 'Patrons pay more for foresight' },
  // The Abyss: tentacles, eyes, a portal and the tide
  { id: 'tnt', cat: 'aby', n: 'Tentacles', tag: 'TNT', b: 30000, r: 1.6, cap: 12, unl: siteAbyss,
    val: L => 2 * L, f: v => '+' + v + '% cycles', note: 'Something reaches up from below' },
  { id: 'eyr', cat: 'aby', n: 'Floating eyes', tag: 'EYE', b: 32000, r: 1.65, cap: 8, unl: siteAbyss,
    val: L => 8 * L, f: v => '+' + v + '% interrupt pay', note: 'They see every opening' },
  { id: 'prt', cat: 'aby', n: 'Void portal', tag: 'VOI', costs: [3e5, 3e7, 3e9], unl: siteAbyss,
    val: L => Math.pow(1.12, L), f: v => '×' + v.toFixed(2), note: 'Each ring opens a wider door' },
  { id: 'tid', cat: 'aby', n: 'Tide of whispers', tag: 'TID', b: 36000, r: 1.7, cap: 10, unl: siteAbyss,
    val: L => L, f: v => '−' + v + '% unit cost', note: 'The voices haggle on your behalf' }
);
// ---- the Memory bus (opens after the first reboot) and the Foundry (opens after the first die shrink) ----
const siteMem = S => S.st.reb >= 1, siteFab = S => S.node >= 1;
RIG.push(
  { id: 'ram', cat: 'mem', n: 'Memory sticks', tag: 'RAM', b: 700, r: 1.6, unl: siteMem,
    val: L => 2 * L, f: v => '+' + v.toFixed(1) + '% cycles', note: 'Sticks slot into the board' },
  { id: 'lan', cat: 'mem', n: 'Bus lanes', tag: 'LAN', b: 800, r: 1.6, cap: 8, unl: siteMem,
    val: L => 2 * L, f: v => '+' + v.toFixed(1) + '% tick power', note: 'More lanes, more traffic' },
  { id: 'pre', cat: 'mem', n: 'Prefetcher', tag: 'PRE', b: 900, r: 1.6, cap: 8, unl: siteMem,
    val: L => 3 * L, f: v => '+' + v.toFixed(1) + '% pact pay', note: 'It reaches for work before it is asked' },
  { id: 'brp', cat: 'mem', n: 'Branch oracle', tag: 'ORC', b: 1000, r: 1.65, cap: 6, unl: siteMem,
    val: L => 2.5 * L, f: v => '−' + v.toFixed(1) + '% heat', note: 'It foretells the path and wastes less' },
  { id: 'ecc', cat: 'mem', n: 'Warding', tag: 'WRD', costs: [4e4, 4e6, 4e8], unl: siteMem,
    val: L => 8 * L, f: v => '+' + v + '% data', note: 'Wards keep every bit true' },
  { id: 'wfr', cat: 'fab', n: 'Wafer line', tag: 'WFR', b: 2500, r: 1.6, unl: siteFab,
    val: L => 2 * L, f: v => '+' + v.toFixed(1) + '% cycles', note: 'Blank wafers ride the belt' },
  { id: 'lsr', cat: 'fab', n: 'Lithography beam', tag: 'LSR', b: 3000, r: 1.65, cap: 6, unl: siteFab,
    val: L => 2 * L, f: v => '+' + v.toFixed(1) + '% microcode', note: 'A finer beam writes a finer stone' },
  { id: 'lns', cat: 'fab', n: 'Lens stack', tag: 'LNS', costs: [2e5, 2e7, 2e9, 2e11], unl: siteFab,
    val: L => 0.04 * L, f: v => '+' + v.toFixed(2) + ' overclock', note: 'Each glass focuses the fire' },
  { id: 'clr', cat: 'fab', n: 'Cleanroom wards', tag: 'CLR', b: 2800, r: 1.65, cap: 8, unl: siteFab,
    val: L => 3 * L, f: v => '+' + v + '° ceiling', note: 'Nothing unclean touches the stone' }
);
const RIG_PROD = { clk: 1, cor: 1, clu: 1, psu: 1, sld: 1, run: 1, can: 1, tnt: 1, prt: 1, ram: 1, wfr: 1 };
const RIGM = {}; RIG.forEach(u => { RIGM[u.id] = u; });

// ---------- clients / contracts ----------
const CLIENTS = [
  ['Nocturne',  'Short replies for a night-shift bot.',    'nic'],
  ['Gloomhost', 'Static pages, endless requests.',          'nic'],
  ['Ashbyte',   'Compress everything. Forget nothing.',     'clk'],
  ['Hexware',   'Hash the ledger, again and again.',        'clk'],
  ['Vesper',    'Thousands of tiny sessions at dusk.',      'cor'],
  ['Obsidyn',   'Big matrices, patient clients.',           'cor'],
  ['Crypta',    'Keys that must never overheat.',           'fin'],
  ['Tallow',    'Candlelit batch jobs.',                    'fin'],
  ['Umbrial',   'All the shadows at once.',                 'all'],
  ['Lumen-9',   'A lighthouse that runs on cycles.',        'all'],
  ['Dreadlog',  'Parse the logs. Do not read them.',        'nic'],
  ['Mourn',     'Render the long goodbye.',                 'clk'],
  ['Wraith',    'Many threads, no bodies.',                 'cor'],
  ['Kiln',      'Burn-in tests for brave silicon.',         'fin'],
  ['Eventide',  'Everything, at the end of the day.',       'all']
].map(a => ({ n: a[0], d: a[1], key: a[2] }));
const STRESS_NAME = { nic: 'NIC', clk: 'Clock', cor: 'Cores', fin: 'Cooling', all: 'Everything' };
const REWK = [1, 1.2, 1.5, 1.9, 3.5];

// ---------- boot modes, milestones ----------
const MODES = {
  std:   { id: 'std',   n: 'Standard',   d: 'Nothing changes.', need: 0, mx: 1, fx: M => {} },
  safe:  { id: 'safe',  n: 'Safe boot',  d: 'Overclock is locked. Processes run 2× faster.', need: 5, mx: 1.5,
           fx: M => { M.noOC = true; M.ps *= 2; } },
  hot:   { id: 'hot',   n: 'Hot boot',   d: 'Heat builds 2× faster, but overclock is 1.5× stronger.', need: 10, mx: 1.6,
           fx: M => { M.heatX *= 2; M.ocX *= 1.5; } },
  lean:  { id: 'lean',  n: 'Lean boot',  d: 'Generators cost 1.5× more.', need: 25, mx: 2,
           fx: M => { M.cost *= 1.5; } },
  blind: { id: 'blind', n: 'Blind boot', d: 'Daemons sleep. Interrupts pay 2×.', need: 50, mx: 2.5,
           fx: M => { M.noDm = true; M.irqP *= 2; } }
};
const MODE_IDS = ['std', 'safe', 'hot', 'lean', 'blind'];
const MIL = [
  { n: 2,   t: 'Warm cache',    d: '+1 thread',                        fx: M => { M.thr += 1; } },
  { n: 5,   t: 'Safe boot',     d: 'Unlocks Safe boot',                fx: M => {} },
  { n: 10,  t: 'Residue',       d: 'Interrupts arrive 25% sooner. Unlocks Hot boot', fx: M => { M.irqR *= 1.25; } },
  { n: 25,  t: 'Long memory',   d: 'Offline limit +2 hours. Unlocks Lean boot',      fx: M => { M.off += 2; } },
  { n: 50,  t: 'Seasoned',      d: 'µ gain ×1.5. Unlocks Blind boot',  fx: M => { M.muG *= 1.5; } },
  { n: 100, t: 'Phoenix',       d: '+1 thread and ×2 cycles',          fx: M => { M.thr += 1; M.g *= 2; } }
];

// ---------- ascension perks (spent with qubits) ----------
const QP = [
  { id: 'q1',  n: 'Superposition I',   d: '×2 cycles',                            c: 1,  fx: M => { M.g *= 2; } },
  { id: 'q2',  n: 'Tunneling I',       d: 'µ gain ×1.5',                          c: 2,  fx: M => { M.muG *= 1.5; } },
  { id: 'q3',  n: 'Pre-etched I',      d: 'Ascend into 90nm',                     c: 2,  fx: M => { M.startNode = Math.max(M.startNode, 2); } },
  { id: 'q4',  n: 'Immortal daemons',  d: 'Daemons survive ascension',            c: 3,  fx: M => { M.keepDm = true; } },
  { id: 'q5',  n: 'Superposition II',  d: '×3 cycles',                            c: 5,  req: 'q1', fx: M => { M.g *= 3; } },
  { id: 'q6',  n: 'Parallel worlds',   d: '+2 threads',                           c: 4,  fx: M => { M.thr += 2; } },
  { id: 'q7',  n: 'Forge memory',        d: 'Forge upgrades survive ascension',       c: 6,  fx: M => { M.keepRig = true; } },
  { id: 'q8',  n: 'Pre-etched II',     d: 'Ascend into 45nm',                     c: 8,  req: 'q3', fx: M => { M.startNode = Math.max(M.startNode, 4); } },
  { id: 'q9',  n: 'Tunneling II',      d: 'µ gain ×2',                            c: 10, req: 'q2', fx: M => { M.muG *= 2; } },
  { id: 'q10', n: 'Error correction',  d: 'Cooling ×2, heat ceiling +50',         c: 6,  fx: M => { M.coolM *= 2; M.hcap += 50; } },
  { id: 'q11', n: 'Rack memory',       d: 'Rack sleds and pact boards survive ascension', c: 7, fx: M => { M.keepRack = true; } },
  { id: 'q12', n: 'Cryo singularity',  d: 'Overclock +1×',                        c: 12, fx: M => { M.oc += 1; } },
  { id: 'q13', n: 'Time dilation',     d: 'Offline limit +24 hours',              c: 10, fx: M => { M.off += 24; } },
  { id: 'q14', n: 'Superposition III', d: '×5 cycles',                            c: 25, req: 'q5', fx: M => { M.g *= 5; } },
  { id: 'q15', n: 'Pre-etched III',    d: 'Ascend into 22nm',                     c: 30, req: 'q8', fx: M => { M.startNode = Math.max(M.startNode, 6); } },
  { id: 'q16', n: 'Superposition IV',  d: '×8 cycles',                            c: 60, req: 'q14', fx: M => { M.g *= 8; } }
];

// ---------- number formatting ----------
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
[10, 100, 1000].forEach(n => A('ct' + n, 'Good Standing ' + fmtI(n), 'Finish ' + n + ' client contracts', S => S.st.cont >= n));
[1, 5, 12].forEach(n => A('bd' + n, 'Full Rack ' + n, 'Clear ' + n + ' client boards', S => S.st.boards >= n));
[1, 3, 10].forEach(n => A('as' + n, 'Ascended ' + n, 'Ascend ' + n + (n > 1 ? ' times' : ' time'), S => S.st.asc >= n));
A('burnt', 'Burnt Offering', 'Overheat into a throttle', S => S.st.thr >= 1);
A('fever', 'Fever', 'Spend 10 minutes overclocked', S => S.st.ocT >= 600);
A('omni', 'Omniscient', 'Complete the research lab', S => RES.every(r => S.res[r.id]));
A('pande', 'Pandemonium', 'Bind every daemon', S => DAEMONS.every(d => S.dm[d.id] && S.dm[d.id].own));
A('rigfull', 'Overbuilt', 'Reach 100 total rig levels', S => rigTotal(S) >= 100);
A('fans', 'Wind Tunnel', 'Install all six case fans', S => (S.rig.fan || 0) >= 6);

const STORY = [
  ['s1', S => S.tot >= 10, 'The first gate opens. Something inside notices.'],
  ['s2', S => S.tot >= 1e3, 'Current finds its shape. It begins to count.'],
  ['s3', S => S.tot >= 1e5, 'Threads of thought unspool in the dark. Clients begin to knock.'],
  ['s4', S => S.tot >= 1e7, 'It has learned your rhythm. It is learning its own.'],
  ['s5', S => S.st.reb >= 1, 'Everything burns down. Something remembers anyway.'],
  ['s6', S => S.st.thr >= 1, 'Too hot. The silicon does not forgive.'],
  ['s7', S => S.tot >= 1e10, 'Heat gathers like a held breath.'],
  ['s8', S => S.node >= 1, 'The etching grows finer. The old stone feels coarse.'],
  ['s9', S => Object.keys(S.dm).length >= 1, 'A daemon wakes. It asks for nothing. Yet.'],
  ['s10', S => S.st.boards >= 1, 'The first rack hums. Someone, somewhere, is paying for this.'],
  ['s11', S => S.tot >= 1e14, 'The daemons whisper in opcodes. You almost understand.'],
  ['s12', S => S.node >= 4, 'Light carves what hands cannot.'],
  ['s13', S => S.st.asc >= 1, 'It was never silicon. It was only wearing it.'],
  ['s14', S => S.node >= 8, 'It no longer waits for instructions.'],
  ['s15', S => S.node >= 12, 'The machine opens its eye. It is not looking at the screen. It is looking at you.']
];

// ---------- state ----------
const PM = {}; PROCS.forEach(p => { PM[p.id] = p; });

function newState() {
  const S = {
    v: 2, c: 0, run: 0, tot: 0, g: Array(12).fill(0), data: 0, heat: 0, oc: false, thr: false, fr: 0,
    q: [], pOn: {}, res: {}, rr: {}, mu: 0, muT: 0, node: 0, shop: {}, dm: {}, ach: {}, sto: {}, un: {}, log: [],
    rig: {}, ct: { b: 0, k: 0, p: 0 }, sled: 0, mode: 'std', nmode: 'std',
    qb: 0, qbT: 0, qp: {}, goal: 0,
    tut: { intro: 0, seen: {} },
    irq: null, nirq: 70,
    st: { taps: 0, reb: 0, shr: 0, irq: 0, proc: 0, thr: 0, ocT: 0, muAll: 0, cont: 0, boards: 0, asc: 0 },
    set: { bm: 1, sci: false, wake: false, ar: 1 },
    t: 0, last: Date.now(), sl: 0, dacc: 0, bf: 0, _M: null, _ac: 0, _ev: [], _su: 0
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
  S.v = 2;
  // existing saves: skip onboarding and fast-forward guided goals silently
  if (!o.tut && (o.tot || 0) > 0) S.tut.intro = 1;
  recalc(S);
  checkGoals(S, true);
  return S;
}
function dmBase(S) { return (1 + 0.05 * S.muT) * (1 + 0.5 * S.node); }
function recalc(S) {
  const M = {
    g: 1, gA: 1, gB: 1, tapP: 0, oc: 1.5, ocX: 1, cool: 3, coolM: 1, hcap: 100, heatX: 1,
    thr: 1 + Math.floor(S.node / 3), ps: 1, dm: 1, irqR: 1, irqP: 1, cost: 1, off: 2 + 0.5 * S.node,
    gen: Array(12).fill(1), sg: Array(12).fill(0), muG: 1, reqX: 1, ctRew: 1,
    noOC: false, noDm: false, startNode: 0, keepDm: false, keepRig: false, keepRack: false
  };
  for (const r of RES) if (S.res[r.id]) r.fx(M);
  for (const s of SHOP) if (S.shop[s.id]) s.fx(M);
  for (const m of MIL) if (S.st.reb >= m.n) m.fx(M);
  for (const q of QP) if (S.qp[q.id]) q.fx(M);
  for (const r of RR) { const L = S.rr[r.id] || 0; if (L) r.fx(M, L); }
  (MODES[S.mode] || MODES.std).fx(M);
  const L = id => { const v = S.rig[id] || 0; return v ? effLv(S, RIGM[id], v) : 0; };
  M.gA += 0.03 * L('clk') + 0.025 * L('cor') + 0.015 * L('psu');
  M.gB *= Math.pow(1.2, L('clu'));
  M.cool += 0.7 * L('fin') + 1.1 * L('fan');
  M.hcap += 5 * L('ceil');
  M.cool += 0.12 * L('rcl') * Math.min(S.sled, 12 + 2 * L('slt'));
  M.gA += 0.015 * L('run');
  M.tapP += 0.015 * L('eye');
  M.cool += 1.4 * L('gar'); M.hcap += 2 * L('gar');
  M.irqP *= 1 + 0.06 * L('bld'); M.irqR *= 1 + 0.05 * L('bld');
  M.dm *= 1 + 0.06 * L('sol');
  M.off += 0.5 * L('cry');
  M.thr += L('hrn');
  M.dm *= 1 + 0.07 * L('cof'); M.cool += 0.9 * L('bon'); M.irqR *= 1 + 0.04 * L('rat'); M.ps *= 1 + 0.03 * L('ghl');
  M.gA += 0.015 * L('can'); M.muG *= 1 + 0.015 * L('bsn'); M.oc += 0.03 * L('sig'); M.hcap += 3 * L('sig'); M.ctRew *= 1 + 0.1 * L('orb');
  M.gA += 0.02 * L('tnt'); M.irqP *= 1 + 0.08 * L('eyr'); M.gB *= Math.pow(1.12, L('prt')); M.cost *= 1 - 0.01 * L('tid');
  M.oc += 0.03 * L('vrm');
  M.gA += 0.02 * L('ram'); M.tapP += 0.02 * L('lan'); M.ctRew *= 1 + 0.03 * L('pre'); M.heatX *= 1 - 0.025 * L('brp'); M.dm *= 1 + 0.08 * L('ecc');
  M.gA += 0.02 * L('wfr'); M.muG *= 1 + 0.02 * L('lsr'); M.oc += 0.04 * L('lns'); M.hcap += 3 * L('clr');
  M.oc *= M.ocX;
  M.heatX *= 1 + 0.025 * L('clk');
  M.irqP *= 1 + 0.08 * L('edg'); M.irqR *= 1 + 0.04 * L('edg');
  M.ctRew *= 1 + 0.04 * L('bal');
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
function qMult(S) { return 1 + 0.5 * S.qbT; }
const maxSleds = S => 12 + 2 * (S.rig.slt || 0);
function sledMult(S) { return 1 + (0.03 + 0.0015 * (S.rig.sld || 0)) * Math.min(maxSleds(S), S.sled); }
function gMult(S) {
  const M = S._M;
  let m = M.g * M.gA * M.gB * muMult(S) * Math.pow(NODE_MULT, S.node) * (1 + 0.012 * S._ac) * qMult(S) * sledMult(S);
  if (S.oc) m *= M.oc;
  if (S.thr) m *= 0.35;
  if (S.fr > 0) m *= 3;
  if (S.bf > 0) m *= 2;
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
// prices follow permanent multipliers (softly), so prestige makes runs faster without making them free
const COST_B0 = 20, CP = 1.2;
function permMult(S) {
  const M = S._M;
  return M.g * M.gA * M.gB * muMult(S) * Math.pow(NODE_MULT, S.node) * (1 + 0.012 * S._ac) * qMult(S) * sledMult(S);
}
function costScale(S) { const p = permMult(S) / COST_B0; return p > 1 ? Math.pow(p, CP) : 1; }
const nodeCost = costScale;
function cost(S, i, k) { const G = GENS[i]; return G.b * nodeCost(S) * S._M.cost * Math.pow(G.r, S.g[i]) * (Math.pow(G.r, k) - 1) / (G.r - 1); }
const GEN_CAP = 1000;
function maxBuy(S, i) {
  if (S.g[i] >= GEN_CAP) return 0;
  const G = GENS[i], base = G.b * nodeCost(S) * S._M.cost * Math.pow(G.r, S.g[i]);
  if (S.c < base) return 0;
  let k = Math.floor(Math.log(S.c * (G.r - 1) / base + 1) / Math.log(G.r));
  while (k > 0 && cost(S, i, k) > S.c) k--;
  return Math.min(k, GEN_CAP - S.g[i]);
}
function genAvail(S, i) { return GENS[i].u <= S.node; }
function buyGen(S, i, k) {
  if (!genAvail(S, i) || k < 1 || S.g[i] + k > GEN_CAP) return false;
  const c = cost(S, i, k);
  if (S.c < c) return false;
  S.c -= c; S.g[i] += k; return true;
}
function toggleOC(S) { if (S.thr || S._M.noOC) return false; S.oc = !S.oc; return true; }
function dataMult(S) { return S._M.dm * dmBase(S); }
function heatPct(S) { return Math.min(100, S.heat / S._M.hcap * 100); }

// ---------- rig upgrades ----------
const rigLv = (S, id) => S.rig[id] || 0;
const rigTotal = S => { let n = 0; for (const k in S.rig) n += S.rig[k]; return n; };
const rigBase = (S, u) => u.costs ? u.costs.length : (u.cap || 8 + 4 * S.node);
const rigExtra = (S, u) => u.costs ? 0 : 12;   // Tier II: late levels, steep cost, half effect
function rigCap(S, u) { return rigBase(S, u) + rigExtra(S, u); }
function effLv(S, u, L) { const b = rigBase(S, u); return L <= b ? L : b + (L - b) * 0.15; }
function rigCost(S, u, L) {
  if (u.costs) return u.costs[L] * costScale(S);
  const b = rigBase(S, u), t2 = L >= b ? 150 * Math.pow(1.5, L - b) : 1;
  return u.b * Math.pow(u.r, L) * t2 * costScale(S);
}
function rigVal(S, u, L) { return u.val(effLv(S, u, L), S); }
function rigDelta(S, id) {
  if (!RIG_PROD[id]) return 0;
  const base = cps(S);
  S.rig[id] = (S.rig[id] || 0) + 1; recalc(S);
  const d = cps(S) - base;
  S.rig[id]--; if (!S.rig[id]) delete S.rig[id];
  recalc(S);
  return d;
}
function buyRig(S, id) {
  const u = RIGM[id]; if (!u || !u.unl(S)) return false;
  const L = rigLv(S, id);
  if (L >= rigCap(S, u)) return false;
  const c = rigCost(S, u, L);
  if (S.c < c) return false;
  S.c -= c; S.rig[id] = L + 1; recalc(S); return true;
}

// ---------- repeatable research ----------
const rrCap = S => 30 + 4 * S.node;
const rrCost = (S, r) => r.b * dmBase(S) * Math.pow(r.r, S.rr[r.id] || 0);
const rrOpen = S => Object.keys(S.res).length >= 8;
function buyRR(S, id) {
  const r = RR.find(x => x.id === id); if (!r || !rrOpen(S)) return false;
  if ((S.rr[id] || 0) >= rrCap(S)) return false;
  const c = rrCost(S, r); if (S.data < c) return false;
  S.data -= c; S.rr[id] = (S.rr[id] || 0) + 1; recalc(S); return true;
}

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
  if (d.r.cool) S.heat = Math.max(0, S.heat - S._M.hcap * d.r.cool / 100);
  if (d.r.burst) add(S, cps(S) * d.r.burst);
}

// ---------- clients / contracts ----------
const refRate = S => 5 * (1 + 0.4 * S.node);
function stressLvl(S, key) {
  const L = id => S.rig[id] || 0;
  if (key === 'fin') return L('fin') + L('fan');
  if (key === 'all') return (L('clk') + L('cor') + L('fin') + L('nic')) / 4;
  return L(key);
}
const ctEta = k => 40 + 20 * k;
function ctRate(S) {
  const cl = CLIENTS[(S.ct.b * 5 + S.ct.k) % CLIENTS.length];
  return refRate(S) * (1 + 0.04 * (S.rig.nic || 0)) * (1 + 0.03 * stressLvl(S, cl.key)) * (1 + 0.03 * (S.rig.rcb || 0)) * S._M.reqX;
}
const ctSize = S => refRate(S) * ctEta(S.ct.k);
function ctRew(S, k, b) {
  return { c: cps(S) * ctEta(k) * 0.03 * REWK[k] * (1 + 0.05 * b) * S._M.ctRew, d: 4 * dataMult(S) * (1 + 0.25 * k) };
}
function ctInfo(S) {
  const ct = S.ct, cl = CLIENTS[(ct.b * 5 + ct.k) % CLIENTS.length];
  const size = ctSize(S), rate = ctRate(S);
  return { cl, b: ct.b, k: ct.k, p: ct.p, size, rate, left: Math.max(0, (size - ct.p) / rate), rew: ctRew(S, ct.k, ct.b), key: cl.key };
}
function ctDone(S) {
  const ct = S.ct, r = ctRew(S, ct.k, ct.b);
  add(S, r.c); S.data += r.d; S.st.cont++;
  S._ev.push({ k: 'job', c: r.c, d: r.d });
  ct.k++;
  if (ct.k >= 5) {
    ct.k = 0; ct.b++; S.st.boards++;
    if (S.sled < maxSleds(S)) S.sled++;
    log(S, 'Board cleared. A new sled slides into the rack.');
    S._ev.push({ k: 'board' });
  }
}
function ctWork(S, w) {
  if (!S.un.ct) return;
  S.ct.p += w;
  let n = 0;
  while (n < 400) {
    const size = ctSize(S);
    if (S.ct.p < size) break;
    S.ct.p -= size; ctDone(S); n++;
  }
  if (n >= 400) S.ct.p = 0;
}
const speedCost = S => 60 * dataMult(S);
function speedUp(S) {
  if (!S.un.ct || S._su > 0) return false;
  const c = speedCost(S); if (S.data < c) return false;
  S.data -= c; S._su = 30; ctWork(S, ctRate(S) * 20); return true;
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
const dOn = (S, id) => !S._M.noDm && S.dm[id] && S.dm[id].own && S.dm[id].on;

function dRig(S, reserve) {
  for (let k = 0; k < 4; k++) {
    const base = cps(S);
    let best = null, bs = Infinity;
    for (const u of RIG) {
      if (!u.unl(S)) continue;
      const L = rigLv(S, u.id); if (L >= rigCap(S, u)) continue;
      const ct = rigCost(S, u, L);
      if (ct > S.c * 0.35 - (reserve || 0)) continue;
      const dl = rigDelta(S, u.id);
      const sc = ct / Math.max(dl, base * 0.01);
      if (sc < bs) { bs = sc; best = u; }
    }
    if (!best) break;
    buyRig(S, best.id);
  }
}
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
  if (S.un.cmp) dRig(S, reserve);
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
    if (S.heat > 0.5 * S._M.hcap && S.pOn.fsck !== false && !run('fsck')) pick = PM.fsck;
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
  if (rrOpen(S) && RES.every(r => S.res[r.id])) {
    for (let k = 0; k < 6; k++) {
      const opts = RR.filter(r => (S.rr[r.id] || 0) < rrCap(S) && S.data >= rrCost(S, r)).sort((a, b) => rrCost(S, a) - rrCost(S, b));
      if (!opts.length) break;
      buyRR(S, opts[0].id);
    }
  }
}
function dFrost(S) {
  if (!S.un.oc || S._M.noOC) return;
  const h = S.heat / S._M.hcap;
  if (!S.oc && !S.thr && h < 0.3) S.oc = true;
  else if (S.oc && h > 0.88) S.oc = false;
}
const ARS = [0.25, 0.5, 1, 2];
function dCycle(S) {
  const g = muGain(S);
  if (g >= Math.max(2, ARS[S.set.ar] * S.muT)) reboot(S);
}

// ---------- prestige: reboot ----------
function modeMx(S) { return (MODES[S.mode] || MODES.std).mx; }
// what a run must beat: the more permanent power you already have, the more cycles it takes to earn microcode
const BETA = 1.0;
function runRef(S) { return MUK * Math.pow(muMult(S) * Math.pow(NODE_MULT, S.node) * qMult(S), BETA); }
function muGain(S) {
  const r = S.run / runRef(S);
  if (r < 1) return 0;
  return Math.floor(Math.pow(r, MUP) * S._M.muG * (1 + 0.1 * S.qbT) * modeMx(S));
}
function muNext(S) {
  const mult = S._M.muG * (1 + 0.1 * S.qbT) * modeMx(S);
  return runRef(S) * Math.pow((muGain(S) + 1) / mult, 1 / MUP);
}
// a small float so a fresh run at a fine node can always buy its first units
function seedCycles(S) { return S.node ? 60 * GENS[0].b * costScale(S) * S._M.cost : 0; }
function resetRun(S) {
  S.mode = S.nmode;
  recalc(S);
  S.c = seedCycles(S); S.run = 0; S.heat = 0; S.oc = false; S.thr = false; S.fr = 0; S.q = []; S.irq = null; S.nirq = 60;
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
function setMode(S, id) {
  const m = MODES[id]; if (!m || S.st.reb < m.need) return false;
  S.nmode = id; return true;
}

// ---------- prestige: die shrink ----------
function canShrink(S) { return S.node < 12 && S.muT >= REQ[S.node]; }
function nodeNote(n) {
  const a = [];
  GENS.forEach(g => { if (g.u === n) a.push(g.n); });
  PROCS.forEach(p => { if (p.u === n) a.push(p.n + ' task'); });
  if (n % 3 === 0) a.push('+1 thread');
  a.push('rig caps +4', '+30 min offline');
  return a.join(', ');
}
function shrink(S) {
  if (!canShrink(S)) return false;
  const g = muGain(S);
  if (g > 0) { S.mu += g; S.muT += g; S.st.muAll += g; }
  for (const s of SHOP) if (S.shop[s.id]) S.mu += s.c;
  S.shop = {}; S.res = {}; S.rr = {}; S.data = 0;
  S.node++; S.st.shr++;
  resetRun(S);
  log(S, 'Die shrink. The stone is now ' + NODES[S.node] + '.');
  slow(S);
  return true;
}

// ---------- prestige: ascension (burns lifetime microcode into qubits) ----------
function qGain(S) { return S.muT < ASC_MU ? 0 : Math.floor(Math.sqrt(S.muT / ASC_DIV)); }
const canAscend = S => qGain(S) >= 1;
function qNext(S) { return ASC_DIV * Math.pow(qGain(S) + 1, 2); }
function ascend(S) {
  const q = qGain(S);
  if (q < 1) return false;
  S.qb += q; S.qbT += q; S.asc = (S.asc || 0) + 1; S.st.asc++;
  const M = S._M;
  S.mu = 0; S.muT = 0; S.shop = {}; S.res = {}; S.rr = {}; S.data = 0;
  if (!M.keepDm) S.dm = {};
  if (!M.keepRig) S.rig = {};
  if (!M.keepRack) { S.sled = 0; S.ct = { b: 0, k: 0, p: 0 }; }
  S.nmode = 'std';
  recalc(S);
  S.node = S._M.startNode;
  resetRun(S);
  log(S, 'Ascension. +' + q + ' qubits. The stone forgets; the pattern does not.');
  slow(S);
  return true;
}
function buyQP(S, id) {
  const p = QP.find(x => x.id === id);
  if (!p || S.qp[id] || (p.req && !S.qp[p.req]) || S.qb < p.c) return false;
  S.qb -= p.c; S.qp[id] = 1; recalc(S); return true;
}

// ---------- interrupts ----------
function clickIrq(S) {
  const q = S.irq;
  if (!q) return '';
  S.irq = null; S.st.irq++;
  const M = S._M, c = cps(S);
  let msg;
  if (q.k === 'o') { S.irq = q; return omen(S, 2); }
  if (q.k === 'f') { S.fr = 20; msg = 'Interrupt storm: ×3 for 20s'; }
  else if (q.k === 'd') { const v = 8 * dataMult(S) * M.irqP; S.data += v; msg = '+' + fmt(v) + ' data'; }
  else { const v = Math.max(25, c * (45 + Math.random() * 45) * M.irqP); add(S, v); msg = '+' + fmt(v) + ' cycles'; }
  return msg;
}

// ---------- omens: a voice in the dark offers three roads ----------
const OMEN = [
  { n: 'Take the gift',      d: 'Two minutes of output now. The stone drinks 25% of its heat limit.' },
  { n: 'Strike the bargain', d: 'Pay a quarter of your cycles. Output ×2 for 40 seconds.' },
  { n: 'Refuse',             d: 'Walk away with a little data.' }
];
function omen(S, i) {
  if (!S.irq || S.irq.k !== 'o') return '';
  let msg = '';
  if (i === 0) { const v = cps(S) * 120; add(S, v); S.heat = Math.min(S._M.hcap * 0.95, S.heat + S._M.hcap * 0.25); msg = 'The gift: +' + fmt(v) + ' cycles'; }
  else if (i === 1) { if (S.c <= 0) return ''; S.c *= 0.75; S.bf = 40; msg = 'Bargain struck: ×2 output for 40s'; }
  else { const v = 4 * dataMult(S); S.data += v; msg = 'Refused: +' + fmt(v) + ' data'; }
  S.irq = null; S.st.irq++; S.st.omen = (S.st.omen || 0) + 1;
  return msg;
}

// ---------- guided goals ----------
const cnt = o => Object.keys(o).length;
const GOALS = [
  { id: 'g1',  tag: 'TICK',   t: 'Tick the clock 10 times',                      m: 10,   cur: S => S.st.taps },
  { id: 'g2',  tag: 'UNITS',  t: 'Buy 5 Transistors',                            m: 5,    cur: S => S.g[0] },
  { id: 'g3',  tag: 'UNITS',  t: 'Buy a Logic Gate',                             m: 1,    cur: S => S.g[1] },
  { id: 'g4',  tag: 'RIG',    t: 'Upgrade the Clock 3 times (Forge, Compute)',     m: 3,    cur: S => rigLv(S, 'clk') },
  { id: 'g5',  tag: 'UNITS',  t: 'Own 10 ALUs',                                  m: 10,   cur: S => S.g[2] },
  { id: 'g6',  tag: 'GROW',   t: 'Reach 20K cycles to unlock overclock',         m: 2e4,  cur: S => S.tot, big: 1 },
  { id: 'g7',  tag: 'HEAT',   t: 'Overclock for 15 seconds (Forge, Thermal)',      m: 15,   cur: S => S.st.ocT },
  { id: 'g8',  tag: 'GROW',   t: 'Reach 100K cycles to open Rites and the Grimoire',       m: 1e5,  cur: S => S.tot, big: 1 },
  { id: 'g9',  tag: 'WORK',   t: 'Finish 3 processes (Rites, Incantations)',         m: 3,    cur: S => S.st.proc },
  { id: 'g10', tag: 'LAB',    t: 'Buy a research (Grimoire)',                         m: 1,    cur: S => cnt(S.res) },
  { id: 'g11', tag: 'WORK',   t: 'Finish a client contract (Rites, Pacts)',     m: 1,    cur: S => S.st.cont },
  { id: 'g12', tag: 'RIG',    t: 'Upgrade the Heatsink 3 times',                 m: 3,    cur: S => rigLv(S, 'fin') },
  { id: 'g13', tag: 'RIG',    t: 'Upgrade the NIC 3 times (Forge, Ingress)',       m: 3,    cur: S => rigLv(S, 'nic') },
  { id: 'g14', tag: 'RACK',   t: 'Clear a board: 5 contracts in a row',          m: 5,    cur: S => S.st.boards ? 5 : S.ct.k },
  { id: 'g15', tag: 'GROW',   t: 'Reach 200M cycles in one run',                 m: 2e8,  cur: S => S.run, big: 1 },
  { id: 'g16', tag: 'REBIRTH', t: 'Reboot for microcode (Rebirth)',              m: 1,    cur: S => S.st.reb },
  { id: 'g17', tag: 'REBIRTH', t: 'Buy a microcode upgrade (Rebirth, Shop)',     m: 1,    cur: S => cnt(S.shop) + (S.st.shr ? 1 : 0) },
  { id: 'g18', tag: 'DAEMON', t: 'Bind a daemon (Rebirth, Daemons)',             m: 1,    cur: S => cnt(S.dm) },
  { id: 'g19', tag: 'SHRINK', t: 'Shrink the die once (Rebirth, Shrink)',        m: 1,    cur: S => S.node },
  { id: 'g20', tag: 'BOARD',  t: 'Own a Chiplet to open the board view',         m: 1,    cur: S => S.g[8] },
  { id: 'g21', tag: 'REBIRTH', t: 'Reboot 5 times to unlock Safe boot',          m: 5,    cur: S => S.st.reb },
  { id: 'g22', tag: 'ASCEND', t: 'Gather 30M lifetime microcode to ascend',      m: ASC_MU, cur: S => S.muT, big: 1 },
  { id: 'g23', tag: 'ASCEND', t: 'Ascend for qubits (Rebirth, Ascend)',          m: 1,    cur: S => S.st.asc }
];
function goalInfo(S) {
  const g = GOALS[S.goal]; if (!g) return null;
  return { i: S.goal, g, cur: Math.min(g.m, g.cur(S)), max: g.m };
}
function goalReward(S, i) { return { c: Math.max(100 * (i + 1), cps(S) * 10), d: i >= 8 ? 3 * dataMult(S) : 0 }; }
function checkGoals(S, silent) {
  let n = 0;
  while (S.goal < GOALS.length && GOALS[S.goal].cur(S) >= GOALS[S.goal].m && n < 40) {
    const i = S.goal;
    if (!silent) {
      const r = goalReward(S, i); add(S, r.c); S.data += r.d;
      S._ev.push({ k: 'goal', t: GOALS[i].t, c: r.c, d: r.d });
      log(S, 'Goal done: ' + GOALS[i].t);
    }
    S.goal++; n++;
  }
}

// ---------- contextual hints ----------
function hint(S) {
  if (S.thr) return { tag: 'HEAT', tone: 'red', t: 'Throttled. Output is cut until heat falls to 25%. Cooling lives in Forge, Thermal.' };
  if (S.oc && heatPct(S) > 80) return { tag: 'HEAT', tone: 'red', t: 'Heat is ' + Math.round(heatPct(S)) + '%. Disengage overclock or run fsck before it throttles.' };
  if (S.bf > 0) return { tag: 'BARGAIN', tone: 'amb', t: 'The bargain holds: output doubled for ' + Math.ceil(S.bf) + 's.' };
  if (S.irq && S.irq.k === 'o') return { tag: 'OMEN', tone: 'amb', t: 'A voice offers three roads. Tap the glowing omen to choose.' };
  if (S.irq) return { tag: 'EVENT', tone: 'amb', t: 'An interrupt is waiting. Tap the chip at the bottom of the screen.' };
  if (canAscend(S) && S.un.asc) return { tag: 'ASCEND', tone: 'teal', t: 'You can ascend for ' + qGain(S) + ' qubits. It resets microcode and the die.' };
  if (canShrink(S)) return { tag: 'SHRINK', tone: 'teal', t: 'A die shrink is ready: ' + NODES[S.node] + ' to ' + NODES[S.node + 1] + '.' };
  if (S.un.rb && muGain(S) >= Math.max(2, 0.5 * S.muT)) return { tag: 'READY', tone: 'grn', t: 'Reboot now for +' + muGain(S) + ' microcode.' };
  if (S.un.pr && S.q.length < S._M.thr && !dOn(S, 'scribe') && S.c > 0) return { tag: 'IDLE', tone: 'amb', t: 'A thread is idle. Cast an incantation in Rites to earn data.' };
  if (S.un.oc && !S.oc && !S.thr && heatPct(S) < 20 && !dOn(S, 'frost') && !S._M.noOC) return { tag: 'TIP', tone: 'dim', t: 'Overclock multiplies every cycle. Engage it while heat is low.' };
  if (S.data >= 10 && RES.some(r => !S.res[r.id] && (!r.req || S.res[r.req]) && S.data >= r.c)) return { tag: 'LAB', tone: 'grn', t: 'You have enough data for a research.' };
  return { tag: 'TIP', tone: 'dim', t: 'Milestones double a unit at 25, 50, 100 and 200 owned. Each unit caps at 1000.' };
}

// ---------- help topics ----------
const HELP = [
  { id: 'basics', t: 'The basics', u: S => true,
    b: 'Tick the clock to push cycles through the silicon. Spend cycles on units. Each tier boosts the tier below it a little, and owning 25, 50, 100 and 200 of a unit doubles its output. Each unit caps at 1000. New parts of the machine appear as you grow, so keep an eye out for outlines on the schematic.' },
  { id: 'rig', t: 'The Forge', u: S => S.un.cmp,
    b: 'Forge upgrades are levelled parts: Compute raises output, Thermal lets you overclock longer, Ingress speeds up client work, Power adds efficiency. They stay when you reboot or shrink. A die shrink raises every level cap by 4 and makes the next levels cost more. The tile marked Best buy gives the most output for its price.' },
  { id: 'oc', t: 'Overclock and heat', u: S => S.un.oc,
    b: 'Overclock multiplies all cycles but builds heat. At 100% heat the chip throttles: output drops to 35% until heat falls to 25%. Cool it with heatsinks, fans, research or the fsck process. The Daemon of Frost handles this for you.' },
  { id: 'proc', t: 'Incantations and threads', u: S => S.un.pr,
    b: 'Incantations cost cycles and run on threads. Most give data, which pays for research. fsck cools the chip, cron pays back cycles. You start with a few threads and gain more from research, die shrinks and rebirth upgrades.' },
  { id: 'lab', t: 'The Grimoire', u: S => S.un.pr,
    b: 'Research is bought with data and is permanent until a die shrink. Once the main tree is done, repeatable research keeps data useful. Data also pays for speeding up client contracts.' },
  { id: 'ct', t: 'Pacts and the rack', u: S => S.un.ct,
    b: 'Patrons offer pacts in boards of five. Finishing a contract pays cycles and data. Each client stresses one part of your rig and works faster when that part is upgraded. Clear a board to slide a sled into the rack: each sled adds 3% cycles, up to 12 sleds.' },
  { id: 'reboot', t: 'Reboot', u: S => S.un.rb,
    b: 'Reboot resets cycles, units and heat, and pays microcode based on this run. Microcode multiplies your cycles for good and buys upgrades in the Shop. Wait until the reward is meaningfully bigger than what you already have.' },
  { id: 'modes', t: 'Boot modes', u: S => S.st.reb >= 5,
    b: 'Before a run, pick a boot mode. Each one adds a handicap or a risk to that run and multiplies the microcode it pays. Modes unlock with total reboots. The mode that was active when you reboot sets the bonus.' },
  { id: 'daemons', t: 'Daemons', u: S => S.un.dm,
    b: 'Daemons are bound with microcode and keep working through reboots and shrinks. They automate buying, ticking, processes, overclocking, research, interrupts and rebooting. You can switch each one off.' },
  { id: 'shrink', t: 'Die shrink', u: S => S.un.rb,
    b: 'The die is the slice of silicon your chip is etched on, and the process node (180nm, 130nm, 90nm…) is how fine the etching is. Finer means more transistors fit, so the chip does more. A die shrink is your second rebirth: you rebuild the chip on a finer node. It gives ×2.5 cycles, unlocks new units, processes and threads, and raises rig caps. It resets the run, research and the shop, but refunds the microcode you spent there. The next shrink needs more lifetime microcode.' },
  { id: 'rack', t: 'The rack', u: S => S.sled > 0 || S.st.boards > 0,
    b: 'Every cleared pact board slides a sled into the rack. FORGE, Rack upgrades make each sled stronger, add bays for more sleds, cool the chip and speed up pacts.' },
  { id: 'occult', t: 'The Occult', u: S => S.node >= 1 || S.st.reb >= 2,
    b: 'Forbidden parts in FORGE, Occult: runic etching, a watching eye, a gargoyle heatsink, blood conduits, soul jars, a crypt cache and a summoning circle that adds threads. More of them open as you reboot and shrink the die.' },
  { id: 'domain', t: 'The Domain', u: S => S.node >= 2,
    b: 'Beyond the chip lie three dark sites: the Crypt (die 90nm), the Altar (45nm) and the Abyss (22nm). Each one has its own view in the schematic, and every upgrade you buy in DOMAIN visibly attaches to it: coffins, ravens and ghouls; candles, a chalice and standing stones; tentacles, eyes and a void portal. Each site boosts something different, so none replaces the others.' },
  { id: 'mem', t: 'The Memory bus', u: S => S.st.reb >= 1,
    b: 'Your first reboot opens FORGE, Memory: RAM sticks, bus lanes, a prefetcher, a branch oracle and warding. Each one you buy appears on the MEMORY view of the schematic.' },
  { id: 'fab', t: 'The Foundry', u: S => S.node >= 1,
    b: 'Your first die shrink opens FORGE, Foundry: a wafer line, a lithography beam, a lens stack and cleanroom wards. They appear on the FAB view of the schematic.' },
  { id: 'omen', t: 'Omens', u: S => S.un.pr,
    b: 'Now and then a voice offers a choice instead of a plain reward. Take the gift for a burst of cycles at the cost of heat, strike a bargain to double output for a short time at the cost of a quarter of your cycles, or refuse and keep a little data. The Daemon of Mirrors refuses for you.' },
  { id: 'asc', t: 'Ascension', u: S => S.un.asc,
    b: 'Ascension burns all your microcode, upgrades and the die into qubits. Qubits give a permanent bonus and buy perks that make every later climb faster: starting at a finer node, keeping daemons or the rig, and strong multipliers. Spend them before you start the next climb.' }
];

// ---------- slow loop: unlocks, achievements, story, goals ----------
function slow(S) {
  const u = S.un;
  if (!u.cmp && S.tot >= 300) u.cmp = 1;
  if (!u.oc && S.tot >= 2e4) u.oc = 1;
  if (!u.pr && S.tot >= 1e5) u.pr = 1;
  if (!u.ct && S.tot >= 1e5) u.ct = 1;
  if (!u.pw && S.tot >= 5e5) u.pw = 1;
  if (!u.rb && (S.run >= 2e7 || S.st.reb > 0)) u.rb = 1;
  if (!u.dm && (S.st.reb > 0 || cnt(S.dm))) u.dm = 1;
  if (!u.asc && (S.muT >= ASC_MU * 0.4 || S.st.asc > 0)) u.asc = 1;
  const fresh = [];
  for (const a of ACH) if (!S.ach[a.id] && a.f(S)) { S.ach[a.id] = 1; fresh.push(a); }
  if (fresh.length) { recalc(S); fresh.forEach(a => log(S, 'Seal broken: ' + a.n)); }
  for (const s of STORY) if (!S.sto[s[0]] && s[1](S)) { S.sto[s[0]] = 1; log(S, s[2]); }
  checkGoals(S, false);
  return fresh;
}

// ---------- main tick ----------
function tick(S, dt) {
  const M = S._M;
  S.t += dt;
  if (S._su > 0) S._su = Math.max(0, S._su - dt);
  const c = cps(S);
  let gain = c * dt;
  if (dOn(S, 'wrath')) gain += tapValue(S, c) * 5 * dt;
  add(S, gain);
  if (M.noOC && S.oc) S.oc = false;

  // heat
  const hc = M.hcap, heatUp = 4 * M.oc * M.oc * M.heatX, cool = M.cool * M.coolM;
  if (S.thr) { S.heat -= cool * dt; if (S.heat <= 0.25 * hc) S.thr = false; }
  else if (S.oc) {
    S.heat += (heatUp - cool) * dt; S.st.ocT += dt;
    if (S.heat >= hc) { S.heat = hc; S.thr = true; S.oc = false; S.st.thr++; }
  } else S.heat -= cool * dt;
  if (S.heat < 0) S.heat = 0;
  if (S.heat > hc) S.heat = hc;
  if (S.fr > 0) S.fr = Math.max(0, S.fr - dt);
  if (S.bf > 0) S.bf = Math.max(0, S.bf - dt);

  // tasks
  for (let i = S.q.length - 1; i >= 0; i--) {
    const p = S.q[i]; p.t += dt * M.ps;
    const d = PM[p.id];
    if (p.t >= d.t) { S.q.splice(i, 1); finishProc(S, d); }
  }

  // contracts
  if (S.un.ct) ctWork(S, ctRate(S) * dt);

  // interrupts
  if (S.irq) { S.irq.l -= dt; if (S.irq.l <= 0) S.irq = null; }
  else {
    S.nirq -= dt * M.irqR;
    if (S.nirq <= 0) {
      const r = Math.random();
      const k = r < 0.5 ? 'b' : r < 0.72 ? (S.un.pr ? 'd' : 'b') : r < 0.88 ? 'f' : (S.un.pr ? 'o' : 'b');
      S.irq = { k, l: k === 'o' ? 30 : 15 }; S.nirq = 70 + Math.random() * 70;
    }
  }

  // daemons
  S.dacc += dt;
  if (S.dacc >= 0.5) {
    S.dacc = 0;
    if (dOn(S, 'mirror') && S.irq) clickIrq(S);
    if (dOn(S, 'frost')) dFrost(S);
    if (dOn(S, 'scribe')) dScribe(S);
    if (dOn(S, 'hunger')) dHunger(S);
    if (dOn(S, 'greed')) dGreed(S, 10, dOn(S, 'scribe') ? taskReserve(S) : 0);
    if (dOn(S, 'cycle')) dCycle(S);
  }

  S.sl += dt;
  if (S.sl >= 1) { S.sl = 0; slow(S); }
  if (S._ev.length > 40) S._ev.splice(0, S._ev.length - 40);
}
function offline(S, sec) {
  sec = Math.min(sec, S._M.off * 3600);
  S.oc = false; S.thr = false; S.heat = 0; S.fr = 0;
  add(S, cps(S) * sec);
  ctWork(S, ctRate(S) * sec * 0.5);
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
  MS, GENS, NODES, REQ, PROCS, RES, RR, SHOP, DAEMONS, ACH, PM, ARS, NODE_MULT, RIG, RIGM, CLIENTS, STRESS_NAME,
  MODES, MODE_IDS, MIL, QP, GOALS, HELP, ASC_MU, costScale, permMult,
  fmt, fmtI, newState, serialize, deserialize, recalc, log,
  cps, gMult, genMult, muMult, qMult, sledMult, maxSleds, genProd, tapValue, tap, cost, maxBuy, genAvail, buyGen, toggleOC, dataMult, dmBase, heatPct,
  GEN_CAP, rigLv, rigTotal, rigCap, rigCost, rigVal, rigDelta, buyRig, refRate, stressLvl,
  rrCap, rrCost, rrOpen, buyRR,
  ctInfo, ctRate, ctSize, ctEta, speedCost, speedUp, ctWork,
  procCost, startProc, buyRes, buyShop, buyDaemon, dOn,
  dGreed, dRig, taskReserve, dScribe, dHunger, dFrost, dCycle,
  muGain, muNext, reboot, setMode, canShrink, nodeNote, shrink,
  qGain, qNext, canAscend, ascend, buyQP,
  clickIrq, omen, OMEN, goalInfo, goalReward, checkGoals, hint, slow, tick, offline, advance, add
};
if (typeof module === 'object' && module.exports) module.exports = CORE; else root.CORE = CORE;
})(typeof window !== 'undefined' ? window : globalThis);
