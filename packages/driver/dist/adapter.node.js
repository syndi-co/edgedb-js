"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.srcDir = exports.exit = exports.homeDir = exports.input = exports.exists = exports.walk = exports.hashSHA1toHex = exports.readDir = exports.watch = exports.hasFSReadPermission = exports.readFileUtf8 = exports.process = exports.tls = exports.fs = exports.net = exports.path = void 0;
const crypto = __importStar(require("crypto"));
const fs_1 = require("fs");
Object.defineProperty(exports, "fs", { enumerable: true, get: function () { return fs_1.promises; } });
const net = __importStar(require("net"));
exports.net = net;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
exports.path = path;
const tls = __importStar(require("tls"));
exports.tls = tls;
const process_1 = __importDefault(require("process"));
exports.process = process_1.default;
const readline = __importStar(require("readline"));
const stream_1 = require("stream");
async function readFileUtf8(...pathParts) {
    return await fs_1.promises.readFile(path.join(...pathParts), { encoding: "utf8" });
}
exports.readFileUtf8 = readFileUtf8;
function hasFSReadPermission() {
    return true;
}
exports.hasFSReadPermission = hasFSReadPermission;
function watch(dir) {
    return fs_1.promises.watch(dir, { recursive: true });
}
exports.watch = watch;
async function readDir(pathString) {
    return fs_1.promises.readdir(pathString);
}
exports.readDir = readDir;
function hashSHA1toHex(msg) {
    return crypto.createHash("sha1").update(msg).digest("hex");
}
exports.hashSHA1toHex = hashSHA1toHex;
async function walk(dir, params) {
    const { match, skip = [] } = params || {};
    try {
        await fs_1.promises.access(dir);
    }
    catch (err) {
        return [];
    }
    const dirents = await fs_1.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const fspath = path.resolve(dir, dirent.name);
        if (skip) {
            if (skip.some((re) => re.test(fspath))) {
                return [];
            }
        }
        if (dirent.isDirectory()) {
            return walk(fspath, params);
        }
        if (match) {
            if (!match.some((re) => re.test(fspath))) {
                return [];
            }
        }
        return [fspath];
    }));
    return Array.prototype.concat(...files);
}
exports.walk = walk;
async function exists(filepath) {
    try {
        await fs_1.promises.access(filepath);
        return true;
    }
    catch {
        return false;
    }
}
exports.exists = exists;
function input(message, params) {
    let silent = false;
    const output = !!params?.silent
        ? new stream_1.Writable({
            write(chunk, encoding, callback) {
                if (!silent)
                    process_1.default.stdout.write(chunk, encoding);
                callback();
            },
        })
        : process_1.default.stdout;
    const rl = readline.createInterface({
        input: process_1.default.stdin,
        output,
    });
    return new Promise((resolve, rej) => {
        rl.question(message, (val) => {
            rl.close();
            resolve(val);
        });
        silent = true;
    });
}
exports.input = input;
exports.homeDir = os.homedir;
function exit(code) {
    process_1.default.exit(code);
}
exports.exit = exit;
function srcDir() {
    return __dirname;
}
exports.srcDir = srcDir;
