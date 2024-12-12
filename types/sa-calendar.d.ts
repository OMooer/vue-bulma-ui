declare module 'sa-calendar' {
	class Calendar {
		constructor(opt: any);

		$el: HTMLElement[];
		$parent: HTMLElement[];

		dismiss(): void;
	}

	export default Calendar;
}
