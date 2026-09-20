import { trainLookup, lookupDelivery, deliverySample } from './workflow.mjs';
const args = process.argv.slice(2);
if (args.some(arg => !['--json', '--verbose', '--help'].includes(arg))) {
  console.error('Usage: node packages/attention-is-all-you-need/cli.mjs [--json | --verbose]');
  process.exitCode = 1;
} else if (args.includes('--help')) {
  console.log('Train a tiny query/key lookup and retrieve Mira’s current delivery day.\nUse --json (or --verbose) for all computed vectors, weights, and training history.');
} else {
  const model = trainLookup();
  const result = lookupDelivery(model, deliverySample, 'Mira');
  if (args.includes('--json') || args.includes('--verbose')) {
    console.log(JSON.stringify({ training: model.history, result }, null, 2));
  } else {
    console.log(`When is Mira’s delivery? ${result.answer}\nTraining loss: ${model.history[0].loss.toFixed(4)} → ${model.history.at(-1).loss.toFixed(5)} (${model.epochs} updates)\n`);
    console.table(deliverySample.map((record, i) => ({ ...record, attention: `${(result.weights[i] * 100).toFixed(2)}%` })));
    const changed = deliverySample.map(record => record.person === 'Mira' ? { ...record, day: 'Thursday' } : record);
    console.log(`Change Mira’s date, without retraining: ${lookupDelivery(model, changed, 'Mira').answer}\nEqual attention: ${lookupDelivery(model, deliverySample, 'Mira', { uniform: true }).answer}\n\nTry the visual experiments: npm start\nFull computed values: add --json`);
  }
}
