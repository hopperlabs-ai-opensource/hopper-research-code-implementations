const el = (id) => document.getElementById(id);
let selected = scenarios[0],
	answers = structuredClone(selected.answers);
el("scenario").replaceChildren(
	...scenarios.map((s) => {
		const option = document.createElement("option");
		option.value = s.id;
		option.textContent = s.title;
		return option;
	}),
);
function render() {
	const threshold = Number(el("threshold").value),
		r = compareRouting(selected.state, answers, threshold);
	el("threshold-value").textContent = threshold.toFixed(2);
	el("ticket").textContent = selected.state;
	el("results").replaceChildren(
		...[
			["Keyword rules", r.rules],
			["General model → structured JSON → policy", r.structured],
			["Jev-shaped typed answer → policy", r.typed],
		].map(([title, result]) => {
			const div = document.createElement("div");
			div.className = "ticket";
			const h = document.createElement("h3");
			h.textContent = title;
			const value = document.createElement("strong");
			value.className = "result";
			value.textContent =
				result.route === "review" ? "Human review" : result.route;
			const note = document.createElement("p");
			note.textContent = result.reason;
			div.append(h, value, note);
			return div;
		}),
	);
	el("probabilities").replaceChildren(
		...Object.entries(answers.department.probabilities).map(([name, value]) => {
			const label = document.createElement("label");
			label.textContent = `${name}: ${(value * 100).toFixed(0)}%`;
			const bar = document.createElement("progress");
			bar.max = 1;
			bar.value = value;
			label.append(bar);
			return label;
		}),
	);
	el("reason").textContent =
		`Fixture confidence ${answers.department.confidence.toFixed(2)}; policy threshold ${threshold.toFixed(2)}. ${r.typed.reason}${r.typed.urgent ? " Urgency is flagged independently." : ""}`;
	el("flow-result").textContent =
		r.typed.route === "review" ? "Review" : `Route: ${r.typed.route}`;
	el("code").textContent = routeAnswers.toString();
	el("request").textContent = JSON.stringify(
		requestFor(selected.state),
		null,
		2,
	);
}
function load() {
	selected = scenarios.find((s) => s.id === el("scenario").value);
	answers = structuredClone(selected.answers);
	el("fixture").value = JSON.stringify(answers, null, 2);
	el("error").textContent = "";
	render();
}
el("scenario").onchange = load;
el("threshold").oninput = render;
el("apply").onclick = () => {
	try {
		const next = parseStructuredAnswer(el("fixture").value);
		answers = next;
		el("error").textContent = "";
		render();
	} catch (error) {
		el("error").textContent =
			`Not applied: ${error.message} The last valid fixture remains active.`;
	}
};
load();

function labInspect() {
	return {
		input: {
			scenario: selected.id,
			answers: structuredClone(answers),
			threshold: Number(el("threshold").value),
		},
		output: compareRouting(
			selected.state,
			answers,
			Number(el("threshold").value),
		),
		fixture: true,
	};
}
function labRun(input) {
	const next = scenarios.find((s) => s.id === input.scenario);
	if (!next) throw Error("Unknown scenario");
	compareRouting(next.state, input.answers, input.threshold);
	selected = next;
	answers = structuredClone(input.answers);
	el("scenario").value = selected.id;
	el("threshold").value = input.threshold;
	el("fixture").value = JSON.stringify(answers, null, 2);
	render();
	return labInspect();
}
function labReset() {
	el("scenario").value = scenarios[0].id;
	el("threshold").value = 0.8;
	load();
	return labInspect();
}
