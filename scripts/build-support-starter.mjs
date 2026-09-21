import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
export async function supportStarter(){
  const parts=await Promise.all(['support-workflow.mjs','local-support-client.mjs','support-cli.mjs'].map(name=>readFile(resolve(root,'packages/jev',name),'utf8')));
  return '#!/usr/bin/env node\n// Hopper support starter — original MIT-licensed source. Node 22+.\n// Edit prepareSupportState, keep evaluation labels separate, compare frozen cases.\n'+parts.map(part=>part.replace(/^#![^\n]*\n/,'').replace(/import\s*\{[^}]+\}\s*from\s*["']\.\/(?:support-workflow|local-support-client)\.mjs["'];?\n?/g,'').replace(/new URL\(["']\.\/support-workflow\.mjs["'],\s*import\.meta\.url\)/g,'new URL(import.meta.url)')).join('\n');
}
if(process.argv[1]===import.meta.filename){await mkdir(resolve(root,'dist'),{recursive:true});await writeFile(resolve(root,'dist/support-starter.mjs'),await supportStarter());}
