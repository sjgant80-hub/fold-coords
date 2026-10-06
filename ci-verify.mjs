// ci-verify.mjs — re-derive the sealed facts from the witnessed kernel on the runner and prove they
// match predictions.json exactly. predictions.json is committed before run.json; CI recomputes here.
import { organCoords, kappa, nearest, consensus, agreement, foldCoord } from './fold.mjs';
import { readFileSync } from 'node:fs';

const r = (x) => Math.round(x * 1e4) / 1e4;

export function derive() {
  const C = organCoords();
  const names = Object.keys(C).filter((n) => n !== 'crystal');
  const vecs = names.map((n) => C[n]);
  const nr = nearest(C['crystal'], vecs);
  const maxK = Math.max(...vecs.map((v) => kappa(C['crystal'], v)));
  const cl = [foldCoord([1, 0, 0]), foldCoord([0.9, 0.1, 0]), foldCoord([1, 0.1, 0])];
  const outlier = foldCoord([0, 0, 1]);
  return {
    verifyPair: r(kappa(C['witness'], C['octa-verify'])),
    memoryPair: r(kappa(C['crystal'], C['fall-remember'])),
    crossCapability: r(kappa(C['witness'], C['crystal'])),
    highdToMemory: r(kappa(C['highd-recall'], C['crystal'])),
    retrievalEqualsArgmaxCoupling: nr.score === maxK,
    consensusMemberAgreement: r(agreement(cl[0], cl)),
    consensusOutlierAgreement: r(agreement(outlier, cl)),
  };
}

// run as a script → verify against predictions.json (guarded so the browser can import derive())
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('ci-verify.mjs')) {
  const preds = JSON.parse(readFileSync(new URL('./predictions.json', import.meta.url), 'utf8'));
  const m = derive();
  let fail = 0;
  for (const [k, v] of Object.entries(preds.expected)) {
    if (m[k] !== v) { console.error(`MISMATCH ${k}: expected ${v}, got ${m[k]}`); fail++; }
  }
  const holds = (expr) => {
    const { verifyPair, memoryPair, crossCapability, highdToMemory, retrievalEqualsArgmaxCoupling, consensusMemberAgreement, consensusOutlierAgreement } = m;
    // eslint-disable-next-line no-eval
    try { return !!eval(expr); } catch { return false; }
  };
  for (const c of preds.claims) if (!holds(c.check)) { console.error(`CLAIM FAIL ${c.id}: ${c.check}`); fail++; }
  if (fail) { console.error(`\n${fail} mismatch(es) — the code no longer matches the sealed claims.`); process.exit(1); }
  console.log('✓ re-derived facts match predictions.json exactly; all', preds.claims.length, 'claims hold.');
  console.log(JSON.stringify(m));
}
