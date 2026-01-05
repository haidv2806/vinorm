import * as fs from 'fs';
import * as path from 'path';
import { TextNormalizer } from '../src/native/TextNormalizer';
import { Address } from '../src/native/Address';
import { DateTime } from '../src/native/DateTime';
import { MathNormalizer } from '../src/native/MathNormalizer';
function loadJSON<T>(p: string): T {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
}
async function processFullTest() {
    const inputPath = path.join(process.cwd(), 'input.txt');
    const outputPath = path.join(process.cwd(), 'output.txt');

    // Kiểm tra file đầu vào
    if (!fs.existsSync(inputPath)) {
        console.error("❌ Không tìm thấy file input.txt");
        return;
    }

    const DATA_DIR = path.join(process.cwd(), 'data');

    const normalizer = new TextNormalizer({
        acronymsShorten: loadJSON(path.join(DATA_DIR, 'Mapping/Acronyms.json')),
        teencode: loadJSON(path.join(DATA_DIR, 'Mapping/Teencode.json')),
        symbol: loadJSON(path.join(DATA_DIR, 'Mapping/Symbol.json')),
        letterSoundVN: loadJSON(path.join(DATA_DIR, 'Mapping/LetterSoundVN.json')),
        letterSoundEN: loadJSON(path.join(DATA_DIR, 'Mapping/LetterSoundEN.json')),
        popular: loadJSON(path.join(DATA_DIR, 'Dict/Popular.json')),

        phoneNumberPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/PhoneNumber.json')),
        footballUnderPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/FootballUnder.json')),
        footballOtherPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/FootballOther.json')),
        websitePatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Website.json')),
        emailPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Email.json')),
        number: loadJSON(path.join(DATA_DIR, 'Mapping/Number.json')),

        timePatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Time.json')),
        date1Patterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Date_1.json')),
        dateFromTo1Patterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Date_From_To_1.json')),
        dateFromTo2Patterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Date_From_To_2.json')),
        monthPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Month.json')),
        date3Patterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Date_3.json')),
        date2Patterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Date_2.json')),

        romanNumberPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/NormalNumber.json')),
        measurementPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/measurement.json')),
        measurement1Patterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Measurement_1.json')),
        normalNumberPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/NormalNumber.json')),
        baseUnit: loadJSON(path.join(DATA_DIR, 'Mapping/BaseUnit.json')),
        currencyUnit: loadJSON(path.join(DATA_DIR, 'Mapping/CurrencyUnit.json')),

        politicalDivisionPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/PoliticalDivision.json')),
        streetPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Street.json')),
        officePatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/Office.json')),
        codeNumberPatterns: loadJSON(path.join(DATA_DIR, 'RegexRule/CodeNumber.json')),
    });

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