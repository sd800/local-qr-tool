import {
  azteccode,
  code128,
  databaromni,
  datamatrix,
  drawingCanvas,
  drawingSVG,
  ean13,
  microqrcode,
  pdf417,
  qrcode,
  upca,
} from "bwip-js/browser";

export type BarcodeType =
  | "qr"
  | "pdf417"
  | "aztec"
  | "upca"
  | "ean13"
  | "code128"
  | "databar"
  | "datamatrix"
  | "microqr";

export type BarcodeErrorLevel = "L" | "M" | "Q" | "H";
export type BarcodeShape = "square" | "stacked" | "linear";

export type BarcodeConfig = {
  type: BarcodeType;
  label: string;
  shortName: string;
  bcid: string;
  shape: BarcodeShape;
  sample: string;
  inputLabel: string;
  placeholder: string;
  maxLength: number;
  supportsErrorRecovery: boolean;
  showText: boolean;
};

export const BARCODE_CONFIGS: BarcodeConfig[] = [
  {
    type: "qr",
    label: "QR code",
    shortName: "QR",
    bcid: "qrcode",
    shape: "square",
    sample: "https://example.com",
    inputLabel: "Text or URL",
    placeholder: "Paste a link or type any message...",
    maxLength: 1600,
    supportsErrorRecovery: true,
    showText: false,
  },
  {
    type: "pdf417",
    label: "PDF417",
    shortName: "PDF417",
    bcid: "pdf417",
    shape: "stacked",
    sample: "Sample Content",
    inputLabel: "Content",
    placeholder: "Enter text, ticket, or document data...",
    maxLength: 1600,
    supportsErrorRecovery: false,
    showText: false,
  },
  {
    type: "aztec",
    label: "Aztec code",
    shortName: "AZTEC",
    bcid: "azteccode",
    shape: "square",
    sample: "Sample Content",
    inputLabel: "Content",
    placeholder: "Enter text or a URL...",
    maxLength: 1600,
    supportsErrorRecovery: false,
    showText: false,
  },
  {
    type: "upca",
    label: "1D Barcode (UPC-A)",
    shortName: "UPC-A",
    bcid: "upca",
    shape: "linear",
    sample: "012345678905",
    inputLabel: "UPC-A digits",
    placeholder: "Enter 11 or 12 digits...",
    maxLength: 12,
    supportsErrorRecovery: false,
    showText: true,
  },
  {
    type: "ean13",
    label: "1D Barcode (EAN-13)",
    shortName: "EAN-13",
    bcid: "ean13",
    shape: "linear",
    sample: "5901234123457",
    inputLabel: "EAN-13 digits",
    placeholder: "Enter 12 or 13 digits...",
    maxLength: 13,
    supportsErrorRecovery: false,
    showText: true,
  },
  {
    type: "code128",
    label: "1D Barcode (Code 128)",
    shortName: "CODE 128",
    bcid: "code128",
    shape: "linear",
    sample: "CODE-128-123",
    inputLabel: "Content",
    placeholder: "Enter letters, numbers, or symbols...",
    maxLength: 240,
    supportsErrorRecovery: false,
    showText: true,
  },
  {
    type: "databar",
    label: "GS1 DataBar",
    shortName: "DATABAR",
    bcid: "databaromni",
    shape: "linear",
    sample: "(01)09501101530003",
    inputLabel: "GS1 element string",
    placeholder: "Example: (01)09501101530003",
    maxLength: 18,
    supportsErrorRecovery: false,
    showText: true,
  },
  {
    type: "datamatrix",
    label: "Data Matrix",
    shortName: "DATA MATRIX",
    bcid: "datamatrix",
    shape: "square",
    sample: "DATA MATRIX SAMPLE",
    inputLabel: "Content",
    placeholder: "Enter text or structured data...",
    maxLength: 1500,
    supportsErrorRecovery: false,
    showText: false,
  },
  {
    type: "microqr",
    label: "Micro QR code",
    shortName: "MICRO QR",
    bcid: "microqrcode",
    shape: "square",
    sample: "MICRO QR",
    inputLabel: "Short content",
    placeholder: "Enter a short message...",
    maxLength: 35,
    supportsErrorRecovery: true,
    showText: false,
  },
];

export function getBarcodeConfig(type: BarcodeType) {
  return (
    BARCODE_CONFIGS.find((config) => config.type === type) ??
    BARCODE_CONFIGS[0]
  );
}

export function getDefaultBarcodeValues() {
  return Object.fromEntries(
    BARCODE_CONFIGS.map((config) => [config.type, config.sample]),
  ) as Record<BarcodeType, string>;
}

type BarcodeRenderOptions = {
  bcid: string;
  text: string;
  scale: number;
  paddingwidth: number;
  paddingheight: number;
  barcolor: string;
  backgroundcolor: string;
  includetext?: boolean;
  textxalign?: "center";
  textsize?: number;
  textcolor?: string;
  height?: number;
  eclevel?: BarcodeErrorLevel;
};

type BarcodeRenderInput = {
  type: BarcodeType;
  text: string;
  size: number;
  margin: number;
  foreground: string;
  background: string;
  level: BarcodeErrorLevel;
};

function buildOptions(
  input: BarcodeRenderInput,
  scale: number,
): BarcodeRenderOptions {
  const config = getBarcodeConfig(input.type);
  const options: BarcodeRenderOptions = {
    bcid: config.bcid,
    text: input.text,
    scale,
    paddingwidth: input.margin,
    paddingheight: input.margin,
    barcolor: input.foreground,
    backgroundcolor: input.background,
  };

  if (config.showText) {
    options.includetext = true;
    options.textxalign = "center";
    options.textsize = 10;
    options.textcolor = input.foreground;
    options.height = 18;
  }

  if (config.supportsErrorRecovery) {
    options.eclevel =
      input.type === "microqr" && input.level === "H" ? "Q" : input.level;
  }

  return options;
}

function encodeSvg(type: BarcodeType, options: BarcodeRenderOptions) {
  const drawing = drawingSVG();

  switch (type) {
    case "qr":
      return qrcode(options, drawing);
    case "pdf417":
      return pdf417(options, drawing);
    case "aztec":
      return azteccode(options, drawing);
    case "upca":
      return upca(options, drawing);
    case "ean13":
      return ean13(options, drawing);
    case "code128":
      return code128(options, drawing);
    case "databar":
      return databaromni(options, drawing);
    case "datamatrix":
      return datamatrix(options, drawing);
    case "microqr":
      return microqrcode(options, drawing);
  }
}

function encodeCanvas(
  type: BarcodeType,
  options: BarcodeRenderOptions,
  canvas: HTMLCanvasElement,
) {
  const drawing = drawingCanvas(canvas);

  switch (type) {
    case "qr":
      qrcode(options, drawing);
      break;
    case "pdf417":
      pdf417(options, drawing);
      break;
    case "aztec":
      azteccode(options, drawing);
      break;
    case "upca":
      upca(options, drawing);
      break;
    case "ean13":
      ean13(options, drawing);
      break;
    case "code128":
      code128(options, drawing);
      break;
    case "databar":
      databaromni(options, drawing);
      break;
    case "datamatrix":
      datamatrix(options, drawing);
      break;
    case "microqr":
      microqrcode(options, drawing);
      break;
  }
}

function getRenderScale(input: BarcodeRenderInput) {
  const baseSvg = encodeSvg(input.type, buildOptions(input, 1));
  const widthMatch = baseSvg.match(/viewBox="0 0 ([\d.]+) [\d.]+"/);
  const baseWidth = Number(widthMatch?.[1]) || input.size;
  return Math.max(1, Math.floor(input.size / baseWidth));
}

export function renderBarcodeCanvas(
  canvas: HTMLCanvasElement,
  input: BarcodeRenderInput,
) {
  encodeCanvas(input.type, buildOptions(input, getRenderScale(input)), canvas);
}

export function renderBarcodeSvg(input: BarcodeRenderInput) {
  return encodeSvg(
    input.type,
    buildOptions(input, getRenderScale(input)),
  );
}

export function getBarcodeErrorMessage(type: BarcodeType) {
  switch (type) {
    case "upca":
      return "UPC-A requires 11 digits, or 12 digits with a valid check digit.";
    case "ean13":
      return "EAN-13 requires 12 digits, or 13 digits with a valid check digit.";
    case "databar":
      return "GS1 DataBar requires (01) followed by 13 or 14 digits.";
    case "microqr":
      return "This content is too long or incompatible with Micro QR.";
    default:
      return `This content cannot be encoded as ${getBarcodeConfig(type).label}.`;
  }
}
