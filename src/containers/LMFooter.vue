<template>
    <footer>
        <p>华东理工化工学院<span>注:请使用非IE浏览器(Chrome最佳)</span></p>
    </footer>
</template>

<style scoped>
footer {
    z-index: 100;
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 30px;
    background-color: #161819;
    box-shadow: 2px -5px 5px rgba(0, 0, 0, 0.7);
}
footer > p {
    line-height: 30px;
    text-align: center;
    margin: 0;
}
footer > p > span {
    float: right;
    font-size: 12px;
}
</style>
