# fold-coords

**Live:** https://sjgant80-hub.github.io/fold-coords/

Hyper-geometry upgrade **#3**: every organ's fold-address becomes a point in a high-dimensional coordinate space, and three things the estate used to do with three mechanisms become the **same** operation — one similarity metric **κ** (cosine of the coordinates):

- **Coupling** — `κ(a, b)`, how strongly two fold-addresses bond.
- **Retrieval** — `nearest(query, items)`, provably **== argmax coupling** (the same metric).
- **Consensus** — the resonant region; `agreement(p, points)` flags an outlier as low κ.

The live page re-derives it all in your browser from the gated `fold.mjs`, with a self-check that refuses to show green if the page and the sealed claims disagree.

## Proof-of-play

- `fold.mjs` — one pure kernel. **10 unit tests**, **mutation gate CLEAN (score 1.0, 0 survivors, 0 baselines needed)**, **fuzz gate CLEAN** (never-throw boundary).
- **Sealed before measurement:** `predictions.json` (claims) committed before `run.json` (measured). `ci-verify.mjs` re-derives on GitHub's runner and fails on any drift.
- CI: `.github/workflows/ci.yml` (`proof-of-play`) runs tests + mutation + fuzz + the re-derive check.

## Measured on the 16 organs

| fact | value |
|---|---|
| verify-organs couple (octa-verify ↔ witness) | κ = 1 |
| memory-organs couple (crystal ↔ fall-remember) | κ = 1 |
| cross-capability (witness ↔ crystal) | κ = 0 |
| half-shared (highd-recall ↔ crystal) | κ = 0.7071 (1/√2) |
| retrieval == argmax coupling | **true** |
| consensus separation (member − outlier) | 0.9975 |

## Honest scope

The unification is proven over the organs' **declared** capability signatures (what each organ does). Wiring live, learned fold-addresses from every organ's running state is the next step — flagged, not claimed. The κ / geometry framing is private language; the buildable thing is the one cosine metric.

Built by **Kar · AI-Native Solutions** (sjgant80-hub).
