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
import type { ICodec, uuid, CodecKind } from "./ifaces";
import { Codec } from "./ifaces";
import { WriteBuffer, ReadBuffer } from "../primitives/buffer";
export declare class ArrayCodec extends Codec implements ICodec {
    private subCodec;
    private len;
    constructor(tid: uuid, subCodec: ICodec, len: number);
    encode(buf: WriteBuffer, obj: any): void;
    decode(buf: ReadBuffer): any;
    getSubcodecs(): ICodec[];
    getKind(): CodecKind;
}
