<template>
    <l-m-header></l-m-header>
    <l-m-tabs :tabs="tabs"></l-m-tabs>
    <main>
        <section v-if=""></section>
    </main>
    <l-m-footer></l-m-footer>
</template>

<script>
import LMHeader from './components/LMHeader'
import LMTabs from './components/LMTabs'
import LMFooter from './components/LMFooter'

export default {
    data() {
        return {
            tabs: [
                { label: '反算', content: '计算反应速率常数的过程', isActive: true },
                { label: '正算', content: '', isActive: false }
            ]

        }
    },

    components: {
        LMHeader,
        LMTabs,
        LMFooter
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
</style>
