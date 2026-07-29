import {
  ArrowUpRight,
  Camera,
  Check,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Code2,
  Copy,
  Download,
  FileImage,
  ImageUp,
  Link2,
  LockKeyhole,
  Moon,
  Palette,
  QrCode,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Type,
  Upload,
  X,
} from "lucide-react";
import {
  BrowserCodeReader,
  type IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat, PDF417Reader } from "@zxing/library";
import QrScanner from "qr-scanner";
import {
  BARCODE_CONFIGS,
  type BarcodeErrorLevel,
  type BarcodeType,
  getBarcodeConfig,
  getBarcodeErrorMessage,
  getDefaultBarcodeValues,
  renderBarcodeCanvas,
  renderBarcodeSvg,
} from "./barcodeGeneration";
import { parseAamva } from "./aamva";
import {
  formatBcbpCompartmentCode,
  formatBcbpElectronicTicketIndicator,
  formatBcbpOperatingCarrier,
  formatBcbpPassengerStatus,
  getBcbpFlightDateDetails,
  parseBcbp,
  type BcbpSegment,
} from "./bcbp";
import { createPriorityBarcodeReader } from "./priorityBarcodeReader";
import {
  applyCameraOptimizations,
  createEnhancedImageFrames,
  createEnhancedVideoFrames,
  createRotatedFrame,
} from "./scannerEnhancements";
import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type WorkspaceMode = "generate" | "scan";
type ScanMode = "camera" | "upload";
type Theme = "light" | "dark";
type CameraState =
  | "idle"
  | "starting"
  | "active"
  | "denied"
  | "unsupported"
  | "error";

const BCBP_FORMATS = new Set([
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.AZTEC,
  BarcodeFormat.PDF_417,
]);

const PDF417_ROTATION_ANGLES = [
  90, 45, 135, 15, 165, 30, 150, 60, 120, 75, 105,
] as const;
const PDF417_CAMERA_ROTATIONS_PER_PASS = 4;

const SCAN_FORMAT_NAMES = new Map<BarcodeFormat, string>([
  [BarcodeFormat.QR_CODE, "QR"],
  [BarcodeFormat.MICRO_QR_CODE, "MICRO QR"],
  [BarcodeFormat.PDF_417, "PDF417"],
  [BarcodeFormat.AZTEC, "AZTEC"],
  [BarcodeFormat.DATA_MATRIX, "DATA MATRIX"],
  [BarcodeFormat.UPC_A, "UPC-A"],
  [BarcodeFormat.UPC_E, "UPC-E"],
  [BarcodeFormat.EAN_13, "EAN-13"],
  [BarcodeFormat.EAN_8, "EAN-8"],
  [BarcodeFormat.CODE_128, "CODE 128"],
  [BarcodeFormat.CODE_39, "CODE 39"],
  [BarcodeFormat.CODE_93, "CODE 93"],
  [BarcodeFormat.CODABAR, "CODABAR"],
  [BarcodeFormat.ITF, "ITF"],
  [BarcodeFormat.RSS_14, "DATABAR"],
  [BarcodeFormat.RSS_EXPANDED, "DATABAR EXPANDED"],
]);

function getScanFormatName(format: BarcodeFormat | null) {
  return format === null ? "CODE" : (SCAN_FORMAT_NAMES.get(format) ?? "CODE");
}

function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function getDownloadName(extension: "png" | "svg") {
  const date = new Date().toISOString().slice(0, 10);
  return `qr-studio-${date}.${extension}`;
}

function getSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function getClipboardImage(clipboardData: DataTransfer | null) {
  if (!clipboardData) return null;

  for (const item of Array.from(clipboardData.items)) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const image = item.getAsFile();
    if (image) return image;
  }

  return (
    Array.from(clipboardData.files).find((file) =>
      file.type.startsWith("image/"),
    ) ?? null
  );
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 1;
  canvas.height = 1;
}

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="QR Studio home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        QR<span className="brand-accent">/</span>STUDIO
      </span>
    </a>
  );
}

function StatusDot({ children }: { children: ReactNode }) {
  return (
    <span className="status-dot">
      <span aria-hidden="true" />
      {children}
    </span>
  );
}

function App() {
  const [mode, setMode] = useState<WorkspaceMode>("generate");
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#101210" : "#f2f0e9");
    try {
      window.localStorage.setItem("qr-studio-theme", theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }, [theme]);

  const showMode = (nextMode: WorkspaceMode) => {
    setMode(nextMode);
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <Logo />
        <nav className="main-nav" aria-label="Main navigation">
          <button type="button" onClick={() => showMode("generate")}>
            Generator
          </button>
          <button type="button" onClick={() => showMode("scan")}>
            Reader
          </button>
          <a href="#privacy">Privacy</a>
        </nav>
        <button
          className="theme-toggle"
          type="button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-pressed={theme === "dark"}
          onClick={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
        >
          {theme === "dark" ? (
            <Sun size={16} aria-hidden="true" />
          ) : (
            <Moon size={16} aria-hidden="true" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={16} aria-hidden="true" />
              The tiny square that does a lot
            </p>
            <h1 id="hero-title">
              QR codes,
              <br />
              minus the <span>fuss.</span>
            </h1>
            <p className="hero-subtitle">
              <span className="hero-subtitle-line">
                Create sharp, custom QR and other barcodes, or scan one in
                seconds.
              </span>{" "}
              <span className="hero-subtitle-line">
                On-device processing. No sign-up, no uploads, no hidden limits.
              </span>
            </p>
            <p className="hero-support-subtitle">
              Support QR, 1D, PDF417, Aztec, Data Matrix, Micro QR, DataBar &
              other barcodes. Support decoding boarding passes and USA/Canada
              DL/IDs.
            </p>
            <div className="hero-actions">
              <button
                className="button button-dark button-large"
                type="button"
                onClick={() => showMode("generate")}
              >
                Make a code
                <QrCode size={19} aria-hidden="true" />
              </button>
              <button
                className="button button-ghost button-large"
                type="button"
                onClick={() => showMode("scan")}
              >
                Scan a code
                <ScanLine size={19} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-grid-card">
              <div className="mini-qr">
                {Array.from({ length: 64 }).map((_, index) => (
                  <span key={index} className={`cell cell-${index}`} />
                ))}
              </div>
              <div className="hero-card-label">
                <span>READY TO SCAN</span>
                <span className="hero-arrow">↗</span>
              </div>
            </div>
            <div className="sticker sticker-private">
              <LockKeyhole size={19} aria-hidden="true" />
              100% PRIVATE
            </div>
            <div className="sticker sticker-fast">FAST!</div>
            <span className="scribble scribble-one">✦</span>
            <span className="scribble scribble-two">◡</span>
          </div>
        </section>

        <section className="workspace-section" id="workspace">
          <div className="section-intro">
            <div>
              <p className="section-kicker">YOUR TOOLBOX</p>
              <h2>Pick a side.</h2>
            </div>
            <p>
              Everything happens right here in your browser.
              <br />
              Your data never leaves this device.
            </p>
          </div>

          <div className="workspace">
            <div className="workspace-tabs" role="tablist" aria-label="QR tools">
              <button
                id="generate-tab"
                role="tab"
                aria-selected={mode === "generate"}
                aria-controls="generate-panel"
                type="button"
                onClick={() => setMode("generate")}
              >
                <QrCode size={20} aria-hidden="true" />
                Generate
                <span>01</span>
              </button>
              <button
                id="scan-tab"
                role="tab"
                aria-selected={mode === "scan"}
                aria-controls="scan-panel"
                type="button"
                onClick={() => setMode("scan")}
              >
                <ScanLine size={20} aria-hidden="true" />
                Read
                <span>02</span>
              </button>
            </div>

            {mode === "generate" ? <Generator /> : <Reader />}
          </div>
        </section>

        <section
          className="trust-strip"
          id="privacy"
          aria-label="Privacy features"
        >
          <article>
            <span className="trust-icon">
              <ShieldCheck size={24} aria-hidden="true" />
            </span>
            <div>
              <h3>Private by default</h3>
              <p>Nothing is uploaded or stored.</p>
            </div>
          </article>
          <article>
            <span className="trust-icon">
              <Code2 size={24} aria-hidden="true" />
            </span>
            <div>
              <h3>On-device processing</h3>
              <p>All data is processed locally, and none is transmitted.</p>
            </div>
          </article>
          <article>
            <span className="trust-icon">
              <Sparkles size={24} aria-hidden="true" />
            </span>
            <div>
              <h3>Truly free</h3>
              <p>No accounts, watermarks, or limits.</p>
            </div>
          </article>
        </section>
      </main>

      <footer>
        <Logo />
        <p>Published in July 2026 by Songming.org.</p>
        <p className="footer-note">Make it. Scan it. Share it.</p>
      </footer>
    </div>
  );
}

function Generator() {
  const [barcodeType, setBarcodeType] = useState<BarcodeType>("qr");
  const [barcodeValues, setBarcodeValues] = useState(getDefaultBarcodeValues);
  const [size, setSize] = useState(512);
  const [level, setLevel] = useState<BarcodeErrorLevel>("M");
  const [foreground, setForeground] = useState("#171918");
  const [background, setBackground] = useState("#ffffff");
  const [margin, setMargin] = useState(3);
  const [showOptions, setShowOptions] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [copyState, setCopyState] = useState<
    "idle" | "copied" | "unavailable"
  >("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = getBarcodeConfig(barcodeType);
  const value = barcodeValues[barcodeType];
  const safeValue = value.trim() || " ";
  const renderInput = useMemo(
    () => ({
      type: barcodeType,
      text: safeValue,
      size,
      margin,
      foreground,
      background,
      level,
    }),
    [background, barcodeType, foreground, level, margin, safeValue, size],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      renderBarcodeCanvas(canvasRef.current, renderInput);
      setRenderError("");
    } catch {
      canvasRef.current.width = 1;
      canvasRef.current.height = 1;
      setRenderError(getBarcodeErrorMessage(barcodeType));
    }
  }, [barcodeType, renderInput]);

  const setValue = (nextValue: string) => {
    setBarcodeValues((current) => ({
      ...current,
      [barcodeType]: nextValue,
    }));
  };

  const changeBarcodeType = (nextType: BarcodeType) => {
    setBarcodeType(nextType);
    setCopyState("idle");
    if (nextType === "microqr" && level === "H") setLevel("Q");
  };

  const copyImage = async () => {
    if (!canvasRef.current || renderError) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current?.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Could not create the barcode image."));
        }, "image/png");
      });

      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Image clipboard is unavailable.");
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("unavailable");
      window.setTimeout(() => setCopyState("idle"), 2400);
    }
  };

  const downloadPng = () => {
    if (!canvasRef.current || renderError) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) downloadBlob(blob, getDownloadName("png"));
    }, "image/png");
  };

  const downloadSvg = () => {
    if (renderError) return;
    try {
      const svg = renderBarcodeSvg(renderInput);
      downloadBlob(
        new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
        getDownloadName("svg"),
      );
    } catch {
      setRenderError(getBarcodeErrorMessage(barcodeType));
    }
  };

  return (
    <div
      className="tool-panel generator-panel"
      id="generate-panel"
      role="tabpanel"
      aria-labelledby="generate-tab"
    >
      <div className="control-pane">
        <div className="pane-heading">
          <span className="step-number">01</span>
          <div>
            <p>ADD YOUR CONTENT</p>
            <h3>What should it say?</h3>
          </div>
        </div>

        <div className="field">
          <label htmlFor="barcode-content">
            {config.inputLabel}
            <span>
              {value.length}/{config.maxLength}
            </span>
          </label>
          <div className="textarea-wrap">
            <Type size={19} aria-hidden="true" />
            <textarea
              id="barcode-content"
              value={value}
              maxLength={config.maxLength}
              rows={5}
              onChange={(event) => setValue(event.target.value)}
              placeholder={config.placeholder}
              inputMode={
                barcodeType === "upca" || barcodeType === "ean13"
                  ? "numeric"
                  : undefined
              }
            />
            {value && (
              <button
                className="field-clear"
                type="button"
                onClick={() => setValue("")}
                aria-label="Clear content"
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <label className="select-field barcode-type-field">
          <span>Barcode type</span>
          <select
            value={barcodeType}
            onChange={(event) =>
              changeBarcodeType(event.target.value as BarcodeType)
            }
          >
            {BARCODE_CONFIGS.map((barcodeConfig) => (
              <option key={barcodeConfig.type} value={barcodeConfig.type}>
                {barcodeConfig.label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="options-toggle"
          type="button"
          aria-expanded={showOptions}
          aria-controls="generator-options"
          onClick={() => setShowOptions((current) => !current)}
        >
          <span>
            <SlidersHorizontal size={18} aria-hidden="true" />
            Customize your code
          </span>
          <ChevronDown
            className={showOptions ? "chevron-up" : ""}
            size={19}
            aria-hidden="true"
          />
        </button>

        <div
          className={`generator-options ${showOptions ? "options-open" : ""}`}
          id="generator-options"
        >
          <div
            className={`option-grid ${
              config.supportsErrorRecovery ? "" : "option-grid-single"
            }`}
          >
            <label className="select-field">
              <span>Image size</span>
              <select
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
              >
                <option value={256}>256 × 256 px</option>
                <option value={512}>512 × 512 px</option>
                <option value={1024}>1024 × 1024 px</option>
              </select>
            </label>
            {config.supportsErrorRecovery && (
              <label className="select-field">
                <span>Error recovery</span>
                <select
                  value={level}
                  onChange={(event) =>
                    setLevel(event.target.value as BarcodeErrorLevel)
                  }
                >
                  <option value="L">Low — 7%</option>
                  <option value="M">Medium — 15%</option>
                  <option value="Q">Quartile — 25%</option>
                  {barcodeType !== "microqr" && (
                    <option value="H">High — 30%</option>
                  )}
                </select>
              </label>
            )}
          </div>

          <div className="color-row">
            <Palette size={18} aria-hidden="true" />
            <label>
              <span>Dots</span>
              <span className="color-control">
                <input
                  type="color"
                  value={foreground}
                  onChange={(event) => setForeground(event.target.value)}
                  aria-label="Barcode foreground color"
                />
                <code>{foreground.toUpperCase()}</code>
              </span>
            </label>
            <label>
              <span>Background</span>
              <span className="color-control">
                <input
                  type="color"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                  aria-label="Barcode background color"
                />
                <code>{background.toUpperCase()}</code>
              </span>
            </label>
          </div>

          <label className="range-field">
            <span>
              Quiet zone <strong>{margin}</strong>
            </span>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={margin}
              onChange={(event) => setMargin(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="content-note">
          <LockKeyhole size={16} aria-hidden="true" />
          Your content is processed locally and never sent anywhere.
        </div>
      </div>

      <div className="preview-pane">
        <div className="preview-topline">
          <StatusDot>Live preview</StatusDot>
          <span>{size}px</span>
        </div>
        <div className="qr-stage">
          <div className={`qr-paper qr-paper-${config.shape}`}>
            <canvas
              ref={canvasRef}
              aria-label={`Generated ${config.label} preview`}
            />
          </div>
          <span className="corner-label corner-label-top">
            {config.shortName} / 001
          </span>
          <span className="corner-label corner-label-bottom">READY</span>
        </div>

        {renderError ? (
          <div className="inline-error" role="alert">
            <CircleAlert size={17} aria-hidden="true" />
            {renderError}
          </div>
        ) : (
          <div className="ready-message" aria-live="polite">
            <Check size={17} aria-hidden="true" />
            Your code is ready to go.
          </div>
        )}

        <div className="download-actions">
          <button
            className="button button-copy-image"
            type="button"
            onClick={copyImage}
            disabled={Boolean(renderError)}
          >
            {copyState === "copied" ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
            {copyState === "copied"
              ? "Image copied"
              : copyState === "unavailable"
                ? "Image copy unavailable"
                : "Copy image"}
          </button>
          <div className="download-row">
            <button
              className="button button-accent"
              type="button"
              onClick={downloadPng}
              disabled={Boolean(renderError)}
            >
              <Download size={18} aria-hidden="true" />
              Download PNG
            </button>
            <button
              className="button button-svg"
              type="button"
              onClick={downloadSvg}
              disabled={Boolean(renderError)}
            >
              <FileImage size={18} aria-hidden="true" />
              SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Reader() {
  const [scanMode, setScanMode] = useState<ScanMode>("camera");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [scanResult, setScanResult] = useState("");
  const [scanFormat, setScanFormat] = useState<BarcodeFormat | null>(null);
  const [scanError, setScanError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const fallbackReaderRef = useRef<BrowserCodeReader | null>(null);
  const enhancedReaderRef = useRef<BrowserCodeReader | null>(null);
  const pdf417ReaderRef = useRef<BrowserCodeReader | null>(null);
  const fallbackControlsRef = useRef<IScannerControls | null>(null);
  const enhancedScanTimerRef = useRef<number | null>(null);
  const enhancedScanTokenRef = useRef(0);
  const imageScanTokenRef = useRef(0);
  const pdf417CameraRotationOffsetRef = useRef(0);
  const enhancedQrEngineRef = useRef<ReturnType<
    typeof QrScanner.createQrEngine
  > | null>(null);
  const cameraActiveRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const safeLink = useMemo(() => getSafeUrl(scanResult), [scanResult]);
  const bcbpData = useMemo(
    () =>
      scanFormat !== null && BCBP_FORMATS.has(scanFormat)
        ? parseBcbp(scanResult)
        : null,
    [scanFormat, scanResult],
  );
  const aamvaData = useMemo(
    () =>
      scanFormat === BarcodeFormat.PDF_417 && !bcbpData
        ? parseAamva(scanResult)
        : null,
    [bcbpData, scanFormat, scanResult],
  );

  const getFallbackReader = () => {
    if (!fallbackReaderRef.current) {
      const reader = new BrowserCodeReader(
        createPriorityBarcodeReader(),
        new Map(),
        {
          delayBetweenScanAttempts: 650,
          delayBetweenScanSuccess: 1000,
        },
      );
      fallbackReaderRef.current = reader;
    }
    return fallbackReaderRef.current;
  };

  const getEnhancedReader = () => {
    if (!enhancedReaderRef.current) {
      const reader = new BrowserCodeReader(
        createPriorityBarcodeReader(),
        new Map(),
      );
      enhancedReaderRef.current = reader;
    }
    return enhancedReaderRef.current;
  };

  const getPdf417Reader = () => {
    if (!pdf417ReaderRef.current) {
      pdf417ReaderRef.current = new BrowserCodeReader(
        new PDF417Reader(),
        new Map(),
      );
    }
    return pdf417ReaderRef.current;
  };

  const getEnhancedQrEngine = () => {
    if (!enhancedQrEngineRef.current) {
      enhancedQrEngineRef.current = QrScanner.createQrEngine();
    }
    return enhancedQrEngineRef.current;
  };

  const stopEnhancedScan = useCallback(() => {
    enhancedScanTokenRef.current += 1;
    if (enhancedScanTimerRef.current !== null) {
      window.clearTimeout(enhancedScanTimerRef.current);
      enhancedScanTimerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraActiveRef.current = false;
    stopEnhancedScan();
    fallbackControlsRef.current?.stop();
    fallbackControlsRef.current = null;
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
    setCameraState((current) => (current === "active" ? "idle" : current));
  }, [stopEnhancedScan]);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(
    () => () => {
      imageScanTokenRef.current += 1;
      const engine = enhancedQrEngineRef.current;
      if (engine) {
        void engine.then((resolvedEngine) => {
          if (
            typeof Worker !== "undefined" &&
            resolvedEngine instanceof Worker
          ) {
            resolvedEngine.terminate();
          }
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (scanMode === "upload") {
      stopCamera();
    } else {
      imageScanTokenRef.current += 1;
    }
  }, [scanMode, stopCamera]);

  const showResult = useCallback(
    (result: string, format: BarcodeFormat) => {
      setScanResult(result);
      setScanFormat(format);
      setScanError("");
      cameraActiveRef.current = false;
      stopEnhancedScan();
      fallbackControlsRef.current?.stop();
      fallbackControlsRef.current = null;
      scannerRef.current?.stop();
      setCameraState("idle");
    },
    [stopEnhancedScan],
  );

  const decodeEnhancedFrame = useCallback(
    async (frame: HTMLCanvasElement) => {
      try {
        const qrResult = await QrScanner.scanImage(frame, {
          qrEngine: getEnhancedQrEngine(),
          returnDetailedScanResult: true,
        });
        return {
          text: qrResult.data,
          format: BarcodeFormat.QR_CODE,
        };
      } catch {
        try {
          const result = getEnhancedReader().decodeFromCanvas(frame);
          return {
            text: result.getText(),
            format: result.getBarcodeFormat(),
          };
        } catch {
          return null;
        }
      }
    },
    [],
  );

  const decodeRotatedPdf417 = useCallback(
    async (
      frame: HTMLCanvasElement,
      angles: readonly number[],
      isCurrent: () => boolean,
    ) => {
      for (let index = 0; index < angles.length; index += 1) {
        if (!isCurrent()) return null;

        const rotatedFrame = createRotatedFrame(frame, angles[index]);
        if (!rotatedFrame) continue;

        try {
          const result = getPdf417Reader().decodeFromCanvas(rotatedFrame);
          return {
            text: result.getText(),
            format: BarcodeFormat.PDF_417,
          };
        } catch {
          // Continue through the remaining orientations.
        } finally {
          releaseCanvas(rotatedFrame);
        }

        if ((index + 1) % 3 === 0) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 0);
          });
        }
      }

      return null;
    },
    [],
  );

  const decodeEnhancedFrames = useCallback(
    async (
      frames: HTMLCanvasElement[],
      pdf417Angles: readonly number[],
      isCurrent: () => boolean,
    ) => {
      try {
        for (const frame of frames) {
          const result = await decodeEnhancedFrame(frame);
          if (result) return result;
        }

        return frames[0]
          ? await decodeRotatedPdf417(frames[0], pdf417Angles, isCurrent)
          : null;
      } finally {
        frames.forEach(releaseCanvas);
      }
    },
    [decodeEnhancedFrame, decodeRotatedPdf417],
  );

  const decodeEnhancedImage = useCallback(
    async (imageUrl: string, token: number) => {
      let frameIndex = 0;

      for await (const frame of createEnhancedImageFrames(imageUrl)) {
        if (token !== imageScanTokenRef.current) return null;

        let result = null;
        try {
          result = await decodeEnhancedFrame(frame);
          if (!result && frameIndex === 0) {
            result = await decodeRotatedPdf417(
              frame,
              PDF417_ROTATION_ANGLES,
              () => token === imageScanTokenRef.current,
            );
          }
        } finally {
          releaseCanvas(frame);
        }

        if (token !== imageScanTokenRef.current) return null;
        if (result) return result;
        frameIndex += 1;
      }
      return null;
    },
    [decodeEnhancedFrame, decodeRotatedPdf417],
  );

  const startEnhancedCameraScan = (
    video: HTMLVideoElement,
    initialDelay = 700,
  ) => {
    stopEnhancedScan();
    const token = enhancedScanTokenRef.current;

    const scanEnhancedFrame = async () => {
      if (
        token !== enhancedScanTokenRef.current ||
        !cameraActiveRef.current
      ) {
        return;
      }

      const rotationOffset = pdf417CameraRotationOffsetRef.current;
      const pdf417Angles = Array.from(
        { length: PDF417_CAMERA_ROTATIONS_PER_PASS },
        (_, index) =>
          PDF417_ROTATION_ANGLES[
            (rotationOffset + index) % PDF417_ROTATION_ANGLES.length
          ],
      );
      pdf417CameraRotationOffsetRef.current =
        (rotationOffset + PDF417_CAMERA_ROTATIONS_PER_PASS) %
        PDF417_ROTATION_ANGLES.length;

      const result = await decodeEnhancedFrames(
        createEnhancedVideoFrames(video),
        pdf417Angles,
        () =>
          token === enhancedScanTokenRef.current &&
          cameraActiveRef.current,
      );
      if (
        result &&
        token === enhancedScanTokenRef.current &&
        cameraActiveRef.current
      ) {
        showResult(result.text, result.format);
        return;
      }

      if (
        token === enhancedScanTokenRef.current &&
        cameraActiveRef.current
      ) {
        enhancedScanTimerRef.current = window.setTimeout(
          scanEnhancedFrame,
          1200,
        );
      }
    };

    enhancedScanTimerRef.current = window.setTimeout(
      scanEnhancedFrame,
      initialDelay,
    );
  };

  const startCamera = async () => {
    imageScanTokenRef.current += 1;
    cameraActiveRef.current = false;
    stopEnhancedScan();
    fallbackControlsRef.current?.stop();
    fallbackControlsRef.current = null;
    setScanError("");
    setScanResult("");
    setScanFormat(null);
    setCameraState("starting");
    pdf417CameraRotationOffsetRef.current = 0;

    if (!(await QrScanner.hasCamera())) {
      setCameraState("unsupported");
      return;
    }

    if (!videoRef.current) {
      setCameraState("error");
      return;
    }

    try {
      scannerRef.current?.destroy();
      const scanner = new QrScanner(
        videoRef.current,
        (result) => showResult(result.data, BarcodeFormat.QR_CODE),
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        },
      );
      scannerRef.current = scanner;
      await scanner.start();
      cameraActiveRef.current = true;
      setCameraState("active");
      await applyCameraOptimizations(videoRef.current);
      if (cameraActiveRef.current) {
        startEnhancedCameraScan(videoRef.current);
      }
      if (!cameraActiveRef.current) return;

      void getFallbackReader()
        .decodeFromVideoElement(
          videoRef.current,
          (result, _error, controls) => {
            if (!result) return;
            controls.stop();
            showResult(result.getText(), result.getBarcodeFormat());
          },
        )
        .then((controls) => {
          if (cameraActiveRef.current) {
            fallbackControlsRef.current = controls;
          } else {
            controls.stop();
          }
        })
        .catch(() => {
          // QR scanning remains available if the fallback cannot start.
        });
    } catch (error) {
      cameraActiveRef.current = false;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      setCameraState(
        message.includes("permission") || message.includes("denied")
          ? "denied"
          : "error",
      );
    }
  };

  const scanFile = async (file?: File) => {
    if (!file) return;
    const token = imageScanTokenRef.current + 1;
    imageScanTokenRef.current = token;
    const isCurrentScan = () => token === imageScanTokenRef.current;
    setFileName(file.name || "Pasted image");
    setScanError("");
    setScanResult("");
    setScanFormat(null);

    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });
      if (isCurrentScan()) {
        showResult(result.data, BarcodeFormat.QR_CODE);
      }
    } catch {
      if (!isCurrentScan()) return;
      const imageUrl = URL.createObjectURL(file);
      try {
        const result = await getFallbackReader().decodeFromImageUrl(imageUrl);
        if (isCurrentScan()) {
          showResult(result.getText(), result.getBarcodeFormat());
        }
      } catch {
        if (!isCurrentScan()) return;
        try {
          const result = await decodeEnhancedImage(imageUrl, token);
          if (!isCurrentScan()) return;
          if (result) {
            showResult(result.text, result.format);
          } else {
            setScanError(
              "No supported code found. Try a sharper image with the whole code visible.",
            );
          }
        } catch {
          if (isCurrentScan()) {
            setScanError(
              "No supported code found. Try a sharper image with the whole code visible.",
            );
          }
        }
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    }
  };

  useEffect(() => {
    if (scanMode !== "upload") return;

    const handlePagePaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented) return;
      const image = getClipboardImage(event.clipboardData);
      if (!image) return;
      event.preventDefault();
      void scanFile(image);
    };

    window.addEventListener("paste", handlePagePaste);
    return () => window.removeEventListener("paste", handlePagePaste);
  }, [scanMode, scanFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void scanFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void scanFile(event.dataTransfer.files?.[0]);
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(scanResult);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const resetReader = () => {
    imageScanTokenRef.current += 1;
    setScanResult("");
    setScanFormat(null);
    setScanError("");
    setFileName("");
  };

  const cameraMessage: Record<CameraState, string> = {
    idle: "Point your camera at a supported code",
    starting: "Getting your camera ready…",
    active: "Looking for a supported code…",
    denied: "Camera access was blocked. Allow it in your browser and try again.",
    unsupported: "No camera was found on this device.",
    error: "The camera could not start. Try uploading an image instead.",
  };

  return (
    <div
      className="tool-panel reader-panel"
      id="scan-panel"
      role="tabpanel"
      aria-labelledby="scan-tab"
    >
      <div className="reader-input-pane">
        <div className="pane-heading">
          <span className="step-number">02</span>
          <div>
            <p>READ A BARCODE</p>
            <h3>Show us the square.</h3>
            <small className="reader-format-note">
              Supports: QR, Micro QR, Aztec, Data Matrix, PDF417, UPC/EAN, Code
              39/93/128, Codabar, ITF, and DataBar.
            </small>
          </div>
        </div>

        <div className="reader-tabs" role="tablist" aria-label="Scanner input">
          <button
            type="button"
            role="tab"
            aria-selected={scanMode === "camera"}
            onClick={() => setScanMode("camera")}
          >
            <Camera size={17} aria-hidden="true" />
            Use camera
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scanMode === "upload"}
            onClick={() => setScanMode("upload")}
          >
            <ImageUp size={17} aria-hidden="true" />
            Choose image
          </button>
        </div>

        {scanMode === "camera" ? (
          <div className={`camera-stage camera-${cameraState}`}>
            <video
              ref={videoRef}
              muted
              playsInline
              aria-label="Camera preview"
            />
            <div className="camera-placeholder" aria-hidden="true">
              <ScanLine size={55} strokeWidth={1.3} />
              <span className="scan-frame" />
            </div>
            {cameraState === "active" && <span className="scan-beam" />}
            <div className="camera-overlay">
              <StatusDot>{cameraMessage[cameraState]}</StatusDot>
              {cameraState !== "active" ? (
                <button
                  className="button button-accent"
                  type="button"
                  onClick={startCamera}
                  disabled={cameraState === "starting"}
                >
                  <Camera size={18} aria-hidden="true" />
                  {cameraState === "starting" ? "Starting…" : "Start camera"}
                </button>
              ) : (
                <button
                  className="button button-light"
                  type="button"
                  onClick={stopCamera}
                >
                  <X size={18} aria-hidden="true" />
                  Stop
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`drop-zone ${isDragging ? "drop-zone-active" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              aria-label="Choose an image containing a visual code"
            />
            <span className="upload-icon">
              <Upload size={30} aria-hidden="true" />
            </span>
            <h4>{fileName || "Drop your code image here"}</h4>
            <p>PNG, JPG, WebP, or GIF</p>
            <button
              className="button button-dark"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Choose an image
            </button>
            <label className="paste-image-line">
              <Copy size={15} aria-hidden="true" />
              <input
                type="text"
                value=""
                readOnly
                placeholder="Paste image from clipboard"
                aria-label="Paste an image from the clipboard"
                onPaste={(event) => {
                  const image = getClipboardImage(event.clipboardData);
                  event.preventDefault();
                  if (image) {
                    void scanFile(image);
                  } else {
                    setScanError("No image was found in the clipboard.");
                  }
                }}
              />
              <kbd>Ctrl/⌘ + V</kbd>
            </label>
          </div>
        )}

        <div className="content-note">
          <LockKeyhole size={16} aria-hidden="true" />
          Camera and images are processed on this device only.
        </div>
      </div>

      <div className="result-pane">
        <div className="preview-topline">
          <span>Scan result</span>
          <span>
            {scanResult ? `${getScanFormatName(scanFormat)} FOUND` : "WAITING"}
          </span>
        </div>

        {scanResult ? (
          <div className="result-card">
            <div className="result-success">
              <span>
                <Check size={23} aria-hidden="true" />
              </span>
              <div>
                <p>CODE READ SUCCESSFULLY</p>
                <h3>Got it!</h3>
              </div>
            </div>
            <div className="result-value">
              {safeLink ? (
                <Link2 size={19} aria-hidden="true" />
              ) : (
                <Clipboard size={19} aria-hidden="true" />
              )}
              <p>{scanResult}</p>
            </div>
            {bcbpData && (
              <section
                className="bcbp-result"
                aria-label="Decoded IATA boarding pass"
              >
                <p className="bcbp-label">
                  (IATA BCBP) Boarding Pass decoded:
                </p>
                <dl className="bcbp-fields bcbp-summary">
                  <BcbpField label="Passenger" value={bcbpData.passengerName} />
                  <BcbpField
                    label="Flight legs"
                    value={String(bcbpData.numberOfLegs)}
                  />
                  <BcbpField
                    label="Electronic ticket"
                    value={formatBcbpElectronicTicketIndicator(
                      bcbpData.electronicTicketIndicator,
                    )}
                  />
                </dl>
                {bcbpData.segments.map((segment, index) => (
                  <BcbpFlight
                    key={`${segment.origin}-${segment.destination}-${index}`}
                    index={index}
                    segment={segment}
                  />
                ))}
              </section>
            )}
            {aamvaData && (
              <section
                className="bcbp-result"
                aria-label={`Decoded AAMVA ${aamvaData.headingCountry} driver license or identification card`}
              >
                <p className="bcbp-label">
                  (AAMVA CDS) {aamvaData.headingCountry} DL/ID decoded:
                </p>
                <dl className="bcbp-fields bcbp-summary">
                  {aamvaData.summary.map((field) => (
                    <BcbpField
                      key={field.label}
                      label={field.label}
                      value={field.value}
                      wide={field.wide}
                    />
                  ))}
                </dl>
                {aamvaData.sections.map((section) => (
                  <section className="bcbp-flight" key={section.title}>
                    <h4>{section.title}</h4>
                    <dl className="bcbp-fields">
                      {section.fields.map((field) => (
                        <BcbpField
                          key={field.label}
                          label={field.label}
                          value={field.value}
                          wide={field.wide}
                        />
                      ))}
                    </dl>
                  </section>
                ))}
              </section>
            )}
            <div className="result-actions">
              <button
                className="button button-accent"
                type="button"
                onClick={copyResult}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy result"}
              </button>
              {safeLink && (
                <a
                  className="button button-light"
                  href={safeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  Open link
                  <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              )}
              <button
                className="icon-button"
                type="button"
                onClick={resetReader}
                aria-label="Scan another code"
                title="Scan another code"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
            {safeLink && (
              <p className="url-safety-note">
                Take a moment to make sure a URL looks safe and familiar before
                opening it.
              </p>
            )}
          </div>
        ) : (
          <div className="empty-result">
            <span className="empty-qr" aria-hidden="true">
              <QrCode size={58} strokeWidth={1.2} />
            </span>
            <p>Your decoded content will appear here.</p>
            <small>Links, text, boarding passes, Wi-Fi details & more</small>
          </div>
        )}

        {scanError && (
          <div className="inline-error" role="alert">
            <CircleAlert size={17} aria-hidden="true" />
            {scanError}
          </div>
        )}
      </div>
    </div>
  );
}

function BcbpField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "bcbp-field bcbp-field-wide" : "bcbp-field"}>
      <dt>{label}</dt>
      <dd>{value || "Not provided"}</dd>
    </div>
  );
}

function BcbpFlight({
  index,
  segment,
}: {
  index: number;
  segment: BcbpSegment;
}) {
  return (
    <section className="bcbp-flight">
      <h4>Flight {index + 1}</h4>
      <dl className="bcbp-fields">
        <BcbpField
          label="Route"
          value={`${segment.origin} → ${segment.destination}`}
          wide
        />
        <BcbpField
          label="Operating carrier"
          value={formatBcbpOperatingCarrier(segment.operatingCarrier)}
        />
        <BcbpField label="Flight number" value={segment.flightNumber} />
        <BcbpFlightDate value={segment.flightDate} />
        <BcbpField
          label="Compartment"
          value={formatBcbpCompartmentCode(segment.compartmentCode)}
        />
        <BcbpField label="Seat" value={segment.seatNumber} />
        <BcbpField
          label="Check-in sequence"
          value={segment.checkInSequence}
        />
        <BcbpField
          label="Passenger status"
          value={formatBcbpPassengerStatus(segment.passengerStatus)}
        />
        <BcbpField
          label="Operating carrier PNR"
          value={segment.operatingCarrierPnr}
        />
      </dl>
    </section>
  );
}

function BcbpFlightDate({ value }: { value: string }) {
  const details = getBcbpFlightDateDetails(value);

  return (
    <div className="bcbp-field bcbp-field-wide bcbp-date-field">
      <dt>Flight date</dt>
      <dd className="bcbp-date-value">
        <span className="bcbp-date-julian">{details.julianDay}</span>
        {details.sharedDate ? (
          <span className="bcbp-date-calendar bcbp-date-calendar-shared">
            {details.sharedDate}
          </span>
        ) : (
          <>
            <span className="bcbp-date-label">{details.currentYearLabel}</span>
            <span className="bcbp-date-calendar">
              {details.currentYearDate}
            </span>
            <span className="bcbp-date-label">{details.alternateYearLabel}</span>
            <span className="bcbp-date-calendar">
              {details.alternateYearDate}
            </span>
          </>
        )}
      </dd>
    </div>
  );
}

export default App;
