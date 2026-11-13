(() => {
    function createMosBoxMesh(THREE, width, height, depth, options = {}) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: options.color ?? 0xffffff,
            emissive: options.emissive ?? 0x000000,
            emissiveIntensity: options.emissiveIntensity ?? 0,
            transparent: options.transparent ?? false,
            opacity: options.opacity ?? 1,
            depthWrite: options.depthWrite ?? true,
            side: options.side ?? THREE.FrontSide,
            metalness: options.metalness ?? 0.08,
            roughness: options.roughness ?? 0.42
        });
        return new THREE.Mesh(geometry, material);
    }

    function createMosSphereMesh(THREE, radius, options = {}) {
        const geometry = new THREE.SphereGeometry(radius, 18, 18);
        const material = new THREE.MeshStandardMaterial({
            color: options.color ?? 0xffffff,
            emissive: options.emissive ?? options.color ?? 0xffffff,
            emissiveIntensity: options.emissiveIntensity ?? 0.45,
            transparent: true,
            opacity: options.opacity ?? 0.9,
            roughness: 0.28,
            metalness: 0.02
        });
        return new THREE.Mesh(geometry, material);
    }

    function createMosWireBox(THREE, width, height, depth, options = {}) {
        const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
        const material = new THREE.LineBasicMaterial({
            color: options.color ?? 0x94a3b8,
            transparent: true,
            opacity: options.opacity ?? 0.55
        });
        return new THREE.LineSegments(geometry, material);
    }

    function buildPlanarTransistorModel(THREE) {
        const root = new THREE.Group();

        const substrate = createMosBoxMesh(THREE, 8.8, 2.2, 5.0, {
            color: 0x6b7280,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
            side: THREE.DoubleSide,
            roughness: 0.86
        });
        substrate.position.set(0, -1.1, 0);
        root.add(substrate);

        const substrateFrame = createMosWireBox(THREE, 8.8, 2.2, 5.0, { color: 0x64748b, opacity: 0.42 });
        substrateFrame.position.copy(substrate.position);
        root.add(substrateFrame);

        const substrateFloor = createMosBoxMesh(THREE, 8.6, 0.16, 4.8, {
            color: 0x4b5563,
            transparent: true,
            opacity: 0.34,
            depthWrite: false,
            roughness: 0.92
        });
        substrateFloor.position.set(0, -2.14, 0);
        root.add(substrateFloor);

        const oxide = createMosBoxMesh(THREE, 8.4, 0.44, 4.1, {
            color: 0xcfe8f6,
            emissive: 0xe0f2fe,
            emissiveIntensity: 0.06,
            transparent: true,
            opacity: 0.88,
            roughness: 0.24
        });
        oxide.position.set(0, 0.22, 0);
        root.add(oxide);

        const oxideFrame = createMosWireBox(THREE, 8.4, 0.44, 4.1, { color: 0x93c5fd, opacity: 0.42 });
        oxideFrame.position.copy(oxide.position);
        root.add(oxideFrame);

        const source = createMosBoxMesh(THREE, 2.25, 0.5, 1.54, {
            color: 0x4b5563,
            emissive: 0x64748b,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.78,
            roughness: 0.52
        });
        source.position.set(-2.55, -0.28, 0);
        root.add(source);

        const drain = createMosBoxMesh(THREE, 2.25, 0.5, 1.54, {
            color: 0x4b5563,
            emissive: 0x64748b,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.78,
            roughness: 0.52
        });
        drain.position.set(2.55, -0.28, 0);
        root.add(drain);

        const sourceFrame = createMosWireBox(THREE, 2.25, 0.5, 1.54, { color: 0x94a3b8, opacity: 0.36 });
        sourceFrame.position.copy(source.position);
        root.add(sourceFrame);

        const drainFrame = createMosWireBox(THREE, 2.25, 0.5, 1.54, { color: 0x94a3b8, opacity: 0.36 });
        drainFrame.position.copy(drain.position);
        root.add(drainFrame);

        const channelGuide = createMosBoxMesh(THREE, 4.0, 0.22, 0.82, {
            color: 0x7dd3fc,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.24,
            transparent: true,
            opacity: 0.24,
            depthWrite: false
        });
        channelGuide.position.set(0, -0.14, 0);
        root.add(channelGuide);

        const channel = createMosBoxMesh(THREE, 3.55, 0.12, 0.58, {
            color: 0x38bdf8,
            emissive: 0x2563eb,
            emissiveIntensity: 0.48,
            transparent: true,
            opacity: 0.94,
            depthWrite: false
        });
        channel.position.set(0, -0.16, 0);
        root.add(channel);

        const gateOxide = createMosBoxMesh(THREE, 3.18, 0.08, 1.86, {
            color: 0xfde68a,
            emissive: 0xfacc15,
            emissiveIntensity: 0.06,
            transparent: true,
            opacity: 0.74,
            roughness: 0.2
        });
        gateOxide.position.set(0, 0.48, 0);
        root.add(gateOxide);

        const gate = createMosBoxMesh(THREE, 3.35, 1.34, 2.1, {
            color: 0xfdba74,
            emissive: 0xfb923c,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.48,
            depthWrite: false,
            side: THREE.DoubleSide,
            metalness: 0.04,
            roughness: 0.48
        });
        gate.position.set(0, 1.15, 0);
        root.add(gate);

        const gateFrame = createMosWireBox(THREE, 3.35, 1.34, 2.1, { color: 0xfb923c, opacity: 0.62 });
        gateFrame.position.copy(gate.position);
        root.add(gateFrame);

        const gateContact = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.72, 18),
            new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.22, roughness: 0.32 })
        );
        gateContact.position.set(0, 2.04, 0);
        root.add(gateContact);

        const currentParticles = Array.from({ length: 5 }, (_, idx) => {
            const particle = createMosSphereMesh(THREE, 0.1, {
                color: idx % 2 ? 0x38bdf8 : 0x2563eb,
                emissive: 0x0ea5e9,
                opacity: 0.92
            });
            root.add(particle);
            return particle;
        });

        const leakageParticles = Array.from({ length: 3 }, () => {
            const particle = createMosSphereMesh(THREE, 0.085, {
                color: 0xfb7185,
                emissive: 0xef4444,
                opacity: 0.52
            });
            root.add(particle);
            return particle;
        });

        const glowPlate = createMosBoxMesh(THREE, 4.2, 0.05, 0.96, {
            color: 0x93c5fd,
            emissive: 0x2563eb,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.16,
            depthWrite: false
        });
        glowPlate.position.set(0, -0.16, 0);
        root.add(glowPlate);

        return {
            root,
            animate(time) {
                channel.material.emissiveIntensity = 0.36 + 0.22 * (0.5 + 0.5 * Math.sin(time * 2.4));
                channelGuide.material.opacity = 0.2 + 0.1 * (0.5 + 0.5 * Math.sin(time * 2.2));
                gate.material.emissiveIntensity = 0.08 + 0.05 * (0.5 + 0.5 * Math.sin(time * 1.9));
                glowPlate.material.opacity = 0.14 + 0.08 * (0.5 + 0.5 * Math.sin(time * 2.2));

                currentParticles.forEach((particle, idx) => {
                    const progress = (time * 0.3 + idx * 0.18) % 1;
                    particle.position.set(
                        -3.0 + progress * 6.0,
                        -0.16 + Math.sin(time * 3.0 + idx) * 0.02,
                        Math.sin(progress * Math.PI * 2 + idx) * 0.08
                    );
                    particle.material.opacity = 0.3 + 0.65 * Math.sin(progress * Math.PI);
                });

                leakageParticles.forEach((particle, idx) => {
                    const progress = (time * 0.22 + idx * 0.31) % 1;
                    particle.position.set(
                        -1.55 + progress * 3.1,
                        -0.18 + Math.sin(progress * Math.PI) * 0.34,
                        idx === 1 ? 0 : idx === 0 ? 0.88 : -0.88
                    );
                    particle.material.opacity = 0.18 + 0.45 * Math.sin(progress * Math.PI);
                });
            }
        };
    }

    function buildFinfetTransistorModel(THREE) {
        const root = new THREE.Group();

        const substrate = createMosBoxMesh(THREE, 8.8, 2.2, 5.0, {
            color: 0x6b7280,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
            side: THREE.DoubleSide,
            roughness: 0.86
        });
        substrate.position.set(0, -1.1, 0);
        root.add(substrate);

        const substrateFrame = createMosWireBox(THREE, 8.8, 2.2, 5.0, { color: 0x64748b, opacity: 0.42 });
        substrateFrame.position.copy(substrate.position);
        root.add(substrateFrame);

        const substrateFloor = createMosBoxMesh(THREE, 8.6, 0.16, 4.8, {
            color: 0x4b5563,
            transparent: true,
            opacity: 0.34,
            depthWrite: false,
            roughness: 0.92
        });
        substrateFloor.position.set(0, -2.14, 0);
        root.add(substrateFloor);

        const oxide = createMosBoxMesh(THREE, 8.4, 0.42, 4.1, {
            color: 0xcfe8f6,
            emissive: 0xe0f2fe,
            emissiveIntensity: 0.06,
            transparent: true,
            opacity: 0.88,
            roughness: 0.24
        });
        oxide.position.set(0, 0.21, 0);
        root.add(oxide);

        const oxideFrame = createMosWireBox(THREE, 8.4, 0.42, 4.1, { color: 0x93c5fd, opacity: 0.42 });
        oxideFrame.position.copy(oxide.position);
        root.add(oxideFrame);

        const fin = createMosBoxMesh(THREE, 5.45, 1.82, 0.78, {
            color: 0x4b5563,
            emissive: 0x64748b,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.82,
            roughness: 0.48
        });
        fin.position.set(0, 0.56, 0);
        root.add(fin);

        const finFrame = createMosWireBox(THREE, 5.45, 1.82, 0.78, { color: 0x94a3b8, opacity: 0.36 });
        finFrame.position.copy(fin.position);
        root.add(finFrame);

        const source = createMosBoxMesh(THREE, 1.6, 1.08, 0.7, {
            color: 0x374151,
            emissive: 0x475569,
            emissiveIntensity: 0.14,
            transparent: true,
            opacity: 0.88,
            roughness: 0.44
        });
        source.position.set(-1.95, 0.42, 0);
        root.add(source);

        const drain = createMosBoxMesh(THREE, 1.6, 1.08, 0.7, {
            color: 0x374151,
            emissive: 0x475569,
            emissiveIntensity: 0.14,
            transparent: true,
            opacity: 0.88,
            roughness: 0.44
        });
        drain.position.set(1.95, 0.42, 0);
        root.add(drain);

        const channelGuide = createMosBoxMesh(THREE, 1.72, 1.04, 0.54, {
            color: 0x7dd3fc,
            emissive: 0x22c55e,
            emissiveIntensity: 0.24,
            transparent: true,
            opacity: 0.2,
            depthWrite: false
        });
        channelGuide.position.set(0, 0.52, 0);
        root.add(channelGuide);

        const channel = createMosBoxMesh(THREE, 1.46, 0.98, 0.42, {
            color: 0x4ade80,
            emissive: 0x16a34a,
            emissiveIntensity: 0.38,
            transparent: true,
            opacity: 0.92,
            depthWrite: false
        });
        channel.position.set(0, 0.52, 0);
        root.add(channel);

        const oxideTop = createMosBoxMesh(THREE, 2.1, 0.08, 1.1, {
            color: 0xfde68a,
            emissive: 0xfacc15,
            emissiveIntensity: 0.06,
            transparent: true,
            opacity: 0.76,
            roughness: 0.22
        });
        oxideTop.position.set(0, 1.51, 0);
        root.add(oxideTop);

        const oxideFront = createMosBoxMesh(THREE, 2.1, 1.04, 0.08, {
            color: 0xfde68a,
            emissive: 0xfacc15,
            emissiveIntensity: 0.06,
            transparent: true,
            opacity: 0.72,
            roughness: 0.22
        });
        oxideFront.position.set(0, 0.94, 0.43);
        root.add(oxideFront);

        const oxideBack = createMosBoxMesh(THREE, 2.1, 1.04, 0.08, {
            color: 0xfde68a,
            emissive: 0xfacc15,
            emissiveIntensity: 0.06,
            transparent: true,
            opacity: 0.72,
            roughness: 0.22
        });
        oxideBack.position.set(0, 0.94, -0.43);
        root.add(oxideBack);

        const gateTop = createMosBoxMesh(THREE, 2.34, 0.42, 1.58, {
            color: 0xfdba74,
            emissive: 0xfb923c,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.48,
            depthWrite: false,
            side: THREE.DoubleSide,
            metalness: 0.04,
            roughness: 0.46
        });
        gateTop.position.set(0, 1.78, 0);
        root.add(gateTop);

        const gateFront = createMosBoxMesh(THREE, 2.34, 1.12, 0.18, {
            color: 0xfdba74,
            emissive: 0xfb923c,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.46,
            depthWrite: false,
            side: THREE.DoubleSide,
            metalness: 0.04,
            roughness: 0.46
        });
        gateFront.position.set(0, 1.12, 0.62);
        root.add(gateFront);

        const gateBack = createMosBoxMesh(THREE, 2.34, 1.12, 0.18, {
            color: 0xfdba74,
            emissive: 0xfb923c,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.46,
            depthWrite: false,
            side: THREE.DoubleSide,
            metalness: 0.04,
            roughness: 0.46
        });
        gateBack.position.set(0, 1.12, -0.62);
        root.add(gateBack);

        const gateFrameTop = createMosWireBox(THREE, 2.34, 0.42, 1.58, { color: 0xfb923c, opacity: 0.62 });
        gateFrameTop.position.copy(gateTop.position);
        root.add(gateFrameTop);

        const gateFrameFront = createMosWireBox(THREE, 2.34, 1.12, 0.18, { color: 0xfb923c, opacity: 0.5 });
        gateFrameFront.position.copy(gateFront.position);
        root.add(gateFrameFront);

        const gateFrameBack = createMosWireBox(THREE, 2.34, 1.12, 0.18, { color: 0xfb923c, opacity: 0.5 });
        gateFrameBack.position.copy(gateBack.position);
        root.add(gateFrameBack);

        const gateContact = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.72, 18),
            new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.24, roughness: 0.32 })
        );
        gateContact.position.set(0, 2.42, 0);
        root.add(gateContact);

        const currentParticles = Array.from({ length: 5 }, (_, idx) => {
            const particle = createMosSphereMesh(THREE, 0.1, {
                color: idx % 2 ? 0x22c55e : 0x38bdf8,
                emissive: 0x16a34a,
                opacity: 0.9
            });
            root.add(particle);
            return particle;
        });

        const wrapFieldParticles = Array.from({ length: 4 }, (_, idx) => {
            const particle = createMosSphereMesh(THREE, 0.08, {
                color: idx % 2 ? 0xfcd34d : 0xfb923c,
                emissive: 0xf59e0b,
                opacity: 0.78
            });
            root.add(particle);
            return particle;
        });

        return {
            root,
            animate(time) {
                channel.material.emissiveIntensity = 0.32 + 0.28 * (0.5 + 0.5 * Math.sin(time * 2.9));
                channelGuide.material.opacity = 0.18 + 0.08 * (0.5 + 0.5 * Math.sin(time * 2.4));
                gateTop.material.emissiveIntensity = 0.08 + 0.06 * (0.5 + 0.5 * Math.sin(time * 2.1));
                gateFront.material.emissiveIntensity = gateTop.material.emissiveIntensity;
                gateBack.material.emissiveIntensity = gateTop.material.emissiveIntensity;

                currentParticles.forEach((particle, idx) => {
                    const progress = (time * 0.36 + idx * 0.18) % 1;
                    particle.position.set(
                        -2.5 + progress * 5.0,
                        0.52 + Math.sin(time * 3.3 + idx) * 0.02,
                        Math.sin(progress * Math.PI * 2 + idx) * 0.05
                    );
                    particle.material.opacity = 0.35 + 0.55 * Math.sin(progress * Math.PI);
                });

                wrapFieldParticles.forEach((particle, idx) => {
                    const progress = (time * 0.26 + idx * 0.25) % 1;
                    if (progress < 0.33) {
                        const local = progress / 0.33;
                        particle.position.set(-0.88 + local * 1.76, 1.78, 0.78);
                    } else if (progress < 0.66) {
                        const local = (progress - 0.33) / 0.33;
                        particle.position.set(0.88, 1.78 - local * 1.1, 0.78 - local * 1.56);
                    } else {
                        const local = (progress - 0.66) / 0.34;
                        particle.position.set(0.88 - local * 1.76, 0.68 + local * 1.1, -0.78);
                    }
                    particle.material.opacity = 0.28 + 0.5 * Math.sin(progress * Math.PI);
                });
            }
        };
    }

    function createTransistorViewer(container) {
            container.dataset.viewerReady = 'true';
            container.style.touchAction = 'none';

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
            camera.position.set(0, 1.6, 9.6);
            camera.lookAt(0, 0.22, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
                renderer.outputColorSpace = THREE.SRGBColorSpace;
            }
            renderer.domElement.setAttribute('aria-hidden', 'true');
            container.appendChild(renderer.domElement);

            const fallback = container.querySelector('.transistor-3d-fallback');
            if (fallback) fallback.style.display = 'none';

            const ambient = new THREE.AmbientLight(0xffffff, 1.55);
            scene.add(ambient);

            const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
            keyLight.position.set(5, 8, 6);
            scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.62);
            fillLight.position.set(-6, 4, -4);
            scene.add(fillLight);

            const rimLight = new THREE.DirectionalLight(0xa7f3d0, 0.42);
            rimLight.position.set(4, 3, -6);
            scene.add(rimLight);

            const orbit = new THREE.Group();
            scene.add(orbit);

            const model = container.dataset.transistorViewer === 'finfet'
                ? buildFinfetTransistorModel(THREE)
                : buildPlanarTransistorModel(THREE);

            orbit.add(model.root);

            let rotateX = container.dataset.transistorViewer === 'finfet' ? -0.12 : -0.16;
            let rotateY = container.dataset.transistorViewer === 'finfet' ? -0.68 : 0.62;
            let startRotateX = rotateX;
            let startRotateY = rotateY;
            let startPointerX = 0;
            let startPointerY = 0;
            let isDragging = false;
            let lastInteraction = performance.now();
            let lastWidth = 0;
            let lastHeight = 0;
            const autoSpin = container.dataset.transistorViewer === 'finfet' ? -0.0032 : 0.003;

            const renderOrbit = () => {
                orbit.rotation.x = rotateX;
                orbit.rotation.y = rotateY;
            };

            renderOrbit();

            const startDrag = (event) => {
                isDragging = true;
                if (typeof container.focus === 'function') {
                    container.focus({ preventScroll: true });
                }
                container.classList.add('is-dragging');
                startPointerX = event.clientX;
                startPointerY = event.clientY;
                startRotateX = rotateX;
                startRotateY = rotateY;
                lastInteraction = performance.now();
            };

            const dragMove = (event) => {
                if (!isDragging) return;
                const deltaX = event.clientX - startPointerX;
                const deltaY = event.clientY - startPointerY;
                rotateY = startRotateY + deltaX * 0.01;
                rotateX = THREE.MathUtils.clamp(startRotateX + deltaY * 0.008, -1.0, 0.18);
                lastInteraction = performance.now();
                renderOrbit();
            };

            const endDrag = () => {
                if (!isDragging) return;
                isDragging = false;
                container.classList.remove('is-dragging');
                lastInteraction = performance.now();
            };

            const keyRotate = (event) => {
                const stepX = 0.06;
                const stepY = 0.08;
                const key = event.key.toLowerCase();
                let handled = true;

                if (key === 'a') {
                    rotateY -= stepY;
                } else if (key === 'd') {
                    rotateY += stepY;
                } else if (key === 'w') {
                    rotateX = THREE.MathUtils.clamp(rotateX - stepX, -0.95, 0.35);
                } else if (key === 's') {
                    rotateX = THREE.MathUtils.clamp(rotateX + stepX, -0.95, 0.35);
                } else {
                    handled = false;
                }

                if (!handled) return;
                event.preventDefault();
                event.stopPropagation();
                lastInteraction = performance.now();
                renderOrbit();
            };

            renderer.domElement.addEventListener('pointerdown', startDrag);
            container.addEventListener('pointerdown', () => {
                if (typeof container.focus === 'function') {
                    container.focus({ preventScroll: true });
                }
            });
            container.addEventListener('keydown', keyRotate);
            window.addEventListener('pointermove', dragMove);
            window.addEventListener('pointerup', endDrag);
            window.addEventListener('pointercancel', endDrag);

            let running = false;
            let raf = 0;
            const animate = (time) => {
                raf = 0;
                if (!running) return;
                const width = Math.max(container.clientWidth, 10);
                const height = Math.max(container.clientHeight, 10);

                if (width !== lastWidth || height !== lastHeight) {
                    renderer.setSize(width, height, false);
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                    lastWidth = width;
                    lastHeight = height;
                }

                if (!isDragging && time - lastInteraction > 1200) {
                    rotateY += autoSpin;
                }

                model.animate(time * 0.001);
                renderOrbit();
                renderer.render(scene, camera);
                raf = window.requestAnimationFrame(animate);
            };

            return {
                start() { running = true; if (!raf) raf = window.requestAnimationFrame(animate); },
                stop() { running = false; window.cancelAnimationFrame(raf); raf = 0; isDragging = false; },
                destroy() {
                    this.stop();
                    window.removeEventListener('pointermove', dragMove);
                    window.removeEventListener('pointerup', endDrag);
                    window.removeEventListener('pointercancel', endDrag);
                    container.removeEventListener('keydown', keyRotate);
                    const geometries = new Set();
                    const materials = new Set();
                    scene.traverse(node => {
                        if (node.geometry) geometries.add(node.geometry);
                        if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(item => materials.add(item));
                    });
                    geometries.forEach(item => item.dispose());
                    materials.forEach(item => item.dispose());
                    renderer.dispose();
                    renderer.domElement.remove();
                },
            };
    }

    function initTransistor3DViewers() {
        if (typeof THREE === 'undefined') return;
        document.querySelectorAll('[data-transistor-viewer]').forEach(container => {
            window.GuidebookPage.registerViewportFeature(container, createTransistorViewer);
        });
    }

    window.GuidebookPage.registerInitializer(() => {
        initTransistor3DViewers();
    });
})();
