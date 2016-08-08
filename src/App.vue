<template>
    <l-m-header></l-m-header>
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
    <l-m-footer></l-m-footer>
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
    yStart: [47.5, 48.5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    yActual: [8.12*0.475,8.12*0.485,8.12*0.04,14.20,15.38,14.38,14.32,2.23,9.64,10.59,4.15,7.51],
    temperature: 807.15,
    pressure: 260000,
    residenceTime: 4,
    NPercent: 0.0004,
    catalystOilRatio: 9.2
}

var initGuessFittingParams = [0.3293, 0.1928, 1.12415, 0.29184169206256166, 0.0027176874766067375, 0.01203, 0.01605, 0.0017930599741422923, 0.038461356465386724, 0.30332764051951755, 0.43637009804244425, 0.0869, 0.1563, 0.028422782399684533, 0.14525393236161274, 0.11878956265691668, 0.01243425568518713, 0.07887331844908084, 0.043359933423299156, 0.024311275381667975, 0.09879199242472272, 0.012429779846847202, 0.10805961500921173, 0.14034567852715735, 0.3448757517741616, 0.027657834889334206, 0.18710460019945954, 0.0013735390334152556, 0.008151275890402938, 0.00138, 0.0016364619824738148, 0.04314420939408477, 0.04872193001768704, 0.017774102683089113, 0.04438494312376635, 0.001869684765189137, 0.03056, 0.01464, 0.02838724801231277, 0.08486038412189359, 0.05747, 0.001366259132058684, 0.07496965730557091, 0.28746422344445877, 0.043523831209924715, 0.09224591313917908, 0.025841175178138887, 0.0833559169682508, 0.02286127761809558, 0.0009584574781633051, 0.03307337261956955, 0.09715862897222971, 0.00021886023176958248, 0.13618776029377566, 0.4125, 2.7058, 0.0002136]

var option = {
    isFittingK: true
}

var lm = new LumpedModel(operatingParams, option)

var objectiveFn = function(x) {
    return lm.objectiveFn(x)
}

var bfgs = new BFGS(objectiveFn, initGuessFittingParams)

console.log(bfgs.step())

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
