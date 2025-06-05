import fs from 'fs'
import path from 'path'
import { PDFDocument, degrees } from 'pdf-lib'
import cmdExec from './cmdExec'

//使用本地依赖
const resourcesPath = process.env.NODE_ENV === 'development'
 ? path.join(process.cwd(), '/resources') : process.resourcesPath

const pdftkPath = path.join(resourcesPath, '/pdftk/pdftk.exe')

// 将毫米转换为PDF点（1点 = 1/72英寸，1英寸 = 25.4毫米）
const mmToPoints = (mm) => {
  return (mm * 72) / 25.4
}

// 计算九宫格位置
const calculatePosition = (position, pageWidth, pageHeight, watermarkWidth, watermarkHeight) => {
  // 九宫格位置映射（注意：PDF坐标系统从左下角开始）
  const positions = {
    'top-left': { x: 0, y: pageHeight },
    'top-center': { x: pageWidth/2, y: pageHeight },
    'top-right': { x: pageWidth, y: pageHeight },
    'middle-left': { x: 0, y: pageHeight/2 },
    'center': { x: pageWidth/2, y: pageHeight/2 },
    'middle-right': { x: pageWidth, y: pageHeight/2 },
    'bottom-left': { x: 0, y: 0 },
    'bottom-center': { x: pageWidth/2, y: 0 },
    'bottom-right': { x: pageWidth, y: 0 }
  }

  const basePosition = positions[position.base] || positions['center']
  const offsetX = mmToPoints(position.offsetX || 0)
  const offsetY = mmToPoints(position.offsetY || 0)

  let x = basePosition.x
  let y = basePosition.y

  // 根据基准点调整偏移方向和水印位置
  if (position.base && position.base.includes('right')) {
    x = basePosition.x - watermarkWidth - offsetX
  } else if (position.base && position.base.includes('center')) {
    x = basePosition.x - (watermarkWidth / 2) + offsetX
  } else {
    x = basePosition.x + offsetX
  }

  if (position.base && position.base.includes('top')) {
    y = basePosition.y - watermarkHeight - offsetY
  } else if (position.base && (position.base.includes('middle') || position.base === 'center')) {
    y = basePosition.y - (watermarkHeight / 2) + offsetY
  } else if (position.base && position.base.includes('bottom')) {
    y = basePosition.y + offsetY
  }

  return { x, y }
}

// 创建临时水印PDF
const createWatermarkPdf = async (pdfA, pdfB, position, opacity) => {
  try {
    //按pdfA尺寸创建一个空pdf
    const sourcePdfBytes = await fs.promises.readFile(pdfA)
    const sourcePdf = await PDFDocument.load(sourcePdfBytes)
    const sourceWidth = sourcePdf.getPage(0).getWidth()
    const sourceHeight = sourcePdf.getPage(0).getHeight()
    const watermarkDoc = await PDFDocument.create()
    const page = watermarkDoc.addPage([sourceWidth, sourceHeight])
    
    //添加水印到空白pdf
    const watermarkPdfBytes = await fs.promises.readFile(pdfB)
    const watermarkPdf = await PDFDocument.load(watermarkPdfBytes)
    const watermarkWidth = watermarkPdf.getPage(0).getWidth()
    const watermarkHeight = watermarkPdf.getPage(0).getHeight()
    const watermarkPages = await watermarkDoc.embedPdf(watermarkPdf)
    const watermarkPage = watermarkPages[0]
    
    // 计算水印位置
    const { x, y } = calculatePosition(position, sourceWidth, sourceHeight, watermarkWidth, watermarkHeight)
    
    // 添加水印
    page.drawPage(watermarkPage, {
      x,
      y,
      width: watermarkWidth,
      height: watermarkHeight,
      opacity: opacity / 100,
      rotate: degrees(0)
    })
    
    // 保存临时水印PDF
    const randomStr = Math.random().toString(36).substring(2, 8)
    const tempWatermarkPath = path.join(path.dirname(pdfB), `temp${randomStr}.pdf`)
    const pdfBytes = await watermarkDoc.save()
    await fs.promises.writeFile(tempWatermarkPath, pdfBytes)
    
    return tempWatermarkPath
  } catch (error) {
    console.error('创建临时水印失败:', error)
    throw error
  }
}

export const mergePdf = async (pdfA, pdfB, output, option) => {
  let position = option.position || { base: 'center', offsetX: 0, offsetY: 0 }
  let opacity = option.opacity != undefined ? option.opacity : 100

  try {
    // 创建临时水印PDF
    const tempWatermarkPath = await createWatermarkPdf(pdfA, pdfB, position, opacity)
    
    // 使用pdftk合并PDF
    const outputDir = output.replace(/\\/g, '/')
    const outputPath = `${outputDir}/${path.basename(pdfA)}`.replace(/\\/g, '/')

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 使用pdftk命令合并PDF
    const command = `${pdftkPath} "${pdfA}" stamp "${tempWatermarkPath}" output "${outputPath}"`
    await cmdExec(command)
    
    // 删除临时水印文件
    fs.unlinkSync(tempWatermarkPath)
    
    return true
  } catch (error) {
    console.error('添加水印失败:', error)
    throw error
  }
}
