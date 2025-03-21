// types.ts
export interface OptionType {
	value: string;
	label: string;
	type: 'country' | 'city' | 'island';
	flagClass?: string;
	isPopular: boolean;
}
