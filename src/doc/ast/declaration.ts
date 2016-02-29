import {
    Declaration
} from 'typescript';

import { Context } from '../index';
import { Item, ItemType } from '../items';
import * as iface from './interface';
import * as cls from './class';
import * as en from './enum';
import * as typeAlias from './type-alias';
import * as variable from './var';
import * as func from './function';
import * as module from './module';

export function visitTopLevelDeclarations(declarations: Declaration[], ctx: Context, logFailures = true): [Item[], Declaration[]] {
    let items: Item[] = [];
    let rest = declarations.slice().filter(declaration => {
        if (iface.isInterfaceDeclaration(declaration)) {
            items.push(
                iface.visitInterface(declaration, ctx)
            );
            return false;
        } else if (cls.isClassDeclaration(declaration)) {
            items.push(
                cls.visitClass(declaration, ctx)
            );
            return false;
        } else if (en.isEnumDeclaration(declaration)) {
            items.push(
                en.visitEnum(declaration, ctx)
            );
            return false;
        } else if (typeAlias.isTypeAliasDeclaration(declaration)) {
            items.push(
                typeAlias.visitTypeAliasDeclaration(declaration, ctx)
            );
            return false;
        } else if (typeAlias.isTypeAliasDeclaration(declaration)) {
            items.push(
                typeAlias.visitTypeAliasDeclaration(declaration, ctx)
            );
            return false;
        } else if (func.isFunctionDeclaration(declaration)) {
            items.push(
                func.visitFunctionLikeDeclaration(declaration, ItemType.Function, false, ctx)
            );
            return false;
        } else if (func.isMethodSignature(declaration)
            || func.isMethodDeclaration(declaration)) {
            items.push(
                func.visitFunctionLikeDeclaration(declaration, ItemType.Method, true, ctx)
            );
        } else if (variable.isVariableDeclaration(declaration)) {
            items.push(
                variable.visitVariableDeclaration(declaration, ctx)
            );
            return false;
        } else if (variable.isBindingElement(declaration)) {
            items.push(
                variable.visitBindingElement(declaration, ctx)
            );
            return false;
        } else if (module.isModuleDeclaration(declaration)) {
            module.visitModuleDeclaration(declaration, ctx);
            return false;
        } else {
            if (logFailures) {
                console.log('Unknown declaration', declaration.getText(), declaration.kind);
            }
            return true;
        }
    });

    return [items, rest];
}
