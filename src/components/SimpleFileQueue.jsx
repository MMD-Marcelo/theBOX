import React from "react";
import { ChevronRight, Download, FileText, Trash2 } from "lucide-react";
import { getExtension, formatBytes } from "../utils.js";

export default function SimpleFileQueue({ actionLabel, items, onAction, onRemove, statusClass }) {
  return (
    <div className="file-queue">
      {items.map((item) => (
        <div className="file-row simple-row" key={item.id}>
          <div className="file-main">
            <FileText aria-hidden="true" size={20} />
            <div>
              <strong>{item.file.name}</strong>
              <span>{getExtension(item.file.name).toUpperCase() || "FILE"} / {formatBytes(item.file.size)}</span>
            </div>
          </div>
          {"outputSize" in item && (
            <span className="compression-size">{item.outputSize ? formatBytes(item.outputSize) : "-"}</span>
          )}
          <span className={`queue-status ${statusClass?.(item.status) ?? item.status.toLowerCase()}`}>
            {item.status}
          </span>
          {item.downloadUrl ? (
            <a className="icon-button" download={item.outputName} href={item.downloadUrl}>
              <Download aria-hidden="true" size={18} />
            </a>
          ) : (
            <button className="icon-button" onClick={() => onAction(item)} title={actionLabel} type="button">
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          )}
          <button className="icon-button" onClick={() => onRemove(item.id)} title="Remover arquivo" type="button">
            <Trash2 aria-hidden="true" size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
