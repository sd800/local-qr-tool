import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(projectRoot, "docs");

const colors = {
  dark: [23, 25, 24, 255],
  violet: [111, 103, 255, 255],
  white: [255, 254, 250, 255],
};

function createCanvas(size) {
  const pixels = Buffer.alloc(size * size * 4);

  function setPixel(x, y, color) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const offset = (y * size + x) * 4;
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = color[3];
  }

  function fillRect(x, y, width, height, color) {
    for (let py = y; py < y + height; py += 1) {
      for (let px = x; px < x + width; px += 1) {
        setPixel(px, py, color);
      }
    }
  }

  function fillRoundedRect(x, y, width, height, radius, color) {
    const right = x + width - 1;
    const bottom = y + height - 1;

    for (let py = y; py <= bottom; py += 1) {
      for (let px = x; px <= right; px += 1) {
        const nearestX = Math.max(x + radius, Math.min(px, right - radius));
        const nearestY = Math.max(y + radius, Math.min(py, bottom - radius));
        const dx = px - nearestX;
        const dy = py - nearestY;
        if (dx * dx + dy * dy <= radius * radius) {
          setPixel(px, py, color);
        }
      }
    }
  }

  function drawThickLine(x1, y1, x2, y2, width, color) {
    const radius = width / 2;
    const minX = Math.floor(Math.min(x1, x2) - radius);
    const maxX = Math.ceil(Math.max(x1, x2) + radius);
    const minY = Math.floor(Math.min(y1, y2) - radius);
    const maxY = Math.ceil(Math.max(y1, y2) + radius);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const projection =
          ((x - x1) * dx + (y - y1) * dy) / lengthSquared;
        const t = Math.max(0, Math.min(1, projection));
        const nearestX = x1 + t * dx;
        const nearestY = y1 + t * dy;
        const distanceX = x - nearestX;
        const distanceY = y - nearestY;

        if (
          distanceX * distanceX + distanceY * distanceY <=
          radius * radius
        ) {
          setPixel(x, y, color);
        }
      }
    }
  }

  return { drawThickLine, fillRect, fillRoundedRect, pixels };
}

function drawMark(canvas, size, glyphScale) {
  const unit = (size / 192) * glyphScale;
  const coordinate = (value) =>
    Math.round(size / 2 + (value - 96) * unit);
  const dimension = (value) => Math.max(1, Math.round(value * unit));
  const roundedRect = (x, y, width, height, radius, color) =>
    canvas.fillRoundedRect(
      coordinate(x),
      coordinate(y),
      dimension(width),
      dimension(height),
      dimension(radius),
      color,
    );
  const thickLine = (x1, y1, x2, y2, width, color) =>
    canvas.drawThickLine(
      coordinate(x1),
      coordinate(y1),
      coordinate(x2),
      coordinate(y2),
      dimension(width),
      color,
    );

  roundedRect(17, 53, 55, 81, 14, colors.white);
  roundedRect(30, 66, 29, 55, 7, colors.dark);
  thickLine(53, 112, 72, 136, 13, colors.white);

  roundedRect(81, 53, 13, 84, 6, colors.white);
  roundedRect(81, 53, 48, 13, 6, colors.white);
  roundedRect(81, 88, 48, 13, 6, colors.white);
  roundedRect(116, 53, 13, 48, 6, colors.white);
  thickLine(103, 96, 134, 136, 13, colors.white);

  thickLine(143, 138, 171, 52, 14, colors.violet);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const targetOffset = y * (size * 4 + 1);
    scanlines[targetOffset] = 0;
    pixels.copy(
      scanlines,
      targetOffset + 1,
      y * size * 4,
      (y + 1) * size * 4,
    );
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function createIcon({ fileName, size, glyphScale, rounded }) {
  const canvas = createCanvas(size);

  if (rounded) {
    const margin = Math.round((5 / 192) * size);
    canvas.fillRoundedRect(
      margin,
      margin,
      size - margin * 2,
      size - margin * 2,
      Math.round((38 / 192) * size),
      colors.dark,
    );
  } else {
    canvas.fillRect(0, 0, size, size, colors.dark);
  }

  drawMark(canvas, size, glyphScale);
  await writeFile(
    resolve(outputRoot, fileName),
    encodePng(size, canvas.pixels),
  );
}

const icons = [
  { fileName: "favicon.png", size: 192, glyphScale: 1, rounded: true },
  {
    fileName: "apple-touch-icon.png",
    size: 180,
    glyphScale: 0.82,
    rounded: false,
  },
  {
    fileName: "app-icon-192.png",
    size: 192,
    glyphScale: 0.82,
    rounded: false,
  },
  {
    fileName: "app-icon-512.png",
    size: 512,
    glyphScale: 0.82,
    rounded: false,
  },
  {
    fileName: "app-icon-maskable-512.png",
    size: 512,
    glyphScale: 0.68,
    rounded: false,
  },
];

await Promise.all(icons.map(createIcon));
console.log(`Created ${icons.length} web icons in ${outputRoot}`);
