(() => {
'use strict';
const projects = window.portfolioProjects;
let motion;
const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const grid = $('#film-grid');
const cards = new Map();
for (const [index,p] of projects.entries()) {
 const card=document.createElement('article');card.className='film-card';card.dataset.group=p.group;
 card.innerHTML=`<button class="film-image card-image" data-film="${p.id}" aria-label="播放${p.series}：${p.title}"><img src="${p.cover||`assets/${p.id}/poster.jpg`}" alt="${p.title}作品封面" loading="lazy" width="720" height="440"><span class="card-play">${p.duration}<span class="play-circle" aria-hidden="true">▶</span></span></button><div class="card-description"><div><h3>${p.title}</h3><p>${p.series} · ${p.group==='explore'?'独立完成':'团队合作'}</p></div><span aria-hidden="true">↗</span></div>`;
 grid.append(card);cards.set(p.id,card);
}
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 let count=0;for(const p of projects){const visible=button.dataset.filter==='all'||p.group===button.dataset.filter;cards.get(p.id).hidden=!visible;if(visible)count++;}
 $('#filter-status').textContent=`正在显示 ${count} 部作品`;
 motion?.refresh([...cards.values()].filter(card=>!card.hidden));
});
// Native horizontal film shelves keep touch, trackpad and keyboard browsing available.
document.querySelectorAll('.film-collection').forEach((collection,index)=>{
 const films=collection.dataset.films.split(',').map(id=>projects.find(p=>p.id===id)).filter(Boolean);
 const name=collection.dataset.collection,railId=`film-rail-${index}`;
 collection.innerHTML=`<div class="collection-toolbar"><p>${films.length} 部作品 · 左右滑动浏览</p><div class="rail-controls"><button type="button" data-step="-1" aria-label="${name}：上一组作品" aria-controls="${railId}">←</button><button type="button" data-step="1" aria-label="${name}：下一组作品" aria-controls="${railId}">→</button></div></div><div class="film-rail" id="${railId}" tabindex="0" role="region" aria-label="${name}横向作品列表">${films.map((p,i)=>`<div class="rail-film"><button data-film="${p.id}" aria-label="在${name}经历中播放${p.title}"><img src="${p.cover||`assets/${p.id}/poster.jpg`}" alt="${p.title}作品封面" loading="lazy" width="720" height="440"><span class="rail-duration">${p.duration}</span><span class="play-circle" aria-hidden="true">▶</span></button><div class="rail-description"><div><h4>${p.title}</h4><p>${p.group==='explore'?'探索计划 · 独立完成':'微山项目 · 团队合作'}</p></div></div></div>`).join('')}</div>`;
 if(collection.classList.contains('compact-collection')){
  collection.querySelector('.collection-toolbar').remove();
  const pair=collection.querySelector('.film-rail');pair.classList.add('film-pair');pair.removeAttribute('tabindex');pair.setAttribute('aria-label','微山项目两部作品');return;
 }
 const rail=collection.querySelector('.film-rail'),buttons=[...collection.querySelectorAll('[data-step]')];
 const update=()=>{buttons[0].disabled=rail.scrollLeft<3;buttons[1].disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-3;};
 const step=direction=>rail.scrollBy({left:direction*(rail.querySelector('.rail-film').getBoundingClientRect().width+16),behavior:reduced.matches||document.documentElement.classList.contains('motion-off')?'instant':'smooth'});
 buttons.forEach(b=>b.addEventListener('click',()=>step(Number(b.dataset.step))));
 rail.addEventListener('scroll',update,{passive:true});
 rail.addEventListener('keydown',e=>{if(e.target!==rail)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}});
 new ResizeObserver(update).observe(rail);update();
});

// Horizontal practice browsing does not consume vertical page scrolling.
const practiceRail=document.querySelector('.practice-rail');
const phaseButtons=[...document.querySelectorAll('[data-phase]')];
function showPhase(index){practiceRail.scrollTo({left:index*(practiceRail.firstElementChild.offsetWidth+18),behavior:reduced.matches||document.documentElement.classList.contains('motion-off')?'instant':'smooth'});}
phaseButtons.forEach(b=>b.addEventListener('click',()=>showPhase(Number(b.dataset.phase))));
practiceRail.addEventListener('scroll',()=>{const index=Math.round(practiceRail.scrollLeft/(practiceRail.firstElementChild.offsetWidth+18));phaseButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));},{passive:true});
practiceRail.addEventListener('keydown',e=>{if(e.target!==practiceRail)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();showPhase(e.key==='ArrowRight'?1:0);}});

const dialog=$('#player-dialog'),player=$('#film-player');
let hls=null,current=null,lastFocus=null,usingFallback=false;
function cleanupPlayer(){player.pause();if(hls){hls.destroy();hls=null;}player.removeAttribute('src');player.load();}
function startFilm(p){
 cleanupPlayer();$('#player-error').hidden=true;player.poster=p.cover||`assets/${p.id}/poster.jpg`;
 const source=`assets/${p.id}/film.m3u8`;
 usingFallback=false;
 if(player.canPlayType('video/mp4')){playMP4(p);return;}
 if(player.canPlayType('application/vnd.apple.mpegurl')){player.src=source;player.play().catch(()=>{});}
 else if(window.Hls&&window.Hls.isSupported()){
 hls=new window.Hls({maxBufferLength:20,maxMaxBufferLength:40});hls.loadSource(source);hls.attachMedia(player);
 hls.on(window.Hls.Events.MANIFEST_PARSED,()=>{if(dialog.open)player.play().catch(()=>{});});
 hls.on(window.Hls.Events.ERROR,(_,data)=>{if(data.fatal){playMP4(p);}});
 }else{playMP4(p);}
}
function playMP4(p){
 if(hls){hls.destroy();hls=null;}
 usingFallback=true;
 player.src=`assets/${p.id}/film.mp4`;
 player.load();
 if(dialog.open)player.play().catch(()=>{});
}
function openFilm(id){
 const p=projects.find(p=>p.id===id);if(!p)return;
 current=p;lastFocus=document.activeElement;
 $('#player-title').textContent=p.title;$('#player-kicker').textContent=`${p.series} / ${p.en} / ${p.duration}`;$('#player-role').textContent=p.role;$('#player-description').textContent=p.detail;
 if(!dialog.open)dialog.showModal();document.body.classList.add('modal-open');motion?.stop();startFilm(p);$('#close-player').focus();
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-film]');if(button)openFilm(button.dataset.film);});
$('#close-player').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{cleanupPlayer();document.body.classList.remove('modal-open');motion?.start();lastFocus?.focus({preventScroll:true});});
$('#retry-player').addEventListener('click',()=>{if(current)startFilm(current);});
player.addEventListener('error',()=>{if(!dialog.open||!player.getAttribute('src'))return;if(!usingFallback&&current)playMP4(current);else $('#player-error').hidden=false;});

document.querySelectorAll('.copy-profile').forEach(button=>button.addEventListener('click',async()=>{
 const area=button.closest('.social-access,.footer-social-tools');
 const result=area.querySelector('.copy-result'),input=area.querySelector('.profile-url'),status=area.querySelector('.copy-status');
 result.hidden=false;
 try{await navigator.clipboard.writeText(input.value);status.textContent='主页链接已复制。';}
 catch{input.focus();input.select();status.textContent='自动复制不可用，请长按或选中下方链接复制。';}
 motion?.refresh();
}));
document.querySelectorAll('.project-material').forEach(details=>{
 details.addEventListener('toggle',()=>motion?.refresh());
 details.querySelector('img').addEventListener('load',()=>motion?.refresh());
});
try{motion=window.initPortfolioMotion?.();}catch(error){console.error('Motion unavailable',error);document.documentElement.classList.add('motion-off');}
})();
