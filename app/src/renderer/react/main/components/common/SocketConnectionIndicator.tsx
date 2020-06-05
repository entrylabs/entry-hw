import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { IStoreState } from '../../store';

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

const SocketConnectionIndicator: React.FC = () => {
    const isSocketConnected = useSelector<IStoreState>(state => state.common.isSocketConnected);
    return (
        <IndicatorContainer>
            {
                isSocketConnected
                    ? '엔트리 서버 연결됨'
                    : '엔트리 서버 연결 안됨'

            }
        </IndicatorContainer>
    );
};

export default SocketConnectionIndicator;
