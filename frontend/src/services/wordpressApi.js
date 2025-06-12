var WPAPI = require( 'wpapi' );

const WP_API_CONFIG = {
    endpoint: process.env.REACT_APP_WP_ENDPOINT,
    username: process.env.REACT_APP_WP_USERNAME,
    password: process.env.REACT_APP_WP_PASSWORD,
};
const PROXY_API_ENDPOINT = process.env.REACT_APP_PROXY_API_ENDPOINT;

/**
 * Đăng một bài viết mới lên WordPress.
 * @param {string} title - Tiêu đề bài viết.
 * @param {string} content - Nội dung bài viết (có thể chứa HTML).
 * @param {string} [status='publish'] - Trạng thái của bài viết ('publish', 'draft', 'pending', etc.).
 * @returns {Promise<object>} - Một Promise giải quyết với đối tượng bài viết đã tạo từ API.
 */
export const createWordPressPost = async (title, content, status = 'publish') => {
    try {
        const response = await fetch(PROXY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // KHÔNG còn gửi Authorization header từ frontend nữa
            },
            body: JSON.stringify({
                title: title,
                content: content,
                status: status,
            }),
        });
        // var wp = new WPAPI({
        //     endpoint: "https://khanhllm.wordpress.com/wp-json",
        //     // This assumes you are using basic auth, as described further below
        //     username: WP_API_CONFIG.username,
        //     password: WP_API_CONFIG.password
        // });
        // const response = await wp.posts().create({
        //     // "title" and "content" are the only required properties
        //     title: 'Your Post Title',
        //     content: 'Your post content',
        //     // Post will be created as a draft by default if a specific "status"
        //     // is not specified
        //     status: 'publish'
        // }).then(function( response ) {
        //     // "response" will hold all properties of your newly-created post,
        //     // including the unique `id` the post was assigned on creation
        //     console.log( response.id );
        // })

        // Kiểm tra nếu response không OK (ví dụ: lỗi 401 Unauthorized, 403 Forbidden, 500 Internal Server Error)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Lỗi khi đăng bài lên WordPress: ${response.status} - ${errorData.message || 'Lỗi không xác định'}`);
        }

        const data = await response.json();
        console.log('Bài viết WordPress đã được tạo:', data);
        return data; // Trả về thông tin bài viết đã tạo
    } catch (error) {
        console.error('Không thể đăng bài lên WordPress:', error);
        throw error; // Ném lỗi để có thể xử lý ở nơi gọi hàm
    }
};