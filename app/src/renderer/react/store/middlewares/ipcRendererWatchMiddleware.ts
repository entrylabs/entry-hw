import { AnyAction, Middleware } from 'redux';
import { IStoreState } from '../index';
import { Dispatch } from 'react';
import { CloudModeTypesEnum, HardwareModuleStateEnum, HardwarePageStateEnum } from '../../constants/constants';
import { changeCloudMode, changeStateTitle } from '../modules/common';
import { changePortList } from '../modules/connection';

const { translator, ipcRenderer, rendererRouter } = window;

ipcRenderer.on('console', (event: string, ...args: any[]) => {
    console.log(...args);
});

const ipcRendererWatchMiddleware: Middleware = ({ getState }: { getState: () => IStoreState }) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
    ipcRenderer.on('state', (event: Electron.Event, state: HardwareModuleStateEnum, data ?: any) => {
        const applyTitle = (title: string) => {
            changeStateTitle(next)(translator.translate(title));
        };
        switch (state) {
            case HardwareModuleStateEnum.disconnected: {
                if (getState().common.currentPageState === HardwarePageStateEnum.list) {
                    applyTitle('Select hardware');
                } else {
                    applyTitle('hardware > disconnected');
                }
                break;
            }
            case HardwareModuleStateEnum.connected: {
                applyTitle('hardware > connected');
                break;
            }
            case HardwareModuleStateEnum.lost: {
                applyTitle('hardware > connecting');
                break;
            }
        }
    });
    ipcRenderer.on('portListScanned', (event: Electron.Event, data: ISerialPortScanData[]) => {
        changePortList(next)(data);
    });
    ipcRenderer.on('cloudMode', (event: Electron.Event, mode: CloudModeTypesEnum) => {
        changeCloudMode(next)(mode);
    });
    next(action);
};

export default ipcRendererWatchMiddleware;
