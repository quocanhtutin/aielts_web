import pdf from "pdf-poppler";
import fs from "fs";
import path from "path";
import os from "os";

export const pdfToImages = async (pdfPath) => {

  const outputDir = path.join(
    os.tmpdir(),
    `pdf-${Date.now()}`
  );

  fs.mkdirSync(outputDir, { recursive: true });

  await pdf.convert(pdfPath, {
    format: "png",
    out_dir: outputDir,
    out_prefix: "page",
    page: null
  });

  return fs
    .readdirSync(outputDir)
    .filter(f => f.endsWith(".png"))
    .map(f => path.join(outputDir, f));
};