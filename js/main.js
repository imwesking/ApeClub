/* ============================================
   APECLUB — MAIN ENTRY POINT
   Initializes all modules, loader, smooth scroll
   ============================================ */

(function () {
    'use strict';

    // ============================
    // SMOOTH SCROLL (LENIS)
    // ============================
    let lenis = null;

    function initSmoothScroll() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true
        });

        // Sync Lenis with GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
    }

    // ============================
    // MOBILE NAV
    // ============================
    function initMobileNav() {
        const hamburger = document.getElementById('navHamburger');
        const mobileMenu = document.getElementById('mobileMenu');

        if (!hamburger || !mobileMenu) return;

        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('is-active');
            mobileMenu.classList.toggle('is-open');
            document.body.style.overflow = mobileMenu.classList.contains('is-open') ? 'hidden' : '';
        });

        // Close on link click
        mobileMenu.querySelectorAll('.mobile-menu__link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('is-active');
                mobileMenu.classList.remove('is-open');
                document.body.style.overflow = '';
            });
        });
    }

    // ============================
    // SMOOTH ANCHOR SCROLL
    // ============================
    function initAnchorLinks() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (!target) return;

                e.preventDefault();

                if (lenis) {
                    lenis.scrollTo(target, { offset: -60 });
                } else {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // ============================
    // LOADER
    // ============================
    function initLoader() {
        const loader = document.getElementById('loader');
        if (!loader) return;

        const hide = () => {
            loader.classList.add('is-hidden');
            // Remove from DOM after transition
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        };

        // Wait for all critical assets
        if (document.readyState === 'complete') {
            setTimeout(hide, 800);
        } else {
            window.addEventListener('load', () => {
                setTimeout(hide, 800);
            });
        }
    }

    // ============================
    // GLITCH TEXT SCRAMBLE
    // ============================
    function initGlitchText() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

        document.querySelectorAll('.glitch').forEach(el => {
            const original = el.getAttribute('data-text');

            // Periodically scramble
            let interval = null;

            const scramble = () => {
                let iterations = 0;
                const maxIterations = original.length;

                if (interval) clearInterval(interval);

                interval = setInterval(() => {
                    el.textContent = original
                        .split('')
                        .map((char, i) => {
                            if (i < iterations) return original[i];
                            if (char === ' ') return ' ';
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join('');

                    iterations += 1 / 2;

                    if (iterations >= maxIterations) {
                        clearInterval(interval);
                        el.textContent = original;
                    }
                }, 40);
            };

            // Trigger on scroll into view
            ScrollTrigger.create({
                trigger: el,
                start: 'top 80%',
                onEnter: scramble,
                once: true
            });
        });
    }

    // ============================
    // INITIALIZE EVERYTHING
    // ============================
    function boot() {
        initLoader();
        initSmoothScroll();
        initMobileNav();
        initAnchorLinks();

        // Initialize modules
        ApeScene.init();
        ApeChromaKey.init();
        ApeAnimations.init();
        ApeCursor.init();

        // Glitch text (needs ScrollTrigger to be ready)
        initGlitchText();

        // Refresh ScrollTrigger after everything loads
        window.addEventListener('load', () => {
            ScrollTrigger.refresh();
        });
    }

    // DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
