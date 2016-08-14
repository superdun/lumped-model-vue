<template>
    <div class="lm-content-wrap">
        <h2>{{ caption }}</h2>
        <textarea cols="60" rows="10" readonly>{{ data || '' }}</textarea>
        <!-- <button @click="test">测试</button> -->
    </div>
</template>

<script>
export default {
    methods: {
        test: function() {
            console.log(this)
        }
    },

    watch: {
        data: function(newValue, oldValue) {
            var cons = this.$el.getElementsByTagName('textarea')[0]
            cons.scrollTop = cons.scrollHeight - cons.offsetHeight
        }
    },

    props: {
        caption: {
            type: String,
            required: true
        },

        data: {
            type: String
        }
    }
}
</script>

<style scoped>
textarea {
    color: #ffebc8;
    font-family: inherit;
    font-size: 14px;
    background-color: rgba(0,0,0,0.8);
    border: 0;
}
</style>
