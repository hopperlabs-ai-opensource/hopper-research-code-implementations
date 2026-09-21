# Jev · typed decisions and routing policy

This original educational package studies the public TypeSafe interface, not
Jev's proprietary architecture or training implementation.

## Use and adapt the local Hopper workflow

The optional support workflow calls the separately installed Hopper console on
`http://127.0.0.1:4418`. It explicitly selects Hopper's saved Support Triage v1
program; it never selects TypeSafe or trains a model. The saved program runs
without an encoder. The five offline labs still need only Node and no service.

From this source checkout:

```sh
node packages/jev/support-cli.mjs --sample > tickets.json
node packages/jev/support-cli.mjs --input tickets.json --output baseline.json
# Adapt prepareSupportState; develop against different cases.
npm run check
node packages/jev/support-cli.mjs --input tickets.json --output candidate.json
node packages/jev/support-cli.mjs --compare baseline.json candidate.json
```

On the local Research page, select **Try it out → Local support workflow**.
Connect explicitly, edit the sample tickets, and capture a baseline. Download the
starter, tickets and baseline; ask an agent to adapt the starter and import its
candidate report. The page recomputes metrics and refuses comparisons with changed
tickets, facts, order or expected labels. Imported execution provenance is not
independently verified. Cases and reports remain temporary in the page; the owner
console keeps its execution history.

**One-file option:** `npm run build` also produces `dist/support-starter.mjs`.
Copy that file anywhere and run the commands above using `node support-starter.mjs`
instead of `node packages/jev/support-cli.mjs`. It includes readable source, exports
the functions for Node tests, and needs no dependencies. The page downloads those
same bytes. The `v0.5.1` toolkit includes this support kit alongside the five
offline labs and their MCP tools.

`support-workflow.mjs` owns input validation, `prepareSupportState`, report metrics
and comparison. `local-support-client.mjs` is a narrow loopback HTTP client, not a
classifier. `support-cli.mjs` writes a new report without overwriting the baseline.
Run `node scripts/package-support-kit.mjs` to package the exact kit for a consumer;
the command does not publish it.

A useful adaptation is mapping your existing business signals into explicit
facts: an outage flag from a support integration becomes `currentOutage: true`.
Preserve explicit overrides and add negative development cases. Keep expected
labels out of requests. Fixed department/urgency categories belong to the engine's
versioned program; changing that policy requires the canonical rule owner, not a
renamed question or a confidence threshold. This is observation mapping, not
encoder-weight training. Compare mistakes, regressions and review counts on
untouched cases; agreement with four authored samples is not production accuracy.

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
