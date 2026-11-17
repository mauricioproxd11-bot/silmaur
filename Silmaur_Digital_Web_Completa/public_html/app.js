'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => 'S/ ' + Number(value).toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const shortMoney = value => 'S/ ' + Number(value).toLocaleString('es-PE', {minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2});
const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8Zm-9 10 9 5 9-5M3 18l9 5 9-5"/>',
  sliders: '<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="3" fill="currentColor" stroke="none"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4M10 5h4"/>',
  wallet: '<path d="M20 7V5a2 2 0 0 0-2-2L4 6v14h16V7H4"/><path d="M20 11h-5v5h5M17 13.5h.1"/>',
  chart: '<path d="M3 3v18h18M7 15l4-5 4 3 6-8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  pin: '<path d="M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/>',
  box: '<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10 9-5M12 12 3 7m9 5v10M7 4l9 5"/>',
  bolt: '<path d="M9 3h6v5H9zM8 8h8v4H8zM10 12v9h4v-9M10 15h4M10 18h4"/>',
  cable: '<path d="M8 3v3h8V3M10 6v7a4 4 0 0 0 8 0V9M6 21v-3h8v3M10 18v-5"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.grid}</svg>`;
$$('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });

const defaults = window.SILMAUR_CONFIG;
const editorEnabled = defaults.showCustomizer || new URLSearchParams(location.search).get("editar") === "1";
let config = {...defaults};
try {
  const saved = JSON.parse(localStorage.getItem('silmaur-site-preview-v1') || 'null');
  if (editorEnabled && saved && typeof saved === 'object') {
    for (const key of ['name', 'headline', 'headlineAccent', 'accent', 'whatsapp', 'email', 'description', 'location']) {
      if (typeof saved[key] === 'string') config[key] = saved[key];
    }
  }
} catch { /* La vista funciona también sin almacenamiento local. */ }

function applyConfig() {
  if (!/^#[0-9a-f]{6}$/i.test(config.accent)) config.accent = defaults.accent;
  document.documentElement.style.setProperty('--accent', config.accent);
  $('#hero-headline').textContent = config.headline;
  $('.hero-description').textContent = config.description;
  $('#hero-accent').textContent = config.headlineAccent;
  $$('.brand-name').forEach(element => { element.textContent = config.name; });
  $$('.brand').forEach(element => {
    const text = $('span', element);
    const small = document.createElement('small');
    const isSilmaur = config.name.trim().toLowerCase() === 'silmaur digital';
    text.textContent = isSilmaur ? 'SILMAUR' : config.name;
    small.textContent = isSilmaur ? 'DIGITAL' : 'SOFTWARE A TU MEDIDA';
    text.append(small);
    element.setAttribute('aria-label', config.name + ', inicio');
  });
  document.title = config.name + ' · Software a tu medida';
  $('#contact-location').textContent = config.location;
  $('#copyright-year').textContent = new Date().getFullYear();
  if (!$('#brief-result').hidden) updateBriefLink();
}
applyConfig();

let toastTimer;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 4200);
}
function openDialog(id) { $(id).showModal(); document.body.classList.add('modal-open'); }
function closeDialog(id) { $(id).close(); }
$$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => closeDialog('#' + button.dataset.closeDialog)));
$$('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { if (!$$('dialog[open]').length) document.body.classList.remove('modal-open'); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rectangle = dialog.getBoundingClientRect();
    if (event.clientX < rectangle.left || event.clientX > rectangle.right || event.clientY < rectangle.top || event.clientY > rectangle.bottom) dialog.close();
  });
});

const engine = window.SilmaurDemo;
let model = engine.createState();
try { model = engine.restore(JSON.parse(sessionStorage.getItem('silmaur-demo-v3') || 'null')); } catch { /* Solo memoria. */ }
function allDemoViews() { return Object.fromEntries(['academia','tienda','ferreteria'].map(sector => [sector,engine.view(model,sector)])); }
let demoData = allDemoViews();
let selectedSector = 'academia';
let modalSector = 'academia';
let transactionSector = 'academia';
let transactionOrigin;
const appViews = new Map();

function navigation(data, current) {
  return [{id:'resumen', name:'Resumen', icon:'grid'}, {id:'movimientos', name:'Movimientos', icon:'wallet'}, {id:'detalle', name:data.detailLabel, icon:data.detailIcon}]
    .map(item => `<button class="app-nav ${current === item.id ? 'active' : ''}" data-view="${item.id}" ${current === item.id ? 'aria-current="page"' : ''}>${icon(item.icon)}<span>${item.name}</span></button>`).join('');
}
function transactionsTable(rows) {
  if (!rows.length) return '<p class="empty-state">No hay operaciones con este filtro.</p>';
  return `<div class="table-scroll"><table class="app-table"><thead><tr><th scope="col">Cliente / alumno</th><th scope="col">Concepto</th><th scope="col">Total</th><th scope="col">Estado</th></tr></thead><tbody>${rows.map(row => {
    const status = row.status === 'paid' ? 'Pagado' : row.status === 'partial' ? 'Parcial' : 'Pendiente';
    return `<tr><td title="${escapeHTML(row.customer)}"><span class="table-client"><span class="tiny-avatar" aria-hidden="true">${escapeHTML(row.customer.split(/\s+/).map(part => part[0]).slice(0,2).join(''))}</span>${escapeHTML(row.customer)}</span></td><td title="${escapeHTML(row.concept)}">${escapeHTML(row.concept)}</td><td>${money(row.total/100)}</td><td>${row.status === 'paid' ? '<span class="app-status">Pagado</span>' : `<button class="app-status pending payment-chip" data-payment="${escapeHTML(row.id)}" aria-label="Abonar a ${escapeHTML(row.customer)}. Saldo ${money((row.total-row.paid)/100)}">${status} ↗</button>`}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function chartMarkup(data, state, host) {
  const ratios = state.range === 'semana' ? [.16,.23,.2,.38,.49,.67,1] : [.08,.2,.17,.36,.31,.49,.45,.7,.64,.84,.8,1];
  const values = ratios.map((ratio,index) => [index * 360 / (ratios.length - 1), 65 - ratio * 56]);
  const points = values.map(point => point.join(',')).join(' ');
  const id = `chart-fill-${host.id}`;
  const total = state.range === 'semana' ? data.revenue * .38 : data.revenue;
  const labels = state.range === 'semana' ? ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'] : ['01 nov','07 nov','14 nov','21 nov','30 nov'];
  return `<div class="app-chart"><div class="app-chart-head"><span>${escapeHTML(data.chartLabel)}</span><label><span class="sr-only">Periodo del gráfico</span><select data-chart-range aria-label="Periodo del gráfico"><option value="mes" ${state.range === 'mes' ? 'selected' : ''}>Este mes · demo</option><option value="semana" ${state.range === 'semana' ? 'selected' : ''}>Esta semana · demo</option></select></label></div><div class="chart-graphic"><div class="chart-y-labels"><span>${shortMoney(total)}</span><span>${shortMoney(total / 2)}</span><span>S/ 0</span></div><div class="chart-area"><svg viewBox="0 0 360 72" preserveAspectRatio="none" role="img" aria-label="Gráfico ilustrativo de ${escapeHTML(data.chartLabel.toLowerCase())}. Total del periodo: ${money(total)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".16"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs><path class="chart-grid" d="M0 10H360M0 38H360M0 65H360"/><polygon points="0,72 ${points} 360,72" fill="url(#${id})"/><polyline class="chart-line" points="${points}"/><circle cx="360" cy="9" r="3" fill="var(--accent)" stroke="white" stroke-width="1.5"/></svg><div class="chart-labels">${labels.map(label => `<span>${label}</span>`).join('')}</div></div></div></div>`;
}
function detailMarkup(data) {
  if (data.inventory.length) return `<div class="app-section-heading"><h4>Stock disponible · datos de ejemplo</h4></div><div class="table-scroll"><table class="app-table"><thead><tr><th scope="col">Producto</th><th scope="col">Unidad</th><th scope="col">Stock</th><th scope="col">Estado</th></tr></thead><tbody>${data.inventory.map(product => `<tr><td title="${escapeHTML(product.name)}">${escapeHTML(product.name)}</td><td>${escapeHTML(product.unit)}</td><td class="inventory-quantity">${product.stock.toLocaleString('es-PE',{maximumFractionDigits:2})}</td><td><span class="app-status ${product.stock <= product.threshold ? 'pending' : ''}">${product.stock <= product.threshold ? 'Reponer' : 'Disponible'}</span></td></tr>`).join('')}</tbody></table></div>`;
  const people = new Map();
  data.rows.forEach(row => {
    if (!people.has(row.customer)) people.set(row.customer,{paid:0,pending:0});
    const person = people.get(row.customer); person.paid += row.paid; person.pending += row.total-row.paid;
  });
  return `<div class="app-section-heading"><h4>Alumnos con operaciones de ejemplo</h4></div><div class="table-scroll"><table class="app-table"><thead><tr><th scope="col">Alumno</th><th scope="col">Cobrado</th><th scope="col">Pendiente</th><th scope="col">Estado</th></tr></thead><tbody>${[...people.entries()].map(([name,amounts]) => `<tr><td title="${escapeHTML(name)}">${escapeHTML(name)}</td><td>${money(amounts.paid/100)}</td><td>${money(amounts.pending/100)}</td><td><span class="app-status ${amounts.pending > 0 ? 'pending' : ''}">${amounts.pending > 0 ? 'Por cobrar' : 'Al día'}</span></td></tr>`).join('')}</tbody></table></div>`;
}
function renderApp(host, sector, changes = {}) {
  const previous = appViews.get(host) || {};
  const state = {view:'resumen', filter:'all', range:'mes', ...previous, ...changes, sector};
  appViews.set(host,state);
  const data = demoData[sector];
  const nav = navigation(data, state.view);
  const heading = state.view === 'movimientos' ? 'Tus movimientos' : state.view === 'detalle' ? data.detailLabel : data.title;
  let content;
  if (state.view === 'resumen') content = `${chartMarkup(data,state,host)}<div class="app-section-heading"><h4>Últimos movimientos</h4><button class="app-table-link" data-view="movimientos">Ver todos ↗</button></div>${transactionsTable(data.rows.slice(0,3))}`;
  else if (state.view === 'movimientos') content = `<div class="app-filter" aria-label="Filtrar movimientos">${[{id:'all',label:'Todos'}, {id:'paid',label:'Pagados'}, {id:'pending',label:'Pendientes'}].map(filter => `<button data-filter="${filter.id}" class="${state.filter === filter.id ? 'active' : ''}" aria-pressed="${state.filter === filter.id}">${filter.label}</button>`).join('')}</div>${transactionsTable(data.rows.filter(row => state.filter === 'all' || (state.filter === 'paid' ? row.status === 'paid' : row.status !== 'paid')))}`;
  else content = detailMarkup(data);
  host.innerHTML = `<div class="app-topbar"><div class="app-business"><img src="assets/silmaur-symbol.svg" alt="" width="15" height="15">${escapeHTML(data.name)}</div><div class="app-topbar-right"><span class="demo-badge">DEMO INTERACTIVA</span><span class="app-avatar" aria-label="Perfil de demostración">SD</span></div></div><div class="app-mobile-nav" aria-label="Vistas de la demo">${nav}</div><div class="app-layout"><aside class="app-sidebar" aria-label="Vistas de la demo"><span class="app-sidebar-label">MI NEGOCIO</span>${nav}<div class="app-sidebar-bottom">Hecho con Silmaur<br>Datos ilustrativos</div></aside><div class="app-main"><div class="app-main-heading"><div><h3>${escapeHTML(heading)}</h3><p>Así va tu negocio. Todo en un lugar.</p></div><button class="app-add" data-new-transaction>+ ${escapeHTML(data.primary)}</button></div><div class="app-kpis"><div class="app-kpi"><span>${escapeHTML(data.countLabel)}</span><strong>${data.count}</strong><small>${sector === "ferreteria" ? "Productos por reponer" : sector === "tienda" ? "Disponibles para vender" : "Matrículas de ejemplo"}</small></div><div class="app-kpi featured"><span>${escapeHTML(data.revenueLabel)}</span><strong>${shortMoney(data.revenue)}</strong><small>Acumulado del mes</small></div><div class="app-kpi"><span>Por cobrar</span><strong>${shortMoney(data.pending)}</strong><small>Saldos pendientes</small></div></div>${content}</div></div>`;
}
renderApp($('#hero-app'), selectedSector);

$$('.dashboard-app').forEach(host => {
  host.addEventListener('click', event => {
    const state = appViews.get(host);
    if (!state) return;
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
      renderApp(host, state.sector, {view:viewButton.dataset.view,filter:'all'});
      return;
    }
    const filter = event.target.closest('[data-filter]');
    if (filter) { renderApp(host,state.sector,{filter:filter.dataset.filter}); return; }
    const payment = event.target.closest('[data-payment]');
    if (payment) { openPayment(state.sector,payment.dataset.payment); return; }
    if (event.target.closest('[data-new-transaction]')) openTransaction(state.sector,host);
  });
  host.addEventListener('change', event => {
    if (event.target.matches('[data-chart-range]')) {
      const state = appViews.get(host);
      renderApp(host,state.sector,{range:event.target.value});
      $('[data-chart-range]',host).focus();
    }
  });
});

function selectSector(sector, focus = false) {
  selectedSector = sector;
  $$('.sector-tabs [role=tab]').forEach(button => {
    const active = button.dataset.sector === sector;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });
  $('#hero-app').setAttribute('aria-labelledby', 'tab-' + sector);
  renderApp($('#hero-app'),sector,{view:'resumen',filter:'all'});
}
$$('.sector-tabs [role=tab]').forEach(button => button.addEventListener('click',() => selectSector(button.dataset.sector)));
$('.sector-tabs').addEventListener('keydown',event => {
  const sectors = Object.keys(demoData);
  const current = sectors.indexOf(selectedSector);
  let next;
  if (event.key === 'ArrowRight') next = (current + 1) % sectors.length;
  if (event.key === 'ArrowLeft') next = (current + sectors.length - 1) % sectors.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = sectors.length - 1;
  if (next !== undefined) { event.preventDefault(); selectSector(sectors[next],true); }
});

$$('[data-open-demo]').forEach(button => button.addEventListener('click',() => {
  modalSector = button.dataset.openDemo;
  $('#demo-dialog-title').textContent = demoData[modalSector].name;
  renderApp($('#modal-app'),modalSector,{view:'resumen',range:'mes',filter:'all'});
  openDialog('#demo-dialog');
}));
$('#reset-demo').addEventListener('click',() => {
  engine.resetSector(model,modalSector); refreshDemoState();
  renderApp($('#modal-app'),modalSector,{view:'resumen',filter:'all'});
  if (selectedSector === modalSector) renderApp($('#hero-app'),modalSector);
  toast('Demo reiniciada. Ya puedes volver a probar.');
});
$('#choose-demo').addEventListener('click',() => {
  closeDialog('#demo-dialog');
  const sectorLabel = {academia:'Academia o centro educativo',tienda:'Tienda o moda',ferreteria:'Ferretería'};
  $('#brief-form select[name=sector]').value = sectorLabel[modalSector];
  $('#contacto').scrollIntoView({behavior:'smooth'});
  setTimeout(() => $('#brief-form input[name=name]').focus({preventScroll:true}),500);
});

// Ventas, matrículas y abonos: las mutaciones se realizan en demo-engine.js.
function refreshDemoState() {
  demoData = allDemoViews();
  try { sessionStorage.setItem('silmaur-demo-v3',JSON.stringify(model)); } catch { /* Solo memoria. */ }
  renderApp($('#hero-app'),selectedSector);
  if ($('#demo-dialog').open) renderApp($('#modal-app'),modalSector);
}
function updateOperationTotal() {
  const form = $('#transaction-form'); let total = 0;
  try { total = transactionSector === 'academia' ? engine.minor(form.elements.amount.value || '0') : Math.round(engine.minor(form.elements.price.value || '0')*engine.minor(form.elements.quantity.value || '0')/100); } catch { /* Validación al registrar. */ }
  $('#operation-total').textContent = money(total/100);
  const partial = form.elements.paymentMode.value === 'partial';
  $('#initial-payment-label').hidden = !partial; form.elements.payment.disabled = !partial; form.elements.payment.max = String(total/100);
}
function syncQuantityField() {
  if (transactionSector === 'academia') return;
  const form = $('#transaction-form');
  const product = demoData[transactionSector].inventory.find(item => item.id === form.elements.product.value);
  form.elements.quantity.step = product.unit === 'm' ? '0.01' : '1';
  form.elements.quantity.min = product.unit === 'm' ? '0.01' : '1';
  form.elements.quantity.max = String(product.stock); form.elements.quantity.value = '1';
  form.elements.price.value = product.price.toFixed(2);
  $('#quantity-unit').textContent = `Cantidad (${product.unit})`;
  updateOperationTotal();
}
function openTransaction(sector,host) {
  transactionSector = sector; transactionOrigin = host;
  const form = $('#transaction-form'); form.reset();
  $('#transaction-error').textContent = '';
  $('#transaction-title').textContent = sector === 'academia' ? 'Nueva matrícula de ejemplo' : 'Nueva venta de ejemplo';
  $$('.academy-only',form).forEach(label => { label.hidden = sector !== 'academia'; $$('input',label).forEach(field => { field.disabled = sector !== 'academia'; }); });
  $$('.product-only',form).forEach(label => { label.hidden = sector === 'academia'; $$('input,select',label).forEach(field => { field.disabled = sector === 'academia'; }); });
  if (sector !== 'academia') {
    form.elements.product.innerHTML = demoData[sector].inventory.map(item => `<option value="${item.id}">${escapeHTML(item.name)} · ${item.stock} ${item.unit}</option>`).join('');
    syncQuantityField();
  }
  form.elements.paymentMode.value = 'full'; updateOperationTotal(); openDialog('#transaction-dialog');
}
$('#transaction-form select[name=product]').addEventListener('change',syncQuantityField);
$('#transaction-form').addEventListener('input',updateOperationTotal);
$('#transaction-form').addEventListener('change',updateOperationTotal);
$('#transaction-form').addEventListener('submit',event => {
  event.preventDefault(); const form = event.currentTarget;
  try {
    const row = engine.addOperation(model,transactionSector,{customer:form.elements.customer.value,concept:form.elements.concept.value,total:form.elements.amount.value,product:form.elements.product.value,quantity:form.elements.quantity.value,price:form.elements.price.value,payment:form.elements.paymentMode.value === 'full' ? 'full' : form.elements.paymentMode.value === 'pending' ? '0' : form.elements.payment.value});
    refreshDemoState(); closeDialog('#transaction-dialog'); toast(`Operación registrada: ${money(row.total/100)}. Saldo: ${money((row.total-row.paid)/100)}.`);
  } catch(error) { $('#transaction-error').textContent = error.message; }
});
let paymentSector = 'academia'; let paymentRecord = '';
function openPayment(sector,id) {
  paymentSector = sector; paymentRecord = id;
  const item = model.sectors[sector].records.find(row => row.id === id);
  $('#payment-customer').textContent = item.customer;
  $('#payment-balance').textContent = money((item.total-item.paid)/100);
  const field = $('#payment-form input[name=amount]'); field.value = ((item.total-item.paid)/100).toFixed(2); field.max = String((item.total-item.paid)/100);
  $('#payment-error').textContent = ''; openDialog('#payment-dialog');
}
$('#payment-form').addEventListener('submit',event => {
  event.preventDefault();
  try { const item = engine.addPayment(model,paymentSector,paymentRecord,event.currentTarget.elements.amount.value); refreshDemoState(); closeDialog('#payment-dialog'); toast(`Abono registrado. Saldo: ${money((item.total-item.paid)/100)}.`); }
  catch(error) { $('#payment-error').textContent = error.message; }
});

const menuButton = $('.menu-toggle');
menuButton.addEventListener('click',() => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded',String(open));
  menuButton.setAttribute('aria-label',open ? 'Cerrar menú' : 'Abrir menú');
  $('#main-nav').classList.toggle('open',open);
});
function closeMenu() { menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Abrir menú'); $('#main-nav').classList.remove('open'); }
$$('#main-nav a').forEach(link => link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event => { if(event.key === 'Escape') closeMenu(); });

function updateBriefLink() {
  const number = config.whatsapp.replace(/\D/g,'');
  const link = $('#send-whatsapp');
  link.hidden = !/^\d{8,15}$/.test(number);
  if (!link.hidden) link.href = `https://wa.me/${number}?text=${encodeURIComponent($('#brief-text').value)}`;
  else link.removeAttribute('href');
  $('#brief-result-note').textContent = link.hidden ? 'La solicitud aún no se ha enviado. Puedes copiarla para compartirla.' : 'Revisa tu mensaje. WhatsApp te permitirá elegir cuándo enviarlo.';
}
$('#brief-form').addEventListener('submit',event => {
  event.preventDefault();
  const fields = new FormData(event.currentTarget);
  const name = fields.get('name').trim();
  const business = fields.get('business').trim();
  if (!name || !business) { toast('Completa tu nombre y el nombre de tu negocio.'); return; }
  const needs = fields.getAll('needs');
  $('#brief-text').value = `Hola, ${config.name}. Soy ${name} y mi negocio es ${business}.\n\nRubro: ${fields.get('sector')}.\nQuiero ordenar: ${needs.length ? needs.join(', ') : 'me gustaría recibir orientación'}.` + (fields.get('message').trim() ? `\n\n${fields.get('message').trim()}` : '') + '\n\nMe gustaría conocer una demo y una propuesta para mi negocio.';
  $('#brief-result').hidden = false;
  updateBriefLink();
  $('#brief-result').scrollIntoView({behavior:'smooth',block:'nearest'});
  $('#brief-text').focus({preventScroll:true});
  toast('Tu solicitud está lista para revisar y compartir.');
});
$('#copy-brief').addEventListener('click',async () => {
  const value = $('#brief-text').value;
  try {
    await navigator.clipboard.writeText(value);
    toast('Solicitud copiada. Ya puedes pegarla en tu conversación.');
  } catch {
    $('#brief-text').focus(); $('#brief-text').select();
    toast('Seleccionamos tu solicitud. Usa la opción Copiar de tu dispositivo.');
  }
});

$('#open-customizer').addEventListener('click',() => {
  const form = $('#customizer-form');
  form.elements.brand.value = config.name;
  for (const key of ['headline','headlineAccent','accent','whatsapp','email','description','location']) form.elements[key].value = config[key];
  openDialog('#customizer-dialog');
});
$('#customizer-form').addEventListener('submit',event => {
  event.preventDefault();
  const form = event.currentTarget;
  const number = form.elements.whatsapp.value.replace(/\D/g,'');
  if (number && !/^\d{8,15}$/.test(number)) { toast('Revisa el WhatsApp e incluye el código de país.'); return; }
  const name = form.elements.brand.value.trim();
  const headline = form.elements.headline.value.trim();
  const headlineAccent = form.elements.headlineAccent.value.trim();
  if (!name || !headline || !headlineAccent) { toast('Completa la marca y las dos líneas del titular.'); return; }
  config = {...config,name,headline,headlineAccent,accent:form.elements.accent.value,whatsapp:number,email:form.elements.email.value.trim(),description:form.elements.description.value.trim(),location:form.elements.location.value.trim()};
  let saved = true;
  try { localStorage.setItem('silmaur-site-preview-v1',JSON.stringify(config)); } catch { saved = false; }
  applyConfig();
  closeDialog('#customizer-dialog');
  toast(saved ? 'Vista personalizada. Los cambios se guardaron en este navegador.' : 'Vista personalizada para esta visita.');
});
$('#reset-customizer').addEventListener('click',() => {
  config = {...defaults};
  try { localStorage.removeItem('silmaur-site-preview-v1'); } catch { /* Sin persistencia. */ }
  applyConfig();
  closeDialog('#customizer-dialog');
  toast('Se restauró la vista original.');
});

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    });
  }, {threshold:.08});
  $$('.reveal').forEach(element => observer.observe(element));
}
