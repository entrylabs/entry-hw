import React from 'react';
import Styled from 'styled-components';
import HardwareConnectionContainer from './hardwareConnection/HardwareConnectionContainer';
import LicenseViewerContainer from './opensourceLicenseViewer/licenseViewerContainer';
import ErrorAlert from './ErrorAlert';
import SelectPortContainer from './SelectPortContainer';

const HardwareListContainer = Styled.div`
    padding: 40px;
    overflow-y: auto;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    width: 100%;
`;

export default () => {
    return (
        <>
            <div id="alert"/>
            <HardwareListContainer id="hwList"/>
            <HardwareConnectionContainer />
            <SelectPortContainer />
            <ErrorAlert />
            <LicenseViewerContainer />
        </>
    );
};
