// ICUNumberConverting.ts
const DIGIT_ZERO = '0'.charCodeAt(0);
const SPACE = ' ';
const COMMA_CHAR = ', '; // For replacement, using string

export class ICUNumberConverting {
    private CHU_SO: string[] = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    private MUOI_F = 'mười';
    private MUOI = 'mươi';
    private MOTS = 'mốt';
    private TUW = 'tư';
    private LAWM = 'lăm';
    private HUNDRED = 'trăm';
    private LINH = 'linh';
    private NGHIN = 'nghìn';
    private TRIEU = 'triệu';
    private BILLION = 'tỷ';

    convertNumberLTHundred(num: string): string {
        // less than 10
        if (num.length === 1) return this.CHU_SO[num.charCodeAt(0) - DIGIT_ZERO];

        let result = '';
        // between 10 and 19
        if (num.charCodeAt(0) === DIGIT_ZERO + 1) result = this.MUOI_F;
        // between 20 and 99
        else {
            result = this.CHU_SO[num.charCodeAt(0) - DIGIT_ZERO] + SPACE + this.MUOI;
        }
        // num is 10, 20, ...
        if (num.charCodeAt(1) === DIGIT_ZERO) return result;
        result += SPACE;
        if (num.charCodeAt(1) === DIGIT_ZERO + 1 && num.charCodeAt(0) !== DIGIT_ZERO + 1) result += this.MOTS;
        else if (num.charCodeAt(1) === DIGIT_ZERO + 4 && num.charCodeAt(0) !== DIGIT_ZERO + 1) result += this.TUW;
        else if (num.charCodeAt(1) === DIGIT_ZERO + 5) result += this.LAWM;
        else result += this.CHU_SO[num.charCodeAt(1) - DIGIT_ZERO];
        return result;
    }

    convertNumberLTThousand(num: string): string {
        if (num.length < 3) return this.convertNumberLTHundred(num);
        let result = this.CHU_SO[num.charCodeAt(0) - DIGIT_ZERO] + SPACE + this.HUNDRED;
        // 000, 100, 200, ..., 900
        if (num.charCodeAt(1) === DIGIT_ZERO && num.charCodeAt(2) === DIGIT_ZERO) {
            if (num.charCodeAt(0) === DIGIT_ZERO) return '';
            else return result;
        }
        // [1-9]0[1-9]
        if (num.charCodeAt(1) === DIGIT_ZERO) return result + SPACE + this.LINH + SPACE + this.CHU_SO[num.charCodeAt(2) - DIGIT_ZERO];
        return result + SPACE + this.convertNumberLTHundred(num.substring(1));
    }

    convertNumberLTMillion(num: string): string {
        if (num.length < 4) return this.convertNumberLTThousand(num);
        let splitIndex = num.length % 3;
        if (splitIndex === 0) splitIndex = 3;
        const left = this.convertNumberLTMillion(num.substring(0, splitIndex));
        const right = this.convertNumberLTMillion(num.substring(splitIndex));
        if (left === '' && right === '') return '';
        const hangIndex = (num.length - splitIndex) / 3 - 1;
        let hang = hangIndex === 0 ? this.NGHIN : this.TRIEU;
        if (left === '') return this.CHU_SO[0] + SPACE + hang + SPACE + right;
        if (right === '') return left + SPACE + hang;
        return left + SPACE + hang + SPACE + right;
    }

    convertNumberArbitrary(num: string): string {
        if (num.length < 10) return this.convertNumberLTMillion(num);
        let splitIndex = num.length % 9;
        if (splitIndex === 0) splitIndex = 9;
        const left = this.convertNumberLTMillion(num.substring(0, splitIndex));
        const right = this.convertNumberArbitrary(num.substring(splitIndex));
        if (left === '') return right;
        let hang = this.BILLION;
        for (let i = (num.length - splitIndex) / 9 - 1; i > 0; i--) {
            hang += SPACE + this.BILLION;
        }
        if (right === '') return left + SPACE + hang;
        return left + SPACE + hang + COMMA_CHAR + right;
    }

    stripZeros(num: string): string {
        let z = 0;
        while (z < num.length && num.charCodeAt(z) === DIGIT_ZERO) z++;
        return num.substring(z);
    }

    convertNumber(num: string): string {
        if (num === '0') return 'không';

        // if num contains non digit characters, return empty string
        for (let c of num) {
            const code = c.charCodeAt(0);
            if (code < DIGIT_ZERO || code > DIGIT_ZERO + 9) return '';
        }
        let result = this.stripZeros(num);
        if (result === '') return '';
        if (result.length > 15) {
            let longRe = '';
            for (let c of result) {
                longRe += ' ' + this.convertNumber(c);
            }
            return longRe;
        } else {
            result = this.convertNumberArbitrary(result);
        }
        result = result.replace(/không nghìn /g, '');
        result = result.replace(/không triệu /g, '');
        if (result.length < 60) {
            result = result.replace(/tỷ,/g, 'tỷ');
        }
        return result;
    }

    decimalToRoman(number: number): string {
        let result = '';
        const decimal = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const symbol = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

        let i = 0;
        while (number > 0) {
            while (Math.floor(number / decimal[i]) > 0) {
                result += symbol[i];
                number -= decimal[i];
            }
            i++;
        }
        return result;
    }

    romanToDecimal(roman: string): string {
        const a: number[] = new Array(20).fill(0);
        const l = roman.length;
        const i_offset = 'i'.charCodeAt(0) - 'a'.charCodeAt(0);
        const v_offset = 'v'.charCodeAt(0) - 'a'.charCodeAt(0);
        const x_offset = 'x'.charCodeAt(0) - 'a'.charCodeAt(0);
        for (let i = 0; i < l; i++) {
            const c = roman.charCodeAt(i);
            if (c === 'A'.charCodeAt(0) + i_offset || c === 'a'.charCodeAt(0) + i_offset) a[i] = 1;
            else if (c === 'A'.charCodeAt(0) + v_offset || c === 'a'.charCodeAt(0) + v_offset) a[i] = 5;
            else if (c === 'A'.charCodeAt(0) + x_offset || c === 'a'.charCodeAt(0) + x_offset) a[i] = 10;
        }
        let k = a[l - 1];
        for (let i = l - 1; i > 0; i--) {
            if (a[i] > a[i - 1]) k -= a[i - 1];
            else if (a[i] <= a[i - 1]) k += a[i - 1];
        }
        // Since the decimalToRoman return result in uppercase
        // We need to upperize the result before comparing
        const romanUpper = roman.toUpperCase();
        if (romanUpper === this.decimalToRoman(k)) {
            let result = '';
            while (k > 0) {
                const d = k % 10;
                result = String.fromCharCode(DIGIT_ZERO + d) + result;
                k = Math.floor(k / 10);
            }
            return result;
        }
        return roman;
    }
}