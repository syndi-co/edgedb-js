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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseConnectArguments = exports.serverUtils = exports.findStashPath = void 0;
const adapter_node_1 = require("./adapter.node");
const platform = __importStar(require("./platform"));
const conUtils_1 = require("./conUtils");
const projectDirCache = new Map();
async function findProjectDir(required = true) {
    if (!required && !(0, adapter_node_1.hasFSReadPermission)()) {
        return null;
    }
    const workingDir = process.cwd();
    if (projectDirCache.has(workingDir)) {
        return projectDirCache.get(workingDir);
    }
    let dir = workingDir;
    const cwdDev = (await adapter_node_1.fs.stat(dir)).dev;
    while (true) {
        if (await (0, adapter_node_1.exists)(adapter_node_1.path.join(dir, "edgedb.toml"))) {
            projectDirCache.set(workingDir, dir);
            return dir;
        }
        const parentDir = adapter_node_1.path.join(dir, "..");
        if (parentDir === dir || (await adapter_node_1.fs.stat(parentDir)).dev !== cwdDev) {
            projectDirCache.set(workingDir, null);
            return null;
        }
        dir = parentDir;
    }
}
async function findStashPath(projectDir) {
    let projectPath = await adapter_node_1.fs.realpath(projectDir);
    if (platform.isWindows && !projectPath.startsWith("\\\\")) {
        projectPath = "\\\\?\\" + projectPath;
    }
    const hash = (0, adapter_node_1.hashSHA1toHex)(projectPath);
    const baseName = adapter_node_1.path.basename(projectPath);
    const dirName = baseName + "-" + hash;
    return platform.searchConfigDir("projects", dirName);
}
exports.findStashPath = findStashPath;
exports.serverUtils = {
    findProjectDir,
    findStashPath,
    readFileUtf8: adapter_node_1.readFileUtf8,
    searchConfigDir: platform.searchConfigDir,
};
exports.parseConnectArguments = (0, conUtils_1.getConnectArgumentsParser)(exports.serverUtils);
