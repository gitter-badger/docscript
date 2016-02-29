import Service, { Route } from './service';
import PluginRegistry from './plugins';
import { ModuleInfo } from '../doc';
import { Item } from '../doc/items';

export { Route, PluginRegistry }

import ActivityManager from './activity';

export interface SearchResult {
    hits: { id: string, document: { semanticId: string } }[];
}

export interface State {
    activity?: ActivityManager;
    service?: Service;
    route?: Route;
    module?: ModuleInfo;
    item?: Item;
    items?: { [key: string]: Item };
    modules?: { [key: string]: ModuleInfo };
    plugins?: PluginRegistry;
    searchActive?: boolean;
    searchQuery?: string;
    searchIndex?: Worker;
    searchIndexReady?: boolean;
    searchInProgress?: boolean;
    searchResults?: SearchResult;
}

export function defaultState(service: Service, plugins: PluginRegistry, searchIndex: Worker): State {
    return {
        searchActive: false,
        searchQuery: '',
        searchIndex,
        searchInProgress: false,
        searchIndexReady: false,
        activity: new ActivityManager(),
        service,
        plugins,
        modules: {},
        items: {},
        module: null,
        item: null,
        route: {
            pkg: service.getMainPackageName(),
            path: '/'
        }
    };
}
