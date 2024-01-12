"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeQuery = void 0;
const array_1 = require("../codecs/array");
const consts_1 = require("../codecs/consts");
const enum_1 = require("../codecs/enum");
const ifaces_1 = require("../codecs/ifaces");
const namedtuple_1 = require("../codecs/namedtuple");
const object_1 = require("../codecs/object");
const range_1 = require("../codecs/range");
const codecs_1 = require("../codecs/codecs");
const set_1 = require("../codecs/set");
const tuple_1 = require("../codecs/tuple");
const ifaces_2 = require("../ifaces");
const options_1 = require("../options");
async function analyzeQuery(client, query) {
    let parseResult;
    const pool = client.pool;
    const holder = await pool.acquireHolder(options_1.Options.defaults());
    try {
        const cxn = await holder._getConnection();
        parseResult = await cxn._parse(query, ifaces_2.OutputFormat.BINARY, ifaces_2.Cardinality.MANY, options_1.Session.defaults());
    }
    finally {
        await holder.release();
    }
    const cardinality = parseResult[0];
    const inCodec = parseResult[1];
    const outCodec = parseResult[2];
    const imports = new Set();
    const args = walkCodec(inCodec, {
        indent: "",
        optionalNulls: true,
        imports,
    });
    const result = generateSetType(walkCodec(outCodec, {
        indent: "",
        optionalNulls: false,
        imports,
    }), cardinality);
    return {
        result,
        args,
        cardinality,
        query,
        imports,
    };
}
exports.analyzeQuery = analyzeQuery;
function generateSetType(type, cardinality) {
    switch (cardinality) {
        case ifaces_2.Cardinality.MANY:
            return `${type}[]`;
        case ifaces_2.Cardinality.ONE:
            return type;
        case ifaces_2.Cardinality.AT_MOST_ONE:
            return `${type} | null`;
        case ifaces_2.Cardinality.AT_LEAST_ONE:
            return `[(${type}), ...(${type})[]]`;
    }
    throw Error(`unexpected cardinality: ${cardinality}`);
}
function walkCodec(codec, ctx) {
    if (codec instanceof codecs_1.NullCodec) {
        return "null";
    }
    if (codec instanceof ifaces_1.ScalarCodec) {
        if (codec instanceof enum_1.EnumCodec) {
            return `(${codec.values.map((val) => JSON.stringify(val)).join(" | ")})`;
        }
        if (codec.importedType) {
            ctx.imports.add(codec.tsType);
        }
        return codec.tsType;
    }
    if (codec instanceof object_1.ObjectCodec || codec instanceof namedtuple_1.NamedTupleCodec) {
        const fields = codec instanceof object_1.ObjectCodec
            ? codec.getFields()
            : codec.getNames().map((name) => ({ name, cardinality: consts_1.ONE }));
        const subCodecs = codec.getSubcodecs();
        return `{\n${fields
            .map((field, i) => {
            let subCodec = subCodecs[i];
            if (subCodec instanceof set_1.SetCodec) {
                if (!(field.cardinality === consts_1.MANY || field.cardinality === consts_1.AT_LEAST_ONE)) {
                    throw Error("subcodec is SetCodec, but upper cardinality is one");
                }
                subCodec = subCodec.getSubcodecs()[0];
            }
            return `${ctx.indent}  ${JSON.stringify(field.name)}${ctx.optionalNulls && field.cardinality === consts_1.AT_MOST_ONE ? "?" : ""}: ${generateSetType(walkCodec(subCodec, { ...ctx, indent: ctx.indent + "  " }), field.cardinality)};`;
        })
            .join("\n")}\n${ctx.indent}}`;
    }
    if (codec instanceof array_1.ArrayCodec) {
        return `${walkCodec(codec.getSubcodecs()[0], ctx)}[]`;
    }
    if (codec instanceof tuple_1.TupleCodec) {
        return `[${codec
            .getSubcodecs()
            .map((subCodec) => walkCodec(subCodec, ctx))
            .join(", ")}]`;
    }
    if (codec instanceof range_1.RangeCodec) {
        const subCodec = codec.getSubcodecs()[0];
        if (!(subCodec instanceof ifaces_1.ScalarCodec)) {
            throw Error("expected range subtype to be scalar type");
        }
        ctx.imports.add("Range");
        return `Range<${walkCodec(subCodec, ctx)}>`;
    }
    if (codec instanceof range_1.MultiRangeCodec) {
        const subCodec = codec.getSubcodecs()[0];
        if (!(subCodec instanceof ifaces_1.ScalarCodec)) {
            throw Error("expected multirange subtype to be scalar type");
        }
        ctx.imports.add("MultiRange");
        return `MultiRange<${walkCodec(subCodec, ctx)}>`;
    }
    throw Error(`Unexpected codec kind: ${codec.getKind()}`);
}
