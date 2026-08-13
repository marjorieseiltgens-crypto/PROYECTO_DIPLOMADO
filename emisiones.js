const EMISSION_MEDIA=['Aire','Agua','Suelo','Transferencia'];

function ensureEmissionState(){if(!Array.isArray(state.emissionLogs))state.emissionLogs=[]}
function fmtEmissionKg(value){return new Intl.NumberFormat('es-CL',{minimumFractionDigits:0,maximumFractionDigits:3}).format(Number(value)||0)+' kg'}
function filteredEmissionLogs(){
  ensureEmissionState();
  const query=($('#emissionSearch')?.value||'').trim().toLocaleLowerCase('es'),medium=$('#emissionMediumFilter')?.value||'all';
  return [...state.emissionLogs].sort((a,b)=>b.date.localeCompare(a.date)).filter(log=>(medium==='all'||log.medium===medium)&&(!query||`${log.source} ${log.pollutant} ${log.operator} ${log.method}`.toLocaleLowerCase('es').includes(query)));
}
function renderEmissions(){
  ensureEmissionState();if(!$('#emissionKpis'))return;
  const rows=filteredEmissionLogs(),total=rows.reduce((sum,log)=>sum+Number(log.amountKg||0),0),verified=rows.filter(log=>log.status==='Verificado internamente').length,pending=rows.length-verified;
  $('#emissionKpis').innerHTML=[['Emisiones registradas',fmtEmissionKg(total),`${rows.length} registro(s)`],['Fuentes identificadas',new Set(rows.map(log=>log.source.trim().toLocaleLowerCase('es'))).size,'Procesos o puntos de emisión'],['Verificados',verified,rows.length?`${(verified/rows.length*100).toFixed(0)}% de los registros`:'Sin registros'],['Pendientes de revisión',pending,pending?'Requieren validación ambiental':'Sin pendientes']].map(([label,value,detail],index)=>`<article class="kpi"><div class="kpi-value">${value}</div><div class="kpi-label">${label}</div><div class="kpi-trend ${index===3&&pending?'bad':''}">${detail}</div></article>`).join('');
  const mediumTotals=EMISSION_MEDIA.map(medium=>({medium,total:rows.filter(log=>log.medium===medium).reduce((sum,log)=>sum+Number(log.amountKg||0),0)})),max=Math.max(...mediumTotals.map(item=>item.total),0);
  $('#emissionDistribution').innerHTML=mediumTotals.map(item=>`<div class="emission-medium-row"><span>${item.medium}</span><div class="emission-medium-track"><span style="width:${max?item.total/max*100:0}%"></span></div><strong>${fmtEmissionKg(item.total)}</strong></div>`).join('');
  $('#emissionsBody').innerHTML=rows.map(log=>`<tr><td>${fmtDate(log.date+'T12:00')}</td><td><strong>${escapeHtml(log.source)}</strong><small>${escapeHtml(log.notes||'Sin observaciones')}</small></td><td>${escapeHtml(log.pollutant)}</td><td>${escapeHtml(log.medium)}</td><td>${fmtEmissionKg(log.amountKg)}</td><td>${escapeHtml(log.method)}</td><td>${escapeHtml(log.operator)}</td><td><span class="pill emission-status ${log.status==='Verificado internamente'?'success':'warning'}">${escapeHtml(log.status)}</span></td></tr>`).join('')||'<tr><td colspan="8">Aún no hay emisiones RETC registradas.</td></tr>';
}
function openEmission(){const form=$('#emissionForm');form.reset();form.elements.date.value=new Date().toISOString().slice(0,10);$('#emissionDialog').showModal()}

$$('[data-action="new-emission"]').forEach(button=>button.addEventListener('click',openEmission));
$('#emissionSearch').addEventListener('input',renderEmissions);$('#emissionMediumFilter').addEventListener('change',renderEmissions);
$('#emissionForm').addEventListener('submit',event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.target)),amountKg=Math.max(0,Number(data.amountKg)||0);if(!amountKg)return toast('Ingrese una cantidad emitida mayor que cero.');ensureEmissionState();state.emissionLogs.push({...data,id:Date.now(),amountKg});state.demo=false;saveState();$('#emissionDialog').close();toast('Emisión RETC registrada para revisión.')});
$('#exportEmissionsCsv').addEventListener('click',()=>{const rows=filteredEmissionLogs(),fields=['date','source','pollutant','medium','amountKg','method','operator','status','notes'],header=['Fecha','Fuente','Sustancia','Medio','Cantidad kg','Método','Responsable','Estado','Observaciones'],csv=[header.join(','),...rows.map(row=>fields.map(field=>`"${String(row[field]??'').replaceAll('"','""')}"`).join(','))].join('\n');download('emisiones_retc.csv','\ufeff'+csv,'text/csv;charset=utf-8');toast('Emisiones RETC exportadas.')});

const renderAllBeforeEmissions=renderAll;
renderAll=function(){renderAllBeforeEmissions();renderEmissions()};
ensureEmissionState();renderEmissions();
