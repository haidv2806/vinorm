// ICUMapping.ts
import * as fs from 'fs';

export class ICUMapping {
    private mapping: Map<string, string> = new Map();
    private mappingName: string = '';

    constructor() {}

    loadMappingFile(name: string): boolean {
        this.mappingName = name;
        let content: string;
        try {
            content = fs.readFileSync(name, 'utf8');
        } catch (e) {
            console.error(`[E] Cannot load file ${name} for mapping`);
            return false;
        }
        const lines = content.split('\n');
        for (let line of lines) {
            const separatorPosition = line.indexOf('#');
            if (separatorPosition !== -1) {
                let unit = line.substring(0, separatorPosition).trim();
                let pronoun = line.substring(separatorPosition + 1).trim();
                this.mapping.set(unit, pronoun);
            }
        }
        // console.log(`[L] Add words to map ${name} successfully`);
        return true;
    }

    mappingOf(unit: string): string {
        let unitTrim = unit.trim();
        if (unitTrim.length === 0) return unit;

        // Try original first
        if (this.mapping.has(unitTrim)) {
            return this.mapping.get(unitTrim)!;
        }
        if (this.mappingName === 'Mapping/Teencode.txt') {
            let upperCase = unitTrim.toUpperCase();
            if (unitTrim === upperCase) {
                return '';
            }
        }
        // Try lowerized
        unitTrim = unitTrim.toLowerCase();
        
        if (this.mapping.has(unitTrim)) {
            return this.mapping.get(unitTrim)!;
        }
        // console.log(`[L] Word not found in mapping ${this.mappingName} : ${unit}`);
        return '';
    }

    hasMappingOf(input: string): boolean {
        let word = input.trim();
        if (this.mapping.has(word)) return true;

        if (this.mappingName === 'Mapping/Teencode.txt') {
            let upperCase = word.toUpperCase();
            if (word === upperCase) {
                return false;
            }
        }

        word = word.toLowerCase();
        return this.mapping.has(word);
    }

    clearMapping(): void {
        this.mapping.clear();
    }

    unitTest(): void {
        for (let [key, value] of this.mapping) {
            console.log(`${key} ----- ${value}`);
        }
    }
}