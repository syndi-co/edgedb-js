import type { Executor } from "../../ifaces";
import type { Cardinality } from "../enums";
import type { UUID } from "./queryTypes";
import { StrictMap } from "../strictMap";
export type Pointer = {
    card: Cardinality;
    kind: "link" | "property";
    name: string;
    target_id: UUID;
    is_exclusive: boolean;
    is_computed: boolean;
    is_readonly: boolean;
    has_default: boolean;
    pointers: ReadonlyArray<Pointer> | null;
};
export type Backlink = Pointer & {
    kind: "link";
    pointers: null;
    stub: string;
};
export type TypeKind = "object" | "scalar" | "array" | "tuple" | "range" | "multirange" | "unknown";
export type TypeProperties<T extends TypeKind> = {
    id: UUID;
    kind: T;
    name: string;
};
export type ScalarType = TypeProperties<"scalar"> & {
    is_abstract: boolean;
    is_seq: boolean;
    bases: ReadonlyArray<{
        id: UUID;
    }>;
    enum_values: ReadonlyArray<string> | null;
    material_id: UUID | null;
    cast_type?: UUID;
};
export type ObjectType = TypeProperties<"object"> & {
    is_abstract: boolean;
    bases: ReadonlyArray<{
        id: UUID;
    }>;
    union_of: ReadonlyArray<{
        id: UUID;
    }>;
    intersection_of: ReadonlyArray<{
        id: UUID;
    }>;
    pointers: ReadonlyArray<Pointer>;
    backlinks: ReadonlyArray<Backlink>;
    backlink_stubs: ReadonlyArray<Backlink>;
    exclusives: {
        [k: string]: Pointer;
    }[];
};
export type ArrayType = TypeProperties<"array"> & {
    array_element_id: UUID;
    is_abstract: boolean;
};
export type TupleType = TypeProperties<"tuple"> & {
    tuple_elements: ReadonlyArray<{
        name: string;
        target_id: UUID;
    }>;
    is_abstract: boolean;
};
export type RangeType = TypeProperties<"range"> & {
    range_element_id: UUID;
    is_abstract: boolean;
};
export type MultiRangeType = TypeProperties<"multirange"> & {
    multirange_element_id: UUID;
    is_abstract: boolean;
};
export type PrimitiveType = ScalarType | ArrayType | TupleType | RangeType | MultiRangeType;
export type Type = PrimitiveType | ObjectType;
export type Types = StrictMap<UUID, Type>;
export declare const typeMapping: Map<string, ScalarType>;
export declare function getTypes(cxn: Executor, params?: {
    debug?: boolean;
}): Promise<Types>;
export declare function topoSort(types: Type[]): StrictMap<string, Type>;
export { getTypes as types };
