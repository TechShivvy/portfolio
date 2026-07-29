import React from "react";

// Renders text with dim italic styling for // comment fragments.
// Lines that start with // become fully styled; inline // is split.
export default function renderText(text) {
  if (text.startsWith("//") || text.match(/^\s+\/\//)) {
    return <span style={{ fontStyle: "italic", opacity: 0.45 }}>{text}</span>;
  }
  const idx = text.indexOf(" // ");
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ fontStyle: "italic", opacity: 0.45 }}>{text.slice(idx)}</span>
    </>
  );
}
