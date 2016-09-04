<template>
	<div class="init-conditions">
		<div class="feed-operation-group">
			<h4 @click="hidden()">
				拟合组数：第 {{ index + 1 }} 组
				<span class="circle"></span>
			</h4>
			<l-m-factors-table
				v-show="isShow"
			    :caption="feedCaption"
			    :factors="initCondition.feed">
			</l-m-factors-table>
			<l-m-factors-table
				v-show="isShow"
			    :caption="operationalCaption"
			    :factors="initCondition.operational">
			</l-m-factors-table>
		</div>
		<l-m-factors-table
			v-show="isShow"
		    :caption="actualCaption"
		    :factors="initCondition.product">
		</l-m-factors-table>
	</div>
</template>

<script>
import LMFactorsTable from '../components/LMFactorsTable'

export default {
	components: {
		LMFactorsTable
	},

	data() {
		return {
			isShow: true,
			operationalCaption: '操作条件',
			feedCaption: '进料组成',
			actualCaption: '实际产物'
		}
	},

	methods: {
		hidden: function() {
			this.isShow = !this.isShow
		}
	},

	props: {
		initCondition: {
            type: Object,
            required: true
        },

        index: {
        	type: Number
        }
	}
}
</script>

<style scoped>
.init-conditions {
	vertical-align: top;
	position: relative;
	margin: 10px 20px;
}

div {
	display: inline-block;
}

h4 {
	position: relative;
	line-height: 30px;
	font-weight: 400;
	background-color: #008282;
	padding: 0 10px;
    border-radius: 5px;
    box-shadow: 2px 2px 5px #000;
    cursor: pointer;
}

.feed-operation-group {
	width: 200px;
}

.circle {
	width: 20px;
	height: 20px;
	display: inline-block;
    border-radius: 100%;
    border: 3px solid #1a4444;
    background-color: #00b9b9;
    position: absolute;
    top: 5px;
    right: 5px;
}
</style>