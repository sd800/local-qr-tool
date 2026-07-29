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

function cleanField(value: string) {
  return value.trim();
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
