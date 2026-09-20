# Hopper research code implementations

Practical, inspectable walkthroughs paired with Hopper Research pages.
Original MIT-licensed educational code. Paper copyright remains with its authors.
No dependencies, model account, API key or installation step is required.

## Run

Requires Node.js 22+ (or Bun). From this repository:

```sh
npm run check
```

Open either generated `dist/*.html` file in your browser. Both run offline.
Each demo supports previous/next steps and inspection of actual computed values.

## Packages

- [Attention Is All You Need](packages/attention-is-all-you-need): scaled dot-product
  attention, causal masking, multi-head concatenation and sinusoidal positions.
- [Code as Agent Harness](packages/code-as-agent-harness): bounded execution,
  independent verification and a visible repair loop.

The attention walkthrough trains query/key embeddings and retrieves changing facts.
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
