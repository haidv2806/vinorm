// SpecialCase.ts (Sửa để sử dụng dữ liệu JSON thay vì fs)
import { ICUMapping } from './ICUMapping';
import { ICUNumberConverting } from './ICUNumberConverting';

export class SpecialCase {
    private static readonly PHONE_NUMBER = 0;
    private static readonly FOOTBALL_UNDER = 1;
    private static readonly FOOTBALL_OTHER = 2;
    private static readonly EMAIL = 3;
    private static readonly WEBSITE = 4;

    private patterns: Map<number, string[]> = new Map();
    private numberConverter: ICUNumberConverting = new ICUNumberConverting();

    private letterSoundVN = new ICUMapping();
    private letterSoundEN = new ICUMapping();
    private numMapping = new ICUMapping();
    private symbolMapping = new ICUMapping();

    constructor(
        phoneNumberPatterns: string[],
        footballUnderPatterns: string[],
        footballOtherPatterns: string[],
        websitePatterns: string[],
        emailPatterns: string[],
        letterSoundVNData: Record<string, string>,
        symbolData: Record<string, string>,
        letterSoundENData: Record<string, string>,
        numberData: Record<string, string>
    ) {
        this.numberConverter = new ICUNumberConverting();

        this.letterSoundVN.loadMappingData('LetterSoundVN', letterSoundVNData);
        this.letterSoundVN.loadMappingData('Symbol', symbolData);

        this.letterSoundEN.loadMappingData('LetterSoundEN', letterSoundENData);
        this.letterSoundEN.loadMappingData('Symbol', symbolData);

        this.numMapping.loadMappingData('Number', numberData);

        this.loadPatterns(SpecialCase.PHONE_NUMBER, phoneNumberPatterns);
        this.loadPatterns(SpecialCase.FOOTBALL_UNDER, footballUnderPatterns);
        this.loadPatterns(SpecialCase.FOOTBALL_OTHER, footballOtherPatterns);
        this.loadPatterns(SpecialCase.WEBSITE, websitePatterns);
        this.loadPatterns(SpecialCase.EMAIL, emailPatterns);
    }

    private loadPatterns(category: number, patterns: string[]): void {
        const processed = patterns.map(pattern => pattern.replace(/^\(\?i\)/i, ''));
        this.patterns.set(category, processed);
    }

    public normalizeText(input: string): string {
        let currentText = input;

        for (const [category, regexStrings] of this.patterns.entries()) {
            for (const patternStr of regexStrings) {
                try {
                    const regex = new RegExp(patternStr, "ugi");

                    currentText = currentText.replace(regex, (match) => {
                        return ` ${this.stringForReplace(category, match)} `;
                    });
                } catch (e) {
                    console.error(`[E] Regex lỗi tại file pattern: ${patternStr}`, e);
                }
            }
        }
        return currentText;
    }

    private stringForReplace(category: number, match: string): string {
        switch (category) {
            case SpecialCase.PHONE_NUMBER: return this.regexPhoneNumber(match);
            case SpecialCase.FOOTBALL_UNDER: return this.regexFootballUnder(match);
            case SpecialCase.FOOTBALL_OTHER: return this.regexFootballOther(match);
            case SpecialCase.WEBSITE: return this.regexWebsite(match);
            case SpecialCase.EMAIL: return this.regexEmail(match);
            default: return match;
        }
    }

    private regexFootballUnder(match: string): string {
        let result = "";
        let number = "";
        for (const char of match) {
            const c = char.charCodeAt(0);
            if (c === 85 || c === 117) {  // 'U' or 'u'
                result += 'u';
            } else if (48 <= c && c <= 57) {  // '0'-'9'
                number += char;
            }
        }
        if (number) {
            result += " " + this.numberConverter.convertNumber(number);
        }
        return result;
    }

    private regexFootballOther(match: string): string {
        let result = "";
        let number = "";
        let continuousDigits = false;
        for (const char of match) {
            const c = char.charCodeAt(0);
            if (48 <= c && c <= 57) {  // digit
                if (continuousDigits) {
                    number += char;
                } else {
                    number = char;
                    continuousDigits = true;
                }
            } else if (char === '-' || char === '|') {
                if (continuousDigits) {
                    result += this.numberConverter.convertNumber(number);
                    number = "";
                    continuousDigits = false;
                }
                result += " ";
            } else {
                if (continuousDigits) {
                    result += this.numberConverter.convertNumber(number);
                    number = "";
                    continuousDigits = false;
                }
                result += char;
            }
        }
        if (number) {
            result += this.numberConverter.convertNumber(number);
        }
        return result;
    }

    private regexWebsite(match: string): string {
        const lowerMatch = match.toLowerCase();
        let indexOfCom = lowerMatch.indexOf(".com");
        let result = "";
        if (indexOfCom !== -1) {
            indexOfCom += 1;  // Skip to 'c'
        }
        for (let i = 0; i < lowerMatch.length; i++) {
            const char = lowerMatch[i];
            const c = char.charCodeAt(0);
            if (indexOfCom !== -1 && i >= indexOfCom && i <= indexOfCom + 2) {
                result += char;
            } else {
                if (48 <= c && c <= 57) {
                    result += " " + this.numberConverter.convertNumber(char) + " ";
                } else if (char === '.') {
                    result += " chấm ";
                } else if (char === '/') {
                    result += " xuyệt ";
                } else {
                    const sound = this.letterSoundVN.mappingOf(char);
                    result += " " + (sound || char) + " ";
                }
            }
        }
        return " " + result + " ";
    }

    private regexEmail(match: string): string {
        const lowerMatch = match.toLowerCase();
        let indexOfGmail = lowerMatch.indexOf("gmail.com");
        let result = "";
        if (indexOfGmail !== -1) {
            indexOfGmail += 1;  // Skip to 'm' after 'g'
        }
        for (let i = 0; i < lowerMatch.length; i++) {
            const char = lowerMatch[i];
            const c = char.charCodeAt(0);
            if (indexOfGmail !== -1 && i >= indexOfGmail) {
                result += " meo chấm com ";
                break;
            } else {
                if (48 <= c && c <= 57) {
                    result += " " + this.numberConverter.convertNumber(char) + " ";
                } else if (char === '.') {
                    result += " chấm ";
                } else if (char === '/') {
                    result += " xuyệt ";
                } else {
                    const sound = this.letterSoundEN.mappingOf(char);
                    result += " " + (sound || char) + " ";
                }
            }
        }
        return " " + result + " ";
    }

    private regexPhoneNumber(match: string): string {
        let result = "";
        for (const char of match) {
            const c = char.charCodeAt(0);
            if (char === '+') {
                result += "cộng ";
            } else if (char === '.' || char === ':' || char === '-' || char === '(' || char === ')') {
                // ignore
            } else if (48 <= c && c <= 57) {
                result += this.numMapping.mappingOf(char) + " ";
            } else {
                result += char;
            }
        }
        return result;
    }
}