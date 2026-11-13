import {line,curveBasis,curveStepAfter,scaleLinear} from 'd3';
import {color,text,path,circle,rect,trace,rail,pulse,dot,ground,resistor,capacitor,arrow,chip,dff,mos,waveform} from './drawing.mjs';
import * as M from '../../curriculum/source/models.mjs';
import * as D from '../../curriculum/source/detail-models.mjs';

const value=(cfg,defaults={})=>({...defaults,...cfg.lab?.values});
const f=(n)=>Number(n.toFixed(3));
const hex=(n,w=2)=>'0x'+(n>>>0).toString(16).toUpperCase().padStart(w,'0');
const matrix=s=>s.trim().split(/\n|;/).map(r=>r.trim().split(/[,\s]+/).map(Number));
const caption=(label)=>text(480,478,label,'atlas-small','middle');
const mini=(x,y,title,body,c=0)=>rect(x,y,150,65,'#f6faff',color(c),7)+text(x+75,y+25,title,'atlas-small','middle')+text(x+75,y+48,body,'atlas-micro','middle');

function serial(cfg,state){
    const v=value(cfg,{address:80,value:165,received:60,mode:0,baud:115200,parity:'none',stretch:0,scenario:'write'}),cycle=cfg.lab?.cycle||0;
    let s='';
    if(cfg.variant==='i2c'){
        const d=v.scenario==='read'&&!cfg.lab?.fault?D.i2cRead(v.address,v.value,60,v.stretch):M.i2cWrite(v.address,v.value,cfg.lab?.fault,v.stretch);
        const arbitration=v.scenario==='arbitration'?D.arbitration(v.address,(v.address+1)&127,7):null,arbRow=arbitration?.rows[Math.min(cycle,6)];
        const tick=arbRow?{scl:1,sda:arbRow.bus,label:`ARBITRATION bit ${arbRow.bit}`}:d.samples[Math.min(cycle,d.samples.length-1)];
        s+=path('M90 110H910',color(0),3)+path('M90 145H910',color(2),3)+text(55,115,'SDA','atlas-small','end')+text(55,150,'SCL','atlas-small','end');
        for(const [x,y,c] of [[830,110,0],[890,145,2]])s+=text(x,24,'VDD','atlas-micro','middle')+resistor(x,32)+path(`M${x} 82V${y}`,color(c),2)+dot(x,y,c)+text(x-12,60,'Rp','atlas-micro','end');
        const addr=hex(v.address),units=[[85,arbitration?'Controller A':'Controller',0],[365,arbitration?'Controller B':`Target ${addr}`,2],[645,arbitration?'Target':`Target ${hex(v.address^1)}`,1]];
        units.forEach(([x,name,c],unit)=>{
            s+=rect(x,180,230,163,'#f8fbff',color(c),9)+text(x+115,206,name,'atlas-chip-label','middle');
            for(let pin=0;pin<2;pin++){
                const xx=x+72+pin*100,yy=230,bus=pin?145:110,low=!(pin?tick.scl:tick.sda);
                s+=path(`M${xx} ${bus}V${yy}`,color(pin?2:0),2)+dot(xx,bus,pin?2:0);
                // A drain-to-ground switch: control enters from the side, never the bus.
                const driver=pin?(tick.label==='CLOCK STRETCH'?1:0):(/^(ACK|READ DATA)/.test(tick.label)?1:0);
                const pulling=arbRow&&!pin?(unit===0?!arbRow.a:unit===1?!arbRow.b:false):low&&unit===driver;
                s+=circle(xx,yy,3,'#fff',color(c))+path(`M${xx} ${yy+7}l${pulling?0:-15} 24M${xx} ${yy+31}v14`,color(c),2.5)+ground(xx,yy+45);
                s+=path(`M${xx-31} ${yy+18}h12`,color(c),1.5)+text(xx,325,pin?'SCL OD':'SDA OD','atlas-micro','middle');
            }
        });
        s+=text(480,371,`${tick.label} · SDA=${tick.sda} · SCL=${tick.scl} · 7-bit address ${addr}`,'atlas-small','middle');
        if(v.scenario==='arbitration'){
            const a=D.arbitration(v.address,(v.address+1)&127,7);s+=waveform(45,395,860,[a.rows.map(x=>x.a),a.rows.map(x=>x.b)],['A','B'],state.phase);
        }else s+=waveform(45,395,860,[d.samples.map(x=>x.scl),d.samples.map(x=>x.sda)],['SCL','SDA'],state.phase,[color(2),color(0)]);
        return s;
    }
    if(cfg.variant==='uart'){
        const d=M.uartFrame(v.value,v.parity,cfg.lab?.fault);
        s+=chip(65,95,190,140,'UART TX',0)+chip(705,95,190,140,'UART RX',1)+path('M267 165H693',color(0),3)+arrow(680,165)+text(480,145,'TX → RX · common ground','atlas-small','middle');
        const w=800/d.levels.length;
        d.levels.forEach((b,i)=>{s+=rect(90+i*w,285,w-3,44,i===cycle?'#cfe4ff':'#f5f9ff',color(0),3)+text(90+(i+.5)*w,311,b,'atlas-small','middle')+text(90+(i+.5)*w,352,d.labels[i],'atlas-micro','middle');});
        s+=waveform(35,391,870,[d.levels],['TX'],state.phase)+caption(`${hex(v.value)} · LSB first · ${v.baud} baud · bit time ${f(1e6/v.baud)} µs`);return s;
    }
    const d=M.spiFrame(v.value,v.mode,v.received);
    s+=chip(45,75,180,155,'Controller',0)+chip(735,75,180,155,'Target',1);
    ['SCLK','MOSI','MISO','CS_n'].forEach((label,i)=>{const y=95+i*36;s+=path(`M237 ${y}H723`,color(i%3),2.5)+text(480,y-10,label,'atlas-small','middle')+(i===2?path(`M270 ${y-5}l-7 5 7 5`,color(2),2):arrow(710,y,i%3));});
    s+=text(480,274,`Mode ${v.mode} · CPOL=${d.cpol} · CPHA=${d.cpha} · ${hex(v.value)} ⇄ ${hex(v.received)}`,'atlas-small','middle')+waveform(40,298,865,[d.cs,d.clock,d.mosi,d.miso],['CS_n','SCLK','MOSI','MISO'],state.phase);return s;
}

function usb(cfg,state){
    let s=chip(55,115,190,200,'Host / source',0)+chip(715,115,190,200,'Device / sink',1);
    const signals=[['D+ / D−',160,0],['CC · attach / PD',220,1],['VBUS · power',280,3]];
    signals.forEach(([name,y,c])=>s+=path(`M257 ${y}H703`,color(c),name.startsWith('VBUS')?5:2.5)+text(480,y-17,name,'atlas-small','middle'));
    s+=rect(425,90,110,245,'#f6f8fc','#a7b9cf',30)+text(480,362,'USB Type-C','atlas-small','middle');
    for(let i=0;i<12;i++)s+=rect(447+(i%6)*11,121+Math.floor(i/6)*170,7,18,'#c6aa77','none',2);
    return s+caption('Connector · data protocol · power negotiation are separate contracts');
}
function can(cfg,state){
    const v=value(cfg,{a:0x123,b:0x12b}),a=v.idA??v.a,b=v.idB??v.b,d=D.arbitration(a,b,11);let s='';
    for(const [x,name,c] of [[105,'Node A',0],[385,'Node B',1],[665,'Receiver',2]])s+=chip(x,75,170,115,name,c)+path(`M${x+60} 202V250M${x+110} 202V290`,color(c),2);
    s+=path('M60 250H900M60 290H900',color(0),3)+text(55,242,'CAN_H','atlas-small')+text(55,325,'CAN_L','atlas-small');
    for(const x of [70,890])s+=path(`M${x} 250v7M${x} 287v3`,color(3),2)+`<g transform="translate(${x} 257) scale(.6)">${resistor(0,0)}</g>`;
    s+=waveform(60,360,820,[d.rows.map(x=>x.a),d.rows.map(x=>x.b),d.rows.map(x=>x.bus)],['A','B','BUS'],state.phase);
    return s+text(480,40,`Identifier arbitration · ${hex(a,3)} vs ${hex(b,3)} · winner ${d.winner}`,'atlas-small','middle');
}

function array(cfg,state){
    const v=value(cfg,{matrixA:'1,2\n3,4',matrixB:'5,6\n7,8'}),A=matrix(v.matrixA),B=matrix(v.matrixB),cycle=cfg.lab?.cycle??Math.floor(state.phase*4)-1;
    const d=M.systolic(A,B,cycle),n=A.length,m=B[0].length,active=d.trace[cycle]?.active||[];let s='';
    const cell=Math.min(380/n,580/m),x0=(960-m*cell)/2+70,y0=75;
    for(let r=0;r<n;r++)for(let c=0;c<m;c++){
        const x=x0+c*cell,y=y0+r*cell,op=active.find(q=>q.i===r&&q.j===c);
        if(c<m-1)s+=path(`M${x+cell-17} ${y+cell/2}h17`,color(0),3)+arrow(x+cell-2,y+cell/2);
        if(r<n-1)s+=path(`M${x+cell/2} ${y+cell-17}v17`,color(1),3);
        s+=rect(x,y,cell-17,cell-17,op?'#def4ec':'#f6faff',op?color(2):'#b9cde8',9)+text(x+(cell-17)/2,y+22,`PE (${r},${c})`,'atlas-micro','middle')+text(x+(cell-17)/2,y+cell*.51,d.sums[r][c],'atlas-operator','middle')+text(x+(cell-17)/2,y+cell*.72,op?`${op.a} × ${op.b}`:'accumulator','atlas-micro','middle');
    }
    for(let r=0;r<n;r++)s+=text(x0-30,y0+r*cell+cell/2-10,`A[${r}]`,'atlas-small','end')+text(x0-30,y0+r*cell+cell/2+17,A[r].join(', '),'atlas-small','end')+path(`M${x0-20} ${y0+r*cell+cell/2}h20`,color(0),3);
    for(let c=0;c<m;c++)s+=text(x0+c*cell+(cell-17)/2,42,`B col ${c}`,'atlas-small','middle');
    return s+caption(`Cycle ${cycle<0?'reset':cycle} · C[i,j] ← C[i,j] + A[i,k] × B[k,j]`);
}
function tensor(cfg,state){
    const n=4,values=[[1,2,0,3],[4,0,2,1],[0,3,1,2],[2,1,4,0]],b=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];let s='';
    const labels=cfg.variant==='sparse'?['Dense tensor','Nonzero values','Coordinate index']:cfg.variant==='tiling'?['Full matrix','SRAM tiles','Masked tail']:cfg.variant==='dataflow'?['A · activation','B · weights','C · output stationary']:['Activation','Weight matrix','Output'];
    for(let p=0;p<3;p++){
        const x=65+p*310;s+=text(x+110,68,labels[p],'atlas-small','middle');
        for(let r=0;r<n;r++)for(let c=0;c<n;c++){
            const val=p===1?b[r][c]:values[r][c],on=cfg.variant==='sparse'?val!==0:cfg.variant==='tiling'?Math.floor(r/2)*2+Math.floor(c/2)===state.step:p===0?c===state.step:p===1?r===state.step:false;
            s+=rect(x+c*54,105+r*54,48,48,on?`${color(p)}28`:'#f7faff',color(p),5)+text(x+c*54+24,136,cfg.variant==='sparse'&&p===2?`${r},${c}`:val,'atlas-small','middle');
        }
        if(p<2)s+=text(x+265,224,p?'=':'×','atlas-operator','middle');
    }
    if(cfg.variant==='sparse')return s+caption('Zero values need no MAC, but indices and gathering still cost storage and bandwidth');
    return s+caption(cfg.variant==='dataflow'?'Output stationary: C stays in the PE; A moves across rows and B across columns':'Example matrices: B = identity, so C = A');
}

function plot(fn,{xmin=-3,xmax=3,ymin=-1,ymax=1,xlabel='Input',ylabel='Output',mark=0,stepped=false}={}){
    const sx=scaleLinear().domain([xmin,xmax]).range([115,865]),sy=scaleLinear().domain([ymin,ymax]).range([390,65]);let s='';
    for(let i=0;i<=5;i++){const x=xmin+(xmax-xmin)*i/5,y=ymin+(ymax-ymin)*i/5;s+=path(`M${sx(x)} 65V390M115 ${sy(y)}H865`,'#dce7f3',1)+text(sx(x),420,f(x),'atlas-micro','middle')+text(95,sy(y)+5,f(y),'atlas-micro','end');}
    const xs=Array.from({length:201},(_,i)=>xmin+(xmax-xmin)*i/200);
    s+=path(line().x(sx).y(x=>sy(fn(x))).curve(stepped?curveStepAfter:curveBasis)(xs),color(0),3)+text(120,36,ylabel,'atlas-small')+text(480,466,xlabel,'atlas-small','middle');
    mark=Math.max(xmin,Math.min(xmax,mark));s+=circle(sx(mark),sy(fn(mark)),7,color(1))+path(`M${sx(mark)} 390V${sy(fn(mark))}`,color(1),1.4,'atlas-dashed');return s;
}
function curve(cfg,state){
    const v=value(cfg,{value:3.7,scale:.25,width:8,zero:0,x:1,mode:'relu'});
    if(cfg.variant==='quantize'){
        const span=Math.max(Math.abs(v.value)*1.3,v.scale*5),q=M.quantize(v.value,v.scale,v.width,v.zero);
        return plot(x=>M.quantize(x,v.scale,v.width,v.zero).restored,{xmin:-span,xmax:span,ymin:-span,ymax:span,mark:v.value,stepped:true,xlabel:`x = ${v.value} → q = ${q.integer} → x̂ = ${f(q.restored)}`,ylabel:`Scale ${v.scale} · signed ${v.width}-bit · zero ${v.zero}`});
    }
    return plot(x=>D.activation(x,v.mode),{ymin:-1,ymax:3,mark:v.x,xlabel:`${v.mode} · x = ${v.x}`,ylabel:'Activation output'});
}
function roofline(cfg,state){
    const v=value(cfg,{operations:1000,bytes:100,peak:1000,bandwidthGB:100}),d=M.roofline({...v,operations:v.operations*1e6,bytes:v.bytes*1e6});
    const maxX=Math.max(d.ridge*4,d.intensity*2,1),sx=x=>120+Math.log2(1+x)/Math.log2(1+maxX)*730,sy=y=>390-y/v.peak*300;let s='';
    for(let i=0;i<=4;i++){const y=v.peak*i/4;s+=path(`M120 ${sy(y)}H850`,'#dce7f3',1)+text(100,sy(y)+5,f(y),'atlas-small','end');}
    const points=Array.from({length:101},(_,i)=>maxX*i/100);s+=path(line().x(sx).y(x=>sy(Math.min(v.peak,x*v.bandwidthGB)))(points),color(0),4);
    for(const x of [0,d.ridge,maxX])s+=text(sx(x),423,f(x),'atlas-small','middle');
    s+=circle(sx(d.intensity),sy(d.performance),8,color(1))+text(120,40,`Performance (Gop/s) · ${f(d.performance)} · ${d.bound}`,'atlas-small')+text(480,470,'Arithmetic intensity (op / byte) · logarithmic spacing','atlas-small','middle');return s;
}
function register(cfg,state){
    const v=value(cfg,{previous:255,value:15,access:'RW',strobe:15}),d=D.registerWrite(v.previous,v.value,v.access,v.strobe);let s=text(480,45,`${v.access}: ${hex(v.previous,8)} → ${hex(d.value,8)}`,'atlas-chip-label','middle');
    for(let b=0;b<4;b++){
        const x=130+b*195,byte=3-b,enabled=Boolean(v.strobe&(1<<byte));s+=text(x+82,110,`Byte ${byte}`,'atlas-small','middle');
        for(let bit=0;bit<8;bit++)s+=rect(x+bit*20,150,18,85,enabled?'#e5f1ff':'#eff2f6',enabled?color(0):'#c9d4e2',3)+text(x+bit*20+9,199,(d.value>>>(byte*8+7-bit))&1,'atlas-small','middle');
        s+=circle(x+80,285,14,enabled?color(2):'#c5d0df')+text(x+80,330,`WSTRB[${byte}] = ${Number(enabled)}`,'atlas-small','middle');
    }
    return s+caption(`Write data ${hex(v.value,8)} · write mask ${hex(d.mask,8)} · RO preserves, W1C clears 1 bits`);
}

function pipeline(cfg,state){
    let s='';const names=['IF · I-cache','ID · Regfile','EX · ALU','MEM · D-cache','WB · Mux'];
    names.forEach((name,i)=>{const x=30+i*187;s+=rect(x,100,151,100,i===state.step?'#e0edff':'#f7faff',color(i),7)+text(x+75,155,name,'atlas-small','middle');if(i<4)s+=rect(x+159,80,13,140,'#cddbeb','#a6bbd2',2)+path(`M${x+151} 150h36`,color(i),2.5);});
    s+=path('M846 200V256H293V200',color(2),3)+text(550,283,'Writeback → register file','atlas-small','middle')+path('M665 100V43H465V100',color(4),3)+text(585,27,'Forwarding bypass','atlas-small','middle');
    for(let r=0;r<3;r++){s+=text(45,345+r*43,`I${r}`,'atlas-small');for(let c=0;c<7;c++){const stage=c-r;s+=rect(140+c*105,317+r*43,96,34,stage>=0&&stage<5?`${color(stage)}25`:'#f6f8fc','none',3);if(stage>=0&&stage<5)s+=text(188+c*105,340+r*43,['IF','ID','EX','MEM','WB'][stage],'atlas-small','middle');}}
    return s+caption('Ideal pipeline schedule · dependent loads may require a stall even with forwarding');
}
function timing(cfg,state){
    const v=value(cfg,{period:10,delay:6,minDelay:.3,skew:.2}),d=M.timing(v);let s=dff(75,95,'Launch',0)+dff(795,95,'Capture',1);
    s+=path('M159 139H330M630 139H795',color(0),3)+rect(330,95,300,90,'#eff6ff',color(0),8)+text(480,132,'Combinational path','atlas-small','middle')+text(480,162,`${v.delay} ns max / ${v.minDelay} ns min`,'atlas-small','middle');
    s+=path('M117 185V235H837V185',color(1),2.5)+text(480,225,`Clock period ${v.period} ns · capture skew ${v.skew} ns`,'atlas-small','middle');
    const max=Math.max(v.period+Math.abs(v.skew)+2,d.arrival+1),sx=t=>160+t/max*650;
    for(const [y,label,arrival,required,slack,c] of [[310,'Setup',d.arrival,d.required,d.setupSlack,0],[405,'Hold',d.holdArrival,d.holdRequired,d.holdSlack,2]]){
        s+=text(55,y+5,label,'atlas-small')+path(`M160 ${y}H850`,'#b9cbe2',2)+rect(Math.min(sx(arrival),sx(required)),y-18,Math.abs(sx(arrival)-sx(required)),36,slack>=0?'#d9f1e8':'#ffe1e6','none',0)+path(`M${sx(required)} ${y-28}v56`,color(1),2)+circle(sx(arrival),y,7,color(c));
        s+=text(480,y+49,`Arrival ${f(arrival)} · required ${f(required)} · slack ${f(slack)} ns`,'atlas-small','middle');
    }return s;
}

function sourceSync(cfg,state){
    let s=chip(45,90,180,170,'Transmitter',0)+chip(735,90,180,170,'Receiver',1);
    s+=path('M237 130H723M237 205H723',color(0),3)+text(480,113,'Forwarded clock / strobe','atlas-small','middle')+text(480,188,'Data bus · matched propagation','atlas-small','middle');
    s+=waveform(90,330,780,[[0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],[0,1,1,1,0,0,0,1,1,1,1,0,0,0,1,1]],['DQS','DQ'],state.phase);
    return s+caption('Receiver shifts sampling to the data eye center · input delay constraints include board skew');
}
function reset(cfg,state){
    let s=rect(340,70,550,350,'#f3effc','#c8b8e8',14)+text(615,105,'Destination clock domain','atlas-small','middle')+text(75,210,"1'b1",'atlas-chip-label')+dff(395,165,'Sync 1',1)+dff(660,165,'Sync 2',1)+path('M145 209H395M479 209H660M744 209H860',color(0),3)+text(870,215,'rst_n','atlas-small');
    s+=path('M200 330H702V255M437 330V255',color(2),3)+dot(437,330,2)+text(55,335,'async rst_n','atlas-small')+path('M200 385H702V255M437 385V255',color(1),2,'atlas-dashed')+text(95,390,'clk','atlas-small');
    return s+caption('Both FFs asynchronously clear to 0; two destination clock edges shift 1 to release reset');
}
function handshake(cfg,state){
    let s=rect(45,70,310,340,'#eef6ff','#b9d3f2',12)+rect(605,70,310,340,'#f4effc','#cdbce9',12)+text(200,110,'Source domain','atlas-chip-label','middle')+text(760,110,'Destination domain','atlas-chip-label','middle');
    s+=chip(110,170,180,90,'Held data',0)+chip(670,170,180,90,'Capture data',1)+path('M302 215H658',color(0),5)+text(480,192,'Stable bundled data','atlas-small','middle');
    s+=path('M285 135H677',color(1),2.5)+arrow(665,135,1)+text(480,119,'REQ → 2FF sync','atlas-small','middle')+path('M677 330H285',color(2),2.5)+text(480,361,'ACK ← 2FF sync','atlas-small','middle');
    return s+caption('Data stays unchanged until the acknowledgement returns; synchronize control in both directions');
}
function asyncFifo(cfg,state){
    let s=rect(40,60,220,350,'#eef6ff','#b7d0ee',12)+rect(700,60,220,350,'#f5effc','#c7b3e6',12)+text(150,100,'Write clock','atlas-small','middle')+text(810,100,'Read clock','atlas-small','middle');
    for(let i=0;i<8;i++)s+=rect(370,75+i*38,220,31,i===state.step?'#d5ece5':'#f5f9ff','#b6cae5',4)+text(480,97+i*38,`RAM word ${i}`,'atlas-micro','middle');
    s+=path('M260 150H370M590 150H700',color(0),4)+mini(70,190,'Write pointer','binary → Gray',0)+mini(735,190,'Read pointer','binary → Gray',1)+path('M220 280H740',color(2),2,'atlas-dashed')+text(480,307,'Gray pointer → 2FF sync → empty compare','atlas-micro','middle')+path('M740 345H220',color(1),2,'atlas-dashed')+text(480,373,'Gray pointer ← 2FF sync ← full compare','atlas-micro','middle');
    return s+caption('Data crosses through dual-port RAM; synchronized Gray pointers control full / empty flags');
}
function cdc(cfg,state){
    const v=value(cfg,{pulse:1,period:4,phase:0}),d=D.cdcTrace(v);let s=rect(40,60,280,245,'#edf5ff','#b7cfed',14)+rect(445,60,475,245,'#f4effc','#ccbee7',14)+text(180,95,'Source clock domain','atlas-small','middle')+text(685,95,'Destination clock domain','atlas-small','middle');
    s+=dff(145,145,'Source',0)+dff(515,145,'Sync 1',1)+dff(760,145,'Sync 2',1)+path('M229 189H515M599 189H760M844 189H900',color(0),3)+circle(514,189,19,'#f0c36c33',color(3));
    s+=path('M187 275V235M557 275V235M802 275V235M480 275H860',color(1),2)+text(360,140,'Async','atlas-small','middle');
    s+=waveform(50,350,850,[d.map(r=>r[1]),d.map(r=>r[4])],['SRC','Q2'],state.phase);
    return s+caption('2FF reduces metastability risk; pulse capture also depends on pulse width and clock phase');
}
function safety(cfg,state){
    let s=chip(70,95,190,110,'Core A',0)+chip(70,290,190,110,'Core B',1)+path('M272 150H420L510 240M272 345H420L510 240',color(0),3)+circle(555,240,45,'#eff8f4',color(2))+text(555,248,'≠','atlas-operator','middle')+path('M600 240H715',color(4),3)+chip(730,185,160,110,'Safety control',4);
    s+=text(160,251,'Same inputs','atlas-small','middle')+text(555,330,'Mismatch monitor','atlas-small','middle');
    return s+caption('Lockstep example: compare → detect → isolate → recover · ECC and watchdog cover different faults');
}
function secure(cfg,state){
    const boot=cfg.variant==='boot',debug=cfg.variant==='debug',threat=cfg.variant==='threat',access=cfg.variant==='access';
    const labels=boot?['Reset vector','Boot ROM','SRAM init','Firmware']:debug?['Probe','Authentication','Lifecycle gate','Debug access']:threat?['External input','Trust boundary','Protected asset','Impact']:access?['Master identity','Address region','Permission','Allow / deny']:['Immutable ROM','Signed image','Signature check','Verified boot'];
    let s='';labels.forEach((label,i)=>{const x=30+i*237;s+=chip(x+15,120,180,115,label,i%3);if(i<3)s+=path(`M${x+207} 177h28`,color(i%3),3)+arrow(x+231,177,i%3);});
    s+=path('M570 247V335H780',color(4),2.5)+circle(810,335,25,'#ffe5eb',color(4))+text(810,343,'×','atlas-operator','middle')+text(650,379,boot?'Boot failure / recovery':debug?'Locked state → denied':'Failed policy / verification → reject','atlas-small','middle');
    s+=path('M110 280H535',color(2),2,'atlas-dashed')+text(305,312,boot?'Clock · reset · memory ready':'Protected trust anchor / policy','atlas-small','middle');
    return s+caption(boot?'First instruction → initialization → firmware handoff':'Authorization must succeed before execution or access is enabled');
}
function scan(cfg,state){
    const v=value(cfg,{pattern:10,fault:-1}),d=D.scanTrace(v);let s=text(30,195,'SI','atlas-small');
    for(let i=0;i<4;i++){
        const x=130+i*200,mx=x-40;s+=`<path d="M${mx} 138l22 13v65l-22 13Z" fill="#eaf2ff" stroke="${color(0)}" stroke-width="2"/>`+dff(x,135,`FF ${i}`,i%3)+path(`M${mx+22} 179H${x}`,color(0),2.5)+path(`M${i?x-106:55} 195H${mx}`,color(0),2.5)+path(`M${x+84} 179H${x+94}V195H${i<3?x+160:905}`,color(0),2.5)+text(x+42,259,d.rows[Math.min(cfg.lab?.cycle??state.step,4)][i+2],'atlas-small','middle');
        s+=path(`M${mx-20} 151H${mx}M${mx-20} 151V95`,color(2),1.7)+path(`M${mx+11} 144V63`,color(2),1.7)+path(`M${x+42} 225V285`,color(1),2);
    }
    s+=path('M85 63H800',color(2),2)+text(430,43,'SE · 1 = shift / 0 = functional capture','atlas-small','middle')+text(55,88,'Functional D','atlas-micro')+path('M75 285H830',color(1),2.5)+text(50,291,'CLK','atlas-small')+text(910,200,'SO','atlas-small');
    s+=waveform(65,350,835,[[1,1,1,1,1,0,0,1,1,1],[0,1,0,1,0,1,0,1,0,1]],['SE','CLK'],state.phase);
    return s+caption(`Scan pattern ${hex(v.pattern,1)} · shift in → capture combinational response → shift out`);
}
function power(cfg,state){
    const off=state.step===2,iso=state.step===1||off;let s=rect(35,80,285,300,'#edf8f3','#98ceba',12)+rect(460,80,460,300,off?'#eef0f4':'#f4effb','#c7b8e2',12)+text(175,118,'Always-on domain','atlas-small','middle')+text(690,118,'Switchable domain','atlas-small','middle');
    s+=chip(80,165,190,100,'PMU',2)+chip(620,165,240,100,'Logic / retention',1)+rect(360,190,115,65,iso?'#fff0cf':'#fff',color(3),7)+text(417,229,'ISO','atlas-chip-label','middle');
    s+=path('M608 214H475M360 222H282',color(0),3)+text(415,286,iso?'Clamp active':'Data passes','atlas-small','middle')+path('M170 55H745V155',color(3),4)+circle(745,65,5,'#fff',color(3))+path(`M745 72l${off?-18:0} 28M745 108v47`,color(3),3)+text(635,37,'VDD → header switch','atlas-small','middle')+path('M270 290H417V255',color(2),2)+text(315,332,'isolation control','atlas-micro','middle');
    return s+caption(cfg.variant==='dvfs'?'Raise voltage before increasing frequency; lower frequency before lowering voltage':cfg.variant==='retention'?'Save state → isolate → switch off → power on → restore → release isolation':'Switchable outputs cross an always-powered isolation cell before reaching the active domain');
}
function fpga(cfg,state){
    let s=rect(90,50,780,365,'#f5f9ff','#a6bedb',12);const labels=['CLB','BRAM','CLB','DSP','CLB','CLB'];
    for(let r=0;r<4;r++)for(let c=0;c<6;c++){
        const x=170+c*112,y=85+r*76,cl=c===1?2:c===3?3:0;s+=rect(x,y,80,48,`${color(cl)}20`,color(cl),5)+text(x+40,y+29,labels[c],'atlas-small','middle');
        if(c<5)s+=path(`M${x+80} ${y+24}h32`,color(1),1.5);if(r<3)s+=path(`M${x+40} ${y+48}v28`,color(1),1.5);
        s+=rect(x+90,y+55,8,8,'#bfafeb','#947aca',1);
    }
    for(let i=0;i<4;i++)s+=rect(110,91+i*76,33,48,'#d9e2ed','#a9b9cb',3)+rect(825,91+i*76,27,48,'#d9e2ed','#a9b9cb',3);
    return s+caption('CLB = LUT + FF · BRAM = memory · DSP = arithmetic · programmable switch boxes connect them');
}
function synth(cfg,state){
    let s=rect(35,85,240,290,'#f6f9fe','#bfcee1',10)+text(155,58,'RTL expression','atlas-small','middle');
    ['assign y = sel','  ? (a & b)','  : (a | b);'].forEach((l,i)=>s+=text(60,170+i*47,l,'atlas-small'));
    s+=text(560,58,'Boolean network → library cells','atlas-small','middle');
    for(const [y,label,c] of [[115,'AND2',0],[285,'OR2',2]])s+=rect(400,y,135,75,'#f2f8fe',color(c),5)+text(467,y+44,label,'atlas-small','middle')+path(`M335 ${y+25}H400M335 ${y+50}H400M535 ${y+38}H620V${y<200?178:242}H700`,color(c),2);
    s+=`<path d="M700 140l100 40v85l-100 40Z" fill="#eee7fb" stroke="${color(1)}" stroke-width="2"/>`+text(745,228,'MUX2','atlas-small','middle')+path('M800 220H900M735 345V291',color(1),2.5)+text(735,372,'sel','atlas-small','middle')+text(910,225,'y','atlas-small');
    return s+caption('Technology mapping preserves the Boolean function and chooses legal cells under timing / area constraints');
}
function equivalence(cfg,state){
    let s=text(65,240,'Inputs','atlas-small')+path('M145 235H230V125H350M230 235V345H350',color(0),3)+dot(230,235,0)+chip(365,75,200,100,'Reference',0)+chip(365,295,200,100,'Implementation',1)+path('M577 125H665V211H730M577 345H665V260H730',color(0),3)+circle(775,235,45,'#f5f0fc',color(1))+text(775,243,'≠','atlas-operator','middle')+path('M820 235H900',color(4),3)+text(880,202,'mismatch','atlas-small','middle');
    return s+caption('Miter: prove mismatch unreachable under matched reset, state mapping and input assumptions');
}

export const specialized={serial,'serial/usb':usb,'serial/can':can,'serial/source-sync':sourceSync,array,tensor,curve,roofline,register,pipeline,timing,cdc,'cdc/reset':reset,'cdc/handshake':handshake,'memory/fifo':asyncFifo,'scan/fault-detect':safety,security:secure,scan,power,'floorplan/fpga':fpga,'graph/synthesis':synth,'formal/equivalence':equivalence};
