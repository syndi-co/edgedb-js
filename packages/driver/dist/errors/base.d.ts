export declare class EdgeDBError extends Error {
    source?: Error;
    protected static tags: object;
    private _message;
    private _query?;
    private _attrs?;
    constructor(message?: string, options?: {
        cause?: unknown;
    });
    get message(): string;
    get name(): string;
    hasTag(tag: symbol): boolean;
}
export type ErrorType = new (msg: string) => EdgeDBError;
export declare function prettyPrintError(attrs: Map<number, Uint8Array>, query: string): string;
