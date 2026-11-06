const $ = id => document.getElementById(id);
const GLYPH = {
  r: { G: '帥', A: '仕', E: '相', R: '俥', H: '傌', C: '炮', S: '兵' },
  b: { G: '將', A: '士', E: '象', R: '車', H: '馬', C: '砲', S: '卒' },
};
const ABBR = { G: 'Gen', A: 'Adv', E: 'Ele', R: 'Cha', H: 'Hor', C: 'Can', S: 'Sol' };
const NAMES = { G: 'General', A: 'Advisor', E: 'Elephant', R: 'Chariot', H: 'Horse', C: 'Cannon', S: 'Soldier' };
const KEY = 'banqi-v1';
let rules, state, history = [], selected = null, mode = 'ruled', lang = 'zh', activeKey = 'taiwan';
let rot = innerWidth < 600 ? 1 : 0; // 0..3 quarter turns; odd = tall board (fits portrait phones)

{ const { name, ...base } = TAIWAN; $('custom').value = JSON.stringify(base, null, 1); }

const label = (side, t) => (lang === 'en' ? ABBR[t] : GLYPH[side][t]);

function getRules() {
  const k = $('ruleset').value;
  return k === 'custom' ? { ...TAIWAN, ...JSON.parse($('custom').value), name: 'Custom' } : RULESETS[k];
}

function start() {
  try { rules = getRules(); } catch (e) { $('status').textContent = 'Custom rules: ' + e.message; return; }
  activeKey = $('ruleset').value;
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

// Logical square indices in display order for rotation 0..3 (text stays upright).
function order(rot) {
  const tall = rot % 2, rows = tall ? COLS : ROWS, cols = tall ? ROWS : COLS, o = [];
  for (let dr = 0; dr < rows; dr++)
    for (let dc = 0; dc < cols; dc++) {
      const [r, c] = [[dr, dc], [ROWS - 1 - dc, dr], [ROWS - 1 - dr, COLS - 1 - dc], [dc, COLS - 1 - dr]][rot];
      o.push(r * COLS + c);
    }
  return o;
}

function render() {
  const board = $('board'), tall = rot % 2 === 1;
  const focus = board.contains(document.activeElement) ? document.activeElement.dataset.i : null;
  const moves = mode === 'ruled' ? legalMoves(state, rules) : [];
  const targets = new Set(moves.filter(m => m.from === selected && m.to !== selected).map(m => m.to));
  board.className = tall ? 'tall' : '';
  board.style.gridTemplateColumns = `repeat(${tall ? ROWS : COLS}, 1fr)`;
  board.innerHTML = order(rot).map(i => {
    const p = state.board[i];
    const cls = ['cell', p ? (p.up ? 'up ' + p.side : 'down') : '', i === selected ? 'sel' : '',
      targets.has(i) ? (p ? 'hint cap' : 'hint') : ''].join(' ');
    const name = p ? (p.up ? `${p.side === 'r' ? 'Red' : 'Black'} ${NAMES[p.t]}` : 'Face-down piece') : 'Empty square';
    return `<button class="${cls}" data-i="${i}" aria-label="${name}"><span>${p && p.up ? label(p.side, p.t) : ''}</span></button>`;
  }).join('');
  if (focus !== null) board.querySelector(`[data-i="${focus}"]`).focus();

  document.body.classList.toggle('en', lang === 'en');
  board.lang = $('tray-r').lang = $('tray-b').lang = lang === 'en' ? 'en' : 'zh-Hant';
  for (const side of ['r', 'b'])
    $('tray-' + side).innerHTML = state.captured[side].slice()
      .sort((a, b) => rules.rank[b] - rules.rank[a])
      .map(t => `<span class="${side}">${label(side, t)}</span>`).join('');
  $('hidden').textContent = state.board.filter(p => p && !p.up).length;

  const rk = Object.keys(rules.rank).sort((a, b) => rules.rank[b] - rules.rank[a]).map(t => NAMES[t]).join(' > ');
  $('rankline').textContent = `Rank in the current rules (highest first): ${rk}.` +
    (rules.cannonJumps ? ' For the cannon, rank only decides what can capture it; its own attack is the jump.' : '');

  $('status').textContent =
    mode === 'free' ? 'Free play: click a piece, then any square. Click a face-down piece to flip it.'
    : state.winner !== null ? `${who(state.winner)} wins.`
    : state.sides[0] ? `${who(state.turn)} to move.`
    : 'Flip any piece to begin. Its colour becomes yours.';
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ k: activeKey, c: $('custom').value, mode, lang, rot, state, history })); } catch {}
}

$('board').onclick = e => { const b = e.target.closest('.cell'); if (b) click(+b.dataset.i); };
$('mode').onchange = () => { mode = $('mode').value; selected = null; render(); save(); };
$('lang').onchange = () => { lang = $('lang').value; render(); save(); };
$('rotate').onclick = () => { rot = (rot + 1) % 4; render(); save(); };
$('ruleset').onchange = () => {
  if (history.length && state.winner === null && !confirm('Changing the rules starts a new game. Continue?')) {
    $('ruleset').value = activeKey; return;
  }
  $('customwrap').hidden = $('ruleset').value !== 'custom';
  start();
};
$('new').onclick = start;
$('undo').onclick = () => { if (history.length) { state = history.pop(); selected = null; render(); save(); } };
$('resign').onclick = () => {
  if (mode === 'ruled' && state.winner === null) { history.push(structuredClone(state)); state.winner = 1 - state.turn; render(); save(); }
};

try {
  const d = JSON.parse(localStorage.getItem(KEY));
  $('ruleset').value = activeKey = d.k; $('custom').value = d.c; $('customwrap').hidden = d.k !== 'custom';
  $('mode').value = mode = d.mode; $('lang').value = lang = d.lang || 'zh'; rot = d.rot ?? rot;
  rules = getRules(); state = d.state; history = d.history; render();
} catch { start(); }

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
