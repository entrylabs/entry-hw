import { AnyAction, Middleware } from 'redux';
import { IStoreState } from '../index';
import { Dispatch } from 'react';
import { CloudModeTypesEnum } from '../../constants/constants';
import { changeCloudMode } from '../modules/common';
import { changePortList } from '../modules/connection';

const { ipcRenderer, rendererRouter } = window;

ipcRenderer.on('console', (event: string, ...args: any[]) => {
    console.log(...args);
});

const ipcRendererWatchMiddleware: Middleware = ({ getState }: { getState: () => IStoreState }) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
    ipcRenderer.on('hardwareListChanged', () => {rendererRouter.refreshHardwareModules.bind(rendererRouter)});
    // ipcRenderer.on('state', (event: Electron.Event, state: string, data ?: any) => {
    //
    // });
    ipcRenderer.on('portListScanned', (event: Electron.Event, data: ISerialPortScanData[]) => {
        changePortList(next)(data);
    });
    ipcRenderer.on('hardwareCloseConfirm', rendererRouter._confirmHardwareClose.bind(rendererRouter));
    ipcRenderer.on('serverMode', (event: Electron.Event, mode: string) => {
        rendererRouter._consoleWriteServerMode(mode);
    });
    ipcRenderer.on('cloudMode', (event: Electron.Event, mode: CloudModeTypesEnum) => {
        changeCloudMode(next)(mode);
    });
    next(action);
};

export default ipcRendererWatchMiddleware;
