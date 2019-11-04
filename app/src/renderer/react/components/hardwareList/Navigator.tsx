import React, { useCallback } from 'react';
import Styled from 'styled-components';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapDispatchToProps, IMapStateToProps } from '../../store';
import { HardwarePageStateEnum } from '../../constants/constants';
import { changeCurrentPageState } from '../../store/modules/common';

const NavigatorContainer = Styled.div`
    padding-top: 15px;
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

const Navigator: React.FC<IStateProps & IDispatchProps & Preload> = (props) => {
    const onRefreshClicked = useCallback(() => {
        const { translator, rendererRouter } = props;
        if (
            confirm(translator.translate('Do you want to restart the program?'))
        ) {
            rendererRouter.reloadApplication();
        }
    }, []);
    const onBackClicked = useCallback(() => {
        props.changeCurrentPageState(HardwarePageStateEnum.list);
    }, []);

    return (
        <NavigatorContainer id="navigator">
            <NavigatorButton
                id="back"
                dimImage={'../images/btn_back_dim.png'}
                enabledImage={'../images/btn_back_on.png'}
                disabledImage={'../images/btn_back_off.png'}
                onClick={onBackClicked}
                className={props.currentState !== HardwarePageStateEnum.list ? 'active' : ''}
            />
            <NavigatorButton
                dimImage={'../images/btn_refresh_off.png'}
                enabledImage={'../images/btn_refresh_on.png'}
                disabledImage={'../images/btn_refresh_on.png'}
                onClick={onRefreshClicked}
            />
        </NavigatorContainer>
    );
};

interface IStateProps {
    currentState: HardwarePageStateEnum;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    currentState: state.common.currentPageState,
});

interface IDispatchProps {
    changeCurrentPageState: (category: HardwarePageStateEnum) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeCurrentPageState: changeCurrentPageState(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withPreload(Navigator));
