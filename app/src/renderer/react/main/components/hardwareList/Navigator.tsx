import React, { useCallback } from 'react';
import Styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { IStoreState } from '../../store';
import { HardwarePageStateEnum } from '../../constants/constants';
import { changeCurrentPageState } from '../../store/modules/common';

import backButtonDimImage from '../../../../images/btn_back_dim.png';
import backButtonOnImage from '../../../../images/btn_back_on.png';
import backButtonOffImage from '../../../../images/btn_back_off.png';

import refreshButtonOnImage from '../../../../images/btn_refresh_on.png';
import refreshButtonOffImage from '../../../../images/btn_refresh_off.png';
import usePreload from '../../hooks/usePreload';

const NavigatorContainer = Styled.div`
    width: 100px;
    margin: 0;
`;
const NavigatorButton = Styled.button<{ dimImage: string, enabledImage: string, disabledImage: string }>`
    margin-right: 1px;
    vertical-align: top;
    border: none;
    width: 26px;
    height: 26px;
    background-image: ${props => `url('${props.dimImage}')`};
    background-color: transparent;
    &.active{
        background-image: ${props => `url('${props.disabledImage}')`};
        :hover, :active {
            background-image: ${props => `url('${props.enabledImage}')`};
        }
    }
`;

const Navigator: React.FC = () => {
    const currentState = useSelector<IStoreState>(state => state.common.currentPageState);
    const dispatch = useDispatch();
    const { translator, rendererRouter } = usePreload();

    const onRefreshClicked = useCallback(() => {
        if (
            confirm(translator.translate('Do you want to restart the program?'))
        ) {
            rendererRouter.reloadApplication();
        }
    }, []);
    const onBackClicked = useCallback(() => {
        changeCurrentPageState(dispatch)(HardwarePageStateEnum.list);
    }, []);

    return (
        <NavigatorContainer id="navigator">
            <NavigatorButton
                id="back"
                dimImage={backButtonDimImage}
                enabledImage={backButtonOnImage}
                disabledImage={backButtonOffImage}
                onClick={() => {
                    currentState !== HardwarePageStateEnum.list && onBackClicked();
                }}
                className={currentState !== HardwarePageStateEnum.list ? 'active' : ''}
            />
            <NavigatorButton
                dimImage={refreshButtonOffImage}
                enabledImage={refreshButtonOnImage}
                disabledImage={refreshButtonOnImage}
                onClick={onRefreshClicked}
            />
        </NavigatorContainer>
    );
};

export default Navigator;
