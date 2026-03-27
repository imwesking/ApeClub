/* ============================================
   APECLUB — CUSTOM CURSOR
   Glowing dot + outline, morphs on hover
   ============================================ */

const ApeCursor = (() => {
    let cursor, dot, outline;
    let mouseX = 0, mouseY = 0;
    let outlineX = 0, outlineY = 0;
    let isHovering = false;
    let animationId = null;
    let isEnabled = true;

    function init() {
        // Disable on touch devices and reduced motion
        if ('ontouchstart' in window || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.style.cursor = 'auto';
            const el = document.getElementById('cursor');
            if (el) el.style.display = 'none';
            isEnabled = false;
            return;
        }

        cursor = document.getElementById('cursor');
        if (!cursor) return;

        dot = cursor.querySelector('.cursor__dot');
        outline = cursor.querySelector('.cursor__outline');

        document.addEventListener('mousemove', onMouseMove);
        setupHoverTargets();
        animate();
    }

    function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    function animate() {
        // Dot follows instantly
        if (dot) {
            dot.parentElement.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        }

        // Outline follows with lerp (smooth lag)
        outlineX += (mouseX - outlineX) * 0.12;
        outlineY += (mouseY - outlineY) * 0.12;

        if (outline) {
            outline.style.transform = `translate(${outlineX - mouseX}px, ${outlineY - mouseY}px)${isHovering ? ' scale(1.6)' : ''}`;
        }

        animationId = requestAnimationFrame(animate);
    }

    function setupHoverTargets() {
        const hoverables = document.querySelectorAll(
            'a, button, .btn, .perk-card, .social-link, .nav__hamburger, .about__card-3d'
        );

        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                isHovering = true;
                cursor.classList.add('is-hovering');
            });
            el.addEventListener('mouseleave', () => {
                isHovering = false;
                cursor.classList.remove('is-hovering');
            });
        });
    }

    function destroy() {
        if (animationId) cancelAnimationFrame(animationId);
        document.removeEventListener('mousemove', onMouseMove);
    }

    return { init, destroy };
})();
