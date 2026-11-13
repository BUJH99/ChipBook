import {bits,rc} from '../../curriculum/source/models.mjs';
import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,ground,resistor,capacitor,arrow,svg,labeledBox,plot} from './figures.mjs';

export function boundarySignalFigure(value=0xB3) {
    const data=bits(value),start=204,step=100;
    let s='';
    const labels=[['전송 비트','Controller → PHY'],['채널을 지난 파형','Pad → Package → PCB'],['수신 샘플','PHY / Endpoint']];
    labels.forEach(([a,b],i)=>s+=labeledBox(8,15+i*98,175,80,a,b,C.line,'#f1f6ff'));
    for(let i=0;i<=8;i++)s+=wire(`M${start+i*step} 22V284`,'#cedbed',1,'stroke-dasharray="5 5"');
    s+=wire(data.map((b,i)=>i?`H${start+i*step}V${b?40:72}`:`M${start} ${b?40:72}`).join('')+`H${start+8*step}`,C.blue,2);
    let valueAnalog=0,points=[];for(let i=0;i<8*40;i++){const target=data[Math.floor(i/40)];valueAnalog+=(target-valueAnalog)*.2;points.push([start+i*step/40,180-valueAnalog*38]);}
    s+=wire(points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(''),C.green,2);
    s+=wire(`M${start} 238H${start+800}M${start} 266H${start+800}`,'#8cafd8',1);
    data.forEach((b,i)=>{const x=start+(i+.5)*step;s+=tx(x,30,String(b),'text-anchor="middle" class="label blue"')+node(x,b?238:266,C.red,4)+tx(x,292,String(b),'text-anchor="middle" class="label"');});
    return svg(1040,315,'전송 비트, 대역 제한 채널의 아날로그 응답, 수신 샘플의 대응',s);
}

export function boundaryRoute(mode='ddr') {
    const serial=mode==='serial',names=serial?['Controller','TX PHY','Package','PCB channel','RX PHY']:['Controller','PHY','Package','PCB channel','Memory'],sub=serial?['packet / data','serialize / driver','balls / bumps','differential pair','CDR / decode']:['읽기 요청 생성','DQ / DQS sampling','balls / bumps','전송 경로','DQ / DQS 출력'],colors=[C.blue,C.green,C.orange,C.red,C.purple];
    let s=names.map((n,i)=>labeledBox(16+i*208,32,155,82,n,sub[i],colors[i],['#edf6ff','#edf9f5','#fff8ec','#fff3f6','#f6f0ff'][i])).join('');
    for(let i=0;i<4;i++)s+=arrow(171+i*208,68,224+i*208,68,C.blue);
    if(!serial){s+=wire('M925 126V151H94V126',C.blue,1.8,'stroke-dasharray="6 5"')+arrow(102,151,94,126,C.blue)+tx(516,175,'반환: 메모리 DQ/DQS → 보드 채널 → PHY sampling → Controller data','text-anchor="middle" class="small blue"');}
    else s+=tx(516,155,'수신 PHY는 이 예제에서 데이터에 포함된 타이밍을 복원합니다. DDR의 DQS와 구분합니다.','text-anchor="middle" class="small blue"');
    return svg(1040,195,serial?'Embedded-clock 직렬 링크의 송수신 경로':'DDR 읽기 요청과 데이터 반환 경로',s);
}

export function outputCircuit(mode='push-pull',{voltage=3.3,load=true,small=false}={}) {
    const od=mode==='open-drain';let s='';
    if(small){
        s+=tx(140,18,`VDD ${fmt(voltage)} V`,'text-anchor="middle" class="small label"');
        if(od)s+=resistor(140,29,48)+wire('M140 77V113',C.blue)+tx(157,55,'Rpu','class="small"');
        else s+=wire('M140 29V49H126V79H140V113M120 52V77M92 64H111')+`<circle cx="115" cy="64" r="4" fill="#fff" stroke="${C.ink}"/>`;
        s+=wire('M140 113V135H126V165H140V178M120 138V162M92 150H120')+ground(140,178);
        s+=wire(od?'M20 150H92':'M20 108H92V64M92 108V150')+tx(22,od?139:97,'IN','class="small"');
        s+=wire('M140 113H277',C.blue)+node(140,113,C.blue)+tx(266,103,'OUT','text-anchor="end" class="small blue"');
        s+=wire('M230 113V135',C.blue)+capacitor(230,135,31)+ground(230,166)+node(230,113,C.blue)+tx(249,152,'Cₗ','class="small"');
        return svg(300,220,od?'Open-drain 저항과 부하의 축약 회로':'Push-pull PMOS NMOS 출력의 축약 회로',s);
    }
    s+=`<rect x="76" y="48" width="157" height="209" fill="#f6f9fd" stroke="#91a2ba" stroke-dasharray="6 4"/>`+tx(88,71,'IO Driver','class="label"')+tx(88,88,od?'(open-drain)':'(push-pull)','class="small"');
    s+=tx(od?282:196,26,`VDD (${fmt(voltage)} V)`,'text-anchor="middle" class="label"');
    if(od){s+=resistor(282,42,46)+wire('M282 30V42M282 88V145',C.blue)+node(282,30,C.ink);}
    else{s+=wire('M196 32V73H181V111H196V145')+node(196,32,C.ink)+wire('M175 77V107M147 92H166')+`<circle cx="170" cy="92" r="4" fill="#fff" stroke="${C.ink}" stroke-width="1.5"/>`+tx(204,99,'P-MOS','class="small"');}
    s+=wire('M196 145V177H181V215H196V244M175 181V211M147 196H175')+ground(196,244)+tx(204,209,'N-MOS','class="small"');
    s+=wire(od?'M28 196H147':'M28 145H147V92M147 145V196')+tx(24,od?185:134,'IN','class="label"');
    s+=wire('M196 145H422',C.blue,2)+node(196,145,C.blue)+node(282,145,C.blue)+tx(295,133,'VOUT','class="label blue"');
    s+=wire('M354 145V178',C.blue)+capacitor(354,178,38)+ground(354,216)+node(354,145,C.blue)+tx(373,202,'Cₗ','class="label"');
    if(load)s+=labeledBox(420,119,113,60,'부하','입력 또는 배선',C.blue,'#eff6ff');
    if(od)s+=tx(299,66,'Rpu','class="small"');
    return svg(550,280,od?'외부 pull-up과 NMOS로 구성한 open-drain 회로':'PMOS pull-up과 NMOS pull-down으로 구성한 push-pull 회로',s,small?'':'tech-circuit');
}

export function initBoundary(root) {
    root.querySelector('[data-boundary-signals]').innerHTML=boundarySignalFigure();
    const selector=root.querySelector('[name="boundaryMode"]');
    const update=()=>root.querySelector('[data-boundary-route]').innerHTML=boundaryRoute(selector.value);
    selector.addEventListener('input',update);update();
}

export function initIo(root) {
    root.querySelector('[data-push-pull]').innerHTML=outputCircuit('push-pull');
    root.querySelector('[data-open-drain]').innerHTML=outputCircuit('open-drain');
    const form=root.querySelector('[data-io-inputs]');
    const update=()=>{
        if(!form.checkValidity())return;
        const v=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,Number(v)])),d=rc(v),vil=.3*v.voltage,vih=.7*v.voltage;
        root.querySelector('[data-io-results]').innerHTML=`<small>시정수 τ = R × C</small>${fmt(d.tauNS)} ns<small style="margin-top:12px">10–90% 상승시간</small>${fmt(Math.log(9)*d.tauNS)} ns`;
        root.querySelector('[data-io-plot]').innerHTML=plot([{points:d.points.map(p=>[p.x/1000,p.y])}],{width:600,height:365,xmax:5*d.tauNS/1000,ymax:v.voltage,xlabel:'시간 (µs)',ylabel:'VOUT (V)',bands:[{from:0,to:vil,color:'#fff1f4',label:'VIL(max) = 0.3 VDD'},{from:vih,to:v.voltage,color:'#eefaf5',label:'VIH(min) = 0.7 VDD'}]});
        root.querySelector('[data-io-measurement]').innerHTML=outputCircuit('open-drain',{voltage:v.voltage,small:true,load:false});
        root.querySelector('[data-io-thresholds]').innerHTML=table(['항목','예제 전압','판정'],[['VIL(max)',`${fmt(vil)} V`,'이하: LOW'],['VIH(min)',`${fmt(vih)} V`,'이상: HIGH'],['사이 영역',`${fmt(vil)}–${fmt(vih)} V`,'논리값 미보장']]);
        root.querySelector('[data-io-current]').textContent=`${fmt(v.voltage/v.resistance*1000)} mA`;
    };
    form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',update);update();
}
