"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchConnection = exports.AdminUIFetchConnection = void 0;
const baseConn_1 = require("./baseConn");
const codecs_1 = require("./codecs/codecs");
const errors_1 = require("./errors");
const ifaces_1 = require("./ifaces");
const buffer_1 = require("./primitives/buffer");
const chars = __importStar(require("./primitives/chars"));
const event_1 = __importDefault(require("./primitives/event"));
const PROTO_MIME = `application/x.edgedb.v_${baseConn_1.PROTO_VER[0]}_${baseConn_1.PROTO_VER[1]}.binary'`;
const STUDIO_CAPABILITIES = (baseConn_1.RESTRICTED_CAPABILITIES |
    baseConn_1.Capabilities.SESSION_CONFIG |
    baseConn_1.Capabilities.SET_GLOBAL) >>>
    0;
class BaseFetchConnection extends baseConn_1.BaseRawConnection {
    config;
    addr;
    abortSignal = null;
    constructor(config, registry) {
        super(registry);
        this.config = config;
        this.addr = this._buildAddr();
    }
    _buildAddr() {
        this.throwNotImplemented("_buildAddr");
    }
    async _waitForMessage() {
        if (this.buffer.takeMessage()) {
            return;
        }
        if (this.messageWaiter == null || this.messageWaiter.done) {
            throw new errors_1.InternalClientError(`message waiter was not initialized before waiting for response`);
        }
        await this.messageWaiter.wait();
    }
    async __sendData(data) {
        if (this.buffer.takeMessage()) {
            const mtype = this.buffer.getMessageType();
            throw new errors_1.InternalClientError(`sending request before reading all data of the previous one: ` +
                `${chars.chr(mtype)}`);
        }
        if (this.messageWaiter != null && !this.messageWaiter.done) {
            throw new errors_1.InternalClientError(`sending request before waiting for completion of the previous one`);
        }
        this.messageWaiter = new event_1.default();
        try {
            const headers = {
                "Content-Type": PROTO_MIME,
            };
            if (this.config.user !== undefined) {
                headers["X-EdgeDB-User"] = this.config.user;
            }
            if (this.config.token !== undefined) {
                headers.Authorization = `Bearer ${this.config.token}`;
            }
            const resp = await fetch(this.addr, {
                method: "post",
                body: data,
                headers,
                signal: this.abortSignal,
            });
            if (!resp.ok) {
                throw new errors_1.ProtocolError(`fetch failed with status code ${resp.status}: ${resp.statusText}`);
            }
            const respData = await resp.arrayBuffer();
            const buf = new Uint8Array(respData);
            try {
                this.buffer.feed(buf);
            }
            catch (e) {
                this.messageWaiter.setError(e);
            }
            if (!this.buffer.takeMessage()) {
                throw new errors_1.ProtocolError("no binary protocol messages in the response");
            }
            this.messageWaiter.set();
        }
        catch (e) {
            this.messageWaiter.setError(e);
        }
        finally {
            this.messageWaiter = null;
        }
    }
    _sendData(data) {
        this.__sendData(data);
    }
    static create(config, registry) {
        const conn = new this(config, registry);
        conn.connected = true;
        conn.connWaiter.set();
        return conn;
    }
}
class AdminUIFetchConnection extends BaseFetchConnection {
    adminUIMode = true;
    _buildAddr() {
        const config = this.config;
        if (typeof config.address === "string") {
            return `${config.address}/db/${config.database}`;
        }
        const { address, tlsSecurity, database } = config;
        const protocol = tlsSecurity === "insecure" ? "http" : "https";
        const baseUrl = `${protocol}://${address[0]}:${address[1]}`;
        return `${baseUrl}/db/${database}`;
    }
    async rawParse(query, state, options, abortSignal) {
        this.abortSignal = abortSignal ?? null;
        const result = (await this._parse(query, ifaces_1.OutputFormat.BINARY, ifaces_1.Cardinality.MANY, state, STUDIO_CAPABILITIES, options));
        return [
            result[1],
            result[2],
            result[4],
            result[5],
            this.protocolVersion,
            result[3],
        ];
    }
    async rawExecute(query, state, outCodec, options, inCodec, args = null, abortSignal) {
        this.abortSignal = abortSignal ?? null;
        const result = new buffer_1.WriteBuffer();
        await this._executeFlow(query, args, outCodec ? ifaces_1.OutputFormat.BINARY : ifaces_1.OutputFormat.NONE, ifaces_1.Cardinality.MANY, state, inCodec ?? codecs_1.NULL_CODEC, outCodec ?? codecs_1.NULL_CODEC, result, STUDIO_CAPABILITIES, options);
        return result.unwrap();
    }
}
exports.AdminUIFetchConnection = AdminUIFetchConnection;
const _tokens = new WeakMap();
class FetchConnection extends BaseFetchConnection {
    _buildAddr() {
        const config = this.config;
        if (typeof config.address === "string") {
            return `${config.address}/db/${config.database}`;
        }
        const { address, tlsSecurity, database } = config;
        const protocol = tlsSecurity === "insecure" ? "http" : "https";
        const baseUrl = `${protocol}://${address[0]}:${address[1]}`;
        return `${baseUrl}/db/${database}`;
    }
    static createConnectWithTimeout(httpSCRAMAuth) {
        return async function connectWithTimeout(addr, config, registry) {
            const { connectionParams: { tlsSecurity, user, password = "", secretKey }, } = config;
            let token = secretKey ?? _tokens.get(config);
            if (!token) {
                const protocol = tlsSecurity === "insecure" ? "http" : "https";
                const baseUrl = `${protocol}://${addr[0]}:${addr[1]}`;
                token = await httpSCRAMAuth(baseUrl, user, password);
                _tokens.set(config, token);
            }
            const conn = new FetchConnection({
                address: addr,
                tlsSecurity,
                database: config.connectionParams.database,
                user: config.connectionParams.user,
                token,
            }, registry);
            conn.connected = true;
            conn.connWaiter.set();
            return conn;
        };
    }
}
exports.FetchConnection = FetchConnection;
