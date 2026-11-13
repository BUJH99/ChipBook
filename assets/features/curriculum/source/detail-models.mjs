// Deterministic teaching models, not electrical signoff or protocol compliance models.
import { bits, clamp, systolic, i2cWrite } from './models.mjs';

export const pvtDelay=(nominal,voltage,temperature)=>nominal*(.9/voltage)**1.4*(1+.002*(temperature-25));
export function interfaceBudget({required=100,latency=100,kind='all',payloadBytes}={}){
    const candidates=[['UART','control',.1152*8/10,10],['I2C','control',.4*8/9,9],['SPI','control',50,8],['PCIe Gen3 x4','data',8000*4*128/130,256],['Ethernet 1G','data',1000*1500/1538,1500],['D-PHY 2lane 예시','data',3000,1024]];
    return candidates.filter(row=>kind==='all'||row[1]===kind).map(([name,,rate,exampleBytes])=>{
        const bytes=payloadBytes??exampleBytes;
        return {name,rate,bytes,microseconds:bytes*8/rate,pass:rate>=required&&bytes*8/rate<=latency};
    });
}

export function i2cRead(address=80,register=165,value=60,stretch=0) {
    const samples=i2cWrite(address,register,false,stretch).samples.slice(0,-3);
    samples.push({scl:0,sda:1,label:'RESTART 준비'},{scl:1,sda:1,label:'RESTART 준비'},{scl:1,sda:0,label:'REPEATED START'});
    const append=(byte,name,ack)=>{bits(byte).forEach((bit,i)=>samples.push({scl:0,sda:bit,label:`${name} b${7-i}`},{scl:1,sda:bit,label:`${name} b${7-i}`}));samples.push({scl:0,sda:ack,label:ack?'MASTER NACK':'ACK'},{scl:1,sda:ack,label:ack?'MASTER NACK':'ACK'});};
    append((address<<1)|1,'ADDR+R',0);append(value,'READ DATA',1);
    samples.push({scl:0,sda:0,label:'STOP 준비'},{scl:1,sda:0,label:'STOP 준비'},{scl:1,sda:1,label:'STOP'});
    return {samples,addressByte:(address<<1)|1,payload:value,accepted:true};
}

export function uartReceive(value, txBaud, rxBaud, parity = 'none', badStop = false) {
    const data = bits(value, 8, true), p = data.reduce((a,b)=>a^b,0) ^ Number(parity==='odd');
    const frame = [0,...data,...(parity==='none'?[]:[p]),badStop?0:1,1];
    const samples = Array.from({length:8 + Number(parity!=='none') + 1},(_,i)=>{
        const time=(1.5+i)*txBaud/rxBaud;
        return {slot:i,time,bit:frame[Math.floor(time)]??1};
    });
    const decoded=samples.slice(0,8).reduce((a,s,i)=>a+(s.bit<<i),0);
    const parityError=parity!=='none' && samples[8].bit!==(bits(decoded,8,true).reduce((a,b)=>a^b,0)^Number(parity==='odd'));
    return {samples,decoded,parityError,framingError:samples.at(-1).bit!==1,mismatch:100*(rxBaud/txBaud-1)};
}

export function arbitration(a, b, width=11) {
    const aa=bits(a,width),bb=bits(b,width);let loser='';
    const rows=aa.map((bit,i)=>{
        const av=loser==='A'?1:bit,bv=loser==='B'?1:bb[i],bus=av&bv;
        if(!loser && av!==bv)loser=av===1?'A':'B';
        return {bit:width-1-i,a:av,b:bv,bus,loser};
    });
    return {rows,winner:loser==='A'?'B':loser==='B'?'A':'동일 ID',value:Math.min(a,b),lostAt:rows.find(r=>r.loser)?.bit};
}

export function training({tap=16,jitter=2,offset=0}) {
    const windows=Array.from({length:8},(_,i)=>({bit:i,start:7+(i%3)+offset+jitter,end:25-(i%4)+offset-jitter}));
    const start=Math.max(...windows.map(w=>w.start)),end=Math.min(...windows.map(w=>w.end));
    return {windows,start,end,center:start<=end?(start+end)/2:null,pass:tap>=start&&tap<=end};
}

export function pcie({generation=3,lanes=4,payload=256}) {
    const rates=[0,2.5,5,8,16,32],rate=rates[generation],encoding=generation<3?0.8:128/130;
    // One 3-DW Memory Write, sequence number/LCRC/framing overhead approximated as 20 B.
    const packetRatio=payload/(payload+20);
    return {rate,encoding,packetRatio,gbps:rate*lanes*encoding*packetRatio/8,raw:rate*lanes/8};
}

export function ethernet({payload=1500,rate=1,offered=90,service=80,depth=32}) {
    const padded=Math.max(46,payload),wireBytes=padded+38,efficiency=payload/wireBytes;
    let queue=0,drops=0;
    const rows=Array.from({length:10},(_,i)=>{const next=queue+offered-service;const drop=Math.max(0,next-depth);drops+=drop;queue=clamp(next,0,depth);return [i+1,offered,service,queue,drop];});
    return {wireBytes,efficiency,payloadGbps:rate*efficiency,frameNS:wireBytes*8/rate,rows,drops};
}

export function pixelBudget({width=1920,height=1080,fps=60,bpp=10,lanes=2,overhead=15,laneRate=1.5}) {
    const payload=width*height*fps*bpp/1e9,required=payload*(1+overhead/100),capacity=lanes*laneRate;
    return {payload,required,perLane:required/lanes,capacity,margin:capacity-required};
}

export function reflection({z0=50,load=100,source=50,voltage=1}) {
    const launched=voltage*z0/(source+z0),gamma=(load-z0)/(load+z0),sourceGamma=(source-z0)/(source+z0);
    let atLoad=0,incident=launched;
    const rows=Array.from({length:5},(_,i)=>{atLoad+=incident*(1+gamma);const row=[2*i+1,incident,incident*gamma,atLoad];incident*=gamma*sourceGamma;return row;});
    return {gamma,sourceGamma,launched,rows};
}

export function registerWrite(previous, value, access='RW', strobe=15) {
    let mask=0;for(let i=0;i<4;i++)if(strobe&(1<<i))mask=(mask|(255<<(i*8)))>>>0;
    const next=access==='RO'?previous:access==='W1C'?(previous&~(value&mask)):((previous&~mask)|(value&mask));
    return {mask:mask>>>0,value:next>>>0};
}

export function overlap({tiles=4,load=3,compute=5,store=2}) {
    let loadEnd=0,computeEnd=0,storeEnd=0;
    const rows=[];
    for(let i=0;i<tiles;i++){
        // Two buffers; reuse a buffer only after the store of tile i-2 completes.
        const lStart=Math.max(loadEnd,i>=2?rows[i-2].sEnd:0);loadEnd=lStart+load;
        const cStart=Math.max(computeEnd,loadEnd);computeEnd=cStart+compute;
        const sStart=Math.max(storeEnd,computeEnd);storeEnd=sStart+store;
        rows.push({tile:i,buffer:i%2,lStart,lEnd:loadEnd,cStart,cEnd:computeEnd,sStart,sEnd:storeEnd});
    }
    return {rows,serial:tiles*(load+compute+store),overlapped:storeEnd,speedup:tiles*(load+compute+store)/storeEnd};
}

export function bankAccess({banks=4,stride=1,requests=8}) {
    const rows=Array.from({length:requests},(_,i)=>({request:i,address:i*stride,bank:(i*stride)%banks}));
    const counts=Array.from({length:banks},(_,b)=>rows.filter(r=>r.bank===b).length);
    return {rows,counts,cycles:Math.max(...counts),ideal:Math.ceil(requests/banks)};
}

export function dataflow({m=4,n=4,k=4,mode='OS'}) {
    const macs=m*n*k;
    // Scalar local-storage boundary, no inter-PE multicast; one complete stationary object fits.
    const traffic=mode==='OS'?{A:macs,B:macs,C:m*n}:mode==='WS'?{A:macs,B:k*n,C:m*n*(2*k-1)}:{A:m*k,B:macs,C:m*n*(2*k-1)};
    return {macs,traffic,total:traffic.A+traffic.B+traffic.C,result:systolic([[1,2],[3,4]],[[5,6],[7,8]]).sums};
}

export function activation(x, mode='relu') {
    if(mode==='relu')return Math.max(0,x);
    if(mode==='relu6')return Math.min(6,Math.max(0,x));
    return .5*x*(1+Math.tanh(Math.sqrt(2/Math.PI)*(x+.044715*x**3)));
}

export function activationApproximation(x, mode='gelu', segments=16) {
    const clamped=Math.max(-8,Math.min(8,x)),step=16/segments;
    const index=Math.min(segments-1,Math.floor((clamped+8)/step)),left=-8+index*step;
    const a=activation(left,mode),b=activation(left+step,mode);
    return a+(b-a)*(clamped-left)/step;
}

export function sparse({zeros=50,metadata=1}) {
    const values=Array.from({length:32},(_,i)=>((i*37)%100)<zeros?0:(i%7)+1);
    const nonzero=values.map((v,i)=>[i,v]).filter(x=>x[1]!==0),loads=Array.from({length:4},(_,p)=>values.slice(p*8,p*8+8).filter(Boolean).length);
    return {values,nonzero,loads,denseBytes:32,sparseBytes:nonzero.length*(1+metadata),useful:nonzero.length,cycles:Math.max(...loads)};
}

export function attention({q=1,scale=1}) {
    const keys=[-1,0,1,2],values=[2,4,6,8],scores=keys.map(k=>q*k*scale),max=Math.max(...scores),e=scores.map(s=>Math.exp(s-max)),sum=e.reduce((a,b)=>a+b,0),weights=e.map(x=>x/sum);
    return {rows:keys.map((k,i)=>[k,values[i],scores[i],weights[i]]),output:weights.reduce((a,w,i)=>a+w*values[i],0)};
}

export function mos({vgs=1.2,vth=.4,beta=1}) {
    const overdrive=Math.max(0,vgs-vth);
    return Array.from({length:41},(_,i)=>{const vds=i*.05;return [vds,vds<overdrive?beta*(overdrive*vds-vds*vds/2):beta*overdrive**2/2];});
}

export function adc({bits:width=4,vref=3.3,vin=1.8,sinad=60}) {
    const levels=2**width,lsb=vref/levels,code=clamp(Math.floor(vin/lsb),0,levels-1),restored=(code+.5)*lsb;
    let trial=0;const sar=[];
    for(let bit=width-1;bit>=0;bit--){const candidate=trial+(1<<bit),threshold=candidate*lsb,keep=vin>=threshold;if(keep)trial=candidate;sar.push([bit,candidate,threshold,keep?'유지':'제거',trial]);}
    return {levels,lsb,code,restored,error:restored-vin,enob:(sinad-1.76)/6.02,sar,clipped:vin<0||vin>=vref};
}

export function secondOrder({damping=.7,frequency=1}) {
    const z=damping,w=2*Math.PI*frequency;
    return Array.from({length:101},(_,i)=>{
        const t=i/25;let y;
        if(z<1){const wd=w*Math.sqrt(1-z*z);y=1-Math.exp(-z*w*t)*(Math.cos(wd*t)+z/Math.sqrt(1-z*z)*Math.sin(wd*t));}
        else if(Math.abs(z-1)<1e-8)y=1-Math.exp(-w*t)*(1+w*t);
        else{const a=-w*(z-Math.sqrt(z*z-1)),b=-w*(z+Math.sqrt(z*z-1));y=1+(b*Math.exp(a*t)-a*Math.exp(b*t))/(a-b);}
        return [t,y];
    });
}

export function cdcTrace({pulse=1,period=4,phase=0}) {
    let first=0,second=0;
    return Array.from({length:24},(_,t)=>{const source=t>=2&&t<2+pulse?1:0,edge=(t-phase+period)%period===0;if(edge){second=first;first=source;}return [t,source,edge?1:0,first,second];});
}

export function scanTrace({pattern=10,fault=-1}) {
    let cells=[0,0,0,0];const rows=[];
    bits(pattern,4,true).forEach((input,t)=>{cells=[input,...cells.slice(0,3)];rows.push([`Shift ${t+1}`,input,...cells]);});
    const captured=cells.map((v,i)=>i===fault?0:v),syndrome=captured.map((v,i)=>v^cells[i]);
    rows.push(['Capture','—',...captured]);
    return {rows,expected:cells,captured,detected:syndrome.some(Boolean)};
}

export function yieldModel({area=100,defects=.2,dies=100,thermal=2,power=10,ambient=25}) {
    const yieldFraction=Math.exp(-area/100*defects);
    return {yieldFraction,good:dies*yieldFraction,junction:ambient+thermal*power};
}

export function qos({camera=6,cpu=4,dma=8,policy='round-robin'}) {
    const pending=[camera,cpu,dma],labels=['Camera','CPU','DMA'],rows=[];let cursor=0;
    while(pending.some(x=>x>0)){
        let selected=policy==='priority'?pending.findIndex(x=>x>0):-1;
        if(selected<0){for(let j=0;j<3;j++){const index=(cursor+j)%3;if(pending[index]>0){selected=index;break;}}}
        pending[selected]--;cursor=(selected+1)%3;
        rows.push([rows.length,labels[selected],...pending]);
    }
    return {rows,first:labels.map(name=>rows.find(r=>r[1]===name)?.[0]??0)};
}

export function safetyAccess({address=4096,secure=0,write=0,locked=1}) {
    const region=address<4096?'Boot ROM':address<8192?'Secure SRAM':'Shared SRAM';
    const allowed=region==='Boot ROM'?!write:region==='Secure SRAM'?Boolean(secure)||!locked:true;
    return {region,allowed,reason:allowed?'접근 수락':region==='Boot ROM'?'ROM 쓰기 차단':'보안 도메인 불일치'};
}

export function convolution({height=8,width=8,inputChannels=3,outputChannels=8,kernel=3,stride=1,padding=1}) {
    const outH=Math.floor((height+2*padding-kernel)/stride)+1,outW=Math.floor((width+2*padding-kernel)/stride)+1;
    const valid=outH>0&&outW>0;
    return {outH,outW,valid,m:Math.max(0,outH*outW),n:outputChannels,k:kernel*kernel*inputChannels,
        macs:valid?outH*outW*outputChannels*kernel*kernel*inputChannels:0};
}

export function bode({damping=.7,frequency=1}) {
    return Array.from({length:81},(_,i)=>{const logf=-2+i/20,f=10**logf,ratio=f/frequency;
        return [logf,20*Math.log10(1/Math.hypot(1-ratio*ratio,2*damping*ratio)),-Math.atan2(2*damping*ratio,1-ratio*ratio)*180/Math.PI];});
}

export function layoutGradient({pattern='ABBA',gradient=1}) {
    const positions=[-1.5,-.5,.5,1.5],a=[],b=[];
    [...pattern].forEach((name,i)=>(name==='A'?a:b).push(positions[i]*gradient));
    const mean=values=>values.reduce((x,y)=>x+y,0)/values.length;
    return {positions,a:mean(a),b:mean(b),mismatch:mean(a)-mean(b)};
}
