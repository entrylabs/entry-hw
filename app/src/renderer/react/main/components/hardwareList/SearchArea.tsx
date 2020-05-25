import React, { useCallback, useEffect, useRef, useState } from 'react';
import Styled from 'styled-components';
import { connect } from 'react-redux';
import { IMapDispatchToProps, IMapStateToProps } from '../../store';
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

const SearchCloseButton = Styled.button`
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
`;

const SearchArea: React.FC<IStateProps & IDispatchProps> = (props) => {
    const [isShowCloseButton, setShowCloseButton] = useState(false);
    const searchBarRef = useRef<HTMLInputElement>(null);
    const searchBarOnChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value === '') {
            setShowCloseButton(false);
        } else {
            setShowCloseButton(true);
        }
    }, []);
    const searchBarOnKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!searchBarRef || !searchBarRef.current) {
            return;
        }
        const searchBar = searchBarRef.current;
        if (event.which === 27) {
            searchBar.value = '';
            props.changeHardwareSearchKeyword(searchBar.value);
        } else if (event.which === 13) {
            props.changeHardwareSearchKeyword(searchBar.value);
        }
    }, []);

    const searchButtonOnClick = useCallback(() => {
        if (!searchBarRef || !searchBarRef.current) {
            return;
        }
        const value = searchBarRef.current.value;
        props.changeHardwareSearchKeyword(value);
    }, []);

    const closeButtonOnClick = useCallback(() => {
        if (!searchBarRef || !searchBarRef.current) {
            return;
        }
        searchBarRef.current.value = '';
        searchButtonOnClick();
        setShowCloseButton(false);
    }, []);

    useEffect(() => {
        searchBarRef && searchBarRef.current && (searchBarRef.current.value = '');
        setShowCloseButton(false);
    }, [props.hardwareFilterCategory]);

    return (
        <SearchContainer id="search_area">
            <SearchBar
                id="search_bar"
                ref={searchBarRef}
                onKeyDown={searchBarOnKeyDown}
                onChange={searchBarOnChange}
            />
            <SearchButton id="search_button" onClick={searchButtonOnClick}>
                <img src={SearchIcon} alt="검색"/>
            </SearchButton>
            {/* 스타일에 넣은 이유는 신규 생성시 전체 렌더가 일어나고 있어서이다. */}
            <SearchCloseButton
                id="search_close_button"
                onClick={closeButtonOnClick}
                style={isShowCloseButton ? {} : { display: 'none' }}
            >
                <img src={SearchCloseIcon} alt="검색 닫기"/>
            </SearchCloseButton>
        </SearchContainer>
    );
};

interface IStateProps {
    hardwareFilterCategory: string;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    hardwareFilterCategory: state.hardware.hardwareFilterCategory,
});

interface IDispatchProps {
    changeHardwareSearchKeyword: (keyword: string) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeHardwareSearchKeyword: changeHardwareSearchKeyword(dispatch),
});


export default connect(mapStateToProps, mapDispatchToProps)(SearchArea);
