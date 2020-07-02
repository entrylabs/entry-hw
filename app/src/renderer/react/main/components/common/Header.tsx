import React from 'react';
import styled from 'styled-components';
import Navigator from '../hardwareList/Navigator';
import HardwareTypeDropdown from '../hardwareList/HardwareTypeDropdown';
import CloudIcon from './CloudIcon';
import SearchArea from '../hardwareList/SearchArea';
import { IStoreState } from '../../store';
import { useSelector } from 'react-redux';
import { CloudModeTypesEnum, HardwarePageStateEnum } from '../../constants/constants';
import SocketConnectionIndicator from './SocketConnectionIndicator';

const HeaderContainer = styled.div`
    min-height: 100px;
    z-index: 1;
    background-color: #5096f5;
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 15px;
`;

const Title = styled.h1`
    color: #fff;
    font-size: 15px;
    margin-top: 8px;
`;

const Header: React.FC = () => {
    const currentState = useSelector<IStoreState, HardwarePageStateEnum>(state => state.common.currentPageState);
    const title = useSelector<IStoreState, string>(state => state.common.stateTitle);
    const isCloudMode = useSelector<IStoreState, CloudModeTypesEnum>(state => state.common.isCloudMode);

    return (
        <HeaderContainer>
            <div id={'upper-header'}>
                <Navigator/>
                {currentState === HardwarePageStateEnum.list && <SearchArea/>}
            </div>
            <Title>{title}</Title>
            <div id={'footer-header'}>
                <SocketConnectionIndicator/>
                {isCloudMode === CloudModeTypesEnum.cloud && <CloudIcon/>}
                {currentState === HardwarePageStateEnum.list && <HardwareTypeDropdown/>}
            </div>
        </HeaderContainer>
    );
};

export default Header;
