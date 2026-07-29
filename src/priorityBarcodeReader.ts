import {
  AztecCodeReader,
  BarcodeFormat,
  type BinaryBitmap,
  DataMatrixReader,
  DecodeHintType,
  MicroQRCodeReader,
  MultiFormatOneDReader,
  NotFoundException,
  PDF417Reader,
  QRCodeReader,
  type Reader,
  type Result,
} from "@zxing/library";

const ONE_DIMENSIONAL_FORMATS = [
  BarcodeFormat.UPC_A,
  BarcodeFormat.EAN_13,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
  BarcodeFormat.RSS_14,
  BarcodeFormat.RSS_EXPANDED,
];

class PriorityBarcodeReader implements Reader {
  private readonly readers: Reader[];

  constructor() {
    const oneDimensionalHints = new Map<DecodeHintType, unknown>([
      [DecodeHintType.POSSIBLE_FORMATS, ONE_DIMENSIONAL_FORMATS],
    ]);

    this.readers = [
      new QRCodeReader(),
      new PDF417Reader(),
      new AztecCodeReader(),
      new MultiFormatOneDReader(oneDimensionalHints),
      new DataMatrixReader(),
      new MicroQRCodeReader(),
    ];
  }

  decode(
    image: BinaryBitmap,
    hints?: Map<DecodeHintType, unknown> | null,
  ): Result {
    for (const reader of this.readers) {
      try {
        return reader.decode(image, hints);
      } catch {
        reader.reset();
      }
    }

    throw new NotFoundException();
  }

  reset() {
    this.readers.forEach((reader) => reader.reset());
  }
}

export function createPriorityBarcodeReader() {
  return new PriorityBarcodeReader();
}
