import { LumpedModel } from './LumpedModel.js'
import BFGS from 'bfgs-algorithm'

onmessage = (event) => {
    const MAX_ITERATOR = 1
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

    try {
        for (let i = 0; i < MAX_ITERATOR; i++) {
            bfgs.step()

            postMessage({
                type: 'calculating',
                msg: bfgs.fMin
            })

            if (bfgs.fMin < 1) {
                break
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
