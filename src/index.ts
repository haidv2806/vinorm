export * from './TextNormalizer';
export * from './Address';
export * from './DateTime';
export * from './MathNormalizer';
export * from './SpecialCase';
export * from './ICUNumberConverting';
export * from './ICUMapping';
export * from './ICUDictionary';
export * from './ICUHelper';

// createNormalizer.ts
import { TextNormalizer } from "./TextNormalizer";

// Mapping
import acronymsShorten from "../data/Mapping/Acronyms.json";
import teencode from "../data/Mapping/Teencode.json";
import symbol from "../data/Mapping/Symbol.json";
import letterSoundVN from "../data/Mapping/LetterSoundVN.json";
import letterSoundEN from "../data/Mapping/LetterSoundEN.json";
import popular from "../data/Dict/Popular.json";

// Regex
import phoneNumberPatterns from "../data/RegexRule/PhoneNumber.json";
import footballUnderPatterns from "../data/RegexRule/FootballUnder.json";
import footballOtherPatterns from "../data/RegexRule/FootballOther.json";
import websitePatterns from "../data/RegexRule/Website.json";
import emailPatterns from "../data/RegexRule/Email.json";
import number from "../data/Mapping/Number.json";

// Date
import timePatterns from "../data/RegexRule/Time.json";
import date1Patterns from "../data/RegexRule/Date_1.json";
import dateFromTo1Patterns from "../data/RegexRule/Date_From_To_1.json";
import dateFromTo2Patterns from "../data/RegexRule/Date_From_To_2.json";
import monthPatterns from "../data/RegexRule/Month.json";
import date3Patterns from "../data/RegexRule/Date_3.json";
import date2Patterns from "../data/RegexRule/Date_2.json";

// Math
import romanNumberPatterns from "../data/RegexRule/NormalNumber.json";
import measurementPatterns from "../data/RegexRule/Measurement.json";
import measurement1Patterns from "../data/RegexRule/Measurement_1.json";
import normalNumberPatterns from "../data/RegexRule/NormalNumber.json";
import baseUnit from "../data/Mapping/BaseUnit.json";
import currencyUnit from "../data/Mapping/CurrencyUnit.json";

// Address
import politicalDivisionPatterns from "../data/RegexRule/PoliticalDivision.json";
import streetPatterns from "../data/RegexRule/Street.json";
import officePatterns from "../data/RegexRule/Office.json";
import codeNumberPatterns from "../data/RegexRule/CodeNumber.json";

const normalizer = new TextNormalizer({
    acronymsShorten,
    teencode,
    symbol,
    letterSoundVN,
    letterSoundEN,
    popular,

    phoneNumberPatterns,
    footballUnderPatterns,
    footballOtherPatterns,
    websitePatterns,
    emailPatterns,
    number,

    timePatterns,
    date1Patterns,
    dateFromTo1Patterns,
    dateFromTo2Patterns,
    monthPatterns,
    date3Patterns,
    date2Patterns,

    romanNumberPatterns,
    measurementPatterns,
    measurement1Patterns,
    normalNumberPatterns,
    baseUnit,
    currencyUnit,

    politicalDivisionPatterns,
    streetPatterns,
    officePatterns,
    codeNumberPatterns,
});

export default normalizer;