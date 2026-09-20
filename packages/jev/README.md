# Jev · typed decisions and routing policy

This original educational package studies the public TypeSafe interface, not
Jev's proprietary architecture or training implementation.

## Run offline

`node packages/jev/cli.mjs mixed` (also `invoice`, `negation`).
`npm run build` then open `dist/jev.html` for the interactive comparison.
All responses are **authored fixtures**, not recorded provider output. Both the
general-model JSON and Jev-shaped paths use the same values and policy. This
isolates interface/control-flow differences and makes no quality ranking.

## Run the real API

Save a TypeSafe API key in an absolute private regular file (`chmod 600`).
Save the request in `ticket.txt`, then:

```sh
TYPESAFE_API_KEY_FILE=/absolute/path/to/key.txt node packages/jev/cli.mjs --live ticket.txt
```

Uses your account and may incur TypeSafe usage charges. No key is embedded in the
browser. Optional `TYPESAFE_MODEL` selects an explicit Jev model; default
`jev-latest` may change. The CLI only returns a proposed route; it sends no ticket
and causes no downstream assignment. Network use is opt-in via `--live`.

Source: https://docs.typesafe.ai/introduction/quickstart
Choice: https://docs.typesafe.ai/primitives/choice
Confidence: https://docs.typesafe.ai/confidence
Reviewed 2026-09-20. Contract tests use a stub; live API behavior is unqualified.

Confidence is a provider-supplied statistic, not automatically an empirical
probability of correctness. Noul has no confidence field. This example checks
shape, bounds and probability sums; thresholds require validation on your data.
The fixture probabilities/confidence are illustrative, not an implementation of
TypeSafe's undisclosed confidence computation. Vendor speed, cost and calibration
claims are not independently reproduced here.
