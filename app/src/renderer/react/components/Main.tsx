import React from 'react';
import HardwareConnectionContainer from './hardwareConnection/HardwareConnectionContainer';
import LicenseViewerContainer from './opensourceLicenseViewer/licenseViewerContainer';
import ErrorAlert from './ErrorAlert';
import SelectPortContainer from './SelectPortContainer';
import HardwareListContainer from './hardwareList/HardwareListContainer';

const Main: React.FC = () => {
    return (
        <>
            <div id="alert"/>
            <HardwareListContainer />
            <ErrorAlert />
            <HardwareConnectionContainer />
            <SelectPortContainer />
            <LicenseViewerContainer />
        </>
    );
};

export default Main;
