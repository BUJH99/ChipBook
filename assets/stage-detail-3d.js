import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';

// Concept models for teaching structure and sequence, not a process/EDA simulator.
const C = { blue: 0x3182f6, ink: 0x27476c, cell: 0x85b4e8, green: 0x46bba0, violet: 0x9c91e1, gold: 0xdba844, board: 0xd5e3f2 };
const vector = (xyz) => new THREE.Vector3(...xyz);
const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .18, ...options });

function box(parent, dimensions, position, color, options = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material(color, options));
    mesh.position.set(...position);
    mesh.castShadow = dimensions[1] > .15;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

function outline(mesh, color = 0x6287b0) {
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .52 })));
}

function line(parent, points, color, opacity = 1) {
    const object = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(vector)), new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    parent.add(object);
    return object;
}

function tube(parent, points, color, radius = .027) {
    const curve = new THREE.CatmullRomCurve3(points.map(vector));
    const object = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 5, false), material(color, { metalness: .55, roughness: .3 }));
    parent.add(object);
    return object;
}

function label(parent, text, position, scale = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 104;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(255,255,255,.94)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#d5e4f7';
    context.lineWidth = 4;
    context.strokeRect(2, 2, 508, 100);
    context.font = '700 62px system-ui, sans-serif';
    context.fillStyle = '#25456c';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 54, 475);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }));
    sprite.scale.set(2.1 * scale, .43 * scale, 1);
    sprite.position.set(...position);
    sprite.renderOrder = 10;
    parent.add(sprite);
    return sprite;
}

function instances(parent, geometry, positions, colors, baseMaterial = material(C.cell)) {
    const mesh = new THREE.InstancedMesh(geometry, baseMaterial, positions.length);
    const transform = new THREE.Object3D();
    positions.forEach((position, i) => {
        transform.position.set(...position);
        transform.updateMatrix();
        mesh.setMatrixAt(i, transform.matrix);
        if (colors) mesh.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

function physicalModel() {
    const group = new THREE.Group();
    const cells = new THREE.Group();
    const clock = new THREE.Group();
    const routing = new THREE.Group();
    group.add(cells, clock, routing);
    outline(box(group, [8.3, .25, 8.3], [0, -.13, 0], 0xb7c9df));
    box(group, [7.6, .035, 7.6], [0, .01, 0], 0xf1f6fc);
    const macros = [
        { name: 'CPU', x: -2.15, z: -2.15, color: 0x93bafa },
        { name: 'SRAM', x: 2.15, z: -2.15, color: 0x94d4bd },
        { name: 'DSP', x: -2.15, z: 2.15, color: 0xb4a9e5 },
        { name: 'PLL', x: 2.15, z: 2.15, color: 0x8dcae5 },
    ];
    macros.forEach((macro) => {
        outline(box(group, [2.4, .34, 2.05], [macro.x, .2, macro.z], macro.color));
        label(group, macro.name, [macro.x, .85, macro.z], 1.2);
        for (let n = 0; n < 9; n++) {
            box(group, [.065, .035, .16], [macro.x - .99 + n * .245, .395, macro.z + 1], 0xf5d982);
            box(group, [.065, .035, .16], [macro.x - .99 + n * .245, .395, macro.z - 1], 0xf5d982);
        }
    });
    for (let n = 0; n < 24; n++) {
        const p = -3.72 + n * .323;
        [[p, .045, -4.02], [p, .045, 4.02], [-4.02, .045, p], [4.02, .045, p]].forEach((position) => box(group, [.19, .11, .19], position, 0xd8b975));
    }
    // Standard-cell rows occupy only the corridors outside the fixed macro footprints.
    const positions = [];
    for (let row = 0; row < 33; row++) {
        const z = -3.5 + row * .216;
        for (let col = 0; col < 28; col++) {
            const x = -3.5 + col * .259;
            if (macros.some((macro) => Math.abs(x - macro.x) < 1.34 && Math.abs(z - macro.z) < 1.17)) continue;
            positions.push([x, .105, z]);
        }
    }
    instances(cells, new THREE.BoxGeometry(.206, .13, .125), positions, [0x75a8e3, 0x9cbce7, 0xbed1e8, 0x8cadd2]);
    // Clock distribution uses a trunk and balanced branches, shown above the cells.
    const clockMat = material(0x1769ed, { roughness: .4 });
    const clockPoints = [
        [[0,.43,-3.65],[0,.43,0]],
        [[0,.43,0],[-1.0,.43,0]], [[0,.43,0],[1.0,.43,0]],
        [[-1,.43,0],[-1,.43,-1.65]], [[-1,.43,0],[-1,.43,1.65]],
        [[1,.43,0],[1,.43,-1.65]], [[1,.43,0],[1,.43,1.65]],
    ];
    clockPoints.forEach((points) => tube(clock, points, C.blue, .045));
    for (const x of [-1,1]) for (const z of [-1.65,1.65]) {
        const node = new THREE.Mesh(new THREE.SphereGeometry(.095, 12, 8), clockMat);
        node.position.set(x,.43,z);
        clock.add(node);
        for (const sign of [-1,1]) {
            tube(clock, [[x,.43,z],[x + sign*.4,.43,z],[x + sign*.4,.43,z + (z > 0 ? .8 : -.8)]], C.blue, .025);
        }
    }
    // Orthogonal tracks in multiple layers make the relation between routes and cells visible.
    for (let n = 0; n < 36; n++) {
        const offset = -1.15 + n * .065;
        const far = -3.32 + (n % 16) * .44;
        const y = .53 + (n % 3) * .06;
        line(routing, [[-3.5,y,offset],[far,y,offset],[far,y,3.45]], n % 3 === 0 ? C.gold : C.green, .88);
        line(routing, [[offset,y,-3.45],[offset,y,far],[3.5,y,far]], n % 2 ? 0x5191e5 : 0x62c4c1, .88);
    }
    label(group, 'IO', [0,.18,4.45], .52);
    const descriptions = [
        'Floorplan · CPU·SRAM·DSP·PLL과 IO의 위치를 정하고, 셀을 놓을 공간을 확보합니다.',
        'Placement · 고정된 매크로 사이의 공간에 표준 셀을 배치합니다.',
        'CTS · 파란색 클록 트리를 추가해 각 영역으로 클록을 분배합니다.',
        'Routing · 서로 다른 높이의 배선층으로 셀과 블록을 연결합니다. 이후 RC를 추출해 검증합니다.',
    ];
    return {
        group,
        descriptions,
        setStep(index) {
            cells.visible = index >= 1;
            clock.visible = index >= 2;
            routing.visible = index >= 3;
        },
    };
}

function packageModel(includeLabels = true) {
    const group = new THREE.Group();
    const dieGroup = new THREE.Group();
    const lidGroup = new THREE.Group();
    const wireGroup = new THREE.Group();
    group.add(dieGroup, lidGroup, wireGroup);
    outline(box(group, [6.5, .3, 6.5], [0, 0, 0], 0x398d83));
    box(group, [6.12, .03, 6.12], [0, .17, 0], 0x477f75);
    const ballPositions = [];
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) ballPositions.push([-2.73 + col * .78, -.4, -2.73 + row * .78]);
    instances(group, new THREE.SphereGeometry(.17, 12, 8), ballPositions, null, material(0xc5ced7, { metalness: .8, roughness: .23 }));
    outline(box(dieGroup, [2.75, .22, 2.75], [0, .42, 0], 0x355995));
    for (let n = 0; n < 14; n++) {
        const offset = -1.22 + n * .187;
        line(dieGroup, [[offset,.537,-1.23],[offset,.537,1.23]], n % 3 ? 0x88b6e0 : 0xc9b786);
        line(dieGroup, [[-1.23,.538,offset],[1.23,.538,offset]], 0x83b6d3);
    }
    outline(box(lidGroup, [5.8, .8, 5.8], [0, .98, 0], 0x4d637e, { transparent: true, opacity: .2, depthWrite: false, roughness: .68 }));
    const goldMaterial = material(C.gold, { metalness: .75, roughness: .25 });
    const wireEndpoints = [];
    for (let side = 0; side < 4; side++) for (let n = 0; n < 10; n++) {
        const offset = -1.16 + n * .258;
        const angle = side * Math.PI / 2;
        const inner = new THREE.Vector3(offset, .54, 1.32).applyAxisAngle(new THREE.Vector3(0,1,0), angle);
        const outer = new THREE.Vector3(offset * 1.7, .2, 2.64).applyAxisAngle(new THREE.Vector3(0,1,0), angle);
        wireEndpoints.push({ inner, outer });
        box(group, [.18, .03, .18], [outer.x, .2, outer.z], C.gold, { metalness: .7 });
    }
    const wireMeshes = wireEndpoints.map(() => {
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), goldMaterial);
        wireGroup.add(mesh);
        return mesh;
    });
    const dieLabel = includeLabels ? label(dieGroup, 'Silicon die', [0, .94, 0], 1.1) : null;
    if (includeLabels) {
        label(group, 'Substrate', [-2.7,.6,3.15], 1.1);
        label(lidGroup, 'Mold', [2.4,1.7,-2.1], 1.05);
    }
    const explode = (amount) => {
        const shift = amount * 1.9;
        dieGroup.position.y = shift;
        lidGroup.position.y = amount * 3.7;
        wireEndpoints.forEach(({ inner, outer }, i) => {
            const start = inner.clone();
            start.y += shift;
            const middle = start.clone().lerp(outer, .5);
            middle.y = Math.max(start.y, outer.y) + .58;
            const curve = new THREE.QuadraticBezierCurve3(start, middle, outer);
            wireMeshes[i].geometry.dispose();
            wireMeshes[i].geometry = new THREE.TubeGeometry(curve, 18, .022, 5, false);
        });
        if (dieLabel) dieLabel.visible = true;
    };
    explode(0);
    return { group, explode };
}

function manufacturingModel() {
    const group = new THREE.Group();
    const wafer = new THREE.Group();
    const packageAssembly = packageModel();
    const test = new THREE.Group();
    group.add(wafer, packageAssembly.group, test);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.95,3.95,.15,96), material(0x8ea9cc,{metalness:.65,roughness:.25}));
    wafer.add(disc);
    const dies = [];
    for (let row = -6; row <= 6; row++) for (let col = -6; col <= 6; col++) {
        const x = col * .56;
        const z = row * .56;
        if (Math.hypot(Math.abs(x) + .25, Math.abs(z) + .25) > 3.83) continue;
        dies.push([x,.107,z]);
    }
    instances(wafer, new THREE.BoxGeometry(.51,.045,.51), dies, [0x669acc,0x91a3d9,0x8fb9c9,0xaeb6d7], material(0x9ab7df,{metalness:.45,roughness:.26}));
    label(wafer, 'Wafer', [-2.7,.7,3.6], .8);
    label(wafer, 'Repeated dies', [2.2,.8,-3], .9);
    outline(box(test,[7.8,.45,6.4],[0,-.05,0],0xc0cddb));
    box(test,[6.3,.09,5.1],[0,.23,0],0x83a9b4);
    const testPackage = packageModel(false);
    testPackage.group.scale.setScalar(.53);
    testPackage.group.position.y = .7;
    test.add(testPackage.group);
    outline(box(test,[4.7,.55,3.9],[0,3.1,0],0xd1dbe5));
    box(test,[3.5,.2,2.9],[0,2.75,0],0x8d9eaf);
    for (const x of [-1.5,-.5,.5,1.5]) for (const z of [-1.2,0,1.2]) {
        const probe = new THREE.Mesh(new THREE.CylinderGeometry(.055,.025,1.4,8), material(0xe3c981,{metalness:.72}));
        probe.position.set(x,1.98,z);
        test.add(probe);
    }
    for (const x of [-3.2,3.2]) box(test,[.25,3.8,.25],[x,1.8,-2.5],0x95aac0,{metalness:.55});
    label(test,'Production test',[0,3.8,0],1.1);
    label(test,'Electrical contact',[0,.85,3.05],1.0);
    const descriptions = [
        'Wafer fabrication · 웨이퍼 위에 같은 설계의 다이가 반복해서 형성됩니다. 회전해서 표면과 두께를 살펴보세요.',
        'Package assembly · 다이, 본딩 연결, 기판, 보호 구조를 조립합니다. 분해 슬라이더로 층 사이의 관계를 확인하세요.',
        'Production test · 테스트 장비가 패키지와 전기적으로 접촉해 동작을 검사합니다. 그림은 접촉 관계를 나타낸 개념 모델입니다.',
    ];
    return {
        group,
        descriptions,
        setStep(index) {
            wafer.visible = index === 0;
            packageAssembly.group.visible = index === 1;
            test.visible = index === 2;
        },
        explode: packageAssembly.explode,
    };
}

export function mountViewer(host) {
    const container = host.querySelector('[data-sd-canvas]');
    const description = host.querySelector('[data-sd-3d-description]');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f8fd);
    const camera = new THREE.PerspectiveCamera(35,1,.1,120);
    camera.position.set(8.5,11.1,10.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);
    const controls = new OrbitControls(camera,renderer.domElement);
    controls.target.set(0,.5,0);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 32;
    controls.minPolarAngle = .12;
    controls.maxPolarAngle = Math.PI * .63;
    controls.autoRotateSpeed = .75;
    controls.update();
    controls.saveState();
    scene.add(new THREE.HemisphereLight(0xe5f0ff,0x8c9aa9,1.7));
    const keyLight = new THREE.DirectionalLight(0xffffff,2.7);
    keyLight.position.set(-7,14,7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024,1024);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -.0008;
    keyLight.shadow.normalBias = .04;
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0xc4ddff,1.1);
    fill.position.set(8,4,-8);
    scene.add(fill);
    const model = host.getAttribute('data-sd-3d') === 'physical' ? physicalModel() : manufacturingModel();
    scene.add(model.group);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80,80), new THREE.ShadowMaterial({color:0x536e8f,opacity:.12}));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.65;
    ground.receiveShadow = true;
    scene.add(ground);
    let active = false;
    let requestedActive = false;
    let inViewport = true;
    let autoRotate = false;
    let pendingFrame = 0;
    let disposed = false;
    let currentStep = 0;
    let explodedAmount = 0;
    const focusHeight = () => host.getAttribute('data-sd-3d') === 'manufacturing' && currentStep === 1 ? .3 + explodedAmount * 1.55 : .3;
    const centerModel = () => {
        const height = focusHeight();
        camera.position.y += height - controls.target.y;
        controls.target.y = height;
        controls.update();
    };
    const render = () => {
        pendingFrame = 0;
        if (!active || disposed) return;
        controls.autoRotate = autoRotate;
        controls.update();
        renderer.render(scene,camera);
        host.dataset.rendered = 'true';
        if (autoRotate) requestRender();
    };
    function requestRender() {
        if (active && !disposed && !pendingFrame) pendingFrame = requestAnimationFrame(render);
    }
    const resize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width,height,false);
        camera.aspect = width / height;
        camera.fov = camera.aspect < 1.2 ? 45 : 35;
        camera.updateProjectionMatrix();
        requestRender();
    };
    const syncActive = () => {
        active = requestedActive && inViewport && !disposed && !document.hidden && !host.closest('[hidden]');
        host.dataset.active = String(active);
        if (!active) { cancelAnimationFrame(pendingFrame); pendingFrame = 0; }
        else { resize(); requestRender(); }
    };
    const setStep = (index) => {
        if (!Number.isInteger(index) || index < 0 || index >= model.descriptions.length) return;
        currentStep = index;
        model.setStep(index);
        host.dataset.step = String(index);
        host.querySelectorAll('[data-sd-3d-step]').forEach((button) => button.setAttribute('aria-pressed',String(Number(button.getAttribute('data-sd-3d-step')) === index)));
        description.textContent = model.descriptions[index];
        const explodeControl = host.querySelector('.sd-explode-control');
        if (explodeControl) explodeControl.hidden = index !== 1;
        centerModel();
        requestRender();
    };
    const zoom = (factor) => {
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(THREE.MathUtils.clamp(offset.length() * factor,controls.minDistance,controls.maxDistance));
        camera.position.copy(controls.target).add(offset);
        controls.update();
        requestRender();
    };
    const rotate = (thetaDelta,phiDelta) => {
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta += thetaDelta;
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + phiDelta,controls.minPolarAngle,controls.maxPolarAngle);
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
        controls.update();
        requestRender();
    };
    const handleClick = (event) => {
        const button = event.target.closest('button');
        if (!button || !host.contains(button)) return;
        if (button.hasAttribute('data-sd-3d-step')) setStep(Number(button.getAttribute('data-sd-3d-step')));
        if (button.dataset.sdCamera === 'reset') { controls.reset(); centerModel(); requestRender(); }
        if (button.dataset.sdCamera === 'zoom-in') zoom(.82);
        if (button.dataset.sdCamera === 'zoom-out') zoom(1.22);
        if (button.hasAttribute('data-sd-auto')) {
            autoRotate = !autoRotate;
            button.setAttribute('aria-pressed',String(autoRotate));
            host.dataset.autoRotate = String(autoRotate);
            requestRender();
        }
    };
    const handleKey = (event) => {
        const handlers = {
            ArrowLeft: () => rotate(.12,0), ArrowRight: () => rotate(-.12,0),
            ArrowUp: () => rotate(0,-.1), ArrowDown: () => rotate(0,.1),
            '+': () => zoom(.9), '=': () => zoom(.9), '-': () => zoom(1.1),
            Home: () => { controls.reset(); centerModel(); requestRender(); },
        };
        if (!handlers[event.key]) return;
        event.preventDefault();
        event.stopPropagation();
        handlers[event.key]();
    };
    const handleExplode = (event) => {
        const amount = THREE.MathUtils.clamp(Number(event.target.value) || 0,0,100);
        const nextAmount = amount / 100;
        const offset = camera.position.clone().sub(controls.target);
        offset.multiplyScalar((15 + nextAmount * 3.6) / (15 + explodedAmount * 3.6));
        camera.position.copy(controls.target).add(offset);
        explodedAmount = nextAmount;
        model.explode?.(amount / 100);
        centerModel();
        host.querySelector('[data-sd-explode-value]').value = `${amount}%`;
        host.dataset.explode = String(amount);
        requestRender();
    };
    controls.addEventListener('change',requestRender);
    host.addEventListener('click',handleClick);
    container.addEventListener('keydown',handleKey);
    host.querySelector('[data-sd-explode]')?.addEventListener('input',handleExplode);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const visibilityObserver = new IntersectionObserver((entries) => {
        inViewport = entries[0].isIntersecting;
        syncActive();
    });
    visibilityObserver.observe(container);
    renderer.domElement.addEventListener('webglcontextlost',(event) => {
        event.preventDefault();
        active = false;
        host.dataset.contextLost = 'true';
        description.textContent = '3D 연결이 잠시 중단되었습니다. 그림으로 보기에서도 과정을 확인할 수 있습니다.';
    });
    renderer.domElement.addEventListener('webglcontextrestored',() => {
        delete host.dataset.contextLost;
        syncActive();
        setStep(currentStep);
        resize();
    });
    setStep(0);
    resize();
    const dispose = () => {
        if (disposed) return;
        disposed = true;
        active = false;
        cancelAnimationFrame(pendingFrame);
        observer.disconnect();
        visibilityObserver.disconnect();
        controls.dispose();
        const geometries = new Set();
        const materials = new Set();
        scene.traverse((object) => {
            if (object.geometry) geometries.add(object.geometry);
            if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((item) => materials.add(item));
        });
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((item) => { item.map?.dispose(); item.dispose(); });
        renderer.dispose();
        host.removeEventListener('click',handleClick);
        container.removeEventListener('keydown',handleKey);
        host.querySelector('[data-sd-explode]')?.removeEventListener('input',handleExplode);
    };
    window.addEventListener('pagehide',(event) => { if (!event.persisted) dispose(); });
    return {
        setActive(value) {
            requestedActive = Boolean(value);
            syncActive();
        },
        dispose,
    };
}
