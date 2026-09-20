import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes, runRecipe } from './recipes.mjs';

test('recipe scalar scores, weights, and contributions agree with an analytical oracle', () => {
  const data = { features: ['topic'], query: [1], unit: 'minutes', records: [
    { label: 'A', key: [0], value: 2 }, { label: 'B', key: [1], value: 8 },
  ] };
  const result = runRecipe(data, { temperature: 1 });
  const p = Math.E / (1 + Math.E);
  assert.equal(result.match, 'B');
  assert.ok(Math.abs(result.output - (2 * (1 - p) + 8 * p)) < 1e-12);
  assert.ok(Math.abs(result.rows[1].contribution - 8 * p) < 1e-12);
});
test('both practical examples respond to changed queries and preserve results on reordering', () => {
  for (const recipe of recipes) {
    const original = runRecipe(recipe);
    const reversed = runRecipe({ ...recipe, records: [...recipe.records].reverse() });
    assert.equal(original.match, reversed.match);
    assert.ok(Math.abs(original.output - reversed.output) < 1e-12);
    const changed = runRecipe({ ...recipe, query: recipe.query.map((x) => 1 - x) });
    assert.notEqual(original.match, changed.match);
  }
});
test('zero overlap exposes missing signal, ties, and the simple average', () => {
  const data = { ...recipes[0], query: [0, 0, 0] };
  const result = runRecipe(data);
  assert.equal(result.match, 'No single match');
  assert.equal(result.noSignal, true);
  assert.equal(result.output, 5);
  assert.deepEqual(result.rows.map(r => r.weight), [0.25, 0.25, 0.25, 0.25]);
});
test('temperature changes concentration and changed values change the blend, not the weights', () => {
  const cold = runRecipe(recipes[0], { temperature: 0.05 });
  const warm = runRecipe(recipes[0], { temperature: 2 });
  assert.equal(cold.match, warm.match);
  assert.ok(cold.rows[0].weight > warm.rows[0].weight);
  const data = structuredClone(recipes[0]); data.records[0].value += 10;
  const changed = runRecipe(data, { temperature: 0.05 });
  assert.deepEqual(changed.rows.map(r => r.weight), cold.rows.map(r => r.weight));
  assert.ok(Math.abs(changed.output - cold.output - cold.rows[0].weight * 10) < 1e-12);
});
test('custom data rejects malformed, sparse, ambiguous, oversized, and nonfinite inputs', () => {
  for (const patch of [
    { features: [] }, { features: ['x', 'x'] }, { features: Array(3) },
    { query: [1, 2, 0] }, { query: Array(3) }, { query: [1, NaN, 0] },
    { records: [null] }, { records: Array(4) }, { records: Array(13).fill(recipes[0].records[0]) },
    { records: [recipes[0].records[0], recipes[0].records[0]] },
    { records: [{ label: 'A', key: [1, 0, 0], value: Infinity }] }, { unit: '' },
  ]) assert.throws(() => runRecipe({ ...recipes[0], ...patch }));
  assert.throws(() => runRecipe(null));
  assert.throws(() => runRecipe(recipes[0], { temperature: 0 }));
});
