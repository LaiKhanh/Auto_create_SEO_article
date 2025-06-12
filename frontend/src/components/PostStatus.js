import React from 'react';
import '../styles/PostStatus.css'; // Giả sử bạn có CSS cho PostStatus

function PostStatus({ statuses, onPost }) {
    return (
        <div className="post-status-container">
            <h2>Post status</h2>
            <div className="platform-status">
                <div className="platform-item">
                    <span>WordPress:</span>
                    <span className={`status-text ${statuses.wordpress === 'Posted successfully!' ? 'success' : ''}`}>
                        {statuses.wordpress}
                    </span>
                    {statuses.wordpress === 'Post ready' && (
                        <button onClick={() => onPost('wordpress')}>Post on WordPress</button>
                    )}
                </div>
                <div className="platform-item">
                    <span>Facebook:</span>
                    <span className={`status-text ${statuses.facebook === 'Posted successfully!' ? 'success' : ''}`}>
                        {statuses.facebook}
                    </span>
                    {statuses.facebook === 'Post ready' && (
                        <button onClick={() => onPost('facebook')}>Post on facebook</button>
                    )}
                </div>
                <div className="platform-item">
                    <span>X (Twitter):</span>
                    <span className={`status-text ${statuses.x === 'Posted successfully!' ? 'success' : ''}`}>
                        {statuses.x}
                    </span>
                    {statuses.x === 'Post ready' && (
                        <button onClick={() => onPost('x')}>Post on X</button>
                    )}
                </div>
                <div className="platform-item">
                    <span>LinkedIn:</span>
                    <span className={`status-text ${statuses.linkedin === 'Posted successfully!' ? 'success' : ''}`}>
                        {statuses.linkedin}
                    </span>
                    {statuses.linkedin === 'Post ready' && (
                        <button onClick={() => onPost('linkedin')}>Post on LinkedIn</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PostStatus;