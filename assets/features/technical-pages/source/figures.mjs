import {escape,fmt} from '../../curriculum/source/presentation.mjs';

export const palette={blue:'#0879ff',green:'#00a987',purple:'#7e59c9',orange:'#ea9a37',red:'#eb5874',ink:'#243c5d',line:'#cbd9ea'};
export const tx=(x,y,s,extra='')=>`<text x="${x}" y="${y}" ${extra}>${escape(s)}</text>`;
export const wire=(d,color=palette.ink,width=1.6,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
export const node=(x,y,color=palette.blue,r=3)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
export const rect=(x,y,w,h,fill='#fff',stroke=palette.line,rx=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
export const ground=(x,y)=>wire(`M${x} ${y}v8m-10 0h20m-16 4h12m-8 4h4`);
export const resistor=(x,y,h=46,color=palette.orange)=>wire(`M${x} ${y}v6l-5 4 10 5-10 5 10 5-10 5 10 5-5 5v${h-40}`,color,2);
export const capacitor=(x,y,h=42)=>wire(`M${x} ${y}v${h/2-3}m-11 0h22m-22 6h22m-11 0v${h/2-3}`);
export const arrow=(x1,y1,x2,y2,color=palette.blue,width=1.8)=>{
    const angle=Math.atan2(y2-y1,x2-x1),a=6;
    return wire(`M${x1} ${y1}L${x2} ${y2}`,color,width)+wire(`M${x2-a*Math.cos(angle-.5)} ${y2-a*Math.sin(angle-.5)}L${x2} ${y2}L${x2-a*Math.cos(angle+.5)} ${y2-a*Math.sin(angle+.5)}`,color,width);
};
export const svg=(w,h,label,content,cls='')=>`<svg class="tech-svg ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(label)}">${content}</svg>`;
export function labeledBox(x,y,w,h,title,subtitle='',color=palette.blue,fill='#f1f7ff') {
    return rect(x,y,w,h,fill,color)+tx(x+w/2,y+h/2-(subtitle?5:-5),title,'text-anchor="middle" class="label"')+(subtitle?tx(x+w/2,y+h/2+15,subtitle,'text-anchor="middle" class="small"'):'');
}
export function plot(series,{width=740,height=320,xmin=0,xmax=1,ymin=0,ymax=1,xlabel='',ylabel='',bands=[],points=[]}={}) {
    const left=66,right=width-35,top=35,bottom=height-54,sx=v=>left+(v-xmin)/(xmax-xmin)*(right-left),sy=v=>bottom-(v-ymin)/(ymax-ymin)*(bottom-top);
    let content='';
    bands.forEach(b=>content+=`<rect x="${left}" y="${sy(b.to)}" width="${right-left}" height="${sy(b.from)-sy(b.to)}" fill="${b.color}"/>`+(b.label?tx(right-3,sy((b.to+b.from)/2)+4,b.label,'text-anchor="end" class="small"'):''));
    for(let i=0;i<=5;i++){const x=xmin+(xmax-xmin)*i/5,y=ymin+(ymax-ymin)*i/5;content+=wire(`M${sx(x)} ${top}V${bottom}M${left} ${sy(y)}H${right}`,'#dce5ef',.8,'stroke-dasharray="4 4"')+tx(sx(x),bottom+22,fmt(x),'text-anchor="middle" class="small"')+tx(left-9,sy(y)+4,fmt(y),'text-anchor="end" class="small"');}
    content+=arrow(left,bottom,right+7,bottom,'#344965',1.4)+arrow(left,bottom,left,top-7,'#344965',1.4);
    content+=series.map((s,i)=>wire(s.points.map((p,j)=>`${j?'L':'M'}${sx(p[0]).toFixed(3)} ${sy(p[1]).toFixed(3)}`).join(''),s.color||Object.values(palette)[i],2.4)).join('');
    content+=points.map(p=>node(sx(p.x),sy(p.y),p.color||palette.red,4)).join('');
    content+=tx((left+right)/2,height-8,xlabel,'text-anchor="middle"')+tx(left,18,ylabel,'class="small"');
    return svg(width,height,`${xlabel}와 ${ylabel} 관계`,content);
}
