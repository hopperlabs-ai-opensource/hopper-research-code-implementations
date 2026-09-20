const el = (id) => document.getElementById(id);
let execution,
	step = 0;
el("csv").value = sampleTickets;
function checksInto(id, checks) {
	el(id).replaceChildren(
		...checks.map((check) => {
			const li = document.createElement("li");
			li.className = check.passed ? "pass" : "fail";
			li.textContent = `${check.passed ? "✓" : "×"} ${check.name}`;
			return li;
		}),
	);
}
function showStep() {
	const item = execution.trace[step];
	el("stepLabel").textContent = `${step + 1} of ${execution.trace.length}`;
	el("phase").textContent = item.title;
	el("detail").textContent = item.detail;
	el("code").textContent = item.code;
	el("artifact").textContent = JSON.stringify(item.artifact, null, 2);
	el("previous").disabled = step === 0;
	el("next").disabled = step === execution.trace.length - 1;
}
function run() {
	el("error").textContent = "";
	try {
		execution = releaseReport(el("csv").value, {
			priorities: el("priority").value.split(","),
		});
		step = 0;
		el("result").textContent =
			`${execution.report.length} unresolved ${execution.report.length === 1 ? "blocker" : "blockers"}`;
		el("report").replaceChildren(
			...execution.report.map((ticket) => {
				const div = document.createElement("div");
				div.className = "ticket";
				const title = document.createElement("strong");
				title.textContent = `${ticket.priority} · ${ticket.id} — ${ticket.title}`;
				const source = document.createElement("small");
				source.textContent = `${ticket.status.replace("_", " ")} · latest ${ticket.updated} · source record ${ticket.record}`;
				div.append(title, source);
				return div;
			}),
		);
		checksInto("checks", execution.checks);
		checksInto("draft-checks", execution.draftChecks);
		el("json").textContent = JSON.stringify(execution.report, null, 2);
		showStep();
	} catch (error) {
		el("error").textContent = error.message;
		el("result").textContent = "Report withheld";
		el("report").replaceChildren();
		el("checks").replaceChildren();
		el("draft-checks").replaceChildren();
		el("json").textContent = "No verified result.";
		el("phase").textContent = "Source needs attention";
		el("detail").textContent =
			"The harness stops instead of guessing which record is true. Fix the input and run again.";
		el("code").textContent = "";
		el("artifact").textContent = error.message;
		el("stepLabel").textContent = "Stopped";
		el("previous").disabled = true;
		el("next").disabled = true;
	}
}
el("run").onclick = run;
el("reset").onclick = () => {
	el("csv").value = sampleTickets;
	el("priority").value = "P0,P1";
	run();
};
el("resolve").onclick = () => {
	el("csv").value =
		sampleTickets + "\nAPP-104,Mobile save loses edits,resolved,P0,2026-09-18";
	run();
};
el("conflict").onclick = () => {
	el("csv").value =
		sampleTickets + "\nAPP-104,Mobile save loses edits,resolved,P0,2026-09-17";
	run();
};
el("previous").onclick = () => {
	if (step > 0) {
		step--;
		showStep();
	}
};
el("next").onclick = () => {
	if (execution && step < execution.trace.length - 1) {
		step++;
		showStep();
	}
};
run();
