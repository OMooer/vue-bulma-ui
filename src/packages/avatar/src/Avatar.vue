<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
	src : {
		type    : String,
		required: true
	},
	name: {
		type   : String,
		default: 'Avatar'
	},
	size: {
		type     : String,
		validator: (value: string) => {
			return ['sm', 'xl', '2xl'].includes(value);
		}
	}
});
const normal = ref('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=');
const loadedFailed = ref(false);
const url = computed(() => {
	return loadedFailed.value ? normal.value : (props.src || normal.value);
})

function noImage() {
	loadedFailed.value = true;
}
</script>

<template>
	<img
			class="avatar"
			:class="{'sm':size==='sm','xl':size==='xl','xxl':size==='2xl'}"
			:alt="name" :src="url"
			@error="noImage">
</template>

<style scoped lang="scss">
.avatar {
	display: block;
	background-color: $grey;
	border-radius: 50%;
	font-size: .75rem;
	width: 2em;
	height: 2em;

	&.sm {
		font-size: 0.5rem;
	}

	&.xl {
		font-size: 1.25rem;
	}

	&.xxl {
		font-size: 2rem;
	}
}
</style>