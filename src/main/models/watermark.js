import fs from 'fs'
import path from 'path'
import cmdExec from './cmdExec'

export const addWatermark = async (pdfA, pdfB, output) => {
  const watermarkPath = pdfB.replace(/\\/g, '/')
  const inputPath = pdfA.replace(/\\/g, '/')
  const outputDir = output.replace(/\\/g, '/')
  const outputPath = `${outputDir}/${path.basename(pdfA)}`.replace(/\\/g, '/')
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const cmd = `pdftk "${inputPath}" stamp "${watermarkPath}" output "${outputPath}"`;

  await cmdExec(cmd)
}
