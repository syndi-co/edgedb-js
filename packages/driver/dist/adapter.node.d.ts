/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { promises as fs } from "fs";
import * as net from "net";
import * as os from "os";
import * as path from "path";
import * as tls from "tls";
import process from "process";
export { path, net, fs, tls, process };
export declare function readFileUtf8(...pathParts: string[]): Promise<string>;
export declare function hasFSReadPermission(): boolean;
export declare function watch(dir: string): AsyncIterable<fs.FileChangeInfo<string>>;
export declare function readDir(pathString: string): Promise<string[]>;
export declare function hashSHA1toHex(msg: string): string;
export declare function walk(dir: string, params?: {
    match?: RegExp[];
    skip?: RegExp[];
}): Promise<string[]>;
export declare function exists(filepath: string): Promise<boolean>;
export declare function input(message: string, params?: {
    silent?: boolean;
}): Promise<string>;
export declare const homeDir: typeof os.homedir;
export declare function exit(code?: number): void;
export declare function srcDir(): string;
