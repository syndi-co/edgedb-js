/*!
 * This source file is part of the EdgeDB open source project.
 *
 * Copyright 2022-present MagicStack Inc. and the EdgeDB authors.
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
import { BaseRawConnection } from "./baseConn";
import { ICodec } from "./codecs/ifaces";
import { CodecsRegistry } from "./codecs/registry";
import { Address, NormalizedConnectConfig } from "./conUtils";
import type { HttpSCRAMAuth } from "./httpScram";
import { ProtocolVersion, QueryArgs, QueryOptions } from "./ifaces";
import { Session } from "./options";
interface FetchConfig {
    address: Address | string;
    database: string;
    tlsSecurity?: string;
    user?: string;
    token?: string;
}
declare class BaseFetchConnection extends BaseRawConnection {
    protected config: FetchConfig;
    protected addr: string;
    protected abortSignal: AbortSignal | null;
    constructor(config: FetchConfig, registry: CodecsRegistry);
    protected _buildAddr(): string;
    protected _waitForMessage(): Promise<void>;
    protected __sendData(data: Uint8Array): Promise<void>;
    protected _sendData(data: Uint8Array): void;
    static create<T extends typeof BaseFetchConnection>(this: T, config: FetchConfig, registry: CodecsRegistry): InstanceType<T>;
}
export declare class AdminUIFetchConnection extends BaseFetchConnection {
    adminUIMode: boolean;
    protected _buildAddr(): string;
    rawParse(query: string, state: Session, options?: QueryOptions, abortSignal?: AbortSignal | null): Promise<[
        ICodec,
        ICodec,
        Uint8Array,
        Uint8Array,
        ProtocolVersion,
        number
    ]>;
    rawExecute(query: string, state: Session, outCodec?: ICodec, options?: QueryOptions, inCodec?: ICodec, args?: QueryArgs, abortSignal?: AbortSignal | null): Promise<Uint8Array>;
}
export declare class FetchConnection extends BaseFetchConnection {
    protected _buildAddr(): string;
    static createConnectWithTimeout(httpSCRAMAuth: HttpSCRAMAuth): (addr: Address, config: NormalizedConnectConfig, registry: CodecsRegistry) => Promise<FetchConnection>;
}
export {};
