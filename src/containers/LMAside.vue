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
				<button @click="add">+</button>
				<input type="text" v-model="setting.fittingNumber" number>
				<button @click="sub">-</button>
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
			console.log(this.setting)
		},

		add: function() {
			this.setting.fittingNumber++
		},

		sub: function() {
			var num = this.setting.fittingNumber - 1
			this.setting.fittingNumber = (num < 1) ? 1 : num
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
	font-weight: 400;
	background-color: #008282;
	padding: 5px 10px;
	text-align: center;
}
aside {
	transition: 0.5s;
	width: 250px;
	position: relative;
	margin: 10px 0;
	display: inline-block;
	background-color: #232628;
	line-height: 24px;
	box-shadow: 2px 2px 5px #000;
}
aside.hidden {
	transform: translateX(-250px);
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
	right: -10px;
	top: 0;
	width: 10px;
	height: 100%;
	background-color: #333739;
	border-radius: 0 2px 2px 0;
	box-shadow: 2px 2px 5px #000;
}
.switch > .arrow {
	transition: 0.5s;
	position: absolute;
    top: 50%;
    left: 50%;
    margin-left: -3px;
    margin-top: -10px;
}
aside.hidden .arrow {
	transform: rotate(180deg);
}
</style>