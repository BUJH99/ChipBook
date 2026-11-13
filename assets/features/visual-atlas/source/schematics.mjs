import {line,curveBasis,curveStepAfter,scaleLinear,interpolateRgb,arc} from 'd3';
import {esc,color,text,path,circle,rect,trace,rail,pulse,dot,ground,resistor,capacitor,arrow,chip,dff,mos,labelCallout,waveform} from './drawing.mjs';
import {specialized} from './specialized.mjs';
import {advanced} from './advanced.mjs';
export {esc} from './drawing.mjs';

function serial(cfg,state){
    const mode=cfg.variant;const i2c=mode==='i2c',uart=mode==='uart';
    if(i2c){
        let s='';const units=[[40,120,230,205,'Controller',0],[465,200,195,145,'Target 0x50',2],[720,200,195,145,'Target 0x51',1]];
        units.forEach(([x,y,w,h,name,c])=>{s+=rect(x,y,w,h,'#f8fbff',color(c),10)+text(x+w/2,y+27,name,'atlas-chip-label','middle');for(let pin=0;pin<2;pin++){const xx=x+42+pin*(w-85),yy=y+49;s+=mos(xx,yy,false,c)+ground(xx+52,yy+69)+text(xx+22,yy+102,pin?'SCL OD':'SDA OD','atlas-micro','middle');}});
        s+=path('M270 155H940',color(0),3)+path('M270 180H940',color(2),3)+text(320,143,'SDA','atlas-wire-label')+text(320,209,'SCL','atlas-wire-label');
        for(const [x,y,c] of [[395,155,0],[575,180,2]])s+=text(x,37,'VDD','atlas-small','middle')+path(`M${x} 47V61`,color(c),2)+resistor(x,61)+path(`M${x} 111V${y}`,color(c),2)+dot(x,y,c)+text(x+17,90,'Rp','atlas-small');
        for(const x of [505,760])s+=path(`M${x} 155V247M${x+95} 180V247`,color(0),2)+dot(x,155,0)+dot(x+95,180,2);
        s+=pulse('M275 155H935',0)+pulse('M275 180H935',2);
        const data=[1,1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1];
        s+=waveform(65,385,825,[data.map((_,i)=>i<2||i===20?1:i%2),data],['SCL','SDA'],state.phase);return s;
    }
    const names=i2c?['SDA','SCL']:uart?['TX → RX','RX ← TX']:['SCLK','MOSI','MISO','CS_n'];
    let s=chip(55,115,170,180,i2c?'Controller':uart?'UART TX':'Controller',0)+chip(735,115,170,180,i2c?'Target':uart?'UART RX':'Peripheral',1);
    names.forEach((n,i)=>{const yy=145+i*37;s+=rail(237,yy,723,yy,i%3)+text(480,yy-11,n,'atlas-wire-label','middle')+pulse(`M250 ${yy}H710`,i%3);});
    if(i2c){[365,595].forEach((x,i)=>{s+=text(x,30,'VDD','atlas-small','middle')+path(`M${x} 38v20`,color(i),2)+resistor(x,58)+path(`M${x} 108V${145+i*37}`,color(i),2)+dot(x,145+i*37,i)+text(x+16,86,'Rp','atlas-small');});s+=ground(160,315)+ground(800,315)+text(160,110,'Open-drain','atlas-small','middle')+text(810,110,'Open-drain','atlas-small','middle');}
    else{for(let i=0;i<8;i++)s+=rect(325+i*38,70,31,29,i===state.step%8?color(0):'#eef5fd','none',4)+text(340+i*38,90,([1,0,1,0,0,1,0,1][i]),i===state.step%8?'atlas-white':'atlas-small','middle');}
    s+=waveform(65,368,825,[[1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1],[1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1]],i2c?['SCL','SDA']:['CLK','DATA'],state.phase);
    return s;
}
function channel(cfg,state){
    let s=chip(35,120,150,155,cfg.labels?.[0]||'TX PHY',0)+chip(775,120,150,155,cfg.labels?.[2]||'RX PHY',1);
    for(let lane=0;lane<4;lane++){
        const y=147+lane*32;s+=trace([[198,y],[280,y-12],[360,y+9],[470,y-10],[585,y+13],[675,y],[760,y]],lane%3)+pulse(`M198 ${y}H760`,lane%3);
        s+=text(205,y-10,`Lane ${lane}`,'atlas-micro');
    }
    s+=path('M200 292H760','#bacbdd',2)+text(480,320,cfg.labels?.[1]||'Package · PCB channel · Connector','atlas-small','middle');
    let eyes='';for(let j=0;j<24;j++){const points=Array.from({length:49},(_,i)=>{const t=i/48;return[370+t*225,390+Math.sin(t*Math.PI*2+j%2*Math.PI)*30*(.8+j*.008)+Math.sin(i*1.9+j)*2];});eyes+=path(line().curve(curveBasis)(points),j%2?'#8b5cf660':'#3182f660',1);}
    s+=eyes+path(`M${370+225*state.phase} 340v100`,'#e5a126',2)+text(680,372,'Sampling window','atlas-small')+text(680,402,'Jitter · Noise · ISI','atlas-small');return s;
}
function network(cfg,state){
    const nodes=[[145,145],[145,350],[480,90],[480,265],[480,440],[815,145],[815,350]],labels=cfg.labels||['CPU','DMA','DDR','NoC','SRAM','GPU','IO'];
    let s='';[[0,3],[1,3],[2,3],[3,4],[3,5],[3,6],[2,5],[4,6]].forEach(([a,b],i)=>{const[x,y]=nodes[a],[xx,yy]=nodes[b];s+=trace([[x,y],[x+(xx-x)*.45,y],[xx-(xx-x)*.45,yy],[xx,yy]],i%3);});
    nodes.forEach(([x,y],i)=>{const r=i===3?65:44;s+=circle(x,y,r+8,'#eef5fd')+circle(x,y,r,'#fff',color(i%3))+text(x,y+6,labels[i]||['REQ','GRANT','DATA'][i%3],'atlas-chip-label','middle');if(i===state.step%nodes.length)s+=circle(x,y,r+14,'none',color(i%3));});return s;
}
function floorplan(cfg,state){
    const names=cfg.labels||['CPU','SRAM','DMA','Accelerator','PLL','IO'];
    let s=rect(180,36,600,398,'#e6eef8','#8faac9',20)+rect(206,62,548,346,'#fbfdff','#c9daec',7);
    for(let i=0;i<22;i++){const x=198+i*25;s+=rect(x,22,13,22,'#c5a66e','none',2)+rect(x,427,13,22,'#c5a66e','none',2);}
    const chips=[[233,88,182,110],[445,88,276,85],[233,228,145,137],[410,230,176,137],[620,230,101,58],[620,310,101,55]];
    chips.forEach(([x,y,w,h],i)=>{s+=rect(x,y,w,h,i===state.step%6?`${color(i)}28`:'#f3f7fc',color(i),7)+text(x+w/2,y+26,names[i]||`IP ${i}`,'atlas-small','middle');for(let j=0;j<Math.floor(w/18)-1;j++)for(let k=0;k<Math.floor((h-35)/14);k++)s+=rect(x+10+j*18,y+40+k*14,12,8,`${color(i)}60`,'none',1);});
    for(let i=0;i<8;i++){s+=path(`M${260+i*40} 196v19H${660-i*19}v21`,color(i%3),1.7,'atlas-signal');}
    s+=labelCallout(196,102,110,85,'IO pads',0)+labelCallout(390,215,90,325,'Interconnect',2)+labelCallout(779,385,805,420,'Die boundary',1);return s;
}
function memory(cfg,state){
    let s=chip(40,180,130,110,cfg.variant==='dma'?'DMA':'Decoder',0);
    for(let bank=0;bank<4;bank++){
        const x=280+bank*150;s+=text(x+58,55,cfg.labels?.[bank]||`Bank ${bank}`,'atlas-small','middle')+rect(x,75,115,280,'#f5f9ff','#c1d4ed',12);
        for(let row=0;row<12;row++)s+=rect(x+12,91+row*21,91,14,row===(state.step+bank)%12?color(bank):'#dce8f6','none',3);
        s+=rail(182,228,x-18,380,bank%3)+path(`M${x-18} 380H${x+58}V355`,color(bank),2.5);
    }
    s+=text(480,430,cfg.variant==='dma'?'Source → burst beats → destination · completion IRQ':'Address selects bank and row; one active row per bank','atlas-small','middle');return s;
}
function tensor(cfg,state){
    let s='';
    const matrices=[[80,120,'A / activation',0],[380,120,'B / weights',1],[680,120,'C / partial sums',2]];
    matrices.forEach(([x,y,name,c],m)=>{s+=text(x+96,y-28,cfg.labels?.[m]||name,'atlas-small','middle');for(let r=0;r<4;r++)for(let j=0;j<4;j++){const active=m===0?j===state.step%4:m===1?r===state.step%4:(r+j)%4===state.step%4;s+=rect(x+j*46,y+r*46,40,40,active?color(c):`${color(c)}16`,active?color(c):`${color(c)}40`,7)+text(x+j*46+20,y+r*46+26,m===2?(r*4+j+1)*3:(r*4+j)%7+1,active?'atlas-white':'atlas-small','middle');}s+=path(`M${x-7} ${y-6}h-8v194h8M${x+187} ${y-6}h8v194h-8`,color(c),2);});
    s+=text(319,222,'×','atlas-operator','middle')+text(619,222,'→','atlas-operator','middle');
    for(let i=0;i<4;i++)s+=trace([[100+i*46,340],[100+i*46,385],[770-i*46,385],[770-i*46,340]],i%3);
    return s+text(480,440,cfg.variant==='sparse'?'Index stream selects nonzero values before multiplication':'Tile mapping · operand reuse · output accumulation','atlas-small','middle');
}
function array(cfg,state){
    let s='';const n=4;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
        const x=270+c*122,y=70+r*94;
        if(c<n-1)s+=rail(x+72,y+36,x+122,y+36,0);
        if(r<n-1)s+=path(`M${x+36} ${y+72}v22`,color(1),3,'atlas-signal');
        const active=(r+c)%7===state.step%7;
        s+=rect(x+4,y+6,74,72,'#dce8f4','none',10)+rect(x,y,74,72,active?'#e1f4f2':'#fff',active?color(2):'#a5bbd6',10)+text(x+37,y+24,`PE ${r},${c}`,'atlas-micro','middle')+circle(x+25,y+47,10,'#e6f0fe')+text(x+25,y+52,'×','atlas-small','middle')+circle(x+53,y+47,10,'#f0eaff')+text(x+53,y+52,'+','atlas-small','middle');
    }
    for(let i=0;i<4;i++){s+=text(170,111+i*94,`A[${i}, k]`,'atlas-small','middle')+rail(215,106+i*94,270,106+i*94,0)+text(306+i*122,28,`B[k, ${i}]`,'atlas-small','middle')+path(`M${306+i*122} 37V70`,color(1),3);}
    return s+text(505,474,'C[i,j] ← C[i,j] + A[i,k] × B[k,j]','atlas-small','middle');
}
function lattice(cfg,state){
    let s='';const xs=8,ys=5;
    for(let r=0;r<ys;r++)for(let c=0;c<xs;c++){
        const x=185+c*80+(r%2?18:0),y=80+r*78;
        if(c<xs-1)s+=path(`M${x} ${y}h80`,'#c3d7ef',2);
        if(r<ys-1)s+=path(`M${x} ${y}l${r%2?-18:18} 78`,'#c3d7ef',2);
        s+=circle(x,y,18,(r===2&&c===4)?'#d6b8ff':'#daeaff',color((r===2&&c===4)?1:0));
        if((r+c)%3===0)s+=circle(x+29,y+8,5,color(0));
    }
    s+=path('M130 435H830',color(0),3)+arrow(830,435)+text(480,465,'Electric field · carrier drift','atlas-small','middle')+circle(230+state.phase*480,234,8,color(2));return s;
}
function device(cfg,state){
    if(cfg.variant==='gaa'){
        let s='';const titles=['Planar','FinFET','GAA'];for(let i=0;i<3;i++){const x=50+i*310;s+=text(x+120,65,titles[i],'atlas-chip-label','middle')+rect(x,285,240,95,'#d5e5f7','#93aecf',2);if(i===0)s+=rect(x+48,250,145,16,'#9dccf1','#74a7d0',2)+rect(x+60,162,120,88,'#f1ad64','#cd843f',4)+rect(x+48,270,145,15,'#a48bd5','none',1);else if(i===1){s+=rect(x+104,155,32,130,'#a48bd5','#8e73be',2)+`<path d="M${x+68} 285V120h104v165h-28V148h-48v137Z" fill="#f1ad64" stroke="#cd843f" stroke-width="2"/>`;}else{for(let z=0;z<3;z++){const y=147+z*51;s+=rect(x+70,y,100,34,'#f1ad64','#cd843f',6)+rect(x+78,y+10,84,14,'#a6d4f5','none',4)+rect(x+84,y+13,72,8,'#a48bd5','none',3);}}s+=text(x+120,420,['상부 Gate 제어','상부·양옆 Gate 제어','Channel 둘레 Gate 제어'][i],'atlas-small','middle');}return s;
    }
    let s=rect(165,185,630,225,'#d9e8fa','#92aed2',3)+rect(165,185,155,80,'#a7d6ee','#64a6ca',3)+rect(640,185,155,80,'#a7d6ee','#64a6ca',3)+rect(320,172,320,13,'#a6d4f5','#74a7d0',2)+rect(350,92,260,80,'#f1ad64','#cd843f',4);
    s+=text(240,228,'Source · n+','atlas-small','middle')+text(719,228,'Drain · n+','atlas-small','middle')+text(480,137,'Gate','atlas-chip-label','middle')+text(480,364,'p-type substrate','atlas-small','middle');
    s+=path('M245 185V65H120M715 185V65H850M480 92V35',color(0),3)+text(104,70,'S','atlas-small')+text(860,70,'D','atlas-small')+text(490,38,'G','atlas-small');
    const active=state.step%4>0;s+=rect(320,190,320,25,active?'#a48bd5':'#b4cce8','none',3);
    for(let i=0;i<12;i++)s+=circle(320+((i/12+state.phase)%1)*320,202,4,active?'#fff':'#8eaccd');
    s+=labelCallout(340,178,110,160,'Gate oxide',3)+labelCallout(600,202,790,300,'Channel',2);return s;
}
function process(cfg,state){
    let s='';const stages=['Photoresist','Pattern','Etch','Deposit'];
    for(let i=0;i<4;i++){
        const x=35+i*235,y=155;s+=text(x+100,95,cfg.labels?.[i]||stages[i],'atlas-small','middle')+rect(x,y+90,200,110,'#cfdef1','#89a6ca',2)+rect(x,y+68,200,22,'#e9c6a0','#c59960',2);
        if(i<2){s+=rect(x,y+40,200,28,'#b4a3e8','#8b73ca',2);if(i===1)s+=rect(x+70,y+40,60,28,'#fff','none',0);}
        else{s+=rect(x+70,y+69,60,i===2?75:20,'#fff','none',0);if(i===3)s+=rect(x+72,y+90,56,40,'#70c6bc','#36a69b',0);}
        if(i===state.step%4)s+=path(`M${x+15} 380h170`,color(0),5);
        if(i<3)s+=arrow(x+221,265,i%3);
    }
    return s+text(480,452,'Pattern transfer repeats to build devices and interconnect layers','atlas-small','middle');
}
function cmos(cfg,state){
    const high=state.step%2===1;
    let s=text(478,38,'VDD','atlas-small','middle')+path('M480 45V80',color(3),3)+mos(428,80,true,high?3:1)+mos(428,255,false,high?0:3)+path('M480 149V255M480 324V369',color(0),3)+ground(480,370)+path('M155 220H360V115H428M360 220V290H428',color(1),3)+dot(360,220,1)+path('M480 220H760',color(2),3)+dot(480,220,2);
    s+=text(140,205,`Vin = ${high?'HIGH':'LOW'}`,'atlas-chip-label')+text(770,225,`Vout = ${high?'LOW':'HIGH'}`,'atlas-chip-label')+text(560,115,'PMOS','atlas-small')+text(560,295,'NMOS','atlas-small');
    s+=path(high?'M480 220V370':'M480 45V220',color(high?0:1),7,'atlas-pulse');return s;
}
function analog(cfg,state){
    const variant=cfg.variant||'amplifier';
    let s='';
    if(['adc','dac'].includes(variant)){
        s+=circle(90,180,28,'#fff',color(0))+path('M66 180q12-24 24 0t24 0',color(0),2)+rail(118,180,235,180,0)+path('M235 180l34-18m-2 18h45',color(0),2.5)+capacitor(300,180)+ground(300,230);
        s+=`<path d="M410 95L410 270L560 182Z" fill="#f0eaff" stroke="${color(1)}" stroke-width="2"/>`+text(425,142,'+','atlas-small')+text(425,238,'−','atlas-small')+rail(312,180,380,135,0)+path('M380 135H410',color(0),2.5)+rail(560,182,640,182,1)+chip(650,130,190,105,'SAR register',1);
        s+=path('M745 247V324H375V236H410',color(2),2.5,'atlas-signal');
        for(let i=0;i<6;i++){const x=440+i*48;s+=capacitor(x,305)+ground(x,353)+text(x,400,`${2**(5-i)}C`,'atlas-micro','middle');}
        s+=text(90,235,'Vin','atlas-small','middle')+text(480,75,'Comparator','atlas-small','middle')+text(760,106,'Bit decision','atlas-small','middle');
        const bits=[1,0,1,0,1,1];s+=bits.map((b,i)=>rect(650+i*31,43,27,30,i<=state.step%6?color(1):'#e9edf4','none',4)+text(663+i*31,64,i<=state.step%6?b:'·',i<=state.step%6?'atlas-white':'atlas-small','middle')).join('');
    }else if(['pll','rf','feedback'].includes(variant)){
        const labels=variant==='pll'?['PFD / CP','Loop filter','VCO']:variant==='rf'?['LNA','Mixer','IF filter']:['Σ','Amplifier','Load'];
        s+=circle(155,160,42,'#eff5ff',color(0))+text(155,167,variant==='rf'?'×':'Σ','atlas-operator','middle')+path('M70 160H113M197 160H360',color(0),3);
        s+=`<path d="M360 90V230L500 160Z" fill="#f1ebff" stroke="${color(1)}" stroke-width="2"/>`+text(410,165,labels[1],'atlas-micro','middle')+path('M500 160H660',color(1),3)+circle(700,160,40,'#eaf8f5',color(2))+path('M676 160q12-25 24 0t24 0',color(2),2)+path('M740 160H860',color(2),3);
        s+=text(155,95,labels[0],'atlas-small','middle')+text(700,95,labels[2],'atlas-small','middle')+path('M790 160V330H155V202',color(3),2.5,'atlas-signal')+resistor(440,330,false)+text(480,380,variant==='pll'?'Feedback divider ÷N':variant==='rf'?'Local oscillator · frequency translation':'Feedback network β','atlas-small','middle');
    }else{
        s+=`<path d="M390 85V335L620 210Z" fill="#f1ebff" stroke="${color(1)}" stroke-width="2.5"/>`+text(415,160,'+','atlas-chip-label')+text(415,280,'−','atlas-chip-label')+path('M100 155H390M620 210H850',color(0),3)+path('M715 210V390H280V275H390',color(2),2.5)+resistor(480,390,false)+text(480,440,'Closed-loop feedback','atlas-small','middle')+circle(100,155,7,color(0))+text(95,115,'Vin','atlas-small')+text(830,178,'Vout','atlas-small');
        if(variant==='bias'){s=mos(310,150,false,0)+mos(590,150,false,1)+path('M362 150V85H642V150M362 219V350M642 219V350M310 185H260V120H362M260 185H590',color(0),2.5)+ground(362,350)+ground(642,350)+text(362,60,'Iref','atlas-small','middle')+text(642,60,'Iout','atlas-small','middle')+text(480,422,'Matched VGS · current mirror','atlas-small','middle');}
    }
    return s;
}
function timing(cfg,state){
    let s=dff(105,100,'Launch',0)+dff(765,100,'Capture',1)+path('M189 144H310M645 144H765',color(0),3);
    for(let i=0;i<3;i++){const x=310+i*120;s+=`<path d="M${x} 111h35a33 33 0 0 1 0 66h-35Z" fill="#eff6ff" stroke="${color(i)}" stroke-width="2"/>`+path(`M${x+68} 144h52`,color(i),3);}
    s+=path('M70 260H807V190M147 260V190',color(1),3,'atlas-signal')+dot(147,260,1)+text(480,244,'Clock distribution · capture skew','atlas-small','middle');
    s+=waveform(95,320,770,[[0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],[0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,0]],['CLK','DATA'],state.phase);
    s+=rect(495,312,36,100,'#0ea5a41a','none',0)+rect(531,312,27,100,'#e5a1261c','none',0)+text(510,447,'Setup','atlas-small','end')+text(555,447,'Hold','atlas-small');return s;
}
function pipeline(cfg,state){
    const stages=cfg.labels||['IF','ID','EX','MEM','WB'];let s='';
    stages.forEach((name,j)=>{s+=text(260+j*120,62,name,'atlas-small','middle');for(let i=0;i<5;i++){const active=(i+j)%5===state.step%5;s+=rect(212+j*120,110+i*60,96,38,active?color(i%3):`${color(i%3)}20`,'none',7)+text(260+j*120,135, '', '', 'middle');if(j>=i&&j<i+3)s+=text(260+j*120,135+i*60,`${i+1}:${j-i+1}`,active?'atlas-white':'atlas-small','middle');} });
    for(let i=0;i<5;i++)s+=text(72,134+i*60,`Instruction ${i+1}`,'atlas-small');
    s+=path('M360 255Q390 207 445 207',color(3),3)+text(370,425,'Forwarding bypass','atlas-small')+path(`M${232+state.phase*560} 82v327`,color(0),2,'atlas-time-cursor');return s;
}
function cdc(cfg,state){
    let s=rect(40,55,275,350,'#eff6ff','#b6d0f2',20)+rect(445,55,470,350,'#f6f1ff','#dac9fa',20)+text(177,91,'Clock domain A','atlas-small','middle')+text(680,91,'Clock domain B','atlas-small','middle')+dff(135,165,'Source',0)+dff(510,165,'Sync 1',1)+dff(750,165,'Sync 2',1);
    s+=path('M219 210H510',color(0),3,'atlas-signal')+path('M594 210H750',color(1),3,'atlas-signal')+path('M380 35V435','#c6b0e9',2,'atlas-dashed')+text(380,465,'Asynchronous boundary','atlas-small','middle');
    s+=waveform(65,312,210,[[0,1,1,0,0,1,1,0,0,1]],['A'],state.phase)+waveform(475,312,400,[[0,0,1,1,0,0,1,1,0,0,1,1,0,0]],['B'],state.phase);
    return s+circle(510,210,15,'#f4bd5630',color(3));
}
function power(cfg,state){
    let s=rect(45,70,275,335,'#eef8f5','#8ccec0',17)+rect(430,70,470,335,state.step%4===2?'#eef0f4':'#f1edfc','#c6b5e4',17)+text(182,107,'ALWAYS ON','atlas-small','middle')+text(670,107,'SWITCHABLE DOMAIN','atlas-small','middle');
    s+=chip(85,160,190,110,'PMU / control',2)+chip(620,165,230,140,'Logic + SRAM',1)+rect(470,200,85,70,'#fff',color(3),7)+text(512,239,'ISO','atlas-small','middle')+path('M287 225H470M555 235H608',color(0),3,'atlas-signal');
    s+=path('M180 35H745V165',color(3),5)+resistor(745,65)+text(485,28,'VDD · power switch','atlas-small','middle')+path('M275 290H510V270',color(2),2)+text(355,320,'isolate','atlas-small')+text(735,355,state.step%4===2?'OFF · outputs clamped':'ON · state retained','atlas-small','middle');
    return s;
}
function scan(cfg,state){
    let s=text(45,192,'SI','atlas-chip-label')+text(895,192,'SO','atlas-chip-label');
    for(let i=0;i<5;i++){
        const x=140+i*150;s+=dff(x,130,`FF ${i}`,i%3)+path(`M${x-65} 174H${x}`,color(0),3,'atlas-signal')+path(`M${x+84} 174h1`,color(0),3)+path(`M${x+42} 220V285`,color(1),2)+text(x+42,258,(state.step+i)%2,'atlas-chip-label','middle');
        s+=`<path d="M${x-48} 135l24 14v52l-24 14Z" fill="#eaf2ff" stroke="${color(0)}" stroke-width="1.5"/>`+path(`M${x-36} 149V85`,color(2),2);
    }
    s+=path('M75 285H825',color(1),3)+text(60,318,'CLK','atlas-small')+path('M75 85H825',color(2),3)+text(67,58,'Scan enable / functional input select','atlas-small');
    s+=waveform(95,368,770,[[1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1],[0,1,0,1,0,1,0,1,0,0,1,0,0,1,0,1]],['SE','CLK'],state.phase);return s;
}
function formal(cfg,state){
    let s='';const nodes=[{x:120,y:235},{x:330,y:110},{x:330,y:360},{x:570,y:55},{x:570,y:180},{x:570,y:300},{x:570,y:430},{x:830,y:55},{x:830,y:180},{x:830,y:300},{x:830,y:430}];
    [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,7],[4,8],[5,9],[6,10]].forEach(([a,b],i)=>{const p=nodes[a],q=nodes[b];s+=trace([[p.x,p.y],[p.x+90,p.y],[q.x-70,q.y],[q.x,q.y]],i===state.step%10?3:0);});
    nodes.forEach(({x,y},i)=>s+=circle(x,y,i?27:40,i===10?'#ffe6e9':i===state.step%11?'#dcecff':'#fff',i===10?color(4):color(0))+text(x,y+5,i===10?'FAIL':`S${i}`,'atlas-small','middle'));
    s+=text(120,300,'Initial state','atlas-small','middle')+text(570,480,cfg.variant==='equivalence'?'Miter compares reference and implementation outputs':'Reachable states under assumptions · counterexample trace','atlas-small','middle');return s;
}
function packageView(cfg,state){
    let s='';
    const layer=(x,y,w,h,d,fill)=>`<path d="M${x} ${y}l${w} 0 ${d} ${-d*.48}h-${w}Z" fill="${fill}" stroke="#8ea8c8"/><path d="M${x} ${y}h${w}v${h}H${x}Z" fill="${fill}" stroke="#8ea8c8"/><path d="M${x+w} ${y}l${d} ${-d*.48}v${h}l-${d} ${d*.48}Z" fill="#b9cbe2" stroke="#8ea8c8"/>`;
    s+=layer(160,335,570,45,90,'#c1d8e5');for(let i=0;i<14;i++)s+=circle(180+i*39,405,8,'#adbdd1');
    s+=layer(180,275,530,22,90,'#b7c6e9')+layer(390,190,210,55,70,'#9cc4f5');
    for(let side=0;side<2;side++)for(let z=0;z<5;z++)s+=layer(205+side*410,230-z*24,96,15,55,z===state.step%5?'#b9a0f2':'#d7cbf2');
    s+=labelCallout(490,190,500,45,'Compute die',0)+labelCallout(260,135,130,80,'HBM stack',1)+labelCallout(340,285,90,260,'Interposer',2)+labelCallout(720,360,795,335,'Substrate',0);return s;
}
function heatmap(cfg,state){
    let s='';const n=12,size=27,x0=130,y0=65;
    const fill=interpolateRgb('#dfefff',cfg.variant==='yield'?'#ef677b':'#f49b45');
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){
        const dist=Math.hypot(r-5,c-6),hot=Math.max(0,1-dist/8);const bad=(r*19+c*13)%23===0;
        s+=rect(x0+c*size,y0+r*size,24,24,cfg.variant==='yield'?(bad?'#ed6e80':'#77b7be'):fill(hot),'none',3);
    }
    for(let i=0;i<40;i++)s+=rect(590,80+i*7,28,7,fill(i/39),'none',0);
    const labelMap={yield:['Good / Fail die','Failure cluster','Wafer coordinates'],thermal:['Cool region','Hot spot','Die power · thermal path'],variation:['Low value','High value','Spatial process variation'],difference:['Match','Mismatch','DUT − golden output'],corners:['Positive margin','Negative margin','PVT corner comparison'],pvt:['Pass region','Failure boundary','Voltage / frequency sweep'],reliability:['Low stress','High stress','Stress condition map']};
    const labels=labelMap[cfg.variant]||labelMap.thermal;s+=text(640,95,labels[0],'atlas-small')+text(640,359,labels[1],'atlas-small')+text(290,437,labels[2],'atlas-small','middle');
    s+=path(`M${x0+(state.step%12)*size+12} 55V398`,'#254e7c',1.5);return s;
}
function security(cfg,state){
    const labels=cfg.labels||['ROM','Key / hash','Bootloader','Firmware'];let s=`<path d="M480 42L760 135V275Q735 403 480 465Q225 403 200 275V135Z" fill="#edf5ff" stroke="#9dbfe8" stroke-width="2"/>`;
    for(let i=0;i<4;i++){
        const a=-Math.PI/2+i*Math.PI/2,x=480+Math.cos(a)*145,y=250+Math.sin(a)*130;
        s+=circle(x,y,46,i===state.step%4?`${color(i)}25`:'#fff',color(i))+text(x,y+5,labels[i]||`Stage ${i}`,'atlas-small','middle');
    }
    s+=circle(480,250,38,'#fff',color(2))+`<path d="M461 251l13 13 27-32" fill="none" stroke="${color(2)}" stroke-width="5"/>`;
    for(let i=0;i<4;i++){const a=i*Math.PI/2;s+=path(arc()({innerRadius:108,outerRadius:110,startAngle:a+.25,endAngle:a+1.2}),color(i),2).replace('<path','<path transform="translate(480 250)"');}
    return s;
}
function instrument(cfg,state){
    let s=rect(55,80,345,270,'#eef3fa','#9bb4d0',15)+rect(78,103,250,170,'#172d47','#314862',5);
    for(let j=0;j<5;j++)s+=path(`M80 ${120+j*32}H325`,'#ffffff14',1);
    const points=Array.from({length:60},(_,i)=>[85+i*4,184+Math.sin(i*.24)*45]);s+=path(line().curve(curveBasis)(points),'#6ed7cb',3)+circle(360,130,13,'#9cb6d4')+circle(360,180,13,'#9cb6d4')+text(140,310,'Oscilloscope','atlas-small');
    s+=chip(630,185,195,140,cfg.labels?.[0]||'DUT',0)+trace([[330,260],[460,350],[515,140],[618,230]],0)+trace([[352,270],[460,400],[550,165],[618,260]],1)+text(710,390,'Probe · clock · reset · rail','atlas-small','middle');
    s+=circle(85+state.phase*240,184+Math.sin(state.phase*60*.24)*45,5,'#fff');return s;
}
function graph(cfg,state){
    const labels=cfg.labels||['Source','Elaborate','Map','Route','Verify'];let s='';
    const coordinates=[[125,245],[330,100],[330,365],[595,155],[595,335],[825,245]];
    [[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[3,4]].forEach(([a,b],i)=>s+=trace([coordinates[a],[(coordinates[a][0]+coordinates[b][0])/2,coordinates[a][1]],coordinates[b]],i%3));
    coordinates.forEach(([x,y],i)=>{
        s+=circle(x,y,58,i===state.step%6?'#e7f2ff':'#f6f9fd','#cedced');
        if(i===0){s+=path(`M${x-24} ${y-33}h34l14 14v50h-48Z`,'#6f92bf',2);for(let j=0;j<4;j++)s+=path(`M${x-15} ${y-12+j*11}h29`,color(0),2);}
        else if(i===5){s+=rect(x-29,y-29,58,58,'#e9f3ff',color(0),4);for(let r=0;r<3;r++)for(let c=0;c<3;c++)s+=rect(x-21+c*15,y-21+r*15,10,10,color((r+c)%3),'none',1);}
        else{s+=circle(x-19,y-12,9,'#dceaff',color(0))+circle(x+20,y-12,9,'#ece3ff',color(1))+circle(x,y+19,9,'#dbf2ee',color(2))+path(`M${x-15} ${y-4}l15 18 15-18`,'#8ca8c8',2);}
        s+=text(x,y+82,labels[i]||labels[i%labels.length],'atlas-small','middle');
    });return s;
}
function curveView(cfg,state){
    const sx=scaleLinear().domain([-3,3]).range([105,855]),sy=scaleLinear().domain([-1.2,1.2]).range([390,65]);
    const mode=cfg.variant;const fn=x=>mode==='quantize'?Math.round(x*2)/2:mode==='activation'?Math.max(0,x)/3:Math.tanh(x);
    let s='';for(let i=-3;i<=3;i++)s+=path(`M${sx(i)} 55V395`,'#e0e9f4',1)+text(sx(i),425,i,'atlas-small','middle');
    for(let i=-1;i<=1;i+=.5)s+=path(`M100 ${sy(i)}H860`,'#e0e9f4',1)+text(85,sy(i)+5,i,'atlas-small','end');
    s+=path(`M100 ${sy(0)}H865M${sx(0)} 50V398`,'#8ea6c6',1.5);
    const values=Array.from({length:121},(_,i)=>-3+i*.05);s+=path(line().x(sx).y(x=>sy(fn(x))).curve(mode==='quantize'?curveStepAfter:curveBasis)(values),color(0),3.5);
    const x=-2.8+state.phase*5.6;s+=circle(sx(x),sy(fn(x)),7,color(1))+path(`M${sx(x)} ${sy(0)}V${sy(fn(x))}`,color(1),1.5)+text(490,473,cfg.labels?.[0]||'Transfer curve · input to output','atlas-small','middle');return s;
}

function io(cfg,state){
    let s=text(180,45,'VDD','atlas-small','middle')+path('M180 55V80',color(3),2)+resistor(180,80)+path('M180 130V220H360',color(0),3)+capacitor(250,220)+ground(250,268)+dot(250,220,0)+ground(180,320);
    s+=path('M180 220v35l-14 26m14-14v53',color(0),2.5)+text(100,275,'Open drain','atlas-small')+text(204,105,'Rpull-up','atlas-small')+text(273,253,'Cbus','atlas-small');
    s+=`<path d="M360 170V270L455 220Z" fill="#eff4ff" stroke="${color(1)}" stroke-width="2"/>`+path('M455 220H510',color(1),3)+text(360,310,'Input threshold','atlas-small');
    const p=Array.from({length:80},(_,i)=>[575+i*3.8,290-180*(1-Math.exp(-i/18))]);s+=path('M565 80V315H895','#8fa7c5',1.5)+path(line().curve(curveBasis)(p),color(0),3)+path('M565 164H880',color(3),1.5,'atlas-dashed')+text(885,169,'VIH','atlas-small')+text(725,352,'RC rise time','atlas-small','middle')+circle(...p[Math.min(79,Math.floor(state.phase*79))],6,color(1));return s;
}
function register(cfg,state){
    let s=chip(45,160,160,115,'Bus write',0)+path('M217 210H300',color(0),3)+text(310,72,'32-bit register · byte write strobes','atlas-small');
    for(let b=0;b<4;b++){
        const x=300+b*145;s+=text(x+60,115,`Byte ${3-b}`,'atlas-small','middle');
        for(let bit=0;bit<8;bit++){const on=(bit+b+state.step)%3===0;s+=rect(x+bit*16,145,15,75,on?`${color(b)}38`:'#f2f6fb',color(b),2)+text(x+bit*16+7.5,192,on?'1':'0','atlas-micro','middle');}
        s+=path(`M${x+64} 220V285`,color(b),2)+circle(x+64,300,14,b===state.step%4?color(b):'#dfe7f1')+text(x+64,345,`WSTRB[${3-b}]`,'atlas-small','middle');
    }
    s+=text(480,420,cfg.variant==='w1c'?'W1C: writing 1 clears only the selected status bit':'Address decode + byte select + field access policy','atlas-small','middle');return s;
}
function irq(cfg,state){
    let s='';const names=['Timer','UART RX','DMA done'];
    names.forEach((n,i)=>{const y=80+i*118;s+=chip(50,y,150,70,n,i)+path(`M212 ${y+35}H335`,color(i),3)+rect(335,y,100,70,'#fff',color(i),5)+text(385,y+42,i===state.step%3?'1':'0','atlas-chip-label','middle')+path(`M435 ${y+35}H530L620 240`,color(i),2.5);});
    s+=text(385,35,'Pending / W1C','atlas-small','middle')+`<path d="M610 185Q670 190 710 240Q670 290 610 295Q650 240 610 185Z" fill="#ede8fa" stroke="${color(1)}" stroke-width="2"/>`+path('M710 240H785',color(1),3)+chip(795,195,125,90,'CPU IRQ',0)+text(670,335,'Mask → OR → IRQ','atlas-small','middle');return s;
}
function dma(cfg,state){
    let s=chip(50,85,150,95,'CPU',0)+chip(330,75,220,130,'DMA',1)+chip(735,65,170,120,'SRAM',2)+chip(680,330,200,90,'Peripheral',4);
    s+=rect(70,255,820,32,'#fff4dd','#e5c784',7)+text(480,277,'Interconnect · address / data / response','atlas-small','middle');
    s+=path('M125 192V255M440 217V255M820 197V255M780 287V330',color(0),3)+path('M212 130H318',color(1),2,'atlas-dashed')+text(262,114,'Configure','atlas-micro','middle');
    s+=path('M550 151H660V114H723',color(2),3,'atlas-pulse')+path('M550 165H610V375H668',color(4),3,'atlas-pulse');
    for(let i=0;i<8;i++)s+=rect(85+i*62,355,50,42,i<=state.step*2?'#d8edff':'#f3f7fc','#c7d9ed',5)+text(110+i*62,382,`B${i}`,'atlas-small','middle');
    return s+text(310,430,'Only accepted beats advance the transfer','atlas-small','middle');
}
function pe(cfg,state){
    let s=dff(135,90,'A',0)+dff(135,285,'B',1)+path('M219 135H300L360 228M219 330H300L360 258',color(0),3)+circle(395,245,45,'#eff5ff',color(0))+text(395,257,'×','atlas-operator','middle')+path('M440 245H555',color(0),3)+circle(595,245,35,'#f1ecff',color(1))+text(595,257,'+','atlas-operator','middle')+path('M630 245H735',color(1),3)+dff(735,200,'ACC',2)+path('M819 245H900M778 200V80H595V210',color(2),3,'atlas-signal');
    s+=text(275,64,'INT8 operands','atlas-small')+text(475,219,'INT16 product','atlas-small')+text(780,330,'INT32 accumulation','atlas-small','middle')+text(480,440,'acc ← acc + A × B · Valid / Stall / Reset','atlas-small','middle');return s;
}
function overlap(cfg,state){
    let s='';const rows=['Load DMA','Compute','Store DMA'];
    rows.forEach((r,i)=>{const y=105+i*100;s+=text(35,y+33,r,'atlas-small');for(let tile=0;tile<4;tile++){const x=215+(tile+i)*91;s+=rect(x,y,84,52,tile===state.step%4?color(i):`${color(i)}25`,color(i),6)+text(x+42,y+32,`T${tile} / B${tile%2}`,tile===state.step%4?'atlas-white':'atlas-micro','middle');}});
    s+=path('M205 420H900','#8aa4c6',1.5)+text(550,460,'Two buffers alternate ownership: load → compute → store','atlas-small','middle')+path(`M${215+state.phase*625} 75V395`,color(3),2);return s;
}
function attention(cfg,state){
    let s='';[['Q',85,95,0],['Kᵀ',300,95,1],['Score',515,95,2],['V',735,95,1]].forEach(([n,x,y,c])=>{s+=text(x+70,y-25,n,'atlas-chip-label','middle');for(let r=0;r<4;r++)for(let j=0;j<4;j++)s+=rect(x+j*33,y+r*33,27,27,(r+j)%4===state.step%4?color(c):`${color(c)}22`,'none',3);});
    s+=text(252,173,'×','atlas-operator','middle')+text(465,173,'→','atlas-operator','middle')+text(684,173,'×','atlas-operator','middle');
    s+=path('M580 250V315H320',color(2),3)+text(355,350,'Scale → mask → softmax','atlas-small')+rect(120,360,200,70,'#edf6ff',color(0),9)+text(220,402,'KV cache','atlas-chip-label','middle')+path('M320 397H805V260',color(1),3,'atlas-signal');return s;
}
function roofline(cfg,state){
    const xs=[.25,.5,1,2,4,8,16,32,64],sx=x=>130+Math.log2(x/.25)/8*700,sy=y=>390-y/1000*290;let s='';
    [0,250,500,750,1000].forEach(y=>s+=path(`M130 ${sy(y)}H840`,'#e2eaf4',1)+text(113,sy(y)+5,y,'atlas-small','end'));
    xs.forEach(x=>s+=text(sx(x),424,x,'atlas-small','middle'));
    s+=path('M130 65V390H850','#8ba5c7',1.5)+path(line().x(sx).y(x=>sy(Math.min(1000,100*x)))(xs),color(0),4)+text(625,80,'Compute ceiling','atlas-small')+text(235,265,'Bandwidth bound','atlas-small')+text(460,476,'Arithmetic intensity (op / byte)','atlas-small','middle')+text(135,34,'Performance (Gop/s)','atlas-small');
    const intensity=.5+state.phase*31;s+=circle(sx(intensity),sy(Math.min(1000,intensity*100)),8,color(1));return s;
}
function beol(cfg,state){
    let s='';for(let level=0;level<5;level++){
        const y=335-level*64,c=level%3;s+=rect(170,y+17,620,34,'#ebf1f8','#d1dce9',2)+text(110,y+41,level?'M'+level:'FEOL','atlas-small','middle');
        for(let j=0;j<6;j++){const x=200+j*95;s+=rect(x,y,level%2?55:80,18,color(c),'none',1);if(level<4)s+=rect(x+24,y-45,12,45,'#c4a264','none',1);}
        if(level===state.step%5)s+=path(`M170 ${y+54}H790`,color(c),3);
    }
    return s+text(480,445,'Via connects adjacent metal layers · dielectric separates wires','atlas-small','middle');
}
function layout(cfg,state){
    let s=rect(140,70,680,330,'#f6f9fd','#d0dbe9',4)+rect(165,88,630,118,'#dbeada','#a5c6a2',3)+text(790,115,'N-well','atlas-small','end');
    s+=rect(185,135,590,38,'#80c6a1','#46956a',1)+rect(185,290,590,38,'#80c6a1','#46956a',1)+rect(165,65,630,22,'#8fbae9','#5b88be',1)+rect(165,381,630,22,'#8fbae9','#5b88be',1);
    for(let i=0;i<5;i++){const x=255+i*105;s+=rect(x,110,15,250,i===state.step%5?'#f29175':'#d9807e','#af5757',1);for(const y of [151,307])s+=rect(x-38,y-8,16,16,'#eed598','#b9944f',1)+rect(x+34,y-8,16,16,'#eed598','#b9944f',1);}
    s+=text(100,80,'VDD','atlas-small','end')+text(100,401,'VSS','atlas-small','end')+text(480,465,'Active diffusion · Poly gate · Contacts · Metal rails','atlas-small','middle');return s;
}
function dac(cfg,state){
    let s=text(65,80,'Vref','atlas-small')+path('M65 100H820',color(3),3)+path('M130 255H820',color(0),3);
    for(let i=0;i<6;i++){
        const x=170+i*110;s+=capacitor(x,205)+path(`M${x} 205V170l${(state.step+i)%2?15:-15}-25`,color(i%3),2.5)+dot(x-15,145,3)+dot(x+15,145,2)+path(`M${x-15} 145V100`,color(3),1.5)+ground(x+15,147)+text(x,320,`${2**(5-i)} C`,'atlas-small','middle')+text(x,360,`b${5-i}=${(state.step+i)%2}`,'atlas-small','middle');
    }
    s+=path('M820 255H900',color(0),3)+text(827,237,'Vout','atlas-small')+text(480,435,'Capacitive DAC · weighted charge redistribution','atlas-small','middle');return s;
}
function regulator(cfg,state){
    let s=text(55,146,'Vin','atlas-small')+path('M90 175H185l30-20m-4 20h65',color(3),3)+path('M276 175q15-35 30 0t30 0t30 0t30 0',color(0),3)+path('M396 175H780',color(0),3)+capacitor(610,175)+ground(610,223)+resistor(780,175)+ground(780,225)+text(625,159,'Vout','atlas-small')+text(340,133,'L','atlas-small');
    s+=path('M276 175V310H210V210',color(2),2.5)+path('M725 175V365H410V250',color(1),2,'atlas-signal')+chip(330,360,190,70,'Feedback / PWM',1)+text(480,465,'Switching node → inductor → output capacitor','atlas-small','middle');return s;
}
function matching(cfg,state){
    let s='';for(let r=0;r<4;r++)for(let c=0;c<8;c++){
        const x=160+c*80,y=80+r*80,match=(r+c)%4<2;s+=rect(x,y,64,64,match?'#e4f1ff':'#eee5fc',match?color(0):color(1),6)+path(`M${x+13} ${y+15}v34M${x+27} ${y+15}v34M${x+41} ${y+15}v34`,match?color(0):color(1),3)+text(x+32,y+80,match?'A':'B','atlas-micro','middle');
    }
    s+=path('M115 405H850',color(3),2)+arrow(850,405,3)+text(480,445,'Common-centroid placement reduces a linear gradient mismatch','atlas-small','middle');return s;
}
function clocktree(cfg,state){
    let s=chip(45,205,110,80,'PLL',1)+path('M167 245H340',color(1),4);
    for(const y of [100,390]){s+=path(`M340 245V${y}H560`,color(1),3);for(const yy of [y-45,y+45]){s+=path(`M560 ${y}V${yy}H740`,color(0),2.5);for(const off of [-22,22])s+=path(`M740 ${yy}V${yy+off}H850`,color(2),2)+circle(865,yy+off,10,color(2));}}
    s+=circle(340,245,9,color(1))+text(480,253,'Balanced branch depths','atlas-small')+text(480,485,'Clock source → buffers → branches → sequential sinks','atlas-small','middle');return s;
}
function mbist(cfg,state){
    let s=chip(45,170,150,120,'MBIST',0)+path('M207 230H300',color(0),3);
    for(let r=0;r<8;r++)for(let c=0;c<10;c++){
        const x=330+c*42,y=70+r*42,fail=r===3&&c===6;s+=rect(x,y,34,34,fail?'#ef9da7':r===state.step%8?'#90c4fa':'#dceafa','none',3);if(fail)s+=path(`M${x+8} ${y+8}l18 18m0-18-18 18`,'#a4314a',2);
    }
    s+=rect(800,70,34,328,'#a9ddcc','#47a88c',4)+text(818,435,'Spare','atlas-small','middle')+path('M600 218H815',color(4),2.5,'atlas-dashed')+text(480,470,'Address march · write/read compare · redundancy repair','atlas-small','middle');return s;
}
function jtag(cfg,state){
    let s=rect(235,65,490,350,'#f2f7fd','#abc3de',16)+chip(365,165,230,145,'Core logic',0);
    const positions=[];for(let i=0;i<7;i++){positions.push([265+i*67,92]);positions.push([265+i*67,368]);}for(let i=0;i<3;i++){positions.push([258,160+i*65]);positions.push([702,160+i*65]);}
    positions.forEach(([x,y],i)=>s+=rect(x-15,y-15,30,30,i===state.step%positions.length?color(1):'#dce9f8',color(0),3));
    s+=path('M100 92H265H702V368H258V160',color(1),3,'atlas-signal')+text(75,78,'TDI','atlas-small')+text(110,180,'TDO','atlas-small')+path('M258 160H155',color(1),3)+text(480,460,'Boundary-scan cells wrap the functional core','atlas-small','middle');return s;
}
function coverage(cfg,state){
    const columns=['Property','Simulation','Formal','Silicon'];let s='';columns.forEach((c,i)=>s+=text(350+i*135,70,c,'atlas-small','middle'));
    ['Reset','Transfer','Overflow','Timeout','Recovery','Access'].forEach((r,j)=>{s+=text(100,130+j*52,r,'atlas-small');for(let i=0;i<4;i++){const covered=(i+j)%5!==0;s+=rect(300+i*135,98+j*52,102,37,covered?'#e2f4ee':'#fff0d7','none',6)+text(350+i*135,123+j*52,covered?'✓':'—','atlas-small','middle');}});
    s+=path(`M290 ${116+(state.step%6)*52}H840`,color(0),1.5)+text(480,470,'Requirements mapped to evidence · gaps remain visible','atlas-small','middle');return s;
}
const drawings={serial,channel,network,floorplan,memory,tensor,array,lattice,device,process,cmos,analog,timing,pipeline,cdc,power,scan,formal,package:packageView,heatmap,security,instrument,graph,curve:curveView,io,register,irq,dma,pe,overlap,attention,roofline,beol,layout,dac,regulator,matching,clocktree,mbist,jtag,coverage};
export const sceneKinds=Object.keys(drawings);
export function drawScene(config,state={step:0,phase:0}) {
    const render=advanced[config.kind+'/'+config.variant]||specialized[config.kind+'/'+config.variant]||advanced[config.kind]||specialized[config.kind]||drawings[config.kind];
    if(!render)throw new Error(`Unknown visual scene ${config.kind}`);
    const prefix=`atlas-${String(config.id||config.kind).replace(/[^\w-]/g,'-')}`;
    const defs=`<defs>${['#d7e9ff','#eadfff','#d4f0eb'].map((c,i)=>`<linearGradient id="atlas-chip-${i}" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="${c}"/></linearGradient>`).join('')}<pattern id="atlas-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".75" fill="#bcd0e444"/></pattern></defs>`;
    const output=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 500" role="img" aria-label="${esc(config.title)}">${defs}<rect width="960" height="500" fill="url(#atlas-grid)"/>${render(config,state)}</svg>`;
    // Each lesson owns independent SVG resources, including when hidden panels coexist.
    return output.replace(/atlas-chip-(\d)/g,`${prefix}-chip-$1`).replace(/atlas-grid/g,`${prefix}-grid`);
}
