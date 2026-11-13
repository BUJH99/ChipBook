import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox} from './figures.mjs';
import {bindModel,put} from './ai-common.mjs';
import {inverterSymbol} from './cmos-primitives.mjs';

export function transmissionGate(x,y,{label='TG',control='CLK',on=false}={}) {
    const color=on?C.blue:'#839bb9';let s=rect(x,y-20,47,40,on?'#e6f2ff':'#fff',color,2)+wire(`M${x+5} ${y-14}L${x+42} ${y+14}M${x+5} ${y+14}L${x+42} ${y-14}`,color,1.3)+wire(`M${x+23.5} ${y-20}V${y-40}M${x+23.5} ${y+20}V${y+40}`,color,1.3);
    s+=tx(x+23.5,y-49,control,'text-anchor="middle" class="small blue"')+tx(x+23.5,y+61,control==='CLK'?'NOT CLK':'CLK','text-anchor="middle" class="small"')+tx(x+23.5,y-89,label,'text-anchor="middle" class="small label"');return s;
}
export function tgLatchFigure({clock=1}={}) {
    clock=Number(clock);
    let s=wire('M27 156H107M154 156H242M338 156H383M479 156H553M516 156V299H348M301 299H203V156',C.ink,1.7)+transmissionGate(107,156,{label:'입력 TG',control:'CLK',on:!!clock})+inverterSymbol(242,156)+inverterSymbol(383,156)+transmissionGate(301,299,{label:'',control:'NOT CLK',on:!clock});
    s+=node(203,156)+node(516,156)+tx(15,139,'D','class="label blue"')+tx(553,139,'Q','text-anchor="end" class="label blue"')+tx(208,134,'X','class="small"')+tx(288,218,'INV1','text-anchor="middle" class="small"')+tx(431,218,'INV2','text-anchor="middle" class="small"')+tx(325,385,'Feedback TG','text-anchor="middle" class="small label"')+tx(294,426,clock?'CLK=1 · 입력 TG ON / feedback OFF · Q=D':'CLK=0 · 입력 TG OFF / feedback ON · Q 유지','text-anchor="middle" class="label blue"');
    return svg(585,452,'입력 transmission gate 뒤 두 inverter와 출력에서 저장 node로 돌아가는 상보 feedback TG를 가진 high-level latch',s);
}
export function masterSlaveFigure() {
    let s='';
    const tg=(x,y,enable)=>rect(x,y-14,32,28,'#fff',C.ink,1)+wire(`M${x+4} ${y-10}L${x+28} ${y+10}M${x+4} ${y+10}L${x+28} ${y-10}`,C.ink,1.1)+tx(x+16,y-25,enable,'text-anchor="middle" class="small blue"');
    for(const [x,name,enable,feedback,color,fill] of [[37,'Master · CLK=0','¬CLK','CLK',C.blue,'#f0f7ff'],[431,'Slave · CLK=1','CLK','¬CLK',C.red,'#fff0f5']]){
        s+=rect(x,28,347,246,fill,color)+tx(x+173,55,name,'text-anchor="middle" class="label"')+wire(`M${x} 135H${x+25}M${x+57} 135H${x+92}M${x+149.6} 135H${x+186}M${x+243.6} 135H${x+347}M${x+291} 135V222H${x+208}M${x+176} 222H${x+78}V135`,C.ink,1.6)+tg(x+25,135,enable)+inverterSymbol(x+92,135,{scale:.6})+inverterSymbol(x+186,135,{scale:.6})+tg(x+176,222,feedback)+node(x+78,135)+node(x+291,135)+tx(x+168,188,'두 inverter의 정적 feedback','text-anchor="middle" class="small"');
    }
    s+=wire('M10 135H37M384 135H431M778 135H811',C.ink,1.8)+tx(10,114,'D','class="small label"')+tx(408,114,'Qm','text-anchor="middle" class="small"')+tx(808,114,'Q','text-anchor="end" class="small label"')+tx(408,310,'각 TG는 NMOS/PMOS에 enable과 그 반전 신호를 공급','text-anchor="middle" class="small"')+tx(408,338,'상승 edge: Master hold · Slave transparent → 직전 D 전달','text-anchor="middle" class="small"');
    return svg(824,361,'상보 clock의 두 transmission-gate latch가 각각 두 inverter feedback을 가진 positive-edge master slave flip-flop',s);
}
export function digitalTraces(rows,{width=760,height=280,duration=12,edges=[],caption='Time'}={}) {
    const left=96,right=width-21,top=28,step=(height-70)/rows.length,sx=t=>left+t/duration*(right-left);let s='';
    edges.forEach(t=>s+=wire(`M${sx(t)} 8V${height-42}`,C.purple,1,'stroke-dasharray="4 4"'));
    rows.forEach((r,i)=>{const y=top+i*step,high=y,low=y+31;s+=tx(3,y+22,r.name,'class="small label"')+wire(`M${left} ${low}H${right}`,'#dce5ef',.8);let last=r.points[0][1];let path=`M${sx(r.points[0][0])} ${last?high:low}`;r.points.slice(1).forEach(([t,val])=>{path+=`H${sx(t)}V${val?high:low}`;last=val;});path+=`H${right}`;s+=wire(path,r.color||Object.values(C)[i],2);});
    for(let t=0;t<=duration;t+=2)s+=tx(sx(t),height-27,String(t),'text-anchor="middle" class="small"');s+=tx((left+right)/2,height-5,caption,'text-anchor="middle" class="small"');return svg(width,height,rows.map(r=>r.name).join(', ')+'의 같은 시간 축 파형',s);
}
export function storageTrace() {
    const clock=[[0,0],[2,1],[4,0],[6,1],[8,0],[10,1],[12,0]],data=[[0,0],[1.1,1],[3.2,0],[6.8,1],[8.6,0],[9.3,1],[11.1,0]],valueAt=(a,t)=>a.filter(p=>p[0]<=t).at(-1)[1],q=[[0,0],...[2,6,10].map(t=>[t,valueAt(data,t)])];return{clock,data,q};
}
export function setupHoldFigure() {
    let s=rect(245,49,145,174,'#eaf4ff','none',0)+rect(390,49,92,174,'#fff0f4','none',0)+wire('M42 103H390V63H630V103H724',C.blue,2.1)+wire('M42 189H153L174 171H604L625 189H724M42 171H153L174 189H604L625 171H724',C.ink,1.5)+wire('M390 30V243',C.purple,1.2,'stroke-dasharray="5 4"');
    s+=tx(16,84,'CLK','class="small label"')+tx(16,169,'D','class="small label"')+tx(390,21,'Capture rising edge','text-anchor="middle" class="small label"')+arrow(245,140,386,140,C.blue)+arrow(483,140,394,140,C.red)+tx(315,131,'tsetup','text-anchor="middle" class="small blue"')+tx(440,131,'thold','text-anchor="middle" class="small" style="fill:#eb5874"')+tx(387,275,'D는 edge 전 setup, edge 후 hold 구간에 안정','text-anchor="middle" class="small"');return svg(758,298,'실제 상승 clock edge 앞의 setup window와 뒤의 hold window',s);
}
export function icgFigure() {
    let s=labeledBox(125,45,204,132,'Low-level latch','CLK=0: EN 추적',C.blue,'#f2f8ff')+arrow(20,87,125,87,C.green)+tx(18,69,'EN','class="small label"')+wire('M20 235H412V131H456M227 235V177',C.blue,1.8)+node(227,235)+tx(17,220,'CLK','class="small label blue"')+wire('M329 87H456',C.green,1.8)+tx(366,70,'EN held','class="small"');
    s+=wire('M456 69H493A40 40 0 0 1 493 149H456Z',C.ink,1.8)+arrow(533,109,638,109,C.purple)+tx(640,91,'GCLK','text-anchor="end" class="small label purple"')+tx(351,284,'GCLK = CLK AND latched EN · 출력 반전 없음','text-anchor="middle" class="small"');return svg(670,311,'Enable을 low-level latch에 저장하고 원래 clock과 AND하는 glitch-free clock gating 개념',s);
}
export function clockGating({change=3,initial=0}={}) {
    initial=Number(initial);
    const final=1-initial,clock=t=>Math.floor(t/2)%2,enable=t=>t>=change?final:initial,rows=[];let held=initial;
    const times=[...new Set([0,2,4,6,8,10,12,change])].sort((a,b)=>a-b);
    for(const t of times){const clk=clock(t),en=enable(t);if(!clk)held=en;rows.push({t,clk,en,held,bare:clk&&en?1:0,gated:clk&&held?1:0});}
    const transitions=key=>rows.map(r=>[r.t,r[key]]),partial=change>0&&change<12&&clock(change)===1&&change%2!==0;
    return{rows,partial,initial,final,change,clock:transitions('clk'),enable:transitions('en'),held:transitions('held'),bare:transitions('bare'),gated:transitions('gated')};
}
export function initCmosStorage(root) {
    put(root,'cmos-master-slave',masterSlaveFigure());const t=storageTrace();put(root,'cmos-storage-wave',digitalTraces([{name:'CLK',points:t.clock,color:C.blue},{name:'D',points:t.data,color:C.green},{name:'Q',points:t.q,color:C.red}],{width:640,height:306,edges:[2,6,10],caption:'Time · Q는 상승 edge에서 D capture'}));put(root,'cmos-setup-hold',setupHoldFigure());put(root,'cmos-icg-circuit',icgFigure());
    bindModel(root,'cmos-latch',v=>{const clock=Number(v.clock);put(root,'cmos-tg-latch',tgLatchFigure({clock}));put(root,'cmos-latch-state',table(['항목','선택한 상태'],[['CLK',clock],['입력 TG',clock?'ON':'OFF'],['Feedback TG',clock?'OFF':'ON'],['Q',clock?'D를 추적 · 두 inverter를 통과':'이전 값 유지 · 정적 feedback'] ]));});
    bindModel(root,'cmos-gating',v=>{const d=clockGating(v);put(root,'cmos-gating-wave',digitalTraces([{name:'CLK',points:d.clock,color:C.blue},{name:'EN',points:d.enable,color:C.green},{name:'EN held',points:d.held,color:C.purple},{name:'CLK & EN',points:d.bare,color:C.red},{name:'GCLK',points:d.gated,color:C.green}],{width:880,height:423,caption:'Time · 이상적 논리 model, 실제 gating setup/hold는 별도 검증'}));put(root,'cmos-gating-result',`<small>EN ${d.initial} → ${d.final} · 변경 t=${fmt(d.change)}</small>${d.partial?'단순 AND: clock high 중 pulse가 잘림 / ICG: 다음 완전한 pulse에서 반영':'Low phase 또는 경계 변경 · 이상적 model에서 완전한 pulse'}`);});
}
