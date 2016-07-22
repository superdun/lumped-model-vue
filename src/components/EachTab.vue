<template>
    <div class="each-tab-wrap" @mouseover="changeTooltipState" @mouseout="changeTooltipState">
        <label>{{ label }}</label>
        <div v-show="isShowTooltip" class="each-tab-content">
            <span>提示：</span>{{ content }}
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            isShowTooltip: false
        }
    },

    props: [
        'label',
        'content'
    ],

    methods: {
        changeTooltipState() {
            this.isShowTooltip = !this.isShowTooltip
        }
    }
}
</script>

<style scoped>
.each-tab-wrap {
    display: inline-block;
    transition: 1s;
    background-color: #0d7b7b;
    width: 100px;
    height: 30px;
    text-align: center;
    position: relative;
}

.each-tab-wrap:hover {
    width: 200px;
}

.each-tab-content {
    padding: 10px;
    background-color: #232628;
    width: 200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
    animation: emerge 1s;
}

@keyframes emerge
{
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

label {
    line-height: 30px;
    cursor: pointer;
    display: block;
    height: 30px;
}
</style>
