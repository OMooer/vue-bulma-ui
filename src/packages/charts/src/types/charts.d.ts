type GaugeData = {
	min: number;
	max: number;
	value: number;
	color: string;
	unit: string;
};

export  type ChartData = {
	group?: string;
	data: { [propName: string]: any; } | GaugeData
}[];

export  type ChildProps = { data: any; colors?: string[]; dark?: boolean; }
