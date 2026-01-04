import * as path from "path";
import * as fs from "fs";
import { ICUHelper } from "./ICUHelper";
import { ICUNumberConverting } from "./ICUNumberConverting";
import { ICUMapping } from "./ICUMapping";

const BASE_DIR = __dirname;
const REGEX_FOLDER = path.join(BASE_DIR, "RegexRule");
const MAPPING_FOLDER = path.join(BASE_DIR, "Mapping");

export class Math {
    private static readonly ROMAN_NUMBER = 0;
    private static readonly MEASUREMENT = 1;
    private static readonly MEASUREMENT_1 = 2;
    private static readonly NORMAL_NUMBER = 3;

    private readonly F_ROMAN_NUMBER = "RomanNumber.txt";
    private readonly F_MEASUREMENT = "Measurement.txt";
    private readonly F_MEASUREMENT_1 = "Measurement_1.txt";
    private readonly F_NORMAL_NUMBER = "NormalNumber.txt";

    private patterns = new Map<number, string[]>();

    private converter!: ICUNumberConverting;
    private unitBaseMapping!: ICUMapping;
    private unitCurrencyMapping!: ICUMapping;

    constructor() {
        this.converter = new ICUNumberConverting();

        this.unitBaseMapping = new ICUMapping();
        this.unitBaseMapping.loadMappingFile(path.join(MAPPING_FOLDER, "BaseUnit.txt"));

        this.unitCurrencyMapping = new ICUMapping();
        this.unitCurrencyMapping.loadMappingFile(path.join(MAPPING_FOLDER, "CurrencyUnit.txt"));

        this.loadPatterns(Math.ROMAN_NUMBER, this.F_ROMAN_NUMBER);
        this.loadPatterns(Math.MEASUREMENT, this.F_MEASUREMENT);
        this.loadPatterns(Math.MEASUREMENT_1, this.F_MEASUREMENT_1);
        this.loadPatterns(Math.NORMAL_NUMBER, this.F_NORMAL_NUMBER);
    }

    private loadPatterns(category: number, filename: string): void {
        const file = path.join(REGEX_FOLDER, filename);
        try {
            const content = fs.readFileSync(file, "utf8");
            const lines = content
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0);
            const processedPatterns = lines.map((pattern) => this.processPattern(pattern));
            this.patterns.set(category, processedPatterns);
        } catch (err) {
            console.error(`[E] Error reading pattern file: ${filename}`);
        }
    }

    private processPattern(pattern: string): string {
        // Remove (?i) or similar inline flags since JS doesn't support them in the pattern
        // Assume all start with (?i), strip it and use 'i' flag later when compiling RegExp
        if (pattern.startsWith('(?i)')) {
            pattern = pattern.slice(4); // Remove '(?i)'
        }
        // If there are other inline modifiers, handle accordingly; for now, assume only (?i)
        
        // Fix unnecessary escape for % which causes error with 'u' flag
        pattern = pattern.replace(/\\%/g, '%');
        
        return pattern;
    }

    public normalizeText(input: string): string {
        let preResult = input;
        for (const [cat, regexPatterns] of this.patterns) {
            let noPattern = 0;
            for (const pattern of regexPatterns || []) {
                try {
                    const re = new RegExp(pattern, "giu");
                    preResult = preResult.replace(re, (match, ...groups) => {
                        const replaceString = this.stringForReplace(cat, match, groups, noPattern);
                        if (replaceString !== "") {
                            return " " + replaceString + " ";
                        }
                        return match;
                    });
                } catch (err) {
                    console.error(`[E] Error in pattern Math: "${pattern}"`);
                }
                noPattern++;
            }
        }
        return preResult.replace(/\s+/g, " ").trim();
    }

    private stringForReplace(cat: number, match: string, groups: string[], noPattern: number): string {
        switch (cat) {
            case Math.ROMAN_NUMBER:
                return this.regexRomanNumber(match);
            case Math.MEASUREMENT:
                return this.localHandleMeasurement(groups, true, noPattern);
            case Math.MEASUREMENT_1:
                return this.localHandleMeasurement(groups, false, noPattern);
            case Math.NORMAL_NUMBER:
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
        const point = (noPattern === 1 || noPattern === 3) ? 1 : 0;
        const number = (groups[0] || "").trim();
        const unit = (groups[1] || "").trim();
        const unit2 = (groups[2] || "").trim();
        const g4 = (groups[3] || "").trim();
        const next = g4 === "-" ? "đến" : "";
        let mapping: ICUMapping;

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