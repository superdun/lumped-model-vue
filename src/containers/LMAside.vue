<template>
	<aside :class="{hidden:isHiddenAside}">
		<h4>数学模型拟合配置</h4>
		<div class="setting-content">
			<div>
				<label class="control-label">一、拟合方式</label>
				<label><input type="radio" name="method" value="K" v-model="setting.fittingMethod" checked>反应常数</label>
				<label><input type="radio" name="method" value="A&E" v-model="setting.fittingMethod">活化能和指前因子</label>
			</div>

			<div>
				<label class="control-label">二、拟合组数</label>
				<button @click="setting.add()">+</button>
				<input type="text" v-model="setting.fittingNumber" number>
				<button @click="setting.sub()">-</button>
			</div>
		</div>
		<span class="switch" @click="changeAsideStatus()">
			<span class="arrow"></span>
		</span>
	</aside>
</template>

<script>
export default {
	data() {
		return {
			isHiddenAside: false
		}
	},

	methods: {
		changeAsideStatus: function() {
			this.isHiddenAside = !this.isHiddenAside
		}
	},

	props: {
	    setting: {
	        type: Object,
	        required: true
	    }
	}
}
</script>

<style scoped>
h4 {
	margin: 0;
	padding: 5px 10px;
	background-color: #008282;
	text-align: center;
	font-weight: 400;
}
aside {
	z-index: 10;
	transition: 0.5s;
	display: inline-block;
	
	position: fixed;
	left: 50%;
	margin-left: -125px;
	
	width: 250px;
	line-height: 24px;
	
	background-color: #232628;
	box-shadow: 2px 2px 5px #000;
}
aside.hidden {
	transform: translateY(-100%);
}
.setting-content {
	margin: 0 10px 10px;
	text-align: center;
}
.control-label {
	display: block;
	line-height: 30px;
	text-align: center;
}
input {
	text-align: center;
}
.switch {
	cursor: pointer;
	display: inline-block;
	position: absolute;
	width: 100%;
	height: 10px;
	background-color: #333739;
	border-radius: 0 0 2px 2px;
	box-shadow: 2px 2px 5px #000;
}
.switch > .arrow {
	transform: rotate(90deg);
	transition: 0.5s;
	position: absolute;
    top: 50%;
    left: 50%;
    margin-left: -3px;
    margin-top: -10px;
}
aside.hidden .arrow {
	transform: rotate(270deg);
}
</style>