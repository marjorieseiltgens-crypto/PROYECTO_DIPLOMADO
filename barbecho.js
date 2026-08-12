const BARBECHO_CAPACITY_ML=1000000;
const BARBECHO_WARNING_ML=900000;

function ensureBarbechoState(){
  if(!Array.isArray(state.barbechoLogs))state.barbechoLogs=[];
  if(!Number.isFinite(Number(state.barbechoInitialMl)))state.barbechoInitialMl=0;
}
function barbechoBalance(){
  ensureBarbechoState();
  const added=state.barbechoLogs.reduce((s,l)=>s+Number(l.addedMl||0),0);
  const evaporated=state.barbechoLogs.reduce((s,l)=>s+Number(l.evaporatedMl||0),0);
  const current=Math.max(0,Number(state.barbechoInitialMl)+added-evaporated);
  const days=new Set(state.barbechoLogs.filter(l=>Number(l.evaporatedMl)>0).map(l=>l.date)).size;
  const dailyAverage=days?evaporated/days:0;
  return {added,evaporated,current,available:Math.max(0,BARBECHO_CAPACITY_ML-current),days,dailyAverage,weekly:dailyAverage*7,monthly:dailyAverage*30};
}
function fmtVolume(ml){
  const liters=Number(ml||0)/1000;
  return new Intl.NumberFormat('es-CL',{maximumFractionDigits:3}).format(liters)+' L';
}
function barbechoLevel(current){return current>BARBECHO_CAPACITY_ML?'critical':current>=BARBECHO_CAPACITY_ML?'critical':current>=BARBECHO_WARNING_ML?'warning':'safe'}
function renderBarbecho(){
  ensureBarbechoState();if(!$('#barbechoKpis'))return;
  const b=barbechoBalance(),percent=b.current/BARBECHO_CAPACITY_ML*100,level=barbechoLevel(b.current),over=Math.max(0,b.current-BARBECHO_CAPACITY_ML);
  $('#barbechoInitial').value=Number(state.barbechoInitialMl)/1000;
  $('#barbechoKpis').innerHTML=[['Volumen actual',fmtVolume(b.current),'Capacidad máxima: 1.000 L'],['Capacidad utilizada',percent.toFixed(1)+'%',level==='safe'?'Operación bajo umbral':level==='warning'?'Alerta preventiva':'Capacidad crítica'],['Disponible para agregar',fmtVolume(b.available),b.available?new Intl.NumberFormat('es-CL').format(Math.round(b.available))+' ml':'No agregar más líquido'],['Evaporación registrada',fmtVolume(b.evaporated),b.days+' día(s) con medición']].map(([v,l,s])=>`<article class="kpi"><div class="kpi-value">${v}</div><div class="kpi-label">${l}</div><div class="kpi-trend">${s}</div></article>`).join('');
  const tank=$('.tank');tank.className='tank '+level;$('#tankFill').style.height=Math.min(100,percent)+'%';$('#tankPercent').textContent=percent.toFixed(1)+'%';$('#tankLiters').textContent=fmtVolume(b.current);
  const status=$('#barbechoStatus');status.className='pill '+(level==='safe'?'success':level==='warning'?'warning':'danger');status.textContent=level==='safe'?'Disponible':level==='warning'?'Próximo al límite':'Crítico';
  const alert=$('#barbechoAlert');alert.className='barbecho-alert visible '+level;
  alert.textContent=level==='critical'?(over>0?`ALERTA CRÍTICA: la capacidad se excede en ${fmtVolume(over)}. Suspenda toda adición y gestione el excedente según el procedimiento ambiental.`:'ALERTA CRÍTICA: el barbecho alcanzó los 1.000 L. No agregue más líquido.') : level==='warning'?`ALERTA PREVENTIVA: quedan ${fmtVolume(b.available)} disponibles antes del máximo de 1.000 L.`:`Nivel bajo control: puede agregar hasta ${fmtVolume(b.available)} sin superar la capacidad.`;
  $('#evaporationSummary').innerHTML=[['Promedio diario',fmtVolume(b.dailyAverage)],['Estimado semanal',fmtVolume(b.weekly)],['Estimado mensual',fmtVolume(b.monthly)],['Espacio disponible',fmtVolume(b.available)]].map(([l,v],i)=>`<div class="evap-stat ${i===3?'available':''}"><strong>${v}</strong><span>${l}</span></div>`).join('');
  $('#barbechoLogsBody').innerHTML=[...state.barbechoLogs].sort((a,b)=>b.date.localeCompare(a.date)).map(l=>`<tr><td>${fmtDate(l.date+'T12:00')}</td><td><strong>${escapeHtml(l.pesticide)}</strong><small>${escapeHtml(l.notes||'Sin observaciones')}</small></td><td>${new Intl.NumberFormat('es-CL').format(l.addedMl)} ml</td><td>${new Intl.NumberFormat('es-CL').format(l.evaporatedMl)} ml</td><td>${l.addedMl-l.evaporatedMl>=0?'+':''}${new Intl.NumberFormat('es-CL').format(l.addedMl-l.evaporatedMl)} ml</td><td>${escapeHtml(l.operator)}</td></tr>`).join('')||'<tr><td colspan="6">Aún no hay registros diarios.</td></tr>';
}
function populatePesticides(query=''){
  const select=$('#pesticideSelect'),normalized=query.trim().toLocaleLowerCase('es'),current=select.value;
  const matches=PLAGUICIDAS_CATALOG.filter(name=>name.toLocaleLowerCase('es').includes(normalized));
  select.innerHTML='<option value="">Seleccione un producto</option>'+matches.map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
  if(matches.includes(current))select.value=current;
  $('#pesticideCatalogCount').textContent=`${matches.length} de ${PLAGUICIDAS_CATALOG.length} productos disponibles`;
}
function openBarbecho(){const f=$('#barbechoForm');f.reset();f.elements.date.value=new Date().toISOString().slice(0,10);f.elements.addedMl.value=0;f.elements.evaporatedMl.value=0;$('#pesticideSearch').value='';populatePesticides();$('#barbechoDialog').showModal()}

const buildAlertsBeforeBarbecho=buildAlerts;
buildAlerts=function(){const list=buildAlertsBeforeBarbecho(),b=barbechoBalance();if(b.current>=BARBECHO_CAPACITY_ML)list.unshift({title:'Barbecho químico en nivel crítico',text:b.current>BARBECHO_CAPACITY_ML?`Excede la capacidad en ${fmtVolume(b.current-BARBECHO_CAPACITY_ML)}. Suspenda las adiciones.`:'Alcanzó los 1.000 L. No agregue más líquido.'});else if(b.current>=BARBECHO_WARNING_ML)list.unshift({title:'Barbecho químico próximo al límite',text:`Quedan ${fmtVolume(b.available)} antes de alcanzar los 1.000 L.`});return list};
const renderAllBeforeBarbecho=renderAll;
renderAll=function(){ensureBarbechoState();renderAllBeforeBarbecho();renderBarbecho()};

$$('[data-action="new-barbecho"]').forEach(b=>b.addEventListener('click',openBarbecho));
$('#pesticideSearch').addEventListener('input',e=>populatePesticides(e.target.value));
$('#barbechoForm').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target)),addedMl=Math.max(0,Number(d.addedMl)||0),evaporatedMl=Math.max(0,Number(d.evaporatedMl)||0);if(addedMl+evaporatedMl===0)return toast('Registre líquido agregado o evaporación del día.');ensureBarbechoState();state.barbechoLogs.push({...d,id:Date.now(),addedMl,evaporatedMl});state.demo=false;saveState();$('#barbechoDialog').close();const b=barbechoBalance();toast(b.current>=BARBECHO_WARNING_ML?'Registro guardado con alerta de capacidad.':'Balance diario registrado.')});
$('#saveBarbechoInitial').addEventListener('click',()=>{ensureBarbechoState();state.barbechoInitialMl=Math.max(0,Number($('#barbechoInitial').value)||0)*1000;state.demo=false;saveState();toast('Nivel inicial actualizado.')});
$('#exportBarbechoCsv').addEventListener('click',()=>{ensureBarbechoState();const fields=['date','pesticide','addedMl','evaporatedMl','operator','notes'],csv=[['Fecha','Plaguicida','Agregado ml','Evaporado ml','Operario','Observaciones'].join(','),...state.barbechoLogs.map(r=>fields.map(f=>`"${String(r[f]??'').replaceAll('"','""')}"`).join(','))].join('\n');download('barbecho_quimico.csv','\ufeff'+csv,'text/csv;charset=utf-8')});

populatePesticides();ensureBarbechoState();renderAll();
