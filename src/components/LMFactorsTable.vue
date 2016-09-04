<template>
    <table>
        <caption>{{ caption }}</caption>
        <tr v-for="factor in factors">
            <td>{{ factor.name }}</td>
            <td><input type="text" v-model="factor.value" number></td>
        </tr>
    </table>
</template>

<script>
export default {
    props: {
        caption: {
            type: String,
            required: true
        },

        factors: {
            type: Array,
            required: true
        },
    }
}
</script>

<style scoped>
table {
    display: inline-block;
    padding: 10px;
    background-color: #132222;
    box-shadow: 5px 5px 5px #000;
    border-radius: 5px;
}
caption {
    background-color: #1a4444;
    color: #fff;
    padding: 5px;
    margin: -10px -10px 10px;
    border-radius: 5px 5px 0 0;
}
table th {
    text-align: center;
}
table td {
    padding: 0 5px;
}
</style>