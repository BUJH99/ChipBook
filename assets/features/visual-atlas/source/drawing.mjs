import {line, curveBasis, curveStepAfter, scaleLinear, interpolateRgb, arc} from 'd3';

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export const palette = ['#3182f6','#8b5cf6','#0ea5a4','#e5a126','#ef677b'];
export const color = n => palette[((n % palette.length) + palette.length) % palette.length];
export const text = (x,y,value,cls='',anchor='start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
export const path = (d,stroke='#8ba3c4',width=2,cls='') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" class="${cls}"/>`;
export const circle = (x,y,r,fill,stroke='none') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
export const rect = (x,y,w,h,fill='#fff',stroke='#cbd9ec',rx=10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
export const trace = (points,c=0) => path(line().curve(curveBasis)(points),color(c),3,'atlas-signal');
export const rail = (x1,y1,x2,y2,c=0) => path(`M${x1} ${y1}H${x2}V${y2}`,color(c),2.5,'atlas-signal');
export const pulse = (d,c=0) => path(d,color(c),5,'atlas-pulse');
export const dot = (x,y,c=0) => circle(x,y,5,color(c));
export const ground=(x,y)=>path(`M${x} ${y}v10m-14 0h28m-23 6h18m-13 6h8`,'#7890af',2);
export const resistor=(x,y,vertical=true)=>path(vertical?`M${x} ${y}v8l-6 5 12 8-12 8 12 8-6 5v8`:`M${x} ${y}h8l5-6 8 12 8-12 8 12 5-6h8`,'#647f9e',2);
export const capacitor=(x,y)=>path(`M${x} ${y}v20m-14 0h28m-28 8h28m-14 0v20`,'#647f9e',2);
export const arrow=(x,y,c=0)=>`<path d="M${x-7} ${y-5}l7 5-7 5" fill="none" stroke="${color(c)}" stroke-width="2"/>`;

export function chip(x,y,w,h,label,c=0) {
    let pins='';
    for(let i=1;i<=5;i++){
        const yy=y+i*h/6; pins+=path(`M${x-12} ${yy}H${x}M${x+w} ${yy}h12`,'#a5b8ce',4);
    }
    return rect(x+4,y+6,w,h,'#d5e4f3','none',14)+rect(x,y,w,h,`url(#atlas-chip-${c%3})`,color(c),14)+pins+text(x+w/2,y+h/2+6,label,'atlas-chip-label','middle');
}
export function dff(x,y,label,c=0) {
    return rect(x,y,84,90,'#fff',color(c),8)+text(x+42,y+27,label,'atlas-small','middle')+text(x+10,y+54,'D','atlas-small')+text(x+62,y+54,'Q','atlas-small')+path(`M${x+31} ${y+90}l9-13 9 13`,color(c),2);
}
export function mos(x,y,p=false,c=0) {
    return path(`M${x} ${y+35}h20m0-22v44m8-48v52m0-45h24v-16m-24 54h24v16`,color(c),2.5)+(p?circle(x+18,y+35,4,'#fff',color(c)):'');
}
export function labelCallout(x,y,tx,ty,label,c=0){return path(`M${x} ${y}L${tx} ${ty}h${tx>x?20:-20}`,color(c),1.4)+dot(x,y,c)+text(tx+(tx>x?25:-25),ty+5,label,'atlas-small',tx>x?'start':'end');}
export function waveform(x,y,w,rows,names,phase=0,rowColors=[]){
    const sx=scaleLinear().domain([0,rows[0].length-1]).range([x+66,x+w]);
    return rows.map((r,j)=>text(x,y+22+j*44,names[j],'atlas-small')+path(line().x((d,i)=>sx(i)).y(d=>y+12+j*44+(d?0:24)).curve(curveStepAfter)(r),rowColors[j]||color(j),2.5)).join('')+path(`M${x+66+phase*(w-66)} ${y-8}v${rows.length*44+3}`,'#ef9f35',2,'atlas-time-cursor');
}
