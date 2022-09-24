// 图表配置项
export let chartOptions = {
    // 右侧价格轴
    rightPriceScale: {
        visible: false,
        borderVisible: false,
    },
    // 禁止所有交互
    handleScale: {
        axisPressedMouseMove: false,
    },
    // 时间轴
    timeScale: {
        borderVisible: false,
    },
    // 网格
    grid: {
        horzLines: {
            visible: false,
        },
        vertLines: {
            color: 'rgba(140,140,140,0.1)',
        },
    },
    // 交互轴
    crosshair: {
        mode: 0,
    },
}

export let lineOptions = {
    lineWidth: 1.2,
    priceLineVisible: false,
}