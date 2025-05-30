import fs from 'fs'
import path from 'path'
import { PDFDocument, degrees } from 'pdf-lib'

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

export const mergePdf = async (pdfA, pdfB, output, option) => {
  let position = option.position || { base: 'center', offsetX: 0, offsetY: 0 }
  let opacity = option.opacity != undefined ? option.opacity : 100

  try {
    // 读取源PDF
    const inputPdfBytes = await fs.promises.readFile(pdfA)
    const pdfDoc = await PDFDocument.load(inputPdfBytes)
    
    // 读取水印PDF
    const watermarkPdfBytes = await fs.promises.readFile(pdfB)
    const watermarkPdf = await PDFDocument.load(watermarkPdfBytes)
    
    // 获取水印页面
    const watermarkPages = await pdfDoc.embedPdf(watermarkPdf)
    const watermarkPage = watermarkPages[0]
    
    // 获取水印尺寸
    const watermarkWidth = watermarkPdf.getPage(0).getWidth()
    const watermarkHeight = watermarkPdf.getPage(0).getHeight()
    
    const outputDir = output.replace(/\\/g, '/')
    const outputPath = `${outputDir}/${path.basename(pdfA)}`.replace(/\\/g, '/')

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 为每一页添加水印
    const pages = pdfDoc.getPages()
    for (const page of pages) {
      const { width, height } = page.getSize()
      const { x, y } = calculatePosition(position, width, height, watermarkWidth, watermarkHeight)
      
      // 添加水印
      page.drawPage(watermarkPage, {
        x,
        y,
        width: watermarkWidth,
        height: watermarkHeight,
        opacity: opacity / 100, // 将百分比转换为0-1之间的值
        rotate: degrees(0) // 使用 degrees 函数创建旋转角度
      })
    }
    
    // 保存PDF
    const pdfBytes = await pdfDoc.save()
    await fs.promises.writeFile(outputPath, pdfBytes)
    
    return true
  } catch (error) {
    console.error('添加水印失败:', error)
    throw error
  }
}
