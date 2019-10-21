import React from 'react';
import Styled from 'styled-components';
import Navigator from './Navigator';
import HardwareTypeDropdown from './HardwareTypeDropdown';

const HeaderContainer = Styled.div`
    flex: none;
    width: 100%;
    height: 100px;
    z-index: 1;
    background-color: #5096f5;
    padding-left: 20px;
`;

export default () => {
    return (
        <HeaderContainer>
            <Navigator/>
            <h1 id="title">하드웨어 선택</h1>
            <div id="search_area">
                <input id="search_bar"/>
                <button id="search_button">
                    <img src="../images/search_icon.png" alt="검색"/>
                </button>
                <button id="search_close_button">
                    <img src="../images/search_close.png" alt="검색 닫기"/>
                </button>
            </div>
            <div id="cloud_icon">
                <span className="cloud_icon"/>
                <span className="cloud_text">Cloud Mode</span>
            </div>
            <HardwareTypeDropdown />
        </HeaderContainer>
    );
}
