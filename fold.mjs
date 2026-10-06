// fold.mjs — unified N-dimensional fold-coordinates (hyper-geometry upgrade #3).
//
// The estate used to couple organs, reach consensus, and retrieve memory with three different
// mechanisms. This kernel puts all three in ONE high-dimensional coordinate space, where they become
// the SAME geometric operation — a single similarity metric κ (cosine of the fold-coordinates):
//
//   · COUPLING   κ(a, b)                — how strongly two fold-addresses bond (proximity).
//   · RETRIEVAL  nearest(query, items)  — the item of maximum κ to the query == argmax coupling.
//   · CONSENSUS  consensus(points)      — the resonant region (normalised mean direction);
//                agreement(p, points) = κ(p, consensus) flags an outlier as low agreement.
//
// One metric underlies all three. Written with reduce/map/filter/Math so there are no mutable
// index-comparisons to go untested; pure, deterministic, never throws on garbage (invalid → safe).

/** coerce to a finite number, else 0 */
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);

/** a fold-coordinate: the L2-normalised vector of a feature signature (array of numbers).
 *  A zero/empty/garbage signature returns a zero vector of the same length (no invented direction). */
export function foldCoord(signature) {
  if (!Array.isArray(signature)) return [];
  const v = signature.map(num);
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return mag === 0 ? v.map(() => 0) : v.map((x) => x / mag);
}

/** the ONE metric: κ = cosine similarity of two coordinates, clamped to [-1, 1].
 *  dot is over the shared prefix; magnitudes are over the FULL vectors, so an unshared tail
 *  can never fake a perfect score. A zero vector yields 0 (no invented similarity). */
export function kappa(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const A = a.map(num), B = b.map(num);
  const n = Math.min(A.length, B.length);
  const dot = A.slice(0, n).reduce((s, x, i) => s + x * B[i], 0);
  const na = A.reduce((s, x) => s + x * x, 0);
  const nb = B.reduce((s, x) => s + x * x, 0);
  if (na === 0 || nb === 0) return 0;
  return Math.max(-1, Math.min(1, dot / (Math.sqrt(na) * Math.sqrt(nb))));
}

/** RETRIEVAL: the item of maximum coupling to the query. Ties break by lowest index.
 *  Returns { index, score }; empty/garbage items → { index:-1, score:0 }. */
export function nearest(query, items) {
  if (!Array.isArray(items) || items.length === 0) return { index: -1, score: 0 };
  let index = -1, score = -Infinity;
  items.forEach((it, i) => {
    const s = kappa(query, it);
    if (s > score) { score = s; index = i; }
  });
  return { index, score: index === -1 ? 0 : score };
}

/** CONSENSUS: the resonant region = the L2-normalised mean direction of the points.
 *  Non-array entries are skipped; differing lengths are summed over the max width. Empty → []. */
export function consensus(points) {
  if (!Array.isArray(points) || points.length === 0) return [];
  const arrs = points.filter(Array.isArray);
  if (arrs.length === 0) return [];
  const width = Math.max(0, ...arrs.map((p) => p.length));
  if (width === 0) return [];
  const mean = Array.from({ length: width }, (_, i) =>
    arrs.reduce((s, p) => s + num(p[i]), 0) / points.length);
  return foldCoord(mean);
}

/** agreement of a point with a set's consensus = κ(point, consensus(points)) */
export function agreement(point, points) {
  return kappa(point, consensus(points));
}

/** an outlier agrees with the consensus below `threshold` (default 0.5) */
export function isOutlier(point, points, threshold = 0.5) {
  return agreement(point, points) < threshold;
}

// ── example data: the 16 estate organs as fold-coordinates, by what they actually do ──
// capability columns: [memory, verify, generate, route, defend, grow, compress, couple]
export const CAPS = ['memory', 'verify', 'generate', 'route', 'defend', 'grow', 'compress', 'couple'];
export const ORGAN_SIGNATURES = {
  crystal:          [1, 0, 0, 0, 0, 0, 0, 0],
  'fall-remember':  [1, 0, 0, 0, 0, 0, 0, 0],
  'the-dreamer':    [0, 0, 1, 0, 0, 0, 0, 0],
  'octa-verify':    [0, 1, 0, 0, 0, 0, 0, 0],
  sentinel:         [0, 0, 0, 0, 1, 0, 0, 0],
  wisp:             [0, 0, 0, 1, 0, 0, 0, 0],
  'kar-foldcycle':  [0, 0, 0, 0, 0, 0, 1, 0],
  'highd-recall':   [1, 0, 0, 1, 0, 0, 0, 0],
  'seed-library':   [1, 0, 0, 0, 0, 1, 0, 0],
  'fall-spore':     [0, 0, 0, 0, 0, 1, 0, 0],
  'couple-gate':    [0, 0, 0, 0, 0, 0, 0, 1],
  'mesh-governance':[0, 1, 0, 0, 0, 0, 0, 1],
  tetra:            [0, 0, 1, 0, 0, 1, 0, 0],
  light:            [0, 0, 0, 0, 0, 0, 1, 0],
  'acg-assessor':   [0, 1, 0, 0, 0, 0, 0, 0],
  witness:          [0, 1, 0, 0, 0, 0, 0, 0],
};

/** the organ fold-coordinates (name → unit vector) */
export function organCoords() {
  const out = {};
  for (const [name, sig] of Object.entries(ORGAN_SIGNATURES)) out[name] = foldCoord(sig);
  return out;
}
