// Math.ts (Sửa để sử dụng dữ liệu JSON thay vì fs)
import { ICUHelper } from "./ICUHelper";
import { ICUNumberConverting } from "./ICUNumberConverting";
import { ICUMapping } from "./ICUMapping";

export class MathNormalizer {
    private static readonly MEASUREMENT = 0;
    private static readonly MEASUREMENT_1 = 1;
    private static readonly ROMAN_NUMBER = 2;
    private static readonly NORMAL_NUMBER = 3;

    private patterns = new Map<number, string[]>();

    private converter!: ICUNumberConverting;
    private unitBaseMapping!: ICUMapping;
    private unitCurrencyMapping!: ICUMapping;

    constructor(
        romanNumberPatterns: string[],
        measurementPatterns: string[],
        measurement1Patterns: string[],
        normalNumberPatterns: string[],
        baseUnitData: Record<string, string>,
        currencyUnitData: Record<string, string>
    ) {
        this.converter = new ICUNumberConverting();

        this.unitBaseMapping = new ICUMapping();
        this.unitBaseMapping.loadMappingData("BaseUnit", baseUnitData);

        this.unitCurrencyMapping = new ICUMapping();
        this.unitCurrencyMapping.loadMappingData("CurrencyUnit", currencyUnitData);

        this.loadPatterns(MathNormalizer.MEASUREMENT, measurementPatterns);
        this.loadPatterns(MathNormalizer.MEASUREMENT_1, measurement1Patterns);
        this.loadPatterns(MathNormalizer.ROMAN_NUMBER, romanNumberPatterns);
        this.loadPatterns(MathNormalizer.NORMAL_NUMBER, normalNumberPatterns);
    }

    private loadPatterns(category: number, patterns: string[]): void {
        const processedPatterns = patterns.map((pattern) => this.processPattern(pattern));
        this.patterns.set(category, processedPatterns);
    }

    private processPattern(pattern: string): string {
        // Remove (?i) or similar inline flags since JS doesn't support them in the pattern
        // Assume all start with (?i), strip it and use 'i' flag later when compiling RegExp
        if (pattern.startsWith('(?i)')) {
            pattern = pattern.slice(4); // Remove '(?i)'
        }
        // Fix unnecessary escape for % which causes error with 'u' flag
        pattern = pattern.replace(/\\%/g, '%');

        pattern = pattern.replace(/\\-/g, '-');

        return pattern;
    }

    public normalizeText(input: string): string {
        let preResult = input;

        const entries = Array.from(this.patterns.entries());
        // Xử lý theo category trước, index sau  
        for (const [cat, regexPatterns] of entries) {
            for (let noPattern = 0; noPattern < regexPatterns.length; noPattern++) {
                const pattern = regexPatterns[noPattern];
                if (!pattern) continue;

                try {
                    const re = new RegExp(pattern, "giu");
                    preResult = preResult.replace(re, (match, ...groups) => {
                        const replaceString = this.stringForReplace(
                            cat,
                            match,
                            groups,
                            noPattern
                        );
                        if (replaceString !== "") {
                            return " " + replaceString.trim() + " ";
                        }
                        return match;
                    });
                } catch (err) {
                    console.error(`[E] Error in pattern ${cat}: "${pattern}"`);
                }
            }
        }

        return preResult.replace(/\s+/g, " ").trim();
    }

    private stringForReplace(cat: number, match: string, groups: string[], noPattern: number): string {
        switch (cat) {
            case MathNormalizer.ROMAN_NUMBER:
                return this.regexRomanNumber(match);
            case MathNormalizer.MEASUREMENT:
                return this.localHandleMeasurement(groups, true, noPattern);
            case MathNormalizer.MEASUREMENT_1:
                return this.localHandleMeasurement(groups, false, noPattern);
            case MathNormalizer.NORMAL_NUMBER:
                return this.regexNormalNumber(match, groups, noPattern);
            default:
                console.error(`[E] Invalid category: ${cat}`);
                return "";
        }
    }

    private regexRomanNumber(match: string): string {
        const romanPattern = /[vixmdlVIXMDL]{1,5}/giu;
        const result = match.replace(romanPattern, (r) => this.converter.romanToDecimal(r));
        return result;
    }

    private regexNormalNumber(match: string, groups: string[], noPattern: number): string {
        let sign = "";
        const g1 = groups[0] || "";
        if (g1.trim() === "-") {
            sign = "trừ ";
        }
        let numberStr = match;
        if (sign) {
            numberStr = match.replace(/^-/, "").trim();
        }
        const mode = (noPattern === 0 || noPattern === 2) ? 0 : 1;
        return sign + ICUHelper.readNumber(numberStr, mode);
    }

    private localHandleMeasurement(groups: string[], useBaseUnit: boolean, noPattern: number): string {

        const number = (groups[0] || "").trim();
        const unit = (groups[1] || "").trim();
        const unit2 = (groups[2] || "").trim();
        const g4 = (groups[3] || "").trim();
        const next = g4 === "-" ? "đến" : "";
        let mapping: ICUMapping;

        let point = 2; // auto
        if (number.includes(".")) point = 1;
        else if (number.includes(",")) point = 0;

        if (useBaseUnit) {
            mapping = this.unitBaseMapping;
            if (!mapping.hasMappingOf(unit)) {
                return "";
            }
            let result = ICUHelper.readNumber(number, point) + " " + mapping.mappingOf(unit) + " ";
            if (unit2) {
                if (!mapping.hasMappingOf(unit2)) {
                    return "";
                }
                result += "trên " + mapping.mappingOf(unit2) + " ";
            }
            if (next) {
                result += next + " ";
            }
            return result;
        } else {
            mapping = this.unitCurrencyMapping;
            let result = ICUHelper.readNumber(number, point) + " ";
            if (unit) {
                if (!mapping.hasMappingOf(unit)) {
                    result += next + " ";
                } else {
                    result += mapping.mappingOf(unit) + " " + next + " ";
                }
            } else {
                result += next + " ";
            }
            return result;
        }
    }
}