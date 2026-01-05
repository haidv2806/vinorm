// ICUHelper.ts
import { ICUMapping } from './ICUMapping'; // Adjust import paths as needed
import { ICUNumberConverting } from './ICUNumberConverting'; // Adjust import paths as needed

// Constants from ICUConstant (assuming they are defined elsewhere; inline here for completeness)
const DIGIT_ZERO = '0'.charCodeAt(0);
const PLUS_SIGN = '+'.charCodeAt(0);
const FULL_STOP = '.'.charCodeAt(0);
const COLON = ':'.charCodeAt(0);
const HYPEN_MINUS = '-'.charCodeAt(0);
const LEFT_PARENTHESIS = '('.charCodeAt(0);
const RIGHT_PARENTHESIS = ')'.charCodeAt(0);
const LATIN_SMALL_LETTER_A = 'a'.charCodeAt(0);
const LATIN_CAPITAL_LETTER_A = 'A'.charCodeAt(0);
const VERTICAL_LINE = '|'.charCodeAt(0);
const COMMA = ','.charCodeAt(0);

export class ICUHelper {
    static removeExtraWhitespace(input: string): string {
        let result = input.replace(/\s+/g, ' ');
        return result.trim();
    }

    static isNumberLiteral(s: string): boolean {
        for (let c of s) {
            const code = c.charCodeAt(0);
            if (code < DIGIT_ZERO || code > DIGIT_ZERO + 9) return false;
        }
        return true;
    }

    static splitFractionUnit(unit: string): string[] {
        const result: string[] = [];
        const idx = unit.indexOf('/');
        if (idx === -1) {
            result.push(unit);
        } else {
            result.push(unit.substring(0, idx));
            result.push(unit.substring(idx + 1));
        }
        return result;
    }

    static splitCompositeUnit(unit: string, baseUnitData: Record<string, string>, prefixData: Record<string, string>): string {
        const baseUnit = new ICUMapping();
        baseUnit.loadMappingData("BaseUnit", baseUnitData);

        const prefixDict = new ICUMapping();
        prefixDict.loadMappingData("PrefixUnit", prefixData);

        let normalizedText = '';
        if (unit.length < 2 || baseUnit.hasMappingOf(unit)) {
            return ` ${baseUnit.mappingOf(unit)} `;
        }

        let prefixLength = 0;
        let prefix = unit.substring(0, 2);
        if (prefixDict.hasMappingOf(prefix)) {
            prefixLength = 2;
        }

        if (prefixLength === 0) {
            prefix = unit.substring(0, 1);
            if (prefixDict.hasMappingOf(prefix)) prefixLength = 1;
        }
        if (prefixLength !== 0) {
            normalizedText += prefixDict.mappingOf(prefix) + ' ';
        }
        const mainUnit = unit.substring(prefixLength);
        let start = 0;
        let end = 0;
        while (start < mainUnit.length && end <= mainUnit.length) {
            end++;
            const currentUnit = mainUnit.substring(start, end);
            if (baseUnit.hasMappingOf(currentUnit) || ICUHelper.isNumberLiteral(currentUnit)) {
                if (ICUHelper.isNumberLiteral(currentUnit)) {
                    if (currentUnit === '2') {
                        normalizedText += ' vuông ';
                    } else if (currentUnit === '3') {
                        normalizedText += ' khối ';
                    } else {
                        const converter = new ICUNumberConverting();
                        normalizedText += ' mũ ' + converter.convertNumber(currentUnit) + ' ';
                    }
                } else {
                    if (baseUnit.hasMappingOf(currentUnit)) {
                        normalizedText += baseUnit.mappingOf(currentUnit) + ' ';
                    } else {
                        normalizedText += currentUnit + ' ';
                    }
                }
                start = end;
            }
        }
        if (normalizedText === '') return unit;
        else return normalizedText;
    }

    static normalizeUnit(unit: string, baseUnitData: Record<string, string>, prefixData: Record<string, string>): string {
        let normalizedText = '';
        const compositeUnits = ICUHelper.splitFractionUnit(unit);
        for (let i = 0; i < compositeUnits.length; i++) {
            // console.log('Unit: ' + compositeUnits[i]);
            normalizedText += ' ' + ICUHelper.splitCompositeUnit(compositeUnits[i], baseUnitData, prefixData) + ' ';
            if (compositeUnits.length > 1 && i !== compositeUnits.length - 1) {
                normalizedText += ' trên ';
            }
        }
        return ICUHelper.removeExtraWhitespace(normalizedText);
    }

    static readNumber(literalNumber: string, point: number): string {
        const match = literalNumber;
        const converter = new ICUNumberConverting();

        let floatIdx = -1;
        if (point === 0) {
            floatIdx = match.indexOf(String.fromCharCode(COMMA));
        } else if (point === 1) {
            floatIdx = match.indexOf(String.fromCharCode(FULL_STOP));
        } else {
            for (let c of match) {
                const code = c.charCodeAt(0);
                if (code === COMMA) floatIdx = match.indexOf(String.fromCharCode(COMMA));
                if (code === FULL_STOP) floatIdx = match.indexOf(String.fromCharCode(FULL_STOP));
            }
        }
        let integerPart = '';
        let fractionalPart = '';
        let zeroFrac = '';
        let checkZF = false;
        if (floatIdx !== -1) {
            fractionalPart = match.substring(floatIdx + 1).trim();
            integerPart = match.substring(0, floatIdx).trim();

            let fractionalPartProcessed = '';
            for (let c of fractionalPart) {
                const code = c.charCodeAt(0);
                if (code === DIGIT_ZERO && !checkZF) {
                    zeroFrac += ' không ';
                    continue;
                }
                if (DIGIT_ZERO <= code && code <= DIGIT_ZERO + 9) {
                    fractionalPartProcessed += c;
                    checkZF = true;
                }
            }
            fractionalPart = fractionalPartProcessed;
        } else {
            integerPart = match;
        }

        let integerPartProcessed = '';
        for (let c of integerPart) {
            const code = c.charCodeAt(0);
            if (DIGIT_ZERO <= code && code <= DIGIT_ZERO + 9) {
                integerPartProcessed += c;
            }
        }
        if (floatIdx === -1) {
            return ` ${converter.convertNumber(integerPartProcessed)} `;
        } else {
            return ` ${converter.convertNumber(integerPartProcessed)} phẩy ${zeroFrac}${converter.convertNumber(fractionalPart.trim())} `;
        }
    }
}