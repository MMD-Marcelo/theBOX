import React, { useState } from "react";

export default function CsvJsonConverter() {
  const [mode, setMode] = useState("csv-json");
  const [input, setInput] = useState("nome,email\nAda,ada@thebox.local");
  const [output, setOutput] = useState("");

  function parseCsv(csv) {
    const [headerLine = "", ...rows] = csv.trim().split(/\r?\n/);
    const headers = headerLine.split(",").map((value) => value.trim());
    return rows.map((row) => {
      const values = row.split(",");
      return headers.reduce((entry, header, index) => {
        entry[header] = values[index]?.trim() ?? "";
        return entry;
      }, {});
    });
  }

  function toCsv(json) {
    const rows = JSON.parse(json);
    const list = Array.isArray(rows) ? rows : [rows];
    const headers = [...new Set(list.flatMap((row) => Object.keys(row)))];
    return [
      headers.join(","),
      ...list.map((row) => headers.map((header) => row[header] ?? "").join(",")),
    ].join("\n");
  }

  function convert() {
    try {
      setOutput(
        mode === "csv-json"
          ? JSON.stringify(parseCsv(input), null, 2)
          : toCsv(input)
      );
    } catch (error) {
      setOutput(`Erro: ${error.message}`);
    }
  }

  return (
    <div className="tool-shell">
      <div className="segments inline">
        <button
          className={mode === "csv-json" ? "active" : ""}
          onClick={() => setMode("csv-json")}
          type="button"
        >
          CSV para JSON
        </button>
        <button
          className={mode === "json-csv" ? "active" : ""}
          onClick={() => setMode("json-csv")}
          type="button"
        >
          JSON para CSV
        </button>
      </div>
      <div className="two-pane">
        <textarea
          className="big-input"
          onChange={(event) => setInput(event.target.value)}
          value={input}
        />
        <textarea className="big-input" readOnly value={output} />
      </div>
      <button onClick={convert} type="button">Converter</button>
    </div>
  );
}
