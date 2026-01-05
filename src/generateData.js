const fs = require('fs');
const path = require('path');

const TARGET_FOLDERS = ['Dict', 'Mapping', 'RegexRule'];
const OUTPUT_BASE_DIR = path.join(__dirname, 'assets_data');

if (!fs.existsSync(OUTPUT_BASE_DIR)) fs.mkdirSync(OUTPUT_BASE_DIR);

function readFileSmart(filePath) {
    const buffer = fs.readFileSync(filePath);
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) return buffer.subarray(2).toString('utf16le');
    return buffer.toString('utf8');
}

TARGET_FOLDERS.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    const outFolder = path.join(OUTPUT_BASE_DIR, folder);
    if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder);

    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            if (!file.endsWith('.txt')) return;
            
            let content = readFileSmart(path.join(folderPath, file));
            content = content.replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).filter(l => l);

            let data;
            if (folder === 'Mapping') {
                data = {};
                content.forEach(line => {
                    const idx = line.indexOf('#');
                    if (idx !== -1) data[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
                });
            } else {
                data = content;
            }

            const outFileName = file.replace('.txt', '.json');
            fs.writeFileSync(path.join(outFolder, outFileName), JSON.stringify(data, null, 2), 'utf8');
            console.log(`Converted: ${file} -> ${outFileName}`);
        });
    }
});