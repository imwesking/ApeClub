/* ============================================
   APECLUB — GSAP SCROLL ANIMATIONS
   ScrollTrigger-driven entrance & scroll effects
   ============================================ */

const ApeAnimations = (() => {
    let isReducedMotion = false;

    function init() {
        isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isReducedMotion) {
            showAllContent();
            return;
        }

        gsap.registerPlugin(ScrollTrigger);
        setupHeroAnimations();
        setupNavScroll();
        setupAboutAnimations();
        setupPerksAnimations();
        setupComingSoonAnimations();
        setupJoinAnimations();
        setupPerkCardTilt();
        setupMemberCardTilt();
    }

    // Show all content instantly if reduced motion
    function showAllContent() {
        gsap.set([
            '.hero__tag', '.hero__title-line', '.hero__subtitle',
            '.hero__buttons', '.hero__nana', '.hero__scroll-indicator',
            '.about__badge', '.about__title .word', '.about__paragraph',
            '.about__visual', '.perk-card', '.coming-soon__label',
            '.coming-soon__title', '.coming-soon__line', '.coming-soon__desc',
            '.join__content'
        ], { opacity: 1, y: 0, x: 0, scale: 1 });
    }

    // ============================
    // HERO ANIMATIONS
    // ============================
    function setupHeroAnimations() {
        const tl = gsap.timeline({ delay: 0.3 });

        // NaNa entrance
        tl.to('.hero__nana', {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out'
        }, 0);

        // Tag line
        tl.to('.hero__tag', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out'
        }, 0.3);

        // Title lines stagger
        tl.to('.hero__title-line', {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            ease: 'power3.out'
        }, 0.4);

        // Subtitle
        tl.to('.hero__subtitle', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out'
        }, 0.8);

        // Buttons
        tl.to('.hero__buttons', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out'
        }, 1);

        // Scroll indicator
        tl.to('.hero__scroll-indicator', {
            opacity: 1,
            duration: 1,
            ease: 'power2.out'
        }, 1.4);

        // Set initial states
        gsap.set('.hero__nana', { opacity: 0, y: 40 });
        gsap.set('.hero__tag', { opacity: 0, y: 20 });
        gsap.set('.hero__title-line', { opacity: 0, y: 30 });
        gsap.set('.hero__subtitle', { opacity: 0, y: 20 });
        gsap.set('.hero__buttons', { opacity: 0, y: 20 });
        gsap.set('.hero__scroll-indicator', { opacity: 0 });

        // Parallax on scroll — NaNa moves slower
        gsap.to('.hero__nana', {
            y: -80,
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1.5
            }
        });

        gsap.to('.hero__text', {
            y: -40,
            opacity: 0,
            scrollTrigger: {
                trigger: '.hero',
                start: '60% top',
                end: 'bottom top',
                scrub: 1
            }
        });
    }

    // ============================
    // NAV SCROLL EFFECT
    // ============================
    function setupNavScroll() {
        ScrollTrigger.create({
            start: 80,
            onUpdate: (self) => {
                const nav = document.getElementById('nav');
                if (!nav) return;
                if (self.direction === 1 && self.scroll() > 80) {
                    nav.classList.add('is-scrolled');
                } else if (self.scroll() <= 80) {
                    nav.classList.remove('is-scrolled');
                }
            }
        });
    }

    // ============================
    // ABOUT SECTION
    // ============================
    function setupAboutAnimations() {
        // Badge
        gsap.from('.about .about__badge', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            scrollTrigger: {
                trigger: '.about',
                start: 'top 80%'
            }
        });

        // Title words
        gsap.from('.about__title .word', {
            opacity: 0,
            y: 30,
            rotateX: -40,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.about__title',
                start: 'top 80%'
            }
        });

        // Paragraphs
        gsap.from('.about__paragraph', {
            opacity: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.about__text',
                start: 'top 80%'
            }
        });

        // Membership card
        gsap.from('.about__visual', {
            opacity: 0,
            y: 40,
            rotateY: 20,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.about__visual',
                start: 'top 85%'
            }
        });
    }

    // ============================
    // PERKS SECTION
    // ============================
    function setupPerksAnimations() {
        // Header
        gsap.from('.perks__header .about__badge', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            scrollTrigger: {
                trigger: '.perks',
                start: 'top 80%'
            }
        });

        gsap.from('.perks__header .section-title .word', {
            opacity: 0,
            y: 30,
            rotateX: -40,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.perks__header',
                start: 'top 80%'
            }
        });

        gsap.from('.perks__subtitle', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            scrollTrigger: {
                trigger: '.perks__header',
                start: 'top 75%'
            }
        });

        // Cards stagger from bottom
        gsap.from('.perk-card', {
            opacity: 0,
            y: 60,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.perks__grid',
                start: 'top 85%'
            }
        });
    }

    // ============================
    // COMING SOON SECTION
    // ============================
    function setupComingSoonAnimations() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.coming-soon',
                start: 'top 75%'
            }
        });

        tl.from('.coming-soon__label', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power2.out'
        });

        tl.from('.coming-soon__title', {
            opacity: 0,
            scale: 0.9,
            duration: 1,
            stagger: 0.15,
            ease: 'power3.out'
        }, '-=0.4');

        tl.from('.coming-soon__line', {
            scaleX: 0,
            duration: 0.6,
            ease: 'power2.inOut'
        }, '-=0.3');

        tl.from('.coming-soon__desc', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power2.out'
        }, '-=0.2');
    }

    // ============================
    // JOIN SECTION
    // ============================
    function setupJoinAnimations() {
        gsap.from('.join__content', {
            opacity: 0,
            y: 50,
            scale: 0.95,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.join',
                start: 'top 75%'
            }
        });

        // Glow pulse on scroll
        gsap.to('.join__glow', {
            scale: 1.2,
            opacity: 1,
            scrollTrigger: {
                trigger: '.join',
                start: 'top 80%',
                end: 'bottom 20%',
                scrub: 2
            }
        });
    }

    // ============================
    // PERK CARD 3D TILT ON HOVER
    // ============================
    function setupPerkCardTilt() {
        const cards = document.querySelectorAll('.perk-card');
        const maxTilt = 12;

        cards.forEach(card => {
            const inner = card.querySelector('.perk-card__inner');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -maxTilt;
                const rotateY = ((x - centerX) / centerX) * maxTilt;

                gsap.to(inner, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.4,
                    ease: 'power2.out',
                    transformPerspective: 600
                });

                // Move specular highlight
                const percentX = (x / rect.width) * 100;
                const percentY = (y / rect.height) * 100;
                inner.style.background = `
                    radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.04) 0%, transparent 50%),
                    var(--bg-card)
                `;
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(inner, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.6,
                    ease: 'power3.out'
                });
                inner.style.background = '';
            });
        });
    }

    // ============================
    // MEMBERSHIP CARD 3D TILT
    // ============================
    function setupMemberCardTilt() {
        const card = document.querySelector('.about__card-3d');
        if (!card) return;

        const face = card.querySelector('.about__card-face');
        const maxTilt = 15;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -maxTilt;
            const rotateY = ((x - centerX) / centerX) * maxTilt;

            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 0.4,
                ease: 'power2.out'
            });

            // Specular highlight on the face
            const percentX = (x / rect.width) * 100;
            const percentY = (y / rect.height) * 100;
            face.style.setProperty('--highlight-x', `${percentX}%`);
            face.style.setProperty('--highlight-y', `${percentY}%`);
            if (face.querySelector('::before')) {
                face.style.background = `
                    radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.08) 0%, transparent 40%),
                    linear-gradient(135deg, rgba(155, 77, 255, 0.2), rgba(255, 45, 149, 0.15), rgba(0, 240, 255, 0.1))
                `;
            }
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.8,
                ease: 'power3.out'
            });
            face.style.background = '';
        });
    }

    return { init };
})();
