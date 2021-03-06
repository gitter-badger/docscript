import * as tsconfig from 'tsconfig';
import * as minimist from 'minimist';
import * as ts from 'typescript';
import * as path from 'path';

import { DocWriter } from '../doc/writer';
import * as helpers from './helpers';

interface Argv {
    sourceDir: string;
    mainPackage: string;
    outDir: string;
    ui?: string;
    deepForeign?: boolean;
    withoutSearch?: boolean;
}

if (!module.parent) {
    let argParser = ((minimist as any).default || minimist);
    let argv: Argv = argParser(process.argv.slice(2)) as any;

    console.log(argv);

    let tsconfigPath = tsconfig.resolveSync(argv.sourceDir);
    let { files, compilerOptions } = tsconfig.loadSync(tsconfigPath);

    let tsCompilerOptions = helpers.rawToTsCompilerOptions(compilerOptions, process.cwd(), ts);
    let ctx = helpers.generateFiles(files, argv.mainPackage, tsCompilerOptions);

    ctx.generateForeignModules(argv.deepForeign);

    let writer = new DocWriter(ctx);
    writer.ensureDir(argv.outDir);
    writer.writeModules(path.join(argv.outDir, 'generated'), !argv.withoutSearch)
        .then(() => {
            helpers.copyUI(argv.outDir, argv.ui);
            process.exit(0);
        })
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
};
