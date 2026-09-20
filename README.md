# Hopper research code implementations

## Three ways to use it

Requires Node.js 22 or newer. The npm-installable packages are distributed from
this repository's pinned `v0.5.0` release; they are not npm-registry listings.
No API key, model download or hosted service is needed for the five offline labs.

**Use MCP with Codex**

```sh
codex mcp add hopper-research -- npx --yes --package=https://raw.githubusercontent.com/hopperlabs-ai-opensource/hopper-research-code-implementations/v0.5.0/release/hopper-research-code-implementations-0.5.0.tgz hopper-research mcp
```

Reload the client's MCP connection. Ask it to list the research examples, read a
schema, then run one with explicit inputs. Other MCP clients can launch the same
`npx` command using their STDIO configuration. `research://catalog` contains the
three explanations and source links; `research://examples` supplies exact input
schemas and sample data. Tools run the same core as the CLI and browser.

**Clone and run the source**

```sh
git clone --branch v0.5.0 --depth 1 https://github.com/hopperlabs-ai-opensource/hopper-research-code-implementations.git
cd hopper-research-code-implementations
npm run doctor
npm start
```

Open the printed loopback address. `npm run mcp` starts MCP from this checkout;
configure your client to launch `node /absolute/path/to/scripts/cli.mjs mcp`.
`npm run cli -- run jev --sample` returns JSON. Use `--input input.json` instead of
`--sample` for your own bounded input. `npm run check` verifies all cores, a real
MCP handshake, tool results and CLI parity. No dependency installation is required
for these commands; the local transport's protocol SDK is already bundled.

**Bind either installation to the website**

On the exact Research or Application page, enable agent control and select
**Connect this page → Prepare local connection**. Copy the generated Codex setup
or generic MCP configuration. It includes a fresh binding ticket. The browser may
ask for local-network permission; allow it for the connection you requested.
A local helper connects only to that page; no Hopper-hosted relay is involved.

Use `page_status`, then `page_describe` and `page_tools`; call a returned operation
through `page_call`. Research also runs independently without `--bind`. From a
clone, the copied `node scripts/cli.mjs mcp --bind ...` command has the same behavior.
The independent `hopper-browser-agent` package uses
`node vendor/browser-agent/dist/cli.mjs mcp --bind ...` from this clone.

Stop/reload/navigation invalidates the binding. Reconnect with a new generated
configuration. A previously delivered edit can finish; inspect before retrying.
The connector sources, license and rebuild instructions are included in
`vendor/browser-agent`. Product application source and entitlements remain
separate; this toolkit does not grant private application source access.


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

## A small codebase you can actually change

| Start with | Read | Run |
| --- | --- | --- |
| Attention math | `packages/attention-is-all-you-need/index.mjs` | `node packages/attention-is-all-you-need/cli.mjs` |
| Feature-based selection and blending | `packages/attention-is-all-you-need/recipes.mjs` | `node packages/attention-is-all-you-need/recipes-cli.mjs` |
| Artifact + independent check | `packages/code-as-agent-harness/workflow.mjs` | `node packages/code-as-agent-harness/cli.mjs` |
| Preserving meaning in a migration | `packages/code-as-agent-harness/migration.mjs` | `node packages/code-as-agent-harness/migration-cli.mjs` |
| Typed answers + application policy | `packages/jev/index.mjs` | `node packages/jev/cli.mjs mixed` |

The intended loop is: run a sample, read the small function, change one input,
predict the result, and run the tests. No framework or model download is needed.
`npm start` opens the standalone browser collection; `npm run check` tests the
math, data transformations, rejected inputs and browser artifact build. See
[adapt an example](docs/adapt-an-example.md) for a complete editable starting point.

### Browser agent contract

The Showcase playground and guided walkthrough bundle these same functions.
`packages/lab-bridge/contracts.mjs` defines a bounded run-input schema for each
lab. Those schemas are included in the generated artifact manifest. The bridge
accepts only `inspect`, `run`, and `reset` from its exact parent window with its
instance nonce. It rejects malformed data and never evaluates supplied code.
The parent owns visitor enablement, exact-page pairing and revocation.

Browser files remain dependency-free and offline. `?embed=1&mode=playground`
selects the compact workspace presentation; the calculation code is unchanged.
The build gates each HTML file at 128 KB raw / 24 KB gzip and records gzip/Brotli
sizes. Readable source is retained; compression does not replace source clarity.
