import React from 'react';
import { CloudModeTypesEnum, HardwareModuleStateEnum, HardwarePageStateEnum } from '../constants/constants';
import { changeCloudMode, changeStateTitle } from '../store/modules/common';
import { changePortList } from '../store/modules/connection';
import { connect } from 'react-redux';
import { IMapDispatchToProps, IMapStateToProps } from '../store';

const { translator, ipcRenderer } = window;

type IProps = IStateProps & IDispatchProps;

class IpcRendererWatchComponent extends React.PureComponent<IProps> {
    constructor(props: Readonly<IProps>) {
        super(props);

        ipcRenderer.on('console', (event: string, ...args: any[]) => {
            console.log(...args);
        });

        ipcRenderer.on('state', (event: Electron.Event, state: HardwareModuleStateEnum, data ?: any) => {
            const applyTitle = (title: string) => {
                props.changeStateTitle(translator.translate(title));
            };
            switch (state) {
                case HardwareModuleStateEnum.disconnected: {
                    if (props.currentPageState === HardwarePageStateEnum.list) {
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
            props.changePortList(data);
        });
        ipcRenderer.on('cloudMode', (event: Electron.Event, mode: CloudModeTypesEnum) => {
            props.changeCloudMode(mode);
        });
    }

    render() {
        return null;
    }
}

interface IStateProps {
    currentPageState: HardwarePageStateEnum,
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    currentPageState: state.common.currentPageState,
});

interface IDispatchProps {
    changeStateTitle: (title: string) => void;
    changeCloudMode: (mode: CloudModeTypesEnum) => void;
    changePortList: (portList: ISerialPortScanData[]) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeStateTitle: changeStateTitle(dispatch),
    changeCloudMode: changeCloudMode(dispatch),
    changePortList: changePortList(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(IpcRendererWatchComponent);
