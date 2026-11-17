/** Componentes comerciales y herramientas de personalización, sin dependencias. */
'use strict';

function downloadText(filename,text,type='text/plain;charset=utf-8') {
  const url=URL.createObjectURL(new Blob([text],{type}));
  const link=document.createElement('a');link.href=url;link.download=filename;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),15000);
}
$('#open-customizer').hidden=!editorEnabled;
$('#open-hero-demo').addEventListener('click',()=>{
  modalSector=selectedSector;$('#demo-dialog-title').textContent=demoData[modalSector].name;
  renderApp($('#modal-app'),modalSector,{view:'resumen',filter:'all',range:'mes'});openDialog('#demo-dialog');
});
$('#export-demo').addEventListener('click',()=>downloadText(`Silmaur_${modalSector}_movimientos.csv`,engine.csv(model,modalSector),'text/csv;charset=utf-8'));
$('#download-brief').addEventListener('click',()=>downloadText('Mi_solicitud_Silmaur.txt',$('#brief-text').value));

function updateEmail() {
  const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email);
  const contact=$('#contact-email');contact.hidden=!valid;
  if(valid){contact.href='mailto:'+config.email;contact.textContent=config.email;}else contact.removeAttribute('href');
  const link=$('#send-email');link.hidden=!valid;
  if(valid)link.href=`mailto:${config.email}?subject=${encodeURIComponent('Solicitud de demo · '+config.name)}&body=${encodeURIComponent($('#brief-text').value)}`;
  else link.removeAttribute('href');
}
updateEmail();
$('#brief-form').addEventListener('submit',updateEmail);
$('#customizer-form').addEventListener('submit',updateEmail);
$('#reset-customizer').addEventListener('click',updateEmail);
$('#export-config').addEventListener('click',()=>{
  const form=$('#customizer-form');if(!form.reportValidity())return;
  const value={...defaults,name:form.elements.brand.value.trim(),showCustomizer:false};
  for(const key of ['headline','headlineAccent','accent','whatsapp','email','description','location'])value[key]=form.elements[key].value.trim();
  value.whatsapp=value.whatsapp.replace(/\D/g,'');
  if(value.whatsapp&&!/^\d{8,15}$/.test(value.whatsapp)){toast('Revisa el WhatsApp e incluye el código de país.');return;}
  if(!value.name||!value.headline||!value.headlineAccent||!value.description||!value.location){toast('Completa los datos de la marca.');return;}
  downloadText('config.js','/* Configuración pública. No colocar contraseñas ni secretos. */\nwindow.SILMAUR_CONFIG = '+JSON.stringify(value,null,2)+';\n','text/javascript;charset=utf-8');
  toast('Configuración descargada. Sustituye config.js en tu hosting.');
});

// Selección de módulos. El alcance y precio se acuerdan fuera de esta muestra.
const solutionModules={
  academia:[['Matrículas','Alumnos y ciclos'],['Cobros y deudas','Pensiones, adelantos y saldos'],['Reportes','Información para decidir'],['Asistencia','Registro y consulta de asistencia']],
  tienda:[['Ventas','Del registro al saldo final'],['Inventario','Productos y existencias'],['Cobros y deudas','Pagos y cuentas pendientes'],['Reportes','Una vista de tu operación']],
  ferreteria:[['Ventas','Unidades y metros'],['Inventario','Stock y reposición'],['Cobros y deudas','Adelantos y abonos'],['Cotizaciones','Propuestas para tus clientes']]
};
let solutionSector='academia';
const solutionSelection=Object.fromEntries(Object.entries(solutionModules).map(([sector,items])=>[sector,new Set(items.slice(0,3).map(item=>item[0]))]));
function renderSolutionSummary(){
  const chosen=[...solutionSelection[solutionSector]];
  $('#solution-name').textContent=demoData[solutionSector].label;$('#solution-count').textContent=chosen.length;
  $('#solution-list').innerHTML=chosen.length?chosen.map(name=>`<li><span aria-hidden="true">✓</span>${escapeHTML(name)}</li>`).join(''):'<li>Selecciona lo que quieres mejorar.</li>';
  $('#solution-proposal').disabled=!chosen.length;
}
function renderSolution(){
  $$('[data-solution-sector]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.solutionSector===solutionSector)));
  $('#solution-options').innerHTML=solutionModules[solutionSector].map(([name,description])=>`<label class="module-option"><input type="checkbox" value="${escapeHTML(name)}" ${solutionSelection[solutionSector].has(name)?'checked':''}><span class="module-check" aria-hidden="true">✓</span><span><strong>${name}</strong><small>${description}</small></span></label>`).join('');
  renderSolutionSummary();
}
$$('[data-solution-sector]').forEach(button=>button.addEventListener('click',()=>{solutionSector=button.dataset.solutionSector;renderSolution();}));
$('#solution-options').addEventListener('change',event=>{
  const selected=solutionSelection[solutionSector];if(event.target.checked)selected.add(event.target.value);else selected.delete(event.target.value);renderSolutionSummary();
});
$('#solution-demo').addEventListener('click',()=>{
  modalSector=solutionSector;$('#demo-dialog-title').textContent=demoData[modalSector].name;
  renderApp($('#modal-app'),modalSector,{view:'resumen',filter:'all',range:'mes'});openDialog('#demo-dialog');
});
$('#solution-proposal').addEventListener('click',()=>{
  const labels={academia:'Academia o centro educativo',tienda:'Tienda o moda',ferreteria:'Ferretería'};
  $('#brief-form select[name=sector]').value=labels[solutionSector];
  $$('#brief-form input[name=needs]').forEach(input=>{input.checked=solutionSelection[solutionSector].has(input.value);});
  $('#contacto').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  $('#brief-form input[name=name]').focus({preventScroll:true});
});
renderSolution();

$('#privacy-info').addEventListener('click',()=>openDialog('#privacy-dialog'));
let scrollScheduled=false;
function updateReadingPosition(){
  const full=document.documentElement.scrollHeight-innerHeight;
  $('#reading-progress').style.transform=`scaleX(${full>0?scrollY/full:0})`;
  $('#mobile-actions').classList.toggle('visible',scrollY>650&&$('#contacto').getBoundingClientRect().top>innerHeight);
  $('.site-header').classList.toggle('is-scrolled',scrollY>20);
}
addEventListener('scroll',()=>{if(!scrollScheduled)requestAnimationFrame(()=>{updateReadingPosition();scrollScheduled=false;});scrollScheduled=true;},{passive:true});
addEventListener('resize',updateReadingPosition);updateReadingPosition();
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu();});
$$('.faq-list details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)$$('.faq-list details').forEach(other=>{if(other!==detail)other.open=false;});}));
