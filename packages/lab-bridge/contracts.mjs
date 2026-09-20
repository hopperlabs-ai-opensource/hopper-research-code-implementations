const object = (properties, required = Object.keys(properties)) => ({
	type: "object",
	properties,
	required,
	additionalProperties: false,
});
const number = (minimum, maximum) => ({ type: "number", minimum, maximum });
export const labContracts = {
	"attention-is-all-you-need": object({
		records: {
			type: "array",
			minItems: 1,
			maxItems: 6,
			items: object({
				person: { enum: ["Mira", "Noah", "Lena", "Omar", "Eva", "Jules"] },
				day: { enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
			}),
		},
		person: { enum: ["Mira", "Noah", "Lena", "Omar", "Eva", "Jules"] },
		mode: { enum: ["trained", "uniform", "untrained"] },
	}),
	"attention-recipes": object({
		data: object({
			features: {
				type: "array",
				minItems: 1,
				maxItems: 8,
				items: { type: "string", maxLength: 80 },
			},
			query: { type: "array", minItems: 1, maxItems: 8, items: number(0, 1) },
			unit: { type: "string", minLength: 1, maxLength: 80 },
			records: {
				type: "array",
				minItems: 1,
				maxItems: 12,
				items: object({
					label: { type: "string", maxLength: 80 },
					key: { type: "array", minItems: 1, maxItems: 8, items: number(0, 1) },
					value: number(0, 10000),
				}),
			},
		}),
		temperature: number(0.05, 2),
	}),
	"code-as-agent-harness": object({
		csv: { type: "string", minLength: 1, maxLength: 20000 },
		priorities: {
			type: "array",
			minItems: 1,
			maxItems: 2,
			uniqueItems: true,
			items: { enum: ["P0", "P1"] },
		},
	}),
	"harness-migration": object({
		config: object({
			version: { const: 1 },
			timeoutSeconds: number(0, 3600),
			retries: { type: "integer", minimum: 0, maximum: 10 },
			theme: { enum: ["light", "dark"] },
			projects: {
				type: "array",
				maxItems: 20,
				items: object({
					id: { type: "string", pattern: "^[a-z][a-z0-9-]{0,39}$" },
					timeoutSeconds: number(0, 3600),
				}),
			},
		}),
	}),
	jev: object({
		scenario: { enum: ["invoice", "negation", "mixed"] },
		threshold: number(0, 1),
		answers: object({
			department: object({
				type: { const: "choice" },
				choice: { enum: ["billing", "technical", "sales"] },
				confidence: number(0, 1),
				probabilities: object({
					billing: number(0, 1),
					technical: number(0, 1),
					sales: number(0, 1),
				}),
			}),
			urgent: object({ type: { const: "noul" }, noul: number(0, 1) }),
		}),
	}),
};
/** Small closed JSON-schema subset; semantic checks remain in each example's core. */
export function validateLabInput(schema, value) {
	if (schema.const !== undefined && value !== schema.const)
		throw Error("Unexpected constant");
	if (schema.enum && !schema.enum.includes(value))
		throw Error("Choose an advertised value");
	if (schema.type === "object") {
		if (!value || typeof value !== "object" || Array.isArray(value))
			throw Error("Expected an object");
		if (
			Object.keys(value).some((key) => !Object.hasOwn(schema.properties, key))
		)
			throw Error("Unknown input field");
		for (const key of schema.required ?? [])
			if (!Object.hasOwn(value, key))
				throw Error("Missing input field: " + key);
		for (const key of Object.keys(value))
			validateLabInput(schema.properties[key], value[key]);
	}
	if (schema.type === "array") {
		if (
			!Array.isArray(value) ||
			value.length < (schema.minItems ?? 0) ||
			value.length > schema.maxItems
		)
			throw Error("Array outside limits");
		for (const item of value) validateLabInput(schema.items, item);
		if (schema.uniqueItems && new Set(value).size !== value.length)
			throw Error("Duplicate input");
	}
	if (
		schema.type === "string" &&
		(typeof value !== "string" ||
			value.length < (schema.minLength ?? 0) ||
			value.length > schema.maxLength ||
			(schema.pattern && !new RegExp(schema.pattern).test(value)))
	)
		throw Error("String outside limits");
	if (
		["number", "integer"].includes(schema.type) &&
		(!Number.isFinite(value) ||
			value < schema.minimum ||
			value > schema.maximum ||
			(schema.type === "integer" && !Number.isInteger(value)))
	)
		throw Error("Number outside limits");
}
