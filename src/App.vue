<template>
<div>
<!--     <l-m-header></l-m-header>
    <div class="main">
        <l-m-tabs :tabs="tabs"></l-m-tabs> -->
        <div>
            <input type="file" style="width: 300px">
            <button @click="importFile">导入</button>
            <button @click="exportFile">导出</button>
            <button @click="downloadTemplate">模板下载</button>
            <button @click="calculate" :disabled="isCalculating">计算</button>
            <button @click="stopCalculate" :disabled="!isCalculating">终止</button>
        </div>
<!--         <section v-if="tabs[0].isActive">
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
            </l-m-console> -->
            <!-- <l-m-a-e-table
                :caption="AETable.caption"
                :headers="AETable.headers"
                :k-rows="AETable.kRows">
            </l-m-a-e-table> -->
<!--             <l-m-k-table
                :caption="kTable.caption"
                :headers="kTable.headers"
                :k-matrix="kTable.kMatrix">
            </l-m-k-table>
        </section>

        <section v-if="tabs[1].isActive">

        </section>
    </div class="main">
    <l-m-footer></l-m-footer> -->
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

            self.initGuessFittingParams = [
                26.79560582,308.9539743,387.0627596,219.0088849,2221.854376,305.759621,2221.917771,2221.534648,10.15570716,
                10.115365752,960.5148573,814.9718567,400.8134957,9000.00788,8034.84596,8999.919257,8999.96938,18.370951,
                4.12415384,105.7165732,121.1212562,75.45728304,26.93275126,32.25212843,27.45262069,27.15780893,3.317602779,
                32400000,58800000,20000000,2400000,2580000,2400000,2400000,30.12748555,
                450658.9923,2.06E+12,329999.9989,19114.1758,329999.9997,330000.0081,17100000000,1330.955517,394.5998278,34000000,7350000,34000000,34000000,12400000,18000.00603,203000000,18000.00166,18000.00847,2120000000,
                20.586398565694623, 39.73374888348373, 40.157863678221304, 42.39088938660048, 70.06473772340762, 66.51029829383914, 56.69822688135666, 59.098657219517804, 26.866264610945063,
                16.425019043327264, 41.81540149488168, 46.19250009177392, 47.76096926092399, 82.28083877592063, 76.70377120839291, 79.09684199969037, 87.15011901063443, 33.82299223091391,
                18.16520290867562, 38.02115268163156, 37.43262273968059, 40.01259337439773, 34.95391065613341, 28.573720574564327, 28.273186878061516, 29.642492805649955, 9.219997038150703,
                121.44472198221058, 122.99066634196635, 127.81308903678558, 128.8707890496875, 129.92824522753747, 129.49075358359326, 132.0114679378595, 38.09561096298383,
                107.3879503967382, 250.1688100874581, 105.26419283190545, 67.80967641649626, 90.58110359610984, 113.53748716314338, 174.56316836484393,
                61.562807472008586, 43.75430393417363, 147.95327006326931, 126.52031166082853, 149.6575323749135, 152.0099933276576, 126.51036942373399,
                100.46887062858448, 148.83535626060683, 100.96576698756049, 102.19837048176268, 161.06844761261735
                ,5.00E-08,4.00E-08,2.00E-08
            ]

            var Worker = require('worker!./calculating.js')
            var worker = new Worker()
            worker.postMessage({
                initGuessFittingParams: self.initGuessFittingParams,
                params: [
                    { yStart: yStart1, yActual: yActual1, operatingParams: operatingParams1 },
                    { yStart: yStart2, yActual: yActual2, operatingParams: operatingParams2 },
                    { yStart: yStart3, yActual: yActual3, operatingParams: operatingParams3 },
                    { yStart: yStart4, yActual: yActual4, operatingParams: operatingParams4 },
                    { yStart: yStart5, yActual: yActual5, operatingParams: operatingParams5 }
                ],
                isCalculating: self.isCalculating
            })

            worker.onmessage = function(event) {
                let data = event.data

                switch(data.type) {
                    case 'calculating':
                        console.log(data.msg)
                        break
                    case 'err':
                        console.log(data.msg)
                        break
                    default:
                        break
                }
                // worker.terminate()
            }

            // console.log(bfgs)
            // console.log(lm1)
            // console.log(lm2)
            // console.log(lm3)
            // console.log(lm4)
            // console.log(lm5)

            // self.yCalcu[1] = lm1.getProduct()
            // self.yCalcu[2] = lm2.getProduct()
            // self.yCalcu[3] = lm3.getProduct()
            // self.yCalcu[4] = lm4.getProduct()
            // self.yCalcu[5] = lm5.getProduct()

            // self.yActual[1] = lm1.yActual
            // self.yActual[2] = lm2.yActual
            // self.yActual[3] = lm3.yActual
            // self.yActual[4] = lm4.yActual
            // self.yActual[5] = lm5.yActual

            // self.k['807.15'] = lm1.k
            // self.k['797.15'] = lm4.k
            // self.k['787.15'] = lm5.k

            // self.params = lm2.params

            // console.log(self.params.slice(54, 108))

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
