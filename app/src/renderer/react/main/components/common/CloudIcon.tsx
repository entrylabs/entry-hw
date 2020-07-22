import React from 'react';
import Styled from 'styled-components';
import {useSelector} from 'react-redux';
import {CloudModeTypesEnum} from '../../constants/constants';
import {IStoreState} from '../../store';
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

const CloudIcon: React.FC = () => {
    const isCloudMode = useSelector<IStoreState>(state => state.common.isCloudMode);

    if (isCloudMode === CloudModeTypesEnum.cloud) {
        return (
            <CloudIconContainer id={'cloud_icon'}>
                <span className="cloud_icon"/>
                <span className="cloud_text">Cloud Mode</span>
            </CloudIconContainer>
        );
    } else {
        return <div/>;
    }
};

export default CloudIcon;
