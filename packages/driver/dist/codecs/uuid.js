"use strict";
/*!
 * This source file is part of the EdgeDB open source project.
 *
 * Copyright 2019-present MagicStack Inc. and the EdgeDB authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUIDCodec = void 0;
const buffer_1 = require("../primitives/buffer");
const ifaces_1 = require("./ifaces");
const errors_1 = require("../errors");
function UUIDBufferFromString(uuid) {
    let uuidClean = uuid;
    if (uuidClean.length !== 32) {
        uuidClean = uuidClean.replace(/\-/g, "");
        if (uuidClean.length !== 32) {
            throw new TypeError(`invalid UUID "${uuid}"`);
        }
    }
    try {
        return (0, buffer_1.uuidToBuffer)(uuidClean);
    }
    catch {
        throw new TypeError(`invalid UUID "${uuid}"`);
    }
}
class UUIDCodec extends ifaces_1.ScalarCodec {
    tsType = "string";
    encode(buf, object) {
        if (typeof object === "string") {
            const ubuf = UUIDBufferFromString(object);
            buf.writeInt32(16);
            buf.writeBuffer(ubuf);
        }
        else {
            throw new errors_1.InvalidArgumentError(`cannot encode UUID "${object}": invalid type`);
        }
    }
    decode(buf) {
        return buf.readUUID("-");
    }
}
exports.UUIDCodec = UUIDCodec;
