import React from 'react';
import '../styles/GeneratedContent.css'; // Giả sử bạn có CSS cho GeneratedContent

function GeneratedContent({ content }) {
    return (
        <div className="generated-content-container">
            <h2>Generated content</h2>
            {content ? (
                <textarea
                    className="content-textarea"
                    value={content}
                    readOnly
                    rows="15"
                />
            ) : (
                <p>Nội dung được tạo sẽ hiển thị ở đây sau khi bạn nhấn "Generate".</p>
            )}
        </div>
    );
}

export default GeneratedContent;