import React from 'react';
import { range } from 'lodash';
import Styled from 'styled-components';

const ProgressContainer = Styled.div`
    width: 137px;
    margin-right: -7px;
    padding-top: 22px;
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const ProgressDot = Styled.div`
    width: 10px;
    height: 10px;
    border-radius: 5px;
    display: inline-block;
    background-color: #ccc;
    margin-right: 9px;
    margin-bottom: 35px;
`;

export default () => {
    return (
        <ProgressContainer>
            {
                range(16)
                    .map((number) => (
                        <ProgressDot key={number}/>
                    ))
            }
        </ProgressContainer>
    );
}
