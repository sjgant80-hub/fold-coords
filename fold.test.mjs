import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  foldCoord, kappa, nearest, consensus, agreement, isOutlier,
  CAPS, ORGAN_SIGNATURES, organCoords,
} from './fold.mjs';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test('foldCoord: L2-normalises; zero/garbage → safe, never throws', () => {
  const v = foldCoord([3, 4]);
  assert.ok(close(Math.hypot(...v), 1));           // unit length
  assert.deepEqual(foldCoord([0, 0]), [0, 0]);     // zero stays zero (no invented direction)
  assert.deepEqual(foldCoord([]), []);
  for (const g of [null, undefined, 5, 'x', {}]) assert.deepEqual(foldCoord(g), []);
  assert.ok(foldCoord(['a', 2, NaN, 2]).every(Number.isFinite)); // garbage entries → finite
});

test('kappa: self=1, symmetric, bounded, orthogonal=0, zero=0', () => {
  const a = foldCoord([1, 2, 3]), b = foldCoord([3, 2, 1]);
  assert.ok(close(kappa(a, a), 1));                // self-coupling is max
  assert.ok(close(kappa(a, b), kappa(b, a)));      // symmetric
  assert.ok(kappa(a, b) >= -1 && kappa(a, b) <= 1);
  assert.ok(close(kappa(foldCoord([1, 0]), foldCoord([0, 1])), 0)); // orthogonal
  assert.equal(kappa([0, 0], [1, 1]), 0);          // zero vector → 0, not NaN
  for (const g of [null, 5, 'x']) assert.equal(kappa(g, [1]), 0);
});

test('kappa: an unshared tail cannot fake a perfect score', () => {
  // prefix identical, but b carries extra magnitude → not perfectly coupled
  assert.ok(kappa([1, 0], [1, 0, 5]) < 0.9999);
});

test('UNIFICATION: retrieval == argmax coupling (the same metric)', () => {
  const q = foldCoord([1, 2, 3]);
  const items = [foldCoord([1, 0, 0]), foldCoord([0, 2, 3]), foldCoord([1, 2, 3])];
  const nr = nearest(q, items);
  const scores = items.map((it) => kappa(q, it));
  const max = Math.max(...scores);
  assert.ok(close(nr.score, max));                 // retrieval's score IS the max coupling
  assert.equal(nr.index, scores.indexOf(max));     // and it points at that item
  assert.deepEqual(nearest(q, []), { index: -1, score: 0 });
});

test('CONSENSUS: the resonant region; a cluster agrees, an outlier does not', () => {
  const cluster = [foldCoord([1, 0, 0]), foldCoord([0.9, 0.1, 0]), foldCoord([1, 0.1, 0])];
  const outlier = foldCoord([0, 0, 1]);
  const c = consensus(cluster);
  assert.ok(close(Math.hypot(...c), 1));           // consensus is itself a unit coordinate
  for (const m of cluster) assert.ok(agreement(m, cluster) > 0.9);   // members agree strongly
  assert.ok(agreement(outlier, cluster) < 0.2);    // the outlier does not
  assert.equal(isOutlier(outlier, cluster), true);
  assert.equal(isOutlier(cluster[0], cluster), false);
  assert.deepEqual(consensus([]), []);
});

test('nearest: ties break to the LOWEST index, and a first-place item keeps its real score', () => {
  const q = foldCoord([1, 0]);
  const tie = nearest(q, [foldCoord([1, 0]), foldCoord([1, 0])]);  // both κ=1
  assert.equal(tie.index, 0);                     // lowest index, not last
  assert.ok(close(tie.score, 1));
  const first = nearest(q, [foldCoord([1, 0]), foldCoord([0, 1])]); // index 0 wins
  assert.equal(first.index, 0);
  assert.ok(close(first.score, 1));               // best===0 must NOT zero the score
  const neg = nearest(q, [foldCoord([-1, 0]), foldCoord([-1, 0.2])]); // all negative κ
  assert.ok(neg.index === 0 || neg.index === 1);  // a real item, never a phantom past-end
  assert.ok(neg.score < 0);
});

test('null/garbage inputs are handled, not thrown or mis-shortcircuited', () => {
  assert.deepEqual(nearest(foldCoord([1, 0]), null), { index: -1, score: 0 });
  assert.deepEqual(nearest(foldCoord([1, 0]), []), { index: -1, score: 0 });
  assert.deepEqual(consensus(null), []);
  assert.deepEqual(consensus([null, 'x', 5]), []);       // no array entries → []
  assert.deepEqual(consensus([[], []]), []);             // width 0 → []
  // a null entry among real points is skipped, not thrown, and does not change the length
  const c = consensus([foldCoord([1, 0, 0]), null, foldCoord([1, 0, 0])]);
  assert.equal(c.length, 3);
  assert.ok(close(Math.hypot(...c), 1));
});

test('isOutlier: the threshold is strict (< not <=) at exact equality', () => {
  const cl = [foldCoord([1, 0]), foldCoord([1, 0])];   // consensus is [1,0]
  const p = foldCoord([3, 4]);                          // κ([0.6,0.8],[1,0]) = 0.6 exactly
  assert.ok(close(agreement(p, cl), 0.6));
  assert.equal(isOutlier(p, cl, 0.6), false);           // 0.6 < 0.6 is false; a <= mutant would flip it
  assert.equal(isOutlier(p, cl, 0.61), true);
});

test('consensus length equals the point width (no off-by-one past the mean)', () => {
  assert.equal(consensus([foldCoord([1, 0, 0]), foldCoord([0, 1, 0])]).length, 3);
  assert.equal(consensus([foldCoord([1, 0, 0, 0])]).length, 4);
});

test('organ fold-coordinates: like-capability organs couple, unlike are orthogonal', () => {
  const C = organCoords();
  assert.equal(Object.keys(C).length, 16);
  assert.equal(CAPS.length, 8);
  // the four verify organs share a signature → κ = 1
  assert.ok(close(kappa(C['octa-verify'], C['witness']), 1));
  assert.ok(close(kappa(C['acg-assessor'], C['octa-verify']), 1));
  // the two pure-memory organs → κ = 1
  assert.ok(close(kappa(C['crystal'], C['fall-remember']), 1));
  // verify vs memory → orthogonal capabilities → κ = 0
  assert.ok(close(kappa(C['witness'], C['crystal']), 0));
  // highd-recall is half memory, half route → κ with pure memory = 1/√2
  assert.ok(close(kappa(C['highd-recall'], C['crystal']), 1 / Math.SQRT2));
  // retrieval in the organ space: nearest to crystal (excluding itself) is fall-remember or highd-recall
  const names = Object.keys(C).filter((n) => n !== 'crystal');
  const vecs = names.map((n) => C[n]);
  const nr = nearest(C['crystal'], vecs);
  assert.ok(['fall-remember', 'highd-recall', 'seed-library'].includes(names[nr.index]));
});
