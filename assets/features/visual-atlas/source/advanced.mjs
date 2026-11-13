import {line,curveBasis} from 'd3';
import {color,text,path,circle,rect,rail,dot,ground,resistor,capacitor,arrow,chip,dff,mos,waveform} from './drawing.mjs';
import * as M from '../../curriculum/source/models.mjs';
import * as D from '../../curriculum/source/detail-models.mjs';
const values=(cfg,defaults={})=>({...defaults,...cfg.lab?.values});
const bottom=label=>text(480,477,label,'atlas-small','middle');
const f=n=>Number(n.toFixed(3));

function adc(cfg,state){
    const v=values(cfg,{bits:4,vref:3.3,vin:1.8,sinad:23}),d=D.adc(v),step=Math.min(v.bits-1,cfg.lab?.cycle??Math.floor(state.phase*v.bits)),trial=d.sar[step];
    let s=circle(65,140,25,'#fff',color(0))+path('M45 140q10-22 20 0t20 0',color(0),2)+path('M90 140H175l25-16m-3 16h86',color(0),2.5)+capacitor(250,140)+ground(250,188)+path('M283 140H370',color(0),2.5);
    s+=`<path d="M370 100V250L505 175Z" fill="#eee6fa" stroke="${color(1)}" stroke-width="2"/>`+text(389,145,'+','atlas-small')+text(389,222,'−','atlas-small')+path('M505 175H640',color(1),3)+chip(655,120,220,105,'SAR register',1)+text(775,92,`${v.bits}-bit · code ${trial[4]}`,'atlas-chip-label','middle');
    s+=text(65,94,`Vin ${v.vin} V`,'atlas-small','middle')+text(230,78,'Sample / hold','atlas-small','middle')+text(440,70,'Comparator','atlas-small','middle');
    // The capacitor top plates share VDAC; bottom plates switch to Vref or GND.
    s+=path('M370 220H320V300H850',color(2),2.5)+path('M765 237V275',color(1),2,'atlas-dashed')+text(765,267,'DAC controls','atlas-micro','middle');
    for(let i=0;i<Math.min(v.bits,8);i++){
        const n=Math.min(v.bits,8),x=370+i*460/n,bit=v.bits-1-i,on=Boolean(trial[1]&(1<<bit));
        s+=path(`M${x} 300V317`,color(2),2)+capacitor(x,317)+path(`M${x} 365l${on?-14:14} 18`,color(on?3:0),2)+circle(x-14,387,3,'#fff',color(3))+circle(x+14,387,3,'#fff',color(0))+text(x,425,`${2**bit}C`,'atlas-micro','middle');
    }
    s+=text(190,345,`VDAC ${f(trial[2])} V`,'atlas-small','middle')+text(210,395,'switch → Vref / GND','atlas-micro','middle');
    return s+bottom(`Bit b${trial[0]} · test code ${trial[1]} · ${v.vin} ≥ ${f(trial[2])} V: ${trial[3]}`);
}
function analog(cfg,state){
    const v=values(cfg,{});let s='';
    if(cfg.variant==='bias'){
        s+=mos(250,165,false,0)+mos(620,165,false,1)+path('M302 165V80M672 165V80M302 235V335M672 235V335',color(0),2.5)+ground(302,335)+ground(672,335);
        s+=path('M250 200H210V125H302M210 200H620',color(1),2.5)+dot(302,125,0)+dot(210,200,1)+text(302,55,`Iref ${v.reference??10} µA`,'atlas-small','middle')+text(672,55,`Iout ≈ ${(v.reference??10)*(v.ratio??2)} µA`,'atlas-small','middle');
        return s+bottom('Diode-connected reference MOS establishes VGS · matched devices scale current by W/L');
    }
    if(cfg.variant==='pll'){
        const names=['PFD / CP','Loop filter','VCO'];names.forEach((n,i)=>{const x=160+i*255;s+=chip(x,105,165,95,n,i)+path(`M${x-50} 153H${x-12}`,color(i),2.5);});
        s+=path('M835 153H900M870 153V335H240V212',color(2),2.5)+rect(480,302,160,65,'#fff',color(1),6)+text(560,342,`÷ N = ${v.divider??20}`,'atlas-chip-label','middle')+text(80,128,`${v.reference??25} MHz`,'atlas-small','middle');
        return s+bottom(`Locked target: fVCO = N × fREF = ${(v.reference??25)*(v.divider??20)} MHz · loop dynamics depend on damping`);
    }
    if(cfg.variant==='rf'){
        s+=path('M75 80v130m-30-130 30 40 30-40',color(0),2.5)+chip(150,150,150,95,'LNA',0)+path('M75 210H138M312 197H435',color(0),2.5)+circle(480,197,45,'#f3ecfc',color(1))+text(480,209,'×','atlas-operator','middle')+path('M525 197H645',color(1),3)+chip(660,150,180,95,'IF filter',2)+circle(480,350,35,'#fff',color(3))+path('M480 315V242',color(3),2.5)+text(480,410,`LO ${v.lo??2300} MHz`,'atlas-small','middle');
        return s+bottom(`Mixer products: |fRF − fLO| = ${Math.abs((v.rf??2400)-(v.lo??2300))} MHz and fRF + fLO`);
    }
    s+=`<path d="M390 90V335L620 213Z" fill="#eee8fa" stroke="${color(1)}" stroke-width="2.5"/>`+text(413,164,'+','atlas-chip-label')+text(413,280,'−','atlas-chip-label')+path('M100 159H390M620 213H865',color(0),3)+path('M740 213V385H280V275H390',color(2),2.5)+rect(425,359,160,52,'#fff',color(2),5)+text(505,392,'β network','atlas-small','middle')+text(110,129,'Vin','atlas-small')+text(830,182,'Vout','atlas-small');
    return s+bottom(cfg.variant==='feedback'?'Negative feedback trades open-loop gain for controlled transfer, bandwidth and stability':'Differential input → gain stage → load · small-signal gain depends on gm and output resistance');
}
function cmos(cfg,state){
    const v=values(cfg,{voltage:1,threshold:.5,a:1,b:0,gate:'NAND'}),high=state.step%2===1;
    if(cfg.variant==='gates'){
        let s=text(480,30,'VDD','atlas-small','middle')+path('M300 55H660M300 55V85M660 55V85',color(3),3)+mos(248,85,true,1)+mos(608,85,true,1)+path('M300 155V195H660V155M480 195V240',color(2),3)+mos(428,240,false,0)+mos(428,325,false,0)+path('M480 310V325M480 395V420',color(0),3)+ground(480,420)+path('M480 195H850',color(2),3)+text(860,201,'Y','atlas-small');
        s+=text(230,125,'A','atlas-small','end')+text(590,125,'B','atlas-small','end')+text(410,281,'A','atlas-small','end')+text(410,366,'B','atlas-small','end');
        return s+bottom('2-input NAND: parallel PMOS pull-up / series NMOS pull-down · Y = ¬(A · B)');
    }
    let s=text(260,35,`VDD ${v.voltage} V`,'atlas-small','middle')+path('M260 45V80',color(3),3)+mos(208,80,true,high?3:1)+mos(208,255,false,high?0:3)+path('M260 150V255M260 325V370',color(0),3)+ground(260,370)+path('M55 220H155V115H208M155 220V290H208',color(1),2.5)+path('M260 220H395',color(2),3)+dot(260,220,2)+text(75,195,high?'Vin HIGH':'Vin LOW','atlas-small')+text(335,205,high?'Y LOW':'Y HIGH','atlas-small');
    const points=Array.from({length:101},(_,i)=>{const x=i/100,y=1/(1+Math.exp((x-v.threshold)*18));return[490+x*385,385-y*280];});
    s+=path('M490 90V385H880','#99afcb',1.5)+path(line().curve(curveBasis)(points),color(0),3)+text(675,425,'Vin / VDD','atlas-small','middle')+text(480,68,'Vout / VDD','atlas-small')+circle(...points[high?90:10],7,color(1));
    return s+bottom(cfg.variant==='power'?`Pdynamic = α C V² f = ${f(M.power(v).dynamicMW)} mW · leakage ${f(M.power(v).leakageMW)} mW`:'Complementary pull-up / pull-down · VTC is an illustrative smooth transfer, not a SPICE model');
}
function noise(cfg,state){
    const v=values(cfg,{sigma:3});let s=path('M105 90V390H500M560 90V390H910','#9eb2cb',1.5);
    const samples=Array.from({length:121},(_,i)=>[110+i*3.2,235+(Math.sin(i*2.7)+Math.sin(i*.91)+Math.sin(i*1.53))*v.sigma*6]);
    s+=path(line()(samples),color(0),2)+text(300,55,'Noise over time','atlas-small','middle')+text(300,432,'Time (illustrative)','atlas-small','middle');
    const gauss=Array.from({length:81},(_,i)=>{const x=(i-40)/10;return[570+i*4,390-Math.exp(-x*x/2)*260];});
    s+=path(line().curve(curveBasis)(gauss),color(1),3)+text(740,55,`Distribution · σ ${v.sigma} mV`,'atlas-small','middle')+text(740,432,'Normalized amplitude','atlas-small','middle');return s+bottom('Random noise varies from sample to sample; mismatch is a persistent device-to-device offset');
}
function specialDevice(cfg,state){
    let s='';const titles=['Power device','CMOS image sensor','MEMS sensor'];titles.forEach((n,i)=>s+=text(170+i*310,55,n,'atlas-chip-label','middle'));
    s+=rect(65,210,205,150,'#d8e4ef','#96aeca',3)+rect(80,190,175,20,'#b7a0df','#8c71b9',3)+path('M170 190V120M115 210V145M225 210V145',color(0),3)+text(170,400,'SiC / GaN · high field','atlas-small','middle');
    for(let r=0;r<4;r++)for(let c=0;c<4;c++)s+=rect(385+c*45,160+r*45,38,38,[ '#b1d9b7','#b2c9ed','#efc6bc'][(r+c)%3],'#9bb2ce',3);
    s+=path('M450 90l-30 55m90-55-30 55',color(3),3)+text(480,400,'Photodiode → ADC','atlas-small','middle');
    s+=rect(695,160,200,180,'#edf3fa','#a8bbd1',5)+rect(750,205,90,90,'#a5c5e4','#7c9dbf',3)+path('M695 245h12l8-10 8 20 8-20 8 20 11-10M840 245h10l8-10 8 20 8-20 8 20 13-10',color(0),2)+text(795,400,'Displacement → capacitance','atlas-small','middle');return s;
}
function reorder(cfg,state){
    let s=chip(35,150,145,100,'Rename',0)+path('M192 200H285',color(0),3);const operations=['I0 · slow load','I1 · independent add','I2 · multiply','I3 · branch'];
    operations.forEach((n,i)=>{s+=rect(290,70+i*90,260,63,'#f4f9fe',color(i%3),5)+text(420,108+i*90,n,'atlas-small','middle')+path(`M550 ${102+i*90}H640`,color(i%3),2)+rect(650,70+i*90,190,63,i===0?'#fff2d7':'#e1f3ec',i===0?color(3):color(2),5)+text(745,108+i*90,i===0?'Not ready':'Completed','atlas-small','middle');});
    s+=text(420,35,'Issue / execution queue','atlas-small','middle')+text(745,35,'ROB in program order','atlas-small','middle')+path('M865 80V395',color(0),2)+text(745,445,'Commit waits at head I0','atlas-small','middle');return s;
}
function simd(cfg,state){
    let s=rect(65,55,830,65,'#f1eafc',color(1),8)+text(480,96,'One decoded instruction controls multiple active lanes','atlas-small','middle');
    for(let i=0;i<8;i++){
        const x=80+i*105;s+=path(`M${x+35} 120V180`,color(1),2)+circle(x+35,230,34,i>5?'#eef1f6':'#e2eefb',color(0))+text(x+35,239,'ALU','atlas-small','middle')+path(`M${x+35} 265V330`,color(2),2)+rect(x,335,70,65,'#fff',color(2),5)+text(x+35,373,`R${i}`,'atlas-small','middle')+text(x+35,165,`Lane ${i}`,'atlas-micro','middle');
    }return s+bottom('Vector / SIMD example · inactive lanes are masked; lane operands remain independent');
}
function sharing(cfg,state){
    let s=text(250,45,'Duplicated operators','atlas-chip-label','middle')+text(730,45,'Shared operator','atlas-chip-label','middle');
    for(let i=0;i<2;i++)s+=circle(230,160+i*160,42,'#e8f2fe',color(0))+text(230,173,'×','atlas-operator','middle')+path(`M90 ${145+i*160}H192M90 ${175+i*160}H192M272 ${160+i*160}H385`,color(0),2.5);
    s+=`<path d="M580 105l65 35v190l-65 35Z" fill="#eee8fa" stroke="${color(1)}" stroke-width="2"/>`+text(615,245,'MUX','atlas-small','middle')+circle(760,235,45,'#e8f2fe',color(0))+text(760,249,'×','atlas-operator','middle')+path('M645 235H715M805 235H900M500 160H580M500 310H580',color(0),3)+text(730,421,'Schedule 0 / 1 selects one operation','atlas-small','middle');
    return s+bottom('Sharing saves arithmetic area but adds selection delay and may require extra cycles');
}
function ppa(cfg,state){
    let s=path('M130 80V390H850','#95adcb',2)+text(100,70,'Delay','atlas-small')+text(480,440,'Area','atlas-small','middle');
    const pts=[[210,140],[270,225],[390,292],[540,325],[720,340],[520,225],[730,180]];
    pts.forEach(([x,y],i)=>{s+=circle(x,y,11+i%3*6,`${color(i%3)}55`,color(i%3))+text(x+18,y-16,`Impl ${i+1}`,'atlas-small');});
    s+=path(line().curve(curveBasis)(pts.slice(0,5)),color(0),2,'atlas-dashed');return s+bottom('Illustrative design alternatives · bubble area represents power · compare equal functional constraints');
}
function pvt(cfg,state){
    const v=values(cfg,{period:10,nominal:7}),volts=[.7,.8,.9,1,1.1],temps=[-20,25,70,100,125];let s=text(480,40,'Voltage / temperature shmoo · illustrative delay scaling','atlas-small','middle');
    for(let r=0;r<5;r++){s+=text(150,123+r*61,`${temps[r]} °C`,'atlas-small','end');for(let c=0;c<5;c++){const delay=D.pvtDelay(v.nominal,volts[c],temps[r]),pass=delay<=v.period,x=200+c*119,y=90+r*61;s+=rect(x,y,110,53,pass?'#d9f1e5':'#ffe0e6',pass?'#88c3a7':'#e9a0af',5)+text(x+55,y+32,`${f(delay)} ns`,'atlas-small','middle');}}
    volts.forEach((v,c)=>s+=text(255+c*119,427,`${v} V`,'atlas-small','middle'));return s+bottom(`PASS when modeled delay ≤ ${v.period} ns · actual silicon characterization needs measured data`);
}
function corners(cfg,state){
    const rows=['Functional','Low power','Scan shift','Scan capture'],cols=['SS / RCmax','TT / nominal','FF / RCmin'];let s='';
    cols.forEach((c,i)=>s+=text(390+i*190,65,c,'atlas-small','middle'));rows.forEach((r,j)=>{s+=text(235,145+j*80,r,'atlas-small','end');cols.forEach((c,i)=>s+=rect(300+i*190,105+j*80,176,60,'#eef5ff',color(i),5)+text(388+i*190,141+j*80,j===state.step?'Analyze':'Setup + hold','atlas-small','middle'));});
    return s+bottom('Mode × PVT × parasitic corner coverage · each view needs its own constraints and libraries');
}
function budget(cfg,state){
    const v=values(cfg,{required:100,latency:100,kind:'all'}),rows=D.interfaceBudget(v),max=Math.max(...rows.map(r=>r.rate));let s=text(480,40,`Demand ${v.required} Mb/s · serialization budget ${v.latency} µs`,'atlas-small','middle');
    rows.forEach(({name,rate,pass},i)=>{const y=83+i*58,w=Math.log10(rate+1)/Math.log10(max+1)*575;s+=text(190,y+25,name,'atlas-small','end')+rect(215,y,w,33,pass?'#d6eddf':'#ffe2e7',pass?color(2):color(4),3)+text(230+w,y+24,`${f(rate)} Mb/s`,'atlas-micro');});
    return s+bottom('Rates are selected educational examples; device mode, duplexing, topology and protocol overhead matter');
}
function soc(cfg,state){
    let s='';const blocks=[['ROM',65,75,0],['CPU',350,75,1],['SRAM',655,75,2],['DMA',65,325,2],['UART',350,325,0],['Timer / IRQ',655,325,1]];
    blocks.forEach(([name,x,y,c])=>s+=chip(x,y,220,95,name,c)+path(`M${x+110} ${y<200?182:325}V250`,color(c),2.5));
    s+=rect(55,225,850,48,'#e9f2fe','#92b6e6',6)+text(480,255,'Address decode · read / write · completion / error','atlas-small','middle')+path('M770 325V300H460V182',color(4),2,'atlas-dashed')+text(605,294,'IRQ','atlas-micro','middle');
    return s+bottom('Boot ROM fetch → SRAM init → peripheral MMIO → DMA transfer → interrupt handling');
}
function dma(cfg,state){
    const v=values(cfg,{length:32,beat:4,source:4096,destination:8192,stall:0,timeout:100}),d=M.dmaTrace({...v,errorAt:cfg.lab?.fault?3:-1}),row=d.rows[Math.min(cfg.lab?.cycle??state.step,d.rows.length-1)];
    let s=chip(55,38,150,78,'CPU',0)+path('M217 76H350',color(1),2.5)+text(278,57,'Configure','atlas-micro','middle');
    s+=rect(350,30,300,330,'#f6f9ff',color(1),12)+text(500,62,'DMA ENGINE','atlas-chip-label','middle');
    [['SRC',v.source],['DST',v.destination],['LEN',v.length]].forEach(([name,val],i)=>s+=rect(372,87+i*39,256,31,'#fff','#c5d6eb',4)+text(390,108+i*39,name,'atlas-micro')+text(610,108+i*39,val,'atlas-small','end'));
    s+=text(500,236,'Read / write channels + FIFO','atlas-small','middle');
    for(let i=0;i<5;i++)s+=rect(377+i*50,258,43,42,i<row.transferred/v.beat%6?'#c8e6dc':'#e8eff8',color(2),4)+text(398+i*50,284,i,'atlas-micro','middle');
    s+=text(500,335,`${row.transferred} / ${v.length} byte accepted`,'atlas-small','middle');
    s+=rect(55,192,180,145,'#eef5ff',color(0),8)+text(145,220,'Source memory','atlas-small','middle');for(let i=0;i<4;i++)for(let j=0;j<5;j++)s+=rect(72+j*29,239+i*18,22,12,'#bcd8fa','none',2);
    s+=chip(750,207,150,100,'Destination',2)+path('M247 260H338M662 280H738',color(0),3)+arrow(330,260)+arrow(730,280)+text(287,242,'READ','atlas-micro','middle')+text(700,260,'WRITE','atlas-micro','middle');
    s+=path('M645 45H815V138H130V128',color(4),2,'atlas-dashed')+text(795,125,`IRQ = ${row.irq}`,'atlas-micro','middle');
    const n=Math.min(16,Math.ceil(v.length/v.beat)),w=800/n;for(let i=0;i<n;i++)s+=rect(80+i*w,393,w-5,43,i*v.beat<row.transferred?'#bfdfd1':'#edf3fa','#abc1db',5)+text(80+(i+.5)*w-2,421,i,'atlas-micro','middle');
    return s+bottom(`${row.event} · remaining ${row.remaining} byte · READY=0 holds the transfer position`);
}

function channel(cfg,state){
    const v=values(cfg,{}),mode=cfg.variant;let s='';
    if(mode==='ddr'){
        const d=D.training(v);s+=chip(35,55,175,110,'DDR controller',0)+chip(750,55,175,110,'DRAM',1)+path('M222 95H738M222 140H738',color(0),3)+text(480,81,'DQ[7:0] · bidirectional data','atlas-small','middle')+text(480,126,'DQS · source-synchronous strobe','atlas-small','middle');
        d.windows.forEach((row,i)=>{const y=210+i*27;s+=text(155,y+15,`DQ${i}`,'atlas-micro','end')+rect(185,y,620,18,'#eef2f7','none',3)+rect(185+row.start/31*620,y,(row.end-row.start)/31*620,18,'#c9e9de','none',3);});
        s+=path(`M${185+(v.tap??16)/31*620} 193V430`,color(1),3);return s+bottom(`Selected tap ${v.tap??16} · common window ${d.start}…${d.end} · ${d.pass?'PASS':'FAIL'}`);
    }
    if(mode==='reflection'||mode==='package-si'){
        const d=D.reflection(v);s+=text(170,48,'Source ZS','atlas-small','middle')+text(790,48,'Load ZL','atlas-small','middle')+path('M170 75V420M790 75V420','#b5c8df',2);
        for(let i=0;i<4;i++){const y=90+i*75;s+=path(i%2?`M790 ${y}L170 ${y+75}`:`M170 ${y}L790 ${y+75}`,color(i%3),2.5);}
        s+=text(480,210,`ΓL = ${f(d.gamma)}`,'atlas-chip-label','middle')+text(480,253,`ΓS = ${f(d.sourceGamma)}`,'atlas-small','middle');return s+bottom(`First launched step ${f(d.launched)} V · successive bounces multiply by the reflection coefficients`);
    }
    const names=mode==='pcie'?['Root complex','Endpoint']:mode==='mipi'?['Image sensor','CSI receiver']:mode==='boundary'?['SoC / controller','External device']:['Serializer / TX','RX / deserializer'];
    s+=chip(35,105,185,150,names[0],0)+chip(740,105,185,150,names[1],1);
    const lanes=mode==='mipi'?Math.min(4,v.lanes??2):mode==='pcie'?Math.min(4,v.lanes??4):2;
    for(let i=0;i<lanes;i++){const y=115+i*33;s+=path(`M232 ${y}H728M232 ${y+8}H728`,color(i%3),2)+text(480,y-8,mode==='boundary'?i?'PHY → channel → PHY':'Request / response encoding':`Differential lane ${i}`,'atlas-micro','middle');}
    if(mode==='pcie'){
        ['Detect','Polling','Configuration','L0'].forEach((n,i)=>{s+=rect(65+i*225,335,190,65,i===state.step?'#d9eaff':'#f4f8fc',color(0),6)+text(160+i*225,373,n,'atlas-small','middle');});
        return s+bottom(`Gen ${v.generation??3} ×${v.lanes??4} link · a lane contains distinct transmit and receive differential pairs`);
    }
    if(mode==='mipi'){
        const d=D.pixelBudget(v);for(let r=0;r<4;r++)for(let c=0;c<16;c++)s+=rect(185+c*35,300+r*30,31,25,[ '#bddaf2','#cce7d7','#ebcad4'][(r+c)%3],'none',2);
        return s+bottom(`Image payload ${f(d.payload)} Gb/s · with overhead ${f(d.required)} Gb/s · margin ${f(d.margin)} Gb/s`);
    }
    let curves='';for(let n=0;n<20;n++){const points=Array.from({length:51},(_,i)=>[325+i*6,365+Math.sin(i/50*Math.PI*2+n%2*Math.PI)*45*(.85+n*.005)+Math.sin(i*1.9+n)*2]);curves+=path(line().curve(curveBasis)(points),n%2?'#8b5cf655':'#3182f655',1.1);}
    return s+curves+bottom('Logical transactions become encoded symbols, electrical waveforms and sampled data across the channel');
}
function ethernet(cfg,state){
    let s='';const labels=['Packet buffer','MAC','PHY','Magnetics','Cable'];labels.forEach((name,i)=>{const x=25+i*190;s+=chip(x,130,145,100,name,i%3);if(i<4)s+=path(`M${x+157} 180h21`,color(i%3),2.5)+arrow(x+178,180,i%3);});
    const fields=[['Preamble',100],['Header',120],['Payload',410],['FCS',80],['IFG',110]];let x=65;fields.forEach(([n,w],i)=>{s+=rect(x,330,w,63,`${color(i%3)}22`,color(i%3),3)+text(x+w/2,367,n,'atlas-small','middle');x+=w;});
    return s+bottom('MAC frame overhead and inter-frame gap consume link time; a full queue introduces latency or drops');
}
function banks(cfg,state){
    const v=values(cfg,{banks:4,stride:1,requests:8}),d=D.bankAccess(v),n=Math.min(v.banks,8);let s='';
    for(let b=0;b<n;b++){const x=80+b*800/n;s+=text(x+350/n,55,`Bank ${b}`,'atlas-small','middle');for(let r=0;r<9;r++)s+=rect(x,85+r*33,700/n,26,r===state.step?'#b9d8f8':'#e9f1fb','#b9cce3',3);}
    return s+bottom(`${v.requests} requests · address stride ${v.stride} · bank = word address mod ${v.banks} · conflicts serialize access`);
}
function overlap(cfg,state){
    const v=values(cfg,{tiles:4,load:3,compute:5,store:2}),d=D.overlap(v),end=d.rows.at(-1).sEnd,sx=t=>180+t/end*700;let s='';
    ['Load DMA','Compute','Store DMA'].forEach((label,i)=>s+=text(155,125+i*105,label,'atlas-small','end'));
    for(const row of d.rows)for(const [i,a,b] of [[0,'lStart','lEnd'],[1,'cStart','cEnd'],[2,'sStart','sEnd']])s+=rect(sx(row[a]),90+i*105,Math.max(8,sx(row[b])-sx(row[a])-3),60,`${color(i)}25`,color(i),4)+text((sx(row[a])+sx(row[b]))/2,126+i*105,`T${row.tile} B${row.buffer}`,'atlas-micro','middle');
    for(let i=0;i<=5;i++)s+=text(sx(end*i/5),435,f(end*i/5),'atlas-small','middle');return s+bottom('Cycles · a buffer can be reused only after the previous tile using that buffer has completed store');
}
function gatedClock(cfg,state){
    let s=text(60,160,'Enable','atlas-small')+path('M140 155H270',color(0),2.5)+rect(270,110,185,110,'#edf5ff',color(0),7)+text(362,150,'Low-level','atlas-small','middle')+text(362,181,'latch','atlas-small','middle')+path('M455 165H610',color(0),3);
    s+=`<path d="M610 135h45a45 45 0 0 1 0 90h-45Z" fill="#eee7fa" stroke="${color(1)}" stroke-width="2"/>`+path('M700 180H875',color(1),3)+text(830,152,'Gated CLK','atlas-small','middle')+path('M140 270H550V200H610M362 270V220',color(1),2.5)+text(70,275,'CLK','atlas-small');
    s+=waveform(65,340,830,[[0,1,0,1,0,1,0,1,0,1,0,1],[0,0,0,0,0,1,0,1,0,1,0,0]],['CLK','GCLK'],state.phase);return s+bottom('Latch enable while CLK is low, then hold it throughout the high phase to avoid a truncated pulse');
}
function rdc(cfg,state){
    let s=rect(55,70,330,290,'#eef6ff','#bfd4ee',12)+rect(575,70,330,290,'#f4effb','#cfbfe8',12)+text(220,105,'Reset domain A','atlas-small','middle')+text(740,105,'Reset domain B','atlas-small','middle')+dff(175,165,'Source',0)+dff(680,165,'Receiver',1)+path('M259 209H680',color(0),3)+text(480,186,'Data changes on reset A','atlas-small','middle');
    s+=path('M125 315H217V255M630 315H722V255',color(4),2.5)+text(155,345,'Reset A','atlas-small','middle')+text(660,345,'Reset B','atlas-small','middle');
    return s+bottom('Even a shared clock does not remove reset-induced asynchronous transitions; review the crossing protocol');
}
function simulation(cfg,state){
    let s=rect(50,65,560,340,'#f2f6fc','#a4b9d3',12)+text(330,100,'Waveform viewer','atlas-chip-label','middle');
    s+=waveform(75,155,505,[[0,1,0,1,0,1,0,1,0,1],[0,0,1,1,0,0,1,1,0,0],[0,0,0,0,1,1,0,0,1,1]],['CLK','REQ','ACK'],state.phase)+chip(710,155,190,110,'RTL DUT',0)+path('M620 212H698',color(0),2.5)+text(805,333,'Testbench / assertions','atlas-small','middle');return s+bottom('Compile → elaborate → run · inspect the first failing cycle and the stimulus that led to it');
}
function packageCompare(cfg,state){
    let s='';for(let side=0;side<2;side++){
        const x=65+side*460;s+=text(x+180,50,side?'3D stacking':'2.5D integration','atlas-chip-label','middle')+rect(x,340,355,40,'#c5dfd8','#96b9b1',3);
        for(let i=0;i<9;i++)s+=circle(x+24+i*38,405,9,'#b7c5d7');
        if(side){for(let n=0;n<4;n++)s+=rect(x+50,280-n*47,255,33,`${color(n%3)}33`,color(n%3),3);for(let i=0;i<7;i++)s+=rect(x+75+i*32,110,8,230,'#d5b775','none',1);}
        else{s+=rect(x+18,300,320,23,'#bdd2eb','#8ca8cb',2)+rect(x+40,202,130,75,'#99c3ee','#6699cb',3)+rect(x+200,202,112,75,'#bba7e4','#8c74b9',3);for(let i=0;i<7;i++)s+=path(`M${x+55+i*18} 277V310H${x+215+i*12}V277`,color(i%3),1.3);}
    }return s+bottom('Side-by-side dies use an interposer; vertically stacked dies need vertical connections and thermal access');
}
function cache(cfg,state){
    const v=values(cfg,{lines:4,lineBytes:16}),d=M.cacheTrace([0,4,16,0,64,0,20,80],v),row=d.rows[Math.min(cfg.lab?.cycle??state.step,d.rows.length-1)];let s=chip(45,180,150,100,'CPU address',0)+path('M207 230H300',color(0),3);
    [['Tag',row.tag,290,180],['Index',row.index,500,150],['Offset',row.offset,680,150]].forEach(([n,val,x,w])=>s+=rect(x,70,w,65,'#f1f6ff',color(0),5)+text(x+w/2,97,n,'atlas-small','middle')+text(x+w/2,122,val,'atlas-small','middle'));
    for(let i=0;i<Math.min(8,v.lines);i++){const y=185+i*29;s+=rect(350,y,470,24,i===row.index?'#cde7dc':'#edf3fb','#bacfe6',3)+text(375,y+17,`Line ${i}`,'atlas-micro')+text(660,y+17,'Tag · valid · data','atlas-micro','middle');}
    return s+bottom(`Address ${row.address} · line size ${v.lineBytes} byte · ${row.hit?'HIT':'MISS'} · direct-mapped example`);
}
function hbm(cfg,state){
    let s='';for(let i=0;i<6;i++)s+=rect(65,310-i*38,270,26,`${color(1)}35`,color(1),2);
    for(let i=0;i<7;i++)s+=rect(90+i*34,98,7,240,'#cba962','none',1);
    s+=text(200,60,'HBM stack · TSV','atlas-chip-label','middle')+chip(675,150,230,155,'Compute die',0);
    for(let i=0;i<4;i++){const y=140+i*56;s+=path(`M335 ${y}H663`,color(i%3),4)+text(500,y-12,`Independent channel ${i}`,'atlas-small','middle');}
    s+=rect(65,385,840,35,'#b8cde7','#8ca7ca',3);return s+bottom('Wide parallel channels connect through the interposer · usable bandwidth depends on access pattern and scheduling');
}
function attention(cfg,state){
    const v=values(cfg,{q:1,scale:1});let s='';
    [['Q × Kᵀ',35,0],['Scale / mask',270,1],['Softmax',505,2],['× V',740,1]].forEach(([name,x,c],i)=>{s+=rect(x,130,185,95,'#f5f9ff',color(c),7)+text(x+92,182,name,'atlas-chip-label','middle');if(i<3)s+=path(`M${x+185} 178h50`,color(c),3)+arrow(x+230,178,c);});
    for(let i=0;i<4;i++){const x=575+i*28,h=[50,90,25,65][i];s+=rect(x,360-h,18,h,`${color(2)}88`,'none',3);}
    s+=rect(65,310,275,75,'#f1eafb',color(1),8)+text(202,355,'KV cache · K and V','atlas-small','middle')+path('M340 347H430V245H125V225M430 347H830V225',color(1),2.5)+text(665,405,'Normalized attention weights','atlas-micro','middle');
    return s+bottom('Scores are scaled and normalized before weighting V · cache stores past K and V for autoregressive decoding');
}
function formal(cfg,state){
    const fault=cfg.lab?.fault||state.step===3,nodes=[['IDLE',100,235],['REQ',330,135],['GRANT',590,135],['DONE',835,235],['ERROR',590,355]];let s='';
    for(const [a,b,label,c] of [[0,1,'req=1',0],[1,2,'grant=1',2],[2,3,'complete',2],[1,4,'deadline missed',4],[3,0,'next',0]]){
        const p=nodes[a],q=nodes[b];s+=path(`M${p[1]+45} ${p[2]}Q${(p[1]+q[1])/2} ${(p[2]+q[2])/2+(a===3?170:0)} ${q[1]-45} ${q[2]}`,color(c),2.5)+text((p[1]+q[1])/2,(p[2]+q[2])/2-16,label,'atlas-micro','middle');
    }
    nodes.forEach(([name,x,y],i)=>s+=circle(x,y,46,i===4?'#ffe6ec':i===state.step?'#dcecff':'#fff',i===4?color(4):color(0))+text(x,y+6,name,'atlas-small','middle'));
    return s+bottom('Example requirement: a request must receive grant within a bounded window · red branch is a counterexample');
}
function regulator(cfg,state){
    const v=values(cfg,{vin:5,vout:3.3,current:.5,mode:'buck'});
    if(v.mode==='ldo')return chip(300,130,320,140,'Series pass device',1)+path('M60 200H288M632 200H900',color(0),4)+text(130,175,`Vin ${v.vin} V`,'atlas-small')+text(800,175,`Vout ${v.vout} V`,'atlas-small')+path('M800 200V350H460V282',color(2),2.5)+text(480,390,'Error amplifier / reference','atlas-small','middle')+bottom('LDO dissipates roughly (Vin − Vout) × Iout in its series pass device');
    let s=text(50,142,`Vin ${v.vin} V`,'atlas-small')+path('M70 175H190l28-20m-4 20h61',color(3),3)+path('M275 175q15-35 30 0t30 0t30 0t30 0',color(0),3)+path('M395 175H850',color(0),3)+capacitor(650,175)+ground(650,223)+resistor(850,175)+ground(850,225)+text(715,150,`Vout ${v.vout} V`,'atlas-small','middle');
    s+=path('M275 175V240',color(2),2)+`<path d="M260 265l15-25 15 25Z" fill="#fff" stroke="${color(2)}" stroke-width="2"/>`+path('M260 240h30M275 265V300',color(2),2)+ground(275,300)+path('M760 175V385H540',color(1),2.5)+chip(350,345,180,75,'PWM control',1)+path('M350 380H215V200',color(1),2.5);
    return s+bottom('Buck converter example · switch node → inductor → output capacitor · feedback controls duty ratio');
}

export const advanced={
    'analog/adc':adc,analog,cmos,'matching/noise':noise,'device/special':specialDevice,'memory/reorder':reorder,'array/simd':simd,'pe/sharing':sharing,'roofline/ppa':ppa,'heatmap/pvt':pvt,'heatmap/corners':corners,'roofline/budget':budget,'dma/soc':soc,dma,channel,'network/ethernet':ethernet,'memory/banks':banks,overlap,'clocktree/gating':gatedClock,'power/rdc':rdc,'instrument/simulation':simulation,'package/stack':packageCompare,'memory/cache':cache,'memory/hbm':hbm,attention,formal,regulator,
};
