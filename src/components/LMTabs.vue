<template>
    <div class="l-m-tabs">
        <each-tab v-for="tab in tabs" 
                  :label="tab.label" 
                  :content="tab.content" 
                  :is-active="tab.isActive">
        </each-tab>
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

    props: {
        tabs: {
            type: Array,
            required: true
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
