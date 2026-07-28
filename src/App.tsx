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
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat } from "@zxing/library";
import QRCode, { type QRCodeErrorCorrectionLevel } from "qrcode";
import QrScanner from "qr-scanner";
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

const INITIAL_VALUE = "https://example.com";
const MAX_CHARACTERS = 1600;
const FALLBACK_FORMATS = [
  BarcodeFormat.MICRO_QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.AZTEC,
  BarcodeFormat.PDF_417,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_8,
  BarcodeFormat.EAN_13,
  BarcodeFormat.CODABAR,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.CODE_128,
  BarcodeFormat.ITF,
  BarcodeFormat.RSS_14,
  BarcodeFormat.RSS_EXPANDED,
];

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
              Create sharp, custom QR codes or scan one in seconds. On-device
              processing. No sign-up, no uploads, no hidden limits.
            </p>
            <div className="hero-actions">
              <button
                className="button button-dark button-large"
                type="button"
                onClick={() => showMode("generate")}
              >
                Make a QR code
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
              <p>All data is processed locally. No data is transmitted.</p>
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
  const [value, setValue] = useState(INITIAL_VALUE);
  const [size, setSize] = useState(512);
  const [level, setLevel] = useState<QRCodeErrorCorrectionLevel>("M");
  const [foreground, setForeground] = useState("#171918");
  const [background, setBackground] = useState("#ffffff");
  const [margin, setMargin] = useState(3);
  const [showOptions, setShowOptions] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [copyState, setCopyState] = useState<
    "idle" | "copied" | "unavailable"
  >("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const safeValue = value.trim() || " ";

  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, safeValue, {
      width: size,
      margin,
      errorCorrectionLevel: level,
      color: {
        dark: foreground,
        light: background,
      },
    })
      .then(() => setRenderError(""))
      .catch(() =>
        setRenderError("This content is too long for the selected QR settings."),
      );
  }, [background, foreground, level, margin, safeValue, size]);

  const copyQrImage = async () => {
    if (!canvasRef.current || renderError) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current?.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Could not create the QR code image."));
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

  const downloadSvg = async () => {
    if (renderError) return;
    const svg = await QRCode.toString(safeValue, {
      type: "svg",
      width: size,
      margin,
      errorCorrectionLevel: level,
      color: {
        dark: foreground,
        light: background,
      },
    });
    downloadBlob(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      getDownloadName("svg"),
    );
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
          <label htmlFor="qr-content">
            Text or URL
            <span>
              {value.length}/{MAX_CHARACTERS}
            </span>
          </label>
          <div className="textarea-wrap">
            <Type size={19} aria-hidden="true" />
            <textarea
              id="qr-content"
              value={value}
              maxLength={MAX_CHARACTERS}
              rows={5}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Paste a link or type any message..."
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
          <div className="option-grid">
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
            <label className="select-field">
              <span>Error recovery</span>
              <select
                value={level}
                onChange={(event) =>
                  setLevel(event.target.value as QRCodeErrorCorrectionLevel)
                }
              >
                <option value="L">Low — 7%</option>
                <option value="M">Medium — 15%</option>
                <option value="Q">Quartile — 25%</option>
                <option value="H">High — 30%</option>
              </select>
            </label>
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
                  aria-label="QR dot color"
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
                  aria-label="QR background color"
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
          <div className="qr-paper">
            <canvas ref={canvasRef} aria-label="Generated QR code preview" />
          </div>
          <span className="corner-label corner-label-top">QR / 001</span>
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
            Your QR code is ready to go.
          </div>
        )}

        <div className="download-actions">
          <button
            className="button button-copy-image"
            type="button"
            onClick={copyQrImage}
            disabled={Boolean(renderError)}
          >
            {copyState === "copied" ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
            {copyState === "copied"
              ? "QR code image copied"
              : copyState === "unavailable"
                ? "Image copy unavailable"
                : "Copy QR code image"}
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
  const [scanError, setScanError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const fallbackReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const fallbackControlsRef = useRef<IScannerControls | null>(null);
  const cameraActiveRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const safeLink = useMemo(() => getSafeUrl(scanResult), [scanResult]);

  const getFallbackReader = () => {
    if (!fallbackReaderRef.current) {
      const reader = new BrowserMultiFormatReader(new Map(), {
        delayBetweenScanAttempts: 650,
        delayBetweenScanSuccess: 1000,
      });
      reader.possibleFormats = FALLBACK_FORMATS;
      fallbackReaderRef.current = reader;
    }
    return fallbackReaderRef.current;
  };

  const stopCamera = useCallback(() => {
    cameraActiveRef.current = false;
    fallbackControlsRef.current?.stop();
    fallbackControlsRef.current = null;
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
    setCameraState((current) => (current === "active" ? "idle" : current));
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (scanMode === "upload") stopCamera();
  }, [scanMode, stopCamera]);

  const showResult = useCallback((result: string) => {
    setScanResult(result);
    setScanError("");
    cameraActiveRef.current = false;
    fallbackControlsRef.current?.stop();
    fallbackControlsRef.current = null;
    scannerRef.current?.stop();
    setCameraState("idle");
  }, []);

  const startCamera = async () => {
    cameraActiveRef.current = false;
    fallbackControlsRef.current?.stop();
    fallbackControlsRef.current = null;
    setScanError("");
    setScanResult("");
    setCameraState("starting");

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
        (result) => showResult(result.data),
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

      void getFallbackReader()
        .decodeFromVideoElement(
          videoRef.current,
          (result, _error, controls) => {
            if (!result) return;
            controls.stop();
            showResult(result.getText());
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
    setFileName(file.name);
    setScanError("");
    setScanResult("");

    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });
      showResult(result.data);
    } catch {
      const imageUrl = URL.createObjectURL(file);
      try {
        const result = await getFallbackReader().decodeFromImageUrl(imageUrl);
        showResult(result.getText());
      } catch {
        setScanError(
          "No supported code found. Try a sharper image with the whole code visible.",
        );
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    }
  };

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
    setScanResult("");
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
            <p>READ A VISUAL CODE</p>
            <h3>Show us the square.</h3>
            <small className="reader-format-note">
              QR, Micro QR, Aztec, Data Matrix, PDF417, UPC/EAN, Code
              39/93/128, Codabar, ITF &amp; DataBar.
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
          <span>{scanResult ? "FOUND" : "WAITING"}</span>
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
                  rel="noreferrer"
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
          </div>
        ) : (
          <div className="empty-result">
            <span className="empty-qr" aria-hidden="true">
              <QrCode size={58} strokeWidth={1.2} />
            </span>
            <p>Your decoded content will appear here.</p>
            <small>Links, text, contact cards, Wi-Fi details & more</small>
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

export default App;
