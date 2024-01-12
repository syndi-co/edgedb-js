import { $, type Client } from "edgedb";
import { type CommandOptions } from "./commandutil";
import { type Target } from "./genutil";
export declare function generateQueryFiles(params: {
    root: string | null;
    options: CommandOptions;
    client: Client;
    schemaDir: string;
}): Promise<void>;
export declare function stringifyImports(imports: {
    [k: string]: boolean;
}): string;
type QueryType = Awaited<ReturnType<(typeof $)["analyzeQuery"]>>;
export declare function generateFiles(params: {
    target: Target;
    path: string;
    types: QueryType;
}): {
    path: string;
    contents: string;
    imports: {
        [k: string]: boolean;
    };
    extension: string;
}[];
export {};
