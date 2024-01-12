"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInterfaces = void 0;
const builders_1 = require("../builders");
const genutil_1 = require("../genutil");
const genutil_2 = require("../genutil");
const generateInterfaces = (params) => {
    const { dir, types } = params;
    const plainTypesCode = dir.getPath("interfaces");
    plainTypesCode.addImportStar("edgedb", "edgedb", {
        typeOnly: true,
    });
    const plainTypeModules = new Map();
    const getModule = (mod) => {
        let module = plainTypeModules.get(mod);
        if (!module) {
            const modParts = mod.split("::");
            const modName = modParts[modParts.length - 1];
            const parentModName = modParts.slice(0, -1).join("::");
            const parent = parentModName ? getModule(parentModName) : null;
            const internalName = modName === "default" && !parentModName ? "" : (0, genutil_2.makePlainIdent)(modName);
            module = {
                name: modName,
                internalName,
                fullInternalName: (parent?.fullInternalName ? parent.fullInternalName + "." : "") +
                    internalName,
                buf: new builders_1.CodeBuffer(),
                types: new Map(),
                isRoot: !parentModName,
                nestedModules: new Map(),
            };
            plainTypeModules.set(mod, module);
            if (parent) {
                parent.nestedModules.set(modName, module);
            }
        }
        return module;
    };
    const getPlainTypeModule = (typeName) => {
        const { mod: tMod, name: tName } = (0, genutil_2.splitName)(typeName);
        return { tMod, tName, module: getModule(tMod) };
    };
    const _getTypeName = (mod) => (typeName, withModule = false) => {
        const { tMod, tName, module } = getPlainTypeModule(typeName);
        return (((mod !== tMod || withModule) && tMod !== "default"
            ? `${module.fullInternalName}.`
            : "") + `${(0, genutil_2.makePlainIdent)(tName)}`);
    };
    for (const type of types.values()) {
        if (type.kind === "scalar" && type.enum_values?.length) {
            const { mod: enumMod, name: enumName } = (0, genutil_2.splitName)(type.name);
            const getEnumTypeName = _getTypeName(enumMod);
            const { module } = getPlainTypeModule(type.name);
            module.types.set(enumName, getEnumTypeName(type.name, true));
            module.buf.writeln([
                (0, builders_1.t) `export type ${getEnumTypeName(type.name)} = ${type.enum_values
                    .map((val) => (0, genutil_2.quote)(val))
                    .join(" | ")};`,
            ]);
        }
        if (type.kind !== "object") {
            continue;
        }
        const isUnionType = Boolean(type.union_of?.length);
        const isIntersectionType = Boolean(type.intersection_of?.length);
        if (isIntersectionType) {
            continue;
        }
        const { mod, name } = (0, genutil_2.splitName)(type.name);
        const body = dir.getModule(mod);
        body.registerRef(type.name, type.id);
        const getTypeName = _getTypeName(mod);
        const getTSType = (pointer) => {
            const targetType = types.get(pointer.target_id);
            const isLink = pointer.kind === "link";
            const isUnion = isLink &&
                targetType.kind === "object" &&
                Boolean(targetType.union_of?.length);
            if (isUnion) {
                return targetType.union_of
                    .map(({ id }) => types.get(id))
                    .map((member) => getTypeName(member.name))
                    .join(" | ");
            }
            else if (isLink) {
                return getTypeName(targetType.name);
            }
            else {
                const baseType = targetType.kind === "scalar"
                    ? targetType.bases
                        .map(({ id }) => types.get(id))
                        .filter((base) => !base.is_abstract)[0]
                    : null;
                return (0, genutil_2.toTSScalarType)(baseType ?? targetType, types, {
                    getEnumRef: (enumType) => getTypeName(enumType.name),
                    edgedbDatatypePrefix: "",
                }).join("");
            }
        };
        const { module: plainTypeModule } = getPlainTypeModule(type.name);
        const pointers = type.pointers.filter((ptr) => ptr.name !== "__type__");
        if (!isUnionType) {
            plainTypeModule.types.set(name, getTypeName(type.name, true));
        }
        plainTypeModule.buf.writeln([
            (0, builders_1.t) `${isUnionType ? "" : "export "}interface ${getTypeName(type.name)}${type.bases.length
                ? ` extends ${type.bases
                    .map(({ id }) => {
                    const baseType = types.get(id);
                    return getTypeName(baseType.name);
                })
                    .join(", ")}`
                : ""} ${pointers.length
                ? `{\n${pointers
                    .map((pointer) => {
                    const isOptional = pointer.card === genutil_1.$.Cardinality.AtMostOne;
                    return `  ${(0, genutil_2.quote)(pointer.name)}${isOptional ? "?" : ""}: ${getTSType(pointer)}${pointer.card === genutil_1.$.Cardinality.Many ||
                        pointer.card === genutil_1.$.Cardinality.AtLeastOne
                        ? "[]"
                        : ""}${isOptional ? " | null" : ""};`;
                })
                    .join("\n")}\n}`
                : "{}"}\n`,
        ]);
    }
    const plainTypesExportBuf = new builders_1.CodeBuffer();
    const writeModuleExports = (module) => {
        const wrapInNamespace = !(module.isRoot && module.name === "default");
        if (wrapInNamespace) {
            plainTypesCode.writeln([(0, builders_1.t) `export namespace ${module.internalName} {`]);
            plainTypesCode.writeln([(0, builders_1.js) `const ${module.internalName} = {`]);
            plainTypesCode.increaseIndent();
        }
        plainTypesCode.writeBuf(module.buf);
        plainTypesExportBuf.writeln([(0, builders_1.t) `${(0, genutil_2.quote)(module.name)}: {`]);
        plainTypesExportBuf.increaseIndent();
        for (const [name, typeName] of module.types) {
            plainTypesExportBuf.writeln([(0, builders_1.t) `${(0, genutil_2.quote)(name)}: ${typeName};`]);
        }
        for (const nestedMod of module.nestedModules.values()) {
            writeModuleExports(nestedMod);
        }
        plainTypesExportBuf.decreaseIndent();
        plainTypesExportBuf.writeln([(0, builders_1.t) `};`]);
        if (wrapInNamespace) {
            plainTypesCode.decreaseIndent();
            plainTypesCode.writeln([(0, builders_1.t) `}`]);
            plainTypesCode.writeln([(0, builders_1.js) `}`]);
            plainTypesCode.addExport(module.internalName, { modes: ["js"] });
        }
    };
    for (const module of [...plainTypeModules.values()].filter((mod) => mod.isRoot)) {
        writeModuleExports(module);
    }
    plainTypesCode.writeln([(0, builders_1.t) `export interface types {`]);
    plainTypesCode.indented(() => plainTypesCode.writeBuf(plainTypesExportBuf));
    plainTypesCode.writeln([(0, builders_1.t) `}`]);
    plainTypesCode.writeln([
        (0, builders_1.t) `

export namespace helper {
  type LinkType = std.BaseObject | std.BaseObject[];

  export type propertyKeys<T> = {
    [k in keyof T]: NonNullable<T[k]> extends LinkType ? never : k;
  }[keyof T];

  export type linkKeys<T> = {
    [k in keyof T]: NonNullable<T[k]> extends LinkType ? k : never;
  }[keyof T];

  export type Props<T> = Pick<T, propertyKeys<T>>;
  export type Links<T> = Pick<T, linkKeys<T>>;
}
`,
    ]);
};
exports.generateInterfaces = generateInterfaces;
