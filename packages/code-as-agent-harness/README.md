# code-as-agent-harness

Source paper: https://arxiv.org/abs/2605.18747v1

```js
import { runHarness } from './index.mjs';
console.log(runHarness('3, 0, 2, 3, -1'));
console.log(runHarness('0, 1', { repairBudget: 0 })); // passed: false
```

Run tests from the repository root with `npm test`. Open the corresponding
`dist/code-as-agent-harness.html` for the browser demo. Original implementation under MIT.

The task is sorting distinct numeric values while preserving every input value.
The intentionally flawed candidate filters by truthiness and loses zero. The
verifier independently checks membership, completeness, uniqueness and order.
One optional repair removes the filter. A failed run never reports success.
`events` are immutable snapshots of the trace; the demo steps through them.
This deterministic example illustrates selected mechanisms from the survey;
it does not call an LLM, execute arbitrary source code or replicate a benchmark.
