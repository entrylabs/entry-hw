import React from 'react';
import HardwareConnectionContainer from './hardwareConnection/HardwareConnectionContainer';
import LicenseViewerContainer from './opensourceLicenseViewer/licenseViewerContainer';
import ErrorAlert from './ErrorAlert';
import SelectPortContainer from './SelectPortContainer';
import HardwareListContainer from './hardwareList/HardwareListContainer';
import { connect } from 'react-redux';
import { HardwarePageStateEnum } from '../constants/constants';
import { IMapStateToProps } from '../store';
import AlertTab from './common/AlertTab';

const Main: React.FC<IStateProps> = (props) => {
    const { currentState, isNeedPortSelect } = props;
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
                    <AlertTab/>
                    <HardwareConnectionContainer/>
                    {isNeedPortSelect && <SelectPortContainer/>}
                </>
            )}
        </>
    );
};

interface IStateProps {
    currentState: HardwarePageStateEnum;
    isNeedPortSelect: boolean;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    currentState: state.common.currentPageState,
    isNeedPortSelect: state.connection.isNeedPortSelect,
});

export default connect(mapStateToProps)(Main);
