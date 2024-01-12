"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = void 0;
function getEnv(envName, required = false) {
    return process.env[envName];
}
exports.getEnv = getEnv;
