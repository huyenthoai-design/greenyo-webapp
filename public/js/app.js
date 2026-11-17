document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo Lucide Icons
    lucide.createIcons();

    // Nạp dữ liệu từ content-data.js ra trang chủ index.html
    renderContentData();

    // Kích hoạt tương tác
    initStarPicker();
    initTagSelector();
    initScrollspy();
});

function renderContentData() {
    const data = window.GREENYO_DATA;
    if (!data) return;

    // 1. Hero Badges
    const badgeContainer = document.getElementById('hero-badges');
    if (badgeContainer) {
        badgeContainer.innerHTML = data.brand.badges.map(b => `
            <span class="px-3 py-1 bg-white text-[#14532D] text-xs font-bold rounded-lg border border-[#E2E8F0] shadow-sm flex items-center">
                <i data-lucide="check" class="w-3.5 h-3.5 mr-1.5 text-[#16A34A]"></i> ${b}
            </span>
        `).join('');
    }

    // 2. Traceability 4 Nhóm
    const traceGrid = document.getElementById('traceability-grid');
    if (traceGrid) {
        traceGrid.innerHTML = data.traceability.map(item => `
            <div class="soft-card rounded-2xl p-6 space-y-3">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold">
                        <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <span class="text-xs font-bold text-[#16A34A] uppercase">${item.group}</span>
                        <h3 class="text-lg font-bold text-[#14532D]">${item.title}</h3>
                    </div>
                </div>
                <p class="text-sm text-[#64748B] leading-relaxed">${item.desc}</p>
            </div>
        `).join('');
    }

    // 3. Story & ESG
    const storyHeading = document.getElementById('story-heading');
    const storyParas = document.getElementById('story-paras');
    if (storyHeading && storyParas) {
        storyHeading.textContent = data.story.heading;
        storyParas.innerHTML = data.story.paras.map(p => `<p>${p}</p>`).join('');
    }

    const esgContainer = document.getElementById('esg-cards');
    if (esgContainer) {
        esgContainer.innerHTML = data.story.esg.map((e, idx) => `
            <div class="soft-card rounded-2xl p-5 flex items-start space-x-4">
                <div class="w-8 h-8 rounded-lg bg-[#14532D] text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">0${idx+1}</div>
                <div>
                    <h4 class="text-base font-bold text-[#14532D]">${e.title}</h4>
                    <p class="text-xs text-[#64748B] mt-1">${e.desc}</p>
                </div>
            </div>
        `).join('');
    }

    // 4. Process Accordion (6 Bước)
    const processAccordion = document.getElementById('process-accordion');
    if (processAccordion) {
        processAccordion.innerHTML = data.process.map((p, idx) => `
            <div class="soft-card rounded-2xl overflow-hidden transition">
                <button class="accordion-btn w-full px-6 py-4 flex items-center justify-between text-left font-bold text-[#14532D] hover:bg-gray-50 transition">
                    <div class="flex items-center space-x-4">
                        <span class="text-sm font-extrabold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-1 rounded-lg border border-[#16A34A]/20">Bước ${p.step}</span>
                        <span class="text-base sm:text-lg">${p.title}</span>
                    </div>
                    <i data-lucide="chevron-down" class="w-5 h-5 text-[#64748B] transition-transform duration-300"></i>
                </button>
                <div class="accordion-content hidden px-6 pb-5 text-sm text-[#64748B] border-t border-[#E2E8F0] pt-3 bg-gray-50/50">
                    ${p.detail}
                </div>
            </div>
        `).join('');

        // Gắn sự kiện đóng mở Accordion
        document.querySelectorAll('.accordion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const content = btn.nextElementSibling;
                const icon = btn.querySelector('i[data-lucide="chevron-down"]');
                
                // Đóng các mục khác
                document.querySelectorAll('.accordion-content').forEach(c => {
                    if (c !== content) c.classList.add('hidden');
                });

                content.classList.toggle('hidden');
                if (icon) {
                    icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            });
        });
    }

    // 5. Footer Social Links
    if (data.socials) {
        document.getElementById('link-zalo')?.setAttribute('href', data.socials.zalo);
        document.getElementById('link-fb')?.setAttribute('href', data.socials.facebook);
        document.getElementById('link-tiktok')?.setAttribute('href', data.socials.tiktok);
    }
}

// Chọn số sao đánh giá
function initStarPicker() {
    const stars = document.querySelectorAll('.star-btn');
    const inputVal = document.getElementById('selected-rating');
    
    stars.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const rating = index + 1;
            inputVal.value = rating;
            stars.forEach((s, sIdx) => {
                if (sIdx < rating) {
                    s.classList.remove('text-gray-300');
                    s.classList.add('text-[#D97706]');
                } else {
                    s.classList.remove('text-[#D97706]');
                    s.classList.add('text-gray-300');
                }
            });
        });
    });
}

// Chọn thẻ cảm nhận nhanh (Quick Tags)
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

// Scrollspy làm sáng đèn Navbar khi cuộn trang
function initScrollspy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let scrollY = window.scrollY;
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}