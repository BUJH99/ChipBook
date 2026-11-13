import {qos,safetyAccess} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox,plot} from './figures.mjs';
import {hex32,bindFields} from './soc-architecture.mjs';
import {digitalRows} from './soc-control.mjs';

export function nocMeshFigure() {
    let s='';const ox=145,oy=110,dx=140,dy=124,center=(r,c)=>[ox+c*dx+28,oy+r*dy+23];
    for(let r=0;r<3;r++)for(let c=0;c<4;c++){
        const [x,y]=center(r,c);if(c<3){s+=arrow(x+30,y-3,x+dx-30,y-3,'#a8b8ca',1.5)+arrow(x+dx-30,y+3,x+30,y+3,'#a8b8ca',1.5);}if(r<2){s+=arrow(x-3,y+25,x-3,y+dy-25,'#a8b8ca',1.5)+arrow(x+3,y+dy-25,x+3,y+25,'#a8b8ca',1.5);}
    }
    const route=(cells,color,shift=0)=>{for(let i=1;i<cells.length;i++){const [x1,y1]=center(...cells[i-1]),[x2,y2]=center(...cells[i]);s+=arrow(x1+shift,y1+shift,x2+shift,y2+shift,color,2.6);}};
    route([[0,0],[0,1],[0,2],[0,3],[1,3],[2,3]],C.green,-7);route([[0,1],[1,1],[2,1],[2,2],[2,3]],C.blue,6);route([[2,0],[2,1],[2,2],[2,3]],C.purple,-5);
    for(let r=0;r<3;r++)for(let c=0;c<4;c++){const x=ox+c*dx,y=oy+r*dy;s+=labeledBox(x,y,56,47,`R${r}${c}`,'',r===1&&c===2?C.blue:'#8395ad','#f8fbff');}
    s+=labeledBox(10,102,105,66,'CPU','Latency',C.green,'#effbf6')+arrow(115,133,145,133,C.green)+labeledBox(254,13,134,60,'Camera','Deadline',C.blue,'#eff6ff')+arrow(321,73,321,110,C.blue)+labeledBox(10,350,105,66,'DMA','Bulk',C.purple,'#f8f4ff')+arrow(115,381,145,381,C.purple)+labeledBox(569,445,143,64,'Memory','Shared target',C.orange,'#fff8ec')+wire('M593 405V425H641V445',C.purple)+arrow(641,429,641,445,C.purple);
    s+=rect(739,30,361,401,'#f8fbff',C.line)+tx(757,57,'Router 내부 · 5 ports','class="label"')+tx(757,85,'Input queues / VC','class="small"')+labeledBox(875,115,77,236,'Arbiter','',C.blue,'#eef6ff');
    [C.blue,C.green,C.purple,C.orange].forEach((color,r)=>{const y=124+r*65;for(let i=0;i<5;i++)s+=rect(757+i*19,y,17,28,i<3?color+'30':'#fff',color,1);s+=arrow(852,y+14,875,y+14,color,1.4);});
    s+=rect(979,115,45,236,'#edf3fa','#8da3bc');['N','E','S','W','Local'].forEach((p,i)=>{const y=137+i*45;s+=wire(`M952 ${155+i*30}H${989+i*6}V${y}H1074`,i%2?C.blue:C.ink,1.2)+arrow(1053,y,1074,y,C.ink,1.2)+tx(1082,y+5,p,'class="small"');});s+=tx(1000,379,'Crossbar','text-anchor="middle" class="small"');
    s+=wire('M482 234L739 92M482 281L739 392','#9db5d0',1,'stroke-dasharray="5 4"');
    s+=tx(181,468,'파랑 Camera · 초록 CPU · 보라 DMA','class="small"')+tx(181,493,'색 경로는 하나의 routing 예 · link 공유 시 중재','class="small"');
    return svg(1125,530,'3행 4열 mesh NoC의 여러 traffic 경로와 router input queue arbiter crossbar 확대도',s);
}
export function qosSchedule(v) {
    const counts=[v.camera,v.cpu,v.dma],labels=['Camera','CPU','DMA'];
    let rows;
    if(v.policy==='priority'||v.policy==='round-robin')rows=qos(v).rows.map(r=>({cycle:r[0],source:labels.indexOf(r[1]),pending:r.slice(2)}));
    else{
        const pending=[...counts],used=[0,0,0],slots=[0,0,1,2];rows=[];let cursor=0;
        while(pending.some(x=>x>0)){
            let selected=-1;
            if(v.policy==='weighted'){
                for(let j=0;j<slots.length;j++){const slot=(cursor+j)%slots.length;if(pending[slots[slot]]){selected=slots[slot];cursor=(slot+1)%slots.length;break;}}
            }else{
                const deadlines=[6+2*used[0],12+3*used[1],24+6*used[2]];
                selected=deadlines.reduce((best,d,i)=>pending[i]&&(best<0||d<deadlines[best])?i:best,-1);
            }
            pending[selected]--;used[selected]++;rows.push({cycle:rows.length,source:selected,pending:[...pending]});
        }
    }
    const stats=labels.map((name,i)=>{const completion=rows.filter(r=>r.source===i).map(r=>r.cycle+1);return{name,count:counts[i],first:completion[0]??null,last:completion.at(-1)??null,mean:completion.length?completion.reduce((a,b)=>a+b,0)/completion.length:null};});
    return {rows,stats};
}
export function qosServiceFigure(d) {
    const colors=[C.blue,C.green,C.purple],names=['Cam','CPU','DMA'];let s='';
    d.rows.forEach((r,i)=>{const col=i%18,row=Math.floor(i/18),x=10+col*58,y=25+row*70,c=colors[r.source];s+=tx(x+26,y-5,String(i+1),'text-anchor="middle" class="small"')+labeledBox(x,y,53,40,names[r.source],'',c,c+'18');});
    if(!d.rows.length)s+=tx(520,43,'요청이 없습니다.','text-anchor="middle" class="label"');
    return svg(1065,Math.max(80,Math.ceil(d.rows.length/18)*70+15),'cycle별 수락한 source를 순서대로 표시한 QoS 서비스 trace',s);
}
export function initSocQos(root) {
    root.querySelector('[data-soc-noc-mesh]').innerHTML=nocMeshFigure();
    bindFields(root,'[data-soc-qos-inputs]',v=>{const d=qosSchedule(v),colors=[C.blue,C.green,C.purple,C.red];
        root.querySelector('[data-soc-qos-delay]').innerHTML=plot(['priority','round-robin','weighted','deadline'].map((policy,p)=>({color:colors[p],points:Array.from({length:12},(_,i)=>{const n=i+1;return[n,qosSchedule({camera:n,cpu:n,dma:n,policy}).stats[0].mean];})})),{width:590,height:325,xmin:1,xmax:12,ymin:0,ymax:24,xlabel:'Source별 동시 요청 수 (beat)',ylabel:'Camera 평균 완료 cycle'});
        const points=[[[0,0]],[[0,0]],[[0,0]]],accepted=[0,0,0];d.rows.forEach(r=>{accepted[r.source]++;points.forEach((p,i)=>p.push([r.cycle+1,accepted[i]]));});
        root.querySelector('[data-soc-qos-accepted]').innerHTML=plot(points.map((p,i)=>({points:p,color:colors[i]})),{width:590,height:325,xmax:Math.max(1,d.rows.length),ymax:Math.max(1,v.camera,v.cpu,v.dma),xlabel:'Cycle',ylabel:'누적 수락 beat'});
        root.querySelector('[data-soc-qos-service]').innerHTML=qosServiceFigure(d);
        root.querySelector('[data-soc-qos-summary]').innerHTML=table(['Source','요청 beat','첫 완료 cycle','마지막 완료 cycle','평균 완료 cycle'],d.stats.map(r=>[r.name,r.count,r.first??'—',r.last??'—',r.mean===null?'—':fmt(r.mean)]));
    });
}

export function powerSequenceFigure() {
    const n=22,range=(a,b)=>Array.from({length:n},(_,i)=>Number(i>=a&&i<b));
    const power=range(0,7).map((v,i)=>Number(v||i>=13)),clock=range(0,6).map((v,i)=>v||i>=15?i%2:0),reset=range(0,6).map((v,i)=>Number(v||i>=18));
    return digitalRows([{name:'Traffic enable',values:range(0,2).map((v,i)=>Number(v||i>=20)),color:C.blue},{name:'Save',values:range(3,4),color:C.red},{name:'Restore',values:range(16,17),color:C.purple},{name:'Isolation',values:range(4,20),color:C.green},{name:'Clock',values:clock,color:C.ink},{name:'reset_n',values:reset,color:C.orange},{name:'Power switch',values:power,color:C.blue}],{width:920,left:155,heightPerRow:51,labels:[{at:3,text:'Save'},{at:8,text:'Rail OFF'},{at:14,text:'Rail ON'},{at:20,text:'재개'}],caption:'유효 출력과 복구 완료 후 isolation 해제'});
}
export function powerState(v) {
    const power=Boolean(Number(v.power)),clock=Boolean(Number(v.clock)),reset=Boolean(Number(v.resetN)),isolation=Boolean(Number(v.isolation)),retention=Boolean(Number(v.retention));
    const status=!power&&!isolation?'VIOLATION · OFF 출력이 격리되지 않음':!power?'POWER OFF · 출력 clamp':!reset?'RESET ASSERTED':!clock?'CLOCK GATED':isolation?'OUTPUT ISOLATED':'ACTIVE';
    return {status,output:isolation?'Clamp 0':!power?'X · 신뢰할 수 없음':!reset?'Reset value':'정의한 유효 출력',retained:retention?'0x5A · 선택한 상태 보존':power?'Live state':'소실 · 재초기화 필요'};
}
export function initSocPower(root) {
    root.querySelector('[data-soc-power-sequence]').innerHTML=powerSequenceFigure();
    bindFields(root,'[data-soc-power-inputs]',v=>{const d=powerState(v);root.querySelector('[data-soc-power-status]').innerHTML=table(['관측','현재 결과'],[['상태',d.status],['AON이 보는 출력',d.output],['선택 state',d.retained],['Traffic 재개',Number(v.power)&&Number(v.clock)&&Number(v.resetN)&&!Number(v.isolation)?'복구 완료를 확인한 뒤 허용':'준비되지 않음']]);});
}

export function securityTopology() {
    let s=rect(12,60,210,373,'#f2f8ff',C.line)+tx(117,88,'접근 initiator','text-anchor="middle" class="label"');
    [['CPU','Core access'],['DMA','Security attribute'],['Debug','Lifecycle policy'],['Boot interface','Image / storage']].forEach(([name,sub],i)=>{const y=110+i*77;s+=labeledBox(30,y,173,62,name,sub,C.blue,'#fff')+wire(`M203 ${y+31}H257V235H300`,C.blue,1.5);});
    s+=rect(300,105,220,301,'#fff4f7',C.red)+tx(410,140,'Bus firewall','text-anchor="middle" class="label"')+tx(410,163,'& access control','text-anchor="middle" class="label"');
    ['Address range','Security attribute','Permission','Deny / log'].forEach((t,i)=>s+=labeledBox(324,191+i*47,173,32,t,'',C.line,'#fff'));
    s+=labeledBox(591,135,150,242,'Interconnect','Routing / response',C.ink,'#f4f7fb')+arrow(520,235,591,235,C.blue)+labeledBox(820,74,265,131,'Memory system','SRAM / DRAM',C.purple,'#f6f2ff')+labeledBox(844,154,216,33,'Protected aperture','',C.red,'#fff1f5')+labeledBox(820,263,265,146,'Peripheral / IP','Crypto · safety · UART',C.green,'#effbf6')+wire('M741 235H783V139H820M783 235V336H820',C.ink)+arrow(798,139,820,139,C.ink)+arrow(798,336,820,336,C.ink);
    s+=labeledBox(302,455,218,75,'Security monitor','Address / ID / cause log',C.red,'#fff3f6')+arrow(410,406,410,455,C.red)+labeledBox(681,455,261,75,'Fault monitors','ECC / watchdog / voltage',C.purple,'#f8f4ff')+wire('M952 409V435H810V455',C.purple,1.5,'stroke-dasharray="5 4"');
    s+=labeledBox(302,5,218,70,'Secure boot ROM','Image authentication policy',C.green,'#effbf6')+wire('M520 40H664V135',C.green)+arrow(664,115,664,135,C.green);
    return svg(1110,552,'보안 접근 제어 경로와 보안 monitor 및 우발 고장 monitor를 구분한 SoC 구조',s);
}
export function systemAccess(v) {
    const address=Number(v.address),rom=address>=0&&address<=0xffff,secure=address>=0x20000000&&address<=0x2000ffff,shared=address>=0x20010000&&address<=0x2003ffff;
    if(!rom&&!secure&&!shared)return{region:'Unmapped',allowed:false,response:'DECERR',reason:'주소에 매핑된 target 없음',range:'정의된 범위 밖'};
    const d=safetyAccess({address:rom?0:secure?4096:8192,secure:Number(v.secure),write:Number(v.write),locked:Number(v.locked)});
    return {...d,response:d.allowed?'OKAY':'SLVERR',range:rom?'0x0000_0000–0x0000_FFFF':secure?'0x2000_0000–0x2000_FFFF':'0x2001_0000–0x2003_FFFF'};
}
export function accessPathFigure(v) {
    const d=systemAccess(v),c=d.allowed?C.green:C.red;
    let s=labeledBox(10,87,205,170,v.master||'Master',hex32(v.address),C.blue,'#f1f7ff')+tx(112,217,Number(v.write)?'Write':'Read','text-anchor="middle" class="small"')+tx(112,239,Number(v.secure)?'Secure':'Non-secure','text-anchor="middle" class="small"')+labeledBox(320,82,210,180,'Bus firewall','Address / permission',C.red,'#fff5f7')+arrow(215,165,320,165,C.blue)+arrow(530,165,650,165,c)+tx(590,142,d.allowed?'수락':'차단','text-anchor="middle" class="label"')+labeledBox(650,78,249,189,d.region,d.range,C.purple,'#f8f4ff');
    if(!d.allowed)s+=wire('M571 154l21 22m0-22-21 22',C.red,3);
    s+=wire('M425 262V315H111V257',c,1.6)+arrow(111,281,111,257,c)+tx(268,341,`${d.response} · ${d.reason}`,'text-anchor="middle" class="small"');
    return svg(925,367,'선택한 master 주소 보안 속성과 접근 종류에 따른 firewall 허용 또는 오류 응답',s);
}
export function initSocAccess(root) {
    root.querySelector('[data-soc-security-topology]').innerHTML=securityTopology();
    bindFields(root,'[data-soc-access-inputs]',v=>{const d=systemAccess(v);root.querySelector('[data-soc-access-path]').innerHTML=accessPathFigure(v);root.querySelector('[data-soc-access-result]').innerHTML=table(['관측','결과'],[['Target',`${d.region} · ${d.range}`],['판정',d.allowed?'접근 허용':'접근 차단'],['Response',d.response],['원인',d.reason],['Monitor record',d.allowed?'정상 transaction 추적':`${v.master} · ${hex32(v.address)} · ${Number(v.write)?'Write':'Read'} · ${d.response}`]]);});
}
