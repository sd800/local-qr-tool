export type AamvaCountryCode = "USA" | "CAN" | "MEX";

export type AamvaDisplayField = {
  label: string;
  value: string;
  wide?: boolean;
};

export type AamvaDisplaySection = {
  title: string;
  fields: AamvaDisplayField[];
};

export type AamvaData = {
  countryCode: AamvaCountryCode;
  countryName: string;
  headingCountry: string;
  documentType: "DL" | "ID";
  issuerIdentificationNumber: string;
  issuer: string;
  aamvaVersion: string;
  jurisdictionVersion: string;
  summary: AamvaDisplayField[];
  sections: AamvaDisplaySection[];
  fields: Record<string, string>;
};

type Issuer = {
  jurisdiction: string;
  abbreviation: string;
  country: "USA" | "Canada" | "Mexico";
};

const ISSUERS: Record<string, Issuer> = {
  "604426": { jurisdiction: "Prince Edward Island", abbreviation: "PE", country: "Canada" },
  "604427": { jurisdiction: "American Samoa", abbreviation: "AS", country: "USA" },
  "604428": { jurisdiction: "Quebec", abbreviation: "QC", country: "Canada" },
  "604429": { jurisdiction: "Yukon", abbreviation: "YT", country: "Canada" },
  "604430": { jurisdiction: "Northern Mariana Islands", abbreviation: "MP", country: "USA" },
  "604431": { jurisdiction: "Puerto Rico", abbreviation: "PR", country: "USA" },
  "604432": { jurisdiction: "Alberta", abbreviation: "AB", country: "Canada" },
  "604433": { jurisdiction: "Nunavut", abbreviation: "NU", country: "Canada" },
  "604434": { jurisdiction: "Northwest Territories", abbreviation: "NT", country: "Canada" },
  "636000": { jurisdiction: "Virginia", abbreviation: "VA", country: "USA" },
  "636001": { jurisdiction: "New York", abbreviation: "NY", country: "USA" },
  "636002": { jurisdiction: "Massachusetts", abbreviation: "MA", country: "USA" },
  "636003": { jurisdiction: "Maryland", abbreviation: "MD", country: "USA" },
  "636004": { jurisdiction: "North Carolina", abbreviation: "NC", country: "USA" },
  "636005": { jurisdiction: "South Carolina", abbreviation: "SC", country: "USA" },
  "636006": { jurisdiction: "Connecticut", abbreviation: "CT", country: "USA" },
  "636007": { jurisdiction: "Louisiana", abbreviation: "LA", country: "USA" },
  "636008": { jurisdiction: "Montana", abbreviation: "MT", country: "USA" },
  "636009": { jurisdiction: "New Mexico", abbreviation: "NM", country: "USA" },
  "636010": { jurisdiction: "Florida", abbreviation: "FL", country: "USA" },
  "636011": { jurisdiction: "Delaware", abbreviation: "DE", country: "USA" },
  "636012": { jurisdiction: "Ontario", abbreviation: "ON", country: "Canada" },
  "636013": { jurisdiction: "Nova Scotia", abbreviation: "NS", country: "Canada" },
  "636014": { jurisdiction: "California", abbreviation: "CA", country: "USA" },
  "636015": { jurisdiction: "Texas", abbreviation: "TX", country: "USA" },
  "636016": { jurisdiction: "Newfoundland and Labrador", abbreviation: "NL", country: "Canada" },
  "636017": { jurisdiction: "New Brunswick", abbreviation: "NB", country: "Canada" },
  "636018": { jurisdiction: "Iowa", abbreviation: "IA", country: "USA" },
  "636019": { jurisdiction: "Guam", abbreviation: "GU", country: "USA" },
  "636020": { jurisdiction: "Colorado", abbreviation: "CO", country: "USA" },
  "636021": { jurisdiction: "Arkansas", abbreviation: "AR", country: "USA" },
  "636022": { jurisdiction: "Kansas", abbreviation: "KS", country: "USA" },
  "636023": { jurisdiction: "Ohio", abbreviation: "OH", country: "USA" },
  "636024": { jurisdiction: "Vermont", abbreviation: "VT", country: "USA" },
  "636025": { jurisdiction: "Pennsylvania", abbreviation: "PA", country: "USA" },
  "636026": { jurisdiction: "Arizona", abbreviation: "AZ", country: "USA" },
  "636027": { jurisdiction: "U.S. Department of State (Diplomatic)", abbreviation: "", country: "USA" },
  "636028": { jurisdiction: "British Columbia", abbreviation: "BC", country: "Canada" },
  "636029": { jurisdiction: "Oregon", abbreviation: "OR", country: "USA" },
  "636030": { jurisdiction: "Missouri", abbreviation: "MO", country: "USA" },
  "636031": { jurisdiction: "Wisconsin", abbreviation: "WI", country: "USA" },
  "636032": { jurisdiction: "Michigan", abbreviation: "MI", country: "USA" },
  "636033": { jurisdiction: "Alabama", abbreviation: "AL", country: "USA" },
  "636034": { jurisdiction: "North Dakota", abbreviation: "ND", country: "USA" },
  "636035": { jurisdiction: "Illinois", abbreviation: "IL", country: "USA" },
  "636036": { jurisdiction: "New Jersey", abbreviation: "NJ", country: "USA" },
  "636037": { jurisdiction: "Indiana", abbreviation: "IN", country: "USA" },
  "636038": { jurisdiction: "Minnesota", abbreviation: "MN", country: "USA" },
  "636039": { jurisdiction: "New Hampshire", abbreviation: "NH", country: "USA" },
  "636040": { jurisdiction: "Utah", abbreviation: "UT", country: "USA" },
  "636041": { jurisdiction: "Maine", abbreviation: "ME", country: "USA" },
  "636042": { jurisdiction: "South Dakota", abbreviation: "SD", country: "USA" },
  "636043": { jurisdiction: "District of Columbia", abbreviation: "DC", country: "USA" },
  "636044": { jurisdiction: "Saskatchewan", abbreviation: "SK", country: "Canada" },
  "636045": { jurisdiction: "Washington", abbreviation: "WA", country: "USA" },
  "636046": { jurisdiction: "Kentucky", abbreviation: "KY", country: "USA" },
  "636047": { jurisdiction: "Hawaii", abbreviation: "HI", country: "USA" },
  "636048": { jurisdiction: "Manitoba", abbreviation: "MB", country: "Canada" },
  "636049": { jurisdiction: "Nevada", abbreviation: "NV", country: "USA" },
  "636050": { jurisdiction: "Idaho", abbreviation: "ID", country: "USA" },
  "636051": { jurisdiction: "Mississippi", abbreviation: "MS", country: "USA" },
  "636052": { jurisdiction: "Rhode Island", abbreviation: "RI", country: "USA" },
  "636053": { jurisdiction: "Tennessee", abbreviation: "TN", country: "USA" },
  "636054": { jurisdiction: "Nebraska", abbreviation: "NE", country: "USA" },
  "636055": { jurisdiction: "Georgia", abbreviation: "GA", country: "USA" },
  "636056": { jurisdiction: "Coahuila", abbreviation: "CU", country: "Mexico" },
  "636057": { jurisdiction: "Hidalgo", abbreviation: "HL", country: "Mexico" },
  "636058": { jurisdiction: "Oklahoma", abbreviation: "OK", country: "USA" },
  "636059": { jurisdiction: "Alaska", abbreviation: "AK", country: "USA" },
  "636060": { jurisdiction: "Wyoming", abbreviation: "WY", country: "USA" },
  "636061": { jurisdiction: "West Virginia", abbreviation: "WV", country: "USA" },
  "636062": { jurisdiction: "U.S. Virgin Islands", abbreviation: "VI", country: "USA" },
};

const COUNTRY_DETAILS: Record<
  AamvaCountryCode,
  { name: string; heading: string }
> = {
  USA: { name: "United States", heading: "USA" },
  CAN: { name: "Canada", heading: "Canada" },
  MEX: { name: "Mexico", heading: "Mexico" },
};

const ISSUER_COUNTRY_CODES: Record<Issuer["country"], AamvaCountryCode> = {
  USA: "USA",
  Canada: "CAN",
  Mexico: "MEX",
};

const VERSION_NAMES: Record<string, string> = {
  "00": "Pre-2000 format",
  "01": "AAMVA DL/ID-2000",
  "02": "2003 Card Design Specification",
  "03": "2005 Card Design Specification",
  "04": "2009 Card Design Standard",
  "05": "2010 Card Design Standard",
  "06": "2011 Card Design Standard",
  "07": "2012 Card Design Standard",
  "08": "2013 Card Design Standard",
  "09": "2016 Card Design Standard",
  "10": "2020 Card Design Standard",
  "11": "2025 Card Design Standard",
};

const SEX_CODES: Record<string, string> = {
  "1": "Male",
  "2": "Female",
  "9": "Not specified / other",
};

const EYE_COLOR_CODES: Record<string, string> = {
  BLK: "Black",
  BLU: "Blue",
  BRO: "Brown",
  DIC: "Dichromatic",
  GRN: "Green",
  GRY: "Gray",
  HAZ: "Hazel",
  MAR: "Maroon",
  PNK: "Pink",
  UNK: "Unknown",
};

const HAIR_COLOR_CODES: Record<string, string> = {
  BAL: "Bald",
  BLK: "Black",
  BLN: "Blonde",
  BRO: "Brown",
  GRY: "Gray",
  RED: "Red / auburn",
  SDY: "Sandy",
  WHI: "White",
  UNK: "Unknown",
};

const TRUNCATION_CODES: Record<string, string> = {
  T: "Truncated",
  N: "Not truncated",
  U: "Unknown whether truncated",
};

const NAME_SUFFIX_CODES: Record<string, string> = {
  JR: "Junior",
  SR: "Senior",
  "1ST": "First",
  I: "First",
  "2ND": "Second",
  II: "Second",
  "3RD": "Third",
  III: "Third",
  "4TH": "Fourth",
  IV: "Fourth",
  "5TH": "Fifth",
  V: "Fifth",
  "6TH": "Sixth",
  VI: "Sixth",
  "7TH": "Seventh",
  VII: "Seventh",
  "8TH": "Eighth",
  VIII: "Eighth",
  "9TH": "Ninth",
  IX: "Ninth",
};

const WEIGHT_RANGE_CODES: Record<string, string> = {
  "0": "Up to 31 kg / 70 lb",
  "1": "32–45 kg / 71–100 lb",
  "2": "46–59 kg / 101–130 lb",
  "3": "60–70 kg / 131–160 lb",
  "4": "71–86 kg / 161–190 lb",
  "5": "87–100 kg / 191–220 lb",
  "6": "101–113 kg / 221–250 lb",
  "7": "114–127 kg / 251–280 lb",
  "8": "128–145 kg / 281–320 lb",
  "9": "146+ kg / 321+ lb",
};

const FIELD_LABELS: Record<string, string> = {
  DAA: "Full name",
  DAB: "Family name",
  DAC: "First name",
  DAD: "Middle name(s)",
  DAF: "Name suffix",
  DAG: "Street address",
  DAH: "Street address line 2",
  DAI: "City",
  DAJ: "Address jurisdiction",
  DAK: "Postal code",
  DAQ: "Customer ID number",
  DAU: "Height",
  DAV: "Height",
  DAW: "Weight (pounds)",
  DAX: "Weight (kilograms)",
  DAY: "Eye color",
  DAZ: "Hair color",
  DBA: "Expiration date",
  DBB: "Date of birth",
  DBC: "Sex",
  DBD: "Issue date",
  DCA: "Vehicle class",
  DCB: "Restrictions",
  DCD: "Endorsements",
  DCE: "Weight range",
  DCF: "Document discriminator",
  DCG: "Issuing country",
  DCI: "Place of birth",
  DCJ: "Audit information",
  DCK: "Inventory control number",
  DCM: "Standard vehicle classification code",
  DCN: "Standard endorsement code",
  DCO: "Standard restriction code",
  DCP: "Vehicle class description",
  DCQ: "Endorsement description",
  DCR: "Restriction description",
  DCS: "Family name",
  DCU: "Name suffix",
  DDA: "Compliance type",
  DDB: "Card revision date",
  DDD: "Limited-duration indicator",
  DDE: "Family-name truncation",
  DDF: "First-name truncation",
  DDG: "Middle-name truncation",
  DDH: "Under 18 until",
  DDI: "Under 19 until",
  DDJ: "Under 21 until",
  DDK: "Organ donor indicator",
  DDL: "Veteran indicator",
  DDM: "Commercial credential indicator",
  DDN: "Non-domiciled indicator",
  DDO: "Enhanced credential indicator",
  DDP: "Permit indicator",
};

const DATE_FIELDS = new Set([
  "DBA",
  "DBB",
  "DBD",
  "DDB",
  "DDH",
  "DDI",
  "DDJ",
]);

function cleanValue(value: string) {
  return value.replace(/[\0\x1e\r]+$/g, "").trim();
}

function appendMeaning(value: string, meaning?: string) {
  const cleaned = cleanValue(value);
  if (!meaning || meaning.toLocaleLowerCase() === cleaned.toLocaleLowerCase()) {
    return cleaned;
  }
  return `${cleaned} — ${meaning}`;
}

function formatDate(value: string, countryCode: AamvaCountryCode) {
  const cleaned = cleanValue(value);
  if (!/^\d{8}$/.test(cleaned)) return cleaned;

  let year: string;
  let month: string;
  let day: string;

  if (countryCode === "CAN" || (countryCode === "MEX" && /^(19|20)/.test(cleaned))) {
    year = cleaned.slice(0, 4);
    month = cleaned.slice(4, 6);
    day = cleaned.slice(6, 8);
  } else {
    month = cleaned.slice(0, 2);
    day = cleaned.slice(2, 4);
    year = cleaned.slice(4, 8);
  }

  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    return cleaned;
  }

  return appendMeaning(
    cleaned,
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(date),
  );
}

function formatHeight(value: string) {
  const cleaned = cleanValue(value);
  const inches = cleaned.match(/^(\d{3})\s*in$/i);
  if (inches) {
    const total = Number(inches[1]);
    return appendMeaning(cleaned, `${Math.floor(total / 12)} ft ${total % 12} in`);
  }

  const centimeters = cleaned.match(/^(\d{3})\s*cm$/i);
  if (centimeters) {
    const total = Number(centimeters[1]);
    return appendMeaning(cleaned, `${(total / 2.54).toFixed(1)} in`);
  }

  return cleaned;
}

function getJurisdictionByCode(code: string, countryCode: AamvaCountryCode) {
  const countryName = COUNTRY_DETAILS[countryCode].heading;
  const issuer = Object.values(ISSUERS).find(
    (entry) =>
      entry.abbreviation === code &&
      (entry.country === countryName ||
        (countryCode === "USA" && entry.country === "USA")),
  );
  return issuer?.jurisdiction;
}

function interpretField(
  code: string,
  value: string,
  countryCode: AamvaCountryCode,
) {
  const cleaned = cleanValue(value);
  if (!cleaned) return "";
  if (cleaned.toUpperCase() === "NONE") return appendMeaning(cleaned, "No value");
  if (cleaned.toLocaleLowerCase() === "unavl") {
    return appendMeaning(cleaned, "Unavailable");
  }

  if (DATE_FIELDS.has(code)) return formatDate(cleaned, countryCode);

  switch (code) {
    case "DBC":
      return appendMeaning(cleaned, SEX_CODES[cleaned]);
    case "DAY":
      return appendMeaning(cleaned, EYE_COLOR_CODES[cleaned.toUpperCase()]);
    case "DAZ":
      return appendMeaning(cleaned, HAIR_COLOR_CODES[cleaned.toUpperCase()]);
    case "DAU":
    case "DAV":
      return formatHeight(cleaned);
    case "DAW":
      return appendMeaning(cleaned, `${Number(cleaned)} lb`);
    case "DAX":
      return appendMeaning(cleaned, `${Number(cleaned)} kg`);
    case "DCE":
      return appendMeaning(cleaned, WEIGHT_RANGE_CODES[cleaned]);
    case "DDE":
    case "DDF":
    case "DDG":
      return appendMeaning(cleaned, TRUNCATION_CODES[cleaned.toUpperCase()]);
    case "DCU":
    case "DAF":
      return appendMeaning(cleaned, NAME_SUFFIX_CODES[cleaned.toUpperCase()]);
    case "DCM":
      return appendMeaning(cleaned, "Standard vehicle classification code");
    case "DCN":
      return appendMeaning(cleaned, "Standard endorsement code");
    case "DCO":
      return appendMeaning(cleaned, "Standard restriction code");
    case "DDA":
      return appendMeaning(
        cleaned,
        cleaned === "F" ? "Compliant" : cleaned === "N" ? "Non-compliant" : undefined,
      );
    case "DDD":
      return appendMeaning(cleaned, cleaned === "1" ? "Temporary lawful status" : undefined);
    case "DDK":
      return appendMeaning(cleaned, cleaned === "1" ? "Organ donor on issuing authority record" : undefined);
    case "DDL":
      return appendMeaning(cleaned, cleaned === "1" ? "Veteran on issuing authority record" : undefined);
    case "DDM":
      return appendMeaning(cleaned, cleaned === "1" ? "Commercial DL / learner permit" : undefined);
    case "DDN":
      return appendMeaning(cleaned, cleaned === "1" ? "Non-domiciled commercial credential" : undefined);
    case "DDO":
      return appendMeaning(cleaned, cleaned === "1" ? "Enhanced credential" : undefined);
    case "DDP":
      return appendMeaning(cleaned, cleaned === "1" ? "Permit" : undefined);
    case "DAJ":
      return appendMeaning(cleaned, getJurisdictionByCode(cleaned, countryCode));
    case "DCG":
      return appendMeaning(cleaned, COUNTRY_DETAILS[countryCode].name);
    default:
      return cleaned;
  }
}

function parseFields(subfile: string) {
  const fields: Record<string, string> = {};
  const normalized = subfile
    .replace(/^(DL|ID)/, "")
    .replace(/\r\n/g, "\n")
    .replace(/[\r\x1e]/g, "\n");

  for (const line of normalized.split("\n")) {
    const match = line.match(/^([A-Z0-9]{3})([\s\S]*)$/);
    if (!match) continue;
    const [, code, value] = match;
    if (code.startsWith("D")) fields[code] = cleanValue(value);
  }

  return fields;
}

function getDocumentSubfile(
  rawValue: string,
  descriptorStart: number,
  entryCount: number,
) {
  for (let index = 0; index < entryCount; index += 1) {
    const descriptor = rawValue.slice(
      descriptorStart + index * 10,
      descriptorStart + (index + 1) * 10,
    );
    const type = descriptor.slice(0, 2);
    const offset = Number(descriptor.slice(2, 6));
    const length = Number(descriptor.slice(6, 10));
    if (
      (type === "DL" || type === "ID") &&
      Number.isInteger(offset) &&
      Number.isInteger(length) &&
      offset >= 0 &&
      length > 2
    ) {
      return {
        documentType: type,
        value: rawValue.slice(offset, offset + length),
      } as const;
    }
  }

  const fallback = rawValue.match(/(?:^|[\n\r\x1e])(DL|ID)(?=D[A-Z0-9]{2})/);
  if (!fallback || fallback.index === undefined) return null;
  const start = fallback.index + fallback[0].length - 2;
  return {
    documentType: fallback[1] as "DL" | "ID",
    value: rawValue.slice(start),
  };
}

function makeIssuerLabel(iin: string) {
  const issuer = ISSUERS[iin];
  if (!issuer) return "Unlisted issuing authority";
  const abbreviation = issuer.abbreviation ? ` (${issuer.abbreviation})` : "";
  return `${issuer.jurisdiction}${abbreviation}, ${issuer.country}`;
}

function getCountryCodeFromIin(iin: string) {
  const issuer = ISSUERS[iin];
  return issuer ? ISSUER_COUNTRY_CODES[issuer.country] : null;
}

function addField(
  target: AamvaDisplayField[],
  used: Set<string>,
  fields: Record<string, string>,
  countryCode: AamvaCountryCode,
  code: string,
  label = FIELD_LABELS[code] ?? `Field ${code}`,
  wide = false,
) {
  const value = fields[code];
  if (!value) return;
  used.add(code);
  target.push({
    label: `${label} (${code})`,
    value: interpretField(code, value, countryCode),
    wide,
  });
}

function addCodeWithDescription(
  target: AamvaDisplayField[],
  used: Set<string>,
  fields: Record<string, string>,
  code: string,
  descriptionCode: string,
  label: string,
) {
  const value = fields[code];
  if (!value) return;
  used.add(code);
  const description = fields[descriptionCode];
  if (description) used.add(descriptionCode);
  target.push({
    label: `${label} (${code})`,
    value: appendMeaning(
      value,
      description || `Jurisdiction-specific ${label.toLocaleLowerCase()} code`,
    ),
    wide: true,
  });
}

export function parseAamva(rawValue: string): AamvaData | null {
  const ansiIndex = rawValue.indexOf("ANSI ");
  if (!rawValue.startsWith("@") || ansiIndex < 0) return null;

  const fixedHeaderStart = ansiIndex + 5;
  const issuerIdentificationNumber = rawValue.slice(
    fixedHeaderStart,
    fixedHeaderStart + 6,
  );
  const aamvaVersion = rawValue.slice(
    fixedHeaderStart + 6,
    fixedHeaderStart + 8,
  );
  const jurisdictionVersion = rawValue.slice(
    fixedHeaderStart + 8,
    fixedHeaderStart + 10,
  );
  const entryCount = Number(
    rawValue.slice(fixedHeaderStart + 10, fixedHeaderStart + 12),
  );

  if (
    !/^\d{6}$/.test(issuerIdentificationNumber) ||
    !/^\d{2}$/.test(aamvaVersion) ||
    !/^\d{2}$/.test(jurisdictionVersion) ||
    !Number.isInteger(entryCount) ||
    entryCount < 1 ||
    entryCount > 99
  ) {
    return null;
  }

  const documentSubfile = getDocumentSubfile(
    rawValue,
    fixedHeaderStart + 12,
    entryCount,
  );
  if (!documentSubfile) return null;

  const fields = parseFields(documentSubfile.value);
  const hasCountryField = Object.prototype.hasOwnProperty.call(fields, "DCG");
  const encodedCountryCode = fields.DCG;
  const countryCode =
    encodedCountryCode && encodedCountryCode in COUNTRY_DETAILS
      ? (encodedCountryCode as AamvaCountryCode)
      : hasCountryField && encodedCountryCode === ""
        ? getCountryCodeFromIin(issuerIdentificationNumber)
        : null;
  if (!countryCode) return null;

  const familyName = fields.DCS || fields.DAB || fields.DAA;
  if (!fields.DAQ || !familyName || !fields.DBB) return null;

  const country = COUNTRY_DETAILS[countryCode];
  const issuer = makeIssuerLabel(issuerIdentificationNumber);
  const used = new Set<string>(["DCG"]);
  const summary: AamvaDisplayField[] = [
    {
      label: "Issuing country (DCG)",
      value: encodedCountryCode
        ? appendMeaning(encodedCountryCode, country.name)
        : "[Empty]",
    },
    {
      label: "Issuer Identification Number (IIN)",
      value: appendMeaning(issuerIdentificationNumber, issuer),
      wide: true,
    },
    {
      label: "Document type",
      value: appendMeaning(
        documentSubfile.documentType,
        documentSubfile.documentType === "DL"
          ? "Driver license"
          : "Identification card",
      ),
    },
    {
      label: "AAMVA barcode version",
      value: appendMeaning(aamvaVersion, VERSION_NAMES[aamvaVersion]),
    },
    {
      label: "Jurisdiction version",
      value: jurisdictionVersion,
    },
  ];

  const identity: AamvaDisplayField[] = [];
  addField(identity, used, fields, countryCode, "DAQ");
  if (fields.DCS) addField(identity, used, fields, countryCode, "DCS");
  else if (fields.DAB) addField(identity, used, fields, countryCode, "DAB");
  else addField(identity, used, fields, countryCode, "DAA");
  addField(identity, used, fields, countryCode, "DAC");
  addField(identity, used, fields, countryCode, "DAD");
  if (fields.DCU) addField(identity, used, fields, countryCode, "DCU");
  else addField(identity, used, fields, countryCode, "DAF");
  addField(identity, used, fields, countryCode, "DBB");
  addField(identity, used, fields, countryCode, "DBC");
  addField(identity, used, fields, countryCode, "DAU");
  addField(identity, used, fields, countryCode, "DAV");
  addField(identity, used, fields, countryCode, "DAY");
  addField(identity, used, fields, countryCode, "DAZ");
  addField(identity, used, fields, countryCode, "DAW");
  addField(identity, used, fields, countryCode, "DAX");
  addField(identity, used, fields, countryCode, "DCE");
  addField(identity, used, fields, countryCode, "DCI", undefined, true);

  const address: AamvaDisplayField[] = [];
  addField(address, used, fields, countryCode, "DAG", undefined, true);
  addField(address, used, fields, countryCode, "DAH", undefined, true);
  addField(address, used, fields, countryCode, "DAI");
  addField(address, used, fields, countryCode, "DAJ");
  addField(address, used, fields, countryCode, "DAK");

  const credential: AamvaDisplayField[] = [];
  addField(credential, used, fields, countryCode, "DBD");
  addField(credential, used, fields, countryCode, "DBA");
  addField(credential, used, fields, countryCode, "DCF", undefined, true);
  addField(credential, used, fields, countryCode, "DDA");
  addField(credential, used, fields, countryCode, "DDB");
  addField(credential, used, fields, countryCode, "DDD");
  addField(credential, used, fields, countryCode, "DDK");
  addField(credential, used, fields, countryCode, "DDL");
  addField(credential, used, fields, countryCode, "DDM");
  addField(credential, used, fields, countryCode, "DDN");
  addField(credential, used, fields, countryCode, "DDO");
  addField(credential, used, fields, countryCode, "DDP");
  addField(credential, used, fields, countryCode, "DCK", undefined, true);
  addField(credential, used, fields, countryCode, "DCJ", undefined, true);
  addField(credential, used, fields, countryCode, "DDE");
  addField(credential, used, fields, countryCode, "DDF");
  addField(credential, used, fields, countryCode, "DDG");
  addField(credential, used, fields, countryCode, "DDH");
  addField(credential, used, fields, countryCode, "DDI");
  addField(credential, used, fields, countryCode, "DDJ");

  const privileges: AamvaDisplayField[] = [];
  addCodeWithDescription(privileges, used, fields, "DCA", "DCP", "Vehicle class");
  addCodeWithDescription(privileges, used, fields, "DCB", "DCR", "Restrictions");
  addCodeWithDescription(privileges, used, fields, "DCD", "DCQ", "Endorsements");
  addField(privileges, used, fields, countryCode, "DCM", undefined, true);
  addField(privileges, used, fields, countryCode, "DCN", undefined, true);
  addField(privileges, used, fields, countryCode, "DCO", undefined, true);

  const additional: AamvaDisplayField[] = [];
  for (const [code, value] of Object.entries(fields)) {
    if (used.has(code) || !value) continue;
    additional.push({
      label: `${FIELD_LABELS[code] ?? "Additional encoded field"} (${code})`,
      value: interpretField(code, value, countryCode),
      wide: true,
    });
  }

  const sections: AamvaDisplaySection[] = [
    { title: "Identity", fields: identity },
    { title: "Address", fields: address },
    { title: "Credential", fields: credential },
    { title: "Driving privileges", fields: privileges },
    { title: "Additional encoded fields", fields: additional },
  ].filter((section) => section.fields.length);

  return {
    countryCode,
    countryName: country.name,
    headingCountry: country.heading,
    documentType: documentSubfile.documentType,
    issuerIdentificationNumber,
    issuer,
    aamvaVersion,
    jurisdictionVersion,
    summary,
    sections,
    fields,
  };
}
