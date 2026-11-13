(function () {
    function bootPdk44Scenes() {
        if (!window.THREE) return;
        document.querySelectorAll('[data-pdk44-three]').forEach(root => {
            window.GuidebookPage.registerViewportFeature(root, initPdk44Scene);
        });
    }

    function initPdk44Scene(root) {
        var THREE = window.THREE;
        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
        renderer.setClearColor(0xffffff, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if ('SRGBColorSpace' in THREE) renderer.outputColorSpace = THREE.SRGBColorSpace;
        root.appendChild(renderer.domElement);
        root.classList.add('is-ready');

        var scene = new THREE.Scene();
        var camera = new THREE.OrthographicCamera(-4, 4, 3.6, -3.6, 0.1, 100);
        camera.position.set(5.4, 5.0, 7.2);
        camera.lookAt(0.05, 0.38, 0);

        var key = new THREE.DirectionalLight(0xffffff, 2.7);
        key.position.set(2.8, 6, 4.5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        scene.add(key);
        scene.add(new THREE.HemisphereLight(0xf4f8ff, 0xe4ebf5, 1.9));
        var fill = new THREE.PointLight(0x93c4ff, 1.35, 10);
        fill.position.set(-3.4, 2.4, 4.2);
        scene.add(fill);

        var world = new THREE.Group();
        world.position.set(-0.12, 0.1, 0);
        world.rotation.y = -0.02;
        scene.add(world);

        function textureCanvas(width, height, draw) {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            draw(ctx, width, height);
            var texture = new THREE.CanvasTexture(canvas);
            texture.anisotropy = 4;
            texture.needsUpdate = true;
            return texture;
        }

        function layerTexture(color, type) {
            return textureCanvas(640, 260, function (ctx, w, h) {
                ctx.clearRect(0, 0, w, h);
                ctx.strokeStyle = color;
                ctx.lineWidth = 5;
                ctx.globalAlpha = 0.72;
                if (type === 'rules') {
                    for (var x = 30; x < w; x += 56) { ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + 250, h - 10); ctx.stroke(); }
                    for (var y = 28; y < h; y += 36) { ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(w - 28, y + 8); ctx.stroke(); }
                    [[410, 98, 56, 18], [492, 126, 70, 18], [352, 160, 84, 18]].forEach(function (r) { ctx.strokeRect(r[0], r[1], r[2], r[3]); });
                } else if (type === 'models') {
                    [[68, 122, 162, 122], [170, 122, 170, 64], [170, 64, 275, 64], [278, 158, 420, 158], [420, 90, 420, 198], [462, 116, 572, 116]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.stroke(); });
                    [160, 290, 430, 555].forEach(function (x) { ctx.beginPath(); ctx.arc(x, 116 + (x % 3) * 14, 8, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); });
                } else if (type === 'cells' || type === 'abstracts') {
                    for (var i = 0; i < 12; i++) ctx.strokeRect(78 + (i % 6) * 82, 62 + Math.floor(i / 6) * 68, 50 + (i % 3) * 12, 20);
                } else if (type === 'routing') {
                    [[44, 118, 205, 118, 205, 58, 318, 58, 318, 166, 530, 166], [128, 184, 260, 184, 260, 116, 390, 116, 390, 186, 548, 186]].forEach(function (p) {
                        ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (var j = 2; j < p.length; j += 2) ctx.lineTo(p[j], p[j + 1]); ctx.stroke();
                    });
                    [205, 318, 390, 492].forEach(function (x) { ctx.fillStyle = '#fff7ed'; ctx.strokeRect(x - 8, 52 + (x % 2) * 60, 16, 16); });
                } else if (type === 'timing') {
                    ctx.beginPath(); ctx.moveTo(74, 194); ctx.bezierCurveTo(176, 70, 242, 35, 276, 98); ctx.bezierCurveTo(298, 138, 240, 176, 286, 218); ctx.stroke();
                    ctx.fillStyle = color; ctx.font = 'bold 34px IBM Plex Sans, sans-serif'; ctx.fillText('PVT', 410, 190);
                    ctx.beginPath(); ctx.moveTo(316, 136); ctx.lineTo(450, 136); ctx.lineTo(502, 170); ctx.lineTo(590, 170); ctx.stroke();
                } else {
                    ctx.strokeRect(90, 84, 58, 30); ctx.strokeRect(200, 106, 50, 28); ctx.strokeRect(328, 72, 54, 28);
                    ctx.strokeRect(438, 118, 94, 58);
                    ctx.beginPath(); ctx.moveTo(462, 132); ctx.lineTo(510, 132); ctx.moveTo(462, 150); ctx.lineTo(510, 150); ctx.stroke();
                }
            });
        }

        function waferTexture() {
            return textureCanvas(820, 820, function (ctx, w, h) {
                var grad = ctx.createLinearGradient(0, 0, w, h);
                grad.addColorStop(0, '#fff0bc');
                grad.addColorStop(0.32, '#c9f3df');
                grad.addColorStop(0.62, '#9fd5ff');
                grad.addColorStop(1, '#f1c5f8');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
                ctx.globalAlpha = 0.72;
                ctx.strokeStyle = '#2e78ff';
                ctx.lineWidth = 5;
                for (var x = -120; x < w + 120; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
                for (var y = -120; y < h + 120; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
                ctx.strokeStyle = '#bd7cff';
                ctx.lineWidth = 4;
                for (var d = -w; d < w * 2; d += 155) { ctx.beginPath(); ctx.moveTo(d, h); ctx.lineTo(d + w, 0); ctx.stroke(); }
            });
        }

        function dieTexture() {
            return textureCanvas(540, 430, function (ctx, w, h) {
                var grad = ctx.createLinearGradient(0, 0, w, h);
                grad.addColorStop(0, '#2fd8ff');
                grad.addColorStop(0.44, '#6468ff');
                grad.addColorStop(1, '#ff5ce4');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
                ctx.strokeStyle = 'rgba(7,23,51,0.78)';
                ctx.lineWidth = 7;
                for (var x = 0; x < w; x += 58) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
                for (var y = 0; y < h; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
                ctx.fillStyle = 'rgba(142,232,255,0.5)';
                [[72, 58, 135, 70], [218, 82, 168, 84], [104, 224, 158, 86], [310, 234, 148, 82]].forEach(function (r) { ctx.fillRect(r[0], r[1], r[2], r[3]); });
            });
        }

        function addPlate(group, cfg) {
            var body = new THREE.Mesh(
                new THREE.BoxGeometry(3.3, 0.08, 1.32),
                new THREE.MeshPhysicalMaterial({ color: cfg.fill, transparent: true, opacity: 0.67, roughness: 0.42, metalness: 0.03, clearcoat: 0.36, clearcoatRoughness: 0.36 })
            );
            body.castShadow = true;
            body.receiveShadow = true;
            body.position.set(cfg.x, cfg.y, -0.08);
            group.add(body);

            var top = new THREE.Mesh(
                new THREE.PlaneGeometry(3.28, 1.3),
                new THREE.MeshBasicMaterial({ map: layerTexture(cfg.stroke, cfg.kind), transparent: true, opacity: 0.92, depthWrite: false })
            );
            top.rotation.x = -Math.PI / 2;
            top.position.set(cfg.x, cfg.y + 0.047, -0.08);
            group.add(top);

            var edge = new THREE.LineSegments(
                new THREE.EdgesGeometry(body.geometry),
                new THREE.LineBasicMaterial({ color: cfg.stroke, transparent: true, opacity: 0.94 })
            );
            edge.position.copy(body.position);
            group.add(edge);
            return body;
        }

        var layerGroup = new THREE.Group();
        layerGroup.position.set(-1.32, 0.14, 0);
        world.add(layerGroup);
        var layerTopY = 2.62;
        var layerGapY = 0.72;
        var defs = [
            ['#dbeaff', '#1157ff', 'rules'],
            ['#c9f4df', '#0aa66a', 'models'],
            ['#dacaff', '#6933ff', 'cells'],
            ['#c8f0fa', '#0c99bc', 'abstracts'],
            ['#ffd9af', '#ff7900', 'routing'],
            ['#dbeaff', '#1157ff', 'extraction'],
            ['#fbd0e5', '#d3217a', 'timing'],
            ['#dfe7f1', '#263d70', 'signoff']
        ];
        var layers = [];
        defs.forEach(function (def, i) {
            layers.push(addPlate(layerGroup, { fill: def[0], stroke: def[1], kind: def[2], x: 0, y: layerTopY - i * layerGapY }));
        });

        [-1.25, 0, 1.25].forEach(function (x) {
            var line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, layerTopY + 0.36, -0.72), new THREE.Vector3(x, layerTopY - (defs.length - 1) * layerGapY - 0.32, -0.72)]),
                new THREE.LineDashedMaterial({ color: 0xb8c7d9, dashSize: 0.08, gapSize: 0.08, transparent: true, opacity: 0.75 })
            );
            line.computeLineDistances();
            layerGroup.add(line);
        });

        var waferGroup = new THREE.Group();
        waferGroup.position.set(1.9, -0.58, 0.12);
        world.add(waferGroup);

        var wafer = new THREE.Mesh(
            new THREE.CylinderGeometry(1.64, 1.64, 0.22, 128, 1, false),
            [
                new THREE.MeshPhysicalMaterial({ color: '#14243a', roughness: 0.5, metalness: 0.18 }),
                new THREE.MeshPhysicalMaterial({ map: waferTexture(), roughness: 0.38, metalness: 0.04, clearcoat: 0.45 }),
                new THREE.MeshPhysicalMaterial({ color: '#263d70', roughness: 0.5 })
            ]
        );
        wafer.scale.z = 0.58;
        wafer.castShadow = true;
        wafer.receiveShadow = true;
        waferGroup.add(wafer);

        var notch = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.18), new THREE.MeshPhysicalMaterial({ color: '#102238', roughness: 0.5 }));
        notch.position.set(1.39, 0.05, 0.52);
        notch.rotation.y = -0.72;
        waferGroup.add(notch);

        var chipGroup = new THREE.Group();
        chipGroup.position.set(1.94, 0.54, 0.02);
        world.add(chipGroup);

        var baseMat = new THREE.MeshPhysicalMaterial({ color: '#172a43', roughness: 0.42, metalness: 0.25, clearcoat: 0.12 });
        var substrate = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.25, 1.2), baseMat);
        substrate.castShadow = true;
        substrate.receiveShadow = true;
        chipGroup.add(substrate);

        var packageTop = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.08, 1.36), new THREE.MeshPhysicalMaterial({ color: '#263e5f', roughness: 0.4, metalness: 0.12 }));
        packageTop.position.y = 0.18;
        packageTop.castShadow = true;
        chipGroup.add(packageTop);

        var die = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.08, 0.86), new THREE.MeshPhysicalMaterial({ map: dieTexture(), roughness: 0.3, clearcoat: 0.5 }));
        die.position.y = 0.28;
        chipGroup.add(die);
        var dieEdge = new THREE.LineSegments(new THREE.EdgesGeometry(die.geometry), new THREE.LineBasicMaterial({ color: 0x97c9ff, transparent: true, opacity: 0.9 }));
        dieEdge.position.copy(die.position);
        chipGroup.add(dieEdge);

        var bumpMat = new THREE.MeshPhysicalMaterial({ color: '#f4cf77', roughness: 0.28, metalness: 0.55 });
        var bumpGeo = new THREE.SphereGeometry(0.035, 16, 10);
        for (var side = 0; side < 4; side++) {
            for (var b = 0; b < 9; b++) {
                var u = -0.69 + b * 0.17;
                var bump = new THREE.Mesh(bumpGeo, bumpMat);
                if (side < 2) bump.position.set(u, 0.28, side === 0 ? -0.64 : 0.64);
                else bump.position.set(side === 2 ? -0.78 : 0.78, 0.28, u);
                chipGroup.add(bump);
            }
        }

        var shadowGlass = new THREE.Mesh(
            new THREE.CylinderGeometry(1.22, 1.64, 0.95, 4, 1, true),
            new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })
        );
        shadowGlass.position.set(1.9, 0.02, 0.02);
        shadowGlass.rotation.y = Math.PI / 4;
        world.add(shadowGlass);

        var blueMat = new THREE.LineBasicMaterial({ color: 0x1157ff, transparent: true, opacity: 0.9 });
        world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.94, 1.12, 0.02), new THREE.Vector3(1.94, 1.8, 0.02)]), blueMat));
        world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.9, -1.2, 0.15), new THREE.Vector3(1.9, -1.95, 0.15)]), blueMat));

        var targetRot = { x: 0, y: -0.02 };
        root.addEventListener('pointermove', function (event) {
            var rect = root.getBoundingClientRect();
            targetRot.y = -0.02 + ((event.clientX - rect.left) / rect.width - 0.5) * 0.07;
            targetRot.x = ((event.clientY - rect.top) / rect.height - 0.5) * -0.035;
        });
        root.addEventListener('pointerleave', function () {
            targetRot.x = 0;
            targetRot.y = -0.02;
        });

        function resize() {
            var width = Math.max(1, root.clientWidth);
            var height = Math.max(1, root.clientHeight);
            renderer.setSize(width, height, false);
            var aspect = width / height;
            var view = aspect > 1 ? 7.45 : 8.65;
            camera.left = -view * aspect / 2;
            camera.right = view * aspect / 2;
            camera.top = view / 2;
            camera.bottom = -view / 2;
            camera.updateProjectionMatrix();
        }
        resize();
        var resizeObserver = new ResizeObserver(resize);


        var active = false, frame = 0;
        var clock = new THREE.Clock();
        function render() {
            frame = 0;
            if (!active) return;
            var t = clock.getElapsedTime();
            world.rotation.y += (targetRot.y - world.rotation.y) * 0.055;
            world.rotation.x += (targetRot.x - world.rotation.x) * 0.055;
            layers.forEach(function (layer, i) {
                layer.position.y = layerTopY - i * layerGapY + Math.sin(t * 0.72 + i * 0.58) * 0.01;
            });
            chipGroup.rotation.y = Math.sin(t * 0.42) * 0.02;
            renderer.render(scene, camera);
            frame = requestAnimationFrame(render);
        }

        return {
            start() { active = true; resize(); resizeObserver.observe(root); if (!frame) render(); },
            stop() { active = false; cancelAnimationFrame(frame); frame = 0; resizeObserver.disconnect(); },
            destroy() {
                this.stop();
                const geometries = new Set(), materials = new Set(), textures = new Set();
                scene.traverse(node => {
                    if (node.geometry) geometries.add(node.geometry);
                    if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(item => materials.add(item));
                });
                materials.forEach(item => {
                    Object.values(item).forEach(value => { if (value?.isTexture) textures.add(value); });
                    item.dispose();
                });
                geometries.forEach(item => item.dispose());
                textures.forEach(item => item.dispose());
                renderer.dispose();
                renderer.domElement.remove();
            },
        };
    }

    window.GuidebookPage.registerInitializer(bootPdk44Scenes);
}());
