import * as fs from "fs";
import * as path from "path";

import { ICUNumberConverting } from "./ICUNumberConverting"; // Assuming implementation exists
import { ICUMapping } from "./ICUMapping"; // Assuming implementation exists
import { ICUDictionary } from "./ICUDictionary"; // Assuming implementation exists

/* ================== PATH CONSTANTS ================== */

const BASE_DIR = __dirname;

const REGEX_FOLDER = path.join(BASE_DIR, "RegexRule");
const MAPPING_FOLDER = path.join(BASE_DIR, "Mapping");
const DICT_FOLDER = path.join(BASE_DIR, "Dict");

/* ================== ADDRESS ================== */

export class Address {
    private static readonly POLITICAL_DIVISION = 0;
    private static readonly STREET = 1;
    private static readonly OFFICE = 2;
    private static readonly CODENUMBER = 3;

    private readonly F_POLITICAL_DIVISION = "PoliticalDivision.txt";
    private readonly F_STREET = "Street.txt";
    private readonly F_OFFICE = "Office.txt";
    private readonly F_CODENUMBER = "Codenumber.txt";

    private patterns = new Map<number, string[]>();

    private converter!: ICUNumberConverting;
    private letterSound!: ICUMapping;
    private letterVN!: ICUMapping;
    private popularWord!: ICUDictionary;

    constructor() {
        this.initHelpers();

        this.loadPatterns(Address.POLITICAL_DIVISION, this.F_POLITICAL_DIVISION);
        this.loadPatterns(Address.STREET, this.F_STREET);
        this.loadPatterns(Address.OFFICE, this.F_OFFICE);
        this.loadPatterns(Address.CODENUMBER, this.F_CODENUMBER);
    }

    /* ========== INIT ========== */

    private initHelpers() {
        this.converter = new ICUNumberConverting(); // Assuming constructor exists

        this.letterVN = new ICUMapping();
        this.letterVN.loadMappingFile(
            path.join(MAPPING_FOLDER, "LetterSoundVN.txt")
        );

        this.letterSound = new ICUMapping();
        this.letterSound.loadMappingFile(
            path.join(MAPPING_FOLDER, "LetterSoundVN.txt")
        );
        this.letterSound.loadMappingFile(
            path.join(MAPPING_FOLDER, "Symbol.txt")
        );

        this.popularWord = new ICUDictionary();
        this.popularWord.loadDictFile(
            path.join(DICT_FOLDER, "Popular.txt")
        );
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
            return pattern.slice(4); // Remove '(?i)'
        }
        // If there are other inline modifiers, handle accordingly; for now, assume only (?i)
        return pattern;
    }

    /* ========== PUBLIC API ========== */

    public normalizeText(input: string): string {
        let preResult = input;
        let result = "";
        for (const [cat, regexPatterns] of this.patterns) {
            for (const pattern of regexPatterns) {
                try {
                    const re = new RegExp(pattern, "giu");
                    preResult = preResult.replace(re, (match, g1) => {
                        return " " + this.stringForReplace(cat, match, g1 ?? "") + " ";
                    });
                } catch (err) {
                    console.error(`[E] Error in pattern Address: "${pattern}"`);
                }
            }
        }
        return preResult.replace(/\s+/g, " ").trim();
    }

    /* ========== DISPATCH ========== */

    private stringForReplace(cat: number, match: string, p1: string): string {
        switch (cat) {
            case Address.POLITICAL_DIVISION:
                return this.regexPoliticalDivision(match, p1);
            case Address.STREET:
                return this.regexStreet(match, p1);
            case Address.OFFICE:
                return this.regexOffice(match, p1);
            case Address.CODENUMBER:
                return this.regexCodenumber(match);
            default:
                console.error(`[E] Invalid category: ${cat}`);
                return "";
        }
    }

    /* ========== HANDLERS ========== */

    private expandPrefixPD(prefix: string): string {
        prefix = prefix.toLowerCase();
        if (prefix === "kp") return "khu phố";
        else if (prefix === "q") return "quận";
        else if (prefix === "p") return "phường";
        else if (prefix === "h") return "huyện";
        else if (prefix === "tx") return "thị xã";
        else if (prefix === "tp") return "thành phố";
        else if (prefix === "x") return "xã";
        console.error(`[E] Invalid prefix to expand for political division: ${prefix}`);
        return "";
    }

    private regexPoliticalDivision(match: string, prefix: string): string {
        const expandPrefix = this.expandPrefixPD(prefix);
        const indexOfPoint = match.indexOf(".");
        if (indexOfPoint !== -1) {
            return expandPrefix + match.slice(indexOfPoint + 1);
        } else {
            return expandPrefix + match.slice(prefix.length);
        }
    }

    private regexStreet(match: string, prefix: string): string {
        const mainPart = match.slice(prefix.length);
        let continuousDigits = false;
        let result = "";
        let number = "";
        for (const c of mainPart) {
            const code = c.charCodeAt(0);
            if (48 <= code && code <= 57) {
                if (continuousDigits) {
                    number += c;
                } else {
                    if (code === 48) {
                        continuousDigits = false;
                        result += "không ";
                        number = "";
                    } else {
                        number = c;
                        continuousDigits = true;
                    }
                }
            } else if (c === "/") {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += this.converter.convertNumber(number) + " ";
                    number = "";
                }
                result += "xuyệt ";
            } else if (c === "-") {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += this.converter.convertNumber(number) + " ";
                    number = "";
                }
                // result += " , ";
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += this.converter.convertNumber(number) + " ";
                    number = "";
                }
                result += this.letterSound.mappingOf(c) + " ";
            }
        }
        if (number.length > 0) {
            result += this.converter.convertNumber(number);
        }
        return prefix + " " + result.trim();
    }

    private regexOffice(match: string, prefix: string): string {
        const mainPart = match.slice(prefix.length);
        let continuousDigits = false;
        let result = "";
        let number = "";
        for (const c of mainPart) {
            const code = c.charCodeAt(0);
            if (48 <= code && code <= 57) {
                if (continuousDigits) {
                    number += c;
                } else {
                    if (code === 48) {
                        continuousDigits = false;
                        result += "không ";
                        number = "";
                    } else {
                        number = c;
                        continuousDigits = true;
                    }
                }
            } else if (c === "/") {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += this.converter.convertNumber(number) + " ";
                    number = "";
                }
                result += " ";
            } else if (c === "-") {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += this.converter.convertNumber(number) + " ";
                    number = "";
                }
                // result += " , ";
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += this.converter.convertNumber(number) + " ";
                    number = "";
                }
                result += this.letterSound.mappingOf(c) + " ";
            }
        }
        if (number.length > 0) {
            result += this.converter.convertNumber(number);
        }
        return prefix + " " + result.trim();
    }

    private regexCodenumber(match: string): string {
        match = match.trim();
        let result = "";
        let number = "";
        let PopWord = "";
        let continuousDigits = false;
        let continuous_Lowercase_Popular = false;
        for (const c of match) {
            const code = c.charCodeAt(0);
            const ctm = c;
            if (48 <= code && code <= 57) {
                if (continuousDigits) {
                    number += c;
                } else {
                    if (code === 48) {
                        continuousDigits = false;
                        result += "không ";
                        number = "";
                    } else {
                        number = c;
                        continuousDigits = true;
                    }
                }
                if (continuous_Lowercase_Popular) {
                    continuous_Lowercase_Popular = false;
                    result += PopWord + " ";
                    PopWord = "";
                }
            } else if (this.letterVN.hasMappingOf(ctm)) {
                if (continuousDigits) {
                    continuousDigits = false;
                    if (number.length <= 4) {
                        result += this.converter.convertNumber(number) + " ";
                    } else {
                        for (const cn of number) {
                            result += this.converter.convertNumber(cn) + " ";
                        }
                    }
                    number = "";
                }
                if (continuous_Lowercase_Popular) {
                    PopWord += c;
                } else {
                    PopWord = c;
                    continuous_Lowercase_Popular = true;
                }
            } else if (c === "/") {
                if (continuousDigits) {
                    continuousDigits = false;
                    if (number.length <= 4) {
                        result += this.converter.convertNumber(number) + " ";
                    } else {
                        for (const cn of number) {
                            result += this.converter.convertNumber(cn) + " ";
                        }
                    }
                    number = "";
                }
                if (continuous_Lowercase_Popular) {
                    continuous_Lowercase_Popular = false;
                    result += PopWord + " ";
                    PopWord = "";
                }
                result += "xuyệt ";
            } else if (c === ".") {
                if (continuousDigits) {
                    continuousDigits = false;
                    if (number.length <= 4) {
                        result += this.converter.convertNumber(number) + " ";
                    } else {
                        for (const cn of number) {
                            result += this.converter.convertNumber(cn) + " ";
                        }
                    }
                    number = "";
                }
                if (continuous_Lowercase_Popular) {
                    continuous_Lowercase_Popular = false;
                    result += PopWord + " ";
                    PopWord = "";
                }
                result += "chấm ";
            } else if (c === "-") {
                if (continuousDigits) {
                    continuousDigits = false;
                    if (number.length <= 4) {
                        result += this.converter.convertNumber(number) + " ";
                    } else {
                        for (const cn of number) {
                            result += this.converter.convertNumber(cn) + " ";
                        }
                    }
                    number = "";
                }
                if (continuous_Lowercase_Popular) {
                    continuous_Lowercase_Popular = false;
                    result += PopWord + " ";
                    PopWord = "";
                }
                // result += " , ";
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    if (number.length <= 4) {
                        result += this.converter.convertNumber(number) + " ";
                    } else {
                        for (const cn of number) {
                            result += this.converter.convertNumber(cn) + " ";
                        }
                    }
                    number = "";
                }
                if (continuous_Lowercase_Popular) {
                    continuous_Lowercase_Popular = false;
                    result += PopWord + " ";
                    PopWord = "";
                }
                result += this.letterSound.mappingOf(c) + " ";
            }
        }
        if (number.length > 0) {
            if (number.length <= 4) {
                result += this.converter.convertNumber(number) + " ";
            } else {
                for (const cn of number) {
                    result += this.converter.convertNumber(cn) + " ";
                }
            }
        }
        if (PopWord.length > 0) {
            for (const cn of PopWord) {
                result += this.letterSound.mappingOf(cn) + " ";
            }
        }
        return result.trim();
    }
}