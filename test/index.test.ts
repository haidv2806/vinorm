import * as fs from "fs";
import * as path from "path";

// 👉 dùng normalizer đã build sẵn
import TextNormalizer from "../src/index";

async function processFullTest() {
    const inputPath = path.join(process.cwd(), "input.txt");
    const outputPath = path.join(process.cwd(), "output.txt");

    if (!fs.existsSync(inputPath)) {
        console.error("❌ Không tìm thấy file input.txt");
        return;
    }

    try {
        const rawText = fs.readFileSync(inputPath, "utf-8");
        const lines = rawText.split("\n");
        const processedLines: string[] = [];

        console.log("🚀 Đang bắt đầu chuẩn hóa...");

        for (const line of lines) {
            let result = line.trim();
            if (!result) continue;

            result = TextNormalizer.normalize(result, {
                lower: true,
                punc: false,
                unknown: false,
            });

            processedLines.push(result);
        }

        fs.writeFileSync(outputPath, processedLines.join("\n"), "utf-8");

        console.log("-----------------------------------------");
        console.log("✅ KẾT QUẢ CHUẨN HÓA:");
        console.log("-----------------------------------------");
        console.log(processedLines.slice(0, 10).join("\n"));
        if (processedLines.length > 10) console.log("...");
        console.log("-----------------------------------------");
        console.log(`📍 Tổng cộng: ${processedLines.length} dòng.`);
        console.log("📂 Đã lưu tại: output.txt");
    } catch (error) {
        console.error("❌ Lỗi trong quá trình xử lý:", error);
    }
}

// CLI entry
processFullTest();