import RungeKutta from 'runge-kutta-4'

// 气体常量, 单位：m3 * Pa * K-1 * mol-1
const UNIVERSAL_GAS_CONSTANT = 8.3144598;

class LumpedModel {
    constructor(yStart, yActual, operatingParams, options) {
        operatingParams = operatingParams || {}
        options = options || {}

        // 是否使用 拟合速率参数 的方法，默认为false
        this.isFittingK = !!options.isFittingK

        // 进料组成
        this.yStart = yStart
        // 实际产物比例
        this.yActual = yActual
        // 温度
        this.temperature = operatingParams.temperature
        // 压力
        this.pressure = operatingParams.pressure
        // 停留时间
        this.residenceTime = operatingParams.residenceTime
        // 碱氮含量
        this.NPercent = operatingParams.NPercent
        // 剂油比
        this.catalystOilRatio = operatingParams.catalystOilRatio

        this.params = []

        this.k = []
    }

    derives(x, y) {
        var self = this
        var params = self.params

        var len = params.length - 3

        var dydx = []

        // 反应速率常数
        var k = []
        // 活化能
        var E = []
        // 指前因子
        var A = []
        // 失活因子
        var inactivationFactor = params.slice(len)

        if (self.isFittingK) {
            k = params.slice(0, len)
        } else {
            A = params.slice(0, len / 2)
            E = params.slice(len / 2, len)
            k = calculateArrhenius(A, E, self.temperature)
        }

        self.k = k

        // 饱和分HS
        dydx[0] = -(k[0] + k[1] + k[2] + k[3] + k[4] + k[5] + k[6] + k[7] + k[8]) * y[0]
        // 芳香分HA
        dydx[1] = -(k[9] + k[10] + k[11] + k[12] + k[13] + k[14] + k[15] + k[16] + k[17]) * y[1]
        // 胶质沥青质HR
        dydx[2] = -(k[18] + k[19] + k[20] + k[21] + k[22] + k[23] + k[24] + k[25] + k[26]) * y[2]
        // 柴油Diesel
        dydx[3] = k[0] * y[0]+ k[9] * y[1]+ k[18] * y[2] - (k[27] + k[28] + k[29] + k[30] + k[31] + k[32] + k[33] + k[34]) * y[3]
        // 汽油饱和烃GS
        dydx[4] = k[1] * y[0] + k[10] * y[1] + k[19] * y[2] + k[27] * y[3] + k[42] * y[5] - (k[35] + k[36] + k[37] + k[38] + k[39] + k[40] + k[41]) * y[4]
        // 汽油烯烃GO
        dydx[5] = k[2] * y[0] + k[11] * y[1] + k[20] * y[2] + k[28] * y[3] + k[35] * y[4] - (k[42] + k[43] + k[44] + k[45] + k[46] + k[47] + k[48]) * y[5]
        // 汽油芳烃GA
        dydx[6] = k[3] * y[0] + k[12] * y[1] + k[21] * y[2] + k[29] * y[3] + k[36] * y[4] + k[43] * y[5] - (k[49] + k[50] + k[51] + k[52] + k[53]) * y[6]
        // 干气DGas
        dydx[7] = k[4] * y[0] + k[13] * y[1] + k[22] * y[2] + k[30] * y[3] + k[37] * y[4] + k[44] * y[5] + k[49] * y[6]
        // 丙烯LO3
        dydx[8] = k[5] * y[0] + k[14] * y[1] + k[23] * y[2] + k[31] * y[3] + k[38] * y[4] + k[45] * y[5] + k[50] * y[6]
        // 丁烯LO4
        dydx[9] = k[6] * y[0] + k[15] * y[1] + k[24] * y[2] + k[32] * y[3] + k[39] * y[4] + k[46] * y[5] + k[51] * y[6]
        // 液化气LPGD
        dydx[10] = k[7] * y[0] + k[16] * y[1] + k[25] * y[2] + k[33] * y[3] + k[40] * y[4] + k[47] * y[5] + k[52] * y[6]
        // 焦炭Coke
        dydx[11] = k[8] * y[0] + k[17] * y[1] + k[26] * y[2] + k[34] * y[3] + k[41] * y[4] + k[48] * y[5] + k[53] * y[6]

        var funcA = 1 / (1 + inactivationFactor[0] * y[1])
        var funcC = Math.exp(-inactivationFactor[1] * self.residenceTime * x)
        var funcN = 1 / (1 + inactivationFactor[2] * self.NPercent / self.catalystOilRatio)
        var speed = 1 / (self.residenceTime * self.catalystOilRatio)

        // 摩尔质量, 单位: kg/mol
        var molecularWeights = 100 / (y[0] / 0.430 + y[1] / 0.430 + y[2] / 0.430 + y[3] / 0.200
                + y[4] / 0.100 + y[5] / 0.100 + y[6] / 0.100
                + y[7] / 0.040 + y[8] / 0.040 + y[9] / 0.040 + y[10] / 0.040 + y[11] / 0.018)
        // console.log(molecularWeights)
        // console.log(molecularWeights * self.pressure / (UNIVERSAL_GAS_CONSTANT * self.temperature))
        for (var i = 0; i < dydx.length; i++) {
            dydx[i] = dydx[i] * molecularWeights * self.pressure / (UNIVERSAL_GAS_CONSTANT * self.temperature * speed) / 1000
        }

        return dydx
    }

    /**
     * 目标函数：f = Σ(y计算值 - y实际值)2
     * @return {number} 目标优化函数值
     */
    objectiveFn(x) {
        var self = this

        for (var i = 0, len = x.length; i < len; i++) {
            self.params[i] = Math.abs(x[i])
        }

        var yActual = self.yActual

        var yCalcul = self.getProduct()

        var i, len = yActual.length, objectiveValue = 0
        for (i = 0; i < len; i++) {
            objectiveValue += (yActual[i] - yCalcul[i]) * (yActual[i] - yCalcul[i])
        }
        // console.log(yCalcul, objectiveValue)

        return objectiveValue
    }

    getProduct() {
        var self = this

        var yStart = []
        for (var i = 0, len = self.yStart.length; i < len; i++) {
            yStart[i] = self.yStart[i]
        }

        // 绑定this
        var derives = function(x, y) {
            return self.derives(x, y)
        }

        var rk = new RungeKutta(derives, 0, yStart, 0.01)

        for (var i = 0; i < 100; i++) {
            rk.step()
        }

        return rk.y
    }
}

/**
 * 根据阿伦尼乌斯方程计算温度为T的反应速率常数
 * @param  {array}   A   指前因子(单位：s-1)
 * @param  {array}   E   活化能(单位：J/mol)
 * @param  {number}  T   温度(单位：K)
 * @return {array}       温度T下的反应速率常数
 */
function calculateArrhenius(A, E, T) {
    var k0, k = [];

    if (A.length !== E.length) throw 'A isn\'t match E';

    var i, len = A.length;
    for (i = 0; i < len; i++) {
        k0 = A[i] * Math.exp(-E[i] / (UNIVERSAL_GAS_CONSTANT * T));
        k.push(k0);
    }

    return k;
}

export {
    LumpedModel,
    calculateArrhenius
}
