#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {localSupportClient} from './local-support-client.mjs';
import {sampleTickets,compareReports,readReport} from './support-workflow.mjs';
export async function supportMain(args=process.argv.slice(2)) {
  const option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
  if(args.includes('--sample'))return sampleTickets;
  else if(args.includes('--compare')){
    const i=args.indexOf('--compare');
    return compareReports(readReport(JSON.parse(readFileSync(args[i+1],'utf8'))),readReport(JSON.parse(readFileSync(args[i+2],'utf8'))));
  }else if(option('--input')&&option('--output')){
    if(existsSync(option('--output')))throw Error('Output already exists. Choose a new filename to preserve the baseline.');
    const tickets=JSON.parse(readFileSync(option('--input'),'utf8'));
    const report=await localSupportClient(option('--origin')).evaluate(tickets);
    report.provenance.adapterSha256=createHash('sha256').update(readFileSync(fileURLToPath(new URL('./support-workflow.mjs',import.meta.url)))).digest('hex');
    writeFileSync(option('--output'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    return {file:option('--output'),metrics:report.metrics};
  }else throw Error('Use --sample, --input tickets.json --output new-report.json [--origin http://127.0.0.1:4418], or --compare baseline.json candidate.json.');
}
if(process.argv[1]&&realpathSync(process.argv[1])===realpathSync(import.meta.filename)){
  try{process.stdout.write(JSON.stringify(await supportMain(),null,2)+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
