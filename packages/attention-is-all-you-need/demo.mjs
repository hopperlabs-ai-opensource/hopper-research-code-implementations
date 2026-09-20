const $ = id => document.getElementById(id);
let step=0;
const stages=['1 / 4 · Query and keys','2 / 4 · Scale the dot products','3 / 4 · Normalize with softmax','4 / 4 · Mix the values'];
const explanations=['Rotate the query and compare its direction with the keys. A dot product measures alignment.', 'Divide the query/key dot products by the square root of key width (2). Masked positions have score −∞.', 'Softmax turns scores into nonnegative weights that sum to one. Lower temperature makes the choice sharper.', 'Multiply each value by its weight and add the results. Attention returns a mixture, not a selected token.'];
const formulas=['Q = [cos(angle), sin(angle)]; K = [[1,0], [0,1], [-1,0]]','scores = Q × transpose(K) / sqrt(2) / temperature','weights = softmax(scores)','output = weights × V'];
function render(){
 const angle=Number($('angle').value),t=Number($('temp').value)/100,pos=Number($('position').value);
 const q=[Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180)];
 const K=[[1,0],[0,1],[-1,0]],V=[[1,0],[0,1],[1,1]],Q=[q,q,q];
 const r=attention(Q,K,V,{causal:$('causal').checked,temperature:t});
 $('angleValue').textContent=angle+'°'; $('tempValue').textContent=t.toFixed(2);
 $('stepLabel').textContent=stages[step]; $('explanation').textContent=explanations[step]; $('formula').textContent=formulas[step];
 $('previous').disabled=step===0; $('next').disabled=step===3;
 $('rows').replaceChildren(...K.map((k,j)=>{const tr=document.createElement('tr');
 [String(j+1),JSON.stringify(k),JSON.stringify(V[j]),step>=1?(Number.isFinite(r.scores[pos][j])?r.scores[pos][j].toFixed(3):'masked'):'—',step>=2?(100*r.weights[pos][j]).toFixed(1)+'%':'—'].forEach(text=>{const td=document.createElement('td');td.textContent=text;tr.append(td);});
 return tr;}));
 $('result').textContent=step===3?'Output: ['+r.output[pos].map(n=>n.toFixed(4)).join(', ')+']':'Follow the steps to reveal the result.';
 $('matrices').textContent=JSON.stringify({Q,K,V,...r},(key,value)=>value===-Infinity?'masked':value,2);
}
for(const id of ['angle','temp','causal','position']) $(id).addEventListener('input',render);
$('previous').onclick=()=>{step=Math.max(0,step-1);render();}; $('next').onclick=()=>{step=Math.min(3,step+1);render();}; render();
