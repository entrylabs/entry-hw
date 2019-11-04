import React, { useEffect, useState } from 'react';
import Styled, { css, Keyframes, keyframes } from 'styled-components';
import { IAlertMessage } from '../../store/modules/common';

type ScrollType = 'scroll' | 'reverse' | undefined

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

const AlertTabContainer = Styled.div<{ scroll: ScrollType }>`
    overflow: hidden;
    width: 100%;
    background-color: #ffc800;
    color: white;
    font-size: 10pt;
    position: relative;
    text-align: center;
    height: 0;
    line-height: 35px;
    ${(props) => {
    const { scroll } = props;
    switch (scroll) {
        case 'scroll':
            return animation(ScrollDownKeyFrames);
        case 'reverse':
            return animation(ScrollUpKeyFrames);
        default:
            return 'height: 0';
    }
}}
`;

interface IProps extends IAlertMessage {
}

const AlertTab: React.FC<IProps> = (props) => {
    const [scrollType, changeScrollType] = useState<ScrollType>(undefined);
    const { message, duration } = props;

    useEffect(() => {
            changeScrollType('scroll');
    }, [message]);

    useEffect(() => {
        if (duration) {
            setTimeout(() => {
                changeScrollType('reverse');
            }, duration);
        }
    }, [duration]);

    return (
        <AlertTabContainer scroll={scrollType}>{message}</AlertTabContainer>
    );
};

export default AlertTab;
