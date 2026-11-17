const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Phục vụ các tệp tĩnh (HTML, CSS, JS, hình ảnh) trong thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// API an toàn cung cấp cấu hình Supabase cho Frontend
app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    });
});

app.listen(PORT, () => {
    console.log(`🚀 GreenYo Web Server đang chạy tại: http://localhost:${PORT}`);
});