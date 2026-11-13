import {training,pcie,ethernet} from '../../curriculum/source/detail-models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,labeledBox,plot} from './figures.mjs';

export function ddrInterface() {
    let s=rect(8,22,245,268,'#f2f7ff','#88b8f1')+rect(361,22,233,268,'#f2f7ff','#88b8f1');
    s+=tx(130,47,'Memory Controller','text-anchor="middle" class="label"')+tx(478,47,'PHY · Byte lane','text-anchor="middle" class="label"');
    [['명령 스케줄러','Bank 상태 관리'],['타이밍 제약','tRCD / tRP / tRAS'],['PHY 제어','Training / Delay / Vref']].forEach(([a,b],i)=>s+=labeledBox(24,67+i*69,214,58,a,b,'#c3d5ec','#fff'));
    [['CA / CK TX',85],['DQ TX',140],['DQ RX',195],['Training / Calibration',250]].forEach(([a,y])=>s+=labeledBox(377,y-20,201,42,a,'','#b9cfea','#fff'));
    s+=arrow(253,85,377,85,C.blue)+tx(303,74,'CA/CK','text-anchor="middle" class="small blue"');
    s+=arrow(253,140,377,140,C.green)+arrow(377,195,253,195,C.green)+tx(305,169,'DQ/DQS','text-anchor="middle" class="small green"');
    s+=arrow(578,85,660,85,C.blue)+arrow(578,140,660,140,C.green)+arrow(660,195,578,195,C.green);
    s+=tx(621,72,'명령/주소','text-anchor="middle" class="small"')+tx(621,235,'DRAM 채널','text-anchor="middle" class="small"');
    return svg(680,310,'메모리 controller와 PHY의 명령 및 데이터 경로',s);
}
export function dqsTiming() {
    const x0=93,ui=79;let s=tx(4,60,'DQS','class="label blue"')+tx(4,147,'DQ','class="label green"');
    let path=`M${x0} 75`;for(let i=0;i<6;i++)path+=`H${x0+(i+.5)*ui}V${i%2?75:41}`;path+=`H${x0+6*ui}`;s+=wire(path,C.blue,2);
    for(let i=0;i<6;i++){const x=x0+i*ui;s+=wire(`M${x} 123l9 12-9 12m0-24h${ui-9}l9 12-9 12H${x}`,C.green,1.5)+tx(x+ui/2,140,`D${i}`,'text-anchor="middle" class="small"')+wire(`M${x+ui/2} 28V179`,'#8da3be',1,'stroke-dasharray="4 4"');}
    s+=arrow(x0+ui,24,x0+2*ui,24,C.ink,1.2)+tx(x0+1.5*ui,16,'1 UI','text-anchor="middle" class="small"');
    s+=rect(x0+ui*2+.13*ui,165,.74*ui,36,'#edf6ff','none')+tx(x0+ui*2.5,188,'유효 창','text-anchor="middle" class="small blue"')+tx(x0+3*ui,226,'DQS의 상승·하강 edge가 각각 하나의 data bit를 sample','text-anchor="middle" class="small"');
    return svg(610,245,'Data bit 하나가 1 UI인 center-aligned DQ DQS 개념 파형',s);
}
export function eyeFigure(jitter=.08,noise=.07,marker=.5) {
    let s='';const left=55,right=575,top=35,bottom=222;
    for(let i=0;i<5;i++)s+=wire(`M${left+i*(right-left)/4} ${top}V${bottom}M${left} ${top+i*(bottom-top)/4}H${right}`,'#dce5f1',.8);
    for(let n=0;n<18;n++){
        const offset=(n-8.5)*jitter*10,dy=Math.sin(n*1.9)*noise*45;
        s+=wire(`M${left} ${top+dy}C${150+offset} ${top+dy} ${150+offset} ${bottom-dy} ${315+offset} ${bottom-dy}S${465+offset} ${top+dy} ${right} ${top+dy}`,C.blue,1.1,'opacity=".18"');
        s+=wire(`M${left} ${bottom-dy}C${150+offset} ${bottom-dy} ${150+offset} ${top+dy} ${315+offset} ${top+dy}S${465+offset} ${bottom-dy} ${right} ${bottom-dy}`,C.blue,1.1,'opacity=".18"');
    }
    const x=left+(right-left)*marker;s+=wire(`M${x} ${top-8}V${bottom+10}`,C.ink,1.2,'stroke-dasharray="5 5"')+tx(315,280,'시간 (UI) · 여러 bit의 전압 궤적을 겹친 개념도','text-anchor="middle" class="small"');
    s+=tx(315,132,'유효 sampling 영역','text-anchor="middle" class="label blue"')+arrow(left+130,top-16,right-130,top-16,C.ink,1.2)+tx(315,12,'1 UI','text-anchor="middle" class="small"');
    return svg(620,300,'유한한 edge와 잡음으로 줄어드는 eye sampling margin의 개념도',s);
}
export function ddrCommands() {
    let s=tx(5,44,'CK','class="small"')+tx(5,105,'CMD','class="small"')+tx(5,158,'Bank','class="small"');let ck='M70 55';for(let i=0;i<20;i++)ck+=`H${70+i*27}V${i%2?55:31}`;s+=wire(ck,'#607a98',1.3);
    [[91,'ACT'],[250,'READ'],[449,'PRE'],[590,'ACT']].forEach(([x,a])=>s+=labeledBox(x-27,81,58,36,a,'',C.blue,'#eff6ff'));
    s+=labeledBox(91,139,358,35,'Bank n · Row active','',C.green,'#eefaf4');
    s+=arrow(91,195,250,195,C.red,1.2)+tx(171,215,'tRCD','text-anchor="middle" class="small"');
    s+=arrow(91,239,449,239,C.ink,1.2)+tx(270,260,'tRAS','text-anchor="middle" class="small"');
    s+=arrow(449,195,590,195,C.red,1.2)+tx(519,215,'tRP','text-anchor="middle" class="small"');
    return svg(650,280,'ACT READ PRE와 다음 ACT 사이 tRCD tRAS tRP의 개념적 간격',s);
}
export function trainingFigure(v) {
    const d=training(v),left=70,scale=23;let s='';
    d.windows.forEach((w,i)=>{const y=30+i*28;s+=tx(4,y+5,`DQ${w.bit}`,'class="small"')+wire(`M${left} ${y}H${left+31*scale}`,'#e3eaf3',1)+rect(left+w.start*scale,y-7,Math.max(0,w.end-w.start)*scale,14,'#d9f4e9','none',3);for(let t=0;t<32;t++)s+=node(left+t*scale,y,t>=w.start&&t<=w.end?C.green:'#ed7987',2.2);});
    s+=wire(`M${left+v.tap*scale} 8V245`,C.blue,2)+tx(left+v.tap*scale,266,`tap ${v.tap}`,'text-anchor="middle" class="label blue"');
    for(let t=0;t<32;t+=4)s+=tx(left+t*scale,291,String(t),'text-anchor="middle" class="small"');
    s+=tx(415,317,`공통 pass 구간: ${d.start<=d.end?`${d.start}–${d.end} · 중앙 ${fmt(d.center)}`:'없음'} · 현재 ${d.pass?'PASS':'FAIL'}`,'text-anchor="middle" class="label"');
    return svg(850,335,'8개 DQ bit의 유효 tap 구간과 선택한 DQS delay 위치',s);
}
export function pcieLayers() {
    const labels=[['Transaction layer','Memory / Configuration TLP',C.blue,'#edf6ff'],['Data link layer','Sequence / LCRC / Replay',C.green,'#edf9f4'],['Physical layer','Lane / Symbol / Encoding',C.purple,'#f5efff']];let s='';
    for(const x of [10,690])labels.forEach(([a,b,c,f],i)=>s+=labeledBox(x,38+i*66,340,56,a,b,c,f));
    s+=tx(180,20,'Root Complex','text-anchor="middle" class="label"')+tx(860,20,'Endpoint','text-anchor="middle" class="label"');
    s+=arrow(370,66,670,66,C.blue,2)+tx(520,54,'TLP · Request','text-anchor="middle" class="small blue"');
    s+=arrow(670,134,370,134,C.green,2)+tx(520,121,'Completion · 요청 종류에 따라','text-anchor="middle" class="small green"');
    return svg(1040,250,'PCI Express 송수신 양쪽의 transaction data-link physical 계층',s);
}
export function tlpFigure() {
    let s=tx(18,20,'3-DW Memory Request header · 12 byte','class="label blue"');
    const rows=[[['Fmt / Type · TC · Attr · 기타 제어',22],['Length',10]],[['Requester ID',16],['Tag',8],['Last BE',4],['First BE',4]],[['Address [31:2]',30],['R',2]]];
    rows.forEach((fields,r)=>{s+=tx(8,64+r*58,`DW${r}`,'class="small"');let x=55;fields.forEach(([label,n],i)=>{const w=n/32*560;s+=rect(x,35+r*58,w,44,['#edf6ff','#eefaf5','#fff6e9','#f5efff'][i%4],'#b7cce6',0)+tx(x+w/2,62+r*58,label,'text-anchor="middle" class="small"');x+=w;});});
    s+=labeledBox(55,213,560,46,'선택적 Data payload · 요청 종류와 Length에 따라 결정','','#d1bced','#f7f2ff');
    return svg(640,280,'Legacy 3-DW memory request header의 주요 필드 구성',s);
}
export function ltssmFigure() {
    let s='';[['Detect',15],['Polling',185],['Configuration',355],['L0',525]].forEach(([a,x],i)=>s+=labeledBox(x,146,140,60,a,['연결 감지','링크 훈련','폭·속도 구성','정상 동작'][i],i===3?C.green:C.blue,i===3?'#eefaf4':'#f1f7ff'));
    for(let i=0;i<3;i++)s+=arrow(155+i*170,176,185+i*170,176,C.ink);
    s+=labeledBox(270,28,160,60,'Recovery','오류 복구 · 재훈련',C.red,'#fff1f6');
    s+=wire('M595 146V112H430V88',C.ink,1.4)+arrow(430,98,430,88,C.ink,1.4)+wire('M270 58H255V146',C.ink,1.4)+arrow(255,132,255,146,C.ink,1.4);
    s+=tx(340,244,'주요 상태의 개념적 전이 · 모든 상태와 조건을 나타내지는 않음','text-anchor="middle" class="small"');
    return svg(680,265,'PCIe Detect Polling Configuration L0와 Recovery의 연결',s);
}
export function initDdr(root) {
    root.querySelector('[data-ddr-interface]').innerHTML=ddrInterface();root.querySelector('[data-dqs-timing]').innerHTML=dqsTiming();root.querySelector('[data-ddr-eye]').innerHTML=eyeFigure();root.querySelector('[data-ddr-command]').innerHTML=ddrCommands();
    const form=root.querySelector('[data-ddr-inputs]'),update=()=>{if(!form.checkValidity())return;const v=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,Number(v)]));root.querySelector('[data-ddr-training]').innerHTML=trainingFigure(v);};form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
}
export function initPcie(root) {
    root.querySelector('[data-pcie-layers]').innerHTML=pcieLayers();root.querySelector('[data-tlp-fields]').innerHTML=tlpFigure();root.querySelector('[data-ltssm]').innerHTML=ltssmFigure();
    const form=root.querySelector('[data-pcie-inputs]'),update=()=>{if(!form.checkValidity())return;const v=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,Number(v)])),d=pcie(v);root.querySelector('[data-pcie-result]').innerHTML=`<small>예제 payload 처리율 · 한 방향</small>${fmt(d.gbps)} GB/s<small>${d.rate} GT/s × ${v.lanes} lane × ${fmt(d.encoding*100)}% encoding × ${fmt(d.packetRatio*100)}% packet ÷ 8</small>`;};form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
}

export function usbPinMap(cc='CC1') {
    const a=['GND','TX1+','TX1−','VBUS','CC1','D+','D−','SBU1','VBUS','RX2−','RX2+','GND'],b=['GND','RX1+','RX1−','VBUS','SBU2','D−','D+','CC2','VBUS','TX2−','TX2+','GND'];let s=tx(460,18,'Receptacle · Front view','text-anchor="middle" class="label"');
    for(const [r,row]of [[0,a],[1,b]])row.forEach((name,i)=>{const x=30+i*72,y=50+r*80,c=name===cc?C.green:name==='VBUS'?C.red:name.startsWith('TX')||name.startsWith('RX')?C.blue:C.ink;s+=rect(x,y,68,54,name===cc?'#def8ec':'#f7faff',c,4)+tx(x+34,y+20,`${r?'B'+(12-i):'A'+(i+1)}`,'text-anchor="middle" class="small"')+tx(x+34,y+42,name,`text-anchor="middle" class="small" style="fill:${c}"`);});
    return svg(930,205,'Type-C receptacle 앞면 기준 A와 B 행의 24개 pin 기능',s);
}
export function pdSequence() {
    let s=labeledBox(24,8,190,47,'Source','전원 공급',C.blue,'#f0f7ff')+labeledBox(436,8,190,47,'Sink','전원 수신',C.green,'#effaf4');
    s+=wire('M119 55V315M531 55V315','#8ca1ba',1,'stroke-dasharray="5 5"');
    [['Attach · CC 감지',85,0],['Source_Capabilities',143,1],['Request',197,-1],['Accept',251,1],['PS_RDY',305,1]].forEach(([a,y,dir])=>{s+=tx(325,y-13,a,'text-anchor="middle" class="small"');s+=dir===-1?arrow(531,y,119,y,C.green):dir===0?wire(`M119 ${y}H531`,'#7c91ac',1.5,'stroke-dasharray="4 4"'):arrow(119,y,531,y,C.blue);});
    s+=rect(24,337,602,61,'#fff5f7','#edb6c5',5)+tx(325,363,'전원 계약과 USB 데이터 enumeration은 별도 성공 조건','text-anchor="middle" class="label"')+tx(325,384,'충전 성공만으로 data lane이나 장치 인식이 정상임을 알 수 없음','text-anchor="middle" class="small"');
    return svg(650,415,'Type-C 연결과 USB Power Delivery 전원 계약 메시지의 예',s);
}
export function usbPaths({direction='CC1',capability='usb3'}={}) {
    let s=labeledBox(12,55,135,200,'Host','data role',C.blue,'#f1f7ff')+labeledBox(463,55,135,200,'Device','data role',C.green,'#effaf4')+labeledBox(236,40,130,230,'Type-C Mux',direction,C.ink,'#f5f7fb');
    for(const [name,y,c,enabled]of [['TX / RX',90,C.blue,capability!=='usb2'],['D+ / D−',155,C.orange,true],['VBUS',220,C.red,true]]){s+=arrow(147,y,236,y,enabled?c:'#bbc6d4')+arrow(366,y,463,y,enabled?c:'#bbc6d4')+(name==='VBUS'?'':arrow(236,y,147,y,enabled?c:'#bbc6d4')+arrow(463,y,366,y,enabled?c:'#bbc6d4'))+tx(190,y-12,name,'text-anchor="middle" class="small"')+tx(414,y-12,name,'text-anchor="middle" class="small"');}
    s+=tx(305,301,capability==='usb2'?'이 구성은 D+ / D−만 사용 · SuperSpeed pair 없음':'고속 data pair 지원 예 · 실제 protocol과 cable 지원 별도 확인','text-anchor="middle" class="small"');
    return svg(610,320,'Type-C 데이터 경로와 VBUS가 분리되어 있는 mux 연결 개념도',s);
}
export function initUsb(root) {
    root.querySelector('[data-pd-sequence]').innerHTML=pdSequence();const form=root.querySelector('[data-usb-inputs]'),update=()=>{const v=Object.fromEntries(new FormData(form));root.querySelector('[data-usb-pinmap]').innerHTML=usbPinMap(v.direction);root.querySelector('[data-usb-path]').innerHTML=usbPaths(v);};form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
}

export function ethernetPath() {
    let s=labeledBox(5,55,125,180,'MAC','Frame 처리',C.ink,'#f4f7fb')+labeledBox(220,55,147,180,'MAC–PHY','GMII 등',C.blue,'#edf6ff')+labeledBox(450,55,180,180,'PHY','PCS / PMA',C.purple,'#f5f0ff');
    [['TXD / TX_EN',91,C.blue],['TX_CLK',130,C.blue],['RXD / RX_DV',170,C.green],['RX_CLK',210,C.green]].forEach(([a,y,c],i)=>{s+=i<2?arrow(130,y,220,y,c):arrow(220,y,130,y,c);s+=tx(174,y-9,a,'text-anchor="middle" class="small"');});
    s+=arrow(367,114,450,114,C.blue)+arrow(450,186,367,186,C.green);
    s+=tx(742,26,'Magnetics','text-anchor="middle" class="label"')+tx(742,45,'절연 · 매체에 따라','text-anchor="middle" class="small"');
    for(let row=0;row<2;row++){const y=80+row*100;s+=wire(`M630 ${y}H697v8q18 0 0 14q18 0 0 14q18 0 0 14v8H630M787 ${y}H765v8q-18 0 0 14q-18 0 0 14q-18 0 0 14v8H787`);s+=wire(`M728 ${y-3}v68M734 ${y-3}v68`,'#48617f',1.4);}
    return svg(810,270,'MAC에서 MAC–PHY 인터페이스, PHY와 magnetics까지의 Ethernet 연결',s);
}
export function ethernetFrame() {
    const fields=[['Preamble','7B + SFD 1B',112,C.blue],['Destination','6 byte',127,C.green],['Source','6 byte',120,C.green],['Type / Length','2 byte',118,C.orange],['Payload + pad','46–1500 byte',280,C.purple],['FCS','4 byte',90,C.red],['IFG','12 byte-time',133,'#6a809e']];let s='',x=10;
    fields.forEach(([a,b,w,c])=>{s+=labeledBox(x,55,w-2,65,a,b,c,'#f8fbff');x+=w;});
    s+=arrow(122,151,857,151,C.blue,1.5)+tx(489,175,'MAC frame: DA부터 FCS까지 · 64–1518 byte (VLAN 없는 예)','text-anchor="middle" class="small blue"');
    s+=tx(520,207,'Preamble / SFD와 IFG는 선로 시간을 차지하지만 MAC frame 길이에는 포함하지 않음','text-anchor="middle" class="small"');
    return svg(1010,230,'Preamble SFD, MAC header payload FCS 및 frame 밖의 IFG 구성',s);
}
export function ethernetEfficiency() {
    const left=60,right=540,top=32,bottom=250,sx=x=>left+x/1500*(right-left),yb=y=>bottom-y/1600*(bottom-top),yp=y=>bottom-y*(bottom-top);let s='';
    for(let i=0;i<=4;i++)s+=wire(`M${left} ${top+i*(bottom-top)/4}H${right}`,'#dce5ef',.8)+tx(left-9,yb(i*400)+4,String(i*400),'text-anchor="end" class="small"')+tx(right+10,yp(i*.25)+4,`${i*25}%`,'class="small green"');
    const values=[0,64,128,256,512,768,1024,1280,1500];
    s+=wire(values.map((p,i)=>`${i?'L':'M'}${sx(p)} ${yb(Math.max(46,p)+38)}`).join(''),C.blue,2)+wire(values.map((p,i)=>`${i?'L':'M'}${sx(p)} ${yp(p/(Math.max(46,p)+38))}`).join(''),C.green,2);
    values.forEach(p=>{s+=node(sx(p),yb(Math.max(46,p)+38),C.blue)+node(sx(p),yp(p/(Math.max(46,p)+38)),C.green);});
    [0,500,1000,1500].forEach(p=>s+=tx(sx(p),273,String(p),'text-anchor="middle" class="small"'));
    s+=tx(62,17,'Wire byte-time','class="small blue"')+tx(460,17,'Payload 비율','class="small green"')+tx(305,302,'Payload (byte)','text-anchor="middle" class="small"');return svg(610,320,'Payload에 따른 Ethernet wire byte-time와 유효 payload 비율',s);
}
export function ethernetQueue(d,depth) {
    let s=labeledBox(4,60,110,72,'Frame 도착','고정 interval',C.blue,'#f1f7ff')+labeledBox(181,42,205,108,'RX FIFO',`Depth ${depth}`,C.blue,'#f3f8ff')+labeledBox(454,60,138,72,'수신 처리기','Service rate',C.ink,'#f2f6fb');s+=arrow(114,95,181,95,C.blue)+arrow(386,95,454,95,C.blue);
    const last=d.rows.at(-1)[3];for(let i=0;i<8;i++)s+=rect(196+i*22,110,18,24,i<Math.ceil(last/depth*8)?'#65aaff':'#fff','#9ebfec',1);
    s+=tx(310,180,`10구간 뒤 점유 ${last}/${depth} · 누적 drop ${d.drops}`,'text-anchor="middle" class="label"');return svg(610,205,'RX FIFO의 점유량과 수신 처리율 부족으로 발생한 drop',s);
}
export function initEthernet(root) {
    root.querySelector('[data-ethernet-path]').innerHTML=ethernetPath();root.querySelector('[data-ethernet-frame]').innerHTML=ethernetFrame();root.querySelector('[data-ethernet-efficiency]').innerHTML=ethernetEfficiency();
    const form=root.querySelector('[data-ethernet-inputs]'),update=()=>{if(!form.checkValidity())return;const v=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,Number(v)])),d=ethernet(v);
        root.querySelector('[data-ethernet-result]').innerHTML=table(['구성','길이 / 결과'],[['MAC header','14 byte'],['Payload + padding',`${Math.max(46,v.payload)} byte`],['FCS','4 byte'],['MAC frame',`${Math.max(46,v.payload)+18} byte`],['Preamble + SFD','8 byte'],['IFG','12 byte-time'],['Wire 소요 시간',`${fmt(d.frameNS)} ns`],['유효 payload 비율',`${fmt(d.efficiency*100)}%`],['Payload 처리율',`${fmt(d.payloadGbps)} Gb/s`]]);
        root.querySelector('[data-ethernet-queue]').innerHTML=ethernetQueue(d,v.depth)+table(['구간','점유량','Drop'],d.rows.map(r=>[r[0],r[3],r[4]]));
    };form.addEventListener('input',update);form.addEventListener('submit',e=>e.preventDefault());update();
}
