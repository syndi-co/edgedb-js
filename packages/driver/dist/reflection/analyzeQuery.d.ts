import { Cardinality } from "../ifaces";
import type { Client } from "../baseClient";
type QueryType = {
    args: string;
    result: string;
    cardinality: Cardinality;
    query: string;
    imports: Set<string>;
};
export declare function analyzeQuery(client: Client, query: string): Promise<QueryType>;
export {};
