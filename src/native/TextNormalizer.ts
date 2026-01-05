// TextNormalizer.ts (Sửa để truyền dữ liệu JSON vào constructors)
import { ICUMapping } from './ICUMapping';
import { ICUDictionary } from './ICUDictionary';
import { ICUHelper } from './ICUHelper';
import { SpecialCase } from './SpecialCase';
import { DateTime } from './DateTime';
import { MathNormalizer } from './MathNormalizer';
import { Address } from './Address';
import { ICUNumberConverting } from './ICUNumberConverting';

export interface NormalizerOptions {
    punc?: boolean;
    unknown?: boolean;
    lower?: boolean;
    rule?: boolean;
}

export class TextNormalizer {
    private specialCase: SpecialCase;
    private dateTime: DateTime;
    private math: MathNormalizer;
    private address: Address;

    private acronym = new ICUMapping();
    private teenCode = new ICUMapping();
    private symbol = new ICUMapping();
    private letterSoundVN = new ICUMapping();
    private letterSoundEN = new ICUMapping();
    private popularWord = new ICUDictionary();
    private helper = new ICUHelper();

    private converter = new ICUNumberConverting();

    constructor(data: {
        // Ví dụ: Truyền tất cả JSON data cần thiết
        acronymsShorten: Record<string, string>;
        teencode: Record<string, string>;
        symbol: Record<string, string>;
        letterSoundVN: Record<string, string>;
        letterSoundEN: Record<string, string>;
        popular: string[];
        // Cho SpecialCase
        phoneNumberPatterns: string[];
        footballUnderPatterns: string[];
        footballOtherPatterns: string[];
        websitePatterns: string[];
        emailPatterns: string[];
        number: Record<string, string>;
        // Cho DateTime
        timePatterns: string[];
        date1Patterns: string[];
        dateFromTo1Patterns: string[];
        dateFromTo2Patterns: string[];
        monthPatterns: string[];
        date3Patterns: string[];
        date2Patterns: string[];
        // Cho Math
        romanNumberPatterns: string[];
        measurementPatterns: string[];
        measurement1Patterns: string[];
        normalNumberPatterns: string[];
        baseUnit: Record<string, string>;
        currencyUnit: Record<string, string>;
        // Cho Address
        politicalDivisionPatterns: string[];
        streetPatterns: string[];
        officePatterns: string[];
        codeNumberPatterns: string[];
    }) {
        // Load mappings và dicts từ data
        this.acronym.loadMappingData("Acronyms_shorten", data.acronymsShorten);
        this.teenCode.loadMappingData("Teencode", data.teencode);
        this.symbol.loadMappingData("Symbol", data.symbol);
        this.letterSoundVN.loadMappingData("LetterSoundVN", data.letterSoundVN);
        this.letterSoundEN.loadMappingData("LetterSoundEN", data.letterSoundEN);
        this.popularWord.loadDictData("Popular", data.popular);

        // Khởi tạo các class với data JSON
        this.specialCase = new SpecialCase(
            data.phoneNumberPatterns,
            data.footballUnderPatterns,
            data.footballOtherPatterns,
            data.websitePatterns,
            data.emailPatterns,
            data.letterSoundVN,
            data.symbol,
            data.letterSoundEN,
            data.number
        );

        this.dateTime = new DateTime(
            data.timePatterns,
            data.date1Patterns,
            data.dateFromTo1Patterns,
            data.dateFromTo2Patterns,
            data.monthPatterns,
            data.date3Patterns,
            data.date2Patterns
        );

        this.math = new MathNormalizer(
            data.romanNumberPatterns,
            data.measurementPatterns,
            data.measurement1Patterns,
            data.normalNumberPatterns,
            data.baseUnit,
            data.currencyUnit
        );

        this.address = new Address(
            data.politicalDivisionPatterns,
            data.streetPatterns,
            data.officePatterns,
            data.codeNumberPatterns,
            data.letterSoundVN,
            data.letterSoundVN, // Giả sử letterVN = letterSoundVN
            data.popular
        );
    }

    public normalize(text: string, options: NormalizerOptions = {}): string {
        let line = text;

        line = this.removeExtraWhitespace(line);
        let normalizedText = line;

        // 1. Chạy các bộ chuẩn hóa chuyên biệt
        normalizedText = this.specialCase.normalizeText(normalizedText);
        normalizedText = this.dateTime.normalizeText(normalizedText);
        normalizedText = this.math.normalizeText(normalizedText);
        normalizedText = this.address.normalizeText(normalizedText);

        normalizedText = this.removeExtraWhitespace(normalizedText);

        if (options.rule) return normalizedText;

        // 3. Tokenize và chuẩn hóa từng từ
        const words = normalizedText.match(/[^\s]+/g) || [];
        let result = "";

        for (const match of words) {
            let word = match.trim();
            if (!word) continue;

            let resultAdd = "";
            while (true) {
                let normalizedWord = this.removeNovoiceSymbol(word, false);
                normalizedWord = normalizedWord.trim();

                // Tách dấu câu cuối từ
                const punctMatch = normalizedWord.match(/^(.+?)([;:!?,.])$/);
                let tmSymbol = "";
                if (punctMatch) {
                    normalizedWord = punctMatch[1];
                    tmSymbol = punctMatch[2];
                    if (!options.punc) {
                        if (['.', '!', ':', '?'].includes(tmSymbol)) {
                            tmSymbol = '.';
                        } else if ([',', ';'].includes(tmSymbol)) {
                            tmSymbol = ',';
                        }
                    }
                }

                if (normalizedWord.length === 0) {
                    resultAdd = ` ${normalizedWord} ${tmSymbol} `;
                    break;
                }

                if (this.popularWord.hasWord(normalizedWord)) {
                    resultAdd = ` ${normalizedWord} ${tmSymbol} `;
                    break;
                }

                if (this.acronym.hasMappingOf(normalizedWord)) {
                    resultAdd = ` ${this.acronym.mappingOf(normalizedWord)} ${tmSymbol} `;
                    break;
                }

                if (this.teenCode.hasMappingOf(normalizedWord)) {
                    resultAdd = ` ${this.teenCode.mappingOf(normalizedWord)} ${tmSymbol} `;
                    break;
                }

                // Nếu không match, reset normalizedWord và tokenize symbol
                normalizedWord = word;
                normalizedWord = this.removeNovoiceSymbol(normalizedWord, true);
                normalizedWord = this.tokenizeSymbol(normalizedWord);

                // Giả lập BreakIterator bằng split(/\s+/)
                const tokens = normalizedWord.split(/\s+/).filter(t => t);
                resultAdd = "";

                for (const token of tokens) {
                    if (!token) continue;

                    if (this.popularWord.hasWord(token)) {
                        resultAdd += ` ${token} `;
                        continue;
                    }

                    if (this.acronym.hasMappingOf(token)) {
                        resultAdd += ` ${this.acronym.mappingOf(token)} `;
                        continue;
                    }

                    if (this.teenCode.hasMappingOf(token)) {
                        resultAdd += ` ${this.teenCode.mappingOf(token)} `;
                        continue;
                    }

                    if (['.', '!', ':', '?'].includes(token)) {
                        if (!options.punc) {
                            resultAdd += ' . ';
                        } else {
                            resultAdd += ` ${token} `;
                        }
                        continue;
                    }

                    if ([',', ';', '/'].includes(token)) {
                        if (!options.punc) {
                            resultAdd += ' , ';
                        } else {
                            resultAdd += ` ${token} `;
                        }
                        continue;
                    }

                    if (this.symbol.hasMappingOf(token)) {
                        resultAdd += ` ${this.symbol.mappingOf(token)} `;
                        continue;
                    }

                    if (this.containsOnlyLetter(token)) {
                        if (this.isUpperCaseWord(token)) {
                            // Kiểm tra số La Mã
                            const checkRoman = this.romanToDecimal(token);
                            if (checkRoman !== token && this.isNumberLiteral(checkRoman)) {
                                resultAdd += ` ${ICUHelper.readNumber(checkRoman, 0)} `;
                                continue;
                            }

                            if (options.unknown) {
                                resultAdd += ` ${token} `;
                            } else {
                                resultAdd += ` ${this.readLetterByLetter(token, this.letterSoundEN)} `;
                            }
                            continue;
                        } else if (!options.unknown) {
                            if (!this.containsVowel(token)) {
                                resultAdd += ` ${this.readLetterByLetter(token, this.letterSoundVN)} `;
                            } else {
                                resultAdd += ` ${token} `;
                            }
                        } else {
                            resultAdd += ` ${token} `;
                        }
                    } else {
                        resultAdd += ' ';
                    }
                }

                break;
            }

            result += resultAdd;
        }

        result = this.removeNovoiceSymbol(result, true);
        result = this.removeExtraWhitespace(result);

        if (options.lower) result = result.toLowerCase();
        return result;
    }

    private removeNovoiceSymbol(input: string, spaceReplace: boolean): string {
        const regex = /(“|”|\.{3}|"|\{|\}|\[|\]|-)/g;
        const replacement = spaceReplace ? ' ' : '';
        return input.replace(regex, replacement).trim();
    }

    private romanToDecimal(roman: string): string {
        const romanMap: Record<string, number> = {
            'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
        };
        roman = roman.toUpperCase();
        let decimal = 0;
        let prevValue = 0;
        for (let i = roman.length - 1; i >= 0; i--) {
            const char = roman[i];
            if (!romanMap[char]) return roman; // invalid char
            const value = romanMap[char];
            if (value < prevValue) {
                decimal -= value;
            } else {
                decimal += value;
            }
            prevValue = value;
        }
        // Validate by converting back to roman
        const backToRoman = this.decimalToRoman(decimal);
        if (backToRoman !== roman) {
            return roman; // invalid roman
        }
        return decimal.toString();
    }

    private decimalToRoman(num: number): string {
        const romanNumerals = [
            { value: 1000, symbol: 'M' },
            { value: 900, symbol: 'CM' },
            { value: 500, symbol: 'D' },
            { value: 400, symbol: 'CD' },
            { value: 100, symbol: 'C' },
            { value: 90, symbol: 'XC' },
            { value: 50, symbol: 'L' },
            { value: 40, symbol: 'XL' },
            { value: 10, symbol: 'X' },
            { value: 9, symbol: 'IX' },
            { value: 5, symbol: 'V' },
            { value: 4, symbol: 'IV' },
            { value: 1, symbol: 'I' }
        ];
        let roman = '';
        for (const { value, symbol } of romanNumerals) {
            while (num >= value) {
                roman += symbol;
                num -= value;
            }
        }
        return roman;
    }

    private isNumberLiteral(str: string): boolean {
        return /^\d+$/.test(str);
    }

    private removeExtraWhitespace(input: string): string {
        return input.replace(/[\(\)\s]+/g, " ").trim();
    }

    private tokenizeSymbol(input: string): string {
        // Tương đương ICU: [^\w\d\s]
        return input
            .replace(/([^\p{L}\p{N}\p{M}_\s])/gu, " $1 ")
            .trim();
    }

    private isUpperCaseWord(word: string): boolean {
        return word === word.toUpperCase() && word !== word.toLowerCase();
    }

    private containsOnlyLetter(word: string): boolean {
        const lowered = word.toLowerCase();
        for (const char of Array.from(lowered)) {
            if (!this.letterSoundVN.hasMappingOf(char)) {
                return false;
            }
        }
        return true;
    }

    private containsVowel(word: string): boolean {
        // Regex vowel chính xác như C++, không duplicate
        const vowelRegex = /[aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ]/i;
        return vowelRegex.test(word);
    }

    private readLetterByLetter(word: string, soundMapping: ICUMapping): string {
        let result = "";
        const lowered = word.toLowerCase();
        for (const char of Array.from(lowered)) {
            result += soundMapping.mappingOf(char) + " ";
        }
        return result.trim();
    }
}