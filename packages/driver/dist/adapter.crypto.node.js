"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let cryptoUtils;
if (typeof crypto === "undefined") {
    const nodeCrypto = require("crypto");
    cryptoUtils = {
        randomBytes(size) {
            return new Promise((resolve, reject) => {
                nodeCrypto.randomBytes(size, (err, buf) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(buf);
                    }
                });
            });
        },
        async H(msg) {
            const sign = nodeCrypto.createHash("sha256");
            sign.update(msg);
            return sign.digest();
        },
        async HMAC(key, msg) {
            const hm = nodeCrypto.createHmac("sha256", key);
            hm.update(msg);
            return hm.digest();
        },
    };
}
else {
    cryptoUtils = require("./browserCrypto").default;
}
exports.default = cryptoUtils;
