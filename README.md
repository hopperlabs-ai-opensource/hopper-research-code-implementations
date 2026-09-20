# Hopper research code implementations

Practical, inspectable walkthroughs paired with Hopper Research pages.
Original MIT-licensed educational code. Paper copyright remains with its authors.
No dependencies, model account, API key or installation step is required.

## Run

Requires Node.js 22+ (or Bun). From this repository:

```sh
npm start
```

Open **http://127.0.0.1:4173** for the visual index. No `npm install` is needed.
`npm start` builds the demos and serves only their HTML on loopback. Stop with
Ctrl+C; use `PORT=4174 npm start` if the default port is busy.

Or open **dist/index.html** directly: all four pages work offline. Run
`npm run check` to execute the tests and rebuild the distributable artifacts.

## A short path through the ideas

1. **Understand attention:** change a delivery date, compare trained/untrained/
   equal attention, and inspect a heatmap of every current query and record.
2. **Use attention:** find a help article or blend project estimates with visible
   feature sliders. Edit the JSON and copy a runnable JavaScript starter.
3. **Verify a result:** change a ticket export and watch independent checks catch
   stale records, missing items, and conflicts.

Read [Adapt an example](docs/adapt-an-example.md) for small starting points,
when a simpler baseline is enough, and where to edit the code.

## Packages

- [Attention Is All You Need](packages/attention-is-all-you-need): scaled dot-product
  attention, causal masking, multi-head concatenation and sinusoidal positions;
  includes two practical examples with explicit features.
- [Code as Agent Harness](packages/code-as-agent-harness): bounded execution,
  independent verification and a visible repair loop.

The attention walkthrough trains query/key embeddings and retrieves changing facts.
The adaptation lab uses hand-authored features to make scores and contributions
visible; it does not train a model or understand natural language.
The harness turns editable ticket CSV into a verified release-blocker report.
These are not a full Transformer, benchmark reproductions or a production agent
runtime. The report workflow runs deterministic tools, not an LLM.

## Reuse

Import a package's `workflow.mjs` (walkthrough) or `index.mjs` (core) from JavaScript (Node, Bun, or a browser module).
Each package documents its API, scope and source paper. Tests include mathematical
oracles, masking, malformed inputs and failed verification with exhausted retries.

`npm run build` makes self-contained HTML artifacts with SHA-256 content security
policies and a versioned manifest. Consumers vendor these exact artifacts rather
than importing from a sibling working tree. Verify their digests before serving.
No hosted CI workflows are installed; checks run locally.

### More runnable comparisons

- `dist/harness-migration.html`: compare a quick configuration patch with an
  explicit migration and independent invariant checks.
- `dist/jev.html`: compare keyword rules, validated structured JSON and typed
  answers on identical authored response fixtures. Adjust the review threshold.
  See `packages/jev/README.md` for the Node client using TypeSafe's documented API.
  Offline examples are not model benchmarks; live API access has not been qualified.

All browser examples work without network access. `?embed=1` hides the standalone
navigation and introductory hero when an enclosing page supplies that context.
The same source, controls, computations and validation run in either presentation.
