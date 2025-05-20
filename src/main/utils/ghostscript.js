import path from 'path';
import cmdExec from './cmdExec';

//使用本地依赖
const resourcesPath = process.env.NODE_ENV === 'development'
 ? path.join(process.cwd(), '/resources') : process.resourcesPath

const gsPath = path.join(resourcesPath, '/ghostscript/gswin64c.exe')

// 默认参数
const options = {
  density: 300,
  quality: 100
}

export const pdf2jpg = async (inputPath, outputPath, args = {}, progressCallback) => {
  let density = args.density || options.density
  let quality = args.quality || options.quality

  if (path.extname(path.basename(inputPath)) != '.pdf') {
    throw new Error(`请确保输入的文件为pdf`)
  }

  let totalPages = 0;

  let cmd = `"${gsPath}" -dBATCH -dNOPAUSE -dNOOUTERSAVE -dUseCIEColor -dCompressStreams=false -sDEVICE=jpeg -dJPEGQ=${quality} -r${density} -sOutputFile="${outputPath}" "${inputPath}"`

  await cmdExec(cmd, {
    stdout: (data) => {
      //返回进度
      if (progressCallback && typeof progressCallback === 'function') {
        const totalNum = data.match(/Processing pages \d+ through (\d+)\./);
        if (totalNum) {
          totalPages = totalNum[1]
        }

        const curNum = data.match(/Page (\d+)/);
        if (curNum) {
          const pageNumber = curNum[1]
          progressCallback(`${pageNumber}/${totalPages}`);
        }
      }
    }
  });
}
