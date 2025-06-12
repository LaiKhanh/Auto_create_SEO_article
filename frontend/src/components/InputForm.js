import React, { useState } from 'react';
import '../styles/InputForm.css'; // Giả sử bạn có CSS cho InputForm

function InputForm({ onGenerate }) {
    const [title, setTitle] = useState('');
    const [keywords, setKeywords] = useState('');
    const [image, setImage] = useState(null); // Lưu trữ File object

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate(title, keywords, image);
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    return (
        <div className="input-form-container">
            <h2>Article information</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Input title..."
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="keywords">SEO words (seperated by commas):</label>
                    <input
                        type="text"
                        id="keywords"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="example: react, javascript, frontend"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="image">Choose image:</label>
                    <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {image && <p>Images chosen: {image.name}</p>}
                </div>
                <button type="submit" className="generate-button">Generate</button>
            </form>
        </div>
    );
}

export default InputForm;