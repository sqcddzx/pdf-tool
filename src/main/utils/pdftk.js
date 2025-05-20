import fs from 'fs'
import path from 'path'
import cmdExec from './cmdExec'

//使用本地依赖
const resourcesPath = process.env.NODE_ENV === 'development'
 ? path.join(process.cwd(), '/resources') : process.resourcesPath

const pdftkPath = path.join(resourcesPath, '/pdftk/pdftk.exe')


export const mergePdf = async (pdfA, pdfB, output) => {
  const watermarkPath = pdfB.replace(/\\/g, '/')
  const inputPath = pdfA.replace(/\\/g, '/')
  const outputDir = output.replace(/\\/g, '/')
  const outputPath = `${outputDir}/${path.basename(pdfA)}`.replace(/\\/g, '/')
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const cmd = `${pdftkPath} "${inputPath}" stamp "${watermarkPath}" output "${outputPath}"`;

  await cmdExec(cmd)
}
