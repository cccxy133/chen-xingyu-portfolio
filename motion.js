(() => {
'use strict';
window.initPortfolioMotion = function () {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const toggle=document.querySelector('#motion-toggle');
 const intro=document.querySelector('.intro'), originalIntro=intro.innerHTML;
 const hero=document.querySelector('.hero'), avatar=document.querySelector('#avatar');
 let wanted=true,ctx=null,mm=null,lenis=null,tick=null,first=true,cardCleanup=null;
 try{wanted=localStorage.getItem('portfolio-motion')!=='off';}catch{}
 if(!window.gsap||!window.ScrollTrigger){toggle.textContent='动态效果暂不可用';toggle.disabled=true;return {};}
 gsap.registerPlugin(ScrollTrigger);
 function clear(){
  cardCleanup?.();cardCleanup=null;
  mm?.revert();mm=null;
  ctx?.revert();ctx=null;
  if(tick)gsap.ticker.remove(tick);tick=null;
  lenis?.destroy();lenis=null;
  intro.innerHTML=originalIntro;
 }
 function apply(){
  clear();const enabled=wanted&&!reduced.matches;
  document.documentElement.classList.toggle('motion-off',!enabled);
  toggle.setAttribute('aria-pressed',String(enabled));
  toggle.textContent=reduced.matches?'动态效果：系统已减少':'动态效果：'+(enabled?'开启':'关闭');
  if(!enabled)return;
  if(window.Lenis){
   lenis=new Lenis({lerp:.085,smoothWheel:true,syncTouch:false,anchors:{duration:.9,lerp:0},prevent:n=>n.id==='player-dialog'});
   lenis.on('scroll',ScrollTrigger.update);tick=t=>lenis?.raf(t*1000);gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);
  }
  ctx=gsap.context(self=>{
   if(first&&window.scrollY<40){
    const entrance=gsap.timeline({defaults:{duration:.7,ease:'power2.out'}});
    entrance.from('nav',{opacity:0,y:-20},0).from('.hero h1',{opacity:0,y:40},.15).from('.hero-bottom p',{opacity:0,y:20},.35).from('.hero-bottom .pill',{opacity:0,y:20},.5).from('.avatar-wrap',{opacity:0,y:30},.6);
   }
    document.querySelectorAll('.wall-row').forEach((row,i)=>{
     gsap.fromTo(row,{x:i?-70:-310},{x:i?-310:-70,ease:'none',scrollTrigger:{trigger:'.image-wall',start:'top bottom',end:'bottom top',scrub:.6}});
    });
   document.querySelectorAll('.section>.eyebrow,.section:not(.experience)>h2,.archive-title,.motivation>div').forEach(el=>{
    gsap.from(el,{opacity:0,y:30,duration:.7,ease:'power2.out',clearProps:'opacity,transform',scrollTrigger:{trigger:el,start:'top 96%',once:true}});
   });
   // Template-inspired entrances: soft upward motion, sequenced by reading order.
   document.querySelectorAll('.resume-entry').forEach(card=>{
    const title=card.querySelector('h3'),meta=card.querySelector('.entry-meta');
    const heading=gsap.timeline({defaults:{duration:.7,ease:'power2.out'},scrollTrigger:{trigger:card,start:'top 88%',once:true}});
    heading.from(card.firstElementChild,{opacity:0,y:20},0).from(meta,{opacity:0,y:20},.08).from(title,{opacity:0,y:30},.16);
    card.querySelectorAll('.entry-lead,.project-name,.role-heading,.entry-content>.responsibilities,.collection-toolbar,.related-works>.collection-title').forEach(el=>{
     if(el.classList.contains('responsibilities')){gsap.from(el.children,{opacity:0,y:20,duration:.65,stagger:.11,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}});}else{gsap.from(el,{opacity:0,y:24,duration:.7,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}});}
    });
   });
   // Observe the clipped horizontal viewport, so the second phase enters when selected.
   const phaseSeen=new WeakSet(),phaseTweens=[];
   const phaseObserver=new IntersectionObserver(items=>items.forEach(item=>{
    if(!item.isIntersecting||phaseSeen.has(item.target))return;
    phaseSeen.add(item.target);
    phaseTweens.push(gsap.fromTo(item.target.querySelectorAll('.practice-heading,.responsibilities li,.work-links,.project-material'),{opacity:0,y:18},{opacity:1,y:0,duration:.65,stagger:.07,ease:'power2.out',clearProps:'opacity,transform'}));
   }),{threshold:.25});
   document.querySelectorAll('.practice-block').forEach(el=>phaseObserver.observe(el));
   self.add(()=>()=>{phaseObserver.disconnect();phaseTweens.forEach(t=>t.revert());});
  });first=false;
   mm=gsap.matchMedia();
   // Two complete viewport scenes, with a reversible, shared photo/text timeline. All viewports — mobile stacks photo above text.
   mm.add('(min-width: 0px)',()=>{
   const section=document.querySelector('#about'),stage=section.querySelector('.about-stage');
   const summary=section.querySelector('.chapter-summary'),details=section.querySelector('.chapter-details'),gallery=section.querySelector('.chapter-gallery');
   const tabs=[...section.querySelectorAll('[data-about-step]')],next=section.querySelector('.chapter-next');
   section.classList.add('chapter-active');
   let scene=0,trigger;
   const showState=value=>{scene=value;summary.inert=!!value;summary.setAttribute('aria-hidden',String(!!value));details.inert=!value;details.setAttribute('aria-hidden',String(!value));gallery.inert=!value;gallery.setAttribute('aria-hidden',String(!value));tabs.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===value)));next.textContent=value?'继续滑动 · 创作与实习 ↓':'继续滑动 · 了解更多 ↓';};
   showState(0);
   gsap.set([details,gallery],{autoAlpha:0});
   // 吸附：任何位置停下都吸附到最近的完整一幕（0=认识我 / 1=镜头之外），不再允许卡在动画中间
   const timeline=gsap.timeline({defaults:{ease:'power2.inOut'},scrollTrigger:{trigger:section,start:'top top',end:'bottom bottom',scrub:.6,invalidateOnRefresh:true,snap:{snapTo:value=>value<.5?0:1,duration:{min:.45,max:.85},delay:.1,inertia:false},onUpdate:self=>{if((self.progress>.48?1:0)!==scene)showState(self.progress>.48?1:0);}}});
   trigger=timeline.scrollTrigger;
   timeline.to({}, {duration:.18})
    .to(section.querySelector('.chapter-cover'),{scale:.94,autoAlpha:0,duration:.44},.14)
    .to(summary,{y:-16,autoAlpha:0,duration:.34},.14)
    .to(gallery,{autoAlpha:1,duration:.38},.4)
    .fromTo(section.querySelectorAll('.scene-photo'),{y:24,scale:.96},{y:0,scale:1,duration:.44,stagger:.04},.4)
    .fromTo(details,{y:18,autoAlpha:0},{y:0,autoAlpha:1,duration:.44},.44)
    .to({}, {duration:.05},.95);
   const go=index=>{const y=index===2?document.querySelector('#experience').getBoundingClientRect().top+scrollY:trigger.start+(trigger.end-trigger.start)*index;if(lenis)lenis.scrollTo(y,{duration:1.7,lock:true});else window.scrollTo({top:y,behavior:'smooth'});};
   const handlers=tabs.map((b,i)=>{const fn=()=>go(i);b.addEventListener('click',fn);return fn;});
   const forward=()=>go(scene?2:1);next.addEventListener('click',forward);
   return()=>{section.classList.remove('chapter-active');[summary,details,gallery].forEach(el=>{el.inert=false;el.removeAttribute('aria-hidden');});tabs.forEach((b,i)=>b.removeEventListener('click',handlers[i]));next.removeEventListener('click',forward);};
  });
  // Stack complete experience panels; oversized panels remain readable before they stick.
  const entries=[...document.querySelectorAll('.resume-entry')];
  // 所有卡片使用同一吸附位，保证与标题间距一致；卡片即使略高于视口也会在随后的叠放中被盖住
  const measureCards=()=>entries.forEach((card,i)=>{const heading=document.querySelector('.experience-head');const restingTop=heading.offsetHeight+24;card.style.setProperty('--stick-top',restingTop+'px');card.style.zIndex=String(i+1);});
  measureCards();
  const resizeCards=new ResizeObserver(()=>{measureCards();ScrollTrigger.refresh();});
  entries.forEach(card=>resizeCards.observe(card));
  const resize=()=>measureCards();window.addEventListener('resize',resize);
  cardCleanup=()=>{resizeCards.disconnect();window.removeEventListener('resize',resize);};
  // 卡片叠放缩放只在桌面端启用；手机端回归正常文档流，避免叠放错乱
  mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)',()=>{
   entries.slice(0,-1).forEach((card,i)=>gsap.to(card,{scale:.965,ease:'none',scrollTrigger:{trigger:card,start:()=> 'top '+parseFloat(card.style.getPropertyValue('--stick-top'))+'px',end:()=>'+='+(card.offsetHeight+24),scrub:true,invalidateOnRefresh:true}}));
  });
  // 第三张卡完全盖住第二张的瞬间起，钉住的标题与前两张卡一起随滚动上移，整个经历区像普通文档流一样滚走（桌面端）。
  mm.add('(min-width: 761px)',()=>{
   const head=document.querySelector('.experience-head'),last=entries[entries.length-1],coverTop=()=>parseFloat(entries[entries.length-2].style.getPropertyValue('--stick-top')),stack=[head,...entries.slice(0,-1)];
   gsap.to(stack,{y:()=>-(head.offsetHeight+80),ease:'none',scrollTrigger:{trigger:last,start:()=> 'top '+coverTop()+'px',end:()=>'+='+(head.offsetHeight+80),scrub:true,invalidateOnRefresh:true}});
  });
  mm.add('(pointer:fine) and (prefers-reduced-motion: no-preference)',()=>{
   const face=document.querySelector('.avatar-face'),pupils=[...document.querySelectorAll('.gaze-pupil')],lids=document.querySelectorAll('.eye-lid');
   const xTo=gsap.quickTo(face,'x',{duration:.65,ease:'power3.out'}),yTo=gsap.quickTo(face,'y',{duration:.65,ease:'power3.out'}),rTo=gsap.quickTo(face,'rotation',{duration:.8,ease:'power3.out'});
   const eyeMoves=pupils.map(p=>({x:gsap.quickTo(p,'x',{duration:.28,ease:'power2.out'}),y:gsap.quickTo(p,'y',{duration:.32,ease:'power2.out'})}));
   gsap.set(lids,{y:-115});
   let bounds=hero.getBoundingClientRect(),blinkTimer=null,blinkTween=null,visible=true;
   const recenter=()=>{xTo(0);yTo(0);rTo(0);eyeMoves.forEach(m=>{m.x(0);m.y(0);});};
   const measure=()=>{bounds=hero.getBoundingClientRect();};
   const magnet=e=>{if(e.pointerType==='touch'||!visible)return;face.classList.add('gaze-ready');const nx=gsap.utils.clamp(-1,1,(e.clientX-bounds.left-bounds.width/2)/(bounds.width*.5));const ny=gsap.utils.clamp(-1,1,(e.clientY-bounds.top-bounds.height*.58)/(bounds.height*.5));eyeMoves.forEach(m=>{m.x(nx*13);m.y(ny*7);});xTo(nx*9);yTo(ny*5);rTo(nx*1.4);};
   const schedule=()=>{blinkTimer=gsap.delayedCall(5.5+Math.random()*3,()=>{if(visible&&!document.hidden&&face.classList.contains('gaze-ready'))blinkTween=gsap.to(lids,{y:0,duration:.09,repeat:1,yoyo:true,repeatDelay:.03,ease:'power2.inOut'});schedule();});};
   schedule();
   const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible)recenter();});visibility.observe(hero);
   hero.addEventListener('pointerenter',measure);hero.addEventListener('pointermove',magnet);hero.addEventListener('pointerleave',recenter);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,{passive:true});
   return()=>{blinkTimer?.kill();blinkTween?.kill();visibility.disconnect();hero.removeEventListener('pointerenter',measure);hero.removeEventListener('pointermove',magnet);hero.removeEventListener('pointerleave',recenter);window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure);face.classList.remove('gaze-ready');};
  });

  if(document.querySelector('#player-dialog').open)lenis?.stop();
  ScrollTrigger.refresh();
 }
 toggle.addEventListener('click',()=>{if(reduced.matches)return;wanted=!wanted;try{localStorage.setItem('portfolio-motion',wanted?'on':'off');}catch{}apply();});
 reduced.addEventListener('change',apply);apply();
 window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
 return {stop:()=>lenis?.stop(),start:()=>lenis?.start(),refresh:()=>ScrollTrigger.refresh()};
};
})();
