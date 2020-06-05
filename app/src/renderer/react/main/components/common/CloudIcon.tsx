import React from 'react';
import Styled from 'styled-components';
import Cloud from '../../../../images/cloud.png';

const CloudIconContainer = Styled.div`
    float: left;
    .cloud_icon {
        display: inline-block;
        background-size: contain;
        background: url(${Cloud}) no-repeat;
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

const CloudIcon: React.FC = () => (
    <CloudIconContainer id={'cloud_icon'}>
        <span className="cloud_icon"/>
        <span className="cloud_text">Cloud Mode</span>
    </CloudIconContainer>
);

export default CloudIcon;
