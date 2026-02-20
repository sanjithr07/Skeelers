document.addEventListener('DOMContentLoaded', () => {

    /* =============================================
       NAVBAR — scroll class + scroll-spy
       ============================================= */
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const allNavLinks = document.querySelectorAll('.nav-link');
    const allSections = document.querySelectorAll('section[id]');

    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 30);

        // Scroll-spy: mark active nav link
        let current = '';
        allSections.forEach(sec => {
            if (sec.offsetTop - 120 <= window.scrollY) current = sec.id;
        });
        allNavLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* =============================================
       MOBILE MENU
       ============================================= */
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
    });

    // Close on any nav-link click
    document.querySelectorAll('.nav-link, .btn-nav').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('open');
            document.body.classList.remove('menu-open');
        });
    });

    /* =============================================
       SCROLL-REVEAL
       ============================================= */
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    /* =============================================
       NEWS CAROUSEL
       ============================================= */
    const track = document.getElementById('news-carousel-track');
    const prevBtn = document.getElementById('news-prev');
    const nextBtn = document.getElementById('news-next');
    const paginDiv = document.getElementById('news-pagination');

    if (track && prevBtn && nextBtn && paginDiv) {
        const slides = Array.from(track.querySelectorAll('.news-slide'));
        let current = 0;
        const dots = [];

        // Build pagination dots
        slides.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
            if (i === 0) btn.classList.add('active');
            btn.addEventListener('click', () => goTo(i));
            paginDiv.appendChild(btn);
            dots.push(btn);
        });

        const updateDots = (idx) => {
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        };

        const goTo = (idx) => {
            current = (idx + slides.length) % slides.length;
            const padLeft = parseInt(getComputedStyle(track).paddingLeft) || 0;
            track.scrollTo({ left: slides[current].offsetLeft - padLeft, behavior: 'smooth' });
            updateDots(current);
        };

        nextBtn.addEventListener('click', () => goTo(current + 1));
        prevBtn.addEventListener('click', () => goTo(current - 1));

        // Sync dots on manual swipe
        const syncObs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const idx = slides.indexOf(e.target);
                    if (idx !== -1) { current = idx; updateDots(idx); }
                }
            });
        }, { root: track, threshold: 0.6 });
        slides.forEach(s => syncObs.observe(s));
    }

    /* =============================================
       MODALS (News cards)
       ============================================= */
    const modals = document.querySelectorAll('.news-modal');
    const readMoreBtns = document.querySelectorAll('.read-more-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');

    const openModal = (id) => {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('is-open');
        document.body.classList.add('modal-open');
        modal.querySelector('.close-modal-btn')?.focus();
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
    };

    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.modalTarget));
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.news-modal')));
    });

    modals.forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') modals.forEach(closeModal);
    });
});
