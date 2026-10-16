/* 6. Perfil del chef y tarjeta de reserva */
'use strict';

function renderPerfil(p){
  const c=chefById(p.id);
  if(!c){$('#app').innerHTML='<div class="wrap sec"><div class="empty"><b>No encontramos a este chef.</b><p><a href="#/">Volver al inicio</a></p></div></div>';return;}
  const city=cityById(c.city), ref=refPoint(c.city), u=Session.user();
  const mine=!!(u&&u.rol==='chef'&&c.email===u.email);
  const s=Search.get(), draft=sess.get('booking',{});
  const fecha=(draft.chefId===c.id&&draft.fecha)||s.date||'';
  const hora=(draft.chefId===c.id&&draft.hora)||s.time||'';
  const guests=(draft.chefId===c.id&&draft.guests)||s.guests||2;
  const dir=(draft.chefId===c.id&&draft.direccion)||'';
  const fotos=c.fotos||[]; const ph=i=>fotos.length?fotos[i%fotos.length]:null;
  const tile=i=>'<div'+(i===0?' class="big"':'')+(ph(i)?' data-act="zoom" data-i="'+(i%fotos.length)+'" data-set="chef"':'')+' style="background-image:'+bgOf(ph(i),i)+'">'+(i===0&&!fotos[0]?'<div style="width:180px;height:180px;border-radius:50%;border:4px solid rgba(255,255,255,.7);margin:auto;position:relative;top:calc(50% - 90px)"></div>':'')+'</div>';
  const reviews=c.allReviews||[];
  const avail=chefAvailable(c,fecha,hora);
  $('#app').innerHTML=
   '<div class="wrap" style="padding-top:26px"><a href="javascript:history.back()" style="font-weight:700;text-decoration:none;color:var(--ink)">&larr; Volver</a>'+
   '<div class="pf-hd" style="margin-top:14px"><div class="av">'+avatar(c.foto,104,c.name)+'<b aria-label="Verificado">✓</b></div><div><h1>'+esc(c.name)+', chef caribeña en '+esc(city.name.split(',')[0])+'</h1><div class="muted">★ '+ratingTxt(c)+' · '+reviews.length+' reseñas · '+esc(c.zone)+', '+esc(city.name.split(',')[0])+' · '+esc(c.dishes.join(', '))+'</div></div></div>'+
   '<div class="gal">'+[0,1,2,3,4].map(tile).join('')+'</div>'+
   '<div class="cols"><div class="l">'+
     '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px"><span class="badge">✓ Identidad verificada</span><span class="badge'+(c.verified===false?' warn':'')+'">'+(c.verified===false?'Certificación en revisión':'✓ Certificación culinaria')+'</span><span class="badge">✓ Pago seguro</span></div>'+
     '<h2 style="font-size:24px;margin-bottom:8px">Sobre '+(c.name.split(' ')[0])+'</h2><p class="muted" style="margin:0 0 20px;font-size:16px;line-height:1.6">'+esc(c.bio||'')+'</p>'+
     '<div class="box"><div class="kv"><span>Años de experiencia</span><span>'+esc(c.years)+'</span></div><div class="kv"><span>Certificación</span><span>'+esc(c.cert||'—')+'</span></div><div class="kv"><span>Horario de atención</span><span>'+fmtHour(c.hours.from)+' – '+fmtHour(c.hours.to)+'</span></div></div>'+
     '<h2 style="font-size:24px;margin-bottom:12px">Publicaciones</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px">'+[0,1,2].map(i=>'<div'+(ph(i+1)?' data-act="zoom" data-i="'+((i+1)%fotos.length)+'" data-set="chef"':'')+' style="height:130px;border-radius:14px;background-size:cover;background-position:center;background-image:'+bgOf(ph(i+1),i)+'"></div>').join('')+'</div>'+
     '<h2 style="font-size:24px;margin-bottom:12px">Reseñas</h2>'+(reviews.length?reviews.map(r=>'<div class="rev">'+avatarSVG(44,'Comensal')+'<div><b style="font-size:15px">'+esc(r.n)+'</b> <span class="stars">'+'★'.repeat(r.s)+'</span><div class="muted" style="font-size:15px;margin-top:2px">'+esc(r.t)+'</div></div></div>').join(''):'<p class="muted">Todavía no tiene reseñas.</p>')+
     '<div id="revform"></div>'+
   '</div><div class="r">'+
   (mine?'<div class="panel"><h2 style="font-size:20px">Este es tu perfil público</h2><p class="muted">Así lo ven los comensales.</p><a class="btn block" href="#/mi-perfil">Editar mi perfil</a></div>':bookCard(c,ref,fecha,hora,guests,dir,avail))+
   '<a class="ghostbtn block" style="margin-top:14px" href="https://wa.me/'+esc((c.wa||'').replace(/\D/g,''))+'" target="_blank" rel="noopener">Contactar por WhatsApp</a>'+
   '<div style="margin-top:12px;text-align:center;font-size:14px"><button class="linkbtn" style="color:var(--flame-d)" data-act="report" data-id="'+c.id+'">Reportar a este chef</button></div>'+
   '</div></div></div>';
  window._lbSet=fotos.slice();
  if(!mine) bindBook(c,ref);
  reviewForm(c);
}
function bookCard(c,ref,fecha,hora,guests,dir,avail){
  const hoursOpts=HOURS.filter(h=>mins(h)>=mins(c.hours.from)&&mins(h)<=mins(c.hours.to));
  return '<div class="book"><div class="pr"><b>'+money(c.price)+'</b> por persona</div>'+
   '<div class="bx"><div class="two"><label><span>Fecha</span><input type="date" id="bf" min="'+todayISO()+'" value="'+esc(fecha)+'"></label><label><span>Hora</span><select id="bh"><option value="">Elige hora</option>'+hoursOpts.map(h=>'<option value="'+h+'"'+(h===hora?' selected':'')+'>'+fmtHour(h)+'</option>').join('')+'</select></label></div>'+
   '<label><span>Comensales</span><select id="bg">'+Array.from({length:12},(_,i)=>i+1).map(n=>'<option value="'+n+'"'+(n===+guests?' selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
   '<label><span>Dirección donde llegará el chef</span><input id="bd" maxlength="120" placeholder="Calle, número, ciudad" value="'+esc(dir)+'" autocomplete="street-address"></label></div>'+
   '<div class="eta" style="display:block;border-radius:14px;padding:12px 16px;margin-bottom:14px">'+(ref.real?'<span style="display:flex;align-items:center;gap:8px;font-size:16px">'+ICON_PIN+'Llega a tu ubicación en ~'+etaMin(c,ref)+' min</span><span style="display:block;font-size:13px;font-weight:400;color:var(--muted);margin-top:2px">Estimado según la distancia a tu ubicación actual; se actualiza si te mueves.</span>':'<span style="display:flex;align-items:center;gap:8px;font-size:15px">'+ICON_PIN+'Tiempo de llegada: activa tu ubicación</span><span style="display:block;font-size:13px;font-weight:400;color:var(--muted);margin-top:2px"><button class="linkbtn" data-act="geoon2">Usar mi ubicación</button></span>')+'</div>'+
   '<div id="bmsg" class="err" role="alert"></div>'+
   '<button class="btn block" id="bgo"'+(avail?'':' disabled')+'>Reservar</button>'+
   '<div id="bnote" class="hint" style="text-align:center;margin:10px 0 14px">'+(avail?'Aún no se te cobra nada':'Este chef no está libre en esa fecha y hora.')+'</div>'+
   '<div id="bprice"></div></div>';
}
function bindBook(c,ref){
  const f=$('#bf'),h=$('#bh'),g=$('#bg'),d=$('#bd'),go_=$('#bgo');
  const read=()=>({chefId:c.id,fecha:f.value,hora:h.value,guests:+g.value,direccion:d.value.trim(),notas:Search.get().notes||''});
  const upd=()=>{
    const b=read(); sess.set('booking',b); Search.set({date:b.fecha||null,time:b.hora||null,guests:b.guests});
    const ok=chefAvailable(c,b.fecha,b.hora); go_.disabled=!ok; $('#bnote').textContent=ok?'Aún no se te cobra nada':'Este chef no está libre en esa fecha y hora.';
    const dsc=computeDiscount({fecha:b.fecha,guests:b.guests}); const bd=breakdown(c.price,b.guests,dsc.pct);
    $('#bprice').innerHTML='<div class="bd-row"><span>Menú ('+b.guests+' × '+money(c.price)+')</span><span>'+money(bd.menu)+'</span></div><div class="bd-row"><span>Ingredientes y transporte</span><span>'+money(bd.ingr)+'</span></div><div class="bd-row"><span>Tarifa de servicio</span><span>'+money(bd.svc)+'</span></div>'+(bd.desc?'<div class="bd-row disc"><span>'+esc(dsc.label)+'</span><span>−'+money(bd.desc)+'</span></div>':'')+'<div class="bd-row tot"><span>Total</span><span>'+money(bd.total)+'</span></div>'+(b.guests>=6?'<div class="hint" style="margin-top:8px">Con '+b.guests+' comensales el postre va por la casa.</div>':'');
  };
  [f,h,g,d].forEach(x=>x.addEventListener('input',upd)); upd();
  go_.addEventListener('click',()=>{
    const b=read(), m=$('#bmsg'); m.textContent='';
    if(!b.fecha) return m.textContent='Elige la fecha de la cena.';
    if(b.fecha<todayISO()) return m.textContent='Esa fecha ya pasó.';
    if(!b.hora) return m.textContent='Elige la hora.';
    if(b.direccion.length<6) return m.textContent='Escribe la dirección donde llegará el chef.';
    if(!chefAvailable(c,b.fecha,b.hora)) return m.textContent='Ese horario no está disponible.';
    sess.set('booking',b);
    if(!requireLogin('/pago','comprador')) return;
    go('/pago');
  });
}
ACT.geoon2=()=>{Geo.setOn(true);toast('Buscando tu ubicación…');const un=Geo.subscribe(()=>{if(Geo.pos){un();render();}});};

/* ---- reseñas: solo quien reservó y fue aceptado puede opinar, una vez por reserva ---- */
function reviewForm(c){
  const u=Session.user(), el=$('#revform'); if(!u||u.rol!=='comprador'||!el) return;
  const rs=Reservas.all().filter(r=>r.chefId===c.id&&r.buyerEmail===u.email&&(r.estado==='aceptado'||r.estado==='completado')&&!r.resena);
  if(!rs.length) return;
  el.innerHTML='<div class="panel" style="margin-top:18px"><h2 style="font-size:20px">Cuéntanos cómo te fue</h2><label class="field"><span>Calificación</span><select id="rs"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select></label><label class="field"><span>Tu reseña</span><textarea id="rt" maxlength="240"></textarea></label><button class="btn sm" id="rgo">Publicar reseña</button></div>';
  $('#rgo').addEventListener('click',()=>{
    const t=$('#rt').value.trim(); if(t.length<5){toast('Escribe al menos unas palabras.');return;}
    const a=store.get(RESENAS_KEY,[]);a.push({chefId:c.id,n:u.nombre.split(' ')[0]+' '+(u.nombre.split(' ')[1]||'').charAt(0)+'.',s:+$('#rs').value,t,email:u.email});store.set(RESENAS_KEY,a);
    const all=Reservas.all();const r=all.find(x=>String(x.id)===String(rs[0].id));if(r){r.resena=true;Reservas.save(all);}
    toast('¡Gracias por tu reseña!');render();
  });
}
ACT.report=el=>{
  openModal('<h2>Reportar a este chef</h2><p class="sub">Cuéntanos qué pasó. Nuestro equipo lo revisa.</p><label class="field"><span>Motivo</span><textarea id="rp" maxlength="300"></textarea></label><button class="btn block" data-act="sendreport" data-id="'+el.dataset.id+'">Enviar reporte</button>');
};
ACT.sendreport=el=>{
  const t=$('#rp').value.trim(); if(t.length<5){toast('Describe brevemente el motivo.');return;}
  const u=Session.user(), c=chefById(el.dataset.id);
  enviarASheets({tipo:'reporte',chef:c?c.name:el.dataset.id,reporta:u?u.email:'anónimo',motivo:t});
  closeModal();toast('Gracias. Recibimos tu reporte.');
};
route('/chef/:id',renderPerfil);
