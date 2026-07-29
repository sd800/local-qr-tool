export type BcbpSegment = {
  operatingCarrierPnr: string;
  origin: string;
  destination: string;
  operatingCarrier: string;
  flightNumber: string;
  flightDate: string;
  compartmentCode: string;
  seatNumber: string;
  checkInSequence: string;
  passengerStatus: string;
};

export type BcbpData = {
  formatCode: string;
  numberOfLegs: number;
  passengerName: string;
  electronicTicketIndicator: string;
  segments: BcbpSegment[];
};

const HEADER_LENGTH = 23;
const MANDATORY_SEGMENT_LENGTH = 35;
const VARIABLE_SIZE_LENGTH = 2;

const COMPARTMENT_CODE_NAMES: Record<string, string> = {
  F: "First class",
  C: "Business class",
  J: "Business class",
  W: "Premium economy",
  Y: "Economy",
};

const PASSENGER_STATUS_NAMES: Record<string, string> = {
  "0": "Ticket issued; passenger not checked in",
  "1": "Ticket issued; passenger checked in",
  "2": "Baggage checked; passenger not checked in",
  "3": "Baggage checked; passenger checked in",
  "4": "Passenger passed security check",
  "5": "Passenger passed gate exit (coupon used)",
  "6": "Transit",
  "7": "Standby",
  "8": "Boarding data revalidation completed",
  "9": "Original boarding line used at ticket issuance",
  A: "Upgrade or downgrade required at closeout",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function cleanField(value: string) {
  return value.trim();
}

function appendMeaning(value: string, meaning?: string) {
  const cleaned = cleanField(value);
  return cleaned && meaning ? `${cleaned} — ${meaning}` : cleaned;
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getMonthAndDay(julianDay: number, leapYear: boolean) {
  const maximumDay = leapYear ? 366 : 365;
  if (julianDay < 1 || julianDay > maximumDay) {
    return `Not applicable (day ${julianDay} does not occur)`;
  }

  const monthLengths = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let remainingDays = julianDay;

  for (let month = 0; month < monthLengths.length; month += 1) {
    if (remainingDays <= monthLengths[month]) {
      return `${MONTH_NAMES[month]} ${remainingDays}`;
    }
    remainingDays -= monthLengths[month];
  }

  return "";
}

export function formatBcbpFormatCode(value: string) {
  return appendMeaning(value, value === "M" ? "IATA BCBP format" : undefined);
}

export function formatBcbpElectronicTicketIndicator(value: string) {
  const cleaned = cleanField(value);
  if (!cleaned) return "Not indicated";
  return appendMeaning(
    cleaned,
    cleaned === "E" ? "Electronic ticket" : undefined,
  );
}

export function formatBcbpCompartmentCode(value: string) {
  const cleaned = cleanField(value);
  return appendMeaning(
    cleaned,
    COMPARTMENT_CODE_NAMES[cleaned.toUpperCase()],
  );
}

export function formatBcbpPassengerStatus(value: string) {
  const cleaned = cleanField(value);
  const code = cleaned.toUpperCase();
  const meaning =
    PASSENGER_STATUS_NAMES[code] ??
    (/^[B-Z]$/.test(code) ? "Reserved for future industry use" : undefined);
  return appendMeaning(cleaned, meaning);
}

export function getBcbpFlightDateDetails(
  value: string,
  currentYear = new Date().getFullYear(),
) {
  const julianDay = Number(value);
  const currentYearIsLeap = isLeapYear(currentYear);
  const currentType = currentYearIsLeap ? "Leap year" : "Common year";
  const alternateType = currentYearIsLeap ? "Common year" : "Leap year";

  return {
    julianDay: `Julian day ${value}`,
    currentYearLabel: `${currentType} (${currentYear}):`,
    currentYearDate: getMonthAndDay(
      julianDay,
      currentYearIsLeap,
    ),
    alternateYearLabel: `${alternateType}:`,
    alternateYearDate: getMonthAndDay(julianDay, !currentYearIsLeap),
  };
}

export function formatBcbpFlightDate(
  value: string,
  currentYear = new Date().getFullYear(),
) {
  const details = getBcbpFlightDateDetails(value, currentYear);
  return [
    details.julianDay,
    `${details.currentYearLabel} ${details.currentYearDate}`,
    `${details.alternateYearLabel} ${details.alternateYearDate}`,
  ].join("\n");
}

function isValidLocation(value: string) {
  return /^[A-Z0-9]{3}$/.test(value);
}

function readSegment(value: string, offset: number): BcbpSegment | null {
  const mandatory = value.slice(offset, offset + MANDATORY_SEGMENT_LENGTH);
  if (mandatory.length !== MANDATORY_SEGMENT_LENGTH) return null;

  const origin = cleanField(mandatory.slice(7, 10));
  const destination = cleanField(mandatory.slice(10, 13));
  const operatingCarrier = cleanField(mandatory.slice(13, 16));
  const flightNumber = cleanField(mandatory.slice(16, 21));
  const flightDate = mandatory.slice(21, 24);
  const julianDay = Number(flightDate);

  if (
    !isValidLocation(origin) ||
    !isValidLocation(destination) ||
    !operatingCarrier ||
    !flightNumber ||
    !/^\d{3}$/.test(flightDate) ||
    julianDay < 1 ||
    julianDay > 366
  ) {
    return null;
  }

  return {
    operatingCarrierPnr: cleanField(mandatory.slice(0, 7)),
    origin,
    destination,
    operatingCarrier,
    flightNumber,
    flightDate,
    compartmentCode: cleanField(mandatory.slice(24, 25)),
    seatNumber: cleanField(mandatory.slice(25, 29)),
    checkInSequence: cleanField(mandatory.slice(29, 34)),
    passengerStatus: cleanField(mandatory.slice(34, 35)),
  };
}

export function parseBcbp(rawValue: string): BcbpData | null {
  const value = rawValue.replace(/[\r\n\0]/g, "");

  if (value.length < HEADER_LENGTH || value[0] !== "M") return null;

  const numberOfLegs = Number(value[1]);
  if (!Number.isInteger(numberOfLegs) || numberOfLegs < 1 || numberOfLegs > 4) {
    return null;
  }

  const passengerName = cleanField(value.slice(2, 22));
  if (!passengerName) return null;

  const segments: BcbpSegment[] = [];
  let offset = HEADER_LENGTH;

  for (let index = 0; index < numberOfLegs; index += 1) {
    const segment = readSegment(value, offset);
    if (!segment) return null;
    segments.push(segment);
    offset += MANDATORY_SEGMENT_LENGTH;

    const variableSizeValue = value.slice(
      offset,
      offset + VARIABLE_SIZE_LENGTH,
    );
    if (!/^[0-9A-Fa-f]{2}$/.test(variableSizeValue)) return null;

    const variableSize = Number.parseInt(variableSizeValue, 16);
    offset += VARIABLE_SIZE_LENGTH;
    if (offset + variableSize > value.length) return null;
    offset += variableSize;
  }

  return {
    formatCode: value[0],
    numberOfLegs,
    passengerName,
    electronicTicketIndicator: cleanField(value.slice(22, 23)),
    segments,
  };
}
