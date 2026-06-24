import React, { useEffect, useRef } from "react";
import { Upload } from "lucide-react";

export default function DropZone({ accept, children, multiple = true, onFile }) {
  const inputRef = useRef(null);

  useEffect(() => {
    function handlePaste(event) {
      if (isEditableTarget(event.target)) return;
      const files = getClipboardFiles(event.clipboardData)
        .filter((file) => acceptsFile(file, accept));
      if (!files.length) return;
      event.preventDefault();
      onFile(multiple ? files : files.slice(0, 1));
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [accept, multiple, onFile]);

  return (
    <button
      className="dropzone"
      onClick={() => inputRef.current?.click()}
      type="button"
    >
      <input
        accept={accept}
        hidden
        multiple={multiple}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFile(files);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <Upload aria-hidden="true" size={28} />
      {children}
    </button>
  );
}

function getClipboardFiles(clipboardData) {
  const directFiles = Array.from(clipboardData?.files ?? []);
  const itemFiles = Array.from(clipboardData?.items ?? [])
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter(Boolean);
  const files = directFiles.length ? directFiles : itemFiles;
  return files.map((file) => ensureNamedClipboardFile(file));
}

function ensureNamedClipboardFile(file) {
  if (file.name && file.name !== "image.png") return file;
  const extension = mimeToExtension(file.type) || "bin";
  const name = file.name || `clipboard-${Date.now()}.${extension}`;
  return new File([file], name, { type: file.type, lastModified: Date.now() });
}

function acceptsFile(file, accept = "") {
  const rules = String(accept)
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return rules.some((rule) => {
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    if (rule.startsWith(".")) return name.endsWith(rule);
    return type === rule;
  });
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return target.isContentEditable || tag === "textarea" || tag === "input" || tag === "select";
}

function mimeToExtension(type) {
  return {
    "application/pdf": "pdf",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "image/avif": "avif",
    "image/bmp": "bmp",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
  }[type];
}
