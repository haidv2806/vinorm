// ICUDictionary.ts (Sửa để sử dụng dữ liệu JSON thay vì fs)
export class ICUDictionary {
    private dict: Set<string> = new Set();
    private dictName: string = '';

    constructor() {}

    // Thay vì load từ file, load từ array JSON
    loadDictData(name: string, data: string[]): boolean {
        this.dictName = name;
        try {
            data.forEach((line) => {
                const trimmed = line.trim();
                if (trimmed) {
                    this.dict.add(trimmed);
                }
            });
            // console.log(`[L] Add words to dictionary ${name} successfully`);
            return true;
        } catch (e) {
            console.error(`[E] Cannot load data for dictionary ${name}`);
            return false;
        }
    }

    hasWord(input: string): boolean {
        let word = input.trim();
        // Check original word
        if (this.dict.has(word)) return true;
        // If original word does not exist in dictionary
        // Try to lowerize the word and recheck
        word = word.toLowerCase();
        return this.dict.has(word);
    }

    clearDict(): void {
        this.dict.clear();
    }

    unitTest(): void {
        for (let w of this.dict) {
            console.log(w);
        }
    }
}