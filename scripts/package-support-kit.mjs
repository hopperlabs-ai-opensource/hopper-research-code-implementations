import {mkdtemp,copyFile,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {supportStarter} from './build-support-starter.mjs';
const root=resolve(import.meta.dirname,'..'),directory=await mkdtemp(join(tmpdir(),'support-kit-'));
try {
 const files=['support-workflow.mjs','support-workflow.d.mts','local-support-client.mjs','local-support-client.d.mts'];
 for(const file of files)await copyFile(resolve(root,'packages/jev',file),join(directory,file));
 await writeFile(join(directory,'support-starter.mjs'),await supportStarter());
 await copyFile(resolve(root,'LICENSE'),join(directory,'LICENSE'));
 await writeFile(join(directory,'package.json'),JSON.stringify({name:'@hopper/research-support-kit',version:'0.1.0',type:'module',license:'MIT',files:['*.mjs','*.mts','LICENSE']}));
 await mkdir(resolve(root,'dist'),{recursive:true});
 const [packed]=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',resolve(root,'dist')],{cwd:directory,encoding:'utf8'}));
 const bytes=await readFile(resolve(root,'dist',packed.filename));
 console.log(JSON.stringify({artifact:packed.filename,sha256:createHash('sha256').update(bytes).digest('hex'),state:'unpublished-local-candidate'}));
} finally {await rm(directory,{recursive:true,force:true});}
