import { trainLookup, lookupDelivery, deliverySample } from './workflow.mjs';
const model = trainLookup();
console.log(JSON.stringify({ training: model.history, result: lookupDelivery(model, deliverySample, 'Mira') }, null, 2));
