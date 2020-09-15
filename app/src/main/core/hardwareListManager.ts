import fs from 'fs';
import path from 'path';
import { cloneDeep, merge, unionWith } from 'lodash';
import { app } from 'electron';
import lt from 'semver/functions/lt';
import valid from 'semver/functions/valid';
import { AvailableTypes } from '../../common/constants';
import getModuleList from './functions/getModuleList';
import createLogger from '../electron/functions/createLogger';
import directoryPaths from './directoryPaths';
import MainRouter from '../mainRouter';
import tar from 'tar';

const logger = createLogger('core/hardwareListManager.ts');

const nameSortComparator = (left: IHardwareConfig, right: IHardwareConfig) => {
    const lName = left.name?.ko?.trim() || left.name;
    const rName = right.name?.ko?.trim() || left.name;

    if (lName > rName) {
        return 1;
    } else if (lName < rName) {
        return -1;
    } else {
        return 0;
    }
};

const platformFilter = (config: IHardwareConfig) =>
    config.platform && config.platform.indexOf(process.platform) > -1;

const onlineModuleSchemaModifier = (schema: IOnlineHardwareConfig): IHardwareConfig => {
    const swapElement: Partial<IHardwareConfig> & IOnlineHardwareConfig = cloneDeep(schema);
    swapElement.name = schema.title;
    swapElement.availableType = AvailableTypes.needDownload;

    delete swapElement?.title;
    delete swapElement?.files;
    return merge(swapElement, schema.properties) as IHardwareConfig;
};

export default class {
    private readonly router?: any;
    public allHardwareList: IHardwareConfig[] = [];

    constructor(router: MainRouter) {
        this.router = router;
        logger.verbose('hardwareListManager created');
    }

    public async updateHardwareList(source: IHardwareConfig[] = []) {
        logger.verbose('hardware List update from file system..');
        try {
            const availables = this.getAllHardwareModulesFromDisk();
            const localMergedList = this.mergeHardwareList(availables, source);
            this.updateAndNotifyHardwareListChanged(localMergedList);

            const onlineModuleList = await this.getHardwareModulesFromOnline();
            const onlineMergedList = this.mergeHardwareList(this.allHardwareList, onlineModuleList);
            this.updateAndNotifyHardwareListChanged(onlineMergedList);
        } catch (e) {
            logger.error('hardware list update failed with error', e);
        }
    }

    public getHardwareById(id: string) {
        return this.allHardwareList.find((hardware) => hardware.id === id);
    }

    private mergeHardwareList(base: IHardwareConfig[], target: IHardwareConfig[]) {
        const mergedList = unionWith<IHardwareConfig>(base, target, (src, ori) => {
            if (ori.id === src.id) {
                if (
                    !ori.version ||
                    lt(valid(ori.version) as string, valid(src.version) as string)
                ) {
                    // legacy 는 moduleName 이 없기 때문에 서버에 요청을 줄 인자가 없다.
                    ori.moduleName = src.moduleName;
                    ori.availableType = AvailableTypes.needUpdate;
                }
                return true;
            }
            return false;
        });

        return mergedList.filter(platformFilter).sort(nameSortComparator);
    }

    private updateAndNotifyHardwareListChanged(newHardwareList: any[]) {
        const message =
            'hardware list update from file system.\n' +
            `current hardware count: ${this.allHardwareList?.length}\n` +
            `new hardware counts: ${newHardwareList.length}`;

        logger.info(message);
        this.allHardwareList = newHardwareList;
        this.notifyHardwareListChanged();
    }

    private async getHardwareModulesFromOnline(): Promise<IHardwareConfig[]> {
        logger.verbose('hardware List update from online..');
        try {
            const onlineList = await getModuleList();
            if (!onlineList || onlineList.length === 0) {
                return [];
            }

            const moduleList = onlineList.map(onlineModuleSchemaModifier);

            logger.info(
                `online hardware list received.\nlist: ${moduleList
                    .map(
                        (module) =>
                            `${module.id}|${
                                module.name?.ko || module.name?.en || module.moduleName
                            }`
                    )
                    .join(',')}`
            );

            return moduleList;
        } catch (e) {
            logger.warn(`online hardware list update failed ${JSON.stringify(e)}`);
            return [];
        }
    }

    private getAllHardwareModulesFromDisk(): any[] {
        try {
            if (!fs.existsSync(directoryPaths.modules())) {
                fs.mkdirSync(directoryPaths.modules(), { recursive: true });
            }
            return fs
                .readdirSync(directoryPaths.modules())
                .filter((file) => !!file.match(/\.json$/))
                .map((file) => {
                    const bufferData = fs.readFileSync(path.join(directoryPaths.modules(), file));
                    const configJson = JSON.parse(bufferData.toString());
                    configJson.availableType = AvailableTypes.available;
                    return configJson;
                })
                .filter(platformFilter)
                .sort(nameSortComparator);
        } catch (e) {
            console.error('error occurred while reading module json files', e);
            return [];
        }
    }
    async updateHardwareListWithPack(filePath: string) {
        const modulePath = path.join(app.getPath('appData'), 'entry-hw-modules');
        logger.info(`extract files on ${modulePath}`);
        if (!fs.existsSync(modulePath)) {
            fs.mkdirSync(modulePath, { recursive: true });
        }
        try {
            await fs.createReadStream(filePath).pipe(
                require('unzipper')
                    .Extract({ path: modulePath })
                    .on('close', () => {
                        logger.info('EXTRACT DONE');
                        this.updateHardwareList();
                    })
            );
            return;
        } catch (e) {
            logger.info(e);
            logger.info(`hardware list update from pack failed, path: ${modulePath}`);
        }
    }
    private notifyHardwareListChanged() {
        this.router && this.router.sendEventToMainWindow('hardwareListChanged');
    }
}
