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
exports.MultiRangeCodec = exports.RangeCodec = void 0;
const ifaces_1 = require("./ifaces");
const buffer_1 = require("../primitives/buffer");
const range_1 = require("../datatypes/range");
const errors_1 = require("../errors");
var RangeFlags;
(function (RangeFlags) {
    RangeFlags[RangeFlags["EMPTY"] = 1] = "EMPTY";
    RangeFlags[RangeFlags["INC_LOWER"] = 2] = "INC_LOWER";
    RangeFlags[RangeFlags["INC_UPPER"] = 4] = "INC_UPPER";
    RangeFlags[RangeFlags["EMPTY_LOWER"] = 8] = "EMPTY_LOWER";
    RangeFlags[RangeFlags["EMPTY_UPPER"] = 16] = "EMPTY_UPPER";
})(RangeFlags || (RangeFlags = {}));
const MAXINT32 = 0x7fffffff;
function encodeRange(buf, obj, subCodec) {
    if (!(obj instanceof range_1.Range)) {
        throw new errors_1.InvalidArgumentError("a Range was expected");
    }
    const elemData = new buffer_1.WriteBuffer();
    if (obj.lower !== null) {
        subCodec.encode(elemData, obj.lower);
    }
    if (obj.upper !== null) {
        subCodec.encode(elemData, obj.upper);
    }
    const elemBuf = elemData.unwrap();
    buf.writeInt32(1 + elemBuf.length);
    buf.writeUInt8(obj.isEmpty
        ? RangeFlags.EMPTY
        : (obj.incLower ? RangeFlags.INC_LOWER : 0) |
            (obj.incUpper ? RangeFlags.INC_UPPER : 0) |
            (obj.lower === null ? RangeFlags.EMPTY_LOWER : 0) |
            (obj.upper === null ? RangeFlags.EMPTY_UPPER : 0));
    buf.writeBuffer(elemBuf);
}
function decodeRange(buf, subCodec) {
    const flags = buf.readUInt8();
    if (flags & RangeFlags.EMPTY) {
        return range_1.Range.empty();
    }
    const elemBuf = buffer_1.ReadBuffer.alloc();
    let lower = null;
    let upper = null;
    if (!(flags & RangeFlags.EMPTY_LOWER)) {
        buf.sliceInto(elemBuf, buf.readInt32());
        lower = subCodec.decode(elemBuf);
        elemBuf.finish();
    }
    if (!(flags & RangeFlags.EMPTY_UPPER)) {
        buf.sliceInto(elemBuf, buf.readInt32());
        upper = subCodec.decode(elemBuf);
        elemBuf.finish();
    }
    return new range_1.Range(lower, upper, !!(flags & RangeFlags.INC_LOWER), !!(flags & RangeFlags.INC_UPPER));
}
class RangeCodec extends ifaces_1.Codec {
    subCodec;
    constructor(tid, subCodec) {
        super(tid);
        this.subCodec = subCodec;
    }
    encode(buf, obj) {
        return encodeRange(buf, obj, this.subCodec);
    }
    decode(buf) {
        return decodeRange(buf, this.subCodec);
    }
    getSubcodecs() {
        return [this.subCodec];
    }
    getKind() {
        return "range";
    }
}
exports.RangeCodec = RangeCodec;
class MultiRangeCodec extends ifaces_1.Codec {
    subCodec;
    constructor(tid, subCodec) {
        super(tid);
        this.subCodec = subCodec;
    }
    encode(buf, obj) {
        if (!(obj instanceof range_1.MultiRange)) {
            throw new TypeError(`a MultiRange expected (got type ${obj.constructor.name})`);
        }
        const objLen = obj.length;
        if (objLen > MAXINT32) {
            throw new errors_1.InvalidArgumentError("too many elements in array");
        }
        const elemData = new buffer_1.WriteBuffer();
        for (const item of obj) {
            try {
                encodeRange(elemData, item, this.subCodec);
            }
            catch (e) {
                if (e instanceof errors_1.InvalidArgumentError) {
                    throw new errors_1.InvalidArgumentError(`invalid multirange element: ${e.message}`);
                }
                else {
                    throw e;
                }
            }
        }
        const elemBuf = elemData.unwrap();
        const elemDataLen = elemBuf.length;
        if (elemDataLen > MAXINT32 - 4) {
            throw new errors_1.InvalidArgumentError(`size of encoded multirange datum exceeds the maximum allowed ${MAXINT32 - 4} bytes`);
        }
        buf.writeInt32(4 + elemDataLen);
        buf.writeInt32(objLen);
        buf.writeBuffer(elemBuf);
    }
    decode(buf) {
        const elemCount = buf.readInt32();
        const result = new Array(elemCount);
        const elemBuf = buffer_1.ReadBuffer.alloc();
        const subCodec = this.subCodec;
        for (let i = 0; i < elemCount; i++) {
            const elemLen = buf.readInt32();
            if (elemLen === -1) {
                throw new errors_1.ProtocolError("unexpected NULL element in multirange value");
            }
            else {
                buf.sliceInto(elemBuf, elemLen);
                const elem = decodeRange(elemBuf, subCodec);
                if (elemBuf.length) {
                    throw new errors_1.ProtocolError(`unexpected trailing data in buffer after multirange element decoding: ${elemBuf.length}`);
                }
                result[i] = elem;
                elemBuf.finish();
            }
        }
        return new range_1.MultiRange(result);
    }
    getSubcodecs() {
        return [this.subCodec];
    }
    getKind() {
        return "multirange";
    }
}
exports.MultiRangeCodec = MultiRangeCodec;
