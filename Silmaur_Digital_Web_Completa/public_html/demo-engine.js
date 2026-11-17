/** Motor de demostración. Importes en céntimos, cantidades en centésimas.
 * No realiza pagos ni peticiones de red. Puede probarse también con Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SilmaurDemo = api;
})(globalThis, function () {
  'use strict';
  const VERSION = 3;
  const clone = value => JSON.parse(JSON.stringify(value));

  function minor(value, label = 'importe') {
    const text = String(value).trim().replace(',', '.');
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) throw new Error(`Revisa el ${label}. Usa hasta dos decimales.`);
    const [whole, fraction = ''] = text.split('.');
    const result = Number(whole)*100 + Number(fraction.padEnd(2,'0'));
    if (!Number.isSafeInteger(result) || result > 100000000) throw new Error(`El ${label} supera el límite de la demo.`);
    return result;
  }
  function clean(value, label, max = 100) {
    const text = String(value || '').trim();
    if (!text || text.length > max) throw new Error(`Completa ${label} (máximo ${max} caracteres).`);
    return text;
  }
  function row(id, customer, concept, total, paid) {
    return {id,customer,concept,total:minor(total),paid:minor(paid)};
  }
  const seeds = {
    academia: {
      name:'Academia Impulso',label:'Academia',title:'Tu academia, en una mirada.',primary:'Nueva matrícula',countLabel:'Alumnos activos',people:124,revenueLabel:'Cobrado',chartLabel:'Cobros del periodo',detailLabel:'Alumnos',detailIcon:'users',
      records:[row('a1','María Alarcón','Ciclo regular',1440,1440),row('a2','Luis Mendoza','Ciclo intensivo',780,500),row('a3','Ana Torres','Ciclo regular',1260,1260),row('a4','Diego Ramos','Matrícula intensivo',240,0),row('a5','Sofía Vega','Preparación anual',1750,1750),row('a6','Mateo Ríos','Preparación anual',1800,1000),row('a7','Camila León','Ciclo y materiales',2710,2470)],inventory:[]
    },
    tienda: {
      name:'NENA STORE',label:'Tienda',title:'Tu tienda, al día.',primary:'Nueva venta',countLabel:'Prendas en stock',revenueLabel:'Ventas cobradas',chartLabel:'Ventas cobradas',detailLabel:'Inventario',detailIcon:'box',
      records:[row('t1','Lucía Ramírez','Blusa de lino',89,89),row('t2','Carla Muñoz','Vestido de temporada',149,0),row('t3','Elena Silva','Pantalón clásico',119,119),row('t4','Rosa López','Blusa de lino',89,0),row('t5','Andrea Salas','Pedido de prendas',900,600),row('t6','Diana Paredes','Pedido de temporada',2874,2672)],
      inventory:[{id:'blusa',name:'Blusa de lino',unit:'unid.',stock:1800,threshold:500,price:8900},{id:'vestido',name:'Vestido de temporada',unit:'unid.',stock:600,threshold:500,price:14900},{id:'pantalon',name:'Pantalón clásico',unit:'unid.',stock:300,threshold:500,price:11900}]
    },
    ferreteria: {
      name:'EL MAESTRO',label:'Ferretería',title:'Tu ferretería, bajo control.',primary:'Nueva venta',countLabel:'Stock crítico',revenueLabel:'Ventas cobradas',chartLabel:'Ventas cobradas',detailLabel:'Inventario',detailIcon:'box',
      records:[row('f1','Javier Pérez','Cable eléctrico · 8.5 m',68,68),row('f2','Pedro Salas','Tornillos · 50 unid.',25,0),row('f3','Marta Rojas','Cemento · 4 bolsas',124,124),row('f4','José Flores','Cable eléctrico · 15 m',120,60),row('f5','Constructora del Sur','Materiales de obra',14763,12498)],
      inventory:[{id:'tornillo',name:'Tornillo autorroscante',unit:'unid.',stock:24000,threshold:5000,price:50},{id:'cable',name:'Cable eléctrico',unit:'m',stock:8550,threshold:2000,price:800},{id:'cemento',name:'Cemento',unit:'bolsas',stock:400,threshold:1000,price:3100}]
    }
  };
  function createState() { return {version:VERSION,nextId:1,sectors:clone(seeds)}; }
  function sectorOf(state, sector) {
    if (!Object.hasOwn(seeds,sector)) throw new Error('Elige un rubro válido.');
    return state.sectors[sector];
  }
  function summary(state,sector) {
    const data = sectorOf(state,sector);
    return {
      paid:data.records.reduce((sum,item)=>sum+item.paid,0),
      pending:data.records.reduce((sum,item)=>sum+item.total-item.paid,0),
      total:data.records.reduce((sum,item)=>sum+item.total,0),
      count:sector==='academia'?data.people:sector==='tienda'?data.inventory.reduce((sum,item)=>sum+item.stock,0)/100:data.inventory.filter(item=>item.stock<=item.threshold).length
    };
  }
  function addOperation(state,sector,input) {
    const data=sectorOf(state,sector);
    if(data.records.length>=250) throw new Error('Reinicia la demo para seguir probando.');
    const customer=clean(input.customer,'el cliente o alumno',60);
    let total,concept,product,quantity;
    if(sector==='academia') {
      concept=clean(input.concept,'el concepto',90);total=minor(input.total);
    } else {
      product=data.inventory.find(item=>item.id===input.product);
      if(!product) throw new Error('Elige un producto válido.');
      quantity=minor(input.quantity,'número de unidades');
      if(quantity<=0 || (product.unit!=='m' && quantity%100!==0)) throw new Error('Los productos por unidad requieren una cantidad entera mayor a cero.');
      if(quantity>product.stock) throw new Error(`Stock insuficiente: quedan ${product.stock/100} ${product.unit}`);
      total=Math.round(minor(input.price,'precio unitario')*quantity/100);
      concept=`${product.name} · ${quantity/100} ${product.unit}`;
    }
    if(total<=0 || total>100000000) throw new Error('El total debe ser mayor a cero y no superar S/ 1,000,000.');
    const paid=input.payment==='full'?total:minor(input.payment||'0','pago recibido');
    if(paid>total) throw new Error('El pago recibido no puede superar el total.');
    // Mutar únicamente después de validar toda la operación.
    const result={id:`demo-${state.nextId++}`,customer,concept,total,paid};
    if(product) product.stock-=quantity; else data.people+=1;
    data.records.unshift(result);return result;
  }
  function addPayment(state,sector,id,amount) {
    const item=sectorOf(state,sector).records.find(record=>record.id===id);
    if(!item) throw new Error('No se encontró la operación.');
    const paid=minor(amount,'abono');
    if(paid<=0 || paid>item.total-item.paid) throw new Error('El abono debe ser mayor a cero y no superar el saldo pendiente.');
    item.paid+=paid;return item;
  }
  function resetSector(state,sector) {sectorOf(state,sector);state.sectors[sector]=clone(seeds[sector]);}
  function restore(value) {
    try {
      if(!value || value.version!==VERSION || !Number.isSafeInteger(value.nextId) || value.nextId<1 || value.nextId>1000000) throw new Error();
      const restored=createState();restored.nextId=value.nextId;
      for(const sector of Object.keys(seeds)) {
        const data=sectorOf(value,sector);
        if(!Array.isArray(data.records)||data.records.length>250||!Array.isArray(data.inventory)||data.inventory.length!==seeds[sector].inventory.length) throw new Error();
        for(const record of data.records) {
          clean(record.customer,'el cliente',60);clean(record.concept,'el concepto',150);
          if(typeof record.id!=='string'||!Number.isSafeInteger(record.total)||!Number.isSafeInteger(record.paid)||record.paid<0||record.paid>record.total||record.total<=0||record.total>100000000) throw new Error();
        }
        if(new Set(data.records.map(item=>item.id)).size!==data.records.length) throw new Error();
        const inventory=seeds[sector].inventory.map((product,index)=>{
          const supplied=data.inventory[index];
          if(supplied.id!==product.id||!Number.isSafeInteger(supplied.stock)||supplied.stock<0||supplied.stock>100000000) throw new Error();
          return {...product,stock:supplied.stock};
        });
        if(sector==='academia'&&(!Number.isSafeInteger(data.people)||data.people<0||data.people>10000)) throw new Error();
        restored.sectors[sector]={...restored.sectors[sector],records:data.records.map(item=>({id:item.id,customer:item.customer,concept:item.concept,total:item.total,paid:item.paid})),inventory,...(sector==='academia'?{people:data.people}:{})};
      }
      return restored;
    } catch {return createState();}
  }
  function view(state,sector) {
    const data=sectorOf(state,sector);const totals=summary(state,sector);
    return {...data,count:totals.count,revenue:totals.paid/100,pending:totals.pending/100,rows:data.records.map(item=>({...item,amount:item.total/100,status:item.paid===item.total?'paid':item.paid>0?'partial':'pending'})),inventory:data.inventory.map(item=>({...item,stock:item.stock/100,threshold:item.threshold/100,price:item.price/100}))};
  }
  function csv(state,sector) {
    const escape=text=>{let value=String(text);if(/^[=+@\-\t\r]/.test(value))value="'"+value;return '"'+value.replace(/"/g,'""')+'"';};
    const rows=[['Cliente / alumno','Concepto','Total PEN','Cobrado PEN','Pendiente PEN'],...sectorOf(state,sector).records.map(item=>[item.customer,item.concept,(item.total/100).toFixed(2),(item.paid/100).toFixed(2),((item.total-item.paid)/100).toFixed(2)])];
    return '\uFEFF'+rows.map(line=>line.map(escape).join(';')).join('\r\n');
  }
  return Object.freeze({createState,summary,addOperation,addPayment,resetSector,restore,view,csv,minor,VERSION});
});
