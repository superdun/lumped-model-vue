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
import {
    ObjectiveFunction,
    LumpedEquations
} from './MathModel.js'

console.log(new ObjectiveFunction(), new LumpedEquations())

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
