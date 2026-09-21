import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTickets,prepareSupportState,validateTickets,makeReport,compareReports,readReport} from './support-workflow.mjs';
test('support evaluation shows regressions, mistakes and review on exactly the same labels',()=>{
 const tickets=sampleTickets.slice(0,2),good=tickets.map(t=>({id:t.id,...t.expected}));
 const before=makeReport(tickets,[good[0],{id:'incident',department:'billing',urgency:'routine'}]);
 const after=makeReport(tickets,[{id:'invoice',department:'needs_review',urgency:'needs_review'},good[1]]);
 const comparison=compareReports(before,after);
 assert.deepEqual(comparison.improvements,['incident']);assert.deepEqual(comparison.regressions,['invoice']);assert.equal(comparison.candidate.review,1);assert.equal(comparison.candidate.mistakes,1);
 assert.equal(readReport({...after,metrics:{correct:900}}).metrics.correct,1);
 const changed=structuredClone(after);changed.tickets[0].expected.department='sales';assert.throws(()=>compareReports(before,changed),/exact same/);
});
test('bounded tickets reject duplicate IDs, unsupported facts and label leakage',()=>{
 assert.throws(()=>validateTickets([...sampleTickets,sampleTickets[0]]),/unique/);
 assert.throws(()=>validateTickets([{...sampleTickets[0],facts:{secret:true}}]),/Facts/);
 assert.throws(()=>validateTickets(Array(21).fill(sampleTickets[0])),/1–20/);
 assert.deepEqual(Object.keys(prepareSupportState(sampleTickets[0])),['schema','message','facts']);
 assert.throws(()=>makeReport(sampleTickets,[]),/one result/);
});
