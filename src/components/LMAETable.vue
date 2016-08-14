<template>
    <table>
        <caption>{{ caption }}</caption>
        <thead>
            <tr>
                <th v-for="header in headers">{{ header }}</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="kRow in kRows">
                <td>{{ kRow.name }}</td>
                <td><input v-model="kRow.A" number></td>
                <td><input v-model="kRow.E" number></td>
            </tr>
        </tbody>
    </table>
</template>

<script>
export default {
    props: {
        caption: {
            type: String,
            required: true
        },

        headers: {
            type: Array
        },

        kRows: {
            type: Array,
            required: true
        }
    }
}
</script>
