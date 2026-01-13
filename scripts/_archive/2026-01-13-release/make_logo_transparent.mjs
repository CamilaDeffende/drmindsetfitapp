import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();

// fonte: tenta primeiro a do public, depois a do src/assets, depois a do Desktop
const candidates = [
  path.join(ROOT, "public", "brand", "mindsetfit-logo.png"),
  path.join(ROOT, "src", "assets", "branding", "mindsetfit-logo.png"),
  path.join(process.env.HOME || "", "Desktop", "mindsetfit-logo.png"),
];

const src = candidates.find(p => fs.existsSync(p));
if (!src) {
  console.error("❌ Não achei a logo fonte. Procurei:\n" + candidates.join("\n"));
  process.exit(1);
}

const outPublic = path.join(ROOT, "public", "brand", "mindsetfit-logo.png");
const outSrc    = path.join(ROOT, "src", "assets", "branding", "mindsetfit-logo.png");

// Remove “fundo preto/quase preto” -> alpha 0 (threshold ajustável)
const TH = 34; // 0..255 (quanto maior, mais agressivo na remoção)
const img = sharp(src).ensureAlpha();

const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const out = Buffer.from(data);

for (let i = 0; i < out.length; i += 4) {
  const r = out[i], g = out[i+1], b = out[i+2];
  // detecta pixels escuros (fundo) e torna transparente
  if (r <= TH && g <= TH && b <= TH) {
    out[i+3] = 0;
  }
}

// Export final (mantém tamanho, otimiza)
const outSharp = sharp(out, { raw: info })
  .png({ compressionLevel: 9, adaptiveFiltering: true });

await outSharp.toFile(outPublic);
await outSharp.toFile(outSrc);

console.log("✅ Logo com transparência gerada em:");
console.log("   -", outPublic);
console.log("   -", outSrc);
