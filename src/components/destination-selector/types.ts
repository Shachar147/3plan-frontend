// types.ts
export interface OptionType {
    value: string;
    label: string;
    type: 'country' | 'city';
    flagClass?: string;
    isPopular: boolean;
}
