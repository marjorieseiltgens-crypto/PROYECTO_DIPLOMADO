const STORAGE_KEY = 'synergiabio-mvp-v1';
const DEMO = {
  demo: true,
  records: [
    {id:1,date:'2026-07-04T09:20',movement:'Ingreso',waste:'Envases de plaguicidas',type:'peligroso',kg:18.4,batch:'PLG-260704',destination:'Acopio peligroso',operator:'OP-014',condition:'Segregado',notes:'Triple lavado verificado'},
    {id:2,date:'2026-07-09T15:10',movement:'Ingreso',waste:'Macetas plásticas',type:'valorizable',kg:76,batch:'MAC-260709',destination:'Acopio valorizable',operator:'OP-008',condition:'Segregado',notes:''},
    {id:3,date:'2026-07-13T11:45',movement:'Valorización',waste:'Cartón',type:'valorizable',kg:124,batch:'CAR-260713',destination:'Gestor autorizado',operator:'OP-011',condition:'Conforme para retiro',notes:'Guía de despacho GD-044'},
    {id:4,date:'2026-07-21T08:35',movement:'Ingreso',waste:'Agroquímico vencido',type:'peligroso',kg:6.8,batch:'AGV-260721',destination:'Acopio peligroso',operator:'OP-014',condition:'En observación',notes:'Retiro prioritario solicitado'},
    {id:5,date:'2026-07-26T16:20',movement:'Valorización',waste:'Macetas plásticas',type:'valorizable',kg:63,batch:'MAC-260726',destination:'Reutilización interna',operator:'OP-008',condition:'Conforme para retiro',notes:''},
    {id:6,date:'2026-08-01T10:05',movement:'Ingreso',waste:'Cartón',type:'valorizable',kg:54,batch:'CAR-260801',destination:'Acopio valorizable',operator:'OP-011',condition:'Segregado',notes:''}
  ],
  checklists: [
    {id:1,date:'2026-07-25T08:10',operator:'OP-014',area:'Acopio peligroso',duration:164,checked:6,notes:'Sin observaciones'},
    {id:2,date:'2026-07-27T08:06',operator:'OP-008',area:'Acopio valorizable',duration:151,checked:6,notes:'Sin observaciones'},
    {id:3,date:'2026-07-29T08:16',operator:'OP-011',area:'Acopio peligroso',duration:242,checked:5,notes:'Kit de derrames incompleto'},
    {id:4,date:'2026-08-01T08:11',operator:'OP-014',area:'Acopio peligroso',duration:172,checked:6,notes:'Sin observaciones'}
  ],
  infrastructure: 75,
  approvals: []
};

let state = loadState();
let retcDraft = null;
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

function cloneDemo(){ return JSON.parse(JSON.stringify(DEMO)); }
function loadState(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || cloneDemo(); } catch { return cloneDemo(); } }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll(); }
function fmtKg(n){ return new Intl.NumberFormat('es-CL',{maximumFractionDigits:1}).format(n)+' kg'; }
function fmtDate(s,withTime=false){ const d=new Date(s); return new Intl.DateTimeFormat('es-CL',withTime?{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short',year:'numeric'}).format(d); }
function escapeHtml(v=''){ const el=document.createElement('div'); el.textContent=v; return el.innerHTML; }
function classifyWaste(waste){ return /plaguicida|agroquímico/i.test(waste)?'peligroso':/maceta|cartón/i.test(waste)?'valorizable':'otro'; }
function download(name,content,type='application/json'){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
function toast(message){ const t=$('#toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }

function metrics(){
  const incoming=state.records.filter(r=>r.movement==='Ingreso');
  const circular=state.records.filter(r=>r.movement==='Valorización'&&r.type==='valorizable').reduce((s,r)=>s+r.kg,0);
  const circularTotal=state.records.filter(r=>r.type==='valorizable').reduce((s,r)=>s+r.kg,0);
  const autonomy=state.checklists.length?state.checklists.filter(c=>c.checked===6&&c.duration<180).length/state.checklists.length*100:0;
  const openIncidents=state.records.filter(r=>r.condition==='En observación').length+state.checklists.filter(c=>c.checked<6).length;
  return {total:incoming.reduce((s,r)=>s+r.kg,0),circularRate:circularTotal?circular/circularTotal*100:0,autonomy,openIncidents};
}

function buildAlerts(){
  const m=metrics(), alerts=[];
  state.records.filter(r=>r.condition==='En observación').forEach(r=>alerts.push({title:'Residuo en observación',text:`${r.waste}, lote ${r.batch}: requiere cierre por responsable ambiental.`}));
  state.checklists.filter(c=>c.checked<6).forEach(c=>alerts.push({title:'Checklist incompleto',text:`${c.area}: ${c.checked}/6 controles conformes. ${c.notes}`}));
  if(m.autonomy<85) alerts.push({title:'Autonomía bajo meta',text:`Resultado ${m.autonomy.toFixed(0)}%. Reforzar capacitación antes de escalar.`});
  if(m.circularRate<80) alerts.push({title:'Valorización bajo umbral',text:`Resultado ${m.circularRate.toFixed(0)}%. Revisar segregación y convenio de retiro.`});
  return alerts;
}

function renderKpis(){
  const m=metrics();
  const cards=[
    ['⇄',fmtKg(m.total),'Ingresos registrados','Base demostrativa'],
    ['♻',m.circularRate.toFixed(0)+'%','Valorización circular',m.circularRate>=80?'Meta cumplida':'Meta ≥80%',m.circularRate<80],
    ['✓',m.autonomy.toFixed(0)+'%','Autonomía en campo',m.autonomy>=85?'En rango':'Meta ≥85%',m.autonomy<85],
    ['!',String(m.openIncidents),'Incidencias abiertas',m.openIncidents?'Requieren revisión':'Sin pendientes',m.openIncidents>0]
  ];
  $('#kpiGrid').innerHTML=cards.map(c=>`<article class="kpi"><div class="kpi-top"><span class="kpi-icon">${c[0]}</span><span class="kpi-trend ${c[4]?'bad':''}">${c[3]}</span></div><div class="kpi-value">${c[1]}</div><div class="kpi-label">${c[2]}</div></article>`).join('');
  $('#safetySummary').innerHTML=[['Inspecciones',state.checklists.length],['Autonomía <3 min',m.autonomy.toFixed(0)+'%'],['Desviaciones',state.checklists.filter(c=>c.checked<6).length]].map(([l,v])=>`<article class="kpi"><div class="kpi-value">${v}</div><div class="kpi-label">${l}</div></article>`).join('');
}

function renderAlerts(){
  const alerts=buildAlerts();
  $('#alertBadge').textContent=alerts.length; $('#alertCount').textContent=`${alerts.length} abiertas`; $('#alertCount').className=`pill ${alerts.length?'danger':'success'}`;
  $('#alertsList').innerHTML=alerts.length?alerts.slice(0,4).map(a=>`<div class="alert-item"><span>!</span><div><strong>${escapeHtml(a.title)}</strong><small>${escapeHtml(a.text)}</small></div></div>`).join(''):'<div class="alert-item"><span>✓</span><div><strong>Sin alertas abiertas</strong><small>Los umbrales actuales se encuentran conformes.</small></div></div>';
}

function renderActivity(){
  $('#recentActivity').innerHTML=[...state.records].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(r=>`<div class="activity-row"><span class="activity-icon">${r.movement==='Valorización'?'♻':'⇄'}</span><div><strong>${escapeHtml(r.movement)} · ${escapeHtml(r.waste)}</strong><small>${fmtKg(r.kg)} · ${escapeHtml(r.operator)}</small></div><time>${fmtDate(r.date)}</time></div>`).join('')||'<p class="muted">Aún no hay movimientos.</p>';
  const p=state.infrastructure; $('#decisionProgress').style.width=p+'%'; $('#decisionLabel').textContent=`${p}% de controles de habilitación`; $('#decisionText').textContent=p===100?'Infraestructura habilitada; procede recepción con inspección técnica.':'Complete radier, techado, señalización y recepción técnica antes de operar.';
}

function renderRecords(){
  const query=($('#recordSearch')?.value||'').toLowerCase(), type=$('#recordTypeFilter')?.value||'all';
  const rows=[...state.records].sort((a,b)=>b.date.localeCompare(a.date)).filter(r=>(type==='all'||r.type===type)&&JSON.stringify(r).toLowerCase().includes(query));
  $('#recordsBody').innerHTML=rows.map(r=>`<tr><td>${fmtDate(r.date,true)}</td><td>${escapeHtml(r.movement)}</td><td><strong>${escapeHtml(r.waste)}</strong><small>${escapeHtml(r.batch)}</small></td><td>${fmtKg(r.kg)}</td><td>${escapeHtml(r.destination)}</td><td>${escapeHtml(r.operator)}</td><td><span class="pill ${r.condition==='En observación'?'warning':'success'}">${escapeHtml(r.condition)}</span></td></tr>`).join('')||'<tr><td colspan="7">No hay registros para este filtro.</td></tr>';
}

function renderChecklists(){
  $('#checklistsBody').innerHTML=[...state.checklists].sort((a,b)=>b.date.localeCompare(a.date)).map(c=>`<tr><td>${fmtDate(c.date,true)}</td><td>${escapeHtml(c.operator)}</td><td>${escapeHtml(c.area)}</td><td>${Math.floor(c.duration/60)}m ${c.duration%60}s</td><td><span class="pill ${c.checked===6?'success':'warning'}">${c.checked}/6</span></td><td>${escapeHtml(c.notes||'Sin observaciones')}</td></tr>`).join('')||'<tr><td colspan="6">Aún no hay inspecciones.</td></tr>';
}

function renderRetc(){
  const hazardous=state.records.filter(r=>r.type==='peligroso').reduce((s,r)=>s+(r.movement==='Salida'?-r.kg:r.kg),0);
  const missing=state.records.filter(r=>!r.batch||!r.destination||!r.kg).length;
  $('#retcStats').innerHTML=[['Registros',state.records.length],['Peligrosos',fmtKg(hazardous)],['Brechas',missing]].map(([l,v])=>`<div class="mini-stat"><strong>${v}</strong><small>${l}</small></div>`).join('');
}

function renderSources(){
  const sources=[['Bitácora de movimientos',`${state.records.length} registros · local`,true],['Checklist móvil',`${state.checklists.length} inspecciones · local`,true],['Índice normativo RAG','No conectado en este MVP',false],['Contabilidad y presupuesto','No conectado en este MVP',false]];
  $('#sourcesList').innerHTML=sources.map(s=>`<div class="source-row"><div><strong>${s[0]}</strong><small>${s[1]}</small></div><span class="pill ${s[2]?'success':'warning'}">${s[2]?'Disponible':'Pendiente'}</span></div>`).join('');
}

function renderChart(){
  const canvas=$('#wasteChart'); if(!canvas)return; const rect=canvas.getBoundingClientRect(); canvas.width=Math.max(500,rect.width*devicePixelRatio); canvas.height=255*devicePixelRatio; const ctx=canvas.getContext('2d'); ctx.scale(devicePixelRatio,devicePixelRatio); const w=canvas.width/devicePixelRatio,h=255;
  ctx.clearRect(0,0,w,h); const months=['Abr','May','Jun','Jul','Ago']; const base={peligroso:[12,18,16,25,10],valorizable:[90,112,130,263,54]}; const filter=$('#chartFilter').value; const max=300,pad={l:38,r:15,t:18,b:30};
  ctx.strokeStyle='#e1e9e5';ctx.fillStyle='#788780';ctx.font='10px Segoe UI'; for(let i=0;i<4;i++){let y=pad.t+i*(h-pad.t-pad.b)/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillText(String(Math.round(max-(max*i/3))),4,y+3)}
  const step=(w-pad.l-pad.r)/months.length,bar=Math.min(22,step/4); months.forEach((m,i)=>{const x=pad.l+step*i+step/2;ctx.fillStyle='#788780';ctx.fillText(m,x-8,h-8);if(filter!=='peligroso'){const bh=base.valorizable[i]/max*(h-pad.t-pad.b);ctx.fillStyle='#0b8a62';ctx.fillRect(x-bar-2,h-pad.b-bh,bar,bh)}if(filter!=='valorizable'){const bh=base.peligroso[i]/max*(h-pad.t-pad.b);ctx.fillStyle='#e98236';ctx.fillRect(x+2,h-pad.b-bh,bar,bh)}});
}

function renderAll(){ renderKpis();renderAlerts();renderActivity();renderRecords();renderChecklists();renderRetc();renderSources();requestAnimationFrame(renderChart); }
function showView(id){ $$('.view').forEach(v=>v.classList.toggle('active',v.id===id)); $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===id)); const labels={inicio:'Resumen ejecutivo',trazabilidad:'Trazabilidad de residuos',bioseguridad:'Bioseguridad en terreno',retc:'Reporte RETC asistido',datos:'Datos y gobernanza'}; $('#pageTitle').textContent=labels[id]; $('.sidebar').classList.remove('open'); if(id==='inicio')requestAnimationFrame(renderChart); }

function openRecord(){ const f=$('#recordForm'); f.reset(); const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16); f.elements.date.value=d; $('#classificationHint').classList.remove('visible'); $('#recordDialog').showModal(); }
function openChecklist(){ const f=$('#checklistForm'); f.reset(); f.dataset.started=Date.now(); $('#checklistDialog').showModal(); }

$('#recordForm').addEventListener('submit',e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(e.target));state.records.push({...fd,id:Date.now(),kg:Number(fd.kg),type:classifyWaste(fd.waste)});state.demo=false;saveState();$('#recordDialog').close();toast('Movimiento registrado con trazabilidad.');});
$('#checklistForm').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.target),checked=data.getAll('step').length,duration=Math.max(35,Math.round((Date.now()-Number(e.target.dataset.started))/1000));state.checklists.push({id:Date.now(),date:new Date().toISOString(),operator:data.get('operator'),area:data.get('area'),duration,checked,notes:data.get('notes')||(!checked?'Checklist incompleto':'Sin observaciones')});state.demo=false;saveState();$('#checklistDialog').close();toast(checked===6?'Inspección conforme registrada.':'Desviación registrada para revisión.');});

$$('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view))); $$('[data-view-link]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.viewLink))); $$('[data-action="new-record"]').forEach(b=>b.addEventListener('click',openRecord)); $$('[data-action="new-checklist"]').forEach(b=>b.addEventListener('click',openChecklist)); $$('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#menuButton').addEventListener('click',()=>$('.sidebar').classList.toggle('open')); $('#chartFilter').addEventListener('change',renderChart); window.addEventListener('resize',renderChart); $('#recordSearch').addEventListener('input',renderRecords); $('#recordTypeFilter').addEventListener('change',renderRecords);
$('#recordForm').elements.waste.addEventListener('change',e=>{const type=classifyWaste(e.target.value),hint=$('#classificationHint');hint.innerHTML=`<strong>Clasificación asistida:</strong> ${type==='peligroso'?'Residuo peligroso; exige acopio segregado y validación ambiental.':type==='valorizable'?'Residuo valorizable; priorizar reutilización o gestor autorizado.':'Requiere clasificación manual del experto.'}`;hint.classList.add('visible');});
$('#notificationButton').addEventListener('click',()=>{showView('inicio');$('#alertsList').scrollIntoView({behavior:'smooth',block:'center'});});
$('#exportCsv').addEventListener('click',()=>{const fields=['date','movement','waste','type','kg','batch','destination','operator','condition','notes'];const csv=[fields.join(','),...state.records.map(r=>fields.map(f=>`"${String(r[f]??'').replaceAll('"','""')}"`).join(','))].join('\n');download('synergiabio_movimientos.csv','\ufeff'+csv,'text/csv;charset=utf-8');toast('Archivo CSV exportado.');});

$('#generateRetc').addEventListener('click',()=>{const hazardous=state.records.filter(r=>r.type==='peligroso');retcDraft={metadata:{generatedAt:new Date().toISOString(),status:'BORRADOR_NO_AUTORIZADO',source:state.demo?'DATOS_SINTETICOS_DEMOSTRACION':'REGISTROS_LOCALES'},summary:{recordCount:state.records.length,hazardousKg:hazardous.reduce((s,r)=>s+r.kg,0),incompleteFields:state.records.filter(r=>!r.batch||!r.destination).length},hazardousRecords:hazardous.map(({date,waste,kg,batch,destination,condition})=>({date,waste,kg,batch,destination,condition})),warnings:['Verificar categorías contra normativa vigente.','Confirmar gestores y certificados de destino.','El sistema no realiza envíos automáticos.']};$('#retcPreview').textContent=JSON.stringify(retcDraft,null,2);$('#retcStatus').textContent='Borrador';toast('Borrador generado; requiere revisión profesional.');});
$('#approveRetc').addEventListener('click',()=>{const name=$('#reviewerName').value.trim();if(!retcDraft)return toast('Primero genere el borrador.');if(!name||!$('#reviewConfirmed').checked)return toast('Complete la revisión y el nombre del experto.');const approved={...retcDraft,metadata:{...retcDraft.metadata,status:'REVISADO_LOCALMENTE',reviewedAt:new Date().toISOString(),reviewer:name}};state.approvals.push(approved.metadata);saveState();download('borrador_retc_revisado.json',JSON.stringify(approved,null,2));$('#retcStatus').className='pill success';$('#retcStatus').textContent='Revisado';toast('Revisión registrada y archivo descargado.');});

$('#backupData').addEventListener('click',()=>download('synergiabio_respaldo.json',JSON.stringify(state,null,2))); $('#restoreData').addEventListener('change',async e=>{try{const obj=JSON.parse(await e.target.files[0].text());if(!Array.isArray(obj.records)||!Array.isArray(obj.checklists))throw new Error();state=obj;saveState();toast('Respaldo restaurado.');}catch{toast('El archivo no es un respaldo válido.');}}); $('#resetData').addEventListener('click',()=>{if(confirm('¿Restablecer todos los datos a la demostración inicial?')){state=cloneDemo();saveState();toast('Demostración restablecida.');}}); $$('[data-action="clear-demo"]').forEach(b=>b.addEventListener('click',()=>{if(confirm('¿Eliminar todos los registros de demostración?')){state={demo:false,records:[],checklists:[],infrastructure:0,approvals:[]};saveState();toast('Datos demo eliminados.');}}));

renderAll();
