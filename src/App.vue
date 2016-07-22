<template>
    <l-m-header></l-m-header>
    <l-m-tabs></l-m-tabs>
</template>

<script>
import LMHeader from './components/LMHeader'
import LMTabs from './components/LMTabs'

export default {
    components: {
        LMHeader,
        LMTabs
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
