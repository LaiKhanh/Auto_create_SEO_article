import React, { useState } from 'react';
import './App.css'; // Giả sử bạn có CSS cho App
import InputForm from './components/InputForm';
import GeneratedContent from './components/GeneratedContent';
import PostStatus from './components/PostStatus';

function App() {
    const [generatedText, setGeneratedText] = useState('');
    const [postStatuses, setPostStatuses] = useState({
        wordpress: 'Not posted yet',
        facebook: 'Not posted yet',
        x: 'Not posted yet',
        linkedin: 'Not posted yet',
    });

    const handleGenerate = (title, keywords, imageFile) => {
        // Đây là nơi bạn sẽ gọi API hoặc xử lý logic tạo nội dung
        // Ví dụ đơn giản:
        const generated = `Tiêu đề: ${title}\nTừ khóa: ${keywords}\n\nĐây là nội dung được tạo tự động dựa trên thông tin bạn cung cấp. Nếu có hình ảnh, hình ảnh sẽ được xử lý ở đây.`;
        setGeneratedText(generated);

        // Giả lập trạng thái đăng bài sau khi generate
        setPostStatuses({
            wordpress: 'Post ready',
            facebook: 'Post ready',
            x: 'Post ready',
            linkedin: 'Post ready',
        });
    };

    const handlePostToPlatform = (platform) => {
        // Logic để đăng bài lên nền tảng cụ thể (ví dụ: gọi API)
        // Cập nhật trạng thái
        setPostStatuses(prevStatuses => ({
            ...prevStatuses,
            [platform]: 'Posting', // Hoặc 'Đã đăng'
        }));

        setTimeout(() => {
            setPostStatuses(prevStatuses => ({
                ...prevStatuses,
                [platform]: 'Posted successfully!',
            }));
            console.log(`Đã đăng bài lên ${platform}`);
        }, 2000); // Giả lập thời gian đăng bài
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Create SEO Article Automation</h1>
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
                    />
                </section>
            </main>
        </div>
    );
}

export default App;