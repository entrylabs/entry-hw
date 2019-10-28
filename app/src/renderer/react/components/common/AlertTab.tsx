import React, { useEffect, useState } from 'react';
import Styled, { css, keyframes } from 'styled-components';

const ActiveSnackBarKeyFrames = keyframes`
  from {height: 0;}
  to {height: 35px;}
`;

const InActiveSnackBarKeyFrames = keyframes`
  from {height: 35px;} 
  to {height: 0;}
`;

const animation = css`
  animation: ${ActiveSnackBarKeyFrames} 1s forwards;
`;

const AlertTabContainer = Styled.div<{ active: boolean }>`
    overflow: hidden;
    width: 100%;
    background-color: #ffc800;
    color: white;
    font-size: 10pt;
    position: relative;
    text-align: center;
    height: 0;
    line-height: 35px;
    ${(props) => props.active && css`${animation}`}
`;

interface IProps {
    message: string;
    duration?: number;
}

const AlertTab: React.FC<IProps> = (props) => {
    const [show, setShowState] = useState(false);

    useEffect(() => {
        if (props.duration) {
            setTimeout(() => {
                setShowState(false);
            }, props.duration);
        }
    }, [props.duration]);

    useEffect(() => {
        setShowState(true);
    }, [props.message]);

    return (
        <AlertTabContainer active={show}>{props.message}</AlertTabContainer>
    );
};

export default AlertTab;
