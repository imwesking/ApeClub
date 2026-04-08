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

        const FOCUSABLE = 'a[href], button, [tabindex]:not([tabindex="-1"])';

        function openMenu() {
            hamburger.classList.add('is-active');
            mobileMenu.classList.add('is-open');
            hamburger.setAttribute('aria-expanded', 'true');
            mobileMenu.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            const firstFocusable = mobileMenu.querySelector(FOCUSABLE);
            if (firstFocusable) firstFocusable.focus();
        }

        function closeMenu() {
            hamburger.classList.remove('is-active');
            mobileMenu.classList.remove('is-open');
            hamburger.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        hamburger.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.contains('is-open');
            if (isOpen) {
                closeMenu();
                hamburger.focus();
            } else {
                openMenu();
            }
        });

        // Focus trap + Escape
        mobileMenu.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMenu();
                hamburger.focus();
                return;
            }
            if (e.key !== 'Tab') return;

            const focusable = Array.from(mobileMenu.querySelectorAll(FOCUSABLE));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        // Close on link click
        mobileMenu.querySelectorAll('.mobile-menu__link').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
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
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        };

        if (document.readyState === 'complete') {
            setTimeout(hide, 400);
        } else {
            window.addEventListener('load', () => {
                setTimeout(hide, 400);
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

            // Set static aria-label so screen readers always get the real text
            el.setAttribute('aria-label', original);

            let interval = null;

            const scramble = () => {
                let iterations = 0;
                const maxIterations = original.length;

                if (interval) clearInterval(interval);

                // Hide from AT during scramble
                el.setAttribute('aria-hidden', 'true');

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
                        interval = null;
                        el.textContent = original;
                        el.removeAttribute('aria-hidden');
                    }
                }, 40);
            };

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

        ApeScene.init();
        ApeChromaKey.init();
        ApeAnimations.init();

        initGlitchText();

        window.addEventListener('load', () => {
            ScrollTrigger.refresh();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
