"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpClient = exports.createClient = void 0;
const baseClient_1 = require("./baseClient");
const conUtils_1 = require("./conUtils");
const browserCrypto_1 = __importDefault(require("./browserCrypto"));
const errors_1 = require("./errors");
const fetchConn_1 = require("./fetchConn");
const httpScram_1 = require("./httpScram");
const options_1 = require("./options");
const parseConnectArguments = (0, conUtils_1.getConnectArgumentsParser)(null);
const httpSCRAMAuth = (0, httpScram_1.getHTTPSCRAMAuth)(browserCrypto_1.default);
class FetchClientPool extends baseClient_1.BaseClientPool {
    isStateless = true;
    _connectWithTimeout = fetchConn_1.FetchConnection.createConnectWithTimeout(httpSCRAMAuth);
}
function createClient() {
    throw new errors_1.EdgeDBError(`'createClient()' cannot be used in browser (or edge runtime) environment, ` +
        `use 'createHttpClient()' API instead`);
}
exports.createClient = createClient;
function createHttpClient(options) {
    return new baseClient_1.Client(new FetchClientPool(parseConnectArguments, typeof options === "string" ? { dsn: options } : options ?? {}), options_1.Options.defaults());
}
exports.createHttpClient = createHttpClient;
