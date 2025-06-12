require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Sử dụng node-fetch cho server-side fetch
const session = require('express-session'); // Để lưu trữ access token
const crypto = require('crypto'); // Để tạo state token

const app = express();
const PORT = process.env.PORT || 5000;

const WP_API_ENDPOINT = process.env.WP_API_ENDPOINT;
const WP_CLIENT_ID = process.env.WP_CLIENT_ID;
const WP_CLIENT_SECRET = process.env.WP_CLIENT_SECRET;
const WP_REDIRECT_URI = process.env.WP_REDIRECT_URI; // Redirect URI của backend

// Kiểm tra biến môi trường
if (!WP_API_ENDPOINT || !WP_CLIENT_ID || !WP_CLIENT_SECRET || !WP_REDIRECT_URI) {
    console.error("Lỗi: Thiếu các biến môi trường cần thiết cho OAuth.");
    console.error("Vui lòng tạo hoặc kiểm tra file .env trong thư mục gốc của backend server.");
    process.exit(1);
}

// Cấu hình session (cần thiết để lưu trữ access token)
// Trong production, bạn sẽ cần một store an toàn hơn (ví dụ: connect-mongo, connect-redis)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        // secure: true // Đảm bảo cookie chỉ gửi qua HTTPS (nếu URL Codespaces là HTTPS)
        // secure: process.env.NODE_ENV === 'production' ? true : false, // Hoặc kiểm tra NODE_ENV
        secure: true, // Thử đặt luôn là true vì Codespaces dùng HTTPS
        sameSite: 'None', // Cho phép gửi cookie cross-site
        // domain: '.app.github.dev', // Tùy chọn: Thử đặt domain cho cookie (thay thế bằng domain gốc của Codespaces nếu cần)
        // httpOnly: true, // Khuyến nghị: Ngăn truy cập cookie từ JavaScript phía client
    }
}));

// Cấu hình CORS
const corsOptions = {
    origin: 'https://legendary-train-j7qv6jp45j6fj5w7-3000.app.github.dev', // Đảm bảo khớp với origin của React app của bạn
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
};
app.use(cors(corsOptions));
app.use(express.json());

// --- OAuth Flow Endpoints ---

// 1. Endpoint khởi tạo OAuth (được gọi từ frontend)
app.get('/auth/wordpress', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex'); // Tạo một state token để chống CSRF
    req.session.oauthState = state; // Lưu state vào session

    const authUrl = `https://public-api.wordpress.com/oauth2/authorize?` +
                    `client_id=${WP_CLIENT_ID}&` +
                    `redirect_uri=${encodeURIComponent(WP_REDIRECT_URI)}&` +
                    `response_type=code&` +
                    `scope=global&` + // Yêu cầu quyền truy cập cơ bản. Thêm 'edit' nếu cần.
                    `state=${state}`;
    res.json({ authUrl: authUrl }); // Trả về URL ủy quyền cho frontend
});

// 2. Callback URL mà WordPress.com sẽ chuyển hướng đến sau khi ủy quyền
app.get('/auth/callback', async (req, res) => {
    const { code, state } = req.query;

    // Kiểm tra state token để chống CSRF
    if (!state || state !== req.session.oauthState) {
        return res.status(400).send('State mismatch or missing. Possible CSRF attack.');
    }
    delete req.session.oauthState; // Xóa state sau khi dùng

    if (!code) {
        return res.status(400).send('Authorization code not received.');
    }

    try {
        // Gửi yêu cầu trao đổi code lấy access token
        const tokenResponse = await fetch('https://public-api.wordpress.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: WP_CLIENT_ID,
                client_secret: WP_CLIENT_SECRET,
                redirect_uri: WP_REDIRECT_URI,
                grant_type: 'authorization_code',
                code: code,
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Lỗi khi trao đổi code lấy token:', errorData);
            return res.status(tokenResponse.status).send(`Lỗi OAuth: ${errorData.error_description || errorData.error}`);
        }

        const tokenData = await tokenResponse.json();
        // Lưu access token và refresh token vào session
        req.session.accessToken = tokenData.access_token;
        req.session.refreshToken = tokenData.refresh_token;
        req.session.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000); // Thời điểm hết hạn

        console.log('Đã nhận access token và refresh token thành công.');
        // Chuyển hướng người dùng về frontend, có thể kèm theo thông báo thành công
        // THAY THẾ 'http://localhost:3000' bằng URL gốc của React app của bạn
        res.redirect('https://legendary-train-j7qv6jp45j6fj5w7-3000.app.github.dev/?oauth_success=true');

    } catch (error) {
        console.error('Lỗi trong quá trình OAuth callback:', error);
        res.status(500).send('Internal server error during OAuth process.');
    }
});

// 3. Endpoint để kiểm tra trạng thái đăng nhập OAuth và lấy thông tin token (tùy chọn)
app.get('/auth/status', (req, res) => {
    if (req.session.accessToken) {
        res.json({ isAuthenticated: true, username: req.session.username, tokenExpiresAt: req.session.tokenExpiresAt });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Endpoint proxy để đăng bài lên WordPress (Đã cập nhật để dùng access token)
app.post('/api/wordpress/posts', async (req, res) => {
    if (!req.session.accessToken) {
        return res.status(401).json({ error: 'Chưa được xác thực. Vui lòng đăng nhập WordPress trước.' });
    }

    // Kiểm tra và làm mới token nếu cần
    if (Date.now() >= req.session.tokenExpiresAt - (5 * 60 * 1000) && req.session.refreshToken) { // Làm mới 5 phút trước khi hết hạn
        console.log('Access token sắp hết hạn. Đang làm mới...');
        try {
            const refreshResponse = await fetch('https://public-api.wordpress.com/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: WP_CLIENT_ID,
                    client_secret: WP_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: req.session.refreshToken,
                }),
            });
            const refreshData = await refreshResponse.json();
            if (!refreshResponse.ok) {
                console.error('Lỗi khi làm mới token:', refreshData);
                throw new Error('Không thể làm mới token.');
            }
            req.session.accessToken = refreshData.access_token;
            req.session.refreshToken = refreshData.refresh_token || req.session.refreshToken; // Refresh token có thể không đổi
            req.session.tokenExpiresAt = Date.now() + (refreshData.expires_in * 1000);
            console.log('Access token đã được làm mới.');
        } catch (err) {
            console.error('Không thể làm mới access token:', err);
            // Có thể cần yêu cầu người dùng đăng nhập lại
            req.session.destroy(); // Xóa session
            return res.status(401).json({ error: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
        }
    }


    try {
        const { title, content, status = 'publish' } = req.body;

        // Gửi yêu cầu POST tới WordPress API từ server backend, sử dụng Access Token
        const wordpressResponse = await fetch(`${WP_API_ENDPOINT}/sites/${req.session.blogId}/posts/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.session.accessToken}`, // Sử dụng Bearer token
            },
            body: JSON.stringify({
                title: title,
                content: content,
                status: status,
            }),
        });

        if (!wordpressResponse.ok) {
            const errorData = await wordpressResponse.json();
            console.error('Lỗi từ WordPress API (post):', errorData);
            return res.status(wordpressResponse.status).json({
                error: 'Failed to post to WordPress',
                details: errorData.message || 'Unknown error from WordPress'
            });
        }

        const data = await wordpressResponse.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý request proxy:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Endpoint để lấy ID của blog sau khi đăng nhập (quan trọng cho API WordPress.com)
app.get('/auth/get-blog-id', async (req, res) => {
    if (!req.session.accessToken) {
        return res.status(401).json({ error: 'Chưa xác thực OAuth.' });
    }
    if (req.session.blogId) {
        return res.json({ blogId: req.session.blogId });
    }

    try {
        const userInfoResponse = await fetch(`${WP_API_ENDPOINT}/me`, {
            headers: {
                'Authorization': `Bearer ${req.session.accessToken}`,
            },
        });
        const userInfo = await userInfoResponse.json();
        if (!userInfoResponse.ok) {
            console.error('Lỗi khi lấy thông tin người dùng:', userInfo);
            throw new Error(userInfo.message || 'Không thể lấy thông tin người dùng.');
        }

        if (userInfo.primary_blog) {
            req.session.blogId = userInfo.primary_blog; // Lưu blog ID vào session
            res.json({ blogId: userInfo.primary_blog });
        } else {
            res.status(404).json({ error: 'Không tìm thấy blog chính.' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy blog ID:', error);
        res.status(500).json({ error: 'Internal server error while fetching blog ID.' });
    }
});


app.listen(PORT, () => {
    console.log(`Proxy server đang chạy trên cổng ${PORT}`);
    console.log(`Endpoint khởi tạo OAuth: /auth/wordpress`);
    console.log(`Callback URL OAuth: /auth/callback`);
    console.log(`Endpoint đăng bài: /api/wordpress/posts`);
});