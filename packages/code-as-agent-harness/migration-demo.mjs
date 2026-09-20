const el = (id) => document.getElementById(id);
function run() {
	try {
		if (el("config").value.length > 10000)
			throw Error("Keep the configuration under 10,000 characters.");
		const r = compareMigration(JSON.parse(el("config").value));
		el("error").textContent = "";
		el("result").textContent =
			"Quick patch rejected · explicit migration passes";
		el("naive").textContent = JSON.stringify(r.naive, null, 2);
		el("migrated").textContent = JSON.stringify(r.migrated, null, 2);
		el("checks").replaceChildren(
			...r.checks.map((check, i) => {
				const p = document.createElement("p");
				p.textContent = `${check.name}: quick patch ${r.naiveChecks[i].passed ? "passes" : "fails"} / explicit migration ${check.passed ? "passes" : "fails"}`;
				return p;
			}),
		);
		el("result").textContent =
			`Quick patch ${r.naiveChecks.every((x) => x.passed) ? "passes" : "rejected"} · explicit migration ${r.checks.every((x) => x.passed) ? "passes" : "rejected"}`;
	} catch (error) {
		el("error").textContent = error.message;
		el("result").textContent = "No migration accepted";
		el("checks").replaceChildren();
		el("naive").textContent = "";
		el("migrated").textContent = "";
	}
}
el("run").onclick = run;
el("reset").onclick = () => {
	el("config").value = JSON.stringify(sampleConfig, null, 2);
	run();
};
el("source").textContent =
	migrateConfig.toString() + "\n\n" + verifyMigration.toString();
el("reset").click();
