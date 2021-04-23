import React from 'react';
import { CloudModeTypesEnum, HardwarePageStateEnum } from '../constants/constants';
import { HardwareStatement } from '../../../../common/constants';
import {
    changeAlertMessage,
    changeCloudMode,
    changeHardwareModuleState,
    changeSocketConnectionState,
    changeStateTitle,
    invalidateBuild,
    IAlertMessage,
} from '../store/modules/common';
import { changePortList } from '../store/modules/connection';
import { connect } from 'react-redux';
import { IMapDispatchToProps, IMapStateToProps } from '../store';

const { translator, ipcRenderer, rendererRouter } = window;

type IProps = IStateProps & IDispatchProps;

class IpcRendererWatchComponent extends React.PureComponent<IProps> {
    constructor(props: Readonly<IProps>) {
        super(props);

        ipcRenderer.removeAllListeners('console');
        ipcRenderer.removeAllListeners('state');
        ipcRenderer.removeAllListeners('portListScanned');
        ipcRenderer.removeAllListeners('cloudMode');
        ipcRenderer.removeAllListeners('socketConnected');
        ipcRenderer.removeAllListeners('invalidAsarFile');

        ipcRenderer.on('invalidAsarFile', () => {
            props.invalidateBuild();
        });

        ipcRenderer.on('console', (event, ...args: any[]) => {
            console.log(...args);
        });

        ipcRenderer.on('state', (event, state: HardwareStatement) => {
            const applyTitle = (title: string) => {
                props.changeStateTitle(translator.translate(title));
            };
            props.changeHardwareModuleState(state);
            rendererRouter.currentState = state;
            console.log('state changed: ', state);

            switch (state) {
                case HardwareStatement.disconnected: {
                    if (props.currentPageState === HardwarePageStateEnum.list) {
                        applyTitle('Select hardware');
                    } else {
                        applyTitle('hardware > disconnected');
                        props.changeAlertMessage({
                            message: translator.translate(
                                'Hardware device is disconnected. Please restart this program.'
                            ),
                        });
                    }
                    break;
                }
                case HardwareStatement.connected: {
                    applyTitle('hardware > connected');
                    props.changeAlertMessage({
                        message: translator.translate('Connected to hardware device.'),
                        duration: 2000,
                    });
                    break;
                }
                case HardwareStatement.scan:
                case HardwareStatement.lost: {
                    applyTitle('hardware > connecting');
                    props.changeAlertMessage({
                        message: translator.translate('Connecting to hardware device.'),
                    });
                    break;
                }
                case HardwareStatement.beforeConnect: {
                    applyTitle('hardware > connecting');
                    const beforeConnectMessage = `${translator.translate(
                        'Connecting to hardware device.'
                    )} ${translator.translate('Please select the firmware.')}`;
                    props.changeAlertMessage({
                        message: beforeConnectMessage,
                    });
                    break;
                }
                case HardwareStatement.scanFailed: {
                    applyTitle('hardware > connection failed');
                    props.changeAlertMessage({
                        message: translator.translate(
                            'Connection failed. please restart application or reconnect manually.'
                        ),
                    });
                    break;
                }
                case HardwareStatement.flash: {
                    props.changeAlertMessage({
                        message: translator.translate('Firmware Uploading...'),
                    });
                }
            }
        });
        ipcRenderer.on('portListScanned', (event, data: ISerialPortScanData[]) => {
            props.changePortList(data);
        });
        ipcRenderer.on('cloudMode', (event, mode: CloudModeTypesEnum) => {
            props.changeCloudMode(mode);
        });
        ipcRenderer.on('socketConnected', (event, isConnected: boolean) => {
            props.changeSocketConnectionState(isConnected);
        });
    }

    render() {
        return null;
    }
}

interface IStateProps {
    currentPageState: HardwarePageStateEnum;
    currentModuleState: HardwareStatement;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    currentPageState: state.common.currentPageState,
    currentModuleState: state.common.moduleState,
});

interface IDispatchProps {
    changeStateTitle: (title: string) => void;
    changeCloudMode: (mode: CloudModeTypesEnum) => void;
    changePortList: (portList: ISerialPortScanData[]) => void;
    changeAlertMessage: (alertMessage: IAlertMessage) => void;
    changeHardwareModuleState: (state: HardwareStatement) => void;
    changeSocketConnectionState: (state: boolean) => void;
    invalidateBuild: () => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeStateTitle: changeStateTitle(dispatch),
    changeCloudMode: changeCloudMode(dispatch),
    changePortList: changePortList(dispatch),
    changeAlertMessage: changeAlertMessage(dispatch),
    changeHardwareModuleState: changeHardwareModuleState(dispatch),
    changeSocketConnectionState: changeSocketConnectionState(dispatch),
    invalidateBuild: invalidateBuild(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(IpcRendererWatchComponent);
