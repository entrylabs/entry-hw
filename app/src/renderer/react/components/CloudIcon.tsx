import React from 'react';
import Styled from 'styled-components';

const CloudIconContainer = Styled.div`
    display: none;
    float: left;
    margin-top: 10px;
    margin-right: 20px;
    .cloud_icon {
        display: inline-block;
        background-size: contain;
        background: url('../images/cloud.png') no-repeat;
        width: 22px;
        height: 14px;
    }
    .cloud_text {
        display: inline-block;
        vertical-align: top;
        font-size: 14px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: -0.5px;
        color: white;
    }
`;


export default () => (
    <CloudIconContainer id={'cloud_icon'}>
        <span className="cloud_icon"/>
        <span className="cloud_text">Cloud Mode</span>
    </CloudIconContainer>
);
