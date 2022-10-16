// 金融数字格式化
export let formatNumber = (value) => {
    let result = Math.abs(value)
    if (result > 10 ** 12) result = (value / 10 ** 12).toFixed(2) + '万亿'
    // 百亿
    else if (result > 10 ** 10) result = (value / 10 ** 8).toFixed(1) + '亿'
    // 亿
    else if (result > 10 ** 8) result = (value / 10 ** 8).toFixed(2) + '亿'
    // 千万
    else if (result > 10 ** 7) result = (value / 10 ** 4).toFixed(0) + '万'
    // 百万
    else if (result > 10 ** 6) result = (value / 10 ** 4).toFixed(1) + '万'
    // 万
    else if (result > 10 ** 4) result = (value / 10 ** 4).toFixed(2) + '万'
    else result = value.toFixed(2)
    return result
}

// label 中文名; color 颜色; format 是否格式化; extra 尾部; unit 单位; showPlus 展示符号
export let IdcDict = {
    // 行情指标
    'price': {label: '价格', color: 'pct_chg', format: false},
    'pct_chg': {label: '涨跌幅', color: 'pct_chg', extra: '%', format: false, showPlus: true},
    'main_net': {label: '大单净额', color: 'main_net'},
    'mc': {label: '总市值', unit: '亿'},
    'fmc': {label: '流通市值'},
    'vol': {label: '成交量'},
    'amount': {label: '成交额', unit: '亿'},
    'tr': {label: '换手率', extra: '%'},
    'amp': {label: '振幅', extra: '%'},
    'pct_year': {label: '今年涨幅', color: 'pct_year', extra: '%', showPlus: true},
    'ratio': {label: '港资持股', extra: '%'},
    'balance': {label: '两融余额', unit: '亿'},

    // 估值指标
    'pe_ttm': {label: '市盈率'},
    'pb': {label: '市净率'},
    'ps_ttm': {label: '市销率'},
    'dv_ttm': {label: '股息率'},

    // 财务指标
    'netprofit_yoy': {label: '净利增速', color: 'netprofit_yoy', extra: '%'},
    'or_yoy': {label: '营收增速', color: 'or_yoy', extra: '%'},
    'basic_eps': {label: '每股收益', color: 'basic_eps'},
    'roe': {label: 'ROE', extra: '%'},

    // 技术指标
    'macd': {label: 'MACD'},
    'MACD': {label: 'MACD'},
    'winner_rate': {label: '盈利筹码', extra: '%'},
}

import * as fzstd from 'fzstd'
import {Buffer} from 'buffer'

export let Decompress = (str) => {
    const buffer = Buffer.from(str, 'base64')
    const d = fzstd.decompress(buffer)

    // utf8解码
    const utf8Str = new TextDecoder().decode(d)
    const r = JSON.parse(utf8Str)
    console.log(r)
    return r
}

// 初始化websocket
export let NewWebSocket = (url, query) => {
    if (query) {
        // 拼接url
        url += '?'
        for (let key in query) {
            if (query[key] !== null) url += key + '=' + query[key] + '&'
        }
        url = url.substring(0, url.lastIndexOf('&'))
    }
    return new WebSocket(window.$WS_URL + url)
}
