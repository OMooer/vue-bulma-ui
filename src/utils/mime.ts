// @ts-ignore
import * as db from 'mime-db';

const globalMime = Object.entries<any>(db).filter(([_key, mime]: [_key: string, mime: any]) => mime.extensions?.length > 0);

export const ext2mime = (ext: string) => {
	if (!ext) {
		return '';
	}
	const mime = globalMime.filter((item: any) => item[1]?.extensions?.includes(ext));

	return mime.length ? mime.map(i => i[0]).join(',') : '';
}

export const mime2ext = (type: string): string[] => {
	if (!type) {
		return [];
	}
	const mime = globalMime.find((item: any) => item[0] === type);
	return mime ? mime[1]?.extensions as string[] : [];
}

export default globalMime;