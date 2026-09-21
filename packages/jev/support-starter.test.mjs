import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {supportStarter} from '../../scripts/build-support-starter.mjs';
import {sampleTickets} from './support-workflow.mjs';
test('downloaded starter runs and can be imported outside the checkout with no dependencies',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'support-starter-'));
 try{
  const path=join(dir,'support-starter.mjs');await writeFile(path,await supportStarter());
  assert.deepEqual(JSON.parse(execFileSync(process.execPath,[path,'--sample'],{cwd:dir,encoding:'utf8'})),sampleTickets);
  const module=await import(pathToFileURL(path));assert.equal(typeof module.localSupportClient,'function');assert.equal('expected' in module.prepareSupportState(sampleTickets[0]),false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
