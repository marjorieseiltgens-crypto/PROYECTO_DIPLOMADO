const CIRCULAR_PRODUCTS = [
  {id:'tray288', group:'Bandejas', name:'Bandeja de 288 alvéolos'},
  {id:'tray144', group:'Bandejas', name:'Bandeja de 144 alvéolos'},
  {id:'tray72', group:'Bandejas', name:'Bandeja de 72 alvéolos'},
  {id:'pot05', group:'Macetas', name:'Maceta de 0,5 litros'},
  {id:'pot06', group:'Macetas', name:'Maceta de 0,6 litros'},
  {id:'pot075', group:'Macetas', name:'Maceta de 0,750 cc'},
  {id:'pot1', group:'Macetas', name:'Maceta de 1 litro'},
  {id:'pot15', group:'Macetas', name:'Maceta de 1,5 litros'},
  {id:'pot2', group:'Macetas', name:'Maceta de 2 litros'},
  {id:'pot25', group:'Macetas', name:'Maceta de 25 litros'}
];

function ensureCircularState(){
  if(!state.productCosts) state.productCosts=Object.fromEntries(CIRCULAR_PRODUCTS.map(p=>[p.id,0]));
  if(!state.usageLogs) state.usageLogs=[];
}
function fmtClp(n){return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n||0)}
function fmtDiscardedKg(n){return new Intl.NumberFormat('es-CL',{minimumFractionDigits:0,maximumFractionDigits:3}).format(n||0)+' kg'}
function selectedCircularLogs(){
  const mode=$('#periodMode').value,month=$('#reportMonth').value,year=String($('#reportYear').value);
  return state.usageLogs.filter(l=>mode==='month'?l.date.startsWith(month):l.date.startsWith(year+'-'));
}
function circularSummary(){
  ensureCircularState();const logs=selectedCircularLogs();
  const rows=CIRCULAR_PRODUCTS.map(p=>{const m=logs.filter(l=>l.productId===p.id),used=m.reduce((s,l)=>s+Number(l.used||0),0),recycled=m.reduce((s,l)=>s+Number(l.recycled||0),0),discarded=m.reduce((s,l)=>s+Number(l.discarded||0),0),discardedKg=m.reduce((s,l)=>s+Number(l.discardedKg||0),0),cost=Number(state.productCosts[p.id]||0);return {...p,cost,used,recycled,discarded,discardedKg,loss:discarded*cost,recovered:recycled*cost}});
  const totals=rows.reduce((a,r)=>({used:a.used+r.used,recycled:a.recycled+r.recycled,discarded:a.discarded+r.discarded,discardedKg:a.discardedKg+r.discardedKg,loss:a.loss+r.loss,recovered:a.recovered+r.recovered}),{used:0,recycled:0,discarded:0,discardedKg:0,loss:0,recovered:0});
  return {rows,totals,all:totals.used+totals.recycled+totals.discarded};
}
function renderCircularity(){
  ensureCircularState();if(!$('#priceCatalog'))return;
  $('#priceCatalog').innerHTML=CIRCULAR_PRODUCTS.map(p=>`<label class="price-item"><span>${escapeHtml(p.name)}</span><span class="price-input-wrap"><input class="product-price" data-product="${p.id}" type="number" min="0" step="1" value="${Number(state.productCosts[p.id]||0)}" aria-label="Costo de ${escapeHtml(p.name)}"></span></label>`).join('');
  $('#usageProduct').innerHTML=CIRCULAR_PRODUCTS.map(p=>`<option value="${p.id}">${escapeHtml(p.group)} · ${escapeHtml(p.name)}</option>`).join('');
  const {rows,totals,all}=circularSummary(),pct=n=>all?n/all*100:0;
  $('#circularKpis').innerHTML=[['Utilizadas',totals.used,'Unidades del período'],['Recicladas',totals.recycled,pct(totals.recycled).toFixed(1)+'% del total'],['Pérdida por descarte',fmtClp(totals.loss),`${totals.discarded} unidades · ${fmtDiscardedKg(totals.discardedKg)} eliminados`],['Valor recuperado',fmtClp(totals.recovered),totals.recycled+' unidades']].map(([l,v,s])=>`<article class="kpi"><div class="kpi-value">${v}</div><div class="kpi-label">${l}</div><div class="kpi-trend">${s}</div></article>`).join('');
  $('#percentageBars').innerHTML=[['Utilizadas',totals.used,'bar-used'],['Recicladas',totals.recycled,'bar-recycled'],['Desechadas',totals.discarded,'bar-discarded']].map(([l,n,c])=>`<div class="percentage-row"><span>${l}</span><div class="percentage-track"><span class="${c}" style="width:${pct(n)}%"></span></div><strong>${pct(n).toFixed(1)}%</strong></div>`).join('')+(all?'':'<p class="muted">No hay registros en el período seleccionado.</p>');
  $('#circularBody').innerHTML=rows.map(r=>`<tr><td><strong>${escapeHtml(r.name)}</strong><small>${r.group}</small></td><td>${fmtClp(r.cost)}</td><td>${r.used}</td><td>${r.recycled}</td><td>${r.discarded}</td><td>${fmtDiscardedKg(r.discardedKg)}</td><td class="money-negative">${fmtClp(r.loss)}</td><td class="money-positive">${fmtClp(r.recovered)}</td></tr>`).join('');
  $('#circularFoot').innerHTML=`<tr><td colspan="2">TOTAL DEL PERÍODO</td><td>${totals.used}</td><td>${totals.recycled}</td><td>${totals.discarded}</td><td>${fmtDiscardedKg(totals.discardedKg)}</td><td class="money-negative">${fmtClp(totals.loss)}</td><td class="money-positive">${fmtClp(totals.recovered)}</td></tr>`;
  $('#usageLogsBody').innerHTML=[...state.usageLogs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15).map(l=>{const p=CIRCULAR_PRODUCTS.find(p=>p.id===l.productId);return `<tr><td>${fmtDate(l.date+'T12:00')}</td><td>${escapeHtml(p?.name||l.productId)}</td><td>${l.used}</td><td>${l.recycled}</td><td>${l.discarded}</td><td>${fmtDiscardedKg(l.discardedKg)}</td><td>${escapeHtml(l.operator)}</td></tr>`}).join('')||'<tr><td colspan="7">Aún no hay registros diarios.</td></tr>';
}
function openUsage(){const f=$('#usageForm');f.reset();f.elements.date.value=new Date().toISOString().slice(0,10);$('#usageDialog').showModal()}

const currentReportDate=new Date();
$('#reportMonth').value=`${currentReportDate.getFullYear()}-${String(currentReportDate.getMonth()+1).padStart(2,'0')}`;
$('#reportYear').value=currentReportDate.getFullYear();
$$('[data-action="new-usage"]').forEach(b=>b.addEventListener('click',openUsage));
$('#usageForm').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target)),used=Math.max(0,Number(d.used)||0),recycled=Math.max(0,Number(d.recycled)||0),discarded=Math.max(0,Number(d.discarded)||0),discardedKg=Math.max(0,Number(d.discardedKg)||0);if(used+recycled+discarded+discardedKg===0)return toast('Registre al menos una unidad o los kilogramos eliminados.');ensureCircularState();state.usageLogs.push({...d,id:Date.now(),used,recycled,discarded,discardedKg});state.demo=false;saveState();renderCircularity();$('#usageDialog').close();toast('Movimiento diario registrado.')});
$('#savePrices').addEventListener('click',()=>{ensureCircularState();$$('.product-price').forEach(i=>state.productCosts[i.dataset.product]=Math.max(0,Number(i.value)||0));saveState();renderCircularity();toast('Costos unitarios actualizados.')});
$('#periodMode').addEventListener('change',e=>{$('#monthField').classList.toggle('hidden',e.target.value!=='month');$('#yearField').classList.toggle('hidden',e.target.value!=='year');renderCircularity()});
$('#reportMonth').addEventListener('change',renderCircularity);$('#reportYear').addEventListener('change',renderCircularity);
$('#exportCircularCsv').addEventListener('click',()=>{const {rows}=circularSummary(),header='Producto,Costo unitario,Utilizadas,Recicladas,Desechadas,Kg eliminados,Perdida CLP,Recuperado CLP',csv=[header,...rows.map(r=>[r.name,r.cost,r.used,r.recycled,r.discarded,r.discardedKg,r.loss,r.recovered].map(v=>`"${String(v).replaceAll('"','""')}"`).join(','))].join('\n');download('reporte_circularidad.csv','\ufeff'+csv,'text/csv;charset=utf-8')});

const renderAllWithoutCircularity=renderAll;
renderAll=function(){renderAllWithoutCircularity();renderCircularity()};
ensureCircularState();renderCircularity();
