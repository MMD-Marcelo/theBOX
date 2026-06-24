import React, { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  imagesToMergedPdf,
  compressImage,
  fitWithinBounds,
  resolveCompressionTarget,
  canvasToQuantizedPng,
  loadImageSource,
  exportImage,
  imagesToAnimatedGif,
  resizeCanvas,
  canvasToBlob,
  canvasToBmp,
  pngToIco,
  canvasToGif,
  getExtension,
  stripExtension,
  formatBytes,
  triggerDownload
} from "./utils.js";
import ImageConverter from "./tools/ImageConverter.jsx";
import ImageCompressor from "./tools/ImageCompressor.jsx";
import ExifCleaner from "./tools/ExifCleaner.jsx";
import ColorPickerTool from "./tools/ColorPickerTool.jsx";
import PaletteGenerator from "./tools/PaletteGenerator.jsx";
import RasterVectorizer from "./tools/RasterVectorizer.jsx";
import AudioCutter from "./tools/AudioCutter.jsx";
import QrGenerator from "./tools/QrGenerator.jsx";
import CsvJsonConverter from "./tools/CsvJsonConverter.jsx";
import PdfMergeTool from "./tools/PdfMergeTool.jsx";
import PdfSplitTool from "./tools/PdfSplitTool.jsx";
import PdfEditorTool from "./tools/PdfEditorTool.jsx";
import PdfConverterTool from "./tools/PdfConverterTool.jsx";
import PdfCompressorTool from "./tools/PdfCompressorTool.jsx";
import PdfSecurityTool from "./tools/PdfSecurityTool.jsx";
import PdfInfoTool from "./tools/PdfInfoTool.jsx";
import FileViewerTool from "./tools/FileViewerTool.jsx";
import BackgroundRemover from "./tools/BackgroundRemover.jsx";
import WebDownloaderTool from "./tools/WebDownloaderTool.jsx";
import TextTransformTool from "./tools/TextTransformTool.jsx";
import PasswordGeneratorTool from "./tools/PasswordGeneratorTool.jsx";
import MediaConvertTool from "./tools/MediaConvertTool.jsx";
import OcrTool from "./tools/OcrTool.jsx";
import IpGeneratorTool from "./tools/IpGeneratorTool.jsx";
import LoremTool from "./tools/LoremTool.jsx";
import FakeDataBrTool from "./tools/FakeDataBrTool.jsx";
import FakeProfileTool from "./tools/FakeProfileTool.jsx";
import NameNickTool from "./tools/NameNickTool.jsx";
import RandomNumberTool from "./tools/RandomNumberTool.jsx";
import UuidHashTool from "./tools/UuidHashTool.jsx";
import SymbolsTool from "./tools/SymbolsTool.jsx";
import WheelTool from "./tools/WheelTool.jsx";
import HealthCalcTool from "./tools/HealthCalcTool.jsx";
import PercentTool from "./tools/PercentTool.jsx";
import RuleOfThreeTool from "./tools/RuleOfThreeTool.jsx";
import DropZone from "./components/DropZone.jsx";
import ComingSoonTool from "./components/ComingSoonTool.jsx";
import SimpleFileQueue from "./components/SimpleFileQueue.jsx";
import { checkHealth, ENGINE_RELEASE_URL } from "./lib/engineClient.js";
import {
  ArrowDown,
  ArrowUp,
  AudioLines,
  BadgeCheck,
  ChevronRight,
  Download,
  FileJson,
  FileText,
  Image,
  Images,
  Play,
  LockKeyhole,
  Palette,
  QrCode,
  RefreshCw,
  Scissors,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Users,
  Hash,
  Dice5,
  Disc3,
  Smile,
  Type,
} from "lucide-react";

const pdfToolNames = [
  "Juntar PDF",
  "Dividir PDF",
  "Comprimir PDF",
  "Conversor PDF",
  "Editar PDF",
  "Seguranca PDF",
];

const pdfTools = pdfToolNames.map((name) => {
  const id = `pdf-${name.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}`;
  const components = {
    "Juntar PDF": PdfMergeTool,
    "Dividir PDF": PdfSplitTool,
    "Comprimir PDF": PdfCompressorTool,
    "Conversor PDF": PdfConverterTool,
    "Editar PDF": PdfEditorTool,
    "Seguranca PDF": PdfSecurityTool,
  };
  return {
    id,
    name,
    group: "PDF",
    icon: FileText,
    status: "Biblioteca pdf-lib",
    component: components[name],
  };
});

const viewerTools = [
  { name: "PDF Viewer", kind: "pdf", accept: "application/pdf", hint: "Preview de paginas e copiar texto" },
  { name: "DOCX Viewer", kind: "docx", accept: ".docx", hint: "Preview simples e copiar texto" },
  { name: "PowerPoint Viewer", kind: "pptx", accept: ".pptx", hint: "Texto dos slides e preview simples" },
  { name: "Excel Viewer", kind: "xlsx", accept: ".xlsx,.xls,.csv", hint: "Preview de planilhas e copiar texto" },
  { name: "CSV Viewer", kind: "csv", accept: ".csv,text/csv", hint: "Editar e copiar CSV" },
  { name: "SVG Viewer", kind: "svg", accept: ".svg,image/svg+xml", hint: "Preview SVG e codigo" },
  { name: "Viewer de codigo", kind: "code", accept: ".txt,.log,.js,.jsx,.ts,.tsx,.css,.html,.htm,.md,.markdown,.json,.xml,.yml,.yaml,.sql,text/*,application/json,application/xml", hint: "Editor simples com seletor de highlight" },
  { name: "Imagem Viewer", kind: "image", accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/bmp,image/x-icon,.ico,.heic,.heif,image/heic,image/heif", hint: "Preview de imagens, HEIC e metadados EXIF" },
  { name: "Archive File Viewer", kind: "archive", accept: ".zip,.jar,.docx,.pptx,.xlsx", hint: "Lista arquivos internos de ZIP/Office" },
].map((viewer) => ({
  id: `viewer-${viewer.name.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}`,
  name: viewer.name,
  group: "Viewers",
  icon: FileText,
  status: "Viewer local no navegador",
  component: FileViewerTool,
  accept: viewer.accept,
  viewerHint: viewer.hint,
  viewerKind: viewer.kind,
  defaultLanguage: viewer.kind === "code" ? "auto" : undefined,
}));

const generatorTools = [
  {
    id: "gen-password",
    name: "Gerador de Senha",
    group: "Geradores",
    icon: LockKeyhole,
    status: "crypto.getRandomValues",
    component: PasswordGeneratorTool,
  },
  {
    id: "qr-generator",
    name: "Gerador de QR Code",
    group: "Geradores",
    icon: QrCode,
    status: "qrcode.js",
    component: QrGenerator,
  },
  {
    id: "gen-ip",
    name: "Gerador de IP",
    group: "Geradores",
    icon: Search,
    status: "IPv4/IPv6 aleatorios",
    component: IpGeneratorTool,
  },
  {
    id: "gen-lorem",
    name: "Lorem Ipsum",
    group: "Geradores",
    icon: FileText,
    status: "Texto ficticio",
    component: LoremTool,
  },
  {
    id: "gen-fake-br",
    name: "Dados fake (BR)",
    group: "Geradores",
    icon: Sparkles,
    status: "CPF, CNPJ, nome, e-mail...",
    component: FakeDataBrTool,
  },
  {
    id: "gen-profile",
    name: "Pessoa / Empresa",
    group: "Geradores",
    icon: Users,
    status: "Perfil fake completo",
    component: FakeProfileTool,
  },
  {
    id: "gen-name-nick",
    name: "Nomes e Nicks",
    group: "Geradores",
    icon: Type,
    status: "Nomes e apelidos",
    component: NameNickTool,
  },
  {
    id: "gen-random",
    name: "Números e Sorteio",
    group: "Geradores",
    icon: Dice5,
    status: "Números aleatórios e sorteador",
    component: RandomNumberTool,
  },
  {
    id: "gen-uuid-hash",
    name: "UUID e Hash",
    group: "Geradores",
    icon: Hash,
    status: "UUID v4 e SHA",
    component: UuidHashTool,
  },
  {
    id: "gen-symbols",
    name: "Símbolos e Emojis",
    group: "Geradores",
    icon: Smile,
    status: "Buscar e copiar símbolos/emojis",
    component: SymbolsTool,
  },
  {
    id: "gen-wheel",
    name: "Roleta",
    group: "Geradores",
    icon: Disc3,
    status: "Sorteio em roleta",
    component: WheelTool,
  },
];

const downloaderTools = [
  {
    id: "web-downloaders",
    name: "Downloaders",
    group: "Web",
    icon: Download,
    status: "Downloaders web em um modulo",
    component: WebDownloaderTool,
  },
];

const tools = [
  {
    id: "image-converter",
    name: "Conversor de imagens",
    group: "Imagem",
    icon: Image,
    status: "Canvas API",
    component: ImageConverter,
  },
  {
    id: "image-compressor",
    name: "Compressor de imagens",
    group: "Imagem",
    icon: Images,
    status: "Squoosh",
    component: ImageCompressor,
  },
  {
    id: "background-remover",
    name: "Removedor de fundo",
    group: "Imagem",
    icon: Sparkles,
    status: "U2-Net ONNX",
    component: BackgroundRemover,
  },
  {
    id: "exif-editor",
    name: "Editor EXIF",
    group: "Imagem",
    icon: BadgeCheck,
    status: "Metadados locais",
    component: ExifCleaner,
  },
  {
    id: "color-palette",
    name: "Color picker",
    group: "Imagem",
    icon: Palette,
    status: "Amostragem local",
    component: ColorPickerTool,
  },
  {
    id: "palette-generator",
    name: "Paleta de cores",
    group: "Imagem",
    icon: Palette,
    status: "Gerador local",
    component: PaletteGenerator,
  },
  {
    id: "raster-vector",
    name: "Raster para vetor",
    group: "Imagem",
    icon: Image,
    status: "Vetorizar localmente",
    component: RasterVectorizer,
  },
  {
    id: "audio-cutter",
    name: "Cortador de audio",
    group: "Web",
    icon: Scissors,
    status: "Web Audio API",
    component: AudioCutter,
  },
  {
    id: "video-converter",
    name: "Conversor de video",
    group: "Web",
    icon: Video,
    status: "FFmpeg nativo (motor local)",
    component: MediaConvertTool,
  },
  {
    id: "mp4-mp3",
    name: "MP4 para MP3",
    group: "Web",
    icon: AudioLines,
    status: "FFmpeg nativo (motor local)",
    component: MediaConvertTool,
  },
  {
    id: "text-scanner",
    name: "Escanear texto (OCR)",
    group: "Texto",
    icon: FileText,
    status: "OCR de imagem/PDF no motor local",
    component: OcrTool,
  },
  {
    id: "text-transform",
    name: "Ferramentas de Texto",
    group: "Texto",
    icon: FileText,
    status: "Caixa, slug, contar, limpar e formatar texto",
    component: TextTransformTool,
  },
  {
    id: "csv-json",
    name: "CSV <-> JSON",
    group: "Texto",
    icon: FileJson,
    status: "Parser local",
    component: CsvJsonConverter,
  },
  ...pdfTools,
  ...viewerTools,
  ...downloaderTools,
  ...generatorTools,
  {
    id: "calc-saude",
    name: "Calculadora de Saúde",
    group: "Calculadoras",
    icon: BadgeCheck,
    status: "IMC, peso ideal, calorias, idade",
    component: HealthCalcTool,
  },
  {
    id: "calc-porcentagem",
    name: "Porcentagem",
    group: "Calculadoras",
    icon: FileText,
    status: "Cálculos de porcentagem",
    component: PercentTool,
  },
  {
    id: "calc-regra-3",
    name: "Regra de 3",
    group: "Calculadoras",
    icon: FileText,
    status: "Proporção direta",
    component: RuleOfThreeTool,
  },
];

const groups = ["Tudo", "Imagem", "PDF", "Viewers", "Web", "Geradores", "Calculadoras", "Texto"];

const imageFormats = [
  { id: "jpg", label: "JPG", mime: "image/jpeg", extension: "jpg" },
  { id: "png", label: "PNG", mime: "image/png", extension: "png" },
  { id: "webp", label: "WebP", mime: "image/webp", extension: "webp" },
  { id: "avif", label: "AVIF", mime: "image/avif", extension: "avif" },
  { id: "bmp", label: "BMP", mime: "image/bmp", extension: "bmp" },
  { id: "gif", label: "GIF", mime: "image/gif", extension: "gif" },
  { id: "ico", label: "ICO", mime: "image/x-icon", extension: "ico" },
  { id: "pdf", label: "PDF", mime: "application/pdf", extension: "pdf" },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Tudo");
  const [activeToolId, setActiveToolId] = useState("image-converter");
  const [engineStatus, setEngineStatus] = useState("idle");

  async function connectEngine() {
    setEngineStatus("checking");
    try {
      await checkHealth();
      setEngineStatus("online");
    } catch {
      setEngineStatus("offline");
    }
  }

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const byGroup = group === "Tudo" || tool.group === group;
      const haystack = `${tool.name} ${tool.group} ${tool.status}`.toLowerCase();
      return byGroup && haystack.includes(query.toLowerCase());
    });
  }, [group, query]);

  const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];
  const ActivePanel = activeTool.component ?? ComingSoonTool;

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <h1>THEBOX</h1>
          </div>
        </div>

        <label className="search">
          <Search aria-hidden="true" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ferramenta"
          />
        </label>

        <div className="segments" role="tablist" aria-label="Categorias">
          {groups.map((item) => (
            <button
              className={group === item ? "active" : ""}
              key={item}
              onClick={() => setGroup(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="tool-list">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                className={`tool-row ${activeTool.id === tool.id ? "selected" : ""}`}
                key={tool.id}
                onClick={() => setActiveToolId(tool.id)}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                <span>{tool.name}</span>
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            );
          })}
        </div>
      </aside>

      <section className="workspace">
        <div className="topbar">
          <div>
            <p className="eyebrow">{activeTool.group}</p>
            <h2>{activeTool.name}</h2>
          </div>
          <div className="engine-actions">
            <button
              className={"engine-connect " + engineStatus}
              disabled={engineStatus === "checking"}
              onClick={connectEngine}
              title="O motor pode estar em qualquer pasta; execute o arquivo e conecte"
              type="button"
            >
              <RefreshCw aria-hidden="true" size={18} />
              <span>
                {engineStatus === "checking"
                  ? "Conectando"
                  : engineStatus === "online"
                    ? "Motor conectado"
                    : engineStatus === "offline"
                      ? "Motor offline"
                      : "Conectar motor"}
              </span>
            </button>
            <a
              className="engine-download"
              href={ENGINE_RELEASE_URL}
              rel="noreferrer"
              title="Baixar motor local para Windows"
            >
              <Download aria-hidden="true" size={18} />
              <span>Baixar motor</span>
            </a>
          </div>
        </div>

        <ActivePanel tool={activeTool} />
      </section>
    </main>
  );
}

















const starterPalettes = [
  ["#0a0a0a", "#ff5a00", "#ffffff", "#f3f3f3", "#9b9b9b"],
];



function normalizePalette(colors) {
  const next = [...colors];
  while (next.length < 5) next.push(mixWithWhite(next[next.length - 1] ?? "#ff5a00", 28));
  return next.slice(0, 5);
}

function generatePalette(seed, mode) {
  const offsets = {
    analogous: [0, 18, 36, 180, 210],
    complementary: [0, 20, 180, 200, 220],
    triadic: [0, 120, 140, 240, 260],
    mono: [0, 0, 0, 0, 0],
  }[mode];
  return offsets.map((offset, index) => {
    const lightness = mode === "mono" ? 22 + index * 14 : 28 + (index % 3) * 18;
    const saturation = mode === "mono" ? 74 - index * 8 : 82 - index * 7;
    return hslToHex((seed + offset) % 360, saturation, lightness);
  });
}

function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = l - c / 2;
  const [r, g, b] = hue < 60
    ? [c, x, 0]
    : hue < 120
      ? [x, c, 0]
      : hue < 180
        ? [0, c, x]
        : hue < 240
          ? [0, x, c]
          : hue < 300
            ? [x, 0, c]
            : [c, 0, x];
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}

function getContrastRatio(first, second) {
  const a = getRelativeLuminance(first);
  const b = getRelativeLuminance(second);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

function getRelativeLuminance(hex) {
  const clean = hex.replace("#", "");
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255);
  const [r, g, b] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

async function extractPalette(file) {
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 80;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, 80, 80);
  const data = context.getImageData(0, 0, 80, 80).data;
  const buckets = new Map();
  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];
    if (alpha < 80) continue;
    const red = Math.round(data[index] / 24) * 24;
    const green = Math.round(data[index + 1] / 24) * 24;
    const blue = Math.round(data[index + 2] / 24) * 24;
    const key = `${red},${green},${blue}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key]) => {
      const [red, green, blue] = key.split(",").map(Number);
      return rgbToHex(red, green, blue);
    });
}

async function drawPickerImage(file, canvas) {
  if (!canvas) return;
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const maxWidth = 900;
  const ratio = Math.min(1, maxWidth / sourceWidth);
  canvas.width = Math.max(1, Math.round(sourceWidth * ratio));
  canvas.height = Math.max(1, Math.round(sourceHeight * ratio));
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
}

function readCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)));
  const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)));
  const color = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
  return { x, y, color };
}

function drawMagnifier(sourceCanvas, targetCanvas, x, y) {
  const context = targetCanvas.getContext("2d");
  const zoom = 11;
  const sample = 11;
  const half = Math.floor(sample / 2);
  context.imageSmoothingEnabled = false;
  context.fillStyle = "#0a0a0a";
  context.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  context.drawImage(
    sourceCanvas,
    Math.max(0, x - half),
    Math.max(0, y - half),
    sample,
    sample,
    0,
    0,
    sample * zoom,
    sample * zoom
  );
  context.strokeStyle = "#ff5a00";
  context.lineWidth = 2;
  context.strokeRect(half * zoom, half * zoom, zoom, zoom);
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function getReadableTextColor(hex) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#ffffff";
  const red = parseInt(clean.slice(0, 2), 16);
  const green = parseInt(clean.slice(2, 4), 16);
  const blue = parseInt(clean.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance > 150 ? "#0a0a0a" : "#ffffff";
}













function audioBufferToWav(buffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * channels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  let offset = 0;
  writeString("RIFF");
  view.setUint32(offset, length - 8, true); offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, channels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * channels * 2, true); offset += 4;
  view.setUint16(offset, channels * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString("data");
  view.setUint32(offset, length - offset - 4, true); offset += 4;
  for (let index = 0; index < buffer.length; index += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[index]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return arrayBuffer;
  function writeString(value) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset, value.charCodeAt(index));
      offset += 1;
    }
  }
}



async function imageToVTracerSvg(file, options) {
  if (!options.canvas || !options.svg) throw new Error("Preview tecnico indisponivel.");
  const vtracer = await import("./vendor/vtracer_webapp.js");
  await vtracer.default(`${import.meta.env.BASE_URL}vtracer_webapp_bg.wasm`);
  await drawFileToCanvas(file, options.canvas, 900);
  options.svg.setAttribute("viewBox", `0 0 ${options.canvas.width} ${options.canvas.height}`);
  options.svg.setAttribute("width", String(options.canvas.width));
  options.svg.setAttribute("height", String(options.canvas.height));
  while (options.svg.firstChild) options.svg.removeChild(options.svg.firstChild);
  const params = JSON.stringify({
    canvas_id: options.canvasId,
    svg_id: options.svgId,
    mode: options.mode,
    clustering_mode: "color",
    hierarchical: options.hierarchical,
    corner_threshold: degreesToRadians(60),
    length_threshold: 4,
    max_iterations: 10,
    splice_threshold: degreesToRadians(45),
    filter_speckle: options.filterSpeckle * options.filterSpeckle,
    color_precision: 8 - options.colorPrecision,
    layer_difference: 32,
    path_precision: 8,
  });
  const converter = vtracer.ColorImageConverter.new_with_string(params);
  try {
    await runVTracerConverter(converter);
    return new XMLSerializer().serializeToString(options.svg);
  } finally {
    converter.free();
  }
}

async function drawFileToCanvas(file, canvas, maxSide) {
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
}

function runVTracerConverter(converter) {
  converter.init();
  return new Promise((resolve) => {
    function tick() {
      let done = false;
      const started = performance.now();
      while (!done && performance.now() - started < 25) {
        done = converter.tick();
      }
      if (done) resolve();
      else setTimeout(tick, 1);
    }
    setTimeout(tick, 1);
  });
}

function degreesToRadians(degrees) {
  return (degrees / 180) * Math.PI;
}

async function imageToBlockSvg(file, threshold, cellSize) {
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const width = Math.min(180, sourceWidth);
  const height = Math.round((sourceHeight / sourceWidth) * width);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height).data;
  const rects = [];
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      const index = (y * width + x) * 4;
      const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      if (luminance < threshold) {
        rects.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><g fill="black">${rects.join("")}</g></svg>`;
}



function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}





function ColorPalette() {
  const [color, setColor] = useState("#16a085");
  const shades = [0, 16, 32, 48, 64].map((amount) => mixWithWhite(color, amount));

  return (
    <div className="tool-shell compact">
      <label>
        Cor base
        <input
          className="color-input"
          onChange={(event) => setColor(event.target.value)}
          type="color"
          value={color}
        />
      </label>
      <div className="swatches">
        {shades.map((shade) => (
          <button
            className="swatch"
            key={shade}
            onClick={() => navigator.clipboard?.writeText(shade)}
            style={{ backgroundColor: shade }}
            title={shade}
            type="button"
          >
            {shade}
          </button>
        ))}
      </div>
    </div>
  );
}

function mixWithWhite(hex, amount) {
  const clean = hex.replace("#", "");
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16));
  const mixed = channels.map((channel) =>
    Math.round(channel + (255 - channel) * (amount / 100))
      .toString(16)
      .padStart(2, "0")
  );
  return `#${mixed.join("")}`;
}
