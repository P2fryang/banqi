// Pure game logic. Squares are indexed row*8+col on a 4x8 board. Sides: 'r' red, 'b' black.
// Cell: null | { t: type, side, up: faceUp }. Move: { from, to }; a flip has from === to.
const ROWS = 4, COLS = 8;

function newGame(R) {
  const cells = [];
  for (const side of ['r', 'b'])
    for (const t in R.counts) for (let n = 0; n < R.counts[t]; n++) cells.push({ t, side, up: false });
  while (cells.length < ROWS * COLS) cells.push(null);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  cells.length = ROWS * COLS;
  return { board: cells, turn: 0, sides: [null, null], captured: { r: [], b: [] }, winner: null };
}

const canTake = (a, d, R) => R.beats[a.t + '>' + d.t] ?? R.rank[a.t] >= R.rank[d.t];

function nbrs(i) {
  const r = i >> 3, c = i & 7, o = [];
  if (r > 0) o.push(i - 8);
  if (r < ROWS - 1) o.push(i + 8);
  if (c > 0) o.push(i - 1);
  if (c < COLS - 1) o.push(i + 1);
  return o;
}

function legalMoves(s, R) {
  if (s.winner !== null) return [];
  const me = s.sides[s.turn], out = [];
  s.board.forEach((p, i) => {
    if (!p) return;
    if (!p.up) return out.push({ from: i, to: i });
    if (p.side !== me) return;
    const jumper = p.t === 'C' && R.cannonJumps;
    for (const j of nbrs(i)) {
      const q = s.board[j];
      if (!q || (!jumper && q.up && q.side !== me && canTake(p, q, R))) out.push({ from: i, to: j });
    }
    if (jumper)
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        let screen = false;
        for (let r = (i >> 3) + dr, c = (i & 7) + dc; r >= 0 && r < ROWS && c >= 0 && c < COLS; r += dr, c += dc) {
          const q = s.board[r * COLS + c];
          if (!q) continue;
          if (!screen) { screen = true; continue; }
          if (q.up && q.side !== me) out.push({ from: i, to: r * COLS + c });
          break;
        }
      }
  });
  return out;
}

// Applies a move without validating it. free=true: no turns, sides or winner; a "flip" toggles face-up/down.
function apply(s, m, R, free) {
  const p = s.board[m.from];
  if (m.from === m.to) {
    p.up = free ? !p.up : true;
    if (!free && !s.sides[0]) { s.sides[s.turn] = p.side; s.sides[1 - s.turn] = p.side === 'r' ? 'b' : 'r'; }
  } else {
    const q = s.board[m.to];
    if (q) {
      s.captured[q.side].push(q.t);
      if (!free && q.t === 'G' && R.endOnGeneral) s.winner = s.turn;
    }
    s.board[m.to] = p;
    s.board[m.from] = null;
  }
  if (free) return s;
  s.turn = 1 - s.turn;
  // The player to move with no legal moves loses.
  if (s.winner === null && !legalMoves(s, R).length) s.winner = 1 - s.turn;
  return s;
}
