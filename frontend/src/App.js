import React, { useState, useEffect } from 'react';
import './App.css';
import InputForm from './components/InputForm';
import GeneratedContent from './components/GeneratedContent';
import PostStatus from './components/PostStatus';

// Không cần import createWordPressPost trực tiếp ở đây nữa
// Chúng ta sẽ thêm một hàm riêng để xử lý việc đăng bài qua proxy
// Thay vì import createWordPressPost, chúng ta sẽ viết lại logic gọi proxy
// import { createWordPressPost } from './api/wordpressApi'; // Xóa dòng này

function App() {
    const [generatedText, setGeneratedText] = useState('');
    const [inputTitle, setInputTitle] = useState('');
    const [postStatuses, setPostStatuses] = useState(
        JSON.parse(localStorage.getItem('postStatuses')) || { // Thử lấy từ localStorage
            wordpress: 'Chưa đăng',
            facebook: 'Chưa đăng',
            x: 'Chưa đăng',
            linkedin: 'Chưa đăng',
        }
    );
    const [isLoggedInWP, setIsLoggedInWP] = useState(false);
    const [wpBlogId, setWpBlogId] = useState(null);
    const [oauthMessage, setOauthMessage] = useState(''); // Để hiển thị thông báo OAuth

    // URL của proxy server (từ .env của React app)
    const PROXY_SERVER_BASE_URL = process.env.REACT_APP_PROXY_API_ENDPOINT.replace('/api/wordpress/posts', '');

    const checkOAuthStatus = async () => {
        try {
            const response = await fetch(`${PROXY_SERVER_BASE_URL}/auth/status`);
            const data = await response.json();
            if (data.isAuthenticated) {
                setIsLoggedInWP(true);
                setOauthMessage('Đã đăng nhập WordPress.');
                // Lấy blog ID sau khi đăng nhập
                const blogIdResponse = await fetch(`${PROXY_SERVER_BASE_URL}/auth/get-blog-id`);
                const blogIdData = await blogIdResponse.json();
                if (blogIdResponse.ok && blogIdData.blogId) {
                    setWpBlogId(blogIdData.blogId);
                } else {
                    setOauthMessage('Đã đăng nhập WordPress nhưng không thể lấy Blog ID.');
                }
            } else {
                setIsLoggedInWP(false);
                setOauthMessage('Chưa đăng nhập WordPress.');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái OAuth:', error);
            setOauthMessage('Không thể kết nối đến server xác thực.');
            setIsLoggedInWP(false);
        }
    };

    // Kiểm tra trạng thái OAuth khi component mount
    useEffect(() => {
        const checkOAuthStatus = async () => {
            try {
                const response = await fetch(`${PROXY_SERVER_BASE_URL}/auth/status`);
                const data = await response.json();
                if (data.isAuthenticated) {
                    setIsLoggedInWP(true);
                    setOauthMessage('Đã đăng nhập WordPress.');
                    // Lấy blog ID sau khi đăng nhập
                    const blogIdResponse = await fetch(`${PROXY_SERVER_BASE_URL}/auth/get-blog-id`);
                    const blogIdData = await blogIdResponse.json();
                    if (blogIdResponse.ok && blogIdData.blogId) {
                        setWpBlogId(blogIdData.blogId);
                    } else {
                        setOauthMessage('Đã đăng nhập WordPress nhưng không thể lấy Blog ID.');
                    }
                } else {
                    setIsLoggedInWP(false);
                    setOauthMessage('Chưa đăng nhập WordPress.');
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra trạng thái OAuth:', error);
                setOauthMessage('Không thể kết nối đến server xác thực.');
                setIsLoggedInWP(false);
            }
        };

        checkOAuthStatus();

        // Xử lý callback từ OAuth nếu có (khi được chuyển hướng về từ WordPress.com)
        const params = new URLSearchParams(window.location.search);
        if (params.get('oauth_success') === 'true') {
            setOauthMessage('Xác thực WordPress thành công!');
            window.history.replaceState({}, document.title, window.location.pathname); // Xóa query params
        }
    }, [PROXY_SERVER_BASE_URL]);

    // Lưu trạng thái đăng bài vào localStorage
    useEffect(() => {
        localStorage.setItem('postStatuses', JSON.stringify(postStatuses));
    }, [postStatuses]);


    const handleGenerate = (title, keywords, imageFile) => {
        setInputTitle(title);
        const generated = `Tiêu đề: ${title}\nTừ khóa: ${keywords}\n\nĐây là nội dung được tạo tự động dựa trên thông tin bạn cung cấp. Nếu có hình ảnh, hình ảnh sẽ được xử lý ở đây.`;
        setGeneratedText(generated);
        setPostStatuses({
            wordpress: 'Sẵn sàng đăng',
            facebook: 'Sẵn sàng đăng',
            x: 'Sẵn sàng đăng',
            linkedin: 'Sẵn sàng đăng',
        });
    };

    const handleUpdatePostStatus = (platform, newStatus) => {
        setPostStatuses(prevStatuses => ({
            ...prevStatuses,
            [platform]: newStatus,
        }));
    };

    // Hàm mới để xử lý đăng bài WordPress thông qua proxy
    const postToWordPressProxy = async (title, content) => {
        handleUpdatePostStatus('wordpress', 'Đang đăng...');
        try {
            if (!isLoggedInWP) {
                throw new Error('Chưa đăng nhập WordPress. Vui lòng đăng nhập trước.');
            }
            if (!wpBlogId) {
                throw new Error('Không có Blog ID. Vui lòng thử đăng nhập lại.');
            }
            if (!content || content.trim() === '') {
                throw new Error('Không có nội dung để đăng lên WordPress.');
            }

            // Gọi endpoint proxy đã được xác thực
            const response = await fetch(`${PROXY_SERVER_BASE_URL}/api/wordpress/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    content: content,
                    status: 'publish', // Hoặc 'draft'
                    blogId: wpBlogId, // Truyền blog ID qua proxy (nếu cần)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Lỗi từ Proxy Server: ${response.status} - ${errorData.details || 'Lỗi không xác định'}`);
            }

            const data = await response.json();
            console.log('Đã đăng bài lên WordPress thành công:', data);
            handleUpdatePostStatus('wordpress', 'Đã đăng thành công!');
        } catch (error) {
            console.error('Lỗi khi đăng bài lên WordPress:', error);
            handleUpdatePostStatus('wordpress', `Lỗi: ${error.message}`);
        }
    };

    const handlePostToPlatform = async (platform) => {
        if (platform === 'wordpress') {
            await postToWordPressProxy(inputTitle, generatedText);
        } else {
            handleUpdatePostStatus(platform, 'Đang đăng...');
            setTimeout(() => {
                handleUpdatePostStatus(platform, 'Đã đăng thành công!');
                console.log(`Đã đăng bài lên ${platform}`);
            }, 2000);
        }
    };

    // Hàm để bắt đầu luồng OAuth
    const startOAuthFlow = async () => {
        try {
            const response = await fetch(`${PROXY_SERVER_BASE_URL}/auth/wordpress`);
            const data = await response.json();
            if (data.authUrl) {
                // Thay vì window.location.href, sử dụng window.open
                // window.location.href = data.authUrl; // Dòng cũ
                
                // Mở trong một tab mới
                const oauthWindow = window.open(data.authUrl, '_blank', 'noopener,noreferrer');
                
                // Tùy chọn: Theo dõi cửa sổ pop-up (phức tạp hơn nhưng tốt cho UX)
                // Bạn có thể thiết lập một setInterval để kiểm tra xem cửa sổ đã đóng chưa
                // và sau đó kiểm tra trạng thái đăng nhập lại
                // const checkOAuthWindow = setInterval(async () => {
                //     if (oauthWindow.closed) {
                //         clearInterval(checkOAuthWindow);
                //         console.log('Cửa sổ OAuth đã đóng. Kiểm tra lại trạng thái đăng nhập...');
                //         // Gọi lại hàm kiểm tra trạng thái sau khi cửa sổ đóng
                //         await checkOAuthStatus(); 
                //     }
                // }, 1000); // Kiểm tra mỗi giây

            } else {
                setOauthMessage('Không thể lấy URL xác thực từ proxy.');
            }
        } catch (error) {
            console.error('Lỗi khi khởi tạo OAuth:', error);
            setOauthMessage('Không thể kết nối đến proxy server để khởi tạo OAuth.');
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Công Cụ Tạo và Đăng Bài</h1>
            </header>
            <main className="App-main">
                <section className="input-section">
                    <InputForm onGenerate={handleGenerate} />
                </section>
                <section className="generated-content-section">
                    <GeneratedContent content={generatedText} />
                </section>
                <section className="post-status-section">
                    <PostStatus
                        statuses={postStatuses}
                        onPost={handlePostToPlatform}
                        generatedContent={generatedText}
                        inputTitle={inputTitle}
                        isLoggedInWP={isLoggedInWP} // Truyền trạng thái đăng nhập
                        oauthMessage={oauthMessage} // Truyền thông báo OAuth
                        onStartOAuth={startOAuthFlow} // Truyền hàm khởi tạo OAuth
                    />
                </section>
            </main>
            <footer className="App-footer">
                <p>&copy; 2025 Công cụ của bạn</p>
            </footer>
        </div>
    );
}

export default App;