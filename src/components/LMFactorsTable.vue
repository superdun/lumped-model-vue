<template>
    <table>
        <caption>{{ caption }}</caption>
        <tr v-for="factor in factors">
            <td>{{ factor.name }}</td>
            <td><input v-model="factor.value" number></td>
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