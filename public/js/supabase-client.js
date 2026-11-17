let supabaseClient = null;
let currentUser = null;

// Khởi tạo kết nối Supabase thông qua API an toàn từ server Express
async function initSupabase() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (config.supabaseUrl && config.supabaseAnonKey) {
            supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
            console.log("✅ Kết nối Supabase thành công!");
            
            // Kiểm tra trạng thái đăng nhập hiện tại
            const { data: { session } } = await supabaseClient.auth.getSession();
            updateAuthState(session?.user || null);

            // Lắng nghe thay đổi trạng thái đăng nhập Google OAuth
            supabaseClient.auth.onAuthStateChange((event, session) => {
                updateAuthState(session?.user || null);
            });

            // Tải danh sách đánh giá từ cơ sở dữ liệu
            fetchAndRenderReviews();
        } else {
            console.warn("⚠️ Không tìm thấy cấu hình Supabase, kích hoạt chế độ Fallback.");
            activateFallbackMode();
        }
    } catch (error) {
        console.error("❌ Lỗi khởi tạo Supabase:", error);
        activateFallbackMode();
    }
}

// Cập nhật giao diện theo trạng thái đăng nhập
function updateAuthState(user) {
    currentUser = user;
    const authContainer = document.getElementById('auth-container');
    const reviewForm = document.getElementById('review-form');
    const loginPrompt = document.getElementById('login-prompt');

    if (user) {
        // Đã đăng nhập Google
        const userName = user.user_metadata?.full_name || user.email;
        const userAvatar = user.user_metadata?.avatar_url || 'https://via.placeholder.com/40';

        authContainer.innerHTML = `
            <div class="flex items-center space-x-2">
                <img src="${userAvatar}" alt="Avatar" class="w-8 h-8 rounded-full border border-[#16A34A]">
                <span class="hidden md:inline text-xs font-bold text-[#14532D]">${userName}</span>
                <button id="logout-btn" class="text-xs font-semibold text-red-600 hover:underline ml-2">Đăng xuất</button>
            </div>
        `;

        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload();
        });

        if (reviewForm && loginPrompt) {
            loginPrompt.classList.add('hidden');
            reviewForm.classList.remove('hidden');
            document.getElementById('user-avatar-preview').src = userAvatar;
            document.getElementById('user-name-preview').textContent = userName;
        }
    } else {
        // Chưa đăng nhập
        authContainer.innerHTML = `
            <button id="login-google-btn" class="flex items-center space-x-2 bg-white border border-[#E2E8F0] hover:border-[#16A34A] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#1E293B] shadow-sm transition">
                <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.2v3.14C3.17 21.36 7.28 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.61H1.2C.44 8.14 0 9.87 0 11.75s.44 3.61 1.2 5.14l4.08-2.64z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.28 0 3.17 2.64 1.2 6.61l4.08 3.14c.95-2.84 3.6-4.95 6.72-4.95z"/></svg>
                <span>Đăng nhập Google</span>
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

// Xử lý chuyển hướng đăng nhập Google OAuth
async function handleGoogleLogin() {
    if (!supabaseClient) {
        alert('Hệ thống chưa kết nối cơ sở dữ liệu. Vui lòng kiểm tra lại cấu hình!');
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

// Tải danh sách đánh giá từ bảng reviews trên Supabase
async function fetchAndRenderReviews() {
    const container = document.getElementById('reviews-list');
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Chưa có bảng reviews hoặc lỗi truy vấn, kích hoạt Fallback:', error.message);
            activateFallbackMode();
            return;
        }

        renderReviewsData(data || []);
    } catch (err) {
        console.warn('Lỗi kết nối bảng reviews, dùng dữ liệu mẫu.');
        activateFallbackMode();
    }
}

// Render đánh giá ra HTML kèm tính điểm sao trung bình
function renderReviewsData(reviewsList) {
    const container = document.getElementById('reviews-list');
    const avgValElem = document.getElementById('avg-rating-val');
    const countElem = document.getElementById('total-reviews-count');

    if (!container) return;

    if (reviewsList.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-sm text-[#64748B] soft-card rounded-2xl">Chưa có đánh giá nào. Hãy là người đầu tiên gửi đánh giá!</div>`;
        if (avgValElem) avgValElem.textContent = "5.0";
        if (countElem) countElem.textContent = "Dựa trên 0 lượt đánh giá";
        return;
    }

    // Tính điểm trung bình
    let totalScore = 0;
    reviewsList.forEach(r => totalScore += r.rating);
    const avgScore = (totalScore / reviewsList.length).toFixed(1);
    if (avgValElem) avgValElem.textContent = avgScore;
    if (countElem) countElem.textContent = `Dựa trên ${reviewsList.length} lượt đánh giá xác thực`;

    container.innerHTML = reviewsList.map(r => {
        const starsHtml = '<i data-lucide="star" class="w-4 h-4 fill-current text-[#D97706]"></i>'.repeat(r.rating);
        const tagsHtml = (r.tags || []).map(t => `<span class="px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] text-[10px] font-semibold rounded">${t}</span>`).join('');
        const dateStr = new Date(r.created_at).toLocaleDateString('vi-VN');

        return `
            <div class="soft-card rounded-2xl p-5 space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <img src="${r.user_avatar || 'https://via.placeholder.com/40'}" alt="Avatar" class="w-10 h-10 rounded-full border">
                        <div>
                            <h4 class="text-sm font-bold text-[#1E293B]">${r.user_name}</h4>
                            <span class="text-[11px] text-[#64748B]">${dateStr}</span>
                        </div>
                    </div>
                    <div class="flex space-x-0.5">${starsHtml}</div>
                </div>
                ${tagsHtml ? `<div class="flex flex-wrap gap-1.5">${tagsHtml}</div>` : ''}
                <p class="text-sm text-[#1E293B]">${r.comment || ''}</p>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// Gửi đánh giá mới lên Supabase
async function submitReview(event) {
    event.preventDefault();
    if (!currentUser) {
        alert('Vui lòng đăng nhập Google trước khi gửi đánh giá!');
        return;
    }

    const rating = parseInt(document.getElementById('selected-rating').value);
    const comment = document.getElementById('review-comment').value.trim();
    
    // Thu thập các thẻ cảm nhận nhanh được chọn
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
        rating: rating,
        tags: selectedTags,
        comment: comment
    };

    const { error } = await supabaseClient.from('reviews').insert([newReview]);

    if (error) {
        alert('Lỗi khi gửi đánh giá: ' + error.message);
    } else {
        alert('Cảm ơn bạn đã gửi đánh giá thành công!');
        document.getElementById('review-comment').value = '';
        fetchAndRenderReviews();
    }
}

// Chế độ dự phòng khi mất kết nối
function activateFallbackMode() {
    const fallback = window.GREENYO_DATA.fallbackReviews || [];
    renderReviewsData(fallback);
    const countElem = document.getElementById('total-reviews-count');
    if (countElem) countElem.textContent = "Chế độ ngoại tuyến (Hiển thị đánh giá mẫu)";
}

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    document.getElementById('review-form')?.addEventListener('submit', submitReview);
});