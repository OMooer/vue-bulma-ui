declare namespace Tracker {
	interface MoveEventData {
		dir: string;
		detail: {
			multiple: boolean;
			offset: number;
		}
	}
}