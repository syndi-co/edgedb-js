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
import { ICodec } from "./codecs/ifaces";
import { CodecsRegistry } from "./codecs/registry";
import { Cardinality, OutputFormat, QueryOptions, ProtocolVersion, QueryArgs } from "./ifaces";
import { ReadMessageBuffer, WriteBuffer } from "./primitives/buffer";
import Event from "./primitives/event";
import LRU from "./primitives/lru";
import { SerializedSessionState, Session } from "./options";
export declare const PROTO_VER: ProtocolVersion;
export declare const PROTO_VER_MIN: ProtocolVersion;
export declare enum Capabilities {
    NONE = 0,
    MODIFICATONS = 1,
    SESSION_CONFIG = 2,
    TRANSACTION = 4,
    DDL = 8,
    PERSISTENT_CONFIG = 16,
    SET_GLOBAL = 32,
    ALL = 4294967295
}
export declare const RESTRICTED_CAPABILITIES: number;
export type ParseResult = [
    Cardinality,
    ICodec,
    ICodec,
    number,
    Uint8Array | null,
    Uint8Array | null
];
export type connConstructor = new (registry: CodecsRegistry) => BaseRawConnection;
export declare class BaseRawConnection {
    protected connected: boolean;
    protected lastStatus: string | null;
    protected codecsRegistry: CodecsRegistry;
    protected queryCodecCache: LRU<string, [number, ICodec, ICodec, number]>;
    protected serverSecret: Uint8Array | null;
    private serverXactStatus;
    protected buffer: ReadMessageBuffer;
    protected messageWaiter: Event | null;
    protected connWaiter: Event;
    connAbortWaiter: Event;
    protected _abortedWith: Error | null;
    protocolVersion: ProtocolVersion;
    isLegacyProtocol: boolean;
    protected stateCodec: ICodec;
    protected stateCache: [Session, Uint8Array] | null;
    lastStateUpdate: SerializedSessionState | null;
    protected adminUIMode: boolean;
    protected throwNotImplemented(method: string): never;
    protected _waitForMessage(): Promise<void>;
    protected _sendData(data: Uint8Array): void;
    getConnAbortError(): Error;
    protected _checkState(): void;
    protected _abortWithError(err: Error): void;
    protected _ignoreHeaders(): void;
    protected _abortWaiters(err: Error): void;
    protected _parseHeaders(): Map<number, Uint8Array>;
    private _parseDescribeTypeMessage;
    protected _parseCommandCompleteMessage(): string;
    protected _parseErrorMessage(): Error;
    protected _parseSyncMessage(): void;
    private _parseDataMessages;
    private _parseServerSettings;
    protected _parseDescribeStateMessage(): void;
    protected _fallthrough(): void;
    _legacyParse(query: string, outputFormat: OutputFormat, expectOne: boolean): Promise<[
        number,
        ICodec,
        ICodec,
        number,
        Uint8Array | null,
        Uint8Array | null
    ]>;
    private _encodeArgs;
    _legacyExecuteFlow(args: QueryArgs, inCodec: ICodec, outCodec: ICodec, result: Array<any> | WriteBuffer): Promise<void>;
    private _legacyOptimisticExecuteFlow;
    private _encodeParseParams;
    _parse(query: string, outputFormat: OutputFormat, expectedCardinality: Cardinality, state: Session, capabilitiesFlags?: number, options?: QueryOptions): Promise<ParseResult>;
    protected _executeFlow(query: string, args: QueryArgs, outputFormat: OutputFormat, expectedCardinality: Cardinality, state: Session, inCodec: ICodec, outCodec: ICodec, result: Array<any> | WriteBuffer, capabilitiesFlags?: number, options?: QueryOptions): Promise<void>;
    private _getQueryCacheKey;
    private _validateFetchCardinality;
    fetch(query: string, args: QueryArgs | undefined, outputFormat: OutputFormat, expectedCardinality: Cardinality, state: Session, privilegedMode?: boolean): Promise<any>;
    getQueryCapabilities(query: string, outputFormat: OutputFormat, expectedCardinality: Cardinality): number | null;
    legacyExecute(query: string, allowTransactionCommands?: boolean): Promise<void>;
    resetState(): Promise<void>;
    protected _abort(): void;
    isClosed(): boolean;
    close(): Promise<void>;
}
