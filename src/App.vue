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

            k: []
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


            var yStart = [48.1, 47.2, 4.7, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            var yActual = [7.6*0.475, 7.6*0.485, 7.6*0.04, 14.20, 15.38, 14.38, 14.32, 2.23, 9.64, 10.59, 4.15, 7.51]
            var operatingParams = {
                temperature: 807.15,
                pressure: 260000,
                residenceTime: 4,
                NPercent: 0.0004,
                catalystOilRatio: 9.2
            }

            // var yStart = bindValue(self.feedFactors.factors, true).concat([0,0,0,0,0,0,0,0,0])
            // var operatingParams = bindValue(self.operationalFactors.factors, false)
            // var yActual = bindValue(self.actualProducts.factors, true)

            // this.initGuessFittingParams = bindKMatrix(self.kTable.kMatrix)
            self.initGuessFittingParams = [0.831,0.171,0.885,5.16e-02,2.90e-02,3.20e-02,9.41e-03,1.60e-02,2.27e-02,1.0488,0.168,0.151,0.219,2.21e-02,9.73e-02,4.79e-02,4.37e-02,4.33e-02,0.193,0.245,1.149,0.123,5.66e-02,0.162,0.108,0.39,6.46e-02,6.21e-02,5.71e-02,0.272,7.65e-03,5.16e-03,8.10e-03,2.98e-02,6.20e-02,0.176,6.45e-02,5.47e-03,9.82e-03,4.04e-02,1.06e-05,5.47e-04,0.454,0.401,1.49e-02,2.97e-02,2.46e-02,1.25e-13,8.78e-03,9.01e-02,1.57e-02,8.63e-02,1.36e-06,5.51e-02,2.725,0.943,1.291,7.296,8.877,8.95,7.787,13.068,9.576,4.796,4.045,14.1,13.574,4.748,3.42,3.792,0.709,3.387,10.108,14.348,15.824,16.016,4.001,1.921,1.352,0.954,3.914,14.446,13.083,12.24,16.307,3.716,3.469,8.251,10.288,14.641,15.717,18.289,13.124,12.893,15.4,19.805,12.657,8.966,14.655,12.108,12.195,13.523,11.37,10.251,11.935,10.422,14.017,9.364,1,1,1]

            var lm = new LumpedModel(yStart, yActual, operatingParams, { isFittingK: false })

            var bfgs = new BFGS((x) => lm.objectiveFn(x), self.initGuessFittingParams)

            var iterator = 0
            var MAX_ITERATOR = 50
            var i

            try {
                for (i = 0; i < MAX_ITERATOR; i++) {
                    bfgs.step()
                }
            } catch(err) {
                console.log(i + ':' +err)
            }

            self.k = lm.k

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

            // var csvString = jsonToCsv(self.operationalFactors, self.feedFactors, self.actualProducts)

            // var csv1 = Papa.unparse({
            //     fields: ['name', 'value'],
            //     data: self.operationalFactors.factors
            // })

            // var csv2 = Papa.unparse({
            //     fields: ['name', 'value'],
            //     data: self.feedFactors.factors
            // })

            // var csv3 = Papa.unparse({
            //     fields: ['name', 'value'],
            //     data: self.actualProducts.factors
            // })
            console.log(self.k)
            var csv = '807.15k\r\n'
            for (var i = 0, len = self.k.length; i < len; i++) {
                csv += self.k[i] + '\r\n'
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
