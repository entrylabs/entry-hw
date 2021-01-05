import React, { useEffect } from 'react';
import HardwareConnectionContainer from './hardwareConnection/HardwareConnectionContainer';
import LicenseViewerContainer from './hardwareList/opensourceLicenseViewer/LicenseViewerContainer';
import ErrorAlert from './hardwareList/ErrorAlert';
import SelectPortContainer from './hardwareConnection/SelectPortContainer';
import HardwareListContainer from './hardwareList/HardwareListContainer';
import { connect } from 'react-redux';
import { HardwarePageStateEnum } from '../constants/constants';
import { IMapDispatchToProps, IMapStateToProps } from '../store';
import AlertTab from './common/AlertTab';
import { IAlertMessage } from '../store/modules/common';
import { changeVisiblePortList } from '../store/modules/connection';

const Main: React.FC<IStateProps & IDispatchProps> = (props) => {
    const {
        currentState, isNeedPortSelect, alertMessage, changeVisiblePortList, isPortSelectCanceled,
    } = props;

    useEffect(() => {
        if (currentState === HardwarePageStateEnum.list) {
            changeVisiblePortList(false);
        }
    }, [currentState]);

    return (
        <>
            {currentState === HardwarePageStateEnum.list && (
                <>
                    <HardwareListContainer/>
                    <ErrorAlert/>
                    <LicenseViewerContainer/>
                </>
            )}
            {currentState === HardwarePageStateEnum.connection && (
                <>
                    {alertMessage && <AlertTab {...alertMessage} />}
                    <HardwareConnectionContainer/>
                    {isNeedPortSelect && !isPortSelectCanceled && <SelectPortContainer
                        handleCancelClicked={() => {
                            changeVisiblePortList(true);
                        }}
                    />}
                </>
            )}
        </>
    );
};

interface IStateProps {
    alertMessage?: IAlertMessage;
    currentState: HardwarePageStateEnum;
    isNeedPortSelect: boolean;
    isPortSelectCanceled: boolean;
}

interface IDispatchProps {
    changeVisiblePortList: (isCanceled: boolean) => void;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    alertMessage: state.common.alertMessage,
    currentState: state.common.currentPageState,
    isNeedPortSelect: state.connection.isNeedPortSelect,
    isPortSelectCanceled: state.connection.isPortSelectCanceled,
});

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeVisiblePortList: changeVisiblePortList(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
