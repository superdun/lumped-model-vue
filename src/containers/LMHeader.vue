<template>
    <header>
        <img src="../assets/ecust.png" alt="ecust_logo">
        <h1>{{ title }}</h1>
        <l-m-tabs :tabs="tabs"></l-m-tabs>
    </header>
</template>

<script>
import LMTabs from '../components/LMTabs.vue'

export default {
    data() {
        return {
            title: '重油催化裂化十二集总数学模型'
        }
    },

    props: {
        tabs: {
            type: Array,
            required: true
        }
    },

    components: {
        LMTabs
    }
}
</script>

<style scoped>
header {
    position: absolute;
    width: 100%;
    height: 50px;
    line-height: 50px;
    background-color: #212528;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.7);
}

header img {
    float: left;
    width: 40px;
    height: 40px;
    margin: 5px;
}

header h1 {
    float: left;
    display: inline-block;
    margin: 0 10px;
    font-weight: 400;
    font-size: 24px;
}

header nav {
    float: right;
    line-height: 50px;
}
</style>
