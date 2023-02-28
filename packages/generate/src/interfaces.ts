// tslint:disable:no-console
import {CommandOptions, getPackageVersion} from "./commandutil";
import {exitWithError} from "./genutil";

import {$, adapter, Client, createClient, createHttpClient} from "edgedb";
import {DirBuilder} from "./builders";

import type {ConnectConfig} from "edgedb/dist/conUtils";
import {generateInterfaces} from "./edgeql-js/generateInterfaces";

const {path} = adapter;

export async function runInterfacesGenerator(params: {
  root: string | null;
  options: CommandOptions;
  connectionConfig: ConnectConfig;
}) {
  const {root, options, connectionConfig} = params;

  let outFile: string;
  if (options.file) {
    outFile = path.isAbsolute(options.file)
      ? options.file
      : path.join(adapter.process.cwd(), options.file);
  } else if (root) {
    outFile = path.join(root, "dbschema/interfaces.ts");
  } else {
    throw new Error(
      `No edgedb.toml found. Initialize an EdgeDB project with\n\`edgedb project init\` or specify an output file with \`--file\``
    );
  }

  let outputDirIsInProject = false;
  let prettyOutputDir;
  if (root) {
    const relativeOutputDir = path.posix.relative(root, outFile);
    outputDirIsInProject = !relativeOutputDir.startsWith("..");
    prettyOutputDir = outputDirIsInProject
      ? `./${relativeOutputDir}`
      : outFile;
  } else {
    prettyOutputDir = outFile;
  }

  let client: Client;
  try {
    const cxnCreatorFn = options.useHttpClient
      ? createHttpClient
      : createClient;
    client = cxnCreatorFn({
      ...connectionConfig,
      concurrency: 5
    });
  } catch (e) {
    exitWithError(`Failed to connect: ${(e as Error).message}`);
  }

  const dir = new DirBuilder();

  // tslint:disable-next-line
  console.log(`Introspecting database schema...`);
  let types: $.introspect.Types;
  try {
    types = await $.introspect.types(client);
  } finally {
    client.close();
  }

  const generatorParams = {
    dir,
    types
  };
  console.log(`Generating interfaces...`);
  generateInterfaces(generatorParams);

  const file = dir.getPath("interfaces");
  const rendered =
    `// GENERATED by @edgedb/generate v${getPackageVersion()}\n` +
    `// Run 'npx @edgedb/generate interfaces' to re-generate\n\n` +
    file.render({
      mode: "ts",
      moduleKind: "esm",
      moduleExtension: ""
    });

  console.log(`Writing interfaces file...`);
  console.log("   " + prettyOutputDir);
  await adapter.fs.writeFile(outFile, rendered);

  console.log(`Generation complete! 🤘`);
}
