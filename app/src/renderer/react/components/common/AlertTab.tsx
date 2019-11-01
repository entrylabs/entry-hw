import React, { useEffect, useState } from 'react';
import Styled, { css, Keyframes, keyframes } from 'styled-components';

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
        switch(scroll) {
            case 'scroll':
                return animation(ScrollDownKeyFrames);
            case 'reverse':
                return animation(ScrollUpKeyFrames);
            default:
                return 'height: 0';
        }
    }}
`;

interface IProps {
    message?: string;
    duration?: number;
}

let isFirstRun = true;
const AlertTab: React.FC<IProps> = (props) => {
    const [scrollType, changeScrollType] = useState<ScrollType>(undefined);

    useEffect(() => {
        if (!isFirstRun) {
            changeScrollType('scroll');
        }
        isFirstRun = false;
    }, [props.message]);

    useEffect(() => {
        if (!isFirstRun && props.duration) {
        console.log('duration');
            setTimeout(() => {
                changeScrollType('reverse');
            }, props.duration);
        }
        isFirstRun = false;
    }, [props.duration]);

    return (
        <AlertTabContainer scroll={scrollType}>{props.message}</AlertTabContainer>
    );
};

export default AlertTab;
