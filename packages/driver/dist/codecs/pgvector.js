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
exports.PgVectorCodec = exports.PG_VECTOR_MAX_DIM = void 0;
const ifaces_1 = require("./ifaces");
const errors_1 = require("../errors");
exports.PG_VECTOR_MAX_DIM = (1 << 16) - 1;
class PgVectorCodec extends ifaces_1.ScalarCodec {
    tsType = "Float32Array";
    encode(buf, object) {
        if (!(object instanceof Float32Array || Array.isArray(object))) {
            throw new errors_1.InvalidArgumentError(`a Float32Array or array of numbers was expected, got "${object}"`);
        }
        if (object.length > exports.PG_VECTOR_MAX_DIM) {
            throw new errors_1.InvalidArgumentError("too many elements in array to encode into pgvector");
        }
        buf
            .writeInt32(4 + object.length * 4)
            .writeUInt16(object.length)
            .writeUInt16(0);
        if (object instanceof Float32Array) {
            for (const el of object) {
                buf.writeFloat32(el);
            }
        }
        else {
            for (const el of object) {
                if (typeof el !== "number") {
                    throw new errors_1.InvalidArgumentError(`elements of vector array expected to be a numbers, got "${el}"`);
                }
                buf.writeFloat32(el);
            }
        }
    }
    decode(buf) {
        const dim = buf.readUInt16();
        buf.discard(2);
        const vecBuf = buf.readBuffer(dim * 4);
        const data = new DataView(vecBuf.buffer, vecBuf.byteOffset, vecBuf.byteLength);
        const vec = new Float32Array(dim);
        for (let i = 0; i < dim; i++) {
            vec[i] = data.getFloat32(i * 4);
        }
        return vec;
    }
}
exports.PgVectorCodec = PgVectorCodec;
