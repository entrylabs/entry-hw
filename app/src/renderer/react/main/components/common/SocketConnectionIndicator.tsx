import React from 'react';
import styled from 'styled-components';
import {useSelector} from 'react-redux';
import {IStoreState} from '../../store';
import usePreload from '../../hooks/usePreload';

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
    const { translator } = usePreload();

    return (
        <IndicatorContainer>
            {
                isSocketConnected
                    ? translator.translate('Connected to the Entry server')
                    : translator.translate('Disconnected from the Entry server')

            }
        </IndicatorContainer>
    );
};

export default SocketConnectionIndicator;
