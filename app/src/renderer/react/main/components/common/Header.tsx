import React from 'react';
import Styled from 'styled-components';
import Navigator from '../hardwareList/Navigator';
import HardwareTypeDropdown from '../hardwareList/HardwareTypeDropdown';
import CloudIcon from './CloudIcon';
import SearchArea from '../hardwareList/SearchArea';
import { IStoreState } from '../../store';
import { useSelector } from 'react-redux';
import { HardwarePageStateEnum } from '../../constants/constants';

const HeaderContainer = Styled.div`
    flex: none;
    width: 100%;
    height: 100px;
    z-index: 1;
    background-color: #5096f5;
    padding-left: 20px;
`;

const Title = Styled.h1`
    width: 200px;
    color: #fff;
    font-size: 15px;
    margin-top: 8px;
`;

const Header: React.FC = () => {
    const currentState = useSelector<IStoreState, HardwarePageStateEnum>(state => state.common.currentPageState);
    const title = useSelector<IStoreState, string>(state => state.common.stateTitle);

    return (
        <HeaderContainer>
            <Navigator/>
            <Title>{title}</Title>
            <CloudIcon/>
            {currentState === HardwarePageStateEnum.list && (
                <>
                    <SearchArea/>
                    <HardwareTypeDropdown/>
                </>
            )}
        </HeaderContainer>
    );
};

export default Header;
