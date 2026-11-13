import * as THREE from '../../../../src/vendor/three/three.module.min.js';
import {OrbitControls} from '../../../../src/vendor/three/OrbitControls.js';

const C={blue:0x3182f6,cyan:0x24b8bd,purple:0x9674e8,gold:0xd7ad57,silicon:0x9fb5d0,ink:0x263e60,green:0x67b9a1};
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:.36,metalness:.24,...opts});

function createModel(kind,variant=''){
    const root=new THREE.Group(),parts=[],paths=[],labels=[];
    function part(name,detail,explode=[0,0,0]){
        const group=new THREE.Group();group.userData={name,detail,explode:V(...explode),base:V(0,0,0),partIndex:parts.length};
        root.add(group);parts.push(group);return group;
    }
    function mesh(group,geometry,color,position,options={}){
        const m=new THREE.Mesh(geometry,mat(color,options));m.position.set(...position);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
    }
    function box(group,size,position,color,options={}){
        const m=mesh(group,new THREE.BoxGeometry(...size),color,position,options);
        const edges=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0x42618a,transparent:true,opacity:.2}));m.add(edges);return m;
    }
    function cylinder(group,radius,height,position,color,segments=16){return mesh(group,new THREE.CylinderGeometry(radius,radius,height,segments),color,position);}
    function sphere(group,radius,position,color){return mesh(group,new THREE.SphereGeometry(radius,12,8),color,position);}
    function wire(group,points,color,r=.025,moving=false){
        const vectors=points.map(p=>V(...p));const curve=new THREE.CatmullRomCurve3(vectors,false,'centripetal');
        mesh(group,new THREE.TubeGeometry(curve,Math.max(16,points.length*8),r,6,false),color,[0,0,0]);
        if(moving){const beads=[];for(let i=0;i<3;i++)beads.push(sphere(group,.065,[0,0,0],color));paths.push({curve,beads});}return curve;
    }
    function label(group,name,position){labels.push({group,name,position:V(...position)});}
    function solder(group,y,w=10,d=8){
        const geo=new THREE.SphereGeometry(.105,10,7),m=new THREE.InstancedMesh(geo,mat(0xc2cdda,{metalness:.8,roughness:.2}),w*d),o=new THREE.Object3D();
        for(let z=0;z<d;z++)for(let x=0;x<w;x++){o.position.set((x-(w-1)/2)*.57,y,(z-(d-1)/2)*.57);o.updateMatrix();m.setMatrixAt(z*w+x,o.matrix);}group.add(m);
    }
    function routing(group,y,size=6.6){
        for(let i=0;i<24;i++){
            const offset=(i-12)*.22;wire(group,[[-size/2,y,offset],[-.9+i*.07,y,offset],[-.9+i*.07,y,size/2]],i%2?C.cyan:C.gold,.013);
        }
    }
    function cellRows(group,x,z,w,d,color,elevation=.5){
        const cols=Math.floor(w/.2),rows=Math.floor(d/.2),geo=new THREE.BoxGeometry(.14,.08,.12),inst=new THREE.InstancedMesh(geo,mat(color),cols*rows),o=new THREE.Object3D();
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){o.position.set(x-w/2+c*.2+.1,elevation,z-d/2+r*.2+.1);o.updateMatrix();inst.setMatrixAt(r*cols+c,o.matrix);}group.add(inst);
    }

    if(kind==='capacitor'){
        const base=part('Capacitor DAC substrate','Binary-weighted capacitor cells share a summing node. This is a schematic spatial model.');box(base,[8,.24,4],[0,-.3,0],0xc4d6e8);
        const cells=part('Weighted capacitor bank','Capacitor ratios set the charge-redistribution DAC levels.',[0,1,0]);
        for(let i=0;i<4;i++){const x=-2.55+i*1.7,h=1.7-i*.32;cylinder(cells,.45,h,[x,h/2,0],i%2?C.blue:C.purple,32);cylinder(cells,.08,.35,[x,h+.15,0],C.gold);label(cells,`${2**(3-i)}C`,[x,h+.5,0]);}
        const sum=part('Summing plate','The capacitor top plates connect to the comparator input node.',[0,.4,0]);wire(sum,[[-3.5,.02,1],[3.5,.02,1]],C.cyan,.04,true);
        for(let i=0;i<4;i++)wire(sum,[[-2.55+i*1.7,.02,0],[-2.55+i*1.7,.02,1]],C.cyan,.025);
    }else if(kind==='package'){
        const substrate=part('Package substrate','유기 기판의 배선과 solder ball이 보드와 die를 연결합니다.',[0,0,0]);box(substrate,[7.2,.32,5.5],[0,0,0],0x709990);routing(substrate,.18,6.9);solder(substrate,-.39,11,8);label(substrate,'Substrate',[3.45,.2,2.6]);
        const interposer=part('Silicon interposer','Fine-pitch redistribution과 TSV가 compute die와 HBM을 연결합니다.',[0,1,0]);box(interposer,[6.5,.18,4.7],[0,.47,0],0xa2b5d2);routing(interposer,.575,6.25);label(interposer,'Interposer',[-3.1,.65,2.5]);
        const logic=part('Compute die','대규모 연산 블록과 SRAM이 HBM의 넓은 연결을 사용합니다.',[0,2.1,0]);box(logic,[2.5,.38,3.1],[0,.86,0],C.blue);cellRows(logic,0,0,2.2,2.7,0xc3dbff,1.09);label(logic,'Compute die',[0,1.27,.4]);
        for(const side of [-1,1]){
            const stack=part(side<0?'HBM stack A':'HBM stack B','DRAM die를 쌓고 TSV와 micro-bump로 수직 연결합니다.',[side*.5,2.6,0]);
            for(let layer=0;layer<6;layer++)box(stack,[1.38,.16,2.45],[side*2.25,.81+layer*.215,0],layer%2?0x9f87db:0xb8a2e7);
            for(let i=0;i<5;i++)for(let j=0;j<7;j++)cylinder(stack,.026,1.5,[side*2.25-.48+i*.24,1.3,-.85+j*.28],C.gold,6);
            label(stack,side<0?'HBM A':'HBM B',[side*2.25,2.18,.4]);
            for(let z=-1;z<=1;z+=.5)wire(interposer,[[side*1.2,.6,z],[side*1.7,.6,z],[side*2.2,.6,z]],C.cyan,.025,true);
        }
    }else if(kind==='transistor'){
        const body=part('Silicon body','채널이 형성되는 반도체 몸체입니다. 치수는 구조를 설명하기 위한 비율입니다.');box(body,[6.8,.65,4],[0,-.5,0],C.silicon);label(body,'Silicon body',[-2.5,-.2,1.8]);
        const source=part('Source / Drain','Source와 Drain contact를 통해 전하가 채널로 들어오고 나갑니다.',[0,.2,0]);
        for(const side of [-1,1]){box(source,[1.65,.38,2.8],[side*2.45,-.02,0],0x8794aa);for(let z=-.85;z<=.85;z+=.85){cylinder(source,.2,1.1,[side*2.45,.7,z],0xa2b4cb);box(source,[1,.17,.48],[side*2.45,1.27,z],C.gold);}}
        label(source,'Source',[-2.5,1.5,0]);label(source,'Drain',[2.5,1.5,0]);
        const channel=part('Channel','Gate 전압에 의해 제어되는 Source–Drain의 전하 이동 경로입니다.',[0,.35,0]);
        const oxide=part('Gate dielectric','Gate 전극과 채널 사이의 얇은 절연막입니다.',[0,1,0]);
        const gate=part('Gate electrode','채널의 전기장을 조절하는 금속 Gate입니다.',[0,1.8,0]);
        if(variant==='gaa'){
            for(let n=0;n<3;n++){
                box(channel,[4.8,.11,1.35],[0,.3+n*.45,0],0xa48bd5);
                box(oxide,[1.9,.17,1.52],[0,.3+n*.45,0],0x9dccf1,{transparent:true,opacity:.42,depthWrite:false});
                box(gate,[1.65,.26,1.75],[0,.3+n*.45,0],0xf1a04b,{transparent:true,opacity:.32,depthWrite:false});
            }
            box(gate,[.18,1.6,2.1],[-.9,.8,0],0xf1a04b);box(gate,[.18,1.6,2.1],[.9,.8,0],0xf1a04b);
        }else if(variant==='finfet'){
            for(let n=-1;n<=1;n++){
                box(channel,[4.8,.85,.22],[0,.3,n*.85],0xa48bd5);
                box(oxide,[1.65,.96,.31],[0,.31,n*.85],0x9dccf1,{transparent:true,opacity:.45,depthWrite:false});
            }
            box(gate,[1.4,.22,3],[0,.94,0],0xf1a04b);
            for(let n=-1.5;n<=1.5;n++)box(gate,[1.4,1.02,.4],[0,.35,n*.85],0xf1a04b);
        }else{
            box(channel,[4.9,.08,2.5],[0,-.12,0],0xa48bd5);
            box(oxide,[2.7,.1,2.7],[0,.05,0],0x9dccf1);
            box(gate,[2.5,.62,2.5],[0,.41,0],0xf1a04b);
        }
        label(channel,'Channel',[0,.15,2]);label(gate,'Gate',[0,1.8,-.5]);
        for(let z=-.7;z<=.7;z+=.7)wire(channel,[[-2.8,.16,z],[0,.16,z],[2.8,.16,z]],C.cyan,.026,true);
    }else if(kind==='wafer'){
        const wafer=part('Silicon wafer','격자상 die를 웨이퍼 위에 반복하여 제작합니다. 가장자리 die는 완전한 제품 영역에서 제외됩니다.');cylinder(wafer,4.2,.2,[0,-.2,0],0x354e76,96);
        const dies=part('Die array','동일한 설계가 반복되며 wafer map에서 위치별 특성을 비교합니다.',[0,.8,0]);
        for(let z=-6;z<=6;z++)for(let x=-6;x<=6;x++)if(Math.hypot(x*.58,z*.58)<3.8){const bad=(x*13+z*19+500)%29===0;box(dies,[.5,.06,.5],[x*.58,-.05,z*.58],variant==='yield'&&bad?0xe7798c:((x+z)%3?0x6c9fc5:0x839bd1));}
        const films=part('Patterned layers','증착·노광·식각의 반복으로 공정층이 쌓입니다.',[0,1.8,0]);
        for(let i=0;i<3;i++)box(films,[2.2,.12,2.2],[0,.2+i*.3,0],[C.cyan,C.gold,C.purple][i],{transparent:true,opacity:.65});
        label(wafer,'Wafer',[-3.1,0,3.1]);label(films,'Process layers',[0,1.6,0]);
    }else if(kind==='array'){
        const substrate=part('Array substrate','PE를 연결하는 규칙적인 2차원 배선과 외부 operand port입니다.');box(substrate,[6.9,.25,6.9],[0,-.25,0],0xd4e2f1);
        const cells=part('Processing elements','각 PE가 A와 B를 곱해 local accumulator에 누적합니다.',[0,1,0]);
        for(let r=0;r<4;r++)for(let c=0;c<4;c++){
            const x=(c-1.5)*1.45,z=(r-1.5)*1.45;box(cells,[1,.27,1],[x,.02,z],0x6e9fe8);box(cells,[.82,.08,.82],[x,.2,z],0xf2f7ff);cylinder(cells,.13,.035,[x-.18,.265,z],C.blue);cylinder(cells,.13,.035,[x+.18,.265,z],C.purple);
            if(r===1&&c===1)label(cells,'Processing elements',[0,.7,0]);
        }
        const horizontal=part('A operands','A는 행 방향으로 이동합니다. 입력을 skew하여 B와 같은 cycle에 만나게 합니다.',[0,1.65,0]);
        const vertical=part('B operands','B는 열 방향으로 이동하여 각 PE의 A와 같은 cycle에 만납니다.',[0,2.2,0]);
        for(let i=0;i<4;i++){
            const p=(i-1.5)*1.45;wire(horizontal,[[-3.6,.38,p],[-1.5,.38,p],[1.5,.38,p],[3.6,.38,p]],C.blue,.035,true);wire(vertical,[[p,.49,-3.6],[p,.49,-1.5],[p,.49,1.5],[p,.49,3.6]],C.purple,.035,true);
        }
        label(horizontal,'A → row',[-3.9,.7,0]);label(vertical,'B → column',[0,.7,-3.9]);
    }else if(kind==='pcb'){
        const board=part('PCB / reference plane','신호 배선과 기준면이 함께 return-current 경로를 구성합니다.');box(board,[8,.2,5.2],[0,-.3,0],0x567f78);
        const plane=part('Ground plane','연속된 reference plane은 전송선의 귀환 경로와 임피던스를 결정합니다.',[0,-.8,0]);box(plane,[7.7,.04,4.9],[0,-.48,0],C.gold);
        const devices=part('Connected devices','부품의 IO와 보드 배선을 함께 확인합니다.',[0,1.1,0]);
        if(variant==='i2c'){
            for(const [x,z,name] of [[-2.5,0,'Controller'],[1.1,-1.25,'Target A'],[2.5,1.1,'Target B']]){box(devices,[1.4,.4,1.25],[x,.05,z],C.ink);label(devices,name,[x,.7,z]);}
            const traces=part('SDA / SCL','두 신호는 open-drain 출력과 pull-up 저항으로 공유됩니다.',[0,.6,0]);
            for(let i=0;i<2;i++){const z=-.25+i*.5;wire(traces,[[-2.5,-.15,z],[0,-.15,z],[3.1,-.15,z]],i?C.cyan:C.blue,.035,true);wire(traces,[[1.1,-.15,z],[1.1,-.15,-1.25]],i?C.cyan:C.blue,.025);wire(traces,[[2.5,-.15,z],[2.5,-.15,1.1]],i?C.cyan:C.blue,.025);box(traces,[.6,.17,.22],[-.3,.02,-1.4-i*.5],C.gold);wire(traces,[[-.3,-.1,z],[-.3,-.1,-1.4-i*.5]],C.gold,.02);}
            label(traces,'Pull-up ×2',[-.4,.6,-2]);
        }else{
            const serial=['uart','spi','usb','can'].includes(variant);box(devices,[1.8,.48,2.1],[-2.6,.05,0],C.ink);box(devices,[1.8,.48,2.1],[2.6,.05,0],C.ink);label(devices,serial?'Controller':'TX PHY',[-2.6,.65,0]);label(devices,serial?'Peripheral':'RX PHY',[2.6,.65,0]);
            const traces=part(serial?'Signal traces':'Differential lanes',serial?'각 신호의 방향과 기준면을 확인합니다.':'차동 배선의 길이 정합과 기준면을 함께 봅니다.',[0,.6,0]);
            for(let lane=0;lane<(serial?2:4);lane++)for(let sign=0;sign<(serial?1:2);sign++){const z=(lane-(serial?.5:1.5))*.8+sign*.13;wire(traces,[[-1.7,-.16,z],[-.8,-.16,z],[0,-.16,z+.15],[.8,-.16,z],[1.7,-.16,z]],sign?C.cyan:C.gold,.025,true);}
        }
    }else{
        const base=part('Silicon die','IP와 standard cell, interconnect가 같은 die 안에서 구성됩니다.');box(base,[8,.25,6.3],[0,-.2,0],0xb3c8df);
        const core=part(kind==='fpga'?'CLB / DSP / BRAM':'Logic / IP macros','배치된 논리 블록과 메모리 사이의 경로가 성능과 전력의 제약이 됩니다.',[0,.75,0]);
        if(kind==='fpga'){
            for(let z=-3;z<=3;z++)for(let x=-4;x<=4;x++){const dsp=x===-2||x===2;box(core,[.6,dsp?.36:.18,.6],[x*.76,.1,z*.78],dsp?C.purple:x===0?C.green:C.blue);}
            label(core,'CLB',[2,.8,2]);label(core,'DSP',[-1.52,.9,0]);label(core,'BRAM',[0,.9,-1.7]);
        }else{
            const names=variant==='mini-soc'?['CPU','SRAM','Boot ROM','DMA','IO']:kind==='power'?['AON / PMU','Retention','Domain A','Domain B','ISO']:variant==='secureboot'?['CPU','SRAM','Secure ROM','Crypto','IO']:variant==='hazard'?['IF / ID','MEM / WB','EX / ALU','Regfile','Clock']:['CPU','SRAM','Accelerator','DMA','IO'];
            const blocks=[[-2.25,-1.45,2.4,1.8,C.blue,names[0]],[1.65,-1.35,3.1,1.9,C.green,names[1]],[-2.2,1.4,2.5,1.9,C.purple,names[2]],[1.05,1.4,1.5,1.9,C.cyan,names[3]],[2.8,1.4,1.3,1.9,C.gold,names[4]]];
            blocks.forEach(([x,z,w,d,c,name])=>{box(core,[w,.27,d],[x,.1,z],c);cellRows(core,x,z,w-.2,d-.2,0xe2edf8);label(core,name,[x,.86,z]);});
        }
        const routes=part('Interconnect layers','수평·수직 배선층과 via로 블록을 연결합니다.',[0,1.55,0]);routing(routes,.64,7.7);
        const clock=part('Clock / power distribution','Clock tree와 supply network가 논리 영역 전체에 분배됩니다.',[0,2.15,0]);
        wire(clock,[[0,.77,-3],[0,.77,0],[-3,.77,0]],C.purple,.035,true);wire(clock,[[0,.77,0],[3,.77,0]],C.purple,.035,true);
        for(const x of [-2.4,-1.2,1.2,2.4])wire(clock,[[x,.77,-2.7],[x,.77,0],[x,.77,2.7]],C.purple,.024,true);
        for(let i=0;i<24;i++){const p=(i-11.5)*.31;box(base,[.16,.1,.3],[p,.04,-3.17],C.gold);box(base,[.16,.1,.3],[p,.04,3.17],C.gold);}
        label(clock,kind==='power'?'Power / isolation':'Clock tree',[0,1,-3.2]);
    }
    root.traverse(node=>{if(node.isMesh){let p=node.parent;while(p&&p!==root){if(Number.isInteger(p.userData.partIndex)){node.userData.partIndex=p.userData.partIndex;break;}p=p.parent;}}});
    return {root,parts,paths,labels};
}

export function create(container,config,onSelect){
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.localClippingEnabled=true;
    renderer.domElement.setAttribute('aria-label',`${config.title} 3D 모델. 드래그하여 회전하고 부품을 선택할 수 있습니다.`);renderer.domElement.setAttribute('role','img');
    container.append(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color(0xf7faff);scene.fog=new THREE.Fog(0xf7faff,22,43);
    scene.add(new THREE.HemisphereLight(0xeaf4ff,0x9eafc4,2.2));
    const key=new THREE.DirectionalLight(0xffffff,3.6);key.position.set(-5,10,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:30});key.shadow.bias=-.0005;scene.add(key);
    const fill=new THREE.DirectionalLight(0x99bfff,2);fill.position.set(8,3,-5);scene.add(fill);
    const camera=new THREE.PerspectiveCamera(39,1,.1,100);camera.position.set(8.5,7,9);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.65,0);controls.enableDamping=false;controls.enableZoom=false;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI*.49;controls.update();
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.ShadowMaterial({color:0x4d6a8d,opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-.8;floor.receiveShadow=true;scene.add(floor);
    const model=createModel(config.three,config.modelVariant||config.variant);scene.add(model.root);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null,disposed=false,time=0,selected=-1;
    const overlay=document.createElement('div');overlay.className='atlas-3d-labels';container.append(overlay);
    const labelElements=model.labels.map(item=>{const b=document.createElement('button');b.type='button';b.textContent=item.name;b.className='atlas-3d-label';b.addEventListener('click',()=>select(item.group.userData.partIndex,true));overlay.append(b);return b;});
    function select(index,announce=false){selected=index;model.parts.forEach((part,i)=>part.traverse(node=>{if(node.isMesh&&node.material.emissive){node.material.emissive.setHex(i===index?0x153c76:0x000000);node.material.emissiveIntensity=i===index?.22:0;}}));container.dataset.selectedPart=model.parts[index]?.userData.name||'';if(announce&&model.parts[index])onSelect?.(model.parts[index].userData);render(time);}
    function render(t=time){
        if(disposed)return;time=t;
        model.paths.forEach(({curve,beads},j)=>beads.forEach((bead,i)=>bead.position.copy(curve.getPointAt((t*.15+i/3+j*.045)%1))));
        const bounds=container.getBoundingClientRect();
        model.labels.forEach((item,i)=>{const world=item.group.localToWorld(item.position.clone()).project(camera);const b=labelElements[i];b.style.left=`${(world.x+1)*bounds.width/2}px`;b.style.top=`${(-world.y+1)*bounds.height/2}px`;b.hidden=Math.abs(world.x)>.98||Math.abs(world.y)>.92||world.z>1;b.classList.toggle('is-selected',item.group.userData.partIndex===selected);});
        renderer.render(scene,camera);
    }
    function resize(){if(disposed)return;const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);render();}
    const observer=new ResizeObserver(resize);observer.observe(container);
    controls.addEventListener('change',()=>render());
    renderer.domElement.addEventListener('pointerdown',event=>down=[event.clientX,event.clientY]);
    renderer.domElement.addEventListener('pointerup',event=>{
        if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>6)return;
        const b=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-b.left)/b.width*2-1,-(event.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);
        const hit=raycaster.intersectObjects(model.root.children,true).find(item=>Number.isInteger(item.object.userData.partIndex));if(hit)select(hit.object.userData.partIndex,true);down=null;
    });
    resize();
    return {
        render,select,
        explode(value){model.parts.forEach(part=>part.position.copy(part.userData.base).addScaledVector(part.userData.explode,value));render();},
        cutaway(value){renderer.clippingPlanes=value?[new THREE.Plane(new THREE.Vector3(-1,0,0),0)]:[];render();},
        camera(view){camera.position.set(...(view==='top'?[.01,12,.01]:view==='front'?[0,3,12]:[8.5,7,9]));controls.target.set(0,.65,0);controls.update();render();},
        zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).clampLength(7,25).add(controls.target);controls.update();render();},
        reset(){this.explode(0);this.cutaway(false);this.camera('perspective');select(-1);},
        dispose(){
            if(disposed)return;disposed=true;observer.disconnect();controls.dispose();
            const geometries=new Set(),materials=new Set();scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const m of Array.isArray(node.material)?node.material:node.material?[node.material]:[])materials.add(m);});
            geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();overlay.remove();
        },
    };
}
