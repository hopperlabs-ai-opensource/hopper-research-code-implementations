import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attention, multiHeadAttention, positionalEncoding } from './index.mjs';
test('uniform logits average values exactly', () => {
 const r = attention([[0,0]], [[1,0],[0,1]], [[2,4],[6,8]]);
 assert.deepEqual(r.weights, [[0.5,0.5]]); assert.deepEqual(r.output, [[4,6]]);
});
test('known scalar logits agree with independent analytical softmax', () => {
 const r = attention([[1]], [[0],[1]], [[2],[8]]);
 const p = Math.E/(1+Math.E); assert.ok(Math.abs(r.output[0][0]-(2*(1-p)+8*p))<1e-12);
});
test('causal mask has zero future weight and stable large logits', () => {
 const r=attention([[1e6],[1e6]],[[1e6],[1e6]],[[3],[9]],{causal:true});
 assert.deepEqual(r.weights,[[1,0],[0.5,0.5]]); assert.deepEqual(r.output,[[3],[6]]);
});
test('permutation of paired keys and values preserves unmasked result', () => {
 assert.deepEqual(attention([[2]],[[1],[3]],[[4],[8]]).output, attention([[2]],[[3],[1]],[[8],[4]]).output);
});
test('multi-head concatenation and positions', () => {
 const h={Q:[[0]],K:[[0]],V:[[7]]}; assert.deepEqual(multiHeadAttention([h,h]).concatenated,[[7,7]]);
 assert.deepEqual(positionalEncoding(1,4),[[0,1,0,1]]);
});
test('invalid and oversized inputs fail closed', () => {
 for(const Q of [[],[[NaN]],[[1],[1,2]],Array.from({length:129},()=>[1])]) assert.throws(()=>attention(Q,[[1]],[[1]]));
 assert.throws(()=>attention([[1]],[[1,2]],[[1]]));
 assert.throws(()=>attention([[1]],[[1]],[[1]],{temperature:0}));
});
