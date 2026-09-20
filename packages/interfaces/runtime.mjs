import { labContracts, validateLabInput } from "../lab-bridge/contracts.mjs";
import {
	trainLookup,
	lookupDelivery,
	deliverySample,
} from "../attention-is-all-you-need/workflow.mjs";
import { recipes, runRecipe } from "../attention-is-all-you-need/recipes.mjs";
import {
	sampleTickets,
	releaseReport,
} from "../code-as-agent-harness/workflow.mjs";
import {
	sampleConfig,
	compareMigration,
} from "../code-as-agent-harness/migration.mjs";
import { scenarios, compareRouting } from "../jev/index.mjs";
let trained, untrained;
const titles = {
	"attention-is-all-you-need": "Find a changing fact",
	"attention-recipes": "Find help and estimate effort",
	"code-as-agent-harness": "Verify a release-blocker report",
	"harness-migration": "Check a configuration migration",
	jev: "Route a request with typed answers",
};
export function sampleInput(id) {
	const recipe = recipes[0];
	const samples = {
		"attention-is-all-you-need": {
			records: deliverySample,
			person: "Mira",
			mode: "trained",
		},
		"attention-recipes": {
			data: {
				features: recipe.features,
				query: recipe.query,
				unit: recipe.unit,
				records: recipe.records,
			},
			temperature: 0.25,
		},
		"code-as-agent-harness": { csv: sampleTickets, priorities: ["P0", "P1"] },
		"harness-migration": { config: sampleConfig },
		jev: { scenario: "invoice", answers: scenarios[0].answers, threshold: 0.8 },
	};
	if (!samples[id]) throw Error("Unknown example");
	return structuredClone(samples[id]);
}
export function runLab(id, input) {
	const schema = labContracts[id];
	if (!schema) throw Error("Unknown example");
	validateLabInput(schema, input);
	let output;
	switch (id) {
		case "attention-is-all-you-need": {
			const model =
				input.mode === "untrained"
					? (untrained ??= trainLookup({ epochs: 0 }))
					: (trained ??= trainLookup());
			output = lookupDelivery(model, input.records, input.person, {
				uniform: input.mode === "uniform",
			});
			break;
		}
		case "attention-recipes":
			output = runRecipe(input.data, { temperature: input.temperature });
			break;
		case "code-as-agent-harness": {
			const r = releaseReport(input.csv, { priorities: input.priorities });
			output = {
				report: r.report,
				checks: r.checks,
				draftChecks: r.draftChecks,
			};
			break;
		}
		case "harness-migration":
			output = compareMigration(input.config);
			break;
		case "jev":
			output = compareRouting(
				scenarios.find((s) => s.id === input.scenario).state,
				input.answers,
				input.threshold,
			);
			break;
	}
	return {
		input: structuredClone(input),
		output,
		...(id === "jev" ? { fixture: true } : {}),
	};
}
export function examples() {
	return Object.entries(labContracts).map(([id, inputSchema]) => ({
		id,
		title: titles[id],
		inputSchema,
		sample: sampleInput(id),
		browser: `${id}.html`,
		scope:
			id === "jev"
				? "Authored answer fixtures, no live provider"
				: "Fixed educational computation, no model API",
	}));
}
export function researchTools() {
	return [
		{
			name: "research_examples",
			description:
				"List runnable research examples, exact schemas, samples and boundaries.",
			inputSchema: {
				type: "object",
				properties: {},
				additionalProperties: false,
			},
			readOnly: true,
			run: examples,
		},
		...examples().map((e) => ({
			name: "research_" + e.id.replaceAll("-", "_"),
			description:
				e.title +
				". " +
				e.scope +
				". All inputs are explicit; no session data is retained.",
			inputSchema: e.inputSchema,
			readOnly: true,
			run: (input) => runLab(e.id, input),
		})),
	];
}
