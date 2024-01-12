"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFiles = exports.stringifyImports = exports.generateQueryFiles = void 0;
const edgedb_1 = require("edgedb");
const ifaces_1 = require("edgedb/dist/ifaces");
const genutil_1 = require("./genutil");
const genutil_2 = require("./genutil");
async function generateQueryFiles(params) {
    if (params.options.file && params.options.watch) {
        throw new Error(`Using --watch and --file mode simultaneously is not
currently supported.`);
    }
    const noRoot = !params.root;
    const root = params.root ?? edgedb_1.adapter.process.cwd();
    if (noRoot) {
        console.warn(`No \`edgedb.toml\` found, using process.cwd() as root directory:
   ${params.root}
`);
    }
    else {
        console.log(`Detected project root via edgedb.toml:`);
        console.log("   " + params.root);
    }
    const { client } = params;
    console.log(`Detected schema directory: ${params.schemaDir}`);
    const matches = await getMatches(root, params.schemaDir);
    if (matches.length === 0) {
        console.log(`No .edgeql files found outside of ${params.schemaDir}`);
        return;
    }
    console.log(`Connecting to database...`);
    await client.ensureConnected();
    console.log(`Analyzing .edgeql files...`);
    if (params.options.file) {
        const filesByExtension = {};
        let wasError = false;
        await Promise.all(matches.map(async (path) => {
            const prettyPath = "./" + edgedb_1.adapter.path.posix.relative(root, path);
            try {
                const query = await edgedb_1.adapter.readFileUtf8(path);
                const types = await edgedb_1.$.analyzeQuery(client, query);
                console.log(`   ${prettyPath}`);
                const files = generateFiles({
                    target: params.options.target,
                    path,
                    types,
                });
                for (const f of files) {
                    if (!filesByExtension[f.extension]) {
                        filesByExtension[f.extension] = f;
                    }
                    else {
                        filesByExtension[f.extension].contents += `\n\n` + f.contents;
                        filesByExtension[f.extension].imports = {
                            ...filesByExtension[f.extension].imports,
                            ...f.imports,
                        };
                    }
                }
            }
            catch (err) {
                wasError = true;
                console.log(`Error in file '${prettyPath}': ${err.toString()}`);
            }
        }));
        if (!wasError) {
            console.log(`Generating query file${Object.keys(filesByExtension).length > 1 ? "s" : ""}...`);
            for (const [extension, file] of Object.entries(filesByExtension)) {
                const filePath = (edgedb_1.adapter.path.isAbsolute(params.options.file)
                    ? params.options.file
                    : edgedb_1.adapter.path.join(edgedb_1.adapter.process.cwd(), params.options.file)) +
                    extension;
                const prettyPath = edgedb_1.adapter.path.isAbsolute(params.options.file)
                    ? filePath
                    : `./${edgedb_1.adapter.path.posix.relative(root, filePath)}`;
                console.log(`   ${prettyPath}`);
                await edgedb_1.adapter.fs.writeFile(filePath, genutil_1.headerComment +
                    `${stringifyImports(file.imports)}\n\n${file.contents}`);
            }
        }
        return;
    }
    async function generateFilesForQuery(path) {
        try {
            const query = await edgedb_1.adapter.readFileUtf8(path);
            if (!query)
                return;
            const types = await edgedb_1.$.analyzeQuery(client, query);
            const files = generateFiles({
                target: params.options.target,
                path,
                types,
            });
            for (const f of files) {
                const prettyPath = "./" + edgedb_1.adapter.path.posix.relative(root, f.path);
                console.log(`   ${prettyPath}`);
                await edgedb_1.adapter.fs.writeFile(f.path, genutil_1.headerComment + `${stringifyImports(f.imports)}\n\n${f.contents}`);
            }
        }
        catch (err) {
            console.log(`Error in file './${edgedb_1.adapter.path.posix.relative(root, path)}': ${err.toString()}`);
        }
    }
    console.log(`Generating files for following queries:`);
    await Promise.all(matches.map(generateFilesForQuery));
}
exports.generateQueryFiles = generateQueryFiles;
function stringifyImports(imports) {
    if (Object.keys(imports).length === 0)
        return "";
    return `import type {${Object.keys(imports).join(", ")}} from "edgedb";`;
}
exports.stringifyImports = stringifyImports;
async function getMatches(root, schemaDir) {
    return edgedb_1.adapter.walk(root, {
        match: [/[^\/]\.edgeql$/],
        skip: [
            /node_modules/,
            RegExp(`${schemaDir}\\${edgedb_1.adapter.path.sep}migrations`),
            RegExp(`${schemaDir}\\${edgedb_1.adapter.path.sep}fixups`),
        ],
    });
}
function generateFiles(params) {
    const queryFileName = edgedb_1.adapter.path.basename(params.path);
    const baseFileName = queryFileName.replace(/\.edgeql$/, "");
    const outputDirname = edgedb_1.adapter.path.dirname(params.path);
    const outputBaseFileName = edgedb_1.adapter.path.join(outputDirname, `${baseFileName}.query`);
    const method = params.types.cardinality === ifaces_1.Cardinality.ONE
        ? "queryRequiredSingle"
        : params.types.cardinality === ifaces_1.Cardinality.AT_MOST_ONE
            ? "querySingle"
            : "query";
    const functionName = (0, genutil_2.camelify)(baseFileName);
    const interfaceName = functionName.charAt(0).toUpperCase() + functionName.slice(1);
    const argsInterfaceName = `${interfaceName}Args`;
    const returnsInterfaceName = `${interfaceName}Returns`;
    const hasArgs = params.types.args && params.types.args !== "null";
    const queryDefs = `\
${hasArgs ? `export type ${argsInterfaceName} = ${params.types.args};\n` : ""}
export type ${returnsInterfaceName} = ${params.types.result};\
`;
    const functionBody = `\
${params.types.query.trim().replace(/`/g, "\\`")}\`${hasArgs ? `, args` : ""});
`;
    const imports = {};
    for (const i of params.types.imports) {
        imports[i] = true;
    }
    const tsImports = { Executor: true, ...imports };
    const tsImpl = `${queryDefs}

export function ${functionName}(client: Executor${hasArgs ? `, args: ${argsInterfaceName}` : ""}): Promise<${returnsInterfaceName}> {
  return client.${method}(\`\\
${functionBody}
}
`;
    const denoImpl = `
${tsImpl}`;
    const jsImpl = `async function ${functionName}(client${hasArgs ? `, args` : ""}) {
  return client.${method}(\`\\
${functionBody}
}`;
    const dtsImpl = `${queryDefs}

export function ${functionName}(client: Executor${hasArgs ? `, args: ${argsInterfaceName}` : ""}): Promise<${returnsInterfaceName}>;`;
    switch (params.target) {
        case "cjs":
            return [
                {
                    path: `${outputBaseFileName}.js`,
                    contents: `${jsImpl}\n\nmodule.exports.${functionName} = ${functionName};`,
                    imports: {},
                    extension: ".js",
                },
                {
                    path: `${outputBaseFileName}.d.ts`,
                    contents: dtsImpl,
                    imports: tsImports,
                    extension: ".d.ts",
                },
            ];
        case "deno":
            return [
                {
                    path: `${outputBaseFileName}.ts`,
                    contents: denoImpl,
                    imports: tsImports,
                    extension: ".ts",
                },
            ];
        case "esm":
            return [
                {
                    path: `${outputBaseFileName}.mjs`,
                    contents: `export ${jsImpl}`,
                    imports: {},
                    extension: ".mjs",
                },
                {
                    path: `${outputBaseFileName}.d.ts`,
                    contents: dtsImpl,
                    imports: tsImports,
                    extension: ".d.ts",
                },
            ];
        case "mts":
            return [
                {
                    path: `${outputBaseFileName}.mts`,
                    contents: tsImpl,
                    imports: tsImports,
                    extension: ".mts",
                },
            ];
        case "ts":
            return [
                {
                    path: `${outputBaseFileName}.ts`,
                    contents: tsImpl,
                    imports: tsImports,
                    extension: ".ts",
                },
            ];
    }
}
exports.generateFiles = generateFiles;
