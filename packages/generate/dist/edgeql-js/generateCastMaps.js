"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCastMaps = void 0;
const builders_1 = require("../builders");
const genutil_1 = require("../genutil");
const genutil_2 = require("../genutil");
const generateObjectTypes_1 = require("./generateObjectTypes");
const getRuntimeRef = (name) => (0, genutil_1.getRef)(name, { prefix: "" });
const generateCastMaps = (params) => {
    const { dir, types, casts, typesByName } = params;
    const { implicitCastMap } = casts;
    const f = dir.getPath("castMaps");
    f.addImportStar("edgedb", "edgedb");
    f.addImportStar("$", "./reflection", {
        modes: ["ts", "dts"],
        allowFileExt: true,
        typeOnly: true,
    });
    const reverseTopo = Array.from(types)
        .reverse()
        .map(([_, type]) => type);
    const materialScalars = reverseTopo.filter((type) => type.kind === "scalar" && !type.is_abstract);
    const casting = (id) => {
        const type = types.get(id);
        const castable = genutil_2.$.util.deduplicate([
            ...genutil_2.$.util.getFromArrayMap(implicitCastMap, type.id),
        ]);
        return castable;
    };
    const assignableMap = new builders_1.CodeBuffer();
    assignableMap.writeln([
        (0, builders_1.t) `export `,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type scalarAssignableBy<T extends $.ScalarType> =`,
    ]);
    const castableMap = new builders_1.CodeBuffer();
    castableMap.writeln([
        (0, builders_1.t) `export `,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type scalarCastableFrom<T extends $.ScalarType> =`,
    ]);
    const staticMap = new builders_1.CodeBuffer();
    staticMap.writeln([(0, builders_1.dts) `declare `, (0, builders_1.t) `type getSharedParentScalar<A, B> =`]);
    const runtimeMap = new builders_1.CodeBuffer();
    const returnTypes = new Set();
    for (const outer of materialScalars) {
        assignableMap.writeln([
            (0, builders_1.t) `  T extends ${(0, genutil_1.getRef)(outer.name)} ? ${(0, generateObjectTypes_1.getStringRepresentation)(types.get(outer.id), {
                types,
                casts: casts.assignableByMap,
                castSuffix: "λIAssignableBy",
            }).staticType} : `,
        ]);
        castableMap.writeln([
            (0, builders_1.t) `  T extends ${(0, genutil_1.getRef)(outer.name)} ? ${(0, generateObjectTypes_1.getStringRepresentation)(types.get(outer.id), {
                types,
                casts: casts.implicitCastFromMap,
                castSuffix: "λICastableTo",
            }).staticType} : `,
        ]);
        const outerCastableTo = casting(outer.id);
        staticMap.writeln([(0, builders_1.t) `  A extends ${(0, genutil_1.getRef)(outer.name)} ?`]);
        runtimeMap.writeln([(0, builders_1.r) `  if (a.__name__ === ${(0, genutil_1.quote)(outer.name)}) {`]);
        for (const inner of materialScalars) {
            const innerCastableTo = casting(inner.id);
            const sameType = inner.name === outer.name;
            const aCastableToB = outerCastableTo.includes(inner.id);
            const bCastableToA = innerCastableTo.includes(outer.id);
            let sharedParent = null;
            const sharedParentId = outerCastableTo.find((type) => innerCastableTo.includes(type));
            if (sharedParentId) {
                const sharedParentName = types.get(sharedParentId).name;
                sharedParent = sharedParentName;
            }
            const validCast = sameType || aCastableToB || bCastableToA || sharedParent;
            if (validCast) {
                staticMap.writeln([(0, builders_1.t) `    B extends ${(0, genutil_1.getRef)(inner.name)} ?`]);
                runtimeMap.writeln([(0, builders_1.r) `    if(b.__name__ === ${(0, genutil_1.quote)(inner.name)}) {`]);
                if (sameType) {
                    staticMap.writeln([(0, builders_1.t) `    B`]);
                    runtimeMap.writeln([(0, builders_1.r) `      return b;`]);
                }
                else if (aCastableToB) {
                    staticMap.writeln([(0, builders_1.t) `    B`]);
                    runtimeMap.writeln([(0, builders_1.r) `      return b;`]);
                }
                else if (bCastableToA) {
                    staticMap.writeln([(0, builders_1.t) `    A`]);
                    runtimeMap.writeln([(0, builders_1.r) `      return a;`]);
                }
                else if (sharedParent) {
                    staticMap.writeln([(0, builders_1.t) `    ${(0, genutil_1.getRef)(sharedParent)}`]);
                    runtimeMap.writeln([(0, builders_1.r) `      return ${getRuntimeRef(sharedParent)};`]);
                    returnTypes.add(sharedParent);
                }
                else {
                    staticMap.writeln([(0, builders_1.t) `    never`]);
                    runtimeMap.writeln([
                        (0, builders_1.r) `      throw new Error(\`Types are not castable: \${a.__name__}, \${b.__name__}\`);`,
                    ]);
                }
                staticMap.writeln([(0, builders_1.t) `    :`]);
                runtimeMap.writeln([(0, builders_1.r) `    }`]);
            }
        }
        staticMap.writeln([(0, builders_1.t) `    never`]);
        runtimeMap.writeln([
            (0, builders_1.r) `    throw new Error(\`Types are not castable: \${a.__name__}, \${b.__name__}\`);`,
        ]);
        staticMap.writeln([(0, builders_1.t) `  :`]);
        runtimeMap.writeln([(0, builders_1.r) `    }`]);
    }
    assignableMap.writeln([(0, builders_1.t) `  never\n`]);
    castableMap.writeln([(0, builders_1.t) `  never\n`]);
    staticMap.writeln([(0, builders_1.t) `never\n`]);
    runtimeMap.writeln([
        (0, builders_1.r) `  throw new Error(\`Types are not castable: \${a.__name__}, \${b.__name__}\`);`,
    ]);
    runtimeMap.writeln([(0, builders_1.r) `}\n`]);
    f.writeBuf(assignableMap);
    f.nl();
    f.writeBuf(castableMap);
    f.nl();
    f.writeBuf(staticMap);
    f.nl();
    f.writeln([
        (0, builders_1.dts) `declare `,
        `function getSharedParentScalar`,
        (0, builders_1.t) `<A extends $.ScalarType, B extends $.ScalarType>`,
        `(a`,
        (0, builders_1.t) `: A`,
        `, b`,
        (0, builders_1.t) `: B`,
        `)`,
        (0, builders_1.t) `: ${(0, genutil_1.joinFrags)(["A", "B", ...[...returnTypes].map((type) => (0, genutil_1.getRef)(type))], " | ")}`,
        (0, builders_1.r) ` {`,
    ]);
    f.writeln([(0, builders_1.r) `  a = (a`, (0, builders_1.ts) ` as any`, (0, builders_1.r) `).__casttype__ || a;`]);
    f.writeln([(0, builders_1.r) `  b = (b`, (0, builders_1.ts) ` as any`, (0, builders_1.r) `).__casttype__ || b;`]);
    f.addExport("getSharedParentScalar");
    f.writeBuf(runtimeMap);
    f.nl();
    f.writeln([
        (0, builders_1.r) `const implicitCastMap = new Map`,
        (0, builders_1.ts) `<string, Set<string>>`,
        (0, builders_1.r) `([`,
    ]);
    f.indented(() => {
        for (const [sourceId, castableTo] of Object.entries(casts.implicitCastMap)) {
            if (castableTo.length) {
                f.writeln([
                    (0, builders_1.r) `[${(0, genutil_1.quote)(types.get(sourceId).name)}, new Set([${castableTo
                        .map((targetId) => (0, genutil_1.quote)(types.get(targetId).name))
                        .join(", ")}])],`,
                ]);
            }
        }
    });
    f.writeln([(0, builders_1.r) `]);`]);
    f.writeln([
        (0, builders_1.dts) `declare `,
        `function isImplicitlyCastableTo(from`,
        (0, builders_1.t) `: string`,
        `, to`,
        (0, builders_1.t) `: string`,
        `)`,
        (0, builders_1.t) `: boolean`,
        (0, builders_1.r) ` {
  const _a = implicitCastMap.get(from),
        _b = _a != null ? _a.has(to) : null;
  return _b != null ? _b : false;
};\n\n`,
    ]);
    f.addExport("isImplicitlyCastableTo");
    f.writeln([
        (0, builders_1.t) `export `,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type scalarLiterals =\n  | ${Object.keys(genutil_1.literalToScalarMapping).join("\n  | ")}\n  | edgedb.Range<any> | edgedb.MultiRange<any>;\n\n`,
    ]);
    f.writeln([
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type getTsType<T extends $.BaseType> = T extends $.ScalarType`,
    ]);
    f.writeln([
        (0, builders_1.t) `  ? T extends ${(0, genutil_1.joinFrags)([...types.values()]
            .filter((type) => {
            return (type.kind === "scalar" &&
                !type.is_abstract &&
                !type.enum_values &&
                !type.material_id &&
                !type.cast_type &&
                (!genutil_1.scalarToLiteralMapping[type.name] ||
                    !genutil_1.scalarToLiteralMapping[type.name].literalKind));
        })
            .map((scalar) => (0, genutil_1.getRef)(scalar.name)), " | ")}`,
    ]);
    f.writeln([(0, builders_1.t) `    ? never`]);
    f.writeln([(0, builders_1.t) `    : T["__tstype__"]`]);
    f.writeln([(0, builders_1.t) `  : T extends $.RangeType`]);
    f.writeln([(0, builders_1.t) `  ? edgedb.Range<T['__element__']['__tstype__']>`]);
    f.writeln([(0, builders_1.t) `  : T extends $.MultiRangeType`]);
    f.writeln([(0, builders_1.t) `  ? edgedb.MultiRange<T['__element__']['__tstype__']>`]);
    f.writeln([(0, builders_1.t) `  : never;`]);
    f.writeln([
        (0, builders_1.t) `export `,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type orScalarLiteral<T extends $.TypeSet> =`,
    ]);
    f.writeln([(0, builders_1.t) `  | T`]);
    f.writeln([
        (0, builders_1.t) `  | ($.BaseTypeSet extends T`,
        (0, builders_1.t) `      ? scalarLiterals`,
        (0, builders_1.t) `      : $.Cardinality extends T["__cardinality__"]`,
        (0, builders_1.t) `        ? getTsType<T["__element__"]>`,
        (0, builders_1.t) `        : $.computeTsTypeCard<`,
        (0, builders_1.t) `            getTsType<T["__element__"]>,`,
        (0, builders_1.t) `            T["__cardinality__"]`,
        (0, builders_1.t) `          >);`,
    ]);
    f.writeln([
        (0, builders_1.t) `export `,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type scalarWithConstType<
  T extends $.ScalarType,
  TsConstType
> = $.ScalarType<
  T["__name__"],
  T["__tstype__"],
  T['__tsargtype__'],
  TsConstType
>;`,
    ]);
    f.writeln([
        (0, builders_1.t) `export `,
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type literalToScalarType<T extends any> =`,
    ]);
    for (const [literal, { type }] of Object.entries(genutil_1.literalToScalarMapping)) {
        if (!typesByName[type])
            continue;
        f.writeln([
            (0, builders_1.t) `  T extends ${literal} ? scalarWithConstType<${(0, genutil_1.getRef)(type)}, T> :`,
        ]);
    }
    f.writeln([
        (0, builders_1.t) `  T extends edgedb.Range<infer E> ? $.RangeType<literalToScalarType<E>> :`,
    ]);
    f.writeln([
        (0, builders_1.t) `  T extends edgedb.MultiRange<infer E> ? $.MultiRangeType<literalToScalarType<E>> :`,
    ]);
    f.writeln([(0, builders_1.t) `  $.BaseType;\n\n`]);
    f.writeln([
        (0, builders_1.dts) `declare `,
        (0, builders_1.t) `type literalToTypeSet<T extends any> = T extends $.TypeSet`,
    ]);
    f.writeln([(0, builders_1.t) `  ? T`]);
    f.writeln([(0, builders_1.t) `  : $.$expr_Literal<literalToScalarType<T>>;\n\n`]);
    f.writeln([(0, builders_1.t) `export `, (0, builders_1.dts) `declare `, (0, builders_1.t) `type mapLiteralToTypeSet<T> = {`]);
    f.writeln([(0, builders_1.t) `  [k in keyof T]: literalToTypeSet<T[k]>;`]);
    f.writeln([(0, builders_1.t) `};\n\n`]);
    f.addImportStar("literal", "./literal", { allowFileExt: true });
    f.writeln([
        (0, builders_1.dts) `declare `,
        (0, builders_1.all) `function literalToTypeSet(type`,
        (0, builders_1.t) `: any`,
        (0, builders_1.all) `)`,
        (0, builders_1.t) `: $.TypeSet`,
        (0, builders_1.dts) `;`,
        (0, builders_1.r) ` {`,
    ]);
    f.writeln([(0, builders_1.r) `  if (type && type.__element__) {`]);
    f.writeln([(0, builders_1.r) `    return type;`]);
    f.writeln([(0, builders_1.r) `  }`]);
    for (const [literalType, { literalKind, type }] of Object.entries(genutil_1.literalToScalarMapping)) {
        const fullType = typesByName[type];
        if (!fullType)
            continue;
        if (literalKind === "typeof") {
            f.writeln([(0, builders_1.r) `  if (typeof type === "${literalType}") {`]);
        }
        else {
            f.writeln([(0, builders_1.r) `  if (type instanceof ${literalType}) {`]);
        }
        f.writeln([(0, builders_1.r) `    return literal.$getType("${fullType.id}")(type);`]);
        f.writeln([(0, builders_1.r) `  }`]);
    }
    f.writeln([
        (0, builders_1.r) `  throw new Error(\`Cannot convert literal '\${type}' into scalar type\`);`,
    ]);
    f.writeln([(0, builders_1.r) `}`]);
    f.addExport("literalToTypeSet");
};
exports.generateCastMaps = generateCastMaps;
