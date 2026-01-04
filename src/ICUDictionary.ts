// ICUDictionary.ts
import * as fs from 'fs';

export class ICUDictionary {
    private dict: Set<string> = new Set();
    private dictName: string = '';

    constructor() {}

    loadDictFile(name: string): boolean {
        this.dictName = name;
        let content: string;
        try {
            content = fs.readFileSync(name, 'utf8');
        } catch (e) {
            console.error(`[E] Cannot load file ${name} for dictionary`);
            return false;
        }
        const lines = content.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (line) {
                this.dict.add(line);
            }
        }
        // console.log(`[L] Add words to dictionary ${name} successfully`);
        return true;
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