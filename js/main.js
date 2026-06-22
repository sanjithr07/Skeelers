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

    // Inject a dim overlay element for outside-tap (below the navbar)
    const navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    navOverlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(navOverlay);

    const closeMenu = () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        navOverlay.classList.remove('visible');
        document.body.classList.remove('menu-open');
        // Collapse any open sub-menus
        document.querySelectorAll('.nav-item-dropdown.sub-open').forEach(d => d.classList.remove('sub-open'));
        document.querySelectorAll('.dropdown-menu.mobile-open').forEach(m => m.classList.remove('mobile-open'));
    };

    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        navOverlay.classList.toggle('visible', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
    });

    // Close when user taps the dim overlay
    navOverlay.addEventListener('click', closeMenu);

    // Dropdown chevron toggles (mobile only — inside mobile-nav-body)
    document.querySelectorAll('.mobile-nav-body .nav-item-dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('.nav-link');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (!trigger || !menu) return;

        trigger.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return;
            e.preventDefault();
            const isOpen = dropdown.classList.toggle('sub-open');
            menu.classList.toggle('mobile-open', isOpen);
        });
    });

    // Close on any nav-link, CTA click, or dropdown interior link (but not dropdown triggers on mobile)
    document.querySelectorAll('.nav-link, .btn-nav, .btn-contact, .dropdown-menu a').forEach(link => {
        // Prevent closing ONLY if they clicked the main dropdown toggle itself
        if (link.classList.contains('nav-link') && link.closest('.mobile-nav-body .nav-item-dropdown')) return;
        link.addEventListener('click', closeMenu);
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
       DYNAMIC NEWS & MODALS
       ============================================= */
    const track = document.getElementById('news-carousel-track');
    const modalsContainer = document.getElementById('dynamic-modals-container');
    const paginDiv = document.getElementById('news-pagination');
    const prevBtn = document.getElementById('news-prev');
    const nextBtn = document.getElementById('news-next');

    async function loadNews() {
        if (!track || !modalsContainer) return;

        try {
            const res = await fetch('data/news.json');
            if (!res.ok) throw new Error('Could not load news');
            const newsData = await res.json();

            if (newsData.length === 0) {
                track.innerHTML = '<p style="text-align:center; padding: 2rem;">No news available at the moment.</p>';
                return;
            }

            let cardsHTML = '';
            let modalsHTML = '';

            newsData.forEach((item, i) => {
                const modalId = `modal-news-${item.id}`;
                const heroImg = item.heroImage || `https://placehold.co/800x440/E8E0D8/003552?text=News`;
                
                // Build Card
                cardsHTML += `
                    <article class="news-slide news-card">
                        <div class="news-img-wrap">
                            <img src="${heroImg}" alt="${item.title}" loading="lazy"
                                onerror="this.src='https://placehold.co/800x440/003552/F1EBE4?text=News'">
                            <span class="news-tag">${item.tag}</span>
                        </div>
                        <div class="news-body">
                            <time class="news-date">${item.date}</time>
                            <h3>${item.title}</h3>
                            <p>${item.shortDescription}</p>
                            <button class="btn-text-link read-more-btn" data-modal-target="${modalId}">Read More
                                →&#xFE0E;</button>
                        </div>
                    </article>
                `;

                // Build Modal
                let galleryHTML = '';
                if (item.additionalImages && item.additionalImages.length > 0) {
                    galleryHTML = '<div class="modal-gallery">';
                    item.additionalImages.forEach(img => {
                        galleryHTML += `<img src="${img}" alt="Additional photo" loading="lazy" onerror="this.style.display='none'">`;
                    });
                    galleryHTML += '</div>';
                }

                // Format full description (replace newlines with <br> or wrap in <p>)
                const formattedDesc = item.fullDescription.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');

                modalsHTML += `
                    <div id="${modalId}" class="news-modal" role="dialog" aria-modal="true">
                        <div class="modal-box">
                            <button class="close-modal-btn" aria-label="Close">&#x2715;</button>
                            <h3>${item.title}</h3>
                            <img src="${heroImg}" alt="${item.title}" loading="lazy"
                                onerror="this.src='https://placehold.co/800x500/003552/F1EBE4?text=News'">
                            ${formattedDesc}
                            ${galleryHTML}
                        </div>
                    </div>
                `;
            });

            track.innerHTML = cardsHTML;
            modalsContainer.innerHTML = modalsHTML;

            initCarousel();
            initModals();

        } catch (err) {
            console.error(err);
            track.innerHTML = '<p style="text-align:center; padding: 2rem;">Unable to load news.</p>';
        }
    }

    function initCarousel() {
        const slides = Array.from(track.querySelectorAll('.news-slide'));
        if (slides.length === 0) return;
        
        let current = 0;
        const dots = [];
        
        paginDiv.innerHTML = ''; // Clear existing

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

    function initModals() {
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
    }

    // Call the function
    loadNews();
});
