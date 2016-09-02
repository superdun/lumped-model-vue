<template>
    <nav>
        <ul>
            <li v-for="tab in tabs"
                @click="changeTab(tab)"
                :class="{active:tab.isActive}">
                {{ tab.name }}
            </li>
        </ul>
    </nav>
</template>

<script>
export default {
    methods: {
        changeTab: function(tab) {
            this.tabs.forEach(function(tab) {
                tab.isActive = false
            })
            tab.isActive = true
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
ul {

}
ul > li {
    display: inline-block;
    text-align: center;
    width: 100px;
    cursor: pointer;
}
ul > li.active {
    background-color: #046d6e;
}
</style>
