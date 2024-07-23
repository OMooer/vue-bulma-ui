<script setup lang="ts">
import { computed } from "vue";

const emit = defineEmits(["update:formData", "submit"]);

const classList = computed(() => {
	return {
		"vb-form": true,
	};
});

//表单提交
function submit(e: any) {
	emit("submit", e);
}
</script>

<template>
	<form action="" @submit.prevent="submit" :class="classList">
		<!-- 默认插槽 -->
		<slot/>
		<slot name="formFooter">
			<div class="field is-grouped">
				<slot name="buttons">
					<div class="control">
						<button type="submit" class="button is-success">Submit</button>
					</div>
				</slot>
			</div>
		</slot>
	</form>
</template>

<style scoped lang="scss">
.vb-form {
}
</style>
