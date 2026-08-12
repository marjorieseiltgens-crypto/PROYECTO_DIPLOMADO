function certificationAssessment(){
  const records=state.records||[],checks=state.checklists||[],usage=state.usageLogs||[],barbecho=state.barbechoLogs||[];
  const completedChecks=checks.filter(c=>c.checked===6).length;
  const segregated=records.filter(r=>r.condition!=='En observación').length;
  const traceability=records.length?segregated/records.length:0;
  const checklistRate=checks.length?completedChecks/checks.length:0;
  const circularMovements=usage.length>0;
  const hazardousControl=records.some(r=>r.type==='peligroso')||barbecho.length>0;
  const environmentalEvidence=[records.length>0,checks.length>0,traceability>=.8,checklistRate>=.8,circularMovements,hazardousControl];
  const iso14001Score=Math.round(environmentalEvidence.filter(Boolean).length/environmentalEvidence.length*70);
  const iso26000Evidence=[records.length>0,checks.length>0,circularMovements,barbecho.length>0,state.approvals?.length>0];
  const iso26000Score=Math.round(iso26000Evidence.filter(Boolean).length/iso26000Evidence.length*55);
  const repEvidence=[records.length>0,records.some(r=>/envase|embalaje|plástico|cartón|aceite|batería|pila|neumático|textil/i.test(r.waste)),records.some(r=>r.movement==='Valorización'),circularMovements];
  const repScore=Math.round(repEvidence.filter(Boolean).length/repEvidence.length*60);
  return [
    {id:'iso14001',name:'ISO 14001',type:'Certificación de sistema ambiental',score:iso14001Score,canCertify:true,status:iso14001Score>=70?'Preparación alta':'Aún no demostrable',description:'La plataforma aporta trazabilidad ambiental, controles operacionales e indicadores. La certificación requiere implementar el SGA completo y una auditoría independiente.',evidence:`${records.length} movimientos, ${checks.length} inspecciones, ${(traceability*100).toFixed(0)}% de registros sin observación y ${usage.length} registros de circularidad.`,missing:'Política y objetivos ambientales aprobados; contexto y partes interesadas; matriz legal; riesgos y oportunidades; competencia; auditoría interna; revisión por la dirección; acciones correctivas; auditoría de organismo certificador.'},
    {id:'iso26000',name:'ISO 26000',type:'Guía de responsabilidad social · no certificable',score:iso26000Score,canCertify:false,status:'Aplicación parcial de la guía',description:'ISO 26000 entrega orientación y no contiene requisitos certificables. La plataforma solo evidencia prácticas ambientales, seguridad y algunos elementos de rendición de cuentas.',evidence:`Trazabilidad de residuos ${records.length?'disponible':'sin datos'}, controles de seguridad ${checks.length?'disponibles':'sin datos'} y gestión circular ${circularMovements?'registrada':'sin registros'}.`,missing:'Gobernanza organizacional; derechos humanos; prácticas laborales completas; prácticas justas de operación; asuntos de consumidores; participación comunitaria; identificación y diálogo documentado con partes interesadas.'},
    {id:'rep',name:'Ley REP · Ley 20.920',type:'Cumplimiento legal · no es certificación',score:repScore,canCertify:false,status:repScore>=45?'Evidencia operativa parcial':'Información insuficiente',description:'La plataforma apoya la trazabilidad de residuos, pero no determina por sí sola si la empresa es productor regulado, consumidor industrial o si cumple metas y declaraciones.',evidence:`${records.length} movimientos trazables, ${records.filter(r=>r.movement==='Valorización').length} valorizaciones y ${usage.length} registros de bandejas/macetas.`,missing:'Determinar rol legal y productos prioritarios; inscripción y declaraciones RETC cuando corresponda; sistema de gestión; contratos y certificados de gestores autorizados; cantidades puestas en el mercado; metas y obligaciones del decreto aplicable.'}
  ];
}
function certLevel(score){return score>=70?'ready':score>=40?'partial':'low'}
function renderCertifications(){
  if(!$('#certificationCards'))return;const items=certificationAssessment(),average=Math.round(items.reduce((s,i)=>s+i.score,0)/items.length),candidate=items.find(i=>i.canCertify);
  $('#certificationSummary').innerHTML=[['Preparación global',average+'%','Estimación interna'],['Vía certificable',candidate?.name||'Ninguna','Sujeta a auditoría externa'],['Guía aplicable','ISO 26000','No certificable'],['Marco legal','Ley REP','Requiere validar aplicabilidad']].map(([l,v,s])=>`<article class="kpi"><div class="kpi-value">${v}</div><div class="kpi-label">${l}</div><div class="kpi-trend">${s}</div></article>`).join('');
  $('#certificationCards').innerHTML=items.map(i=>`<article class="card cert-card ${certLevel(i.score)}"><div class="cert-head"><div><span class="cert-type">${escapeHtml(i.type)}</span><h2>${escapeHtml(i.name)}</h2></div><div class="score-ring" style="--score:${i.score}"><strong>${i.score}%</strong></div></div><span class="cert-status">${escapeHtml(i.status)}</span><p class="cert-description">${escapeHtml(i.description)}</p><div class="cert-progress"><span style="width:${i.score}%"></span></div><ul><li>${i.canCertify?'Puede conducir a certificación tras completar requisitos y auditoría.':'No corresponde presentar esta evaluación como certificado.'}</li><li>Puntaje limitado a la evidencia disponible en esta plataforma.</li></ul></article>`).join('');
  $('#certificationEvidence').innerHTML=items.map(i=>`<div class="evidence-row"><h3>${escapeHtml(i.name)} · ${i.score}%</h3><div class="evidence-columns"><div class="evidence-box"><strong>Evidencia disponible</strong><span>${escapeHtml(i.evidence)}</span></div><div class="evidence-box missing"><strong>Brechas por verificar</strong><span>${escapeHtml(i.missing)}</span></div></div></div>`).join('');
}
function exportCertificationReport(){const report={generatedAt:new Date().toISOString(),status:'DIAGNOSTICO_ORIENTATIVO_NO_CERTIFICANTE',basis:'Registros locales de SynergiaBio',assessments:certificationAssessment(),disclaimer:'No constituye certificado, auditoría ni pronunciamiento de cumplimiento legal.'};download('reporte_certificaciones.json',JSON.stringify(report,null,2));toast('Informe orientativo exportado.')}

const renderAllBeforeCertifications=renderAll;
renderAll=function(){renderAllBeforeCertifications();renderCertifications()};
$('#refreshCertifications').addEventListener('click',()=>{renderCertifications();toast('Evaluación actualizada con los registros disponibles.')});
$('#exportCertifications').addEventListener('click',exportCertificationReport);
renderCertifications();
