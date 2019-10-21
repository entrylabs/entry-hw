import React from 'react';
import Styled from 'styled-components';

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
            <div id="navigator">
                <button className="navigate_button" id="back"/>
                <button className="navigate_button" id="refresh"/>
            </div>
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
            <ul id="filter_category" className="dropdown" style={{ marginTop: -5 }}>
                <li data-value="all" className="init">
                    <span className="content">하드웨어 유형</span>
                    <div className="arrow"/>
                </li>
                <li data-value="all">
                    <span className="content">전체</span>
                </li>
                <li data-value="robot">
                    <span className="content">로봇형</span>
                </li>
                <li data-value="module">
                    <span className="content">모듈형</span>
                </li>
                <li data-value="board">
                    <span className="content">보드형</span>
                </li>
            </ul>
        </HeaderContainer>
    );
}
