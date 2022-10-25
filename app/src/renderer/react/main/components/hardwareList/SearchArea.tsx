import React, { useCallback, useEffect, useRef, useState } from 'react';
import Styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { IStoreState } from '../../store';
import { changeHardwareSearchKeyword } from '../../store/modules/hardware';
import SearchIcon from '../../../../images/search_icon.png';
import SearchCloseIcon from '../../../../images/search_close.png';

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

const SearchImage = Styled.img`
    width: 100%;
    height:100%;
    padding-top:4px;
`;

const SearchArea: React.FC = () => {
    const hardwareFilterCategory = useSelector<IStoreState>(
        (state) => state.hardware.hardwareFilterCategory
    );
    const changeSearchKeywordAction = changeHardwareSearchKeyword(
        useDispatch()
    );

    const searchBarRef = useRef<HTMLInputElement>(null);
    const searchBarOnChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            changeSearchKeywordAction(event.target.value);
        },
        []
    );

    const searchButtonOnClick = useCallback(() => {
        if (!searchBarRef || !searchBarRef.current) {
            return;
        }
        const value = searchBarRef.current.value;
        changeSearchKeywordAction(value);
    }, []);

    useEffect(() => {
        searchBarRef &&
            searchBarRef.current &&
            (searchBarRef.current.value = '');
    }, [hardwareFilterCategory]);

    return (
        <SearchContainer id="search_area">
            <SearchBar
                id="search_bar"
                ref={searchBarRef}
                // onKeyDown={searchBarOnKeyDown}
                onChange={searchBarOnChange}
            />
            <SearchButton id="search_button" onClick={searchButtonOnClick}>
                <SearchImage src={SearchIcon} alt="검색" />
            </SearchButton>
        </SearchContainer>
    );
};

export default SearchArea;
