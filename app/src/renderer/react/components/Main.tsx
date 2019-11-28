import React, { useEffect, useState } from 'react';
import HardwareConnectionContainer from './hardwareConnection/HardwareConnectionContainer';
import LicenseViewerContainer from './hardwareList/opensourceLicenseViewer/licenseViewerContainer';
import ErrorAlert from './hardwareList/ErrorAlert';
import SelectPortContainer from './hardwareConnection/SelectPortContainer';
import HardwareListContainer from './hardwareList/HardwareListContainer';
import { connect } from 'react-redux';
import { HardwarePageStateEnum } from '../constants/constants';
import { IMapStateToProps } from '../store';
import AlertTab from './common/AlertTab';
import { IAlertMessage } from '../store/modules/common';

const Main: React.FC<IStateProps> = (props) => {
    const { currentState, isNeedPortSelect, alertMessage } = props;
    const [selectPortCanceled, changePortSelectCanceled] = useState(false);

    useEffect(() => {
        if (currentState === HardwarePageStateEnum.list) {
            changePortSelectCanceled(false);
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
                    {isNeedPortSelect && !selectPortCanceled && <SelectPortContainer
                        handleCancelClicked={() => {
                            changePortSelectCanceled(true);
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
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    alertMessage: state.common.alertMessage,
    currentState: state.common.currentPageState,
    isNeedPortSelect: state.connection.isNeedPortSelect,
});

export default connect(mapStateToProps)(Main);
