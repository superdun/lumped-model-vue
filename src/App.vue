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

import Worker from 'worker!./calculating.js'

let worker = undefined
const startWorker = () => {
    if (typeof(worker) == "undefined") {
        worker = new Worker()
    }
}

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

            self.initGuessFittingParams = [26.323862525264236,309.07986327678253,387.3858001957765,219.10812266051664,2221.8420253556446,305.7916042963662,2221.9302201654923,2221.511634108338,6.680620142280736,16.84038445995668,960.5934277048681,815.1900776409183,400.9014674371774,9000.006248610196,8034.857629936584,8999.926827398805,8999.972512066512,16.44045105754445,6.884606096050719,105.76018554607474,121.25373481808212,75.54872157468003,26.74307726542151,33.70821469501424,28.01838066773411,28.033634483552618,4.601198339639468,32400000,20000000,58800000,2400000,2580000,2400000,2400000,29.98154494139616,450658.9940020465,206000000000000,329999.99827521964,19114.184916359744,329999.99982040667,330000.0069967139,17100000000,1330.9066422485505,394.7841715927623,34000000,7350000,34000000,34000000,12400000,18000.005471944834,203000000,18000.001930308423,18000.00815951124,2120000000,22.011592432942514,40.200870515263055,42.04854967805913,42.62948223961419,73.8564955011389,64.97550123089397,53.912920644014875,61.47435949408731,22.244677010323738,22.772642917047122,43.920321903707915,45.2299487407915,47.9755653580085,81.69736571649996,64.84863366986825,74.66344840928791,78.76587991692624,31.2885616971238,19.724257415214193,38.3964574573971,37.856310324570025,39.23215034977291,35.970330309192114,22.231147296149317,26.109434948646125,25.117397899549847,20.265677015794687,130.17948173204334,125.15910798112697,133.36535616925403,121.25311565061048,130.7628479013195,130.8371595127693,133.65426477926476,166.58781317795334,98.5567749080043,236.93085301484274,101.99043170372113,77.63993229246157,103.23942850062545,103.28868969059269,164.91062371970085,69.89736785616901,42.39554779326961,146.85326935839825,119.80543015224019,149.38020307796293,152.80467524052713,133.76488935814777,100.64662360125942,150.5957771312729,101.26545666543156,102.88287227996994,170.6852549392779,5e-8,4e-8,2e-8]

            // 开启worker线程
            startWorker()
            // 开始计算
            worker.postMessage({
                type: 'start',
                guess: self.initGuessFittingParams,
                target: [
                    { yStart: yStart1, yActual: yActual1, operatingParams: operatingParams1 },
                    { yStart: yStart2, yActual: yActual2, operatingParams: operatingParams2 },
                    { yStart: yStart3, yActual: yActual3, operatingParams: operatingParams3 },
                    { yStart: yStart4, yActual: yActual4, operatingParams: operatingParams4 },
                    { yStart: yStart5, yActual: yActual5, operatingParams: operatingParams5 }
                ],
                termination: 2
            })

            const step = () => {
                setTimeout(() => {
                    if (self.isCalculating) {
                        step()
                    }

                    worker ? worker.postMessage({
                        type: 'step'
                    }) : null
                }, 100)
            }
            step()

            worker.onmessage = function(event) {
                let data = event.data
                self.lmConsole.data += data.msg

                switch(data.type) {
                    case 'start':
                        break
                    case 'done':
                        break
                    case 'end':
                        dealData(data.result)
                        break
                    default:
                        break
                }
            }

            function logData(data) {
                let str = '['
                for (let i = 0, len = data.length; i < len; i++) {
                    str += data[i] + ','
                }
                str += ']'

                return str
            }
        },

        stopCalculate: function() {
            this.isCalculating = false
            worker.terminate()
            worker = undefined
            this.lmConsole.data += ' ------ 计算终止 ------ \r\n'
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

            csv += '\r\nParams\r\n'
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
