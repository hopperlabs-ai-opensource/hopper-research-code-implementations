/** Original teaching workflow. Fixture answers are authored examples, not model measurements. */
export const departments = ["billing", "technical", "sales"];
export const scenarios = [
	{
		id: "invoice",
		title: "A clear billing request",
		state: "Please send the invoice for our September subscription.",
		answers: {
			department: {
				type: "choice",
				choice: "billing",
				confidence: 0.94,
				probabilities: { billing: 0.97, technical: 0.02, sales: 0.01 },
			},
			urgent: { type: "noul", noul: 0.08 },
		},
	},
	{
		id: "negation",
		title: "The keyword points the wrong way",
		state:
			"Login is working now. The remaining issue is that our card was charged twice.",
		answers: {
			department: {
				type: "choice",
				choice: "billing",
				confidence: 0.88,
				probabilities: { billing: 0.93, technical: 0.04, sales: 0.03 },
			},
			urgent: { type: "noul", noul: 0.6 },
		},
	},
	{
		id: "mixed",
		title: "Two problems, no clear owner",
		state:
			"Our export failed after changing the plan and we also see a duplicate charge. The team needs help today.",
		answers: {
			department: {
				type: "choice",
				choice: "technical",
				confidence: 0.24,
				probabilities: { billing: 0.45, technical: 0.5, sales: 0.05 },
			},
			urgent: { type: "noul", noul: 0.9 },
		},
	},
];
export function requestFor(state, model = "jev-latest") {
	if (typeof state !== "string" || !state.trim() || state.length > 8000)
		throw Error("Use a nonempty request of at most 8,000 characters.");
	if (typeof model !== "string" || !/^jev-[\w.-]{1,80}$/.test(model))
		throw Error("Choose a Jev model identifier.");
	return {
		model,
		state,
		questions: {
			department: {
				type: "choice",
				instructions:
					"Which team should own this request? Consider what is still unresolved, including negation.",
				criteria: {
					billing: "Charges, invoices and subscriptions",
					technical: "Software defects, sign-in and data failures",
					sales: "Questions about buying or upgrading",
				},
			},
			urgent: {
				type: "noul",
				instructions: "Does the unresolved issue need urgent attention?",
			},
		},
	};
}
export function ruleRoute(state) {
	requestFor(state);
	const text = state.toLowerCase();
	const rules = [
		["technical", /login|sign.in|export|error|bug/],
		["billing", /invoice|charg|payment|subscription/],
		["sales", /buy|pricing|upgrade/],
	];
	const found = rules.find(([, pattern]) => pattern.test(text));
	return {
		route: found?.[0] ?? "review",
		reason: found
			? `First matching keyword rule: ${found[0]}.`
			: "No rule matched; ask a person.",
		urgent: /urgent|today|immediate/.test(text),
	};
}
export function validateAnswers(answers) {
	const choice = answers?.department,
		urgent = answers?.urgent;
	const unit = (x) =>
		typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1;
	if (
		choice?.type !== "choice" ||
		!departments.includes(choice.choice) ||
		!unit(choice.confidence) ||
		urgent?.type !== "noul" ||
		!unit(urgent.noul)
	)
		throw Error("Invalid typed answers. No decision returned.");
	const probs = choice.probabilities;
	if (
		!probs ||
		Object.keys(probs).length !== departments.length ||
		!departments.every(
			(key) => Object.hasOwn(probs, key) && unit(probs[key]),
		) ||
		Math.abs(Object.values(probs).reduce((a, b) => a + b, 0) - 1) > 0.001
	)
		throw Error("Expected a normalized probability for each department.");
	return answers;
}
export function routeAnswers(
	answers,
	{ threshold = 0.8, urgencyThreshold = 0.75 } = {},
) {
	if (
		!Number.isFinite(threshold) ||
		threshold < 0 ||
		threshold > 1 ||
		!Number.isFinite(urgencyThreshold) ||
		urgencyThreshold < 0 ||
		urgencyThreshold > 1
	)
		throw Error("Thresholds must be between 0 and 1.");
	validateAnswers(answers);
	const { department, urgent } = answers;
	return {
		route: department.confidence >= threshold ? department.choice : "review",
		urgent: urgent.noul >= urgencyThreshold,
		confidence: department.confidence,
		reason:
			department.confidence >= threshold
				? "Confidence meets the selected routing threshold."
				: "Confidence is below the threshold; request human triage.",
		proposed: department.choice,
	};
}
export function parseStructuredAnswer(json) {
	if (typeof json !== "string" || json.length > 16000)
		throw Error("Keep the JSON answer under 16,000 characters.");
	const parsed = JSON.parse(json);
	return validateAnswers(parsed);
}
export function compareRouting(state, answers, threshold = 0.8) {
	const rules = ruleRoute(state);
	// Apply exactly the same policy to both structured-answer paths. This is not a model benchmark.
	const structured = routeAnswers(
		parseStructuredAnswer(JSON.stringify(answers)),
		{ threshold },
	);
	const typed = routeAnswers(answers, { threshold });
	return { rules, structured, typed };
}
