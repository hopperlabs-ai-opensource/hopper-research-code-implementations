# attention-is-all-you-need

Source paper: https://arxiv.org/abs/1706.03762v7

```js
import { attention, multiHeadAttention, positionalEncoding } from './index.mjs';
console.log(attention([[0, 0]], [[1, 0], [0, 1]], [[2, 4], [6, 8]]));
// output: [[4, 6]]; weights: [[0.5, 0.5]]
console.log(positionalEncoding(3, 4));
```

Run tests from the repository root with `npm test`. Open the corresponding
`dist/attention-is-all-you-need.html` for the browser demo. Original implementation under MIT.

Q and K must have the same feature width; K and V must have equal row counts.
Matrices are finite, rectangular and bounded to 128×128. Causal mode requires
matching Q/K row counts. Temperature defaults to 1; other values are an extra
teaching control. Multi-head input is already projected Q/K/V, and the returned
concatenation omits learned output projection. No tokenizer, training, encoder/
decoder stack, learned weights or paper-quality translation is claimed.
At temperature 1, the kernel implements section 3.2.1, equation (1).
