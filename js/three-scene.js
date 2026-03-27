/* ============================================
   APECLUB — THREE.JS PARTICLE SCENE
   Futuristic particle field + wireframe geometry
   ============================================ */

const ApeScene = (() => {
    let scene, camera, renderer, particles, wireframe, clock;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let isMobile = false;
    let isReducedMotion = false;
    let animationId = null;

    const PARTICLE_COUNT_DESKTOP = 4000;
    const PARTICLE_COUNT_MOBILE = 1200;
    const SPHERE_RADIUS = 6;

    function init() {
        isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isReducedMotion) return;

        isMobile = window.innerWidth < 768;
        const canvas = document.getElementById('three-canvas');
        if (!canvas) return;

        // Scene
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a0a0f, 0.06);

        // Camera
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 12;

        // Renderer
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

        createParticles();
        createWireframe();
        addEventListeners();
        animate();
    }

    function createParticles() {
        const count = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        // Colors
        const purple = new THREE.Color(0x9b4dff);
        const pink = new THREE.Color(0xff2d95);
        const cyan = new THREE.Color(0x00f0ff);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Distribute in a sphere with some randomness
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const r = SPHERE_RADIUS * (0.3 + Math.random() * 0.7);

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = r * Math.cos(phi);

            // Blend colors based on position
            const t = Math.random();
            const color = new THREE.Color();
            if (t < 0.33) {
                color.lerpColors(purple, pink, Math.random());
            } else if (t < 0.66) {
                color.lerpColors(pink, cyan, Math.random());
            } else {
                color.lerpColors(cyan, purple, Math.random());
            }

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            sizes[i] = Math.random() * 2.5 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Custom shader material for soft particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float uTime;
                uniform float uPixelRatio;

                void main() {
                    vColor = color;
                    vec3 pos = position;

                    // Subtle floating motion
                    pos.x += sin(uTime * 0.3 + position.y * 0.5) * 0.15;
                    pos.y += cos(uTime * 0.2 + position.x * 0.5) * 0.15;
                    pos.z += sin(uTime * 0.25 + position.z * 0.3) * 0.1;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * uPixelRatio * (80.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;

                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;

                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    alpha *= 0.35;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);
    }

    function createWireframe() {
        if (isMobile) return;

        // Icosahedron wireframe
        const geo = new THREE.IcosahedronGeometry(2.8, 1);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x9b4dff,
            wireframe: true,
            transparent: true,
            opacity: 0.05
        });
        wireframe = new THREE.Mesh(geo, mat);
        scene.add(wireframe);
    }

    function animate() {
        animationId = requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();

        // Smooth mouse follow
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Rotate particle sphere
        if (particles) {
            particles.rotation.y = elapsed * 0.06;
            particles.rotation.x = elapsed * 0.03;

            // Mouse influence on rotation
            particles.rotation.y += mouse.x * 0.2;
            particles.rotation.x += mouse.y * 0.15;

            // Update time uniform
            particles.material.uniforms.uTime.value = elapsed;
        }

        // Rotate wireframe
        if (wireframe) {
            wireframe.rotation.y = elapsed * 0.1;
            wireframe.rotation.x = elapsed * 0.07;
            wireframe.rotation.z = elapsed * 0.04;

            // Subtle scale pulse
            const scale = 1 + Math.sin(elapsed * 0.5) * 0.05;
            wireframe.scale.set(scale, scale, scale);

            // Mouse influence
            wireframe.rotation.y += mouse.x * 0.3;
            wireframe.rotation.x += mouse.y * 0.2;
        }

        renderer.render(scene, camera);
    }

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

        if (particles) {
            particles.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
        }
    }

    function onMouseMove(e) {
        mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    function destroy() {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mousemove', onMouseMove);
        if (renderer) renderer.dispose();
    }

    return { init, destroy };
})();
