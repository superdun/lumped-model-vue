import { LumpedModel } from './LumpedModel.js'
import BFGS from 'bfgs-algorithm'

onmessage = (event) => {
    const MAX_ITERATOR = 200
    const FITTING_OPTION = {
        isFittingK: false
    }

    let initGuessFittingParams = event.data.initGuessFittingParams
    let params = event.data.params
    let lumpedModels = []
    let lm = null

    let i, len = params.length
    for (i = 0; i < len; i++) {
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

    try {
        for (let i = 0; i < MAX_ITERATOR; i++) {
            bfgs.step()

            postMessage({
                type: 'calculating',
                msg: `第${i + 1}次 => 目标函数值：${bfgs.fMin} \r\n`,
                data: {}
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

            if (i === MAX_ITERATOR - 1) {
                postMessage({
                    type: 'over',
                    msg: ' ------ 达到最大迭代次数 ------ \r\n',
                    data: {
                        k: lumpedModels[0].k,
                        params: lumpedModels[0].params
                    }
                })
            }
        }
    } catch(err) {
        postMessage({
            type: 'err',
            msg: err
        })
    }

    // postMessage({
    //     bfgs: JSON.parse(bfgs),
    //     lumpedModels: JSON.parse(lumpedModels)
    // })
}
