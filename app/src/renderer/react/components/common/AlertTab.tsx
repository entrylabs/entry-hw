import React, { useEffect, useState } from 'react';
import Styled, { css, Keyframes, keyframes } from 'styled-components';
import { IAlertMessage } from '../../store/modules/common';
import Transition, { ENTERED, ENTERING, EXITED, EXITING, TransitionStatus } from 'react-transition-group/Transition';

const ScrollDownKeyFrames = keyframes`
  from {height: 0;}
  to {height: 35px;}
`;

const ScrollUpKeyFrames = keyframes`
  from {height: 35px;} 
  to {height: 0;}
`;

const animation = (keyFrame: Keyframes) => css`
  animation: ${keyFrame} 1s forwards;
`;

const AlertTabContainer = Styled.div<{ state: TransitionStatus }>`
    overflow: hidden;
    width: 100%;
    background-color: #ffc800;
    color: white;
    font-size: 10pt;
    position: relative;
    text-align: center;
    height: 0;
    line-height: 35px;
    ${({state}) => {
    console.log(state);
    switch (state) {
        case ENTERING:
        case ENTERED:
            return animation(ScrollDownKeyFrames);
        case EXITING:
        case EXITED:
            return animation(ScrollUpKeyFrames);
        default:
            return 'height: 0';
    }
}}
`;

interface IProps extends IAlertMessage {
}

const AlertTab: React.FC<IProps> = (props) => {
    const [animate, setAnimate] = useState<boolean>(true);
    const { message, duration } = props;

    useEffect(() => {
        setAnimate(true);
    }, [message]);

    useEffect(() => {
        if (duration) {
            setTimeout(() => {
                setAnimate(false);
            }, 3000);
        }
    }, [duration]);

    return (
        <Transition in={animate} timeout={500} unmountOnExit key={message}>
            {(state) => (
                <AlertTabContainer state={state}>{message}</AlertTabContainer>
            )}
        </Transition>
    );
};

export default AlertTab;
