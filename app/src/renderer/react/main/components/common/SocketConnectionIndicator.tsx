import React from 'react';
import styled from 'styled-components';


const IndicatorContainer = styled.div`
    float: left;
    margin-right: 10px;
    display: inline-block;
    vertical-align: top;
    font-size: 14px;
    font-weight: bold;
    font-style: normal;
    font-stretch: normal;
    line-height: normal;
    letter-spacing: -0.5px;
    color: white;
`;

const SocketConnectionIndicator: React.FC = () => (
    <IndicatorContainer>
            엔트리 서버 연결 안됨
    </IndicatorContainer>
);

export default SocketConnectionIndicator;
