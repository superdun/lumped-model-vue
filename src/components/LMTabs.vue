<template>
    <div class="l-m-tabs">
        <each-tab label="正算" content="这是正算这是正算这是正算"></each-tab>
        <each-tab label="正算" content="这是正算这是正算这是正算"></each-tab>
    </div>
</template>

<script>
import EachTab from './EachTab'

export default {
    data() {
        return {
            isShowTooltip: false
        }
    },

    components: {
        EachTab
    }
}
</script>

<style scoped>
.l-m-tabs {
    display: flex;
    justify-content: space-between;
    height: 30px;
    margin: 10px 0;
}
</style>
