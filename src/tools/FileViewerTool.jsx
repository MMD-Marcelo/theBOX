import React, { useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { FileText, Trash2 } from "lucide-react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import sql from "highlight.js/lib/languages/sql";
import DropZone from "../components/DropZone.jsx";
import { formatBytes, getExtension } from "../utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const codeLanguages = ["auto", "text", "javascript", "typescript", "css", "html", "json", "xml", "yaml", "markdown", "log", "sql"];
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", javascript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("sql", sql);

export default function FileViewerTool({ tool }) {
  const kind = tool.viewerKind ?? "text";
  const [item, setItem] = useState(null);
  const [content, setContent] = useState("");
  const [html, setHtml] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pdfState, setPdfState] = useState(null);
  const [pptState, setPptState] = useState(null);
  const [xlsxState, setXlsxState] = useState(null);
  const [docxState, setDocxState] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [language, setLanguage] = useState(tool.defaultLanguage ?? "auto");
  const [message, setMessage] = useState("");

  const accept = tool.accept ?? "*/*";

  function clearPrevious() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (pdfState?.pages) pdfState.pages.forEach((page) => URL.revokeObjectURL(page.url));
    if (pptState?.slides) pptState.slides.forEach((slide) => URL.revokeObjectURL(slide.url));
    setContent("");
    setHtml("");
    setImageUrl("");
    setPdfState(null);
    setPptState(null);
    setXlsxState(null);
    setDocxState(null);
    setImageInfo(null);
    setImageZoom(100);
    setMessage("");
  }

  async function addFiles(files) {
    const file = files[0];
    if (!file) return;
    clearPrevious();
    const nextItem = {
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      status: "Lendo",
    };
    setItem(nextItem);
    try {
      await loadViewerFile(file, kind, {
        setContent,
        setHtml,
        setImageUrl,
        setPdfState,
        setPptState,
        setXlsxState,
        setDocxState,
        setImageInfo,
      });
      setItem({ ...nextItem, status: "Pronto" });
      setMessage(`${file.name}: carregado`);
    } catch (error) {
      setItem({ ...nextItem, status: "Erro" });
      setMessage(`Erro: ${error.message}`);
    }
  }

  function removeItem() {
    clearPrevious();
    setItem(null);
  }

  const renderedCode = useMemo(() => {
    const active = language === "auto" ? inferLanguage(item?.file?.name ?? "", content) : language;
    return {
      html: highlightCode(content, active),
      language: active,
    };
  }, [content, item?.file?.name, language]);

  const stats = getViewerStats(kind, item, content, pdfState, imageInfo);

  return (
    <div className={`tool-shell viewer-shell ${item ? "has-file" : ""}`}>
      {!item && (
        <DropZone accept={accept} multiple={false} onFile={addFiles}>
          <strong>Enviar arquivo</strong>
          <span>{tool.viewerHint ?? "Visualizar arquivo localmente"}</span>
        </DropZone>
      )}

      {item && (
        <div className="viewer-loaded-layout">
          <aside className="viewer-side-panel">
            <DropZone accept={accept} multiple={false} onFile={addFiles}>
              <strong>Trocar arquivo</strong>
              <span>{tool.viewerHint ?? "Visualizar arquivo localmente"}</span>
            </DropZone>

          <div className="file-queue viewer-file-card">
            <div className="file-row pdf-converter-row">
              <div className="file-main">
                <FileText aria-hidden="true" size={18} />
                <div>
                  <strong>{item.file.name}</strong>
                  <span>{(getExtension(item.file.name) || "arquivo").toUpperCase()} / {formatBytes(item.file.size)}</span>
                </div>
              </div>
              <span className={`queue-status ${item.status.toLowerCase()}`}>{item.status}</span>
              <button className="icon-button" onClick={removeItem} type="button">
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          </div>

            <div className="viewer-info-panel">
              <strong>Info</strong>
              {stats.map((line) => <span key={line}>{line}</span>)}
              {kind === "code" && (
                <label className="viewer-highlight-control">
                  Highlight
                  <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                    {codeLanguages.map((option) => (
                      <option key={option} value={option}>{option.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
              )}
              <ViewerInfoControls
                content={content}
                docxState={docxState}
                itemName={item.file.name}
                kind={kind}
                language={language}
                message={message}
                imageZoom={imageZoom}
                pdfState={pdfState}
                pptState={pptState}
                setContent={setContent}
                setDocxState={setDocxState}
                setImageZoom={setImageZoom}
                setMessage={setMessage}
                setPdfState={setPdfState}
                setPptState={setPptState}
                setXlsxState={setXlsxState}
                xlsxState={xlsxState}
              />
              {message && <p className="status-line">{message}</p>}
            </div>
          </aside>

          <main className="viewer-preview">
            {kind === "pdf" && pdfState && (
              <PdfPreview state={pdfState} setState={setPdfState} setMessage={setMessage} />
            )}
            {kind === "pptx" && pptState && (
              <PptPreview state={pptState} />
            )}
            {kind === "xlsx" && xlsxState && (
              <ExcelPreview state={xlsxState} />
            )}
            {kind === "docx" && docxState && (
              <DocxPreview state={docxState} />
            )}
            {["image", "svg"].includes(kind) && imageUrl && (
              <div className="viewer-image-frame">
                <img alt="" src={imageUrl} style={{ width: `${imageZoom}%` }} />
              </div>
            )}
            {["html", "markdown"].includes(kind) && html && (
              <iframe className="viewer-frame" sandbox="" srcDoc={html} title="preview" />
            )}
            {["text", "code", "csv", "json", "xml", "yaml", "archive"].includes(kind) && (
              kind === "code"
                ? <CodePreview html={renderedCode.html} language={renderedCode.language} value={content} />
                : <textarea className="viewer-textarea" onChange={(event) => setContent(event.target.value)} value={content} />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

function ViewerInfoControls({
  content,
  docxState,
  itemName,
  kind,
  language,
  message,
  imageZoom,
  pdfState,
  pptState,
  setContent,
  setDocxState,
  setImageZoom,
  setMessage,
  setPdfState,
  setPptState,
  setXlsxState,
  xlsxState,
}) {
  if (kind === "pdf" && pdfState) {
    return (
      <div className="viewer-info-controls">
        <label>
          Pagina
          <input
            max={pdfState.pageCount}
            min="1"
            onChange={(event) => goToPdfPage(pdfState, setPdfState, setMessage, event.target.value)}
            type="number"
            value={pdfState.page}
          />
        </label>
        <div className="viewer-control-row">
          <button disabled={pdfState.page <= 1} onClick={() => goToPdfPage(pdfState, setPdfState, setMessage, pdfState.page - 1)} type="button">Anterior</button>
          <button disabled={pdfState.page >= pdfState.pageCount} onClick={() => goToPdfPage(pdfState, setPdfState, setMessage, pdfState.page + 1)} type="button">Proxima</button>
        </div>
      </div>
    );
  }

  if (kind === "docx" && docxState) {
    return (
      <div className="viewer-info-controls">
        <label>
          Pagina
          <input
            max={docxState.pages.length}
            min="1"
            onChange={(event) => setDocxPage(docxState, setDocxState, event.target.value)}
            type="number"
            value={docxState.index + 1}
          />
        </label>
        <span>{docxState.pages.length} paginas aproximadas</span>
        <div className="viewer-control-row">
          <button disabled={docxState.index <= 0} onClick={() => setDocxPage(docxState, setDocxState, docxState.index)} type="button">Anterior</button>
          <button disabled={docxState.index >= docxState.pages.length - 1} onClick={() => setDocxPage(docxState, setDocxState, docxState.index + 2)} type="button">Proxima</button>
        </div>
      </div>
    );
  }

  if (kind === "pptx" && pptState) {
    return (
      <div className="viewer-info-controls">
        <label>
          Slide
          <select value={pptState.index} onChange={(event) => setPptState({ ...pptState, index: Number(event.target.value) })}>
            {pptState.slides.map((slide, index) => (
              <option key={slide.url} value={index}>Slide {index + 1}</option>
            ))}
          </select>
        </label>
        <div className="viewer-control-row">
          <button disabled={pptState.index <= 0} onClick={() => setPptState({ ...pptState, index: pptState.index - 1 })} type="button">Anterior</button>
          <button disabled={pptState.index >= pptState.slides.length - 1} onClick={() => setPptState({ ...pptState, index: pptState.index + 1 })} type="button">Proximo</button>
        </div>
      </div>
    );
  }

  if (kind === "xlsx" && xlsxState) {
    return (
      <div className="viewer-info-controls">
        <label>
          Aba
          <select value={xlsxState.sheetIndex} onChange={(event) => setXlsxState({ ...xlsxState, sheetIndex: Number(event.target.value) })}>
            {xlsxState.sheets.map((option, index) => (
              <option key={option.name} value={index}>{option.name}</option>
            ))}
          </select>
        </label>
        <label>
          Zoom
          <select value={xlsxState.zoom} onChange={(event) => setXlsxState({ ...xlsxState, zoom: Number(event.target.value) })}>
            {[40, 55, 70, 85, 100, 125].map((option) => (
              <option key={option} value={option}>{option}%</option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  if (kind === "code") {
    return (
      <div className="viewer-info-controls">
        <button
          disabled={!content}
          onClick={async () => {
            try {
              const active = language === "auto" ? inferLanguage(itemName, content) : language;
              setContent(await formatCode(content, active));
              setMessage("Codigo formatado");
            } catch (error) {
              setMessage(`Erro ao formatar: ${error.message}`);
            }
          }}
          type="button"
        >
          Formatar
        </button>
        {message !== "Codigo formatado" && <span>Usa o highlight selecionado como formato alvo.</span>}
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div className="viewer-info-controls">
        <label>
          Zoom
          <select value={imageZoom} onChange={(event) => setImageZoom(Number(event.target.value))}>
            {[25, 50, 75, 100, 125, 150, 200, 300].map((option) => (
              <option key={option} value={option}>{option}%</option>
            ))}
          </select>
        </label>
        <div className="viewer-control-row">
          <button disabled={imageZoom <= 25} onClick={() => setImageZoom(Math.max(25, imageZoom - 25))} type="button">Menor</button>
          <button disabled={imageZoom >= 300} onClick={() => setImageZoom(Math.min(300, imageZoom + 25))} type="button">Maior</button>
        </div>
      </div>
    );
  }

  return null;
}

function CodePreview({ html, language, value }) {
  const lines = html.split("\n");
  const rawLines = String(value ?? "").split("\n");
  const lineCount = Math.max(lines.length, rawLines.length, 1);
  return (
    <div className="viewer-code-editor">
      <div className="viewer-code-tabs">
        <span>{language.toUpperCase()}</span>
      </div>
      <pre className="viewer-code">
        {Array.from({ length: lineCount }, (_, index) => (
          <div className="viewer-code-line" key={index}>
            <span className="viewer-code-number">{index + 1}</span>
            <code dangerouslySetInnerHTML={{ __html: lines[index] || "" }} />
          </div>
        ))}
      </pre>
    </div>
  );
}

async function goToPdfPage(state, setState, setMessage, pageNumber) {
  try {
    if (state.pages) state.pages.forEach((page) => URL.revokeObjectURL(page.url));
    const next = await renderPdfSpread(state.file, Number(pageNumber));
    setState(next);
  } catch (error) {
    setMessage(`Erro no preview: ${error.message}`);
  }
}

function setDocxPage(state, setState, pageNumber) {
  const index = Math.min(Math.max(Number(pageNumber) - 1, 0), state.pages.length - 1);
  setState({ ...state, index });
}

function PdfPreview({ state }) {
  return (
    <div className="viewer-pdf">
      <div className={`viewer-pdf-pages ${state.orientation}`}>
        {state.pages.map((page) => <img alt="" key={page.page} src={page.url} />)}
      </div>
    </div>
  );
}

function PptPreview({ state }) {
  const active = state.slides[state.index];

  return (
    <div className="viewer-ppt">
      <div className="viewer-ppt-stage">
        {active ? <img alt="" src={active.url} /> : <p className="status-line">Sem slides</p>}
      </div>
    </div>
  );
}

function ExcelPreview({ state }) {
  const sheet = state.sheets[state.sheetIndex];
  const zoom = state.zoom;

  return (
    <div className="viewer-excel">
      <div className="viewer-excel-stage">
        <div className="viewer-excel-zoom" style={{ "--viewer-excel-zoom": zoom / 100 }}>
          <table className="viewer-excel-table">
            <thead>
              <tr>
                <th className="corner-cell" />
                {sheet.columns.map((column) => <th key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th>{rowIndex + 1}</th>
                  {sheet.columns.map((column, columnIndex) => (
                    <td key={column}>{row[columnIndex] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DocxPreview({ state }) {
  const pages = state.pages.slice(state.index, state.index + 2);
  return (
    <div className="viewer-docx">
      <div className="viewer-docx-pages">
        {pages.map((html, index) => (
          <article className="viewer-docx-page" dangerouslySetInnerHTML={{ __html: html }} key={`${state.index}-${index}`} />
        ))}
      </div>
    </div>
  );
}

async function loadViewerFile(file, kind, setters) {
  if (kind === "pdf") {
    const state = await renderPdfSpread(file, 1);
    setters.setPdfState(state);
    setters.setContent(await extractPdfText(file));
    return;
  }

  if (kind === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const [htmlResult, textResult] = await Promise.all([
      mammoth.convertToHtml({ arrayBuffer }),
      mammoth.extractRawText({ arrayBuffer }),
    ]);
    setters.setDocxState({ pages: paginateHtml(htmlResult.value), index: 0 });
    setters.setContent(textResult.value || htmlToText(htmlResult.value));
    return;
  }

  if (kind === "pptx") {
    const [visual, slides] = await Promise.all([
      pptxToVisualSlides(file),
      pptxToSlides(file),
    ]);
    setters.setPptState({ slides: visual, index: 0 });
    setters.setContent(slides.map((slide, index) => `Slide ${index + 1}\n${slide}`).join("\n\n"));
    return;
  }

  if (kind === "xlsx") {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
      const maxColumn = Math.min(Math.max(range.e.c, 12), 80);
      const maxRow = Math.min(Math.max(range.e.r, 24), 300);
      const rows = [];
      for (let rowIndex = 0; rowIndex <= maxRow; rowIndex += 1) {
        const row = [];
        for (let columnIndex = 0; columnIndex <= maxColumn; columnIndex += 1) {
          const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
          row.push(formatCellValue(sheet[address]));
        }
        rows.push(row);
      }
      return {
        name,
        columns: Array.from({ length: maxColumn + 1 }, (_, index) => XLSX.utils.encode_col(index)),
        rows,
        text: XLSX.utils.sheet_to_csv(sheet, { FS: "\t" }),
      };
    });
    setters.setXlsxState({ sheets, sheetIndex: 0, zoom: 70 });
    setters.setContent(sheets.map((sheet) => `# ${sheet.name}\n${sheet.text}`).join("\n\n"));
    return;
  }

  if (kind === "archive") {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const lines = Object.values(zip.files)
      .map((entry) => `${entry.dir ? "DIR " : "FILE"}\t${entry.name}`)
      .sort();
    setters.setContent(lines.join("\n"));
    return;
  }

  if (kind === "image") {
    const extension = getExtension(file.name);
    if (extension === "heic" || extension === "heif" || file.type === "image/heic" || file.type === "image/heif") {
      const heic2any = (await import("heic2any")).default;
      const converted = await heic2any({ blob: file, toType: "image/png" });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      const url = URL.createObjectURL(blob);
      setters.setImageUrl(url);
      setters.setImageInfo({
        dimensions: await loadImageDimensions(url),
        exif: await readExifLines(file),
      });
      setters.setContent(`${file.name}\nHEIC / ${formatBytes(file.size)}`);
      return;
    }

    const url = URL.createObjectURL(file);
    setters.setImageUrl(url);
    setters.setImageInfo({
      dimensions: await loadImageDimensions(url),
      exif: await readExifLines(file),
    });
    setters.setContent(`${file.name}\n${file.type || getExtension(file.name)}\n${formatBytes(file.size)}`);
    return;
  }

  if (kind === "heic") {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/png" });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    setters.setImageUrl(URL.createObjectURL(blob));
    setters.setContent(`${file.name}\n${formatBytes(file.size)}`);
    return;
  }

  if (kind === "svg") {
    setters.setImageUrl(URL.createObjectURL(file));
    if (kind === "svg") setters.setContent(await file.text());
    else setters.setContent(`${file.name}\n${file.type || getExtension(file.name)}\n${formatBytes(file.size)}`);
    return;
  }

  const text = await file.text();
  if (kind === "json") {
    const formatted = JSON.stringify(JSON.parse(text), null, 2);
    setters.setContent(formatted);
    return;
  }
  if (kind === "html") {
    setters.setHtml(text);
    setters.setContent(text);
    return;
  }
  if (kind === "markdown") {
    setters.setHtml(wrapHtml(markdownToHtml(text)));
    setters.setContent(text);
    return;
  }
  setters.setContent(text);
}

async function renderPdfSpread(file, pageNumber) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pageCount = pdf.numPages;
  const safePage = Math.min(Math.max(pageNumber, 1), pageCount);
  const firstPage = await renderPdfCanvasPage(pdf, safePage);
  const pages = [firstPage];
  if (safePage < pageCount) {
    pages.push(await renderPdfCanvasPage(pdf, safePage + 1));
  }
  await pdf.destroy?.();
  return {
    file,
    page: safePage,
    pageCount,
    pages,
    orientation: firstPage.width > firstPage.height ? "landscape" : "portrait",
  };
}

async function renderPdfCanvasPage(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.45 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return {
    page: pageNumber,
    width: canvas.width,
    height: canvas.height,
    url: URL.createObjectURL(blob),
  };
}

function getViewerStats(kind, item, content, pdfState, imageInfo) {
  if (!item) return [];
  const lines = [
    `${(getExtension(item.file.name) || "arquivo").toUpperCase()} / ${formatBytes(item.file.size)}`,
  ];
  if (kind === "pdf" && pdfState) {
    lines.push(`${pdfState.pageCount} paginas`);
    lines.push(pdfState.orientation === "landscape" ? "Orientacao horizontal" : "Orientacao vertical");
  } else if (kind === "pptx") {
    const count = content.match(/^Slide \d+/gm)?.length ?? 0;
    if (count) lines.push(`${count} slides`);
  } else if (kind === "xlsx") {
    const count = content.match(/^# /gm)?.length ?? 0;
    if (count) lines.push(`${count} abas`);
  } else if (kind === "image" && imageInfo) {
    if (imageInfo.dimensions) lines.push(`${imageInfo.dimensions.width} x ${imageInfo.dimensions.height}px`);
    if (imageInfo.exif.length) {
      lines.push("EXIF");
      lines.push(...imageInfo.exif);
    } else {
      lines.push("Sem EXIF legivel");
    }
  } else if (content) {
    lines.push(`${content.length.toLocaleString("pt-BR")} caracteres`);
    lines.push(`${content.split(/\s+/).filter(Boolean).length.toLocaleString("pt-BR")} palavras`);
  }
  return lines;
}

function loadImageDimensions(url) {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function readExifLines(file) {
  try {
    const extension = getExtension(file.name);
    if (!["jpg", "jpeg", "tif", "tiff", "heic", "heif"].includes(extension) && !file.type.includes("jpeg")) return [];
    const exif = parseExif(await file.arrayBuffer());
    return Object.entries(exif)
      .filter(([, value]) => value !== "" && value != null)
      .map(([key, value]) => `${key}: ${value}`)
      .slice(0, 14);
  } catch {
    return [];
  }
}

function parseExif(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  let tiffOffset = -1;
  if (view.getUint16(0, false) === 0xffd8) {
    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset, false);
      const length = view.getUint16(offset + 2, false);
      if (marker === 0xffe1 && getAscii(view, offset + 4, 6) === "Exif\0\0") {
        tiffOffset = offset + 10;
        break;
      }
      offset += 2 + length;
    }
  } else if (getAscii(view, 4, 4) === "ftyp") {
    tiffOffset = findExifInHeif(view);
  } else {
    tiffOffset = 0;
  }
  if (tiffOffset < 0 || tiffOffset + 8 >= view.byteLength) return {};

  const little = getAscii(view, tiffOffset, 2) === "II";
  const firstIfdOffset = readUint32(view, tiffOffset + 4, little);
  const entries = readIfd(view, tiffOffset, tiffOffset + firstIfdOffset, little);
  const exifOffset = entries[0x8769]?.raw;
  const gpsOffset = entries[0x8825]?.raw;
  const exifEntries = exifOffset ? readIfd(view, tiffOffset, tiffOffset + exifOffset, little) : {};
  const gpsEntries = gpsOffset ? readIfd(view, tiffOffset, tiffOffset + gpsOffset, little) : {};
  const merged = { ...entries, ...exifEntries };
  const gps = formatGps(gpsEntries);

  const result = {};
  addExif(result, "Camera", [merged[0x010f]?.value, merged[0x0110]?.value].filter(Boolean).join(" "));
  addExif(result, "Software", merged[0x0131]?.value);
  addExif(result, "Data", merged[0x9003]?.value || merged[0x0132]?.value);
  addExif(result, "Orientacao", formatOrientation(merged[0x0112]?.value));
  addExif(result, "Lente", merged[0xa434]?.value);
  addExif(result, "ISO", merged[0x8827]?.value);
  addExif(result, "Abertura", merged[0x829d]?.value ? `f/${roundExif(merged[0x829d].value)}` : "");
  addExif(result, "Exposicao", formatExposure(merged[0x829a]?.value));
  addExif(result, "Distancia focal", merged[0x920a]?.value ? `${roundExif(merged[0x920a].value)}mm` : "");
  addExif(result, "GPS", gps);
  return result;
}

function findExifInHeif(view) {
  const text = getAscii(view, 0, Math.min(view.byteLength, 1024 * 512));
  const index = text.indexOf("Exif\0\0");
  return index >= 0 ? index + 6 : -1;
}

function readIfd(view, tiffOffset, ifdOffset, little) {
  if (ifdOffset <= 0 || ifdOffset + 2 >= view.byteLength) return {};
  const count = readUint16(view, ifdOffset, little);
  const entries = {};
  for (let index = 0; index < count; index += 1) {
    const offset = ifdOffset + 2 + index * 12;
    if (offset + 12 > view.byteLength) break;
    const tag = readUint16(view, offset, little);
    const type = readUint16(view, offset + 2, little);
    const countValue = readUint32(view, offset + 4, little);
    const valueOffset = offset + 8;
    const raw = readTagValue(view, tiffOffset, type, countValue, valueOffset, little);
    entries[tag] = { raw, value: normalizeExifValue(raw) };
  }
  return entries;
}

function readTagValue(view, tiffOffset, type, count, valueOffset, little) {
  const sizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const size = (sizes[type] || 1) * count;
  const offset = size <= 4 ? valueOffset : tiffOffset + readUint32(view, valueOffset, little);
  if (offset < 0 || offset + Math.min(size, 1) > view.byteLength) return "";
  if (type === 2) return getAscii(view, offset, count).replace(/\0+$/, "");
  const values = [];
  for (let index = 0; index < count; index += 1) {
    const current = offset + index * (sizes[type] || 1);
    if (type === 3) values.push(readUint16(view, current, little));
    else if (type === 4) values.push(readUint32(view, current, little));
    else if (type === 9) values.push(view.getInt32(current, little));
    else if (type === 5 || type === 10) {
      const num = type === 10 ? view.getInt32(current, little) : readUint32(view, current, little);
      const den = type === 10 ? view.getInt32(current + 4, little) : readUint32(view, current + 4, little);
      values.push(den ? num / den : 0);
    } else values.push(view.getUint8(current));
  }
  return values.length === 1 ? values[0] : values;
}

function normalizeExifValue(value) {
  if (Array.isArray(value)) return value.map((item) => roundExif(item)).join(", ");
  return value;
}

function formatGps(entries) {
  const lat = entries[2]?.raw;
  const lon = entries[4]?.raw;
  const latRef = entries[1]?.value;
  const lonRef = entries[3]?.value;
  if (!Array.isArray(lat) || !Array.isArray(lon)) return "";
  const latValue = gpsToDecimal(lat, latRef);
  const lonValue = gpsToDecimal(lon, lonRef);
  if (latValue == null || lonValue == null) return "";
  return `${latValue.toFixed(6)}, ${lonValue.toFixed(6)}`;
}

function gpsToDecimal(parts, ref) {
  if (parts.length < 3) return null;
  const value = Number(parts[0]) + Number(parts[1]) / 60 + Number(parts[2]) / 3600;
  return ref === "S" || ref === "W" ? -value : value;
}

function formatOrientation(value) {
  const labels = {
    1: "Normal",
    3: "180 graus",
    6: "90 graus",
    8: "270 graus",
  };
  return labels[value] || value;
}

function formatExposure(value) {
  if (!value) return "";
  if (value < 1) return `1/${Math.round(1 / value)}s`;
  return `${roundExif(value)}s`;
}

function roundExif(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) / 100 : value;
}

function addExif(target, key, value) {
  if (value) target[key] = value;
}

function readUint16(view, offset, little) {
  return view.getUint16(offset, little);
}

function readUint32(view, offset, little) {
  return view.getUint32(offset, little);
}

function getAscii(view, offset, length) {
  let output = "";
  for (let index = 0; index < length && offset + index < view.byteLength; index += 1) {
    output += String.fromCharCode(view.getUint8(offset + index));
  }
  return output;
}

function formatCellValue(cell) {
  if (!cell) return "";
  if (cell.w != null) return String(cell.w);
  if (cell.v == null) return "";
  return String(cell.v);
}

function paginateHtml(html) {
  const doc = new DOMParser().parseFromString(`<main>${html}</main>`, "text/html");
  const nodes = [...doc.body.firstElementChild.childNodes];
  const pages = [];
  let current = "";
  let size = 0;
  const target = 1500;
  nodes.forEach((node) => {
    const outer = node.outerHTML ?? escapeHtml(node.textContent ?? "");
    const textSize = (node.textContent ?? outer).length;
    if (current && size + textSize > target) {
      pages.push(current);
      current = "";
      size = 0;
    }
    current += outer;
    size += textSize;
  });
  if (current) pages.push(current);
  return pages.length ? pages : ["<p>Sem conteudo textual.</p>"];
}

async function extractPdfText(file) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  await pdf.destroy?.();
  return pages.join("\n\n");
}

async function pptxToSlides(file) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1] ?? 0) - Number(b.match(/slide(\d+)/)?.[1] ?? 0));
  return Promise.all(slideNames.map(async (name) => {
    const xml = await zip.files[name].async("string");
    return [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)]
      .map((match) => decodeXml(match[1]))
      .join("\n");
  }));
}

async function pptxToVisualSlides(file) {
  const { PptxPresentation } = await import("@silurus/ooxml/pptx");
  const presentation = await PptxPresentation.load(await file.arrayBuffer(), {
    useGoogleFonts: false,
  });
  const slides = [];
  try {
    for (let index = 0; index < presentation.slideCount; index += 1) {
      const canvas = document.createElement("canvas");
      await presentation.renderSlide(canvas, index, {
        width: 1280,
        dpr: 1.2,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        slides.push({
          index,
          url: URL.createObjectURL(blob),
        });
      }
    }
  } finally {
    presentation.destroy();
  }
  if (!slides.length) throw new Error("Nao foi possivel renderizar os slides.");
  return slides;
}

function inferLanguage(name, content) {
  const extension = getExtension(name);
  if (["js", "jsx"].includes(extension)) return "javascript";
  if (["ts", "tsx"].includes(extension)) return "typescript";
  if (["css"].includes(extension)) return "css";
  if (["html", "htm"].includes(extension)) return "html";
  if (["json"].includes(extension)) return "json";
  if (["xml"].includes(extension)) return "xml";
  if (["yml", "yaml"].includes(extension)) return "yaml";
  if (["md"].includes(extension)) return "markdown";
  if (["log"].includes(extension)) return "log";
  if (["sql"].includes(extension)) return "sql";
  if (content.trim().startsWith("{")) return "json";
  return "text";
}

function highlightCode(value, language) {
  if (!value) return "";
  if (language === "text" || language === "log") return escapeHtml(value);
  try {
    const target = language === "html" ? "html" : language;
    if (hljs.getLanguage(target)) return hljs.highlight(value, { language: target, ignoreIllegals: true }).value;
    return hljs.highlightAuto(value).value;
  } catch {
    return escapeHtml(value);
  }
}

async function formatCode(value, language) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const prettier = await import("prettier/standalone");
  if (["javascript", "typescript", "json"].includes(language)) {
    const babel = await import("prettier/plugins/babel");
    const estree = await import("prettier/plugins/estree");
    const typescriptPlugin = language === "typescript" ? await import("prettier/plugins/typescript") : null;
    return prettier.format(text, {
      parser: language === "json" ? "json" : language === "typescript" ? "typescript" : "babel",
      plugins: language === "typescript" ? [typescriptPlugin, estree] : [babel, estree],
      printWidth: 100,
      tabWidth: 2,
      semi: true,
    });
  }
  if (language === "html" || language === "xml") {
    const html = await import("prettier/plugins/html");
    return prettier.format(text, { parser: "html", plugins: [html], printWidth: 100, tabWidth: 2 });
  }
  if (language === "css") {
    const postcss = await import("prettier/plugins/postcss");
    return prettier.format(text, { parser: "css", plugins: [postcss], printWidth: 100, tabWidth: 2 });
  }
  if (language === "markdown") {
    const markdownPlugin = await import("prettier/plugins/markdown");
    return prettier.format(text, { parser: "markdown", plugins: [markdownPlugin], proseWrap: "preserve" });
  }
  if (language === "yaml") {
    const yamlPlugin = await import("prettier/plugins/yaml");
    return prettier.format(text, { parser: "yaml", plugins: [yamlPlugin], tabWidth: 2 });
  }
  if (language === "sql") return formatSql(text);
  return text.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
}

function formatSql(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\b(select|from|where|group by|order by|having|join|left join|right join|inner join|values|set)\b/gi, "\n$1")
    .replace(/\b(and|or)\b/gi, "\n  $1")
    .replace(/,\s*/g, ",\n  ")
    .trim();
}


function markdownToHtml(markdown) {
  return escapeHtml(markdown)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br />");
}

function wrapHtml(body) {
  return `<!doctype html><html><head><style>
    body{font-family:Arial,sans-serif;margin:24px;color:#111;background:#fff;line-height:1.45}
    table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:6px;vertical-align:top}
    .slide{border:1px solid #111;margin:0 0 18px;padding:18px;min-height:180px}
    pre{white-space:pre-wrap;font-family:Arial,sans-serif}
  </style></head><body>${body}</body></html>`;
}

function htmlToText(value) {
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decodeXml(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}
