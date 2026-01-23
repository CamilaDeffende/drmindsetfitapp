export function downloadText(filename: string, text: string, mime = "application/octet-stream") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Compat: legado espera downloadTextFile()
export function downloadTextFile(filename: string, text: string, mime = "application/octet-stream") {
  return downloadText(filename, text, mime);
}
