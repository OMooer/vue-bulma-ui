import { useAttrs } from 'vue';
import { ERROR_NEED_ROUTER } from '@/utils';

export const useBack = (
		$emit: any,
		$router: any,
		{home, login}: { home: string; login: string } = {home: 'home', login: 'login'}
) => {
	const attrs = useAttrs();

	function back() {
		// 如果存在自定义事件则只执行自定义事件
		if (attrs.onBack) {
			$emit('back');
			return;
		}

		if (!$router) {
			console.warn(ERROR_NEED_ROUTER);
			return;
		}

		// 如果当前只有一条访问历史记录，则回退到首页
		if (window.history.length <= 1) {
			$router.push({name: home});
			return;
		}

		// 如果当前 history.state.back 不存在
		// 则表示上一页并非同一网站或没有上一页
		// 直接回退首页
		if (!window.history.state?.back) {
			$router.push({name: home});
			return;
		}

		// 正常回退，如果回退是登录页的话将转为首页
		const stopBackGuard = $router?.beforeEach((to: any) => {
			stopBackGuard();
			if (to.name === login) {
				return {name: home};
			}
		});
		$router.back();
	}

	return back;
}