# From an example to your problem

Start with `npm start`, then choose **Use attention**. Everything runs locally;
the JSON editor accepts data, never executable code. Open `dist/index.html`
directly when you want to use the demos without a server.

## Pick the mechanism

| Your question | Start here | Simpler baseline |
| --- | --- | --- |
| Which known person's current fact do I need? | `workflow.mjs`: learned query/key identity matching | Dictionary lookup |
| Which records overlap my request's features? | `recipes.mjs`: explicit features and attention weights | Category filter or dot-product ranking |
| How could several examples contribute to one value? | `recipes.mjs`: weighted numeric values | Simple average |
| Does this report agree with its current source? | Harness `workflow.mjs`: parse, select, independently verify | A filter plus assertions |

Attention adds a normalized distribution and a weighted combination. It does not
improve the ranking of its dot-product scores. If all you need is the top record,
ranking those scores is enough. Feature overlap is not semantic understanding.

## A runnable starting point

Save this as `try-attention.mjs` in the repository root. Run
`node try-attention.mjs`. Change the features and records to match your problem.

```js
import { runRecipe } from './packages/attention-is-all-you-need/recipes.mjs';

const data = {
  features: ['Account', 'Billing'],
  query: [0, 1],
  unit: 'minutes to read',
  records: [
    { label: 'Reset password', key: [1, 0], value: 3 },
    { label: 'Change payment method', key: [0, 1], value: 5 },
    { label: 'Account invoices', key: [0.5, 1], value: 4 },
  ],
};
const result = runRecipe(data, { temperature: 0.25 });
console.table(result.rows);
console.log(result.match, result.output, data.unit);
```

`match` is the highest-weight record (or `No single match` for a tie).
`output` is the weighted sum of numeric values, not the top record's value.
`noSignal` identifies zero dot-product overlap. Even when there is no signal,
softmax produces weights; do not interpret their existence as a useful match.
The UI's generated starter includes your edited data, request, and temperature.

Use 1–8 distinct feature names and 1–12 distinct records. Every query and key
must have one number per feature, from 0 to 1. Values must be finite numbers from
0 to 10,000 in a shared unit. These are small educational bounds.

## Four experiments worth doing

1. Change only the query. Does the right record gain weight?
2. Change only a value. The weights should stay the same; the blend should move.
3. Reorder records. The contributions should follow their records.
4. Set every query feature to zero. You should get equal weights and an average.

For a real estimate, compare held-out outcomes against your simple baseline.
Manually chosen features can bias results, and records with more active features
can get larger scores. Temperature changes concentration, not ranking; it cannot
repair poor features. Attention weights are not calibrated confidence intervals.
The project examples use fictional data and do not establish predictive accuracy.

## Adapt the verification workflow

You can already run `node packages/code-as-agent-harness/cli.mjs tickets.csv`
with the documented ticket columns. For a different job:

1. Define the source schema and reject ambiguous records in `parseTickets`.
2. Define current state and conflict handling in `latestTickets`.
3. Change the selection policy in `releaseReport`.
4. Independently update `verifyReport` to check identity, current source,
   eligibility, and completeness. Test missing and altered results.

Support escalations, inventory exceptions, and content review queues are possible
adaptations, not implemented parsers. The verifier checks agreement with supplied
source records; it cannot establish that the source itself is complete or true.

## Where to edit

- `packages/attention-is-all-you-need/index.mjs`: the attention math.
- `packages/attention-is-all-you-need/workflow.mjs`: the tiny trained lookup.
- `packages/attention-is-all-you-need/recipes.mjs`: feature-based examples.
- `packages/*/demo.mjs` and `demo.html`: browser walkthroughs.
- `packages/attention-is-all-you-need/recipes-demo.*`: the adaptation lab.
- `scripts/index.html` and `scripts/demo.css`: the index and shared styles.

Run `npm run check` after editing source. Generated `dist` files and their digest
manifest are distributable artifacts; rebuild them rather than editing them.
