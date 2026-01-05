// Address.ts (Sửa để sử dụng dữ liệu JSON thay vì fs)
import { ICUNumberConverting } from "./ICUNumberConverting";
import { ICUMapping } from "./ICUMapping";
import { ICUDictionary } from "./ICUDictionary";

export class Address {
    private static readonly POLITICAL_DIVISION = 0;
    private static readonly STREET = 1;
    private static readonly OFFICE = 2;
    private static readonly CODENUMBER = 3;

    private patterns = new Map<number, string[]>();

    private converter!: ICUNumberConverting;
    private letterSound!: ICUMapping;
    private letterVN!: ICUMapping;
    private popularWord!: ICUDictionary;

    constructor(
        politicalDivisionPatterns: string[],
        streetPatterns: string[],
        officePatterns: string[],
        codeNumberPatterns: string[],
        letterSoundVNData: Record<string, string>,
        letterVNSoundData: Record<string, string>, // Giả sử là LetterSoundVN.txt, nhưng có thể trùng
        popularData: string[],
        symbolData?: Record<string, string> // Thêm optional để load symbol nếu cần
    ) {
        this.converter = new ICUNumberConverting();

        this.letterVN = new ICUMapping();
        this.letterVN.loadMappingData("LetterSoundVN", letterVNSoundData);

        this.letterSound = new ICUMapping();
        this.letterSound.loadMappingData("LetterSoundVN", letterSoundVNData);
        if (symbolData) {
            this.letterSound.loadMappingData("Symbol", symbolData); // Load thêm symbol như C++
        }

        this.popularWord = new ICUDictionary();
        this.popularWord.loadDictData("Popular", popularData);

        this.patterns = new Map<number, string[]>([
            [Address.POLITICAL_DIVISION, politicalDivisionPatterns.map(p => this.processPattern(p))],
            [Address.STREET, streetPatterns.map(p => this.processPattern(p))],
            [Address.OFFICE, officePatterns.map(p => this.processPattern(p))],
            [Address.CODENUMBER, codeNumberPatterns.map(p => this.processPattern(p))]
        ]);
    }

    private loadPatterns(category: number, patterns: string[]): void {
        const processedPatterns = patterns.map((pattern) => this.processPattern(pattern));
        this.patterns.set(category, processedPatterns);
    }

    private processPattern(pattern: string): string {
        if (pattern.startsWith('(?i)')) {
            return pattern.slice(4);
        }
        return pattern;
    }

    public normalizeText(input: string): string {
        let preResult = input;
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
            return expandPrefix + " " + match.slice(indexOfPoint + 1);
        } else {
            return expandPrefix + " " + match.slice(prefix.length);
        }
    }

    private regexStreet(match: string, prefix: string): string {
        const mainPart = match.slice(prefix.length);
        let continuousDigits = false;
        let result = "";
        let number = "";
        for (const c of mainPart) {
            const code = c.charCodeAt(0);
            if (48 <= code && code <= 57) { // '0' to '9'
                if (continuousDigits) {
                    number += c;
                } else {
                    if (code === 48) { // '0'
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
            if (48 <= code && code <= 57) { // '0' to '9'
                if (continuousDigits) {
                    number += c;
                } else {
                    if (code === 48) { // '0'
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