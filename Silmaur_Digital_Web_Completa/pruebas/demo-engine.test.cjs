const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../public_html/demo-engine.js');

test('totales académicos coherentes con el detalle',()=>{
  const result=engine.summary(engine.createState(),'academia');
  assert.equal(result.total,998000);assert.equal(result.paid,842000);assert.equal(result.pending,156000);
});
test('venta decimal y abono completo sin volver a descontar stock',()=>{
  const state=engine.createState();const before=engine.summary(state,'ferreteria');
  const row=engine.addOperation(state,'ferreteria',{customer:'Prueba',product:'cable',quantity:'1.25',price:'8.50',payment:'4'});
  assert.equal(row.total,1063);assert.equal(row.paid,400);assert.equal(state.sectors.ferreteria.inventory[1].stock,8425);
  engine.addPayment(state,'ferreteria',row.id,'6.63');
  assert.equal(state.sectors.ferreteria.inventory[1].stock,8425);
  const after=engine.summary(state,'ferreteria');assert.equal(after.paid-before.paid,1063);assert.equal(after.pending,before.pending);
});
test('abono reduce deuda y no crea otra venta',()=>{
  const state=engine.createState();engine.addPayment(state,'academia','a2','100');
  assert.equal(engine.summary(state,'academia').pending,146000);assert.equal(state.sectors.academia.records.length,7);
});
test('validaciones no alteran la operación ni el stock',()=>{
  const state=engine.createState();const original=JSON.stringify(state);
  for(const input of [{quantity:'1.2',price:'0.50',payment:'0'},{quantity:'241',price:'0.50',payment:'0'},{quantity:'1',price:'0.50',payment:'1'},{quantity:'1',price:'NaN',payment:'0'}])assert.throws(()=>engine.addOperation(state,'ferreteria',{customer:'Prueba',product:'tornillo',...input}));
  assert.throws(()=>engine.addPayment(state,'academia','a2','280.01'));assert.equal(JSON.stringify(state),original);
});
test('CSV seguro y reinicio de datos',()=>{
  const state=engine.createState();engine.addOperation(state,'academia',{customer:'=SUM(1)',concept:'Prueba',total:'10',payment:'0'});
  assert.match(engine.csv(state,'academia'), /'=SUM\(1\)/);engine.resetSector(state,'academia');assert.equal(engine.summary(state,'academia').pending,156000);
});
test('sesión válida y recuperación ante datos inválidos',()=>{
  const state=engine.createState();engine.addPayment(state,'academia','a2','25');
  assert.equal(engine.summary(engine.restore(JSON.parse(JSON.stringify(state))),'academia').pending,153500);
  state.sectors.academia.records[0].paid=-1;assert.equal(engine.summary(engine.restore(state),'academia').pending,156000);
});
