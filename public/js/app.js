document.addEventListener('DOMContentLoaded', () => {
    resolveBrandAssets();
    renderPageContent();
    initStarPicker();
    initTagSelector();
    initScrollReveal();
    initAmbientBackgroundTransitions();
    lucide.createIcons();
});

// Tự động dò định dạng file ảnh thật (logo.png / logo.jpg / logo / product.jpg / IMG_1168.jpg)
function resolveBrandAssets() {
    const logoCandidates = ['images/logo.png', 'images/logo.jpg', 'images/logo.jpeg', 'images/logo.webp', 'images/logo'];
    document.querySelectorAll('img[data-brand-logo]').forEach(img => {
        let attempt = 0;
        const tryNextLogo = () => {
            attempt += 1;
            if (attempt < logoCandidates.length) {
                img.src = logoCandidates[attempt];
            } else {
                img.onerror = null;
                img.src = 'https://placehold.co/100x100/14532D/FFFFFF?text=GY';
            }
        };
        img.onerror = tryNextLogo;
        img.src = logoCandidates[0];
    });

    const prodCandidates = ['images/product.jpg', 'images/product.png', 'images/product.jpeg', 'images/IMG_1168.jpg', 'images/IMG_1168.JPG'];
    document.querySelectorAll('img[data-product-img]').forEach(img => {
        let attempt = 0;
        const tryNextProd = () => {
            attempt += 1;
            if (attempt < prodCandidates.length) {
                img.src = prodCandidates[attempt];
            } else {
                img.onerror = null;
                img.src = 'https://placehold.co/600x450/DCFCE7/14532D?text=GreenYo+65ml';
            }
        };
        img.onerror = tryNextProd;
        img.src = prodCandidates[0];
    });
}

function renderPageContent() {
    const data = window.GREENYO_DATA;
    if (!data) return;

    // Hero Badges
    const badgeContainer = document.getElementById('hero-badges');
    if (badgeContainer && data.brand?.badges) {
        badgeContainer.innerHTML = data.brand.badges.map(b => `
            <span class="px-3.5 py-1.5 bg-white text-[#14532D] text-xs font-bold rounded-xl border border-[#22C55E]/35 shadow-sm inline-flex items-center">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 mr-1.5 text-[#16A34A]"></i> ${b}
            </span>
        `).join('');
    }

    // Mục 1: Câu chuyện GreenYo
    if (data.story) {
        const sBadge = document.getElementById('story-badge');
        const sHeading = document.getElementById('story-heading');
        const sParas = document.getElementById('story-paras');
        if (sBadge) sBadge.textContent = data.story.badge;
        if (sHeading) sHeading.textContent = data.story.heading;
        if (sParas) {
            sParas.innerHTML = data.story.paras.map(p => `<p>${p}</p>`).join('');
        }
    }

    // Mục 2: 3 Giá trị hướng đến
    if (data.values) {
        const vBadge = document.getElementById('values-badge');
        const vHeading = document.getElementById('values-heading');
        const vGrid = document.getElementById('values-grid');
        if (vBadge) vBadge.textContent = data.values.badge;
        if (vHeading) vHeading.textContent = data.values.heading;
        if (vGrid) {
            vGrid.innerHTML = data.values.items.map((item, idx) => `
                <div class="soft-card rounded-3xl p-6 sm:p-7 space-y-4 reveal-up delay-${(idx + 1) * 100}">
                    <div class="flex items-center justify-between">
                        <span class="text-2xl font-extrabold bg-gradient-to-r from-[#14532D] to-[#22C55E] bg-clip-text text-transparent">${item.num}</span>
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#DCFCE7] to-[#BBF7D0] text-[#14532D] flex items-center justify-center border border-[#22C55E]/30 shadow-sm">
                            <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-extrabold text-[#14532D]">${item.title}</h3>
                    <p class="text-sm text-[#475569] leading-relaxed">${item.desc}</p>
                </div>
            `).join('');
        }
    }

    // Mục 3: Quy trình 6 bước
    if (data.process) {
        const pBadge = document.getElementById('process-badge');
        const pHeading = document.getElementById('process-heading');
        const pIntro = document.getElementById('process-intro');
        const pList = document.getElementById('process-steps-list');
        const pNote = document.getElementById('process-note');

        if (pBadge) pBadge.textContent = data.process.badge;
        if (pHeading) pHeading.textContent = data.process.heading;
        if (pIntro) pIntro.textContent = data.process.intro;
        if (pNote) pNote.textContent = data.process.note;

        if (pList) {
            pList.innerHTML = data.process.steps.map((st, idx) => `
                <div class="soft-card rounded-2xl p-5 sm:p-6 reveal-up delay-${(idx % 3 + 1) * 100}">
                    <div class="flex items-start space-x-4">
                        <span class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] text-white text-xs font-extrabold flex-shrink-0 shadow-sm">
                            BƯỚC ${st.step}
                        </span>
                        <div class="space-y-1.5">
                            <h3 class="text-base sm:text-lg font-extrabold text-[#14532D]">${st.title}</h3>
                            <p class="text-sm text-[#475569] leading-relaxed">${st.detail}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // Thông số sản phẩm trên product.html
    const specsList = document.getElementById('product-specs-list');
    if (specsList && data.productSpecs) {
        specsList.innerHTML = data.productSpecs.map(sp => `
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]/70">
                <span class="text-[11px] font-extrabold uppercase tracking-wide text-[#16A34A] block">${sp.label}</span>
                <span class="text-xs sm:text-sm font-semibold text-[#0F172A] mt-0.5 block">${sp.value}</span>
            </div>
        `).join('');
    }

    if (data.socials) {
        document.getElementById('link-zalo')?.setAttribute('href', data.socials.zalo);
        document.getElementById('link-fb')?.setAttribute('href', data.socials.facebook);
        document.getElementById('link-tiktok')?.setAttribute('href', data.socials.tiktok);
    }
}

function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-up');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
}

function initAmbientBackgroundTransitions() {
    const sections = document.querySelectorAll('.ambient-section[data-bg-color]');
    if (!sections.length) return;

    const bgObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const nextColor = entry.target.getAttribute('data-bg-color');
                if (nextColor) {
                    document.body.style.backgroundColor = nextColor;
                }
            }
        });
    }, { threshold: 0.35 });

    sections.forEach(sec => bgObserver.observe(sec));
}

function initStarPicker() {
    const stars = document.querySelectorAll('.star-btn');
    const inputVal = document.getElementById('selected-rating');
    if (!stars.length || !inputVal) return;

    stars.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const rating = index + 1;
            inputVal.value = rating;
            stars.forEach((s, sIdx) => {
                if (sIdx < rating) {
                    s.classList.remove('text-gray-300');
                    s.classList.add('text-[#F59E0B]');
                } else {
                    s.classList.remove('text-[#F59E0B]');
                    s.classList.add('text-gray-300');
                }
            });
        });
    });
}

function initTagSelector() {
    const chips = document.querySelectorAll('.tag-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('bg-[#14532D]');
            chip.classList.toggle('text-white');
            chip.classList.toggle('border-[#14532D]');
        });
    });
}