import * as fs from "fs";
import * as path from "path";

// Assuming ConvertingNumber is defined elsewhere, imported if necessary
import { ICUNumberConverting } from "./ICUNumberConverting";
// Also assuming ICUHelper equivalent, perhaps integrate into ConvertingNumber or implement isNumberLiteral and readNumber

const BASE_DIR = __dirname;
const REGEX_FOLDER = path.join(BASE_DIR, "RegexRule");

export class DateTime {
    private static readonly TIME = 0;
    private static readonly DATE_1 = 1;
    private static readonly DATE_FROM_TO_1 = 2;
    private static readonly DATE_FROM_TO_2 = 3;
    private static readonly MONTH = 4;
    private static readonly DATE_3 = 5;
    private static readonly DATE_2 = 6;

    private patterns: Map<number, string[]> = new Map();

    constructor() {
        this.load(DateTime.TIME, "Time.txt");
        this.load(DateTime.DATE_1, "Date_1.txt");
        this.load(DateTime.DATE_FROM_TO_1, "Date_From_To_1.txt");
        this.load(DateTime.DATE_FROM_TO_2, "Date_From_To_2.txt");
        this.load(DateTime.MONTH, "Month.txt");
        this.load(DateTime.DATE_3, "Date_3.txt");
        this.load(DateTime.DATE_2, "Date_2.txt");
    }

    private load(categories: number, filename: string) {
        const file = path.join(REGEX_FOLDER, filename);
        try {
            const content = fs.readFileSync(file, "utf8");
            const lines = content
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0);

            const processedPatterns = lines.map((pattern) => this.processPattern(pattern));
            this.patterns.set(categories, processedPatterns);
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

    public normalizeText(input: string): string {
        let preResult = input;
        for (const [categ, regexPatterns] of this.patterns.entries()) {
            for (const pattern of regexPatterns) {
                try {
                    const regex = new RegExp(pattern, "gi");
                    preResult = preResult.replace(regex, (match, ...groups: any[]) => {
                        // groups includes all captured groups, offset and source are last two
                        const matchArray = [match, ...groups.slice(0, groups.length - 2)];
                        return " " + this.stringForReplace(categ, matchArray) + " ";
                    });
                } catch (err) {
                    console.error(`[E] Error in pattern DateTime: ${pattern}`);
                }
            }
        }
        return preResult.replace(/\s+/g, " ").trim();
    }

    private stringForReplace(categories: number, matchArray: string[]): string {
        switch (categories) {
            case DateTime.TIME:
                return this.regexTime(matchArray);
            case DateTime.DATE_1:
                return this.regexDate1(matchArray);
            case DateTime.DATE_FROM_TO_1:
                return this.regexDateFromTo1(matchArray);
            case DateTime.DATE_FROM_TO_2:
                return this.regexDateFromTo2(matchArray);
            case DateTime.MONTH:
                return this.regexMonth(matchArray);
            case DateTime.DATE_3:
                return this.regexDate3(matchArray);
            case DateTime.DATE_2:
                return this.regexDate2(matchArray);
            default:
                console.error(`[E] Invalid category: ${categories}`);
                return "";
        }
    }

    private regexTime(matchArray: string[]): string {
        let match = matchArray[0].toLowerCase();
        let next = (matchArray[1] || "").trim();
        let result = "";
        let number = "";
        let continuousDigits = false;
        const converter = new ICUNumberConverting();
        for (const c of match) {
            if (c >= "0" && c <= "9") {
                if (continuousDigits) {
                    number += c;
                } else {
                    number = c;
                    continuousDigits = true;
                }
            } else if (c === "h" || c === "g" || c === ":") {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number) + " ";
                    number = "";
                }
                result += "giờ ";
            } else if (c === "a") {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number) + " ";
                    number = "";
                }
                result += "ây em ";
            } else if (c === "p") {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number) + " ";
                    number = "";
                }
                result += "bi em ";
            } else if (c === "m") {
                // skipped
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number) + " ";
                    number = "";
                }
                result += c;
            }
        }
        if (number.length > 0) {
            result += " " + converter.convertNumber(number) + " ";
        }
        if (next === "-") {
            result += "đến ";
        }
        return result;
    }

    private regexDate1(matchArray: string[]): string {
        let match = matchArray[0].toLowerCase();
        let result = "";
        let number = "";
        let continuousDigits = false;
        const converter = new ICUNumberConverting();
        let checkDate = 1;
        for (const c of match) {
            if (c >= "0" && c <= "9") {
                if (continuousDigits) {
                    number += c;
                } else {
                    number = c;
                    continuousDigits = true;
                }
            } else if (c === "/" || c === "." || c === "-") {
                if (checkDate === 1) {
                    checkDate++;
                    continuousDigits = false;
                    result += converter.convertNumber(number);
                    number = "";
                } else if (checkDate === 2) {
                    result += " tháng ";
                    checkDate++;
                    continuousDigits = false;
                    result += converter.convertNumber(number);
                    number = "";
                }
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number);
                    number = "";
                }
                result += c;
            }
        }
        result += " năm " + converter.convertNumber(number);
        return result;
    }

    private regexDateFromTo1(matchArray: string[]): string {
        let match = matchArray[0].toLowerCase();
        let result = "";
        let number = "";
        let continuousDigits = false;
        const converter = new ICUNumberConverting();
        for (const c of match) {
            if (c >= "0" && c <= "9") {
                if (continuousDigits) {
                    number += c;
                } else {
                    number = c;
                    continuousDigits = true;
                }
            } else if (c === "/" || c === ".") {
                continuousDigits = false;
                result += converter.convertNumber(number);
                result += " tháng ";
                number = "";
            } else if (c === "-") {
                continuousDigits = false;
                result += converter.convertNumber(number);
                result += " đến ";
                number = "";
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number);
                    number = "";
                }
                result += c;
            }
        }
        result += converter.convertNumber(number);
        return result;
    }

    private regexDateFromTo2(matchArray: string[]): string {
        let match = matchArray[0].toLowerCase();
        let result = "";
        let number = "";
        let continuousDigits = false;
        const converter = new ICUNumberConverting();
        for (const c of match) {
            if (c >= "0" && c <= "9") {
                if (continuousDigits) {
                    number += c;
                } else {
                    number = c;
                    continuousDigits = true;
                }
            } else if (c === "/" || c === ".") {
                continuousDigits = false;
                result += converter.convertNumber(number);
                result += " năm ";
                number = "";
            } else if (c === "-") {
                continuousDigits = false;
                result += converter.convertNumber(number);
                result += " đến tháng ";
                number = "";
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number);
                    number = "";
                }
                result += c;
            }
        }
        result += converter.convertNumber(number);
        return result;
    }

    private regexMonth(matchArray: string[]): string {
        let match = matchArray[0].toLowerCase();
        let result = "";
        let number = "";
        let continuousDigits = false;
        const converter = new ICUNumberConverting();
        for (const c of match) {
            if (c >= "0" && c <= "9") {
                if (continuousDigits) {
                    number += c;
                } else {
                    number = c;
                    continuousDigits = true;
                }
            } else if (c === "/" || c === "." || c === "-") {
                continuousDigits = false;
                result += converter.convertNumber(number);
                result += " năm ";
                number = "";
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number);
                    number = "";
                }
                result += c;
            }
        }
        result += converter.convertNumber(number);
        return result;
    }

    private regexDate3(matchArray: string[]): string {
        let match = matchArray[0].toLowerCase();
        let result = "";
        let number = "";
        let continuousDigits = false;
        const converter = new ICUNumberConverting();
        for (const c of match) {
            if (c >= "0" && c <= "9") {
                if (continuousDigits) {
                    number += c;
                } else {
                    number = c;
                    continuousDigits = true;
                }
            } else if (c === "/" || c === "." || c === "-") {
                continuousDigits = false;
                result += converter.convertNumber(number);
                result += " tháng ";
                number = "";
            } else {
                if (continuousDigits) {
                    continuousDigits = false;
                    result += converter.convertNumber(number);
                    number = "";
                }
                result += c;
            }
        }
        result += converter.convertNumber(number);
        return result;
    }

    private regexDate2(matchArray: string[]): string {
        const converter = new ICUNumberConverting();
        let result = "";
        let match = matchArray[0];
        let romanPart = matchArray[1] || "";
        let yearPart = matchArray[2] || "";
        let checkRoman = converter.romanToDecimal(romanPart);
        // Assuming ICUHelper.isNumberLiteral is equivalent to checking if it's a numeric string
        // and ICUHelper.readNumber(checkRoman, 0) is similar to converter.convertNumber(checkRoman)
        if (checkRoman !== romanPart && /^\d+$/.test(checkRoman)) {
            result += " " + converter.convertNumber(checkRoman) + " ";
        }
        return result + "năm " + converter.convertNumber(yearPart);
    }
}