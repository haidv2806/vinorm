import { ICUMapping } from './ICUMapping';
import { ICUDictionary } from './ICUDictionary';
import { SpecialCase } from './SpecialCase';
import { DateTime } from './DateTime';
import { Math as MathNormalizer } from './Math';
import { Address } from './Address';
import { ICUNumberConverting } from './ICUNumberConverting';
import * as path from 'path';

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
    private symbol = new ICUMapping();
    private letterSoundVN = new ICUMapping();
    private letterSoundEN = new ICUMapping();
    private popularWord = new ICUDictionary();

    constructor() {
        this.specialCase = new SpecialCase();
        this.dateTime = new DateTime();
        this.math = new MathNormalizer();
        this.address = new Address();

        const baseDir = __dirname;
        const getMapPath = (file: string) => path.join(baseDir, "Mapping", file);
        const getDictPath = (file: string) => path.join(baseDir, "Dict", file);

        this.acronym.loadMappingFile(getMapPath("Acronyms_shorten.txt"));
        this.symbol.loadMappingFile(getMapPath("Symbol.txt"));
        this.letterSoundVN.loadMappingFile(getMapPath("LetterSoundVN.txt"));
        this.letterSoundEN.loadMappingFile(getMapPath("LetterSoundEN.txt"));
        this.popularWord.loadDictFile(getDictPath("Popular.txt"));
    }

    public normalize(text: string, options: NormalizerOptions = {}): string {
        let line = text.normalize('NFC');

        // [FIX] Loại bỏ các dấu trang trí như ---, ===
        line = line.replace(/^-+\s*|\s*-+$/g, " ").replace(/\s*--+\s*/g, " ");

        line = this.removeExtraWhitespace(line);
        let normalizedText = line;

        // 1. Chạy các bộ chuẩn hóa chuyên biệt
        normalizedText = this.specialCase.normalizeText(normalizedText);
        normalizedText = this.dateTime.normalizeText(normalizedText);
        normalizedText = this.math.normalizeText(normalizedText);
        normalizedText = this.address.normalizeText(normalizedText);

        // 2. Tách Chữ và Số dính liền (Fix: Ngày20 -> Ngày 20, A1 -> A 1)
        normalizedText = this.splitMixedAlphaNum(normalizedText);
        normalizedText = this.removeExtraWhitespace(normalizedText);

        if (options.rule) return normalizedText;

        // 3. Tokenize và chuẩn hóa từng từ
        const words = normalizedText.split(/\s+/);
        let result = "";

        for (const rawWord of words) {
            if (!rawWord) continue;

            // Xử lý dấu câu dính liền
            let normalizedWord = this.tokenizeSymbol(rawWord);
            const subTokens = normalizedWord.split(/\s+/);

            let resultAdd = "";
            for (const subToken of subTokens) {
                if (!subToken) continue;

                if (this.popularWord.hasWord(subToken)) {
                    resultAdd += ` ${subToken} `;
                }
                else if (this.acronym.hasMappingOf(subToken)) {
                    resultAdd += ` ${this.acronym.mappingOf(subToken)} `;
                }
                else if (this.symbol.hasMappingOf(subToken)) {
                    resultAdd += ` ${this.symbol.mappingOf(subToken)} `;
                }
                else if (this.containsOnlyLetter(subToken)) {

                    const isAllUpper = this.isUpperCaseWord(subToken);

                    // 1️⃣ IN HOA nhưng CÓ NGUYÊN ÂM → coi là từ thường
                    if (isAllUpper && this.containsVowel(subToken)) {
                        resultAdd += ` ${subToken.toLowerCase()} `;
                    }
                    // 2️⃣ IN HOA + KHÔNG NGUYÊN ÂM → acronym thật
                    else if (isAllUpper && subToken.length > 1) {
                        if (!options.unknown)
                            resultAdd += ` ${this.readLetterByLetter(subToken, this.letterSoundEN)} `;
                        else
                            resultAdd += ` ${subToken} `;
                    }
                    // 3️⃣ Từ thường
                    else {
                        if (this.containsVowel(subToken)) {
                            resultAdd += ` ${subToken} `;
                        } else {
                            resultAdd += ` ${this.readLetterByLetter(subToken, this.letterSoundVN)} `;
                        }
                    }
                } else {
                    resultAdd += ` ${subToken} `;
                }
            }
            result += resultAdd;
        }

        result = this.convertAllRemainingNumbers(result);

        if (options.lower) result = result.toLowerCase();
        return this.removeExtraWhitespace(result);
    }

    private convertAllRemainingNumbers(text: string): string {
        const converter = new ICUNumberConverting();

        // Bắt các số còn sót (không nằm trong acronym/symbol/popular đã xử lý)
        return text.replace(/(?:^|\s|\b)([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)(?=$|\s|\b|[^\d.,])/g, (match, numStr) => {
            // Bỏ qua nếu là phần của email, url, mã sản phẩm đã xử lý trước đó
            if (/[@.]/.test(match)) return match;

            const read = converter.convertNumber(numStr.trim());
            return ` ${read} `;
        });
    }

    /**
     * Tách chữ và số: Ngày20 -> Ngày 20, iPhone15 -> iPhone 15
     */
    private splitMixedAlphaNum(input: string): string {
        return input
            .replace(/(\p{L})(\p{N})/gu, "$1 $2") // ChữSố -> Chữ Số
            .replace(/(\p{N})(\p{L})/gu, "$1 $2") // SốChữ -> Số Chữ
            .replace(/([A-Za-z])(\.)(\d)/g, "$1 $2 $3"); // No.10 -> No . 10
    }

    private removeExtraWhitespace(input: string): string {
        return input.replace(/[\(\)\s]+/g, " ").trim();
    }

    private tokenizeSymbol(input: string): string {
        // Tách các ký tự không phải chữ/số
        return input.replace(/([^\p{L}\p{N}\s])/gu, " $1 ").trim();
    }

    private isUpperCaseWord(word: string): boolean {
        return word === word.toUpperCase() && word !== word.toLowerCase();
    }

    private containsOnlyLetter(word: string): boolean {
        return /^[\p{L}]+$/u.test(word);
    }

    // [FIX] Regex Vowel đầy đủ cho tiếng Việt
    private containsVowel(word: string): boolean {
        // Bao gồm các nguyên âm tiếng Việt có dấu và không dấu
        const vowelRegex = /[aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵaeiou]/i;
        return vowelRegex.test(word);
    }

    private readLetterByLetter(word: string, soundMapping: ICUMapping): string {
        let result = "";
        for (const char of Array.from(word)) { // Bỏ toLowerCase ở đây để map đúng case nếu cần
            const charLower = char.toLowerCase();
            if (soundMapping.hasMappingOf(charLower)) {
                result += soundMapping.mappingOf(charLower) + " ";
            } else {
                result += char + " ";
            }
        }
        return result;
    }
}