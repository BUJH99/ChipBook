import {fmt} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,ground,capacitor} from './figures.mjs';
import {digitalMos} from './cmos-primitives.mjs';

export const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
export function hResistor(x,y,w=90,label='R',color=C.ink) {const lead=(w-48)/2;return wire(`M${x} ${y}h${lead}l6-6 9 12 9-12 9 12 9-12 6 6h${lead}`,color,1.6)+(label?tx(x+w/2,y-13,label,'text-anchor="middle" class="small"'):'');}
export function vResistor(x,y,h=72,label='R') {return `<g transform="translate(${x} ${y}) rotate(90)">${hResistor(0,0,h,'')}</g>`+(label?tx(x+17,y+h/2+5,label,'class="small"'):'');}
export function opAmp(x,y,{w=106,h=108,label='A(s)',positiveTop=true}={}) {
    return `<path d="M${x} ${y-h/2}L${x} ${y+h/2}L${x+w} ${y}Z" fill="#f2f7ff" stroke="${C.blue}" stroke-width="1.8"/>`+wire(`M${x-30} ${y-h/4}H${x}M${x-30} ${y+h/4}H${x}M${x+w} ${y}H${x+w+30}`,C.ink,1.5)+tx(x+14,y-h/4+5,positiveTop?'+':'−','class="label blue"')+tx(x+14,y+h/4+5,positiveTop?'−':'+','class="label blue"')+tx(x+w*.42,y+6,label,'text-anchor="middle" class="small label blue"');
}
export function analogMos(x,y,type='n',side='left') {return side==='left'?digitalMos(x,y,{type}):`<g transform="translate(${2*x} 0) scale(-1 1)">${digitalMos(x,y,{type})}</g>`;}
export function feedbackCircuit({rf=90,rg=10,reference='GND',load=true}={}) {
    let s=opAmp(198,134,{w:132,h:132})+wire('M23 101H168M330 134H493M168 167H135V264H238M333 264H420V134',C.ink,1.7)+hResistor(238,264,95,`Rf · ${fmt(rf)} kΩ`)+vResistor(135,264,74,`Rg · ${fmt(rg)} kΩ`)+ground(135,338)+node(135,264)+node(420,134);
    s+=tx(20,78,'Vin +','class="label blue"')+tx(493,112,'Vout','text-anchor="end" class="label blue"')+tx(25,371,reference==='GND'?'Rg 하단 = GND':`Rg 하단 = ${reference}`,'class="small"');
    if(load)s+=wire('M470 134V192',C.ink)+capacitor(470,192,46)+ground(470,238)+tx(495,219,'CL','class="small"');
    s+=tx(295,411,`β = Rg/(Rf+Rg) · 이상적 비반전 gain = ${fmt(1+rf/rg)}`,'text-anchor="middle" class="small"');return svg(558,435,'출력 Rf와 ground Rg divider midpoint만 inverting input에 연결한 negative feedback noninverting amplifier',s);
}
export function frequencyPlot(series,{width=600,height=330,xmin=10,xmax=1e7,ymin=-40,ymax=80,logY=false,xlabel='Frequency (Hz)',ylabel='Gain (dB)',marks=[]}={}) {
    const left=68,right=width-29,top=34,bottom=height-55,lmin=Math.log10(xmin),lmax=Math.log10(xmax),sx=x=>left+(Math.log10(x)-lmin)/(lmax-lmin)*(right-left),a=logY?Math.log10(ymin):ymin,b=logY?Math.log10(ymax):ymax,sy=y=>bottom-((logY?Math.log10(Math.max(y,ymin*1e-6)):y)-a)/(b-a)*(bottom-top);let s='';
    for(let e=Math.ceil(lmin);e<=Math.floor(lmax);e++){const x=10**e;s+=wire(`M${sx(x)} ${top}V${bottom}`,'#dce5ef',.8)+tx(sx(x),bottom+23,fmt(x),'text-anchor="middle" class="small"');}
    for(let i=0;i<=5;i++){const val=logY?10**(a+(b-a)*i/5):a+(b-a)*i/5;s+=wire(`M${left} ${sy(val)}H${right}`,'#dce5ef',.8)+tx(left-9,sy(val)+5,fmt(val),'text-anchor="end" class="small"');}
    s+=wire(`M${left} ${top}V${bottom}H${right}`,C.ink,1.2)+tx(left,18,ylabel,'class="small"')+tx((left+right)/2,height-8,xlabel,'text-anchor="middle" class="small"');
    for(const ser of series)s+=wire(ser.points.map(([x,y],i)=>`${i?'L':'M'}${sx(x)} ${sy(clamp(y,ymin,ymax))}`).join(''),ser.color||C.blue,2.3,ser.dash?'stroke-dasharray="5 4"':'');
    marks.forEach(m=>s+=node(sx(m.x),sy(m.y),m.color||C.red,4));return svg(width,height,`${xlabel} 로그 축에서 ${ylabel} 비교`,s);
}
export function stepValue(t,z,wn) {
    if(t<=0)return 0;
    if(Math.abs(z-1)<1e-7)return 1-Math.exp(-wn*t)*(1+wn*t);
    if(z<1){const d=Math.sqrt(1-z*z);return 1-Math.exp(-z*wn*t)*(Math.cos(wn*d*t)+z/d*Math.sin(wn*d*t));}
    const a=-wn*(z-Math.sqrt(z*z-1)),b=-wn*(z+Math.sqrt(z*z-1));return 1+(b*Math.exp(a*t)-a*Math.exp(b*t))/(a-b);
}
export function mirrorLayout(pattern='ABBA',{large=false}={}) {
    const count=pattern.length,step=94,left=100,width=left+count*step+135;let s=rect(25,16,width-50,336,'#f5fcf7','#60b685',13)+rect(42,33,width-84,302,'#fff','#9ccfaf',8);
    // Source and P+ substrate guard ring share VSS; output drains use separate upper layers.
    s+=wire(`M${left-5} 287H${left+count*step-15}M${left+count*step-15} 287H${width-25}`,C.blue,8)+tx(width-42,313,'VSS','text-anchor="end" class="small blue"');
    s+=wire(`M65 230H${left+count*step-16}`,C.red,8)+tx(66,255,'Common gate','class="small"');
    const aXs=[],bXs=[];
    [...pattern].forEach((p,i)=>{const x=left+i*step,color=p==='A'?C.blue:C.orange;s+=rect(x,139,64,39,'#93dce5','#51b6c6',0)+rect(x+25,111,13,122,'#ff7991','#e85878',0)+wire(`M${x+10} 158V287`,C.blue,6);
        const drain=x+53;const level=p==='A'?56:84;const metal=p==='A'?C.purple:C.green;s+=wire(`M${drain} 158V${level}`,metal,5)+rect(drain-7,151,14,14,'#fff',metal,1)+node(drain,158,metal,3)+rect(x+4,152,12,12,'#edf5ff',C.blue,0)+tx(x+32,207,p,`text-anchor="middle" class="label" style="fill:${color}"`)+tx(x+31,130,'G','text-anchor="middle" class="small"');(p==='A'?aXs:bXs).push(drain);
    });
    s+=wire(`M65 56H${Math.max(...aXs)}M65 56V230`,C.purple,5)+rect(58,223,14,14,'#fff',C.purple,1)+node(65,230,C.purple,3)+wire(`M${Math.min(...bXs)} 84H${width-50}`,C.green,5)+tx(width-52,71,'B · output drain','text-anchor="end" class="small green"')+tx(left-4,48,'A · reference drain ↔ common gate','class="small purple"');
    for(const x of [57,width-76])s+=rect(x,134,15,49,'#e0e5eb','#a0adbc',0)+tx(x+7,205,'D','text-anchor="middle" class="small"');
    s+=tx(width/2,379,'P+ substrate guard → VSS · A: M2 · B: M3 · gate: poly · source: M1','text-anchor="middle" class="small"');
    if(large)s+=tx(width/2,408,'서로 다른 layer의 교차는 via가 없으면 절연 · 치수와 routing balance는 실제 PDK에서 검증','text-anchor="middle" class="small"');
    return svg(width,large?432:402,'NMOS mirror의 대칭 unit 배치와 별도 drain routing, diode-connected A, 공통 source gate 및 P+ substrate guard 개념',s);
}
