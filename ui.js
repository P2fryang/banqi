const $ = id => document.getElementById(id);
const GLYPH = {
  r: { G: '帥', A: '仕', E: '相', R: '俥', H: '傌', C: '炮', S: '兵' },
  b: { G: '將', A: '士', E: '象', R: '車', H: '馬', C: '砲', S: '卒' },
};
const NAMES = { G: 'General', A: 'Advisor', E: 'Elephant', R: 'Chariot', H: 'Horse', C: 'Cannon', S: 'Soldier' };
const KEY = 'banqi-v1';
let rules, state, history = [], selected = null, mode = 'ruled';

{ const { name, ...base } = TAIWAN; $('custom').value = JSON.stringify(base, null, 1); }

function getRules() {
  const k = $('ruleset').value;
  return k === 'custom' ? { ...TAIWAN, ...JSON.parse($('custom').value), name: 'Custom' } : RULESETS[k];
}

function start() {
  try { rules = getRules(); } catch (e) { $('status').textContent = 'Custom rules: ' + e.message; return; }
  state = newGame(rules); history = []; selected = null;
  render(); save();
}

function play(m) {
  history.push(structuredClone(state));
  apply(state, m, rules, mode === 'free');
  selected = null;
}

function click(i) {
  const p = state.board[i];
  if (mode === 'free') {
    if (selected !== null) play({ from: selected, to: i });      // same square flips the piece back
    else if (p && !p.up) play({ from: i, to: i });
    else if (p) selected = i;
  } else {
    const moves = legalMoves(state, rules);
    const m = moves.find(m => m.from === i && m.to === i) ||
      (selected !== null && moves.find(m => m.from === selected && m.to === i));
    if (m) play(m);
    else selected = p && p.up && moves.some(m => m.from === i) ? i : null;
  }
  render(); save();
}

const who = n => `Player ${n + 1}` + (state.sides[n] ? ` (${state.sides[n] === 'r' ? 'red' : 'black'})` : '');

function render() {
  const board = $('board');
  const focus = board.contains(document.activeElement) ? document.activeElement.dataset.i : null;
  const moves = mode === 'ruled' ? legalMoves(state, rules) : [];
  const targets = new Set(moves.filter(m => m.from === selected && m.to !== selected).map(m => m.to));
  board.innerHTML = state.board.map((p, i) => {
    const cls = ['cell', p ? (p.up ? 'up ' + p.side : 'down') : '', i === selected ? 'sel' : '',
      targets.has(i) ? (p ? 'hint cap' : 'hint') : ''].join(' ');
    const label = p ? (p.up ? `${p.side === 'r' ? 'Red' : 'Black'} ${NAMES[p.t]}` : 'Face-down piece') : 'Empty square';
    return `<button class="${cls}" data-i="${i}" aria-label="${label}"><span>${p && p.up ? GLYPH[p.side][p.t] : ''}</span></button>`;
  }).join('');
  if (focus !== null) board.children[focus].focus();

  for (const side of ['r', 'b'])
    $('tray-' + side).innerHTML = state.captured[side].slice()
      .sort((a, b) => rules.rank[b] - rules.rank[a])
      .map(t => `<span class="${side}">${GLYPH[side][t]}</span>`).join('');
  $('hidden').textContent = state.board.filter(p => p && !p.up).length;

  $('status').textContent =
    mode === 'free' ? 'Free play: click a piece, then any square. Click a face-down piece to flip it.'
    : state.winner !== null ? `${who(state.winner)} wins.`
    : state.sides[0] ? `${who(state.turn)} to move.`
    : 'Flip any piece to begin. Its colour becomes yours.';
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ k: $('ruleset').value, c: $('custom').value, mode, state, history })); } catch {}
}

$('board').onclick = e => { const b = e.target.closest('.cell'); if (b) click(+b.dataset.i); };
$('mode').onchange = () => { mode = $('mode').value; selected = null; render(); save(); };
$('ruleset').onchange = () => { $('custom').hidden = $('ruleset').value !== 'custom'; if (!$('custom').hidden) return; start(); };
$('new').onclick = start;
$('undo').onclick = () => { if (history.length) { state = history.pop(); selected = null; render(); save(); } };
$('resign').onclick = () => {
  if (mode === 'ruled' && state.winner === null) { history.push(structuredClone(state)); state.winner = 1 - state.turn; render(); save(); }
};

try {
  const d = JSON.parse(localStorage.getItem(KEY));
  $('ruleset').value = d.k; $('custom').value = d.c; $('custom').hidden = d.k !== 'custom';
  $('mode').value = mode = d.mode;
  rules = getRules(); state = d.state; history = d.history; render();
} catch { start(); }

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
