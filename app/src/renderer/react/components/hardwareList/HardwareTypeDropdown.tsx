import React, { useState } from 'react';
import Styled from 'styled-components';
import { IMapDispatchToProps, IMapStateToProps } from '../../store';
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
        &:hover,
        &.selected {
            background: white;        
        }
    }
`;

const HardwareCategoryEntries: { [key: string]: string } = {
    all: '전체',
    robot: '로봇형',
    module: '모듈형',
    board: '보드형',
};

const HardwareTypeDropdown: React.FC<IStateProps & IDispatchProps> = (props) => {
    const [isShowList, setShowState] = useState(false);
    const [currentKey, currentValue] = Object
        .entries(HardwareCategoryEntries)
        .find(([keyword]) => props.hardwareFilterCategory === keyword)
    || ['all', HardwareCategoryEntries.all];

    return (
        <DropdownContainer id="filter_category" className="dropdown">
            <DropdownContent
                data-value={currentKey}
                className="init"
                onClick={() => {
                    console.log('isShowList', isShowList);
                    setShowState(!isShowList);
                }}
            >
                <span className="content">{currentValue}</span>
                <div className="arrow"/>
            </DropdownContent>
            {isShowList && Object.entries(HardwareCategoryEntries).map(([keyword, value]) => {
                return (
                    <DropdownContent
                        key={keyword}
                        data-value={keyword}
                        onClick={() => {
                            props.changeCategory(keyword);
                            setShowState(!isShowList)
                        }}
                    >
                        <span className="content">{value}</span>
                    </DropdownContent>
                );
            })}
        </DropdownContainer>
    );
};

interface IStateProps {
    hardwareFilterCategory: string;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    hardwareFilterCategory: state.hardware.hardwareFilterCategory,
});

interface IDispatchProps {
    changeCategory: (category: string) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeCategory: changeHardwareCategory(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(HardwareTypeDropdown);
