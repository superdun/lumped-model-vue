<template>
    <table>
        <caption>{{ caption }}</caption>
        <thead>
            <tr>
                <th></th>
                <th v-for="header in headers">{{ header }}</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="kRow in kMatrix">
                <td>{{ kRow.lump }}</td>
                <td v-for="k in kRow.ks">
                    <input v-model="k.value" v-bind:disabled="k.isDisabled" number>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
export default {
    data() {
        return {

        }
    },

    props: {
        caption: {
            type: String,
            required: true
        },

        headers: {
            type: Array
        },

        kMatrix: {
            type: Array,
            required: true
        }
    }
}
</script>
