import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {localSupportClient} from './local-support-client.mjs';
import {sampleTickets} from './support-workflow.mjs';
test('local client confines execution to Hopper and never sends expected labels',async()=>{
 const calls=[],digest='a'.repeat(64);
 const server=createServer(async(req,res)=>{
  let body='';for await(const part of req)body+=part;
  calls.push({path:req.url,body:body?JSON.parse(body):undefined});res.setHeader('content-type','application/json');
  if(req.url==='/local-api/programs')res.end(JSON.stringify({programs:[{id:'support/triage/v1',versionDigest:digest,request:{model:'jev-latest',questions:{department:{type:'choice'}}}}]}));
  else res.end(JSON.stringify({status:'succeeded',result:{backend:'hopper',response:{model:'hopper-graph-local-v1',answers:{department:{choice:'billing'},urgency:{choice:'routine'}}},evidence:[{kind:'saved-support-program',versionDigest:digest}]}}));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const client=localSupportClient('http://127.0.0.1:'+server.address().port);
  assert.equal((await client.evaluate([sampleTickets[0]],{versionDigest:digest})).metrics.correct,1);
  const submitted=calls.find(c=>c.path==='/local-api/runs').body;
  assert.equal(submitted.backend,'hopper');assert.equal('expected' in submitted.request.state,false);
  const count=calls.length;await assert.rejects(()=>client.evaluate([sampleTickets[0]],{versionDigest:'b'.repeat(64)}),/changed/);assert.equal(calls.length,count+1);
 }finally{await new Promise(r=>server.close(r));}
});
test('local client refuses remote, credential-bearing and path-bearing origins',()=>{
 for(const origin of ['https://127.0.0.1:4418','http://example.com','http://user:pass@127.0.0.1:4418','http://127.0.0.1:4418/private','http://127.0.0.1:4418?x=1'])assert.throws(()=>localSupportClient(origin));
});
