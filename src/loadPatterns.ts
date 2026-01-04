import * as fs from 'fs';
import * as path from 'path';

/**
 * Chuẩn hóa Regex từ định dạng ICU/General sang định dạng JavaScript tương thích Unicode
 */
function normalizePatternForJS(pattern: string): string {
    return pattern
        .replace(/^\(\?i\)/, '') // Xóa flag case-insensitive ở đầu (sẽ dùng flag 'i' của JS sau)
        // Thay \b bằng cách mô phỏng word boundary không dính ký tự (S = non-whitespace)
        // Sử dụng Lookbehind và Lookahead để không tiêu tốn ký tự (zero-width)
        .replace(/\\b/g, '(?<!\\S)(?!\\S)')
        // Chuẩn hóa các cụm bắt đầu dòng/ranh giới từ
        .replace(/\(\?:\\b\|\^\)/g, '(?:^|[\\s\\p{P}\\p{S}])')
        // Chuẩn hóa các cụm kết thúc dòng/ranh giới từ
        .replace(/\(\?:\\b\|\\$\)/g, '(?:[\\s\\p{P}\\p{S}]|$)');
}

/**
 * Hàm tải và chuẩn hóa các Regex patterns từ file .txt
 */
export default function loadPatterns(folderPath: string, filename: string): string[] {
    const filePath = path.join(folderPath, filename);

    if (!fs.existsSync(filePath)) {
        console.warn(`[!] Không tìm thấy file pattern: ${filePath}`);
        return [];
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        return content.split('\n')
            .map(line => line.trim())
            // Loại bỏ dòng trống và dòng comment bắt đầu bằng #
            .filter(line => line.length > 0 && !line.startsWith('#'))
            .map(line => {
                // Áp dụng hàm chuẩn hóa logic cao cấp thay vì replace thủ công đơn giản
                return normalizePatternForJS(line);
            });
    } catch (error) {
        console.error(`[E] Lỗi khi đọc file ${filename}:`, error);
        return [];
    }
}