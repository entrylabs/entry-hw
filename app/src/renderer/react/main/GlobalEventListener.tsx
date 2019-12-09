import React, { useCallback, useEffect } from 'react';
import { HardwarePageStateEnum } from './constants/constants';
import { IMapDispatchToProps, IMapStateToProps } from './store';
import { changeCurrentPageState } from './store/modules/common';
import { connect } from 'react-redux';

interface IProps extends IDispatchProps, IStateProps {}

const GlobalEventListener: React.FC<IProps> = (props) => {
    const KeyUpHandler = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Backspace') {
            if (props.currentState !== HardwarePageStateEnum.list) {
                props.changeCurrentPageState(HardwarePageStateEnum.list);
            }
        }
    }, [props.currentState]);

    useEffect(() => {
        window.addEventListener('keydown', KeyUpHandler);

        return () => {
            window.removeEventListener('keydown', KeyUpHandler);
        }
    }, [props.currentState]);

    return <></>;
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

export default connect(mapStateToProps, mapDispatchToProps)(GlobalEventListener);
