/** An executable teaching example, inspired by Ning et al. No LLM or eval. */
export function parseInput(text) {
  if (typeof text !== 'string' || text.length > 1024 || !text.trim()) throw new Error('Enter 1–64 comma-separated numbers');
  const parts = text.split(',');
  if (parts.length > 64 || parts.some(x => !x.trim() || !Number.isFinite(Number(x)) || Math.abs(Number(x)) > 1e6))
    throw new Error('Enter 1–64 finite numbers between -1000000 and 1000000');
  return parts.map(Number);
}
export function verify(input, output) {
  return Array.isArray(output) && output.every(Number.isFinite) &&
    output.length === new Set(input).size && new Set(output).size === output.length &&
    input.every(x => output.includes(x)) && output.every(x => input.includes(x)) &&
    output.every((x, i) => i === 0 || output[i - 1] < x);
}
export function runHarness(text, { injectBug = true, repairBudget = 1 } = {}) {
  if (![0, 1].includes(repairBudget)) throw new Error('Repair budget must be 0 or 1');
  const input = parseInput(text), events = [];
  const record = (phase, detail, output = null) => events.push({ step: events.length + 1, phase, detail, output: output === null ? null : [...output] });
  record('Plan', 'Return every distinct input number exactly once, in ascending numeric order.');
  record('Execute', injectBug ? 'Candidate: unique(input.filter(Boolean)).sort(numeric). The truthiness filter loses zero.' : 'Candidate: unique(input).sort(numeric).');
  let output = [...new Set(injectBug ? input.filter(Boolean) : input)].sort((a, b) => a - b);
  record('Observe', 'Store the candidate output as an inspectable artifact.', output);
  let passed = verify(input, output);
  record('Verify', passed ? 'PASS: membership, uniqueness, completeness and order hold.' : 'FAIL: output does not preserve every distinct input value.', output);
  if (!passed && repairBudget > 0) {
    record('Repair', 'Bounded repair: remove the truthiness filter. Retain zero.');
    output = [...new Set(input)].sort((a, b) => a - b);
    passed = verify(input, output);
    record('Verify', passed ? 'PASS after repair.' : 'FAIL after repair.', output);
  }
  record(passed ? 'Done' : 'Stopped', passed ? 'Return the verified result.' : 'No verified result; repair budget exhausted.', output);
  return { input, output, passed, events };
}
