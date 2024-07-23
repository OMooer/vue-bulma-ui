import { onBeforeUnmount, useAttrs } from 'vue';

export const useBack = ($emit: any, $router: any) => {
	const attrs = useAttrs();
	let timer: number;

	onBeforeUnmount(() => {
		window.clearTimeout(timer);
	});

	function back() {
		// 如果存在自定义事件则只执行自定义事件
		if (attrs.onBack) {
			$emit('back');
			return;
		}

		if (!$router) {
			return;
		}

		if (window.history.length <= 1) {
			$router.push({name: 'home'});
			return false;
		}

		// 正常回退，如果回退是登录页的话将转为首页
		const stopBackGuard = $router?.beforeEach((to: any) => {
			stopBackGuard();
			if (to.name === 'login') {
				return {name: 'home'};
			}
		});
		$router.back();

		// 如果点击回退之后还停留在当页，代表 back() 失败，
		// 存在向前的页面但没有回退页面
		// 将跳到首页
		timer = window.setTimeout(() => {
			$router.push({name: 'home'});
		}, 500);
	}

	return back;
}