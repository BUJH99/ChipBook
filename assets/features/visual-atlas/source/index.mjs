import {select, zoom, zoomIdentity} from 'd3';
import {drawScene,esc} from './schematics.mjs';

const bundleURL=new URL(document.currentScript.src),bundleBase=new URL('.',bundleURL);
let threePromise;
function loadThree(){
    if(window.ChipBookVisual3D)return Promise.resolve(window.ChipBookVisual3D);
    return threePromise??=new Promise((resolve,reject)=>{
        const script=document.createElement('script'),url=new URL('visual-atlas-3d.js',bundleBase);url.search=bundleURL.search;script.src=url.href;
        script.onload=()=>resolve(window.ChipBookVisual3D);script.onerror=()=>{threePromise=null;reject(new Error('3D assets unavailable'));};document.head.append(script);
    });
}
const icon=(type)=>`<svg viewBox="0 0 20 20" aria-hidden="true">${({play:'<path d="m6 3 11 7-11 7Z" fill="currentColor"/>',pause:'<path d="M6 4v12M14 4v12" stroke="currentColor" stroke-width="4"/>',reset:'<path d="M5 5a7 7 0 1 1-1 9M5 1v5H1" fill="none" stroke="currentColor" stroke-width="1.8"/>',next:'<path d="m5 4 7 6-7 6M15 3v14" fill="none" stroke="currentColor" stroke-width="1.8"/>',plus:'<path d="M3 10h14M10 3v14" stroke="currentColor" stroke-width="1.8"/>',minus:'<path d="M3 10h14" stroke="currentColor" stroke-width="1.8"/>',cube:'<path d="m10 2 7 4v8l-7 4-7-4V6Zm-7 4 7 4 7-4m-7 4v8" fill="none" stroke="currentColor" stroke-width="1.5"/>'})[type]}</svg>`;

function init(root){
    const cfg=JSON.parse(root.dataset.visualScene),steps=cfg.steps||[];
    const state={step:0,phase:.08};
    let active=false,playing=false,raf=0,last=0,lastDraw=0,elapsed=0,view=null,threeAPI=null,threeActive=false,generation=0,transform=zoomIdentity,svg,panZoom;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    function seekLab(reset=false){
        if(!cfg.labType)return;
        root.dispatchEvent(new CustomEvent('chipbook:visual-seek',{bubbles:true,detail:{type:cfg.labType,phase:state.phase,reset}}));
    }
    root.innerHTML=`<div class="atlas-heading"><div><h3>${esc(cfg.title)}</h3><p class="lesson-lead">${esc(cfg.subtitle||'')}</p></div>${cfg.legend?`<div class="atlas-legend">${cfg.legend.map(([label,colour])=>`<span style="--legend-color:${esc(colour)}">${esc(label)}</span>`).join('')}</div>`:''}</div>
      <div class="atlas-workspace ${cfg.three?'has-model':''}"><div class="atlas-schematic"><div class="atlas-svg-host"></div><div class="atlas-zoom-tools"><button type="button" data-atlas-action="zoom-in" aria-label="2D 도식 확대">${icon('plus')}</button><button type="button" data-atlas-action="zoom-out" aria-label="2D 도식 축소">${icon('minus')}</button><button type="button" data-atlas-action="fit">전체 보기</button></div></div>
      ${cfg.three?`<aside class="atlas-model"><div class="atlas-model-title">${icon('cube')}<strong>${esc(cfg.modelCaption||'공간 구조')}</strong><span>드래그 회전</span></div><div class="atlas-three-host"><span class="atlas-three-loading">3D 구조 준비 중</span></div><div class="atlas-model-controls"><button type="button" data-atlas-action="perspective">입체</button><button type="button" data-atlas-action="top">상단</button><button type="button" data-atlas-action="front">정면</button><button type="button" data-atlas-action="cut" aria-pressed="false">단면</button><label>층 분리<input type="range" min="0" max="100" value="0" data-atlas-explode aria-label="3D 층 분리"></label></div><p class="atlas-part-note">부품을 선택하면 역할을 확인할 수 있습니다.</p></aside>`:''}</div>
      <div class="atlas-transport"><button type="button" data-atlas-action="play" aria-pressed="false">${icon('play')} 동작 재생</button><button type="button" data-atlas-action="next">${icon('next')} 다음 단계</button><button type="button" data-atlas-action="reset">${icon('reset')} 초기화</button><label class="atlas-scrubber">동작 위치<input type="range" min="0" max="100" value="8" data-atlas-time aria-label="도식 동작 위치"></label><output class="atlas-state-count"></output></div>
      <div class="atlas-stages" role="group" aria-label="동작 단계">${steps.map((step,i)=>`<button type="button" data-atlas-step="${i}" aria-pressed="${i===0}"><span>${String(i+1).padStart(2,'0')}</span>${esc(step[0])}</button>`).join('')}</div>
      <div class="atlas-explanation" aria-live="polite"><strong></strong><p></p></div>
      <p class="atlas-scope">${esc(cfg.scope||'구조와 신호 흐름을 설명하는 개념 도식입니다. 아래 실습에서 입력값에 따른 계산과 상태를 확인할 수 있습니다.')}</p>`;
    root.insertBefore(root.querySelector('.atlas-transport'),root.querySelector('.atlas-workspace'));
    const host=root.querySelector('.atlas-svg-host'),threeHost=root.querySelector('.atlas-three-host'),scrubber=root.querySelector('[data-atlas-time]');
    host.tabIndex=0;host.setAttribute('aria-label','2D 도식. 좁은 화면에서는 가로로 이동할 수 있습니다.');
    const touchHint=document.createElement('span');touchHint.className='atlas-touch-hint';touchHint.textContent='좌우로 밀어 도식 보기';root.querySelector('.atlas-schematic').append(touchHint);
    if(cfg.models?.length){
        const picker=document.createElement('div');picker.className='atlas-model-picker';picker.setAttribute('role','group');picker.setAttribute('aria-label','3D 소자 구조');
        picker.innerHTML=cfg.models.map(model=>`<button type="button" data-atlas-model="${esc(model.variant)}" aria-pressed="${model.variant===(cfg.modelVariant||cfg.variant)}">${esc(model.label)}</button>`).join('');
        threeHost.before(picker);
    }
    function createView(){
        view=threeAPI.create(threeHost,cfg,part=>{root.querySelector('.atlas-part-note').textContent=`${part.name} · ${part.detail}`;});
        view.explode(Number(root.querySelector('[data-atlas-explode]').value)/100);
        view.cutaway(root.querySelector('[data-atlas-action="cut"]').getAttribute('aria-pressed')==='true');
        if(cfg.componentByStep)view.select(cfg.componentByStep[state.step]);
        root.dataset.threeReady='true';threeHost.dataset.modelVariant=cfg.modelVariant||cfg.variant;
    }
    function draw(){
        host.innerHTML=drawScene(cfg,state);svg=select(host.querySelector('svg'));
        const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','atlas-pan-layer');
        [...svg.node().children].filter(n=>n.tagName.toLowerCase()!=='defs').forEach(n=>group.append(n));svg.node().append(group);
        panZoom=zoom().scaleExtent([.8,4]).filter(event=>event.type==='wheel'?event.ctrlKey:event.type==='touchstart'?event.touches.length>1:!event.button).on('zoom',event=>{transform=event.transform;select(group).attr('transform',transform);});
        svg.call(panZoom).call(panZoom.transform,transform).on('dblclick.zoom',null);svg.style('touch-action','pan-y');
    }
    function showState(){
        const selected=steps[state.step%Math.max(1,steps.length)]||['동작 확인',''];
        root.querySelector('.atlas-explanation strong').textContent=selected[0];root.querySelector('.atlas-explanation p').textContent=selected[1];
        root.querySelectorAll('[data-atlas-step]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.atlasStep)===state.step)));
        root.querySelector('.atlas-state-count').textContent=cfg.lab?.stalled?'Stall':steps.length?`${state.step+1} / ${steps.length}`:'';
        root.dataset.step=String(state.step);scrubber.value=String(Math.round(state.phase*100));if(cfg.componentByStep)view?.select(cfg.componentByStep[state.step]);
    }
    function setPlaying(value){playing=Boolean(value)&&!reduced.matches;root.dataset.playing=String(playing&&active);const button=root.querySelector('[data-atlas-action="play"]');button.setAttribute('aria-pressed',String(playing));button.innerHTML=`${icon(playing?'pause':'play')} ${playing?'일시정지':'동작 재생'}`;if(playing&&active)startLoop();else{cancelAnimationFrame(raf);raf=0;}}
    function stopLoop(){cancelAnimationFrame(raf);raf=0;last=0;root.dataset.playing='false';}
    function tick(now){
        if(!active||!playing){raf=0;return;}
        const dt=last?Math.min(now-last,80):0;last=now;elapsed+=dt;const oldStep=state.step;state.phase=(elapsed/6000)%1;state.step=Math.min(Math.max(0,steps.length-1),Math.floor(state.phase*steps.length));
        if(state.step!==oldStep||now-lastDraw>100){seekLab();draw();lastDraw=now;if(state.step!==oldStep)showState();}
        const cursor=host.querySelector('.atlas-time-cursor');if(cursor)cursor.style.opacity=String(.55+.45*Math.sin(state.phase*Math.PI));
        scrubber.value=String(Math.round(state.phase*100));view?.render(elapsed/1000);raf=requestAnimationFrame(tick);
    }
    function startLoop(){if(raf||!playing||!active)return;last=0;root.dataset.playing='true';raf=requestAnimationFrame(tick);}
    function chooseStep(step){setPlaying(false);state.step=Math.max(0,Math.min(steps.length-1,step));state.phase=steps.length>1?state.step/(steps.length-1):0;elapsed=state.phase*6000;seekLab(state.step===0);draw();showState();view?.render(elapsed/1000);}
    root.addEventListener('click',event=>{
        const model=event.target.closest('[data-atlas-model]');
        if(model){cfg.modelVariant=model.dataset.atlasModel;root.querySelectorAll('[data-atlas-model]').forEach(button=>button.setAttribute('aria-pressed',String(button===model)));if(view&&threeActive){view.dispose();createView();}return;}
        const step=event.target.closest('[data-atlas-step]');if(step){chooseStep(Number(step.dataset.atlasStep));return;}
        const action=event.target.closest('[data-atlas-action]')?.dataset.atlasAction;if(!action)return;
        if(action==='play')setPlaying(!playing);
        if(action==='next')chooseStep((state.step+1)%Math.max(1,steps.length));
        if(action==='reset'){transform=zoomIdentity;chooseStep(0);view?.reset();root.querySelector('[data-atlas-explode]')?.setAttribute('value','0');const slider=root.querySelector('[data-atlas-explode]');if(slider)slider.value='0';root.querySelector('[data-atlas-action="cut"]')?.setAttribute('aria-pressed','false');}
        if(action==='zoom-in')svg.call(panZoom.scaleBy,1.25);
        if(action==='zoom-out')svg.call(panZoom.scaleBy,.8);
        if(action==='fit'){transform=zoomIdentity;svg.call(panZoom.transform,transform);}
        if(['perspective','top','front'].includes(action))view?.camera(action);
        if(action==='cut'){const button=event.target.closest('button'),pressed=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(pressed));view?.cutaway(pressed);}
    });
    scrubber.addEventListener('input',()=>{setPlaying(false);state.phase=Number(scrubber.value)/100;state.step=Math.min(steps.length-1,Math.floor(state.phase*steps.length));elapsed=state.phase*6000;seekLab();draw();showState();view?.render(elapsed/1000);});
    root.querySelector('[data-atlas-explode]')?.addEventListener('input',event=>view?.explode(Number(event.target.value)/100));
    draw();showState();
    window.GuidebookPage.registerLifecycle({root,start(){active=true;if(playing)startLoop();},stop(){active=false;stopLoop();},destroy(){stopLoop();generation++;view?.dispose();view=null;}});
    if(threeHost)window.GuidebookPage.registerViewportFeature(threeHost,()=>({
        async start(){
            threeActive=true;const request=++generation;
            try{threeAPI=await loadThree();if(!threeActive||request!==generation)return;threeHost.querySelector('.atlas-three-loading')?.remove();createView();}
            catch(error){if(request!==generation)return;root.dataset.threeReady='false';const note=threeHost.querySelector('.atlas-three-loading')||document.createElement('span');note.className='atlas-three-loading';note.textContent='이 환경에서는 위의 2D 도식으로 구조를 확인할 수 있습니다.';threeHost.append(note);}
        },
        stop(){threeActive=false;generation++;view?.dispose();view=null;delete root.dataset.threeReady;},
        destroy(){threeActive=false;generation++;view?.dispose();view=null;},
    }));
    const lesson=root.closest('[data-lesson-panel]');
    lesson?.addEventListener('chipbook:lab-update',event=>{
        const detail=event.detail;if(!detail||detail.type!==cfg.labType)return;
        cfg.lab=detail;root.dataset.labLinked=detail.type;
        for(const button of root.querySelectorAll('[data-atlas-action="play"],[data-atlas-action="next"],[data-atlas-time]'))button.disabled=Boolean(detail.stalled);
        if(detail.source==='visual')return;
        setPlaying(false);
        if(Number.isFinite(detail.cycle)){
            state.phase=detail.type==='array'?Math.max(0,detail.cycle+1)/Math.max(1,detail.maxCycle+1):Math.max(0,detail.cycle)/Math.max(detail.maxCycle||0,1);
            state.step=Math.min(Math.max(0,steps.length-1),Math.floor(state.phase*steps.length));
        }
        cfg.lab=detail;draw();showState();view?.render(state.phase*6);root.dataset.labLinked=detail.type;
    });
}
window.GuidebookPage.registerInitializer(()=>document.querySelectorAll('[data-visual-scene]').forEach(init));
