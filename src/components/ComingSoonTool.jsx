import React from "react";
import { LockKeyhole } from "lucide-react";

export default function ComingSoonTool({ tool }) {
  return (
    <div className="tool-shell placeholder">
      <div className="placeholder-icon">
        <LockKeyhole aria-hidden="true" size={34} />
      </div>
      <h3>{tool.name}</h3>
      <p>{tool.status}</p>
    </div>
  );
}
