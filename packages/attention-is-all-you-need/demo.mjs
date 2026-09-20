const el = (id) => document.getElementById(id);
const trainedModel = trainLookup(),
	untrainedModel = trainLookup({ epochs: 0 });
let records = deliverySample.map((row) => ({ ...row })),
	mode = "trained",
	step = 0,
	computed;
el("person").replaceChildren(
	...people.map((person) => {
		const option = document.createElement("option");
		option.value = person;
		option.textContent = person;
		return option;
	}),
);
// This walkthrough uses three records; the underlying package supports all six identities.
for (const option of [...el("person").options])
	if (!records.some((row) => row.person === option.value)) option.remove();
el("lossBefore").textContent = trainedModel.history[0].loss.toFixed(3);
el("lossAfter").textContent = trainedModel.history.at(-1).loss.toFixed(3);
el("source").textContent =
	attention.toString() + "\n\n" + lookupDelivery.toString() + "\n\n" + trainLookup.toString();
el("history").textContent = JSON.stringify(trainedModel.history, null, 2);
function drawRecords() {
	el("records").replaceChildren(
		...records.map((row) => {
			const div = document.createElement("div");
			div.className = "record";
			const label = document.createElement("label");
			label.htmlFor = "day-" + row.person;
			label.textContent = row.person;
			const select = document.createElement("select");
			select.id = label.htmlFor;
			select.replaceChildren(
				...days.map((day) => {
					const option = document.createElement("option");
					option.value = day;
					option.textContent = day;
					option.selected = day === row.day;
					return option;
				}),
			);
			select.onchange = () => {
				row.day = select.value;
				render();
			};
			div.append(label, select);
			return div;
		}),
	);
}
function showStep() {
	const steps = [
		[
			"Represent the question",
			mode === "uniform" ? "Equal attention replaces the query with zeros. Every dot product is zero, so every record receives the same weight." : mode === "untrained" ? "The chosen person selects a random query vector. Keys are also random: no training updates have been applied." : "The chosen person selects a learned query vector. Each current record selects a learned key. Training adjusted these vectors so matching identities score well.",
			(mode === "uniform" ? "query = Q[person].map(() => 0)" : "query = Q[person]") + "\nkeys = records.map(record => K[record.person])",
			{ query: computed.query, keys: computed.keys },
		],
		[
			"Compare query with each key",
			"Dot products score compatibility. Dividing by the square root of the key dimension keeps the scale controlled. Record order changes the order of scores, not which person matches.",
			"scores = query · keysᵀ / sqrt(8)",
			records.map((row, i) => ({
				person: row.person,
				score: computed.scores[i],
			})),
		],
		[
			"Turn scores into contributions",
			"Softmax normalizes the scores. The learned mode concentrates on the relevant record. Equal attention blends unrelated facts; untrained vectors have not learned the matching rule.",
			"weights = softmax(scores)",
			records.map((row, i) => ({
				person: row.person,
				weight: computed.weights[i],
			})),
		],
		[
			"Retrieve today’s value",
			"Each day is a one-hot value vector. A weighted sum carries the selected record’s current day into the output. Changing that day changes the answer without retraining.",
			"output = weights · values\nanswer = day with largest output",
			days.map((day, i) => ({ day, value: computed.probabilities[i] })),
		],
	];
	const item = steps[step];
	el("phase").textContent = item[0];
	el("detail").textContent = item[1];
	el("code").textContent = item[2];
	el("artifact").textContent = JSON.stringify(
		item[3],
		(_, value) =>
			typeof value === "number" ? Math.round(value * 10000) / 10000 : value,
		2,
	);
	el("stepLabel").textContent = `${step + 1} of ${steps.length}`;
	el("previous").disabled = step === 0;
	el("next").disabled = step === steps.length - 1;
}
function render() {
	computed = lookupDelivery(
		mode === "untrained" ? untrainedModel : trainedModel,
		records,
		el("person").value,
		{ uniform: mode === "uniform" },
	);
	el("answer-title").textContent = `When is ${el("person").value}’s delivery?`;
	el("answer").textContent = computed.answer;
	el("explanation").textContent =
		mode === "trained"
			? "The answer is retrieved from the current record. Try changing its day."
			: mode === "uniform"
				? "Every record contributes equally. The question no longer selects the relevant fact."
				: "These random initial weights have not learned to match a question to its record. A plausible answer can be wrong.";
	el("weights").replaceChildren(
		...records.map((row, i) => {
			const tr = document.createElement("tr");
			for (const value of [row.person, row.day]) {
				const td = document.createElement("td");
				td.textContent = value;
				tr.append(td);
			}
			const td = document.createElement("td");
			td.textContent = (computed.weights[i] * 100).toFixed(1) + "%";
			const progress = document.createElement("progress");
			progress.max = 1;
			progress.value = computed.weights[i];
			progress.setAttribute("aria-label", row.person + " attention weight");
			td.append(progress);
			tr.append(td);
			return tr;
		}),
	);
	for (const id of ["trained", "uniform", "untrained"])
		el(id).setAttribute("aria-pressed", String(mode === id));
	drawHeatmap();
	showStep();
}
for (const id of ["trained", "uniform", "untrained"])
	el(id).onclick = () => {
		mode = id;
		render();
	};
el("person").onchange = render;
el("reorder").onclick = () => {
	records.push(records.shift());
	drawRecords();
	render();
};
el("reset").onclick = () => {
	records = deliverySample.map((row) => ({ ...row }));
	el("person").value = "Mira";
	mode = "trained";
	step = 0;
	drawRecords();
	render();
};
el("previous").onclick = () => {
	if (step > 0) {
		step--;
		showStep();
	}
};
el("next").onclick = () => {
	if (step < 3) {
		step++;
		showStep();
	}
};
drawRecords();
render();

function drawHeatmap() {
  const header = document.createElement("tr");
  for (const text of ["Question ↓ / Record →", ...records.map(r => r.person)]) {
    const th = document.createElement("th"); th.scope = "col"; th.textContent = text; header.append(th);
  }
  el("heatmap-head").replaceChildren(header);
  el("heatmap-body").replaceChildren(...records.map(row => {
    const tr = document.createElement("tr"); tr.dataset.selected = String(row.person === el("person").value);
    const th = document.createElement("th"); th.scope = "row"; th.textContent = row.person; tr.append(th);
    const result = lookupDelivery(mode === "untrained" ? untrainedModel : trainedModel, records, row.person, { uniform: mode === "uniform" });
    for (const weight of result.weights) {
      const td = document.createElement("td"); td.dataset.level = Math.min(5, Math.floor(weight * 6));
      td.textContent = (weight * 100).toFixed(1) + "%"; tr.append(td);
    }
    return tr;
  }));
}
