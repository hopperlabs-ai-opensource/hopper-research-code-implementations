const el = (id) => document.getElementById(id);
let selected = 0, data;
function editableData() {
  return { features: data.features, query: data.query, unit: data.unit, records: data.records };
}
function syncEditor() {
  el("recipe-json").value = JSON.stringify(editableData(), null, 2);
}
function drawFeatures() {
  el("features").replaceChildren(...data.features.map((name, i) => {
    const label = document.createElement("label");
    label.className = "feature-control";
    const title = document.createElement("span");
    title.textContent = name;
    const input = document.createElement("input");
    input.type = "range"; input.min = 0; input.max = 1; input.step = 0.05;
    input.value = data.query[i]; input.id = `feature-${i}`;
    const value = document.createElement("output");
    value.htmlFor = input.id; value.textContent = data.query[i].toFixed(2);
    input.oninput = () => {
      data.query[i] = Number(input.value); value.textContent = data.query[i].toFixed(2);
      render();
    };
    label.append(title, input, value); return label;
  }));
}
function render() {
  const temperature = Number(el("temperature").value);
  const result = runRecipe(data, { temperature });
  el("temperature-value").textContent = temperature.toFixed(2);
  el("match").textContent = result.match;
  el("signal").textContent = result.noSignal ? "No feature overlap. These equal weights carry no matching signal." : "Weights show contributions, not confidence or a guarantee that a record is suitable.";
  el("blended").textContent = result.output.toFixed(2);
  el("unit").textContent = data.unit + " · weighted blend";
  el("blend-note").textContent = data.title === recipes[0].title
    ? "For article selection, use the strongest match. The weighted value is Σ(weight × reading time), not that article’s reading time."
    : "The blend is Σ(weight × value). Compare it with the simple average: does weighting related records help your problem?";
  el("average").textContent = (data.records.reduce((sum, r) => sum + r.value, 0) / data.records.length).toFixed(2);
  el("feature-order").textContent = `Feature order: ${data.features.join(" · ")}`;
  el("recipe-bars").replaceChildren(...result.rows.map((row) => {
    const div = document.createElement("div"); div.className = "weight-bar";
    const text = document.createElement("span"); text.textContent = `${row.label} · ${(row.weight * 100).toFixed(1)}%`;
    const bar = document.createElement("progress"); bar.max = 1; bar.value = row.weight;
    bar.setAttribute("aria-label", `${row.label} contribution`); div.append(text, bar); return div;
  }));
  el("recipe-rows").replaceChildren(...result.rows.map((row) => {
    const tr = document.createElement("tr");
    for (const v of [row.label, row.key.join(", "), row.score.toFixed(3), (row.weight * 100).toFixed(1) + "%", row.value, row.contribution.toFixed(2)]) {
      const td = document.createElement("td"); td.textContent = v; tr.append(td);
    }
    return tr;
  }));
  el("calculation").textContent = `const { weights, output } = attention(\n  [query],                 // ${JSON.stringify(data.query)}\n  records.map(r => r.key), // matching features\n  records.map(r => [r.value]),\n  { temperature: ${temperature} }\n);\n// scores = dot(query, key) / sqrt(${data.features.length}) / ${temperature}\n// weights = softmax(scores)\n// output = sum(weight × value)`;
  el("starter").textContent = `import { runRecipe } from './packages/attention-is-all-you-need/recipes.mjs';\n\nconst data = ${JSON.stringify(editableData(), null, 2)};\n\nconst result = runRecipe(data, { temperature: ${temperature} });\nconsole.table(result.rows);\nconsole.log(result.match, result.output, data.unit);`;
}
function loadRecipe(index) {
  selected = index; data = structuredClone(recipes[index]);
  el("question").textContent = data.question;
  el("try").textContent = data.try; el("adapt").textContent = data.adapt;
  el("temperature").value = 0.25; el("error").textContent = "";
  for (let i = 0; i < recipes.length; i++) el(`recipe-${i}`).setAttribute("aria-pressed", String(i === index));
  drawFeatures(); render(); syncEditor();
}
el("temperature").oninput = render;
el("editor").ontoggle = () => { if (el("editor").open) syncEditor(); };
el("apply").onclick = () => {
  try {
    if (el("recipe-json").value.length > 16000) throw Error("Keep the example under 16,000 characters.");
    const candidate = JSON.parse(el("recipe-json").value);
    runRecipe(candidate);
    data = candidate;
    el("question").textContent = "Which of your records matches this request?";
    el("try").textContent = "Move one feature at a time. Try all zeros, then compare a focused request with a mixed one.";
    el("adapt").textContent = "Your data is running locally. The starter below includes the current request and temperature.";
    for (let i = 0; i < recipes.length; i++) el(`recipe-${i}`).setAttribute("aria-pressed", "false");
    el("error").textContent = ""; drawFeatures(); render();
  } catch (error) { el("error").textContent = `Data not applied: ${error.message} The last valid example is still shown.`; }
};
el("restore").onclick = () => loadRecipe(selected);
for (let i = 0; i < recipes.length; i++) el(`recipe-${i}`).onclick = () => loadRecipe(i);
loadRecipe(0);
