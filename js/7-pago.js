/* 7. Pago (simulado) y confirmación */
'use strict';

/* mejor descuento único: primera reserva, entre semana o código promocional */
function computeDiscount(o){
  o=o||{}; const u=Session.user();
  const prev=u?Reservas.all().filter(r=>r.buyerEmail===u.email&&r.estado!=='cancelado'&&r.estado!=='rechazado').length:0;
  const first=!u||prev===0;
  const c=[];
  if(first) c.push({pct:10,label:'Oferta: 10 % primera reserva'});
  if(o.fecha){const d=parseISO(o.fecha).getDay(); if(d>=1&&d<=3) c.push({pct:15,label:'Oferta: 15 % entre semana'});}
  const code=(o.code||'').trim().toUpperCase();
  if(code==='SABOR20'&&first) c.push({pct:20,label:'Código SABOR20 (20 %)',code});
  if(code==='NEQUI5'&&o.metodo==='nequi') c.push({pct:5,label:'Código NEQUI5 (5 %)',code});
  c.sort((a,b)=>b.pct-a.pct);
  return c[0]||{pct:0,label:''};
}
function codeMsg(code,o){
  code=(code||'').trim().toUpperCase(); if(!code) return '';
  const u=Session.user(); const prev=u?Reservas.all().filter(r=>r.buyerEmail===u.email&&r.estado!=='cancelado'&&r.estado!=='rechazado').length:0;
  if(code==='SABOR20') return prev===0?'ok:Código SABOR20 aplicado.':'err:SABOR20 es solo para tu primera reserva.';
  if(code==='NEQUI5') return o.metodo==='nequi'?'ok:Código NEQUI5 aplicado.':'err:NEQUI5 solo sirve si pagas con Nequi.';
  return 'err:Ese código no existe.';
}
const luhn=n=>{let s=0,alt=false;for(let i=n.length-1;i>=0;i--){let d=+n[i];if(alt){d*=2;if(d>9)d-=9;}s+=d;alt=!alt;}return n.length>=13&&s%10===0;};

const METODOS=[
  ['tarjeta','Tarjeta de crédito o débito','Visa, Mastercard, American Express','VISA','#0D3B1E'],
  ['nequi','Nequi','Paga desde tu celular','N','#E35B1F'],
  ['paypal','PayPal','Con tu cuenta de PayPal','PP','#456D1B'],
  ['transfer','Transferencia bancaria','Bancolombia / Davivienda','$','#F39C12']
];
let _pay={cur:'USD',metodo:'tarjeta',code:''};

function renderPago(){
  const b=sess.get('booking',null);
  if(!requireLogin('/pago','comprador')) return;
  const c=b&&chefById(b.chefId);
  if(!c||!b.fecha||!b.hora){toast('Primero elige un chef, la fecha y la hora.');go('/resultados');return;}
  drawPago(c,b);
}
function drawPago(c,b){
  const dsc=computeDiscount({fecha:b.fecha,guests:b.guests,code:_pay.code,metodo:_pay.metodo});
  const bd=breakdown(c.price,b.guests,dsc.pct), cur=_pay.cur, M=v=>money(v,cur);
  const cm=codeMsg(_pay.code,{metodo:_pay.metodo});
  const body={
    tarjeta:'<div class="cardbox"><div class="a"><input id="cn" inputmode="numeric" autocomplete="cc-number" placeholder="Número de tarjeta" maxlength="23"></div><div class="b"><input id="ce" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"><input id="cv" inputmode="numeric" autocomplete="cc-csc" placeholder="CVV" maxlength="4"></div></div><label class="field"><span>Nombre en la tarjeta</span><input id="cname" autocomplete="cc-name"></label><label class="field"><span>País o región</span><select id="cpais">'+COUNTRIES.map(p=>'<option>'+p+'</option>').join('')+'</select></label>',
    nequi:'<label class="field"><span>Celular con Nequi</span><input id="nq" inputmode="numeric" maxlength="10" placeholder="3001234567"></label><p class="hint">Te llegará la solicitud de pago a la app de Nequi (simulado en esta versión).</p>',
    paypal:'<label class="field"><span>Correo de PayPal</span><input id="pp" type="email" placeholder="tucorreo@ejemplo.com"></label>',
    transfer:'<div class="codebox"><b>Datos para transferir</b><br>Banco: Bancolombia (ejemplo)<br>Cuenta de ahorros: 000-000000-00<br>A nombre de: Sabor Caribeño S.A.S.<br>Referencia: tu correo</div><label class="up" id="uptr"><input type="file" id="trf" accept="image/*,application/pdf"><b>Subir comprobante (opcional)</b><small>Solo guardamos el nombre del archivo</small></label>'
  };
  $('#app').innerHTML=
   '<div class="wrap" style="padding-top:26px"><a href="javascript:history.back()" style="font-weight:700;text-decoration:none;color:var(--ink)">&larr; Volver</a><h1 style="font-size:34px;margin:10px 0 0">Confirma y paga</h1></div>'+
   '<div class="pay"><div class="l">'+
   '<div class="pc"><h2>Tu reserva</h2><div class="kv"><span>Fecha</span><span>'+fmtLong(b.fecha)+'</span></div><div class="kv"><span>Hora</span><span>'+fmtHour(b.hora)+'</span></div><div class="kv"><span>Comensales</span><span>'+b.guests+'</span></div><div class="kv"><span>Dirección</span><span>'+esc(b.direccion)+'</span></div>'+
   '<label class="field" style="margin-top:12px"><span>Alergias o notas para el chef (opcional)</span><textarea id="pn" maxlength="240">'+esc(b.notas||'')+'</textarea></label><a class="linkbtn" href="#/chef/'+c.id+'">Cambiar</a></div>'+
   '<div class="pc"><h2>Elige cómo pagar</h2><div class="cur" role="group" aria-label="Moneda">'+['USD','EUR','COP'].map(k=>'<button data-act="cur" data-cur="'+k+'" class="'+(cur===k?'on':'')+'">'+k+'</button>').join('')+'</div>'+
   METODOS.map(m=>'<div class="pm"><label><input type="radio" name="pm" value="'+m[0]+'" data-act="metodo" data-m="'+m[0]+'"'+(_pay.metodo===m[0]?' checked':'')+'><span class="logo2" style="background:'+m[4]+(m[4]==='#F39C12'?';color:#14261a':'')+'">'+m[3]+'</span><span class="t"><b>'+m[1]+'</b><small>'+m[2]+'</small></span></label>'+(_pay.metodo===m[0]?'<div class="body">'+body[m[0]]+'</div>':'')+'</div>').join('')+
   '<div class="sim">Pago simulado: esta versión de prueba no cobra ni guarda datos de tarjeta.</div></div>'+
   '<div class="pc"><h2>Código promocional</h2><div class="row"><input class="in" id="pcode" placeholder="Ej. SABOR20" value="'+esc(_pay.code)+'" style="text-transform:uppercase"><button class="ghostbtn" data-act="aplicar" style="flex:none">Aplicar</button></div>'+(cm?'<div class="'+(cm.startsWith('ok')?'ok':'err')+'" style="margin:8px 0 0">'+esc(cm.slice(3))+'</div>':'')+'</div>'+
   '<label class="check"><input type="checkbox" id="pterm"> Acepto los términos del servicio y autorizo que el chef llegue a la dirección indicada.</label><div id="perr" class="err" role="alert"></div>'+
   '<button class="btn block" data-act="pagar" style="max-width:420px">Pagar y confirmar · '+M(bd.total)+'</button></div>'+
   '<div class="r"><div class="sum"><div class="top2"><div style="width:84px;height:70px;border-radius:12px;background-size:cover;background-position:center;background-image:'+bgOf(c.fotos&&c.fotos[0],0)+'"></div><div><b>Cena con '+esc(c.name)+'</b><div class="muted" style="font-size:14px">★ '+ratingTxt(c)+' · '+esc(c.zone)+'</div></div></div>'+
   '<div class="prot">Tu dinero está protegido hasta que el chef acepte.</div>'+
   '<div class="bd-row"><span>Menú ('+b.guests+' × '+M(c.price)+')</span><span>'+M(bd.menu)+'</span></div><div class="bd-row"><span>Ingredientes y transporte</span><span>'+M(bd.ingr)+'</span></div><div class="bd-row"><span>Tarifa de servicio</span><span>'+M(bd.svc)+'</span></div>'+(bd.desc?'<div class="bd-row disc"><span>'+esc(dsc.label)+'</span><span>−'+M(bd.desc)+'</span></div>':'')+'<div class="bd-row tot"><span>Total ('+cur+')</span><span>'+M(bd.total)+'</span></div>'+(b.guests>=6?'<div class="hint" style="margin-top:8px">Postre por la casa para tu grupo.</div>':'')+'</div></div></div>';
  const tr=$('#trf'); if(tr) tr.addEventListener('change',()=>{const f=tr.files[0];$('#uptr').classList.toggle('has',!!f);if(f)$('#uptr b').textContent=f.name;});
  const cn=$('#cn'); if(cn) cn.addEventListener('input',()=>{cn.value=cn.value.replace(/\D/g,'').slice(0,19).replace(/(.{4})/g,'$1 ').trim();});
  const ce=$('#ce'); if(ce) ce.addEventListener('input',()=>{let v=ce.value.replace(/\D/g,'').slice(0,4);if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);ce.value=v;});
  const keep=()=>{const n=$('#pn');if(n){b.notas=n.value;sess.set('booking',b);}};
  const n=$('#pn'); if(n) n.addEventListener('input',keep);
}
function _redraw(){const b=sess.get('booking');const c=b&&chefById(b.chefId);const n=$('#pn');if(n&&b){b.notas=n.value;sess.set('booking',b);}if(c)drawPago(c,b);}
ACT.cur=el=>{_pay.cur=el.dataset.cur;_redraw();};
ACT.metodo=el=>{_pay.metodo=el.dataset.m;_redraw();};
ACT.aplicar=()=>{_pay.code=($('#pcode').value||'').trim().toUpperCase();_redraw();};
ACT.pagar=()=>{
  const b=sess.get('booking'), c=b&&chefById(b.chefId), u=Session.user(); if(!c||!u) return;
  const e=$('#perr'); e.textContent='';
  const m=_pay.metodo;
  if(m==='tarjeta'){
    const num=($('#cn').value||'').replace(/\s/g,''), ex=$('#ce').value, cv=$('#cv').value, nm=$('#cname').value.trim();
    if(!luhn(num)) return e.textContent='El número de tarjeta no es válido.';
    const mm=/^(\d\d)\/(\d\d)$/.exec(ex); const now=new Date();
    if(!mm||+mm[1]<1||+mm[1]>12||(2000+ +mm[2])*12+ +mm[1]<now.getFullYear()*12+now.getMonth()+1) return e.textContent='La fecha de vencimiento no es válida.';
    if(!/^\d{3,4}$/.test(cv)) return e.textContent='El CVV debe tener 3 o 4 dígitos.';
    if(nm.length<3) return e.textContent='Escribe el nombre que aparece en la tarjeta.';
  }
  if(m==='nequi'&&!/^3\d{9}$/.test(($('#nq').value||'').trim())) return e.textContent='Escribe un celular Nequi de 10 dígitos que empiece por 3.';
  if(m==='paypal'&&!validEmail(($('#pp').value||'').trim())) return e.textContent='Escribe un correo de PayPal válido.';
  if(!$('#pterm').checked) return e.textContent='Debes aceptar los términos para continuar.';
  if(!chefAvailable(c,b.fecha,b.hora)) return e.textContent='Ese horario acaba de ocuparse. Elige otra hora.';
  const notas=($('#pn').value||'').trim();
  const dsc=computeDiscount({fecha:b.fecha,guests:b.guests,code:_pay.code,metodo:m});
  const bd=breakdown(c.price,b.guests,dsc.pct);
  const r={id:'R'+Date.now().toString(36).toUpperCase(),chefId:c.id,chefName:c.name,chefEmail:c.email||'',buyerEmail:u.email,buyerName:u.nombre,buyerPhone:u.telefono||'',
    fecha:b.fecha,hora:b.hora,guests:b.guests,direccion:b.direccion,notas,moneda:_pay.cur,metodo:m,totalUSD:bd.total,total:Math.round(bd.total*RATES[_pay.cur]*100)/100,
    oferta:dsc.pct?dsc.label:'',descuentoUSD:bd.desc,codigo:dsc.code||'',estado:'pendiente',creada:new Date().toISOString()};
  Reservas.add(r);
  enviarASheets({tipo:'reserva',id:r.id,chef:c.name,comprador:u.nombre,correo:u.email,telefono:r.buyerPhone,fecha:r.fecha,hora:r.hora,comensales:r.guests,direccion:r.direccion,alergias:notas,metodo:m,moneda:r.moneda,total:r.total,oferta:r.oferta,codigo:r.codigo,estado:r.estado});
  sess.del('booking'); _pay={cur:_pay.cur,metodo:'tarjeta',code:''};
  go('/confirmado/'+r.id);
};
function renderConfirmado(p){
  const r=Reservas.byId(p.id); if(!r){go('/reservas');return;}
  $('#app').innerHTML='<div class="wrap" style="max-width:640px;padding:48px 0"><div class="panel" style="text-align:center"><img src="assets/logo-icono.svg" alt="" width="84" height="84"><h1 style="font-size:34px;margin:6px 0 8px">¡Reserva enviada!</h1><p class="muted">'+esc(r.chefName)+' recibirá tu solicitud y te confirmará pronto. Código de reserva: <b>'+esc(r.id)+'</b></p>'+
   '<div class="box" style="text-align:left"><div class="kv"><span>Fecha</span><span>'+fmtLong(r.fecha)+' · '+fmtHour(r.hora)+'</span></div><div class="kv"><span>Comensales</span><span>'+r.guests+'</span></div><div class="kv"><span>Dirección</span><span>'+esc(r.direccion)+'</span></div><div class="kv"><span>Total</span><span>'+money(r.totalUSD,r.moneda)+'</span></div>'+(r.oferta?'<div class="kv"><span>Descuento</span><span>'+esc(r.oferta)+'</span></div>':'')+'</div>'+
   '<a class="btn" href="#/reservas">Ver mis reservas</a> <a class="ghostbtn" href="#/">Volver al inicio</a></div></div>';
}
route('/pago',renderPago);
route('/confirmado/:id',renderConfirmado);
