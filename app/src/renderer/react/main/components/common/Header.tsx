import React from 'react';
import Styled from 'styled-components';
import Navigator from '../hardwareList/Navigator';
import HardwareTypeDropdown from '../hardwareList/HardwareTypeDropdown';
import CloudIcon from './CloudIcon';
import SearchArea from '../hardwareList/SearchArea';
import { IMapStateToProps } from '../../store';
import { connect } from 'react-redux';
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

const Header: React.FC<IStateProps> = (props) => (
        <HeaderContainer>
            <Navigator/>
            <Title>{props.title}</Title>
            <CloudIcon/>
            {props.currentState === HardwarePageStateEnum.list && (
                <>
                    <SearchArea/>
                    <HardwareTypeDropdown/>
                </>
            )}
        </HeaderContainer>
    );

interface IStateProps {
    currentState: HardwarePageStateEnum;
    title: string;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    currentState: state.common.currentPageState,
    title: state.common.stateTitle,
});

export default connect(mapStateToProps)(Header);
