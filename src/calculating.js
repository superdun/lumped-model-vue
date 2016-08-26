import { LumpedModel } from './LumpedModel.js'
import BFGS from 'bfgs-algorithm'

// 全局变量，用于控制计算的暂停与继续
let isCalculating = false

onmessage = (message) => {
    const data = message.data

    switch (data.type) {
        case 'start':
            startCalculate(data)
            break
        case 'stop':
            stopCalculate()
            break
        default:
            break
    }
}

const stopCalculate = () => {
    console.log(isCalculating)
    isCalculating = false
}

const startCalculate = (msgData) => {
    isCalculating = true

    const MAX_ITERATOR = 10
    const FITTING_OPTION = {
        isFittingK: false
    }

    let initGuessFittingParams = msgData.initGuessFittingParams
    let params = msgData.params
    let lumpedModels = []
    let lm = null

    for (let i = 0, len = params.length; i < len; i++) {
        lm = new LumpedModel(params[i].yStart, params[i].yActual, params[i].operatingParams, FITTING_OPTION)
        lumpedModels.push(lm)
    }

    const objectiveFn = (x) => {
        let objectiveValue = 0

        let i, len = lumpedModels.length
        for (i = 0; i < len; i++) {
            objectiveValue += lumpedModels[i].objectiveFn(x)
        }

        return objectiveValue
    }

    const bfgs = new BFGS(objectiveFn, initGuessFittingParams)

    postMessage({
        type: 'start',
        msg: ' ------ 拟合开始 ------ \r\n'
    })

    calculate(bfgs, lumpedModels)

    // postMessage({
    //     bfgs: JSON.parse(bfgs),
    //     lumpedModels: JSON.parse(lumpedModels)
    // })
}

const calculate = (bfgs, lumpedModels) => {
    let i = 0
    try {
        while (isCalculating) {
            bfgs.step()

            postMessage({
                type: 'calculating',
                msg: `第${++i}次 => 目标函数值：${bfgs.fMin} \r\n`
            })

            if (bfgs.fMin < 2) {
                let params = []
                for (let j = 0; j < lumpedModels.length; j++) {
                    params.push(lumpedModels[j].k)
                }

                postMessage({
                    type: 'done',
                    msg: ' ------ 拟合完成 ------ \r\n',
                    data: {
                        k: {
                            '807.15': lumpedModels[0].k,
                            '797.15': lumpedModels[3].k,
                            '787.15': lumpedModels[4].k
                        },
                        params: lumpedModels[0].params,
                        yCalcu: [
                            lumpedModels[0].getProduct(),
                            lumpedModels[1].getProduct(),
                            lumpedModels[2].getProduct(),
                            lumpedModels[3].getProduct(),
                            lumpedModels[4].getProduct()
                        ]
                    }
                })

                break
            }
        }
    } catch(err) {
        postMessage({
            type: 'err',
            msg: err
        })
    }
}
