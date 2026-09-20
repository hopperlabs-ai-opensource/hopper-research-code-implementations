# Attention Is All You Need · retrieve a changing fact

Train a tiny attention lookup and inspect how it answers from current context.
Change a delivery date without retraining; reorder records; compare learned,
untrained and equal attention. Each score, weight and value is computed locally.

## Try it

From the repository root, run `npm run check`, then open
`dist/attention-is-all-you-need.html`, or:

```sh
node packages/attention-is-all-you-need/cli.mjs
node packages/attention-is-all-you-need/cli.mjs --json
```

The default CLI explains the result and a changed-date experiment. `--json`
(or `--verbose`) prints the full training history and computed vectors.

Run `npm start` for the visual index, or open `dist/attention-recipes.html`
for two additional examples: finding a help article and blending project effort.
Those use editable, hand-authored features rather than learned identities.
See [Adapt an example](../../docs/adapt-an-example.md) for the `runRecipe` API,
a runnable starting point, and guidance on choosing a simpler baseline.

## Reuse

```js
import { trainLookup, lookupDelivery } from './workflow.mjs';
const model = trainLookup({ epochs: 800, seed: 42 });
const result = lookupDelivery(model, [
  { person: 'Mira', day: 'Thursday' },
  { person: 'Noah', day: 'Friday' },
], 'Mira');
console.log(result.answer, result.weights);
```

## What is actually learned

Two 6×8 embedding tables represent query and key identities. Full-batch gradient
descent minimizes cross-entropy for matching a query identity to its key among
six keys. Seeded initialization and 800 updates make training deterministic.
Delivery dates are never training labels: they are one-hot values at inference.
Scaled dot-product attention mixes those values. The highest output component
selects a day; ties return “No single answer”. Weights are contributions, not
calibrated confidence. Tests exercise new day assignments and record permutations.

Supported names: Mira, Noah, Lena, Omar, Eva, Jules. Supported values: weekdays.
Queries without a corresponding record fail rather than invent an answer.

This is a trained attention head over structured input, not natural-language
understanding or a full Transformer. Use ordinary code/database lookup for an
actual delivery schedule. The example makes query/key/value retrieval legible;
a Transformer learns richer token representations through many layers and heads.
The core `index.mjs` also provides causal masking, multi-head concatenation and
sinusoidal positions, with analytical tests. It does not reproduce translation
results. Paper: https://arxiv.org/abs/1706.03762v7, §3.2.1 / equation 1.
Original example code: MIT.

Run both recipe comparisons from the terminal:

```sh
node packages/attention-is-all-you-need/recipes-cli.mjs
```
