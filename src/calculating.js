import { LumpedModel } from './LumpedModel.js'
import BFGS from 'bfgs-algorithm'

let lumpedModels = []
let bfgs = null
let termination = 0
let iterator = 0

onmessage = (message) => {
    // 传递过来的data类型，应该包含
    // {
    //     type: 'start' || 'step', 操作的类型
    //     guess: [],               猜想值
    //     target: [],              目标集总对象的数量
    //     termination: 2           目标函数期望值
    // }
    const data = message.data

    switch (data.type) {
        case 'start':
            start(data)
            break
        case 'step':
            step()
            break
        default:
            break
    }
}

const start = (data) => {
    // 重置
    lumpedModels = []
    bfgs = null
    iterator = 0
    termination = data.termination

    let guess = data.guess
    let target = data.target

    let lm = null
    for (let i = 0, len = target.length; i < len; i++) {
        lm = new LumpedModel(target[i].yStart, target[i].yActual, target[i].operatingParams, target[i].option)
        lumpedModels.push(lm)
    }

    let objectiveFn = (x) => {
        let objectiveValue = 0

        let i, len = lumpedModels.length
        for (let i = 0, len = target.length; i < len; i++) {
            objectiveValue += lumpedModels[i].objectiveFn(x)
        }

        return objectiveValue
    }

    bfgs = new BFGS(objectiveFn, guess)

    postMessage({
        type: 'start',
        msg: ' ------ 拟合开始 ------ \r\n'
    })
}

const step = () => {
    bfgs.step()

    postMessage({
        type: 'calculating',
        msg: `第${++iterator}次 => 目标函数值：${bfgs.fMin} \r\n`
    })

    detect()
}

const detect = () => {
    if (bfgs.fMin < termination) {
        let result = {
            params: [], // 只有一组，因为每一个集总对象的params都是一样的
            yCalcu: [], // yCalcu与k一样是根据计算的集总对象的数量确定的
            k: []
        }

        result.params = lumpedModels.length > 0 ? lumpedModels[0] : []

        for (let i = 0, len = lumpedModels.length; i < len; i++) {
            result.yCalcu.push(lumpedModels[i].getProduct())
            result.k.push(lumpedModels[i].k)
        }

        postMessage({
            type: 'end',
            msg: ' ------ 拟合完成 ------ \r\n',
            result: result
        })
    }
}
