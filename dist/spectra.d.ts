export interface ISpectraList extends Array<ISpectraList | string | number | null> {
}
export declare function encodeString(str: string): string;
export declare function encodeValue(value: ISpectraList | string | number): string;
export declare function encodeObject(object: ISpectraList): string;
export declare function parseObject(spectra: string): string | number | ISpectraList;
