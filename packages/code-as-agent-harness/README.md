# Code as Agent Harness · a verified release report

A concrete example inspired by the survey's execution/artifact/verification patterns:
turn an issue export into a report that can be checked against its source.

## Try it

From the repository root, run `npm run check`, then open
`dist/code-as-agent-harness.html`. Edit the CSV, resolve a blocker, or introduce
conflicting updates. Step through the actual code and artifacts.

```sh
node packages/code-as-agent-harness/cli.mjs
node packages/code-as-agent-harness/cli.mjs tickets.csv
```

The second command reads your export. Required columns:
`id,title,status,priority,updated`. Dates use YYYY-MM-DD; statuses are open,
in progress, reopened, closed, or resolved; priorities P0–P3. Quoted CSV fields
are supported. Maximum 500 records / 100,000 characters. There are no uploads.

## Reuse

```js
import { releaseReport } from './workflow.mjs';
const { report, checks, trace } = releaseReport(csv, { priorities: ['P0', 'P1'] });
```

Latest date per issue wins. Conflicting records on the same date fail closed.
Unresolved means not closed or resolved. Results preserve source-record numbers;
the verifier checks source equality, uniqueness, policy and completeness.
The quick draft intentionally filters priority alone; the same verifier rejects it.

## Where an agent fits

A model could select or compose these tools, explain a failed check, or request
missing evidence. This browser example runs the tools deterministically. It does
not call a model or run arbitrary generated code. Do not present it as a live AI
agent. A production harness needs process isolation, permissions, bounded retries,
durable artifacts and independent business rules. These checks do not establish
that a source export is complete or a release is safe.

The smaller sorting/repair kernel remains in `index.mjs` for comparison and tests;
`workflow.mjs` is the public walkthrough. Paper:
https://arxiv.org/abs/2605.18747v1 (a survey, not a benchmark to reproduce).
Original example code: MIT.
