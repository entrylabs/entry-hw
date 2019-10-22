import React from 'react';
import Styled from 'styled-components';

const SearchContainer = Styled.div`
    top: 15px;
    right: 20px;
    position: fixed;
`;

const SearchBar = Styled.input`
    border: solid 1px #fff;
    background: #fff;
    color: black;
    height: 30px;
    padding: 0 10px;
    border-radius: 20px;
    :focus {
        background: #fff;
        color: black;
    }
`;

const SearchButton = Styled.button`
    position: absolute;
    top: 2px;
    right: 4px;
    background: none;
    border: none;
`;

const SearchCloseButton = Styled.button`
    display: none;
    position: absolute;
    top: 7px;
    right: 29px;
    background: none;
    border: none;
    img {
        filter: opacity(40%);
        width: 10px;
        height: 10px;
    }
`


export default () => {
    return (
        <SearchContainer id="search_area">
            <SearchBar id="search_bar"/>
            <SearchButton id="search_button">
                <img src="../images/search_icon.png" alt="검색"/>
            </SearchButton>
            <SearchCloseButton id="search_close_button">
                <img src="../images/search_close.png" alt="검색 닫기"/>
            </SearchCloseButton>
        </SearchContainer>
    );
}
