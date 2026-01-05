// ICUMapping.ts (Sửa để sử dụng dữ liệu JSON thay vì fs)
export class ICUMapping {
    private mapping: Map<string, string> = new Map();
    private mappingName: string = '';

    constructor() {}

    // Thay vì load từ file, load từ object JSON
    loadMappingData(name: string, data: Record<string, string>): boolean {
        this.mappingName = name;
        try {
            Object.entries(data).forEach(([key, value]) => {
                this.mapping.set(key.trim(), value.trim());
            });
            // console.log(`[L] Add words to map ${name} successfully`);
            return true;
        } catch (e) {
            console.error(`[E] Cannot load data for mapping ${name}`);
            return false;
        }
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