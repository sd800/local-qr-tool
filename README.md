# Local QR Studio

[Visit deployed website](https://qrlocal.songming.org)

QR Studio is a privacy-first barcode generator and reader that runs entirely
in the browser. It creates customizable visual codes, exports PNG and SVG
images, and reads supported codes from a camera or image file without sending
user data to a server.

## Features

### Code Generation

- Generate QR, PDF417, Aztec, UPC-A, EAN-13, Code 128, GS1 DataBar,
  Data Matrix, and Micro QR images
- Customize image size, error correction, colors, and quiet zone
- Copy generated images directly to the clipboard
- Download generated codes as PNG or SVG

### Code Reading

- Scan supported visual codes with a device camera
- Choose, drag, or paste an image from the clipboard for local scanning
- Request continuous camera autofocus where supported and retry difficult scans
  with local image enhancement
- Apply additional multi-pass sharpening, global and adaptive thresholding, and
  inverted-code recovery to difficult still images
- Run difficult-image recovery passes only as needed and stop processing as soon
  as a decoder succeeds
- Read QR, Micro QR, Aztec, Data Matrix, PDF417, UPC/EAN, Code 39/93/128,
  Codabar, ITF, and DataBar from PNG, JPG, WebP, and GIF images

### Structured Data Decoding

- Decode IATA BCBP boarding-pass fields locally from supported 2D codes
- Decode AAMVA CDS driver-license and identification-card fields locally from
  compatible USA, Canadian, and Mexican PDF417 codes

### Interface and Deployment

- Light and dark themes with native browser color-scheme support
- Responsive layout for desktop and mobile devices
- Static deployment with no backend or account system

## Privacy

QR content, chosen or pasted images, and camera frames are processed locally
in the browser. The application does not transmit or store any data.

## Requirements

- Node.js 20 or later for local development
- A modern browser with JavaScript enabled
- Local server or HTTPS for camera access in production

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The build creates:

- `dist/` — local production output
- `docs/` — committed static files for GitHub Pages

The generated `index.html` is self-contained and can also be opened directly
from the local filesystem. Camera access requires HTTPS or a local development
server.

## Technology

- React
- TypeScript
- Vite
- bwip-js
- qr-scanner
- ZXing
- Lucide

## Project Structure

```text
docs/       GitHub Pages website
scripts/    Build utilities
src/        Application source
```

![Illustration image](illu.png)
