"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cryptoUtils = {
    async randomBytes(size) {
        return crypto.getRandomValues(new Uint8Array(size));
    },
    async H(msg) {
        return new Uint8Array(await crypto.subtle.digest("SHA-256", msg));
    },
    async HMAC(key, msg) {
        return new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", key, {
            name: "HMAC",
            hash: { name: "SHA-256" },
        }, false, ["sign"]), msg));
    },
};
exports.default = cryptoUtils;
