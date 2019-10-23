import React from 'react';
import Styled from 'styled-components';
import { IMapDispatchToProps } from '../../store';
import { changeHardwareCategory } from '../../store/modules/hardware';
import { connect } from 'react-redux';

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

const HardwareCategoryEntries: {[key: string]: {keyword: string, value: string}} = {
    all: {keyword: 'all', value: '전체'},
    robot: {keyword: 'robot', value: '로봇형'},
    module: {keyword: 'module', value: '모듈형'},
    board: {keyword: 'board', value: '보드형'},
};

const HardwareTypeDropdown: React.FC<IDispatchProps> = (props) => {
    return (
        <DropdownContainer id="filter_category" className="dropdown">
            <DropdownContent data-value="all" className="init">
                <span className="content">하드웨어 유형</span>
                <div className="arrow"/>
            </DropdownContent>
            {Object.values(HardwareCategoryEntries).map(({keyword, value}) => {
                return (
                    <DropdownContent key={keyword} data-value={keyword}>
                        <span className="content">{value}</span>
                    </DropdownContent>
                )
            })}
        </DropdownContainer>
    );
};

interface IDispatchProps {
    changeCategory: (category: string) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeCategory: changeHardwareCategory(dispatch),
});

export default connect(undefined, mapDispatchToProps)(HardwareTypeDropdown);
