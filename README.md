# Vietnamese Text Normalizer

A Node.js library for normalizing Vietnamese text, converting abbreviations, numbers, dates, addresses, measurements, and special cases into readable forms. This is useful for Text-to-Speech (TTS) systems, data preprocessing, or any application requiring phonetic or expanded text representation in Vietnamese.

The library handles:
- Numbers (e.g., "123" → "một trăm hai mươi ba")
- Dates and times (e.g., "01/01/2023" → "một tháng một năm hai nghìn không trăm hai mươi ba")
- Addresses (e.g., "123 Đường ABC, Q.1, TP.HCM" → expanded form)
- Measurements and units (e.g., "10km" → "mười ki lô mét")
- Acronyms, symbols, and special cases (e.g., emails, websites, phone numbers)
- Roman numerals, math expressions, and more.

It supports customizable options for lowercase, punctuation handling, and unknown words.

## Installation

Install via npm:

```bash
npm install vinorm
```

## Quick Start

```javascript
const { TextNormalizer } = require('vietnamese-text-normalizer');

const normalizer = new TextNormalizer();
const input = "Ngày 01/01/2023, tại 123 Đ. ABC, Q.1, TP.HCM. SĐT: 0123456789. Email: example@gmail.com. Đo lường: 10km/h.";
const options = { lower: true, punc: false, unknown: false };

const normalized = normalizer.normalize(input, options);
console.log(normalized);
// Output: "ngày một tháng một năm hai nghìn không trăm hai mươi ba , tại một trăm hai mươi ba đường a bê xê , quận một , thành phố hồ chí minh . sờ đê tê : không một hai ba bốn năm sáu bảy tám chín . i meo chấm ji meo chấm com . đo lường : mười ki lô mét trên giờ ."
```

## API Reference

### `TextNormalizer` Class

The main class for text normalization. It integrates all sub-modules (Address, DateTime, Math, SpecialCase) and applies dictionary/mapping-based rules.

#### Constructor

```javascript
new TextNormalizer();
```

No parameters needed. Internally loads mappings and dictionaries from the `Mapping` and `Dict` folders.

#### `normalize(text: string, options?: NormalizerOptions): string`

Normalizes the input text.

- **Parameters**:
  - `text`: The input string to normalize.
  - `options` (optional): An object with normalization flags.
    - `lower?: boolean` - Convert output to lowercase (default: `false`).
    - `punc?: boolean` - Handle punctuation (default: `false`). If `true`, punctuation is tokenized and may be expanded.
    - `unknown?: boolean` - If `true`, unknown acronyms are kept as-is instead of being read letter-by-letter (default: `false`).
    - `rule?: boolean` - If `true`, skips dictionary/acronym/symbol mapping and only applies regex rules (default: `false`).

- **Returns**: The normalized string.

#### Example

```javascript
const normalizer = new TextNormalizer();
const normalized = normalizer.normalize("iPhone 15 ra mắt ngày 12/09/2023 với giá 999 USD.", { lower: true });
console.log(normalized);
// Output: "ai phone mười lăm ra mắt ngày mười hai tháng chín năm hai nghìn không trăm hai mươi ba với giá chín trăm chín mươi chín đô la mỹ ."
```

### Additional Classes (Advanced Usage)

For fine-grained control, you can use individual normalizers. These are exported and can be used standalone.

#### `Address` Class

Handles Vietnamese addresses (streets, districts, provinces).

- `normalizeText(text: string): string`

Example:
```javascript
const { Address } = require('vietnamese-text-normalizer');
const address = new Address();
console.log(address.normalizeText("123 Đ. ABC, P.1, Q.1, TP.HCM"));
// Output: "một trăm hai mươi ba đường a bê xê , phường một , quận một , thành phố hồ chí minh"
```

#### `DateTime` Class

Handles dates and times.

- `normalizeText(text: string): string`

Example:
```javascript
const { DateTime } = require('vietnamese-text-normalizer');
const dt = new DateTime();
console.log(dt.normalizeText("01/01/2023 10:30 AM"));
// Output: "một tháng một năm hai nghìn không trăm hai mươi ba mười giờ ba mươi ây em"
```

#### `Math` Class

Handles numbers, measurements, Roman numerals.

- `normalizeText(text: string): string`

Example:
```javascript
const { Math } = require('vietnamese-text-normalizer');
const math = new Math();
console.log(math.normalizeText("10km + 5.5m = XV mét"));
// Output: "mười ki lô mét cộng năm phẩy năm mét bằng mười lăm mét"
```

#### `SpecialCase` Class

Handles phone numbers, emails, websites, football scores, etc.

- `normalizeText(text: string): string`

Example:
```javascript
const { SpecialCase } = require('vietnamese-text-normalizer');
const special = new SpecialCase();
console.log(special.normalizeText("SĐT: 0123456789, Email: test@gmail.com, Website: example.com"));
// Output: "sờ đê tê : không một hai ba bốn năm sáu bảy tám chín , i meo chấm ji meo chấm com , i xê ờ em pi ờu i ờu i chấm com"
```

#### `ICUNumberConverting` Class

Utility for converting numbers to Vietnamese words.

- `convertNumber(num: string): string`
- `decimalToRoman(number: number): string`
- `romanToDecimal(roman: string): string`

Example:
```javascript
const { ICUNumberConverting } = require('vietnamese-text-normalizer');
const converter = new ICUNumberConverting();
console.log(converter.convertNumber("123456789"));
// Output: "một trăm hai mươi ba triệu bốn trăm năm mươi sáu nghìn bảy trăm tám mươi chín"
```

#### `ICUMapping` and `ICUDictionary` Classes

Low-level utilities for loading and querying mappings/dictionaries.

- Used internally, but exported for custom extensions.

## Configuration

- **Mappings and Dictionaries**: Loaded from `./Mapping` and `./Dict` relative to the library root. You can extend by modifying these files or loading custom ones in advanced usage.
- **Regex Rules**: Defined in `./RegexRule`. Custom patterns can be added by subclassing the normalizers.

## Development

- Clone the repo: `git clone https://haidv2806.github.io/vinorm`
- Install dependencies: `npm install`
- Run tests: `npm test` (add your tests in `tests/` folder)
- Build: `npm run build` (if using TypeScript)

## Contributing

Pull requests welcome! Please open an issue first to discuss changes.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

Based on ICU (International Components for Unicode) patterns adapted for Vietnamese text normalization.
