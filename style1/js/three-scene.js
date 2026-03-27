/* ============================================
   APECLUB — STYLE 1: NEON LOUNGE
   Cyberpunk club — chill, cozy, elegant
   Bokeh lights · Dust motes · Light beams ·
   Reflective floor · Volumetric fog
   ============================================ */

const ApeScene = (() => {
    let scene, camera, renderer, clock;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let isMobile = false;
    let isReducedMotion = false;
    let animationId = null;

    // Scene groups
    let bokehGroup, dustGroup, beamGroup, fogGroup, geometryGroup, floorMesh;

    // ── CONFIG ──────────────────────────────────
    const CONFIG = {
        bokeh: {
            count: 35,
            countMobile: 15,
            minSize: 0.3,
            maxSize: 1.8,
            spread: { x: 14, y: 8, z: 10 },
            driftSpeed: 0.08,
            pulseSpeed: 0.4
        },
        dust: {
            count: 600,
            countMobile: 200,
            spread: { x: 16, y: 12, z: 14 },
            riseSpeed: 0.12,
            sway: 0.02
        },
        beams: {
            count: 5,
            countMobile: 3,
            width: 0.4,
            height: 18,
            opacity: 0.04
        },
        fog: {
            layers: 4,
            layersMobile: 2,
            opacity: 0.06,
            driftSpeed: 0.03
        },
        geometry: {
            type: 'torusKnot', // torusKnot, icosahedron, octahedron
            opacity: 0.04,
            breatheSpeed: 0.3,
            rotateSpeed: 0.02
        }
    };

    // ── PALETTE ─────────────────────────────────
    const COLORS = {
        purple: new THREE.Color(0x9b4dff),
        pink:   new THREE.Color(0xff2d95),
        cyan:   new THREE.Color(0x00f0ff),
        gold:   new THREE.Color(0xffd700),
        warm:   new THREE.Color(0xff6b35),
        white:  new THREE.Color(0xffffff)
    };
    const COLOR_POOL = [COLORS.purple, COLORS.pink, COLORS.cyan, COLORS.gold];

    function pickColor() {
        return COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)].clone();
    }

    // ── INIT ────────────────────────────────────
    function init() {
        isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isReducedMotion) return;

        isMobile = window.innerWidth < 768;
        const canvas = document.getElementById('three-canvas');
        if (!canvas) return;

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a0f, 0.045);

        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 1, 14);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !isMobile,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        clock = new THREE.Clock();

        createBokeh();
        createDust();
        createLightBeams();
        createFogLayers();
        createGeometry();
        createReflectiveFloor();

        addEventListeners();
        animate();
    }

    // ── BOKEH LIGHTS ────────────────────────────
    // Large, soft, out-of-focus circles that float gently
    function createBokeh() {
        bokehGroup = new THREE.Group();
        const count = isMobile ? CONFIG.bokeh.countMobile : CONFIG.bokeh.count;

        const bokehData = [];

        for (let i = 0; i < count; i++) {
            const color = pickColor();
            const size = CONFIG.bokeh.minSize + Math.random() * (CONFIG.bokeh.maxSize - CONFIG.bokeh.minSize);

            const geo = new THREE.PlaneGeometry(size, size);
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uColor: { value: color },
                    uOpacity: { value: 0.04 + Math.random() * 0.08 },
                    uTime: { value: Math.random() * 100 },
                    uPulseOffset: { value: Math.random() * Math.PI * 2 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 uColor;
                    uniform float uOpacity;
                    uniform float uTime;
                    uniform float uPulseOffset;
                    varying vec2 vUv;

                    void main() {
                        vec2 center = vUv - 0.5;
                        float dist = length(center);

                        // Soft circular falloff (bokeh shape)
                        float circle = 1.0 - smoothstep(0.0, 0.5, dist);
                        // Extra soft glow ring
                        float ring = smoothstep(0.25, 0.35, dist) * (1.0 - smoothstep(0.35, 0.5, dist));

                        float alpha = (circle * 0.7 + ring * 0.3) * uOpacity;

                        // Gentle pulse
                        alpha *= 0.7 + 0.3 * sin(uTime * 0.4 + uPulseOffset);

                        gl_FragColor = vec4(uColor, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geo, mat);
            const sp = CONFIG.bokeh.spread;
            mesh.position.set(
                (Math.random() - 0.5) * sp.x,
                (Math.random() - 0.5) * sp.y + 1,
                (Math.random() - 0.5) * sp.z - 2
            );

            // Always face camera
            mesh.lookAt(camera.position);

            // Store drift data
            mesh.userData = {
                basePos: mesh.position.clone(),
                driftPhase: Math.random() * Math.PI * 2,
                driftAmp: 0.2 + Math.random() * 0.5,
                driftSpeed: 0.02 + Math.random() * CONFIG.bokeh.driftSpeed
            };

            bokehGroup.add(mesh);
            bokehData.push(mesh);
        }

        scene.add(bokehGroup);
    }

    // ── DUST MOTES / EMBERS ─────────────────────
    // Tiny particles that rise slowly, like illuminated dust in a dark club
    function createDust() {
        const count = isMobile ? CONFIG.dust.countMobile : CONFIG.dust.count;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const sp = CONFIG.dust.spread;
            positions[i3]     = (Math.random() - 0.5) * sp.x;
            positions[i3 + 1] = (Math.random() - 0.5) * sp.y;
            positions[i3 + 2] = (Math.random() - 0.5) * sp.z;

            // Warm color tint — mostly white/gold with occasional color
            const t = Math.random();
            let color;
            if (t < 0.6) {
                color = new THREE.Color().lerpColors(COLORS.white, COLORS.gold, Math.random() * 0.3);
            } else {
                color = pickColor();
            }

            colors[i3]     = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            sizes[i] = 0.4 + Math.random() * 1.2;
            phases[i] = Math.random() * Math.PI * 2;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                attribute float phase;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uTime;
                uniform float uPixelRatio;

                void main() {
                    vColor = color;

                    vec3 pos = position;

                    // Slow rise
                    float riseSpeed = 0.12;
                    float spread_y = 12.0;
                    pos.y = mod(pos.y + uTime * riseSpeed + phase * spread_y, spread_y) - spread_y * 0.5;

                    // Gentle sway
                    pos.x += sin(uTime * 0.15 + phase * 6.28) * 0.3;
                    pos.z += cos(uTime * 0.12 + phase * 4.0) * 0.2;

                    // Twinkle
                    vAlpha = 0.15 + 0.15 * sin(uTime * 0.8 + phase * 20.0);

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * uPixelRatio * (50.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;

                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    alpha *= vAlpha;

                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        dustGroup = new THREE.Points(geo, mat);
        scene.add(dustGroup);
    }

    // ── LIGHT BEAMS ─────────────────────────────
    // Diagonal/vertical neon rays penetrating the scene like club lights through haze
    function createLightBeams() {
        beamGroup = new THREE.Group();
        const count = isMobile ? CONFIG.beams.countMobile : CONFIG.beams.count;

        for (let i = 0; i < count; i++) {
            const color = pickColor();
            const w = CONFIG.beams.width * (0.5 + Math.random() * 0.8);
            const h = CONFIG.beams.height;

            const geo = new THREE.PlaneGeometry(w, h);
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uColor: { value: color },
                    uOpacity: { value: CONFIG.beams.opacity * (0.6 + Math.random() * 0.8) },
                    uTime: { value: Math.random() * 100 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 uColor;
                    uniform float uOpacity;
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        // Horizontal falloff (beam center is brightest)
                        float xFade = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
                        // Vertical fade — brighter at top, fades toward bottom
                        float yFade = pow(1.0 - vUv.y, 0.6);

                        float alpha = xFade * yFade * uOpacity;

                        // Slow flicker
                        alpha *= 0.8 + 0.2 * sin(uTime * 0.3 + vUv.y * 3.0);

                        gl_FragColor = vec4(uColor, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geo, mat);

            // Position beams spread across the scene, tilted
            const xSpread = 20;
            mesh.position.set(
                (Math.random() - 0.5) * xSpread,
                4 + Math.random() * 2,
                -3 - Math.random() * 6
            );

            // Tilt slightly
            mesh.rotation.z = (Math.random() - 0.5) * 0.4;
            mesh.rotation.y = (Math.random() - 0.5) * 0.3;

            mesh.userData = {
                flickerPhase: Math.random() * Math.PI * 2,
                swaySpeed: 0.005 + Math.random() * 0.01
            };

            beamGroup.add(mesh);
        }

        scene.add(beamGroup);
    }

    // ── VOLUMETRIC FOG LAYERS ───────────────────
    // Horizontal planes with gradient opacity, slowly drifting
    function createFogLayers() {
        fogGroup = new THREE.Group();
        const count = isMobile ? CONFIG.fog.layersMobile : CONFIG.fog.layers;

        for (let i = 0; i < count; i++) {
            const geo = new THREE.PlaneGeometry(30, 30);
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uColor: { value: new THREE.Color(0x0a0a0f) },
                    uAccent: { value: pickColor() },
                    uOpacity: { value: CONFIG.fog.opacity * (0.5 + Math.random() * 1.0) },
                    uTime: { value: Math.random() * 100 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 uColor;
                    uniform vec3 uAccent;
                    uniform float uOpacity;
                    uniform float uTime;
                    varying vec2 vUv;

                    // Simple noise
                    float hash(vec2 p) {
                        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                    }
                    float noise(vec2 p) {
                        vec2 i = floor(p);
                        vec2 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        float a = hash(i);
                        float b = hash(i + vec2(1.0, 0.0));
                        float c = hash(i + vec2(0.0, 1.0));
                        float d = hash(i + vec2(1.0, 1.0));
                        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                    }

                    void main() {
                        vec2 uv = vUv;

                        // Slow drift
                        uv.x += uTime * 0.01;

                        float n = noise(uv * 3.0 + uTime * 0.02);
                        n = n * 0.5 + 0.5;

                        // Radial fade from center
                        float radial = 1.0 - length(vUv - 0.5) * 1.6;
                        radial = max(radial, 0.0);

                        vec3 col = mix(uColor, uAccent, n * 0.15);
                        float alpha = n * radial * uOpacity;

                        gl_FragColor = vec4(col, alpha);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geo, mat);
            // Place horizontally at different heights
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = -2 + i * 2.5 + Math.random();
            mesh.position.z = -2;

            mesh.userData = {
                driftPhase: Math.random() * Math.PI * 2
            };

            fogGroup.add(mesh);
        }

        scene.add(fogGroup);
    }

    // ── ELEGANT GEOMETRY ────────────────────────
    // Slowly breathing wireframe shape — the club's "centerpiece"
    function createGeometry() {
        if (isMobile) return;

        geometryGroup = new THREE.Group();

        let geo;
        switch (CONFIG.geometry.type) {
            case 'torusKnot':
                geo = new THREE.TorusKnotGeometry(2, 0.5, 100, 16, 2, 3);
                break;
            case 'octahedron':
                geo = new THREE.OctahedronGeometry(2.5, 1);
                break;
            default:
                geo = new THREE.IcosahedronGeometry(2.5, 1);
        }

        const mat = new THREE.MeshBasicMaterial({
            color: COLORS.purple,
            wireframe: true,
            transparent: true,
            opacity: CONFIG.geometry.opacity
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0.5, -3);
        geometryGroup.add(mesh);

        // Second inner geometry for depth
        const geo2 = new THREE.IcosahedronGeometry(1.5, 0);
        const mat2 = new THREE.MeshBasicMaterial({
            color: COLORS.cyan,
            wireframe: true,
            transparent: true,
            opacity: CONFIG.geometry.opacity * 0.5
        });
        const mesh2 = new THREE.Mesh(geo2, mat2);
        mesh2.position.set(0, 0.5, -3);
        geometryGroup.add(mesh2);

        scene.add(geometryGroup);
    }

    // ── REFLECTIVE FLOOR ────────────────────────
    // Subtle mirror plane that catches light from above
    function createReflectiveFloor() {
        const geo = new THREE.PlaneGeometry(40, 40);
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(0x0a0a0f) },
                uAccent: { value: COLORS.purple.clone() },
                uReflectivity: { value: 0.08 },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPos;
                void main() {
                    vUv = uv;
                    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform vec3 uAccent;
                uniform float uReflectivity;
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vWorldPos;

                float hash(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
                }

                void main() {
                    // Distance from center fade
                    float dist = length(vUv - 0.5) * 2.0;
                    float fade = 1.0 - smoothstep(0.0, 0.8, dist);

                    // Subtle specular-like highlights
                    float spec = hash(floor(vUv * 20.0) + floor(uTime * 0.5));
                    spec = pow(spec, 8.0) * 0.3;

                    vec3 col = mix(uColor, uAccent, fade * uReflectivity + spec * 0.1);
                    float alpha = fade * uReflectivity * 0.6 + spec * 0.02;

                    gl_FragColor = vec4(col, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        floorMesh = new THREE.Mesh(geo, mat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = -4;
        scene.add(floorMesh);
    }

    // ── ANIMATE ─────────────────────────────────
    function animate() {
        animationId = requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();

        // Smooth mouse follow
        mouse.x += (mouse.targetX - mouse.x) * 0.03;
        mouse.y += (mouse.targetY - mouse.y) * 0.03;

        // ── Bokeh drift ──
        if (bokehGroup) {
            bokehGroup.children.forEach(mesh => {
                const d = mesh.userData;
                mesh.position.x = d.basePos.x + Math.sin(elapsed * d.driftSpeed + d.driftPhase) * d.driftAmp;
                mesh.position.y = d.basePos.y + Math.cos(elapsed * d.driftSpeed * 0.7 + d.driftPhase) * d.driftAmp * 0.5;

                mesh.material.uniforms.uTime.value = elapsed;

                // Billboarding — always face camera
                mesh.quaternion.copy(camera.quaternion);
            });

            // Mouse gently shifts the whole bokeh field
            bokehGroup.position.x = mouse.x * 0.3;
            bokehGroup.position.y = mouse.y * 0.15;
        }

        // ── Dust ──
        if (dustGroup) {
            dustGroup.material.uniforms.uTime.value = elapsed;
            dustGroup.rotation.y = elapsed * 0.008;
            dustGroup.position.x = mouse.x * 0.1;
        }

        // ── Light beams ──
        if (beamGroup) {
            beamGroup.children.forEach(mesh => {
                mesh.material.uniforms.uTime.value = elapsed;
                // Very slow sway
                mesh.rotation.z += mesh.userData.swaySpeed * Math.sin(elapsed * 0.1 + mesh.userData.flickerPhase) * 0.001;
            });
        }

        // ── Fog layers ──
        if (fogGroup) {
            fogGroup.children.forEach(mesh => {
                mesh.material.uniforms.uTime.value = elapsed;
                // Gentle vertical bob
                mesh.position.y += Math.sin(elapsed * 0.05 + mesh.userData.driftPhase) * 0.001;
            });
        }

        // ── Geometry breathe ──
        if (geometryGroup) {
            const kids = geometryGroup.children;
            if (kids[0]) {
                kids[0].rotation.y = elapsed * CONFIG.geometry.rotateSpeed;
                kids[0].rotation.x = elapsed * CONFIG.geometry.rotateSpeed * 0.6;
                const s = 1 + Math.sin(elapsed * CONFIG.geometry.breatheSpeed) * 0.04;
                kids[0].scale.set(s, s, s);
            }
            if (kids[1]) {
                kids[1].rotation.y = -elapsed * CONFIG.geometry.rotateSpeed * 1.3;
                kids[1].rotation.z = elapsed * CONFIG.geometry.rotateSpeed * 0.8;
            }

            // Mouse influence
            geometryGroup.rotation.y = mouse.x * 0.15;
            geometryGroup.rotation.x = mouse.y * 0.1;
        }

        // ── Floor ──
        if (floorMesh) {
            floorMesh.material.uniforms.uTime.value = elapsed;
        }

        // ── Camera subtle sway ──
        camera.position.x = mouse.x * 0.4;
        camera.position.y = 1 + mouse.y * 0.2;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }

    // ── EVENTS ──────────────────────────────────
    function addEventListeners() {
        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);
    }

    function onResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if (dustGroup) {
            dustGroup.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
        }
    }

    function onMouseMove(e) {
        mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    // ── PUBLIC API ──────────────────────────────
    return { init };
})();
