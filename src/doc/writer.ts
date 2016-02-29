import * as path from 'path';
import * as fs from 'fs';
import { ItemType } from './items';
import { Context, IdMap, SemanticIdMap } from './index';
import { extractPackage } from './utils';

let fse = require('fs-extra');

let INCLUDE_ITEMS = {
    [ItemType.Interface]: true,
    [ItemType.Class]: true,
    [ItemType.EnumDeclaration]: true,
    [ItemType.TypeAlias]: true,
    [ItemType.Function]: true,
    [ItemType.Method]: true,
    [ItemType.PropertyDeclaration]: true,
};

export class DocWriter {
    context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    generateIdMap(): [IdMap, SemanticIdMap, any[]] {
        let idMap = {} as IdMap;
        let semanticIdMap = {} as SemanticIdMap;
        let flatItems: any[] = [];

        function walkObject(obj: any, pkg: string, path: string, nesting: string[] = []) {
            if (obj.id) {
                nesting = nesting.concat(obj.id);
                idMap[obj.id] = [obj.semanticId, pkg, path, [nesting[0]]];

                if (INCLUDE_ITEMS[obj.itemType]) {
                    flatItems.push(obj);
                }

                if (obj.semanticId) {
                    if (!semanticIdMap[pkg]) { semanticIdMap[pkg] = {}; };
                    if (!semanticIdMap[pkg][path]) { semanticIdMap[pkg][path] = {}; };
                    if (!semanticIdMap[pkg][path][obj.semanticId]) { semanticIdMap[pkg][path][obj.semanticId] = obj.id; }
                    else {
                        console.error('Duplicate semantic id ' + obj.semanticId);
                    }
                }
            }

            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    let o = obj[key];
                    if (o != null &&
                        typeof o === 'object' &&
                        (Array.isArray(o) ||
                        Object.prototype.toString.call(o) === '[object Object]')) {
                            walkObject(o, pkg, path, nesting);
                        }
                }
            }
        }

        let modules = this.context.modules;
        Object.keys(modules).forEach(moduleKey => {
            let module = modules[moduleKey];
            module.items.forEach(item => {
                walkObject(item, module.pkgName, module.fileInfo.relativeToPackage);
            });
        });

        return [idMap, semanticIdMap, flatItems];
    }

    writeModules(dir: string) {
        fse.removeSync(dir);
        fse.ensureDirSync(dir);

        let modules = this.context.modules;
        Object.keys(modules).forEach(moduleKey => {
            let module = modules[moduleKey];
            let metaPath = path.join(dir, module.fileInfo.metaName);
            fs.writeFileSync(metaPath, JSON.stringify(module, null, 4));

            let itemsPath = metaPath.replace('.json', '');
            fse.ensureDirSync(itemsPath);
            Object.keys(module.itemsIndex).forEach(itemId => {
                let itemPath = path.join(itemsPath, itemId + '.json');
                fs.writeFileSync(itemPath, JSON.stringify(module.itemsIndex[itemId], null, 4));
            });
        });

        let [regModule, flatItems] = this.generateRegistryModule(dir);
        fs.writeFileSync(path.join(dir, 'registry.json'), regModule);

        this.generateSearchIndex(dir, flatItems, () => {});
    }

    generateSearchIndex(dir: string, flatItems: any[], cb: () => void) {
        let SearchIndex = require('search-index');
        let options = {
            db: require('memdown'),
            deletable: false,
            fieldedSearch: true,
            indexPath: 'si',
            logLevel: 'error',
            nGramLength: 1,
            fieldsToStore: [ 'id', 'semanticId' ]
        };

        let indexOptions = {
            batchName: 'items',
            fieldOptions: [
                {
                    fieldName: 'name'
                },
                {
                    fieldName: 'semanticId'
                }
            ]
        };

        SearchIndex(options, (err, index) => {
            console.log('search index initialized');
            index.add(flatItems, indexOptions, function(err) {
                console.log('creating index snapshot...');
                index.snapShot(function(readStream) {
                    readStream.pipe(fs.createWriteStream(path.join(dir, 'index.gz')))
                        .on('close', function() {
                        console.log('snapshot completed');
                        cb();
                    });
                });
            });
        });
    }

    generateRegistryModule(dir: string): [string, any[]] {
        let [idMap, semanticIdMap, flatItems] = this.generateIdMap();
        let modules = this.context.modules;
        let files: any = {};
        Object.keys(modules).forEach(moduleKey => {
            let module = modules[moduleKey];
            files[module.fileInfo.withPackage] = module.fileInfo.metaName;
        });

        let packagesInfo = {};
        for (let key of Object.keys(this.context.packages)) {
            packagesInfo[key] = this.context.packages[key];
        }

        let buf = `
{\n
    "mainPackage": "${extractPackage(dir).info.name}",
    "packages": ${ JSON.stringify(packagesInfo, null, 4) },
    "files": ${ JSON.stringify(files, null, 4) },
    "idMap": ${ JSON.stringify(idMap) },
    "semanticIdMap": ${ JSON.stringify(semanticIdMap) }
}`;

        return [buf, flatItems];
    }

}
