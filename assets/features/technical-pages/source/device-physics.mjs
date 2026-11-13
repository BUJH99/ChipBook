import {fmt,table} from '../../curriculum/source/presentation.mjs';
import {palette as C,tx,wire,node,rect,arrow,svg,plot} from './figures.mjs';
import {bindModel,put} from './ai-common.mjs';

export function pnJunction({acceptors=1e16,donors=1e16}={}) {
    const q=1.602176634e-19,epsilon=11.7*8.8541878128e-14,thermal=.0258519998,ni=1e10;
    if(acceptors<1e14||donors<1e14||acceptors>1e18||donors>1e18)throw new Error('이 비축퇴 abrupt Si 모델은 각 doping 농도를 10¹⁴–10¹⁸ cm⁻³ 범위로 제한합니다.');
    const builtIn=thermal*Math.log(acceptors*donors/ni**2),width=Math.sqrt(2*epsilon*builtIn/q*(1/acceptors+1/donors)),xp=width*donors/(acceptors+donors),xn=width*acceptors/(acceptors+donors),peak=q*acceptors*xp/epsilon;
    const left=-xp-width*.32,right=xn+width*.32;
    const points=Array.from({length:241},(_,i)=>{const x=left+(right-left)*i/240;let field=0,potential=0;
        if(x>=xn)potential=builtIn;
        else if(x>0){field=-q*donors*(xn-x)/epsilon;potential=builtIn-q*donors*(xn-x)**2/(2*epsilon);}
        else if(x>=-xp){field=-q*acceptors*(x+xp)/epsilon;potential=q*acceptors*(x+xp)**2/(2*epsilon);}
        const electron=ni**2/acceptors*Math.exp(potential/thermal),hole=ni**2/electron;
        return{x:x*1e4,field:field/1000,potential,electron,hole};
    });return{q,epsilon,thermal,ni,acceptors,donors,builtIn,width:width*1e4,xp:xp*1e4,xn:xn*1e4,peak:peak/1000,points};
}
export function pnChargeFigure() {
    let s=rect(15,71,270,186,'#fff0f4','#f1aac1',0)+rect(285,71,270,186,'#edf6ff','#9dc4f4',0)+rect(201,71,168,186,'#f7f4ff','#b8a6d9',0);
    s+=tx(111,35,'P 영역','text-anchor="middle" class="label"')+tx(285,35,'공핍 영역','text-anchor="middle" class="label"')+tx(459,35,'N 영역','text-anchor="middle" class="label"');
    for(let r=0;r<3;r++)for(let c=0;c<3;c++){
        const y=108+r*53,x=48+c*55;s+=`<circle cx="${x}" cy="${y}" r="10" fill="#fff" stroke="${C.red}"/>`+tx(x,y+6,'+','text-anchor="middle" class="label"');
        const nx=399+c*55;s+=`<circle cx="${nx}" cy="${y}" r="10" fill="${C.blue}"/>`+tx(nx,y+5,'−','text-anchor="middle" style="fill:#fff"');
    }
    for(let r=0;r<4;r++){const y=95+r*44;s+=`<circle cx="238" cy="${y}" r="12" fill="#fce0e9" stroke="${C.red}"/>`+tx(238,y+6,'−','text-anchor="middle" class="label"')+`<circle cx="332" cy="${y}" r="12" fill="#dcecff" stroke="${C.blue}"/>`+tx(332,y+6,'+','text-anchor="middle" class="label"');}
    s+=wire('M285 61V270','#9facc0',1,'stroke-dasharray="4 4"')+tx(233,288,'A⁻ · 고정','text-anchor="middle" class="small"')+tx(337,288,'D⁺ · 고정','text-anchor="middle" class="small"')+tx(90,288,'정공 다수','text-anchor="middle" class="small"')+tx(467,288,'전자 다수','text-anchor="middle" class="small"');
    s+=arrow(353,325,217,325,C.purple,2)+tx(285,352,'내부 전기장 E: N → P','text-anchor="middle" class="label purple"')+tx(285,383,'이동 carrier 감소 · 고정 이온의 공간 전하는 남음','text-anchor="middle" class="small"');
    return svg(575,409,'P는 왼쪽 N은 오른쪽인 PN 접합의 이동 carrier와 공핍층의 acceptor 및 donor 고정 전하',s);
}
export function pnProfiles(d) {
    const left=159,right=1081,xmin=d.points[0].x,xmax=d.points.at(-1).x,sx=x=>left+(x-xmin)/(xmax-xmin)*(right-left);let s='';
    const low=Math.floor(Math.log10(Math.min(d.ni**2/d.acceptors,d.ni**2/d.donors))),high=Math.ceil(Math.log10(Math.max(d.acceptors,d.donors)));
    const profiles=[{top:74,bottom:174,min:low,max:high,label:'Carrier 농도',unit:'log₁₀(cm⁻³)',series:[{key:'hole',color:C.red,log:true},{key:'electron',color:C.blue,log:true}]},{top:223,bottom:308,min:-Math.max(.001,d.peak)*1.1,max:0,label:'전기장 E(x)',unit:'kV/cm',series:[{key:'field',color:C.purple}]},{top:358,bottom:447,min:0,max:d.builtIn*1.12,label:'전위 φ(x)',unit:'V',series:[{key:'potential',color:C.green}]}];
    s+=rect(left,10,sx(0)-left,32,'#fff0f5','none')+rect(sx(0),10,right-sx(0),32,'#edf6ff','none')+tx((left+sx(0))/2,32,`P · Nₐ=${d.acceptors.toExponential(1)} cm⁻³`,'text-anchor="middle" class="small"')+tx((right+sx(0))/2,32,`N · Nᴅ=${d.donors.toExponential(1)} cm⁻³`,'text-anchor="middle" class="small"');
    profiles.forEach(p=>{const sy=y=>p.bottom-(y-p.min)/(p.max-p.min)*(p.bottom-p.top);
        s+=rect(sx(-d.xp),p.top,sx(d.xn)-sx(-d.xp),p.bottom-p.top,'#f7f4fe','none',0)+wire(`M${left} ${p.top}V${p.bottom}H${right}`,C.ink,1.2)+tx(5,(p.top+p.bottom)/2-4,p.label,'class="label"')+tx(5,(p.top+p.bottom)/2+19,p.unit,'class="small"');
        for(const y of [p.min,(p.min+p.max)/2,p.max])s+=wire(`M${left} ${sy(y)}H${right}`,'#dde5f0',.7,'stroke-dasharray="4 4"')+tx(left-10,sy(y)+5,fmt(y),'text-anchor="end" class="small"');
        p.series.forEach(ser=>s+=wire(d.points.map((pt,i)=>`${i?'L':'M'}${sx(pt.x)} ${sy(ser.log?Math.log10(pt[ser.key]):pt[ser.key])}`).join(''),ser.color,2.3));
    });
    [-d.xp,0,d.xn].forEach((x,i)=>s+=wire(`M${sx(x)} 49V456`,'#9daec5',1,'stroke-dasharray="4 4"')+tx(sx(x),478,['−xₚ','0','xₙ'][i],'text-anchor="middle" class="small"'));
    s+=tx(right,511,'위치 x (μm) · 접합 경계 x=0','text-anchor="end" class="small"')+tx(165,511,`W=${fmt(d.width)} μm · Vbi=${fmt(d.builtIn)} V · Epeak=−${fmt(d.peak)} kV/cm`,'class="small"')+tx(right-7,66,'빨강 p · 파랑 n','text-anchor="end" class="small"');return svg(1110,533,'동일 P-left N-right 좌표에 정렬한 평형 carrier 농도 전기장 전위의 정량 곡선',s);
}
export function initDeviceJunction(root) {
    put(root,'device-pn-charge',pnChargeFigure());
    bindModel(root,'device-pn',v=>{const d=pnJunction({acceptors:10**v.logNA,donors:10**v.logND});put(root,'device-pn-profiles',pnProfiles(d));put(root,'device-pn-result',table(['평형 결과','값'],[['Vbi',`${fmt(d.builtIn)} V`],['총 공핍 폭 W',`${fmt(d.width)} μm`],['P 쪽 / N 쪽 폭',`${fmt(d.xp)} / ${fmt(d.xn)} μm`],['고정 전하 균형','Nₐxₚ = Nᴅxₙ'],['가정','300 K · ni=10¹⁰ cm⁻³ · εSi=11.7 ε0']]));});
}

export function mosGlyph(x,y,{type='n',body=true,labels=false}={}) {
    let s=wire(`M${x+60} ${y}v25h-20M${x+40} ${y+75}h20v25M${x+24} ${y+24}v52M${x} ${y+50}h24M${x+40} ${y+26}v15m0 4v10m0 5v15`,C.ink,2);
    if(body){s+=wire(`M${x+100} ${y+50}H${x+70}`,C.ink,1.8)+(type==='n'?arrow(x+70,y+50,x+43,y+50,C.ink,1.8):arrow(x+43,y+50,x+70,y+50,C.ink,1.8));}
    else{s+=wire(`M${x+78} ${y+50}V${y+100}H${x+60}`,C.ink,1.5)+(type==='n'?arrow(x+78,y+50,x+43,y+50,C.ink,1.6):arrow(x+43,y+50,x+78,y+50,C.ink,1.6));}
    if(labels)s+=tx(x-10,y+55,'G','text-anchor="end" class="small label"')+tx(x+60,y-10,'D','text-anchor="middle" class="small label"')+tx(x+60,y+122,'S','text-anchor="middle" class="small label"')+(body?tx(x+113,y+55,'B','class="small label"'):'');return s;
}
export function mosSymbols() {
    let s=tx(126,28,'NMOS','text-anchor="middle" class="label blue"')+tx(392,28,'PMOS','text-anchor="middle" class="label purple"')+mosGlyph(75,72,{type:'n',labels:true})+mosGlyph(341,72,{type:'p',labels:true});
    s+=tx(126,232,'Body → channel','text-anchor="middle" class="small"')+tx(392,232,'Channel → body','text-anchor="middle" class="small"');return svg(554,260,'별도 body 단자를 가진 enhancement NMOS PMOS 기호와 body channel junction 방향',s);
}
export function mosCurrent({vgs=1.2,vds=.5,vth=.4,beta=1}={}) {
    const overdrive=vgs-vth,region=overdrive<=0?'Cutoff':vds<overdrive?'Triode':'Saturation';
    const current=overdrive<=0?0:vds<overdrive?beta*(overdrive*vds-vds*vds/2):beta*overdrive**2/2;
    return{overdrive:Math.max(0,overdrive),region,current,saturation:beta*Math.max(0,overdrive)**2/2};
}
export function initDeviceMos(root) {
    put(root,'device-mos-symbols',mosSymbols());
    bindModel(root,'device-mos',v=>{const d=mosCurrent(v),gate=Array.from({length:101},(_,i)=>[i*.024,mosCurrent({...v,vgs:i*.024}).current]),levels=[v.vgs*.5,v.vgs*.75,v.vgs],drain=levels.map((vgs,i)=>({color:[C.purple,C.green,C.blue][i],points:Array.from({length:101},(_,j)=>[j*.024,mosCurrent({...v,vgs,vds:j*.024}).current])}));
        put(root,'device-mos-transfer',plot([{points:gate,color:C.blue}],{width:540,height:330,xmin:0,xmax:2.4,ymin:0,ymax:Math.max(.1,...gate.map(p=>p[1]))*1.1,xlabel:'VGS (V) · VDS 고정',ylabel:'ID (mA)',points:[{x:v.vgs,y:d.current}]}));
        put(root,'device-mos-output',plot(drain,{width:540,height:330,xmin:0,xmax:2.4,ymin:0,ymax:Math.max(.1,...drain.flatMap(s=>s.points.map(p=>p[1])))*1.1,xlabel:'VDS (V)',ylabel:'ID (mA)',points:[{x:v.vds,y:d.current}]}));
        put(root,'device-mos-legend',`<div class="tech-legend">${levels.map((level,i)=>`<span style="--legend:${[C.purple,C.green,C.blue][i]}">VGS=${fmt(level)} V</span>`).join('')}</div>`);
        put(root,'device-mos-result',`<small>VGS−Vth = ${fmt(d.overdrive)} V · ID=${fmt(d.current)} mA</small>${d.region}`);
        put(root,'device-mos-values',table(['항목','값'],[['현재 ID',`${fmt(d.current)} mA`],['VDSsat',`${fmt(d.overdrive)} V`],['Ideal ID,sat',`${fmt(d.saturation)} mA`],['현재 조건',d.region==='Cutoff'?'VGS ≤ Vth':d.region==='Triode'?'0 ≤ VDS < VGS − Vth':'VDS ≥ VGS − Vth']]));
    });
}
