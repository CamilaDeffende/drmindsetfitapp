export async function generatePremiumPDF() {
  const [{ jsPDF }, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas")
  ]);

  const element = document.getElementById("premium-report");
  if (!element) return;

  const canvas = await html2canvas.default(element, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const width = 210;
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  pdf.save("Relatorio-DrMindSetFit.pdf");
}
