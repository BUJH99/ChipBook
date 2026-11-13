import {bits,i2cWrite} from '../../curriculum/source/models.mjs';
import {i2cRead,arbitration} from '../../curriculum/source/detail-models.mjs';
import {escape,table} from '../../curriculum/source/presentation.mjs';

const hex=value=>`0x${value.toString(16).toUpperCase().padStart(2,'0')}`;
const path=(d,kind='wire')=>`<path d="${d}" class="${kind}"/>`;
const text=(x,y,s,kind='',anchor='start')=>`<text x="${x}" y="${y}" class="${kind}" text-anchor="${anchor}">${escape(s)}</text>`;
const dot=(x,y,c)=>`<circle cx="${x}" cy="${y}" r="3.3" fill="${c}"/>`;
const ground=(x,y)=>path(`M${x} ${y}v7m-9 0h18m-15 4h12m-9 4h6`);
const resistor=(x,y)=>path(`M${x} ${y}v9l-5 4 10 5-10 5 10 5-10 5 10 5-5 4v9`);
function transistor(x,y,on=false) {
    return `<g style="color:${on?'#0879ff':'#243754'}">${path(`M${x} ${y-18}v9h-10v28h10v9M${x-14} ${y-7}v24M${x-28} ${y+5}h14`)}${ground(x,y+28)}</g>`;
}

export function sharedBusCircuit() {
    const blue='#0879ff',green='#00a987';
    return `<svg class="tech-svg tech-circuit" viewBox="0 0 680 330" role="img" aria-label="Controller와 두 Target이 독립적인 SDA, SCL pull-up을 공유하는 open-drain 회로">
    <rect x="8" y="97" width="170" height="223" rx="7" fill="#f1f7ff" stroke="#6caeff"/>
    ${text(93,121,'I2C Controller','label blue','middle')}${text(93,139,'(Master)','small blue','middle')}
    ${transistor(70,176)}${transistor(70,266)}${text(92,172,'SDA_OUT','small')}${text(92,188,'open-drain','small')}${text(92,262,'SCL_OUT','small')}${text(92,278,'open-drain','small')}
    ${path('M70 158V151H185V143H665','signal')}${path('M70 248V234H191V177H665','clock')}
    ${text(207,136,'SDA','blue label')}${text(207,170,'SCL','green label')}
    ${[[302,143,blue],[479,177,green]].map(([x,y,c])=>`${text(x,24,'VDD (3.3 V)','label small','middle')}${path(`M${x} 34v11`)}${dot(x,34,'#243754')}${resistor(x,45)}${path(`M${x} 101V${y}`,c===blue?'signal':'clock')}${dot(x,y,c)}${text(x+15,77,'4.7 kΩ','small')}`).join('')}
    ${[[248,'0x50','#f1fbf8','#77cfb8'],[458,'0x68','#f8f5ff','#b9a3e4']].map(([x,address,fill,stroke])=>`<rect x="${x}" y="202" width="199" height="118" rx="7" fill="${fill}" stroke="${stroke}"/>${text(x+99,224,`I2C Target (${address})`,'label small','middle')}${path(`M${x+42} 143V240`,'signal')}${path(`M${x+140} 177V240`,'clock')}${dot(x+42,143,blue)}${dot(x+140,177,green)}${transistor(x+42,258)}${transistor(x+140,258)}${text(x+66,256,'SDA','small')}${text(x+163,256,'SCL','small')}`).join('')}
    </svg>`;
}

export function transactionWave({address=80,register=165,value=60,scenario='read',stretch=0}={}) {
    const data=scenario==='read'?i2cRead(address,register,value,stretch):i2cWrite(address,register,scenario==='nack',stretch);
    const rows=data.samples,width=1160,x0=56,step=(width-x0-12)/(rows.length-1),sx=i=>x0+i*step;
    const groups=[];
    for(let i=0;i<rows.length;i++) {
        const label=rows[i].label;
        const key=label.startsWith('ADDR+W')?'addressWrite':label.startsWith('ADDR+R')?'addressRead':label.startsWith('READ DATA')?'readData':label.startsWith('DATA')?'register':label==='REPEATED START'?'Sr':label==='START'?'S':label==='STOP'?'P':null;
        if(!key)continue;
        let group=groups.at(-1);if(!group||group.key!==key){group={key,start:i,end:i};groups.push(group);}group.end=i;
    }
    const titles={'addressWrite':`주소 write (${hex(address<<1)})`,'addressRead':`주소 read (${hex((address<<1)|1)})`,'register':`Register (${hex(register)})`,'readData':`Data read (${hex(value)})`,Sr:'Repeated START',S:'START',P:'STOP'};
    let svg=`<svg class="tech-svg" viewBox="0 0 ${width} 215" role="img" aria-label="${scenario==='read'?'반복 START 읽기':'쓰기'} transaction의 실제 SDA SCL 파형과 byte">`;
    svg+=groups.map(g=>{
        const isByte=g.end>g.start,w=isByte?sx(g.end)-sx(g.start)+step:Math.max(step,18),x=sx(g.start)-step/2;
        if(!isByte)return `<rect x="${x}" y="67" width="${w}" height="59" rx="3" fill="#fff1f7"/>${text(x+w/2,101,g.key,'small purple','middle')}`;
        return `<rect x="${x}" y="8" width="${w}" height="38" rx="5" fill="${g.key==='readData'?'#eff9f6':'#eef5ff'}"/>${text(x+w/2,31,titles[g.key],'label small blue','middle')}<rect x="${x}" y="67" width="${w}" height="59" rx="4" fill="#fbfdff" stroke="#cbd9e8"/>`;
    }).join('');
    svg+=rows.map((s,i)=>{
        if(s.scl===1&&/ b\d$/.test(s.label))return text(sx(i)-step/2,60,String(s.sda),'small','middle');
        if((s.label==='ACK'||s.label==='NACK'||s.label==='MASTER NACK')&&s.scl===1)return `<rect x="${sx(i)-step*1.4}" y="67" width="${step*2.1}" height="59" rx="3" fill="${s.sda?'#edf4ff':'#e9faf4'}"/>${text(sx(i)-step*.35,60,s.sda?'N':'A','small green','middle')}`;
        return '';
    }).join('');
    for(const [key,y,kind,label] of [['sda',80,'signal','SDA'],['scl',157,'clock','SCL']]) {
        svg+=text(0,y+18,label,kind==='signal'?'label blue':'label green');
        svg+=path(rows.map((r,i)=>i?`H${sx(i).toFixed(2)}V${y+(r[key]?0:28)}`:`M${sx(0)} ${y+(r[key]?0:28)}`).join(''),kind);
    }
    svg+=text(56,211,'A = ACK (수신기가 LOW) · N = NACK (수신기가 선을 놓음) · S = START · Sr = Repeated START · P = STOP','small');
    return svg+'</svg>';
}

function electricalCircuit(values) {
    const sda=values.controllerSda&&values.targetSda,scl=values.controllerScl&&values.targetScl;
    return `<svg class="tech-svg" viewBox="0 0 310 285" role="img" aria-label="Controller와 Target의 open-drain 출력에 따른 wired-AND 버스 전압">
    ${text(157,18,'VDD (3.3 V)','label small','middle')}${path('M98 32H207')}${resistor(98,32)}${resistor(207,32)}${text(115,65,'4.7 kΩ','small')}${text(224,65,'4.7 kΩ','small')}
    ${path('M98 88V111M13 111H284','signal')}${path('M207 88V142M13 142H284','clock')}${dot(98,111,'#0879ff')}${dot(207,142,'#00a987')}
    ${text(277,102,'SDA','label blue','end')}${text(277,133,'SCL','label green','end')}
    ${[[23,'Controller','controller'],[168,'Target','target']].map(([x,label,key])=>`<rect x="${x}" y="163" width="120" height="115" rx="5" fill="${key==='controller'?'#f1f7ff':'#f7f3ff'}" stroke="#b4cdeb"/>${text(x+60,182,label,'label small','middle')}${path(`M${x+36} 111V209`,'signal')}${path(`M${x+96} 142V209`,'clock')}${dot(x+36,111,'#0879ff')}${dot(x+96,142,'#00a987')}${transistor(x+36,227,!values[key+'Sda'])}${transistor(x+96,227,!values[key+'Scl'])}`).join('')}</svg>
    <div class="tech-output" aria-live="polite"><small>현재 버스 레벨 · wired-AND</small><span>SDA : ${sda?'High':'Low'}</span> <span style="color:#009e7e">　SCL : ${scl?'High':'Low'}</span></div>`;
}

export function initI2C(root) {
    root.querySelector('[data-i2c-topology]').innerHTML=sharedBusCircuit();
    const form=root.querySelector('[data-i2c-transaction]'),electrical=root.querySelector('[data-i2c-electrical]');
    const update=()=>{
        const custom=root.querySelector('[name="customAddress"]'),customSelected=form.elements.namedItem('address').value==='custom';
        custom.disabled=!customSelected;custom.closest('label').hidden=!customSelected;
        const values=Object.fromEntries(new FormData(form));
        const address=Number(customSelected?values.customAddress:values.address),register=Number(values.register),value=Number(values.value),stretch=Number(values.stretch);
        if(!form.checkValidity())return;
        root.querySelector('[data-i2c-wave]').innerHTML=transactionWave({address,register,value,scenario:values.scenario,stretch});
        const byte=(address<<1)|Number(values.direction);
        root.querySelector('[data-i2c-bits]').innerHTML=bits(byte).map((bit,i)=>`<span><small>${7-i}</small>${bit}</span>`).join('');
        root.querySelector('[data-i2c-byte]').textContent=hex(byte);
        root.querySelector('[data-i2c-address-note]').textContent=address<8||address>=120?'선택한 값은 일반 target 주소로 배정하지 않는 예약 범위입니다. 여기서는 주소 byte의 bit 구성을 확인합니다.':'선택한 7-bit 주소가 파형과 주소 byte에 함께 반영됩니다.';
        root.querySelector('[data-i2c-address-table]').innerHTML=table(['구분','비트 구성','전송 byte'],[['Write',`(${hex(address)} << 1) | 0`,hex(address<<1)],['Read',`(${hex(address)} << 1) | 1`,hex((address<<1)|1)]]);
        const rows=values.scenario==='read'?[['주소 write','Controller',`${hex(address<<1)} → Target ACK`],['Register 선택','Controller',`${hex(register)} → Target ACK`],['Repeated START','Controller','SCL HIGH에서 SDA HIGH→LOW'],['주소 read','Controller',`${hex((address<<1)|1)} → Target ACK`],['Data read','Target',`${hex(value)} → Controller NACK`],['STOP','Controller','SCL HIGH에서 SDA LOW→HIGH']]:[['주소 write','Controller',`${hex(address<<1)} → Target ${values.scenario==='nack'?'NACK':'ACK'}`],...(values.scenario==='nack'?[]:[['Data write','Controller',`${hex(register)} → Target ACK`]]),['STOP','Controller','SCL HIGH에서 SDA LOW→HIGH']];
        root.querySelector('[data-i2c-ownership]').innerHTML=table(['단계','송신 주체','파형 byte / 응답'],rows);
        window.GuidebookPage.notifyHeight?.();
    };
    form.addEventListener('submit',e=>e.preventDefault());
    root.addEventListener('input',event=>{if(event.target.form===form)update();});update();
    const electricalUpdate=()=>{const v=Object.fromEntries([...new FormData(electrical)].map(([k,v])=>[k,Number(v)]));root.querySelector('[data-i2c-electrical-view]').innerHTML=electricalCircuit(v);};
    electrical.addEventListener('submit',e=>e.preventDefault());electrical.addEventListener('input',electricalUpdate);electricalUpdate();
    const arb=root.querySelector('[data-i2c-arbitration]');
    const updateArbitration=()=>{if(!arb.checkValidity())return;const v=Object.fromEntries(new FormData(arb));const d=arbitration(Number(v.a),Number(v.b),7);root.querySelector('[data-i2c-arbitration-result]').innerHTML=table(['주소 bit','Controller A','Controller B','SDA','중재에서 물러난 장치'],d.rows.map(r=>[r.bit,r.a,r.b,r.bus,r.loser||'—']))+`<p>버스를 유지한 controller: <strong>${escape(d.winner)}</strong>. LOW가 우선하므로 먼저 다른 bit에서 1을 내보내고 0을 읽은 controller는 이후 선을 놓습니다.</p>`;};
    arb.addEventListener('input',updateArbitration);arb.addEventListener('submit',e=>e.preventDefault());updateArbitration();
}
