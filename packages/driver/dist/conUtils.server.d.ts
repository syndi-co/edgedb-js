import { readFileUtf8 } from "./adapter.node";
import * as platform from "./platform";
declare function findProjectDir(required?: boolean): Promise<string | null>;
export declare function findStashPath(projectDir: string): Promise<string>;
export declare const serverUtils: {
    findProjectDir: typeof findProjectDir;
    findStashPath: typeof findStashPath;
    readFileUtf8: typeof readFileUtf8;
    searchConfigDir: typeof platform.searchConfigDir;
};
export declare const parseConnectArguments: import("./conUtils").ConnectArgumentsParser;
export {};
