/* 4. Inicio: menú de hoy, ofertas, buscador y filas de chefs */
'use strict';

let _tab='menu';
const STEPS4=[
  ['1','Identidad','Documento de identidad revisado antes de aprobar el perfil.','#E35B1F'],
  ['2','Certificación','Institución certificadora, número y certificado en PDF.','#456D1B'],
  ['3','Entrada segura','Cada chef entra con contraseña y un código que llega a su correo.','#0D3B1E'],
  ['4','Reseñas y soporte','Opiniones de comensales y reporte directo a soporte.','#F39C12']
];

function todayLine(){const d=new Date();return 'Hoy · '+DIAS_L[d.getDay()]+' '+d.getDate()+' de '+MESES_L[d.getMonth()].toLowerCase();}

function offerItem(o,btn){
  return '<div class="offer"><div class="pct" style="background:'+o.color+';'+(o.color==='#F39C12'?'color:#14261a':'')+'">'+esc(o.tag)+'</div><div><b>'+esc(o.titulo)+'</b><span>'+esc(o.desc)+'</span></div>'+(btn||'')+'</div>';
}
function todayBody(){
  const chef=chefById(TODAY.chefId)||SEED_CHEFS[0], ref=refPoint(chef.city);
  if(_tab==='ofertas'){
    return '<div class="biggrid">'+OFFERS.map(o=>offerItem(o)).join('')+'</div><p style="width:100%;margin:6px 0 0;color:#dcebc9">Las ofertas se aplican solas en el último paso, según tu reserva. No se suman entre sí: se usa la mejor.</p>';
  }
  if(_tab==='promos'){
    return '<div class="biggrid">'+PROMOS.map(p=>'<div class="offer"><div class="pct" style="background:#F7E58A;color:#14261a">'+p.pct+' %</div><div><b>'+esc(p.titulo)+'</b><span>'+esc(p.desc)+'</span><br><span>Código: <b style="display:inline;font-family:var(--sans);font-size:16px;letter-spacing:.06em">'+p.code+'</b></span></div><button data-act="copycode" data-code="'+p.code+'">Copiar</button></div>').join('')+'</div><p style="width:100%;margin:6px 0 0;color:#dcebc9">Escribe el código en el paso de pago. Solo se usa uno por reserva.</p>';
  }
  return '<div class="menucard"><div class="pic"'+((TODAY.foto||(chef.fotos&&chef.fotos[0]))?' data-act="zoom" data-set="one" data-src="'+(TODAY.foto||chef.fotos[0])+'"':'')+' style="background-image:'+bgOf(TODAY.foto||(chef.fotos&&chef.fotos[0]),0)+'">'+((TODAY.foto||(chef.fotos&&chef.fotos[0]))?'':'<div style="width:130px;height:130px;border-radius:50%;border:3px solid rgba(255,255,255,.7)"></div>')+'<span class="tag">Plato del día</span></div>'+
    '<div class="bd"><h3>'+esc(TODAY.titulo)+'</h3>'+
    '<div class="course"><b>Entrada</b><span>'+esc(TODAY.entrada)+'</span></div><div class="course"><b>Fuerte</b><span>'+esc(TODAY.fuerte)+'</span></div><div class="course"><b>Postre</b><span>'+esc(TODAY.postre)+'</span></div>'+
    '<div style="display:flex;align-items:center;gap:12px;margin:16px 0">'+avatar(chef.foto,44,chef.name)+'<div><b>'+esc(chef.name)+'</b> <span style="color:var(--jungle);font-size:13px;font-weight:700">✓ Verificada</span><div class="muted" style="font-size:14px">★ '+ratingTxt(chef)+' · '+esc(chef.zone)+' '+(etaMin(chef,ref)!=null?' · llega en ~'+etaMin(chef,ref)+' min':'')+'</div></div></div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><span style="font-size:26px;font-weight:700">'+money(TODAY.price)+'</span> <span class="muted">por persona</span></div><button class="btn" data-act="reservarmenu">Reservar este menú</button></div></div></div>'+
    '<div class="offers"><h3>Ofertas de la semana</h3>'+OFFERS.map(o=>offerItem(o)).join('')+'</div>';
}
let _prevTab=null;
function renderToday(){const b=$('#tbody');if(b){const o=['menu','ofertas','promos'];const dir=_prevTab&&o.indexOf(_tab)<o.indexOf(_prevTab)?'slidel':'slider';b.innerHTML=todayBody();if(_prevTab&&_prevTab!==_tab){b.classList.remove('slidel','slider');void b.offsetWidth;b.classList.add(dir);}_prevTab=_tab;}$$('#ttabs button').forEach(x=>x.classList.toggle('on',x.dataset.tab===_tab));}

function renderInicio(){
  const s=Search.get(), cityId=s.city||'santa-marta', ref=refPoint(cityId);
  const here=allChefs().filter(c=>c.city===cityId);
  const near=here.slice().sort((a,b)=>etaKey(a,ref)-etaKey(b,ref)).slice(0,12);
  const favs=here.filter(c=>c.avg>=4.8).sort((a,b)=>b.avg-a.avg).slice(0,12);
  const dishMap={}; here.forEach(c=>c.dishes.forEach(d=>{const e=etaKey(c,ref);if(!dishMap[d]||e<dishMap[d].e)dishMap[d]={c,e,m:etaMin(c,ref)};}));
  const dishes=Object.keys(dishMap).sort((a,b)=>dishMap[a].e-dishMap[b].e).slice(0,12);
  const geoTxt=Geo.pos?'Usamos tu ubicación para calcular cuánto tardaría cada chef en llegar':(Geo.enabled()?'Buscando tu ubicación…':'Activa tu ubicación para calcular cuánto tardaría cada chef en llegar');
  const chips=[['rating','Mejor calificados'],['eta','Más cercanos a ti'],['low','Hasta US$35'],['mariscos','Mariscos'],['grupos','Para grupos'],['dulce','Postres']];
  $('#app').innerHTML=
   '<section class="hero"><img class="herologo" src="assets/logo-icono.svg" alt="Sabor Caribeño" width="92" height="92"><h1>Vive el Caribe en tu propia casa</h1><p>Un chef caribeño verificado cocina en vivo para ti. No es un domicilio: es una experiencia.</p>'+searchBar(false)+
   '<div class="geonote" style="margin-top:22px;gap:12px">'+chips.map(c=>'<button class="chip" data-act="quick" data-q="'+c[0]+'">'+c[1]+'</button>').join('')+'</div>'+
   '<div class="geonote">'+ICON_PIN+'<span id="geotxt">'+geoTxt+'</span> · <button class="linkbtn" data-act="geotoggle" id="geobtn">'+(Geo.enabled()?'Desactivar':'Activar')+'</button></div></section>'+
   '<section class="today" aria-label="Menú de hoy y ofertas"><div class="hd"><div><div class="kicker">'+todayLine()+'</div><h2>Menú de hoy y ofertas</h2></div>'+
   '<div class="tabs" id="ttabs" role="tablist"><button data-act="tab" data-tab="menu" class="on" role="tab">Menú de hoy</button><button data-act="tab" data-tab="ofertas" role="tab">Ofertas</button><button data-act="tab" data-tab="promos" role="tab">Promociones</button></div></div><div class="tbody" id="tbody"></div></section>'+
   row('Chefs cerca de ti',near.map(c=>chefCard(c,ref,c.avg>=4.9?'Favorito entre comensales':'')),'a')+
   row('Favoritos entre comensales',favs.map(c=>chefCard(c,ref,'Favorito entre comensales')),'b')+
   row('Platos de la costa',dishes.map((d,i)=>{const c=dishMap[d].c;return '<a class="card" href="#/chef/'+c.id+'"><div class="ph" style="background-image:'+bgOf(dishImg(d)||(c.fotos&&c.fotos[0]),i+1)+'">'+((dishImg(d)||(c.fotos&&c.fotos[0]))?'':'<div class="ring"></div>')+'</div><div class="nm"><span>'+esc(d)+'</span><span style="font-weight:500;font-size:14px">★ '+ratingTxt(c)+'</span></div><div class="sub">Chef '+esc(c.name)+'</div>'+etaChip(dishMap[d].m)+'<div class="pr"><b>'+money(c.price)+'</b> <span class="muted">por persona</span></div></a>';}),'a')+
   '<section class="verify"><h2>Así verificamos a cada chef</h2><p class="muted" style="margin:0 0 26px">Antes de entrar a tu casa, cada chef pasa por estos pasos.</p><div class="steps4">'+STEPS4.map(s=>'<div><i style="background:'+s[3]+';'+(s[3]==='#F39C12'?'color:#14261a':'')+'">'+s[0]+'</i><b style="display:block;font-size:17px;margin-bottom:4px">'+s[1]+'</b><span class="muted" style="font-size:15px;line-height:1.5">'+s[2]+'</span></div>').join('')+'</div></section>';
  bindSearch(); renderToday();
  const un=Geo.subscribe(()=>{ try{moveMe();}catch(e){} if(location.hash===''||location.hash==='#/'){ if($('#geotxt')){ $('#geotxt').textContent=Geo.pos?'Usamos tu ubicación para calcular cuánto tardaría cada chef en llegar':'Activa tu ubicación para calcular cuánto tardaría cada chef en llegar'; $('#geobtn').textContent=Geo.enabled()?'Desactivar':'Activar'; if(Geo.pos) renderInicioKeep(); } } });
  onLeave(un);
}
function renderInicioKeep(){ const y=window.scrollY; renderInicio(); window.scrollTo(0,y); }
function row(title,cards,tone){
  if(!cards.length) return '';
  return '<div class="band '+(tone||'a')+'"><section class="wrap sec"><div class="rowhd"><h2>'+esc(title)+'</h2><div class="arrows"><button data-act="carl" aria-label="Anterior">‹</button><button data-act="carr" aria-label="Siguiente">›</button></div></div><div class="cards">'+cards.join('')+'</div></section></div>';
}
ACT.carl=el=>{const c=el.closest('section').querySelector('.cards');c.scrollBy({left:-Math.max(300,c.clientWidth*0.8),behavior:'smooth'});};
ACT.carr=el=>{const c=el.closest('section').querySelector('.cards');c.scrollBy({left:Math.max(300,c.clientWidth*0.8),behavior:'smooth'});};
ACT.tab=el=>{_tab=el.dataset.tab;renderToday();};
ACT.copycode=el=>{
  const c=el.dataset.code;
  try{navigator.clipboard.writeText(c).then(()=>toast('Código '+c+' copiado.'),()=>toast('Tu código es '+c));}catch(e){toast('Tu código es '+c);}
};
ACT.reservarmenu=()=>{const c=chefById(TODAY.chefId);Search.set({city:c.city,guests:Search.get().guests||2});go('/chef/'+c.id);};
ACT.geotoggle=()=>{Geo.setOn(!Geo.enabled());if(!Geo.enabled())renderInicioKeep();else toast('Buscando tu ubicación…');};
ACT.quick=el=>{
  const q=el.dataset.q, f=Object.assign({},Search.get().filters), patch={};
  if(!Search.get().city) patch.city='santa-marta';
  f.price='all';f.rating=0;f.dish='';f.sort='eta';
  if(q==='rating') f.sort='rating';
  if(q==='eta') f.sort='eta';
  if(q==='low') f.price='low';
  if(q==='mariscos') f.dish='mariscos';
  if(q==='dulce') f.dish='dulce';
  if(q==='grupos'){patch.guests=6;}
  patch.filters=f; Search.set(patch); go('/resultados');
};
route('/',renderInicio);
