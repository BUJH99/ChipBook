import {escape,fmt} from '../../curriculum/source/presentation.mjs';
import {readFields} from './soc-architecture.mjs';
import {palette as C,tx,wire,rect,arrow,svg} from './figures.mjs';

export const put=(root,key,html)=>{const node=root.querySelector(`[data-${key}]`);if(node)node.innerHTML=html;};
export function bindModel(root,key,render) {
    const form=root.querySelector(`[data-${key}-inputs]`);
    const error=document.createElement('p');error.className='tech-model-error';error.setAttribute('role','alert');error.hidden=true;form.after(error);
    const update=()=>{
        if(!form.checkValidity())return;
        try{render(readFields(form));error.hidden=true;error.textContent='';}
        catch(e){error.textContent=e.message;error.hidden=false;}
        window.GuidebookPage?.notifyHeight?.();
    };
    root.addEventListener('input',e=>{if(e.target.form===form)update();});form.addEventListener('submit',e=>e.preventDefault());update();return update;
}
export function parseMatrix(value,{min=-128,max=127,square=true}={}) {
    const rows=String(value).trim().split(/\r?\n/).map(row=>row.trim().split(/[\s,]+/).map(Number));
    if(rows.length<2||rows.length>4||rows.some(row=>row.length!==rows[0].length)||(square&&rows.some(row=>row.length!==rows.length))||rows.some(row=>row.some(n=>!Number.isInteger(n)||n<min||n>max)))throw new Error(`행렬은 2–4행의 ${square?'정방 ':''}행렬이어야 하며 모든 값은 ${min}–${max} 범위의 정수여야 합니다.`);
    return rows;
}
export function matrixTable(values,{name='Matrix',tone='blue',mark=()=>'',editable=false,prefix='cell'}={}) {
    return `<div class="guidebook-scroll-region"><table class="tech-matrix tech-matrix-${tone}" aria-label="${escape(name)}"><thead><tr><th scope="col">${escape(name)}</th>${values[0].map((_,j)=>`<th scope="col">${j}</th>`).join('')}</tr></thead><tbody>${values.map((row,i)=>`<tr><th scope="row">${i}</th>${row.map((v,j)=>`<td class="${escape(mark(i,j,v))}">${editable?`<input type="number" min="-128" max="127" step="1" name="${prefix}-${i}-${j}" aria-label="${escape(name)} ${i}행 ${j}열" value="${v}" required>`:escape(fmt(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function numberGrid(x,y,rows,cols,{cell=23,color=C.blue,values,selected=()=>false,highlight=C.green}={}) {
    let s='';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const active=selected(r,c),fill=active?highlight+'3b':color+'16';
        s+=rect(x+c*cell,y+r*cell,cell,cell,fill,active?highlight:'#b7cbdf',1);
        if(values)s+=tx(x+(c+.5)*cell,y+(r+.5)*cell+5,fmt(values[r][c]),'text-anchor="middle" class="small"');
    }return s;
}
export function peUnit({a='Aᵢ,ₖ',b='Bₖ,ⱼ',sum='Cᵢ,ⱼ',label='Processing Element'}={}) {
    let s=rect(10,10,360,263,'#f7fbff','#c9def5')+tx(27,37,label,'class="label blue"');
    s+=`<circle cx="130" cy="111" r="25" fill="#fff" stroke="${C.blue}"/>`+tx(130,117,'×','text-anchor="middle" class="label"')+rect(228,87,49,49,'#fff',C.purple)+tx(252,118,'+','text-anchor="middle" class="label"')+rect(166,194,144,46,'#effaf5',C.green)+tx(238,223,`ACC ${sum}`,'text-anchor="middle" class="small label"');
    s+=tx(20,98,a,'class="small blue"')+arrow(18,111,105,111,C.blue)+tx(130,67,b,'text-anchor="middle" class="small purple"')+arrow(130,73,130,86,C.purple)+arrow(155,111,228,111,C.blue)+arrow(277,111,347,111,C.green)+wire('M316 111V217H310',C.green)+arrow(322,217,310,217,C.green)+wire('M166 217H145V162H252V136',C.green)+arrow(252,156,252,136,C.green)+tx(196,79,'sext 16→32','text-anchor="middle" class="small"');
    return svg(385,286,'곱셈 결과와 accumulator feedback을 더하는 PE 내부 경로',s);
}
export function horizontalBars(rows,{width=550,height,unit='',max,log=false}={}) {
    max??=Math.max(...rows.map(r=>r.value),1);height??=80+rows.length*58;
    const left=126,range=width-left-(log?150:95),extent=v=>log?Math.log10(Math.max(1,v))/Math.log10(max):v/max;let s='';
    rows.forEach((r,i)=>{const y=20+i*58,w=Math.max(0,extent(r.value)*range);s+=tx(3,y+22,r.label,'class="small label"')+rect(left,y,range,31,'#f0f4f9','none',3)+rect(left,y,w,31,(r.color||C.blue)+'55',r.color||C.blue,3)+tx(left+w+8,y+22,`${fmt(r.value)} ${unit}`,'class="small"');});
    s+=tx(left,height-12,log?'Log₁₀ 길이 · 표시값은 원래 단위':`같은 축 · 최대 ${fmt(max)} ${unit}`,'class="small"');return svg(width,height,`${unit} 기준 항목별 비교`,s);
}
