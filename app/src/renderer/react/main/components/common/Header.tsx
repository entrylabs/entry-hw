import React from 'react';
import styled from 'styled-components';
import Navigator from '../hardwareList/Navigator';
// import HardwareTypeDropdown from '../hardwareList/HardwareTypeDropdown';
import CloudIcon from './CloudIcon';
import SearchArea from '../hardwareList/SearchArea';
import { IStoreState } from '../../store';
import { useSelector } from 'react-redux';
import {
    CloudModeTypesEnum,
    HardwarePageStateEnum,
} from '../../constants/constants';
import SocketConnectionIndicator from './SocketConnectionIndicator';

const HeaderContainer = styled.div`
    height: 85px;
    z-index: 1;
    background-color: #00b900;
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 15px;
`;

const Title = styled.h1`
    color: #fff;
    font-size: 15px;
    margin-top: 8px;
    margin-bottom: 3px;
`;

const CloudIndicator = styled.div`
    margin-bottom: 10px;
    height: 18px;
`;

const Header: React.FC = () => {
    const currentState = useSelector<IStoreState, HardwarePageStateEnum>(
        (state) => state.common.currentPageState
    );
    const title = useSelector<IStoreState, string>(
        (state) => state.common.stateTitle
    );
    const isCloudMode = useSelector<IStoreState, CloudModeTypesEnum>(
        (state) => state.common.isCloudMode
    );

    return (
        <HeaderContainer>
            <div id={'upper-header'}>
                <Navigator />
                {currentState === HardwarePageStateEnum.list && <SearchArea />}
            </div>
            <Title>{title}</Title>
            <CloudIndicator id={'footer-header'}>
                {/* <SocketConnectionIndicator /> */}
                {isCloudMode === CloudModeTypesEnum.cloud && <CloudIcon />}
                {/* {currentState === HardwarePageStateEnum.list && <HardwareTypeDropdown/>} */}
            </CloudIndicator>
        </HeaderContainer>
    );
};

export default Header;
