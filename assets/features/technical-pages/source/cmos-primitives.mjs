import {palette as C,tx,wire,node,rect,arrow,svg,capacitor,ground} from './figures.mjs';

// Three-terminal digital MOS symbols; bodies are tied to their respective rails.
// Terminal locations: source/drain (x,y±38), gate (x−52,y).
export function digitalMos(x,y,{type='n',label='',on=null}={}) {
    const color=on===false?'#aebdce':type==='p'?C.red:C.blue;
    let s=wire(`M${x} ${y-38}V${y-24}H${x-16}M${x} ${y+38}V${y+24}H${x-16}`,color,2)+wire(`M${x-16} ${y-24}v13m0 5v12m0 5v13`,color,on===true?3:2)+wire(`M${x-28} ${y-23}v46`,color,1.8);
    s+=wire(`M${x-52} ${y}H${x-(type==='p'?42:28)}`,C.ink,1.5);
    if(type==='p')s+=`<circle cx="${x-36}" cy="${y}" r="6" fill="#fff" stroke="${color}" stroke-width="1.5"/>`;
    if(label)s+=tx(x+15,y+5,label,'class="small label"');
    return s;
}
export function inverterSymbol(x,y,{scale=1,color=C.ink}={}) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">${wire('M0 0H18M18-27V27L65 0Z',color,1.7)}<circle cx="71" cy="0" r="6" fill="#fff" stroke="${color}" stroke-width="1.7"/>${wire('M77 0H96',color,1.7)}</g>`;
}
export function inverterCircuit({state='transition',vdd=1,load=true,sizing=false}={}) {
    const p=state==='low'||state==='charge'?true:state==='high'||state==='discharge'?false:null,n=p===null?null:!p;
    let s=wire('M222 35V67M222 143V207M222 283V322M170 105H97V245H170M97 175H35M222 175H369',C.ink,1.7)+digitalMos(222,105,{type:'p',label:'PMOS',on:p})+digitalMos(222,245,{type:'n',label:'NMOS',on:n})+ground(222,322)+node(97,175,C.ink)+node(222,175,C.ink);
    s+=tx(222,21,`VDD · ${vdd} V`,'text-anchor="middle" class="label"')+tx(31,159,'Vin','class="label blue"')+tx(369,159,'Vout','text-anchor="end" class="label blue"')+tx(222,366,'GND','text-anchor="middle" class="small"');
    if(load)s+=wire('M343 175V221',C.ink)+capacitor(343,221,48)+ground(343,269)+tx(367,250,'CL','class="small"');
    if(p===true)s+=arrow(238,49,238,151,C.red,2.2)+arrow(241,165,315,165,C.red,2.2);
    if(n===true)s+=arrow(208,190,208,303,C.blue,2.2);
    if(state==='short')s+=arrow(238,49,238,306,C.red,2.1);
    if(state==='leak')s+=wire('M240 48V307',C.purple,1.7,'stroke-dasharray="4 5"')+tx(284,118,'Ileak','class="small purple"');
    if(sizing)s+=tx(238,132,'Wp / L','class="small"')+tx(238,275,'Wn / L','class="small"');
    return svg(415,387,'PMOS source는 VDD NMOS source는 GND에 연결하고 gate를 Vin drain을 Vout으로 공유한 CMOS inverter',s,'tech-circuit');
}

const layer={poly:'#ff6c89',metal:'#318dff',well:'#bfe9cc',pdiff:'#ffc35c',ndiff:'#73dbec',contact:'#234b80',substrate:'#e8f3ff'};
const contact=(x,y)=>rect(x-6,y-6,12,12,layer.contact,'#fff',0)+rect(x-2,y-2,4,4,'#fff','none',0);
export function inverterLayoutCore(x=0,y=0,{labels=true,ports=true}={}) {
    let s=rect(x+24,y+31,390,259,layer.substrate,'#c3d6ef',0)+rect(x+52,y+48,321,94,layer.well,'#83c79c',0);
    // Active regions are crossed by one common poly gate. Poly contact is outside active.
    s+=rect(x+100,y+79,215,40,layer.pdiff,'#e8a539',0)+rect(x+100,y+210,215,40,layer.ndiff,'#44b7cb',0)+rect(x+203,y+60,19,208,layer.poly,'#e85776',0);
    // Well/body taps are separate active islands tied to their supplies.
    s+=rect(x+62,y+85,23,28,layer.ndiff,'#44b7cb',0)+rect(x+62,y+216,23,28,layer.pdiff,'#e8a539',0);
    // Supply rails, source contacts, and isolated input/output routes.
    s+=rect(x+24,y+14,390,17,layer.metal,'#1474e0',0)+rect(x+24,y+290,390,17,layer.metal,'#1474e0',0);
    s+=wire(`M${x+127} ${y+99}V${y+23}M${x+73} ${y+99}V${y+23}M${x+127} ${y+230}V${y+299}M${x+73} ${y+230}V${y+299}`,layer.metal,12);
    s+=wire(`M${x+285} ${y+99}H${x+338}V${y+230}H${x+285}M${x+338} ${y+164}H${x+432}M${x+13} ${y+164}H${x+212}`,layer.metal,12);
    [[127,99],[73,99],[127,230],[73,230],[285,99],[285,230],[212,164]].forEach(([cx,cy])=>s+=contact(x+cx,y+cy));
    if(labels)s+=tx(x+221,y+27,'VDD · M1','text-anchor="middle" style="fill:white" class="small"')+tx(x+221,y+304,'GND · M1','text-anchor="middle" style="fill:white" class="small"')+tx(x+364,y+68,'N-well','text-anchor="end" class="small"')+tx(x+263,y+277,'P-substrate','text-anchor="end" class="small"');
    if(ports)s+=tx(x+17,y+149,'Vin','class="small label blue"')+tx(x+432,y+148,'Vout','text-anchor="end" class="small label blue"');
    return s;
}
export function inverterLayout({legend=true}={}) {
    let s=inverterLayoutCore(9,13);
    if(legend){const rows=[['Poly · gate',layer.poly],['Metal 1 · routing',layer.metal],['N-well',layer.well],['P+ diffusion',layer.pdiff],['N+ diffusion',layer.ndiff],['Contact',layer.contact]];rows.forEach(([name,c],i)=>s+=rect(480,45+i*42,19,19,c,c,1)+tx(511,60+i*42,name,'class="small"'));s+=tx(230,364,'Poly contact는 active 바깥 · Output은 두 drain만 연결','text-anchor="middle" class="small"');}
    return svg(legend?716:465,legend?390:340,'하나의 poly gate와 분리한 VDD GND Vin Vout 및 well substrate tap을 가진 개념 inverter layout',s);
}
export function cmosCrossSection() {
    let s=rect(25,147,1020,130,'#d9eaff','#aac8ee',0)+rect(569,147,450,91,layer.well,'#8ec59b',8);
    const devs=[{x:100,name:'NMOS · P-substrate',diff:layer.ndiff},{x:640,name:'PMOS · N-well',diff:layer.pdiff}];
    devs.forEach(d=>{
        s+=rect(d.x,147,105,45,d.diff,'#7fa9b8',4)+rect(d.x+235,147,105,45,d.diff,'#7fa9b8',4)+rect(d.x+135,139,65,8,'#cce9fb','#97bcd4',0)+rect(d.x+135,112,65,27,layer.poly,'#e95776',1);
        s+=rect(d.x+38,110,20,51,'#ffd28a','#d29c44',0)+rect(d.x+273,110,20,51,'#ffd28a','#d29c44',0)+rect(d.x+6,92,82,18,layer.metal,'#1474e0',0)+rect(d.x+241,92,82,18,layer.metal,'#1474e0',0);
        s+=tx(d.x+170,34,d.name,'text-anchor="middle" class="label"')+tx(d.x+47,76,'Source','text-anchor="middle" class="small"')+tx(d.x+168,76,'Gate','text-anchor="middle" class="small"')+tx(d.x+283,76,'Drain','text-anchor="middle" class="small"');
    });
    s+=rect(465,147,59,59,'#e6e9ee','#9ba7b7',3)+tx(494,180,'STI','text-anchor="middle" class="small"')+tx(521,261,'P-substrate','text-anchor="middle" class="label"')+tx(805,222,'N-well','text-anchor="middle" class="small"')+tx(535,315,'단면 방향별 terminal만 표시 · 실제 net 연결은 상부 routing에서 정의','text-anchor="middle" class="small"');
    return svg(1070,339,'NMOS와 PMOS의 gate oxide diffusion contact well과 STI를 구분한 소자 단면; source drain metal은 서로 분리',s);
}
export function cellRow() {
    let s='';for(let i=0;i<3;i++){const x=20+i*352;s+=`<g transform="translate(${x} 10) scale(.8)">${inverterLayoutCore(0,0,{labels:false,ports:false})}</g>`+wire(`M${x+13} 16V270`,'#9caec4',1,'stroke-dasharray="4 4"')+tx(x+176,293,`INV_X1 · Cell ${i}`,'text-anchor="middle" class="small label"');}
    // Abutting supply rails only. Signal pin stubs do not cross cell boundaries.
    s+=rect(40,20,1022,14,layer.metal,'#1474e0',0)+rect(40,242,1022,14,layer.metal,'#1474e0',0)+tx(550,18,'VDD · row rail','text-anchor="middle" class="small blue"')+tx(550,326,'GND · row rail / signal은 별도 route 전까지 독립','text-anchor="middle" class="small blue"');
    return svg(1090,351,'같은 높이로 배치한 세 inverter cell의 공통 전원 레일과 독립 신호 pin',s);
}
