import { exec } from 'child_process'

/**
 * 命令行
 * @param {String} cmd 命令行
 * @param {String} time 超时时长，单位毫秒, 默认0不限制时长
 */
export default (cmd, { time = 0, stdout } = {}) => {
  return new Promise((res, rej) => {
    let timer = time ? setTimeout(() => rej(`
      CMD指令超时
      指令：${cmd}
    `), time) : null

    const child = exec(cmd, (err, data) => {
      clearTimeout(timer)
      timer = null
      err ? rej(err) : res(data)
    })

    // 监听标准输出
    child.stdout.on('data', (data) => {
      if (stdout && typeof stdout === 'function') {
        stdout(data.toString());
      }
    });
  })
}