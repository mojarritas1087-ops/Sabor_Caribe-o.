/* Tutorial guiado "¿Cómo uso esta página?": va marcando cada función en la pantalla */
'use strict';
const Tutorial=(function(){
  const STEPS=[
    {r:'/',sel:'.hero h1',t:'Esto es Sabor Caribeño',x:'Un chef caribeño verificado cocina en vivo en tu casa. Te mostramos lo básico en 1 minuto.'},
    {r:'/',sel:'.today',t:'El menú de hoy y las ofertas',x:'Aquí ves el plato del día. Cambia de pestaña para ver las ofertas que se aplican solas y los códigos de promoción.'},
    {r:'/',sel:'.sb',t:'Busca a tu chef',x:'Elige la Fecha y hora de la cena y cuántos Comensales son. Luego pulsa la lupa naranja.'},
    {r:'/',sel:'.band .cards',t:'Explora chefs',x:'Desliza a la derecha o usa las flechas para ver más chefs. Cada tarjeta muestra cuánto tardaría en llegar a ti.'},
    {r:'/resultados',sel:'.rtop .sb',t:'El buscador, siempre a la mano',x:'En los resultados puedes cambiar la ciudad, la fecha y los comensales cuando quieras sin volver al inicio.'},
    {r:'/resultados',sel:'.filters',t:'Filtra y ordena',x:'Usa los filtros de precio, calificación y plato, y ordena por el chef más cercano o el mejor calificado.'},
    {r:'/resultados',sel:'.res .list',t:'La lista de chefs',x:'Desplázate para ver a todos los chefs disponibles. Cada tarjeta muestra su precio y cuánto tardaría en llegar a ti. Toca una para ver el resumen.'},
    {r:'/resultados',sel:'.res .mapcol',t:'El mapa',x:'Cada precio en el mapa es un chef. Si activas tu ubicación, el tiempo de llegada se calcula desde donde estás. Toca un precio para resaltar su tarjeta.'},
    {r:'/chef/s1',sel:'.pf-hd',t:'El perfil del chef',x:'Mira su foto, calificación, platos, certificación y reseñas antes de decidir.'},
    {r:'/chef/s1',sel:'.book',t:'Cómo reservas',x:'Elige fecha, hora, comensales y la dirección donde llegará el chef. Pulsa Reservar: aún no se te cobra nada.'},
    {r:'/',sel:'.userbtn',t:'Tu cuenta',x:'Desde aquí inicias sesión, ves tus reservas y encuentras el centro de ayuda. Pagas con tarjeta, Nequi, PayPal o transferencia.'}
  ];
  let i=0, on=false, from='/';
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function show(){
    const el=$('#tut'); if(!el) return;
    if(!Search.get().city&&/resultados/.test(STEPS[i].r)) Search.set({city:'santa-marta'});
    const s=STEPS[i], here=()=>(location.hash.slice(1)||'/');
    if(here()!==s.r){location.hash=s.r;await wait(450);}
    let t=document.querySelector(s.sel);
    if(!t){await wait(250);t=document.querySelector(s.sel);}
    if(t){t.scrollIntoView({block:'center',behavior:'instant'});await wait(60);}
    const last=i===STEPS.length-1;
    const body='<div class="dots">'+STEPS.map((_,k)=>'<i class="'+(k===i?'on':'')+'"></i>').join('')+'</div><div class="tc"><small>Paso '+(i+1)+' de '+STEPS.length+'</small><h3>'+s.t+'</h3><p>'+s.x+'</p></div>'+
      '<div class="act"><button class="out" data-act="tutskip">Saltar tutorial</button><div class="r">'+(i>0?'<button class="ghostbtn" data-act="tutprev">Atrás</button>':'')+'<button class="btn" data-act="'+(last?'tutskip':'tutnext')+'">'+(last?'Listo':'Siguiente')+'</button></div></div>';
    if($('#tpop')){ $('#tpop').innerHTML=body; const tc=$('#tpop .tc'); tc.classList.add('sl'); }
    else el.innerHTML='<div id="tutbg"></div><div id="tutspot"></div><div class="tpop" id="tpop" role="dialog" aria-label="Tutorial">'+body+'</div>'+pill();
    place(t);
  }
  function place(t){
    const sp=$('#tutspot'), pop=$('#tpop'); if(!sp||!pop) return;
    const vw=innerWidth, vh=innerHeight, pw=Math.min(340,vw-24), ph=pop.offsetHeight;
    if(t){
      const r=t.getBoundingClientRect(), pad=8;
      let top=Math.max(4,r.top-pad), bottom=Math.min(vh-4,r.bottom+pad); // recorta si es más alto que la pantalla
      sp.style.cssText='left:'+Math.max(4,r.left-pad)+'px;top:'+top+'px;width:'+(Math.min(vw-4,r.right+pad)-Math.max(4,r.left-pad))+'px;height:'+(bottom-top)+'px';
      let y,x=Math.min(Math.max(12,r.left),vw-pw-12);
      if(bottom+ph+14<vh) y=bottom+14;
      else if(top-ph-14>0) y=top-ph-14;
      else {const left=(r.left+r.right)/2<vw/2; x=left?vw-pw-16:16; y=left?vh-ph-160:vh-ph-16;}
      pop.style.left=x+'px';pop.style.top=y+'px';
    }else{
      sp.style.cssText='left:50%;top:50%;width:0;height:0';
      pop.style.left=(vw-pw)/2+'px';pop.style.top=(vh-ph)/2+'px';
    }
  }
  const pill=()=>'<a class="wabtn" href="https://wa.me/573012235806?text='+encodeURIComponent('Hola, necesito ayuda con Sabor Caribeño')+'" target="_blank" rel="noopener" aria-label="Soporte por WhatsApp" title="Soporte por WhatsApp">'+WA_ICON+'</a><button class="pill" data-act="tutpill">¿Cómo uso esta página?</button>';
  function idle(){const el=$('#tut'); if(el) el.innerHTML=pill();}
  function stop(){on=false;idle();if((location.hash.slice(1)||'/')!==from){location.hash=from;}}
  ACT.tutpill=()=>{ if(on){stop();} else api.open(); };
  ACT.tutnext=()=>{i=Math.min(i+1,STEPS.length-1);show();};
  ACT.tutprev=()=>{i=Math.max(i-1,0);show();};
  ACT.tutskip=()=>stop();
  document.addEventListener('keydown',e=>{if(!on)return;if(e.key==='Escape')stop();if(e.key==='ArrowRight')ACT.tutnext();if(e.key==='ArrowLeft')ACT.tutprev();});
  addEventListener('resize',()=>{if(on)show();});
  const api={
    open(){ if(on) return; on=true;i=0;from=location.hash.slice(1)||'/';
      if(/^\/(login|registro|registro-chef|registro-chef-datos)$/.test(from)){from='/';}
      const o=$('#ov'); if(o) o.innerHTML=''; show(); },
    init:idle
  };
  return api;
})();
