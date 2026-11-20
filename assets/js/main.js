/* ===================================================
   TURISMO EN CASAS GRANDES — JavaScript principal
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Una sola fuente para tarjetas, filtros y detalles de los 27 registros.
    const places = Object.values(PLACES_DATA).sort((a, b) => a.num - b.num);
    const grid = document.getElementById('places-grid');
    const count = document.getElementById('places-count');
    function element(tag, className, text) {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }
    places.forEach(place => {
        const card = element('article', 'zona__card');
        card.dataset.place = place.id;
        card.dataset.category = place.category;
        const cover = element('div', 'zona__img-wrapper');
        if (place.images.length) {
            const img = element('img', 'zona__img');
            img.src = place.images[0];
            img.alt = place.title;
            img.loading = 'lazy';
            cover.appendChild(img);
        } else {
            cover.appendChild(element('div', 'zona__img-placeholder', 'Foto pendiente de identificar'));
        }
        const info = element('div', 'zona__info');
        info.appendChild(element('span', 'zona__tag ' + place.tagClass, place.tag));
        const heading = element('h3', 'zona__name');
        const details = element('button', 'zona__details', place.title);
        details.type = 'button';
        details.setAttribute('aria-haspopup', 'dialog');
        details.addEventListener('click', () => openModal(place));
        heading.appendChild(details);
        info.appendChild(heading);
        info.appendChild(element('p', 'zona__desc', place.location));
        const map = element('a', 'btn btn--outline btn--sm', 'Ver ubicación');
        map.href = place.mapsUrl;
        map.target = '_blank';
        map.rel = 'noopener noreferrer';
        info.appendChild(map);
        card.append(cover, info);
        grid.appendChild(card);
    });
    count.textContent = `${places.length} lugares`;

    const galleryGrid = document.querySelector('.galeria__grid');
    ['cueva-de-la-olla', 'casa-botellas', 'piloncillos', 'hotel-guacamayas', 'puente-steven', 'museo-culturas-norte'].forEach((id, index) => {
        const place = PLACES_DATA[id];
        if (!place || !place.images.length) return;
        const item = element('button', 'galeria__item' + ([0, 5].includes(index) ? ' galeria__item--lg' : ''));
        item.type = 'button';
        item.setAttribute('aria-label', 'Ver fotos de ' + place.title);
        const img = element('img', 'galeria__img');
        img.src = place.images[0];
        img.alt = place.title;
        img.loading = 'lazy';
        item.append(img, element('span', 'galeria__caption', place.title));
        item.addEventListener('click', () => openModal(place));
        galleryGrid.appendChild(item);
    });

    // ---- Elementos del DOM ----
    const header       = document.getElementById('header');
    const navMenu      = document.getElementById('nav-menu');
    const navToggle    = document.getElementById('nav-toggle');
    const navClose     = document.getElementById('nav-close');
    const navLinks     = document.querySelectorAll('.nav__link');
    const scrollTopBtn = document.getElementById('scroll-top');
    const sections     = document.querySelectorAll('section[id]');
    const contactForm  = document.getElementById('contact-form');
    const filterBtns   = document.querySelectorAll('.filter-btn');
    const zonaCards    = document.querySelectorAll('.zona__card');

    // Modal elements
    const modal         = document.getElementById('lugar-modal');
    const modalOverlay  = document.getElementById('modal-overlay');
    const modalClose    = document.getElementById('modal-close');
    const modalTitle    = document.getElementById('modal-title');
    const modalTag      = document.getElementById('modal-tag');
    const modalLocation = document.getElementById('modal-location');
    const modalDesc     = document.getElementById('modal-desc');
    const modalMainImg  = document.getElementById('modal-main-img');
    const modalMapsLink = document.getElementById('modal-maps-link');
    const galleryThumbs = document.getElementById('gallery-thumbs');
    const galleryCounter = document.getElementById('gallery-counter');
    const galleryPrev   = document.getElementById('gallery-prev');
    const galleryNext   = document.getElementById('gallery-next');
    const galleryEmpty  = document.getElementById('gallery-empty');
    const photoNote = document.getElementById('photo-note');
    const photoSource = document.getElementById('photo-source');
    const searchInput = document.getElementById('place-search');
    const emptyResults = document.getElementById('places-empty');

    let currentImages = [];
    let currentImageIndex = 0;
    let modalTrigger = null;
    let selectedFilter = 'todos';

    // ================================================
    // Menú Móvil
    // ================================================
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.add('show-menu');
            navToggle.setAttribute('aria-expanded', 'true');
        });
    }
    if (navClose) {
        navClose.addEventListener('click', () => {
            navMenu.classList.remove('show-menu');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    }
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('show-menu');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // ================================================
    // Filtros de Zonas Turísticas
    // ================================================
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    function filterPlaces() {
        const query = normalize(searchInput.value.trim());
        let visibleCount = 0;
        zonaCards.forEach(card => {
            const place = PLACES_DATA[card.dataset.place];
            const matchesCategory = selectedFilter === 'todos' || card.dataset.category === selectedFilter;
            const matchesSearch = normalize(`${place.title} ${place.location}`).includes(query);
            const visible = matchesCategory && matchesSearch;
            card.classList.toggle('hidden', !visible);
            if (visible) visibleCount++;
        });
        count.textContent = `${visibleCount} de ${places.length} lugares`;
        emptyResults.hidden = visibleCount > 0;
        handleReveal();
    }
    searchInput.addEventListener('input', filterPlaces);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
            selectedFilter = btn.dataset.filter;
            filterPlaces();
        });
        btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
    });

    // ================================================
    // MODAL — Abrir al hacer click en tarjeta
    // ================================================
    zonaCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // No abrir modal si clickean el botón de "Ver ubicación"
            if (e.target.closest('a, button')) return;

            const placeId = card.dataset.place;
            if (!placeId || !PLACES_DATA[placeId]) return;

            const place = PLACES_DATA[placeId];
            openModal(place);
        });
    });

    const modalMeta = document.getElementById('modal-meta');

    function openModal(place) {
        modalTrigger = document.activeElement;
        // Llenar datos
        modalTitle.textContent = place.title;
        modalTag.textContent = place.tag;
        modalTag.className = 'modal__tag ' + (place.tagClass || '');
        modalLocation.textContent = place.location;
        modalDesc.textContent = place.description;
        modalMapsLink.href = place.mapsUrl;
        photoNote.textContent = place.photoNote || '';
        photoSource.hidden = !place.photoSource;
        if (place.photoSource) {
            photoSource.href = place.photoSource.url;
            photoSource.textContent = 'Fuente de la portada: ' + place.photoSource.label;
        } else {
            photoSource.removeAttribute('href');
            photoSource.textContent = '';
        }

        // Metadatos (GPS, CP, Notas)
        if (modalMeta) {
            modalMeta.innerHTML = '';
            if (place.coordinates && place.coordinates.lat !== null && place.coordinates.lng !== null) {
                const coordBadge = document.createElement('span');
                coordBadge.className = 'modal__meta-item';
                coordBadge.innerHTML = `<i class="fa-solid fa-compass"></i> GPS: ${place.coordinates.lat}, ${place.coordinates.lng}`;
                modalMeta.appendChild(coordBadge);
            }
            if (place.address && place.address.cp) {
                const cpBadge = document.createElement('span');
                cpBadge.className = 'modal__meta-item';
                cpBadge.innerHTML = `<i class="fa-solid fa-map-pin"></i> C.P. ${place.address.cp}`;
                modalMeta.appendChild(cpBadge);
            }
            if (place.nota) {
                const notaBadge = document.createElement('span');
                notaBadge.className = 'modal__meta-item';
                notaBadge.textContent = place.nota;
                modalMeta.appendChild(notaBadge);
            }
        }

        // Galería
        currentImages = place.images || [];
        currentImageIndex = 0;

        modalMainImg.hidden = currentImages.length === 0;
        galleryEmpty.hidden = currentImages.length > 0;
        galleryPrev.style.display = currentImages.length > 1 ? 'flex' : 'none';
        galleryNext.style.display = currentImages.length > 1 ? 'flex' : 'none';
        galleryCounter.style.display = currentImages.length > 1 ? 'block' : 'none';
        galleryCounter.textContent = '';
        buildThumbnails();
        if (currentImages.length > 0) {
            updateGalleryImage();
        } else {
            modalMainImg.removeAttribute('src');
            modalMainImg.alt = '';
        }

        // Mostrar modal
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modal.querySelector('.modal__content').scrollTop = 0;
        modalClose.focus();
    }

    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (modalTrigger) modalTrigger.focus();
    }

    function updateGalleryImage() {
        if (currentImages.length === 0) return;
        modalMainImg.src = currentImages[currentImageIndex];
        modalMainImg.alt = `${modalTitle.textContent}, foto ${currentImageIndex + 1}`;
        galleryCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;

        // Actualizar thumbnail activo
        document.querySelectorAll('.modal__thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentImageIndex);
        });
    }

    function buildThumbnails() {
        galleryThumbs.innerHTML = '';
        if (currentImages.length <= 1) return;

        currentImages.forEach((imgUrl, index) => {
            const thumb = document.createElement('button');
            thumb.type = 'button';
            thumb.setAttribute('aria-label', `Ver foto ${index + 1}`);
            thumb.className = 'modal__thumb' + (index === 0 ? ' active' : '');
            thumb.innerHTML = `<img src="${imgUrl}" alt="Miniatura ${index + 1}">`;
            thumb.addEventListener('click', () => {
                currentImageIndex = index;
                updateGalleryImage();
            });
            galleryThumbs.appendChild(thumb);
        });
    }

    // Navegación galería
    galleryPrev.addEventListener('click', () => {
        if (!currentImages.length) return;
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        updateGalleryImage();
    });

    galleryNext.addEventListener('click', () => {
        if (!currentImages.length) return;
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateGalleryImage();
    });

    // Cerrar modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'Tab') {
            const focusable = [...modal.querySelectorAll('button, a[href]')].filter(el => el.getClientRects().length);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        if (e.key === 'ArrowLeft' && currentImages.length > 1) {
            e.preventDefault();
            currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
            updateGalleryImage();
        }
        if (e.key === 'ArrowRight' && currentImages.length > 1) {
            e.preventDefault();
            currentImageIndex = (currentImageIndex + 1) % currentImages.length;
            updateGalleryImage();
        }
    });

    // ================================================
    // Header con sombra al hacer scroll
    // ================================================
    function handleHeaderScroll() {
        header.classList.toggle('header--scrolled', window.scrollY > 50);
    }

    // ================================================
    // Botón "Volver arriba"
    // ================================================
    function handleScrollTopButton() {
        scrollTopBtn.classList.toggle('show', window.scrollY > 400);
    }

    // ================================================
    // Navegación activa según la sección visible
    // ================================================
    function handleActiveLink() {
        const scrollY = window.pageYOffset;
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop    = section.offsetTop - 100;
            const sectionId     = section.getAttribute('id');
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ================================================
    // Animaciones de scroll (Reveal)
    // ================================================
    function initRevealAnimations() {
        const selectors = ['.acerca__card', '.zona__card', '.galeria__item', '.contacto__info-item', '.contacto__form'];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, index) => {
                el.classList.add('reveal');
                el.style.transitionDelay = `${Math.min(index * 0.08, 0.8)}s`;
            });
        });
    }

    function handleReveal() {
        const windowHeight = window.innerHeight;
        document.querySelectorAll('.reveal').forEach(el => {
            if (el.getBoundingClientRect().top < windowHeight - 120) {
                el.classList.add('active');
            }
        });
    }

    // ================================================
    // Formulario de contacto
    // ================================================
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name    = document.getElementById('name').value.trim();
            const email   = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            if (!name || !email || !message) {
                alert('Por favor, completa todos los campos obligatorios.');
                return;
            }
            alert(`¡Gracias ${name}! Tu mensaje ha sido enviado. Nos pondremos en contacto contigo pronto.`);
            contactForm.reset();
        });
    }

    // ================================================
    // Smooth scroll para links internos
    // ================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.id === 'modal-maps-link') return;
            e.preventDefault();
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.getElementById(href.slice(1));
            if (target) {
                const headerOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 64;
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.pageYOffset - headerOffset,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ================================================
    // Scroll event (throttled)
    // ================================================
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleHeaderScroll();
                handleScrollTopButton();
                handleActiveLink();
                handleReveal();
                ticking = false;
            });
            ticking = true;
        }
    });

    // ================================================
    // Inicialización
    // ================================================
    initRevealAnimations();
    handleReveal();

});
