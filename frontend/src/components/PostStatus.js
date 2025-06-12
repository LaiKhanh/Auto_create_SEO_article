import React from 'react';
import '../styles/PostStatus.css';

function PostStatus({ statuses, onPost, generatedContent, isLoggedInWP, oauthMessage, onStartOAuth }) {
    const handlePostToPlatform = async (platform) => {
        // Kiểm tra xem đã đăng nhập WP chưa nếu là WordPress
        if (platform === 'wordpress' && !isLoggedInWP) {
            alert('Vui lòng đăng nhập WordPress trước khi đăng bài.');
            return;
        }
        onPost(platform); // Gọi hàm onPost từ App.js
    };

    return (
        <div className="post-status-container">
            <h2>Trạng Thái Đăng Bài</h2>
            <div className="platform-status">
                <div className="platform-item">
                    <span>WordPress:</span>
                    <span className={`status-text ${statuses.wordpress === 'Đã đăng thành công!' ? 'success' : ''}`}>
                        {statuses.wordpress}
                    </span>
                    {!isLoggedInWP ? (
                        <button onClick={onStartOAuth} className="login-button">
                            Đăng nhập WordPress
                        </button>
                    ) : (
                        (generatedContent && generatedContent.trim() !== '' && !statuses.wordpress.includes('Đã đăng')) && (
                            <button onClick={() => handlePostToPlatform('wordpress')}
                                    disabled={statuses.wordpress.includes('Đang đăng')}>
                                Đăng lên WP
                            </button>
                        )
                    )}
                </div>
                <div className="oauth-message">
                    {oauthMessage && <p>{oauthMessage}</p>}
                </div>
                {/* Các nền tảng khác giữ nguyên */}
                <div className="platform-item">
                    <span>Facebook:</span>
                    <span className={`status-text ${statuses.facebook === 'Đã đăng thành công!' ? 'success' : ''}`}>
                        {statuses.facebook}
                    </span>
                    {(generatedContent && generatedContent.trim() !== '' && !statuses.facebook.includes('Đã đăng')) && (
                        <button onClick={() => handlePostToPlatform('facebook')}
                                disabled={statuses.facebook.includes('Đang đăng')}>
                            Đăng lên FB
                        </button>
                    )}
                </div>
                <div className="platform-item">
                    <span>X (Twitter):</span>
                    <span className={`status-text ${statuses.x === 'Đã đăng thành công!' ? 'success' : ''}`}>
                        {statuses.x}
                    </span>
                    {(generatedContent && generatedContent.trim() !== '' && !statuses.x.includes('Đã đăng')) && (
                        <button onClick={() => handlePostToPlatform('x')}
                                disabled={statuses.x.includes('Đang đăng')}>
                            Đăng lên X
                        </button>
                    )}
                </div>
                <div className="platform-item">
                    <span>LinkedIn:</span>
                    <span className={`status-text ${statuses.linkedin === 'Đã đăng thành công!' ? 'success' : ''}`}>
                        {statuses.linkedin}
                    </span>
                    {(generatedContent && generatedContent.trim() !== '' && !statuses.linkedin.includes('Đã đăng')) && (
                        <button onClick={() => handlePostToPlatform('linkedin')}
                                disabled={statuses.linkedin.includes('Đang đăng')}>
                            Đăng lên LI
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PostStatus;