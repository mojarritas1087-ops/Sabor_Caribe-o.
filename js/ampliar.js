/* Visor de fotos con zoom */
'use strict';
(function(){
  let list=[], i=0, zoomed=false;
  function draw(){
    let lb=$('#lb'); if(!lb){lb=document.createElement('div');lb.id='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-label','Foto ampliada');document.body.appendChild(lb);}
    lb.innerHTML='<div class="tip">Toca la foto para acercarla</div><div class="stage" data-lb="stage"><img data-lb="img" src="'+list[i]+'" alt="Foto del plato"></div>'+
      '<button class="x" data-lb="x" aria-label="Cerrar">×</button>'+(list.length>1?'<button class="pv" data-lb="pv" aria-label="Anterior">‹</button><button class="nx" data-lb="nx" aria-label="Siguiente">›</button><div class="ct">'+(i+1)+' / '+list.length+'</div>':'');
    zoomed=false;
  }
  function close(){const lb=$('#lb');if(lb)lb.remove();}
  ACT.zoom=el=>{
    if(el.dataset.set==='one'){list=[el.dataset.src];i=0;}
    else{list=(window._lbSet||[]).slice();i=+el.dataset.i||0;}
    if(!list.length) return; draw();
  };
  document.addEventListener('click',e=>{
    const lb=$('#lb'); if(!lb||!lb.contains(e.target)) return;
    const k=e.target.dataset&&e.target.dataset.lb, img=$('#lb img');
    if(k==='x'||e.target===lb||k==='stage'){close();return;}
    if(k==='pv'){i=(i-1+list.length)%list.length;draw();return;}
    if(k==='nx'){i=(i+1)%list.length;draw();return;}
    if(k==='img'){
      zoomed=!zoomed;
      if(zoomed){const r=img.getBoundingClientRect();img.style.transformOrigin=((e.clientX-r.left)/r.width*100)+'% '+((e.clientY-r.top)/r.height*100)+'%';}
      img.classList.toggle('z',zoomed);
    }
  });
  document.addEventListener('mousemove',e=>{
    const img=$('#lb img.z'); if(!img) return;
    const r=img.getBoundingClientRect(), st=$('#lb .stage').getBoundingClientRect();
    img.style.transformOrigin=(Math.min(100,Math.max(0,(e.clientX-st.left)/st.width*100)))+'% '+(Math.min(100,Math.max(0,(e.clientY-st.top)/st.height*100)))+'%';
  });
  document.addEventListener('keydown',e=>{
    if(!$('#lb')) return;
    if(e.key==='Escape'){e.stopPropagation();close();}
    else if(e.key==='ArrowRight'&&list.length>1){i=(i+1)%list.length;draw();}
    else if(e.key==='ArrowLeft'&&list.length>1){i=(i-1+list.length)%list.length;draw();}
  },true);
})();
