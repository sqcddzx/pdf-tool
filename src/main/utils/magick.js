import path from 'path';
import cmdExec from './cmdExec';

//使用本地依赖
const resourcesPath = process.env.NODE_ENV === 'development'
 ? path.join(process.cwd(), '/resources') : process.resourcesPath

const magickPath = path.join(resourcesPath, '/imagemagick/magick.exe')

// 默认参数
const options = {
  density: 300,
  quality: 100
}

export const jpg2jpg = async (inputPath, outputPath, args = {}) => {
  let density = args.density || options.density
  let quality = args.quality || options.quality

  let cmd = `"${magickPath}" "${inputPath}" -resample ${density} -quality ${quality} "${outputPath}"`

  await cmdExec(cmd)
}