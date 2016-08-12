<template>
<!--     <l-m-header></l-m-header>
    <l-m-tabs :tabs="tabs"></l-m-tabs>
    <main>
        <section v-if="tabs[0].isActive">
            <l-m-factors-table
                :caption="operationalFactors.caption"
                :factors="operationalFactors.factors">
            </l-m-factors-table>
            <l-m-factors-table
                :caption="feedFactors.caption"
                :factors="feedFactors.factors">
            </l-m-factors-table>
            <l-m-k-table
                :caption="kTable.caption"
                :headers="kTable.headers"
                :k-rows="kTable.kRows">
            </l-m-k-table>
        </section>
        <section v-if="tabs[1].isActive">

        </section>
    </main>
    <l-m-footer></l-m-footer> -->
    <div></div>
</template>

<script>
import LMHeader from './components/LMHeader'
import LMTabs from './components/LMTabs'
import LMFooter from './components/LMFooter'
import LMFactorsTable from './components/LMFactorsTable'
import LMKTable from './components/LMKTable'
import { LumpedModel } from './LumpedModel.js'
import BFGS from 'bfgs-algorithm'

var operatingParams = {
    yStart: [48.1, 47.2, 4.7, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    yActual: [7.6*0.475,7.6*0.485,7.6*0.04,14.20,15.38,14.38,14.32,2.23,9.64,10.59,4.15,7.51],
    temperature: 807.15,
    pressure: 260000,
    residenceTime: 4,
    NPercent: 0.0004,
    catalystOilRatio: 9.2
}

var initGuessFittingParams = [
    0.0015, 0.0001, 0.0012, 0.0004, 0.0001, 0.00002, 0.0002, 0.0001, 0.00001,
    0.00303, 0.00436, 0.00087, 0.00156, 0.00028, 0.00145, 0.00119, 0.00012, 0.00079,
    0.00043, 0.00024, 0.00099, 0.00012, 0.00108, 0.0014, 0.00345, 0.00028,
    0.00187, 0.00001, 0.00008, 0.00001, 0.00002, 0.00043, 0.00049,
    0.00018, 0.00044, 0.00002, 0.00031, 0.00015, 0.00028, 0.00085,
    0.000057, 0.000001, 0.000075, 0.000287, 0.000044, 0.000092, 0.000026, 0.000083, 0.000023,
    0.000001, 0.000033, 0.000097, 0.00001, 0.000136,
    0.0001, 0.0001, 0.0001
]

for (var i = 0, len = initGuessFittingParams.length; i < len; i++) {
    initGuessFittingParams[i] = Math.log(initGuessFittingParams[i])
}

var option = {
    isFittingK: true
}

var lm = new LumpedModel(operatingParams, option)

var objectiveFn = function(x) {
    return lm.objectiveFn(x)
}

var bfgs = new BFGS(objectiveFn, initGuessFittingParams)

try {
    for (var i = 0; i < 5; i++) {
        bfgs.step()
        console.log(bfgs.convergence)
        console.log(lm.params)
    }
} catch(err) {
    console.log(err)
}

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
                    { name: '操作温度(K)：', key: 'T', value: '' },
                    { name: '操作压力(Pa)：', key: 'P', value: '' },
                    { name: '剂油比：', key: 'catalystOilRatio', value: '' },
                    { name: '停留时间：', key: 'residenceTime', value: '' },
                    { name: '回炼比：', key: 'repoRatio', value: '' }
                ]
            },

            feedFactors: {
                caption: '进料组成',
                factors: [
                    { name: 'HS:', value: '' },
                    { name: 'HA:', value: '' },
                    { name: 'HR:', value: '' }
                ]
            },

            kTable: {
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
            }

        }
    },

    components: {
        LMHeader,
        LMTabs,
        LMFooter,
        LMFactorsTable,
        LMKTable
    }
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
</style>
