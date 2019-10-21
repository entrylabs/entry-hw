import React from 'react';
import Styled from 'styled-components';

const DropdownContainer = Styled.ul`
    float: right;
    margin-right: 20px;
    margin-top: -15px;
    padding: 0;
    border: 1px #4c94f8 solid;
`;

const DropdownContent = Styled.li`
    width: 138px;
    height: 30px;
    list-style-type: none;
    cursor: pointer;
    background-color: white;
    padding-left: 12px;
    .content {
        font-size: 14px;
        font-weight: bold;
        color: #4c94f8;
        line-height: 28px;
    }
    
    &.init {
        border-bottom: 1px #4c94f8 solid;
        &.open {
            .arrow {
                background-image: url('../images/arrow_up.png');
            }
        }
        .arrow {
            width: 30px;
            height: 30px;
            float: right;
            margin: -1px;
            border-left: 1px #4c94f8 solid;
            background-image: url('../images/arrow_down.png');
            background-repeat: no-repeat;
            background-position: center;
        }
    }
    :not(.init) {
        display: none;
        &:hover,
        &.selected {
            background: white;        
        }
    }
`;


export default () => {
    return (
        <DropdownContainer id="filter_category" className="dropdown">
            <DropdownContent data-value="all" className="init">
                <span className="content">하드웨어 유형</span>
                <div className="arrow"/>
            </DropdownContent>
            <DropdownContent data-value="all">
                <span className="content">전체</span>
            </DropdownContent>
            <DropdownContent data-value="robot">
                <span className="content">로봇형</span>
            </DropdownContent>
            <DropdownContent data-value="module">
                <span className="content">모듈형</span>
            </DropdownContent>
            <DropdownContent data-value="board">
                <span className="content">보드형</span>
            </DropdownContent>
        </DropdownContainer>
    )
}
