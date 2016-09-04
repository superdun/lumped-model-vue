<template>
    <header>
        <img src="../assets/ecust.png" alt="ecust_logo">
        <h1>{{ title }}</h1>
        <nav-tabs :tabs="tabs"></nav-tabs>
    </header>
</template>

<script>
import NavTabs from '../components/NavTabs.vue'

export default {
    components: {
        NavTabs
    },
    
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
    }
}
</script>

<style scoped>
header {
    z-index: 100;
    position: fixed;
    top: 0;
    min-width: 1000px;
    width: 100%;
    height: 50px;
    line-height: 50px;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.7);
    background-color: #161819;
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
    line-height: 48px;
}
</style>
