/*!
 * This source file is part of the EdgeDB open source project.
 *
 * Copyright 2020-present MagicStack Inc. and the EdgeDB authors.
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
import { ProtocolVersion } from "./ifaces";
export declare function getUniqueId(prefix?: string): string;
export declare function sleep(durationMillis: number): Promise<void>;
export declare function versionGreaterThan(left: ProtocolVersion, right: ProtocolVersion): boolean;
export declare function versionGreaterThanOrEqual(left: ProtocolVersion, right: ProtocolVersion): boolean;
export interface CryptoUtils {
    randomBytes: (size: number) => Promise<Uint8Array>;
    H: (msg: Uint8Array) => Promise<Uint8Array>;
    HMAC: (key: Uint8Array, msg: Uint8Array) => Promise<Uint8Array>;
}
