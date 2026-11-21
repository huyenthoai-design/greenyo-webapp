let supabaseClient = null;
let currentUser = null;
let cachedReviews = [];
let activeStarFilter = 'all';
const INITIAL_REVIEW_LIMIT = 3;

async function initSupabase() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        if (config.supabaseUrl && config.supabaseAnonKey && config.supabaseUrl.startsWith('http')) {
            supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

            const { data: { session } } = await supabaseClient.auth.getSession();
            updateAuthState(session?.user || null);

            supabaseClient.auth.onAuthStateChange((_event, session) => {
                updateAuthState(session?.user || null);
            });

            fetchAndRenderReviews();
        } else {
            activateFallbackMode();
        }
    } catch (_error) {
        activateFallbackMode();
    }
}

function updateAuthState(user) {
    currentUser = user;
    const authContainer = document.getElementById('auth-container');
    const reviewForm = document.getElementById('review-form');
    const loginPrompt = document.getElementById('login-prompt');

    if (!authContainer) return;

    if (user) {
        const userName = user.user_metadata?.full_name || 'Thành viên GreenYo';
        const userEmail = user.email || '';
        const userAvatar = user.user_metadata?.avatar_url || 'https://placehold.co/40x40/14532D/FFFFFF?text=GY';

        authContainer.innerHTML = `
            <div class="relative">
                <button id="avatar-menu-trigger" type="button" aria-label="Tài khoản" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#14532D] to-[#22C55E] shadow-sm hover:scale-105 transition cursor-pointer focus:outline-none">
                    <img src="${userAvatar}" alt="Avatar" class="w-full h-full rounded-full object-cover bg-white">
                </button>
                <div id="avatar-dropdown-menu" class="hidden absolute right-0 mt-2.5 w-60 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#16A34A]/25 shadow-xl p-3.5 z-50 space-y-3">
                    <div class="flex items-center space-x-2.5 pb-2.5 border-b border-[#E2E8F0]">
                        <img src="${userAvatar}" alt="Avatar" class="w-9 h-9 rounded-full object-cover border border-[#16A34A]/30">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-extrabold text-[#14532D] truncate">${userName}</p>
                            <p class="text-[11px] text-[#64748B] truncate">${userEmail}</p>
                        </div>
                    </div>
                    <button id="logout-btn" type="button" class="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition cursor-pointer">
                        <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                        <span>Đăng xuất tài khoản</span>
                    </button>
                </div>
            </div>
        `;

        const triggerBtn = document.getElementById('avatar-menu-trigger');
        const dropdownMenu = document.getElementById('avatar-dropdown-menu');

        triggerBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu?.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (dropdownMenu && !dropdownMenu.contains(e.target) && e.target !== triggerBtn) {
                dropdownMenu.classList.add('hidden');
            }
        });

        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            if (supabaseClient) {
                await supabaseClient.auth.signOut();
            }
            window.location.reload();
        });

        if (reviewForm && loginPrompt) {
            loginPrompt.classList.add('hidden');
            reviewForm.classList.remove('hidden');
            document.getElementById('user-avatar-preview').src = userAvatar;
            document.getElementById('user-name-preview').textContent = userName;
        }

        if (window.lucide) lucide.createIcons();
    } else {
        authContainer.innerHTML = `
            <button id="login-google-btn" class="flex items-center space-x-1.5 bg-white/90 border border-[#16A34A]/30 hover:border-[#16A34A] px-3 py-2 rounded-xl text-xs font-bold text-[#14532D] shadow-sm transition cursor-pointer whitespace-nowrap">
                <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.2v3.14C3.17 21.36 7.28 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.61H1.2C.44 8.14 0 9.87 0 11.75s.44 3.61 1.2 5.14l4.08-2.64z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.28 0 3.17 2.64 1.2 6.61l4.08 3.14c.95-2.84 3.6-4.95 6.72-4.95z"/></svg>
                <span class="hidden sm:inline">Đăng nhập</span>
            </button>
        `;

        document.getElementById('login-google-btn')?.addEventListener('click', handleGoogleLogin);
        document.getElementById('form-login-btn')?.addEventListener('click', handleGoogleLogin);

        if (reviewForm && loginPrompt) {
            loginPrompt.classList.remove('hidden');
            reviewForm.classList.add('hidden');
        }
    }
}

async function handleGoogleLogin() {
    if (!supabaseClient) {
        alert('Hệ thống đang ở chế độ ngoại tuyến hoặc chưa kết nối cơ sở dữ liệu.');
        return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    if (error) {
        alert('Lỗi đăng nhập Google: ' + error.message);
    }
}

async function fetchAndRenderReviews() {
    if (!supabaseClient) {
        activateFallbackMode();
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            activateFallbackMode();
            return;
        }

        cachedReviews = data || [];
        renderReviewsDashboard();
    } catch (_err) {
        activateFallbackMode();
    }
}

function buildReviewCardHTML(r) {
    const ratingNum = Math.min(5, Math.max(1, Number(r.rating || 5)));
    const starsHtml = '<i data-lucide="star" class="w-4 h-4 fill-current text-[#F59E0B]"></i>'.repeat(ratingNum);
    const tagsHtml = (r.tags || []).map(t => `<span class="px-2.5 py-0.5 bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold rounded-md">${t}</span>`).join('');
    const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '';

    return `
        <div class="soft-card rounded-2xl p-5 space-y-3 bg-white">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center space-x-3">
                    <img src="${r.user_avatar || 'https://placehold.co/40x40/14532D/FFFFFF?text=GY'}" alt="Avatar" class="w-10 h-10 rounded-full border border-[#16A34A]/30 object-cover">
                    <div>
                        <h4 class="text-sm font-bold text-[#0F172A]">${r.user_name}</h4>
                        <span class="text-[11px] text-[#64748B]">${dateStr}</span>
                    </div>
                </div>
                <div class="flex space-x-0.5">${starsHtml}</div>
            </div>
            ${tagsHtml ? `<div class="flex flex-wrap gap-1.5">${tagsHtml}</div>` : ''}
            <p class="text-sm text-[#334155] leading-relaxed">${r.comment || ''}</p>
        </div>
    `;
}

function renderReviewsDashboard() {
    const container = document.getElementById('reviews-list');
    const avgValElem = document.getElementById('avg-rating-val');
    const countElem = document.getElementById('total-reviews-count');
    const breakdownBox = document.getElementById('star-breakdown-box');
    const triggerWrap = document.getElementById('reviews-modal-trigger-wrap');
    const triggerLabel = document.getElementById('open-reviews-modal-label');

    if (!container) return;

    const total = cachedReviews.length;

    // Tính số lượt từng hạng sao 5 -> 1
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    cachedReviews.forEach(item => {
        const star = Math.min(5, Math.max(1, Number(item.rating || 5)));
        counts[star] += 1;
        totalScore += star;
    });

    if (avgValElem) {
        avgValElem.textContent = total ? (totalScore / total).toFixed(1) : "5.0";
    }
    if (countElem) {
        countElem.textContent = `Dựa trên ${total} lượt đánh giá xác thực`;
    }

    // Vẽ thanh phân bổ số lượt theo từng hạng sao
    if (breakdownBox) {
        breakdownBox.innerHTML = [5, 4, 3, 2, 1].map(star => {
            const count = counts[star];
            const pct = total ? Math.round((count / total) * 100) : 0;
            return `
                <div class="flex items-center space-x-3 text-xs">
                    <span class="w-12 font-bold text-[#14532D] flex items-center">${star} <i data-lucide="star" class="w-3.5 h-3.5 ml-1 fill-current text-[#F59E0B]"></i></span>
                    <div class="flex-1 h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                    </div>
                    <span class="w-14 text-right font-semibold text-[#475569]">${count} lượt</span>
                </div>
            `;
        }).join('');
    }

    if (!total) {
        container.innerHTML = `<div class="text-center py-8 text-sm text-[#64748B] soft-card rounded-2xl">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!</div>`;
        if (triggerWrap) triggerWrap.classList.add('hidden');
        lucide.createIcons();
        return;
    }

    // Ngoài trang chính chỉ hiện gọn tối đa 3 đánh giá mới nhất
    const previewItems = cachedReviews.slice(0, INITIAL_REVIEW_LIMIT);
    container.innerHTML = previewItems.map(buildReviewCardHTML).join('');

    if (triggerWrap && triggerLabel) {
        triggerWrap.classList.remove('hidden');
        triggerLabel.textContent = `Xem tất cả đánh giá (${total})`;
    }

    lucide.createIcons();
}

function renderModalReviews() {
    const modalList = document.getElementById('modal-reviews-list');
    const filterBar = document.getElementById('modal-star-filters');
    const subtitle = document.getElementById('modal-subtitle-count');
    if (!modalList || !filterBar) return;

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    cachedReviews.forEach(item => {
        const star = Math.min(5, Math.max(1, Number(item.rating || 5)));
        counts[star] += 1;
    });

    const filters = [
        { key: 'all', label: `Tất cả (${cachedReviews.length})` },
        { key: '5', label: `5 ★ (${counts[5]})` },
        { key: '4', label: `4 ★ (${counts[4]})` },
        { key: '3', label: `3 ★ (${counts[3]})` },
        { key: '2', label: `2 ★ (${counts[2]})` },
        { key: '1', label: `1 ★ (${counts[1]})` }
    ];

    filterBar.innerHTML = filters.map(f => {
        const isActive = String(activeStarFilter) === f.key;
        const activeClass = isActive
            ? 'bg-[#14532D] text-white border-[#14532D] shadow-sm'
            : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#16A34A]';
        return `<button type="button" data-filter-star="${f.key}" class="modal-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${activeClass}">${f.label}</button>`;
    }).join('');

    filterBar.querySelectorAll('.modal-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeStarFilter = btn.getAttribute('data-filter-star');
            renderModalReviews();
        });
    });

    const filtered = activeStarFilter === 'all'
        ? cachedReviews
        : cachedReviews.filter(r => String(Number(r.rating || 5)) === String(activeStarFilter));

    if (subtitle) {
        subtitle.textContent = activeStarFilter === 'all'
            ? `Đang hiển thị toàn bộ ${filtered.length} lượt đánh giá`
            : `Đang lọc theo hạng ${activeStarFilter} sao (${filtered.length} lượt đánh giá)`;
    }

    if (!filtered.length) {
        modalList.innerHTML = `<div class="text-center py-12 text-sm text-[#64748B]">Chưa có đánh giá nào ở hạng ${activeStarFilter} sao.</div>`;
    } else {
        modalList.innerHTML = filtered.map(buildReviewCardHTML).join('');
    }

    lucide.createIcons();
}

function initReviewsModalControls() {
    const modal = document.getElementById('all-reviews-modal');
    const openBtn = document.getElementById('open-reviews-modal-btn');
    const closeBtn = document.getElementById('close-reviews-modal-btn');

    if (!modal || !openBtn) return;

    const openModal = () => {
        activeStarFilter = 'all';
        renderModalReviews();
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    openBtn.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);

    // Nhấn ra vùng bên ngoài khung Modal để đóng
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Nhấn phím ESC để đóng
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

async function submitReview(event) {
    event.preventDefault();
    if (!currentUser || !supabaseClient) {
        alert('Vui lòng đăng nhập Google trước khi gửi đánh giá!');
        return;
    }

    const rating = parseInt(document.getElementById('selected-rating')?.value || '5', 10);
    const comment = (document.getElementById('review-comment')?.value || '').trim();
    const selectedTags = [];
    document.querySelectorAll('.tag-chip.bg-\\[\\#14532D\\]').forEach(btn => {
        selectedTags.push(btn.getAttribute('data-tag'));
    });

    if (!comment) {
        alert('Vui lòng nhập lời nhận xét chi tiết!');
        return;
    }

    const newReview = {
        user_id: currentUser.id,
        user_name: currentUser.user_metadata?.full_name || 'Khách hàng',
        user_avatar: currentUser.user_metadata?.avatar_url || '',
        rating,
        tags: selectedTags,
        comment
    };

    const { error } = await supabaseClient.from('reviews').insert([newReview]);
    if (error) {
        alert('Lỗi khi gửi đánh giá: ' + error.message);
    } else {
        document.getElementById('review-comment').value = '';
        document.querySelectorAll('.tag-chip').forEach(btn => {
            btn.classList.remove('bg-[#14532D]', 'text-white', 'border-[#14532D]');
        });
        await fetchAndRenderReviews();
    }
}

function activateFallbackMode() {
    cachedReviews = window.GREENYO_DATA?.fallbackReviews || [];
    renderReviewsDashboard();
    const countElem = document.getElementById('total-reviews-count');
    if (countElem) {
        countElem.textContent = `Chế độ dự phòng (${cachedReviews.length} đánh giá mẫu)`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    initReviewsModalControls();
    document.getElementById('review-form')?.addEventListener('submit', submitReview);
});