export const convert = (data) => {
  data.data = convertANSI(data.data)

  try {
    let jsonStr = data.data.replace(/(\w+):/g, '"$1":').replace(/'/g, '"')
    let jsonData = JSON.parse(jsonStr)
    data.data = typeof jsonData == 'object'
      ? json2html(jsonData, 1)
      : jsonData
  } catch (e) {
  }

  return data
}

const convertANSI = (str) => {
  if (typeof str == 'string') {
    let info = str.match(/\x1b\[(\d+)m(.*?)\x1b\[0m/)
    if (info) {
      //识别替换ANSI转义符
      return convertANSI(str
        .replace(`\x1b[${info[1]}m`, '')
        .replace(`${info[2]}\x1b[0m`, `${span(info[2], info[1])}\x1b[0m`)
      )
    }
    //最后去掉未处理的ANSI转义符
    return str.replace(/[\x1b\x9b][[()#;?]*([0-9]{1,4}(;[0-9]{0,4})*)?[0-9A-PRZcf-ntqry=><~]/g, '')
  }
  return str
}

const json2html = (json, index) => {
  let mainStr = `${Object.keys(json).map((key) => {
    //处理value，区分object、string、number
    let value = typeof json[key] == 'object' && json[key] !== null
      ? json2html(json[key], index + 1)
      : typeof json[key] == 'string'
        ? `"${json[key]}"`
        : json[key]

    return [
      `${' '.repeat(index * 2)}`,
      `${span(key, `k`)}`,
      `${span(`: `, `s`)}`,
      `${span(value, `v`)}`
    ].join(``)
  }).join(`\n`)}`

  return [
    `${span(`{`, `s`)}`,//{
    `${mainStr}`,
    `${' '.repeat((index - 1) * 2)}${span(`}`, `s`)}`//}
  ].join(`\n`)
}

const span = (text, type) => {
  let color = '#efefef'

  //key
  if (type == 'k') {
    color = '#efefef'
  }

  //value
  if (type == 'v') {
    if (typeof text == 'string') {
      color = '#009900'
    }
    if (typeof text == 'number') {
      color = '#bbbb00'
    }
    if (typeof text == 'object' && text === null) {
      color = '#569cd6'
    }
  }

  // 如果是ANSI颜色类型
  if (!isNaN(type)) {
    color = {
      "30": '#000000', // 黑色
      "31": '#ff0000', // 红色
      "32": '#00ff00', // 绿色
      "33": '#ffff00', // 黄色
      "34": '#0000ff', // 蓝色
      "35": '#ff00ff', // 紫色
      "36": '#00ffff', // 青色
      "37": '#ffffff', // 白色
      "90": '#7f7f7f', // 亮黑色
      "91": '#ff7f7f', // 亮红色
      "92": '#7fff7f', // 亮绿色
      "93": '#ffff7f', // 亮黄色
      "94": '#7f7fff', // 亮蓝色
      "95": '#ff7fff', // 亮紫色
      "96": '#7fffff', // 亮青色
      "97": '#ffffff'  // 亮白色
    }[type] || '#efefef'

    //闪烁
    if (type == "5") {
      return `<span class="flicker">${text}</span>`
    } else if (type == "0") {
      return text
    }
  }

  return `<span style="color: ${color};">${text}</span>`
}