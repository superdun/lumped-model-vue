<template>
    <header>
        <img src="../assets/ecust.png" alt="ecust_logo">
        <h1>{{ title }}</h1>
    </header>
</template>

<script>
export default {
    data() {
        return {
            title: '重油催化裂化十二集总数学模型'
        }
    }
}
</script>

<style scoped>
header {
    padding: 10px 20px;
    margin: 0;
    background-color: #212528;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
    border-radius: 5px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

header img {
    width: 60px;
    height: 60px;
}

header h1 {
    margin: 0 10px;
    text-shadow: 1px 1px 1px;
    font-weight: 600;
}
</style>
