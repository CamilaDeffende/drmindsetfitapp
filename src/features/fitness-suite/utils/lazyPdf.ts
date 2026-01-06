/**
 * PDF Lazy Loader (premium):
 * Carrega o módulo pesado somente quando o usuário clicar em "Exportar".
 */
export async function lazyExportPdf() {
  // ajuste o caminho abaixo se seu exportador estiver em outro local
  const mod = await import("../../../lib/exportar-pdf");
  return mod;
}
