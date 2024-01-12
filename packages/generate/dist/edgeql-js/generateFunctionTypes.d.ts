import type { GeneratorParams } from "../genutil";
import { CodeBuilder, CodeFragment, DirBuilder } from "../builders";
import type { $ } from "../genutil";
import { GroupedParams, AnytypeDef, FuncopDefOverload } from "../funcoputil";
export declare const generateFunctionTypes: ({ dir, functions, types, casts, }: GeneratorParams) => void;
export declare function allowsLiterals(type: $.introspect.Type, anytypes: AnytypeDef | null): boolean;
export interface FuncopDef {
    id: string;
    name: string;
    kind?: string;
    description?: string;
    return_type: {
        id: string;
        name: string;
    };
    return_typemod: $.introspect.FuncopTypemod;
    params: $.introspect.FuncopParam[];
    preserves_optionality?: boolean;
}
export declare function generateFuncopTypes<F extends FuncopDef>(dir: DirBuilder, types: $.introspect.Types, casts: $.introspect.Casts, funcops: $.StrictMap<string, F[]>, funcopExprKind: string, typeDefSuffix: string, optionalUndefined: boolean, typeDefGen: (code: CodeBuilder, def: F, args: CodeFragment[], namedArgs: CodeFragment[], returnType: CodeFragment[]) => void, implReturnGen: (code: CodeBuilder, funcopName: string, funcopDefs: F[]) => void): void;
export declare function generateFuncopDef(funcopDef: FuncopDefOverload<FuncopDef>): string;
export declare function generateReturnCardinality(name: string, params: GroupedParams, returnTypemod: $.introspect.FuncopTypemod, hasNamedParams: boolean, anytypes: AnytypeDef | null, preservesOptionality?: boolean): string;
