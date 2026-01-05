// DateTime.ts (Sửa để sử dụng dữ liệu JSON thay vì fs)
import { ICUNumberConverting } from "./ICUNumberConverting";
import { ICUHelper } from "./ICUHelper";

export class DateTime {
    private static readonly TIME = 0;
    private static readonly DATE_1 = 1;
    private static readonly DATE_FROM_TO_1 = 2;
    private static readonly DATE_FROM_TO_2 = 3;
    private static readonly MONTH = 4;
    private static readonly DATE_3 = 5;
    private static readonly DATE_2 = 6;

    private patterns: Map<number, string[]> = new Map();

    constructor(
        timePatterns: string[],
        date1Patterns: string[],
        dateFromTo1Patterns: string[],
        dateFromTo2Patterns: string[],
        monthPatterns: string[],
        date3Patterns: string[],
        date2Patterns: string[]
    ) {
        this.patterns = new Map<number, string[]>([
            [DateTime.TIME, timePatterns.map(p => this.processPattern(p))],
            [DateTime.DATE_1, date1Patterns.map(p => this.processPattern(p))],
            [DateTime.DATE_FROM_TO_1, dateFromTo1Patterns.map(p => this.processPattern(p))],
            [DateTime.DATE_FROM_TO_2, dateFromTo2Patterns.map(p => this.processPattern(p))],
            [DateTime.MONTH, monthPatterns.map(p => this.processPattern(p))],
            [DateTime.DATE_3, date3Patterns.map(p => this.processPattern(p))],
            [DateTime.DATE_2, date2Patterns.map(p => this.processPattern(p))],
        ]);
    }

    private processPattern(pattern: string): string {
        if (pattern.startsWith('(?i)')) {
            return pattern.slice(4);
        }
        return pattern;
    }

    public normalizeText(input: string): string {
        let preResult = input;
        for (const [categ, regexPatterns] of this.patterns.entries()) {
            for (const pattern of regexPatterns) {
                try {
                    const regex = new RegExp(pattern, "gi");
                    preResult = preResult.replace(regex, (match, ...groups: any[]) => {
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

        const romanPart = matchArray[1] ?? "";
        const yearPart = matchArray[2] ?? "";

        const checkRoman = converter.romanToDecimal(romanPart);

        if (
            checkRoman !== romanPart &&
            ICUHelper.isNumberLiteral(checkRoman)
        ) {
            result += ` ${ICUHelper.readNumber(checkRoman, 0)} `;
        }

        return result + "năm " + converter.convertNumber(yearPart);
    }
}