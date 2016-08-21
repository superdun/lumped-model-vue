<template>
<div>
    <l-m-header></l-m-header>
    <div class="main">
        <l-m-tabs :tabs="tabs"></l-m-tabs>
        <div>
            <input type="file" style="width: 300px">
            <button @click="importFile">导入</button>
            <button @click="exportFile">导出</button>
            <button @click="downloadTemplate">模板下载</button>
            <button @click="calculate" :disabled="isCalculating">计算</button>
            <button @click="stopCalculate" :disabled="!isCalculating">终止</button>
        </div>
        <section v-if="tabs[0].isActive">
            <l-m-factors-table
                :caption="operationalFactors.caption"
                :factors="operationalFactors.factors">
            </l-m-factors-table>
            <l-m-factors-table
                :caption="feedFactors.caption"
                :factors="feedFactors.factors">
            </l-m-factors-table>
            <l-m-factors-table
                :caption="actualProducts.caption"
                :factors="actualProducts.factors">
            </l-m-factors-table>
            <l-m-console
                :caption="lmConsole.caption"
                :data="lmConsole.data">
            </l-m-console>
            <!-- <l-m-a-e-table
                :caption="AETable.caption"
                :headers="AETable.headers"
                :k-rows="AETable.kRows">
            </l-m-a-e-table> -->
            <l-m-k-table
                :caption="kTable.caption"
                :headers="kTable.headers"
                :k-matrix="kTable.kMatrix">
            </l-m-k-table>
        </section>

        <section v-if="tabs[1].isActive">

        </section>
    </div class="main">
    <l-m-footer></l-m-footer>
</div>
</template>

<script>
import Papa from 'papaparse'

import LMHeader from './components/LMHeader'
import LMTabs from './components/LMTabs'
import LMFooter from './components/LMFooter'
import LMFactorsTable from './components/LMFactorsTable'
import LMAETable from './components/LMAETable'
import LMKTable from './components/LMKTable'
import LMConsole from './components/LMConsole'

import { LumpedModel } from './LumpedModel.js'
import BFGS from 'bfgs-algorithm'

const LUMPS = ['HS', 'HA', 'HR', 'DIESEL', 'GS', 'GO', 'GA', 'DGAS', 'LO3', 'LO4', 'LPGD', 'COKE']
const ACTIVE_LUMPS = [
    [false, false, false, false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false, false, false, false, false, false],
    [true, true, true, false, false, false, false, false, false, false, false, false],
    [true, true, true, true, false, true, false, false, false, false, false, false],
    [true, true, true, true, true, false, false, false, false, false, false, false],
    [true, true, true, true, true, true, false, false, false, false, false, false],
    [true, true, true, true, true, true, true, false, false, false, false, false],
    [true, true, true, true, true, true, true, false, false, false, false, false],
    [true, true, true, true, true, true, true, false, false, false, false, false],
    [true, true, true, true, true, true, true, false, false, false, false, false],
    [true, true, true, true, true, true, true, false, false, false, false, false]
]

export default {
    data() {
        return {
            tabs: [
                { label: '反算', content: '计算反应速率常数的过程', isActive: true },
                { label: '正算', content: '使用反应速率常数预测产物的过程', isActive: false }
            ],

            operationalFactors: {
                caption: '操作条件',
                factors: [
                    { name: '操作温度(K)', key: 'temperature', value: '' },
                    { name: '操作压力(Pa)', key: 'pressure', value: '' },
                    { name: '剂油比', key: 'catalystOilRatio', value: '' },
                    { name: '停留时间', key: 'residenceTime', value: '' },
                    { name: '碱氮含量', key: 'NPercent', value: '' }
                ]
            },

            feedFactors: {
                caption: '进料组成',
                factors: [
                    { name: 'HS', key: 0, value: '' },
                    { name: 'HA', key: 1, value: '' },
                    { name: 'HR', key: 2, value: '' }
                ]
            },

            actualProducts: {
                caption: '实际产物',
                factors: function(lumps) {
                    var result = []
                    for (var i = 0, len = lumps.length; i < len; i++) {
                        result.push({
                            name: lumps[i],
                            key: i,
                            value: ''
                        })
                    }
                    return result
                }(LUMPS)
            },

            AETable: {
                caption: '初值设定',
                headers: ['途径', '指前因子', '活化能'],
                kRows: [
                    { name: '1 -> 4', A: '', E: ''},
                    { name: '1 -> 5', A: '', E: ''},
                    { name: '1 -> 6', A: '', E: ''},
                    { name: '1 -> 7', A: '', E: ''},
                    { name: '1 -> 8', A: '', E: ''},
                    { name: '1 -> 9', A: '', E: ''},
                    { name: '1 -> 10', A: '', E: ''},
                    { name: '1 -> 11', A: '', E: ''},
                    { name: '1 -> 12', A: '', E: ''},
                    { name: '1 -> 4', A: '', E: ''},
                    { name: '1 -> 4', A: '', E: ''}
                ]
            },

            kTable: {
                caption: '速率常数初值设置',
                headers: LUMPS,
                kMatrix: generatorKMatrix(LUMPS, ACTIVE_LUMPS)
            },

            isCalculating: false,

            lmConsole: {
                caption: '数学模型拟合过程',
                data: ''
            },

            k: {
                '807.15': [],
                '797.15': [],
                '787.15': []
            },

            params: [],

            yCalcu: {
                1: [],
                2: [],
                3: [],
                4: [],
                5: []
            },

            yActual: {
                1: [],
                2: [],
                3: [],
                4: [],
                5: []
            }
        }
    },

    methods: {
        calculate: function() {
            var self = this
            self.isCalculating = true

            // var initGuessFittingParams = [
            //     0.0015, 0.0001, 0.0012, 0.0004, 0.0001, 0.00002, 0.0002, 0.0001, 0.00001,
            //     0.00303, 0.00436, 0.00087, 0.00156, 0.00028, 0.00145, 0.00119, 0.00012, 0.00079,
            //     0.00043, 0.00024, 0.00099, 0.00012, 0.00108, 0.0014, 0.00345, 0.00028,
            //     0.00187, 0.00001, 0.00008, 0.00001, 0.00002, 0.00043, 0.00049,
            //     0.00018, 0.00044, 0.00002, 0.00031, 0.00015, 0.00028, 0.00085,
            //     0.000057, 0.000001, 0.000075, 0.000287, 0.000044, 0.000092, 0.000026, 0.000083, 0.000023,
            //     0.000001, 0.000033, 0.000097, 0.00001, 0.000136,
            //     0.0001, 0.0001, 0.0001
            // ]
            function bindValue(target, isResultArray) {
                var result = isResultArray ? [] : {}
                target.forEach(function(item) {
                    result[item.key] = item.value
                })
                return result
            }

            function bindKMatrix(target) {
                var result = []
                for (var i = 0, len = target.length; i < len; i++) {
                    for (var j = 0; j < len; j++) {
                        if (!target[i]['ks'][j].isDisabled) {
                            result.push(target[i]['ks'][j].value)
                        }
                    }
                }
                return result
            }

            // 第一组数据
            var yStart1 = [48.1, 47.2, 4.7, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            var yActual1 = [8.12*0.475, 8.12*0.485, 8.12*0.04, 14.30, 15.65, 14.58, 14.43, 2.53, 9.14, 10.02, 3.88, 7.34]
            var operatingParams1 = {
                temperature: 807.15,
                pressure: 175000,
                residenceTime: 3,
                NPercent: 0.0004,
                catalystOilRatio: 8.5
            }
            // 第二组数据
            var yStart2 = [48.1, 47.2, 4.7, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            var yActual2 = [7.6*0.475, 7.6*0.485, 7.6*0.04, 14.20, 15.38, 14.38, 14.32, 2.23, 9.64, 10.59, 4.15, 7.51]
            var operatingParams2 = {
                temperature: 807.15,
                pressure: 175000,
                residenceTime: 3,
                NPercent: 0.0004,
                catalystOilRatio: 9.2
            }
            // 第三组数据
            var yStart3 = [48.1, 47.2, 4.7, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            var yActual3 = [7.44*0.475, 7.44*0.485, 7.44*0.04, 14.21, 15.26, 14.42, 14.59, 2.11, 9.64, 10.48, 4.16, 7.68]
            var operatingParams3 = {
                temperature: 807.15,
                pressure: 175000,
                residenceTime: 3,
                NPercent: 0.0004,
                catalystOilRatio: 9.5
            }
            // 第四组数据
            var yStart4 = [48.1, 47.2, 4.7, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            var yActual4 = [8.0*0.475, 8.0*0.485, 8.0*0.04, 15.10, 16.97, 14.75, 13.58, 1.82, 8.88, 9.76, 3.83, 7.31]
            var operatingParams4 = {
                temperature: 797.15,
                pressure: 175000,
                residenceTime: 3,
                NPercent: 0.0004,
                catalystOilRatio: 8.9
            }
            // 第五组数据
            var yStart5 = [48.1, 47.2, 4.7, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            var yActual5 = [8.5*0.475, 8.5*0.485, 8.5*0.04, 15.30, 18.05, 14.74, 12.70, 1.37, 8.37, 9.58, 4.37, 7.01]
            var operatingParams5 = {
                temperature: 787.15,
                pressure: 175000,
                residenceTime: 3,
                NPercent: 0.0004,
                catalystOilRatio: 9.2
            }
            // var yStart = bindValue(self.feedFactors.factors, true).concat([0,0,0,0,0,0,0,0,0])
            // var operatingParams = bindValue(self.operationalFactors.factors, false)
            // var yActual = bindValue(self.actualProducts.factors, true)

            // this.initGuessFittingParams = bindKMatrix(self.kTable.kMatrix)
            // self.initGuessFittingParams = [0.831,0.171,0.885,5.16e-02,2.90e-02,3.20e-02,9.41e-03,1.60e-02,2.27e-02,1.0488,0.168,0.151,0.219,2.21e-02,9.73e-02,4.79e-02,4.37e-02,4.33e-02,0.193,0.245,1.149,0.123,5.66e-02,0.162,0.108,0.39,6.46e-02,6.21e-02,5.71e-02,0.272,7.65e-03,5.16e-03,8.10e-03,2.98e-02,6.20e-02,0.176,6.45e-02,5.47e-03,9.82e-03,4.04e-02,1.06e-05,5.47e-04,0.454,0.401,1.49e-02,2.97e-02,2.46e-02,1.25e-13,8.78e-03,9.01e-02,1.57e-02,8.63e-02,1.36e-06,5.51e-02,2.725,0.943,1.291,7.296,8.877,8.95,7.787,13.068,9.576,4.796,4.045,14.1,13.574,4.748,3.42,3.792,0.709,3.387,10.108,14.348,15.824,16.016,4.001,1.921,1.352,0.954,3.914,14.446,13.083,12.24,16.307,3.716,3.469,8.251,10.288,14.641,15.717,18.289,13.124,12.893,15.4,19.805,12.657,8.966,14.655,12.108,12.195,13.523,11.37,10.251,11.935,10.422,14.017,9.364,1,1,1]

            self.initGuessFittingParams = [37.50086425,309.0873674,387.1314028,219.0372444,2221.971078,6568.841545,2221.945277,2221.651326,11.6113845,25.75227419,960.5593774,814.9404083,400.8460544,9000.045491,8034.867892,9000.002745,8999.960343,20.9722689,1.70804269,105.495923,120.8633678,75.17604336,26.85769521,31.61925198,26.8250078,26.59346447,44.37673974,32400000,58800000,20000000,2400000,2580000,2400000,2400000,31.5676,450658.9942,2.06E+14,329999.9973,19114.18582,330000.0026,330000.0082,17100000000,1330.983123,394.6209516,34000000,7350000,34000000,34000000,12400000,18000.00134,203000000,18000.00224,18000.00143,2120000000,15.38783403,51.58091535,23.24757759,21.61774522,63.24304966,46.87023721,39.3362073,42.67290199,18.93567048,6.326433156,25.6270149,37.40452008,39.73176153,57.972794,62.06013493,54.23705297,84.31289581,24.24203655,37.30761572,46.25438969,46.65748479,45.72198561,36.27343106,36.7025734,36.39260826,36.29917096,0.327459819,129.9123464,131.5916016,125.3924032,127.1569463,127.4479459,127.6135086,129.0121508,128.0008564,107.5808518,209.9419822,94.5720381,68.08019766,86.7547876,110.2861527,153.325739,59.94546278,46.69479381,148.7407064,101.9267229,149.4051483,150.4436438,115.5183132,100.7188347,130.8507,100.9040376,101.4525465,158.1303922,0.00000005,0.00000004,0.00000002]
            var lm1 = new LumpedModel(yStart1, yActual1, operatingParams1, { isFittingK: false })
            var lm2 = new LumpedModel(yStart2, yActual2, operatingParams2, { isFittingK: false })
            var lm3 = new LumpedModel(yStart3, yActual3, operatingParams3, { isFittingK: false })
            var lm4 = new LumpedModel(yStart4, yActual4, operatingParams4, { isFittingK: false })
            var lm5 = new LumpedModel(yStart5, yActual5, operatingParams5, { isFittingK: false })

            var bfgs = new BFGS((x) => {
                return lm2.objectiveFn(x) + lm5.objectiveFn(x)
            }, self.initGuessFittingParams)

            var iterator = 0
            var MAX_ITERATOR = 20
            var i

            try {
                for (i = 0; i < MAX_ITERATOR; i++) {
                    bfgs.step()
                    console.log(bfgs.convergence)
                    if (bfgs.convergence < 0.03) {
                        break
                    }
                }
            } catch(err) {
                console.log(i + ':' +err)
            }

            console.log(bfgs)
            console.log(lm1)
            console.log(lm2)
            console.log(lm3)
            console.log(lm4)
            console.log(lm5)

            self.yCalcu[1] = lm1.getProduct()
            self.yCalcu[2] = lm2.getProduct()
            self.yCalcu[3] = lm3.getProduct()
            self.yCalcu[4] = lm4.getProduct()
            self.yCalcu[5] = lm5.getProduct()

            self.yActual[1] = lm1.yActual
            self.yActual[2] = lm2.yActual
            self.yActual[3] = lm3.yActual
            self.yActual[4] = lm4.yActual
            self.yActual[5] = lm5.yActual

            self.k['807.15'] = lm1.k
            self.k['797.15'] = lm4.k
            self.k['787.15'] = lm5.k

            self.params = lm1.params

            // function step() {
            //     setTimeout(function() {
            //         try {
            //             // bfgs.step()
            //             self.lmConsole.data += `第${++iterator}次迭代: [收敛值 -> ${bfgs.convergence}] [搜索步长 -> ${bfgs.stepsize}]\r`

            //             if (iterator < MAX_ITERATOR && self.isCalculating) {
            //                 step()
            //             } else {
            //                 self.isCalculating = false
            //             }

            //         } catch(err) {
            //             self.lmConsole.data += `拟合失败，请更改拟合初值\r`
            //             self.isCalculating = false
            //         }
            //     }, 300)
            // }
            // step()
        },

        stopCalculate: function() {
            this.isCalculating = false
        },

        importFile: function() {
            var self = this
            var files = this.$el.getElementsByTagName('input')[0].files
            if (files.length > 0) {
                Papa.parse(files[0], {
                    complete: function(results) {
                        var data = results.data
                        var initGuessFittingParams = self.initGuessFittingParams = []
                        var i, len = 54
                        for (var i = 0; i < len; i++) {
                            initGuessFittingParams[i] = Number(data[i][0])
                            initGuessFittingParams[i + len] = Number(data[i][0])
                        }
                    }
                })
            }
        },

        exportFile: function() {
            var self = this
            var csv = '807.15K,797.15K,787.15\r\n'

            var i, len = self.k['807.15'].length
            for (i = 0; i < len; i++) {
                csv += self.k['807.15'][i] + ',' + self.k['797.15'][i] + ',' + self.k['787.15'][i] + '\r\n'
            }

            csv += 'Params\r\n'
            for (i = 0, len = self.params.length; i < len; i++) {
                csv += self.params[i] + '\r\n'
            }

            for (i = 1; i < 6; i ++) {
                csv += '第' + i + '组\r\n'
                for (var j = 0; j < 12; j++) {
                    csv += self.yActual[i][j] + ',' + self.yCalcu[i][j] + '\r\n'
                }
            }

            var res = encodeURIComponent(csv)
            var a      = document.createElement('a')
            a.href     = 'data:attachment/csv;charset=utf-8,\uFEFF' + res
            a.download = 'KMatrix.csv'

            document.body.appendChild(a);
            a.click();
            a.parentNode.removeChild(a)
        },

        downloadTemplate: function() {

        }
    },

    components: {
        LMHeader,
        LMTabs,
        LMFooter,
        LMFactorsTable,
        LMAETable,
        LMConsole,
        LMKTable
    }
}

function generatorKMatrix(lumps, activeReaction) {
    let len = lumps.length
    let kMatrix = []

    for (let i = 0; i < len; i++) {
        kMatrix[i] = {}
        kMatrix[i].lump = lumps[i]
        kMatrix[i].ks = []
        for (let j = 0; j < len; j++) {
            kMatrix[i].ks[j] = {
                value: '',
                isDisabled: !activeReaction[i][j]
            }
        }
    }

    return kMatrix
}
</script>

<style>
* {
    box-sizing: border-box;
}

html, body {
    height: 100%;
}

html {
    font-family: "Segoe UI", "Microsoft YaHei";
    min-width: 1000px;
    min-height: 600px;
}

body {
    font-size: 14px;
    color: #ffebc8;
    background-color: #161819;
}

body, ul {
    padding: 0;
    margin: 0;
}

button, input {
    font-family: inherit;
    border: 0;
    border-radius: 3px;
}

input {
    padding: 0 5px;
    color: #000000;
    background-color: #6e6c49;
    line-height: 24px;
    height: 24px;
    width: 60px;
}
input:focus {
    background-color: #eb8b19;
}
input:disabled {
    background-color: #3e3e3e;
}
input:read-only {
    background-color: #e0ad70;
}

button {
    color: #fff;
    height: 24px;
    text-align: center;
    background-color: #0f898a;
    padding: 0 10px;
}
button:hover {
    background-color: #00acad;
}
button:focus {
    background-color: #046d6e;
    outline: none;
}
button:disabled {
    color: #929292;
    background-color: #636363;
}

table {
    vertical-align: top;
    display: inline-block;
    margin: 10px 20px;
    padding: 10px;
    background-color: #132222;
    box-shadow: 5px 5px 5px #000;
    border-radius: 5px;
}
caption {
    background-color: #1a4444;
    color: #fff;
    padding: 5px;
    margin: -10px -10px 10px;
}
table th {
    text-align: center;
}
table td {
    padding: 0 5px;
}

.main {
    overflow: auto;
    height: 100%;
    padding: 60px 0 30px;
}

.lm-content-wrap {
    vertical-align: top;
    display: inline-block;
    margin: 10px 20px;
    padding: 10px;
    background-color: #132222;
    box-shadow: 5px 5px 5px #000;
    border-radius: 5px;
}
.lm-content-wrap > h2 {
    background-color: #1a4444;
    color: #fff;
    padding: 5px;
    margin: -10px -10px 10px;
    text-align: center;
    font-size: 14px;
    font-weight: 400;
}
</style>
