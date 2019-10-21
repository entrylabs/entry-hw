import React from 'react';
import Styled from 'styled-components';
import Navigator from './Navigator';
import HardwareTypeDropdown from './HardwareTypeDropdown';
import CloudIcon from './CloudIcon';

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

export default () => {
    return (
        <HeaderContainer>
            <Navigator/>
            <Title id="title">하드웨어 선택</Title>
            <div id="search_area">
                <input id="search_bar"/>
                <button id="search_button">
                    <img src="../images/search_icon.png" alt="검색"/>
                </button>
                <button id="search_close_button">
                    <img src="../images/search_close.png" alt="검색 닫기"/>
                </button>
            </div>
            <CloudIcon />
            <HardwareTypeDropdown />
        </HeaderContainer>
    );
}
