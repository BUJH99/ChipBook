(() => {
    function createSsdViewer(canvas) {
            canvas.dataset.ssdThreeReady = 'true';
            const wrap = canvas.closest('.ssd-three-wrap');
            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

            const camera = new THREE.OrthographicCamera(-3, 3, 1.8, -1.8, 0.1, 100);
            camera.position.set(2.8, 1.6, 4.2);
            camera.lookAt(0, 0, 0);

            const light = new THREE.DirectionalLight(0xffffff, 2.2);
            light.position.set(2, 3, 4);
            scene.add(light);
            scene.add(new THREE.AmbientLight(0xffffff, 1.5));

            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 512;
            labelCanvas.height = 256;
            const ctx = labelCanvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 512, 256);
            grad.addColorStop(0, '#1f2937');
            grad.addColorStop(1, '#020617');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 256);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 8;
            ctx.strokeRect(10, 10, 492, 236);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 84px Pretendard, Arial, sans-serif';
            ctx.fillText('SSD', 64, 145);
            ctx.beginPath();
            ctx.arc(438, 134, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#2563eb';
            ctx.fill();

            const frontTexture = new THREE.CanvasTexture(labelCanvas);
            if ('colorSpace' in frontTexture && THREE.SRGBColorSpace) {
                frontTexture.colorSpace = THREE.SRGBColorSpace;
            }

            const side = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.55, metalness: 0.15 });
            const top = new THREE.MeshStandardMaterial({ color: 0x273449, roughness: 0.45, metalness: 0.18 });
            const front = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.48, metalness: 0.08 });
            const ssd = new THREE.Mesh(new THREE.BoxGeometry(3.65, 1.45, 0.32), [side, side, top, side, front, side]);
            ssd.rotation.x = -0.05;
            ssd.rotation.y = -0.18;
            scene.add(ssd);

            const edge = new THREE.LineSegments(
                new THREE.EdgesGeometry(ssd.geometry),
                new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.65 })
            );
            edge.rotation.copy(ssd.rotation);
            scene.add(edge);

            let active = false, frame = 0, lastWidth = 0, lastHeight = 0;
            const render = () => {
                frame = 0;
                if (!active) return;
                const rect = canvas.getBoundingClientRect();
                const width = Math.max(1, Math.floor(rect.width));
                const height = Math.max(1, Math.floor(rect.height));
                if (width !== lastWidth || height !== lastHeight) {
                    renderer.setSize(width, height, false);
                    lastWidth = width; lastHeight = height;
                }
                ssd.rotation.y = -0.18 + Math.sin(Date.now() / 1700) * 0.018;
                edge.rotation.copy(ssd.rotation);
                renderer.render(scene, camera);
                wrap?.classList.add('is-rendered');
                frame = requestAnimationFrame(render);
            };

            return {
                start() { active = true; if (!frame) render(); },
                stop() { active = false; cancelAnimationFrame(frame); frame = 0; },
                destroy() {
                    this.stop();
                    frontTexture.dispose();
                    ssd.geometry.dispose();
                    edge.geometry.dispose();
                    [side, top, front, edge.material].forEach(material => material.dispose());
                    renderer.dispose();
                },
            };
    }
    window.GuidebookPage.registerInitializer(() => {
        if (!window.THREE) return;
        document.querySelectorAll('[data-ssd-three]').forEach(canvas => {
            window.GuidebookPage.registerViewportFeature(canvas, createSsdViewer);
        });
    });
})();
