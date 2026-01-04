import * as fs from 'fs';
import * as path from 'path';
import { TextNormalizer } from '../src/TextNormalizer';
import { Address } from '../src/Address';
import { DateTime } from '../src/DateTime';
import { Math } from '../src/Math';

async function processFullTest() {
    const inputPath = path.join(process.cwd(), 'input.txt');
    const outputPath = path.join(process.cwd(), 'output.txt');

    // Kiểm tra file đầu vào
    if (!fs.existsSync(inputPath)) {
        console.error("❌ Không tìm thấy file input.txt");
        return;
    }

    // 1. Khởi tạo bộ chuẩn hóa chính (đã chứa SpecialCase, Dict, Mapping)
    const normalizer = new TextNormalizer();
    
    // 2. Khởi tạo các bộ lọc Regex bổ sung
    const addressFilter = new Address();
    const dateFilter = new DateTime();
    const mathFilter = new Math();
    // const specialCaseFilter = new SpecialCase();

    try {
        const rawText = fs.readFileSync(inputPath, 'utf-8');
        const lines = rawText.split('\n');
        const processedLines: string[] = [];

        console.log("🚀 Đang bắt đầu chuẩn hóa...");

        for (let line of lines) {
            let result = line.trim();
            if (!result) continue;

            /**
             * QUY TRÌNH CHUẨN HÓA (Thứ tự tối ưu):
             * B1: Xử lý các quy tắc toán học, đơn vị đo lường
             * B2: Xử lý ngày tháng, thời gian
             * B3: Xử lý địa chỉ, số nhà
             * B4: Chạy qua TextNormalizer để xử lý Từ điển, Viết tắt, Teencode và Âm tiết
             */

            // Bước 1: Math
            // result = mathFilter.normalizeText(result);
            
            // // Bước 2: DateTime
            // result = dateFilter.normalizeText(result);
            

            // // Bước 3: Address
            // result = addressFilter.normalizeText(result);

            // Bước 4: Core Normalizer (Xử lý từ điển, chữ cái, ký hiệu...)
            // Truyền các flag options như code C++ gốc (-lower, -punc...)
            // result = result.toLocaleLowerCase();
            result = normalizer.normalize(result, { 
                lower: true, 
                punc: false, 
                unknown: false 
            });

                // Bước 5: Special Cases bổ sung
                // result = specialCaseFilter.normalizeText(result);
            processedLines.push(result);
        }

        // 3. Ghi kết quả ra file, ngăn cách dòng bằng #line# nếu muốn giống C++
        // Hoặc dùng \n để dễ đọc
        fs.writeFileSync(outputPath, processedLines.join('\n'), 'utf-8');

        console.log("-----------------------------------------");
        console.log("✅ KẾT QUẢ CHUẨN HÓA:");
        console.log("-----------------------------------------");
        console.log(processedLines.slice(0, 10).join('\n')); // In thử 10 dòng đầu
        if (processedLines.length > 10) console.log("...");
        console.log("-----------------------------------------");
        console.log(`📍 Tổng cộng: ${processedLines.length} dòng.`);
        console.log("📂 Đã lưu tại: output.txt");

    } catch (error) {
        console.error("❌ Lỗi trong quá trình xử lý:", error);
    }
}

// Chạy ứng dụng
processFullTest();