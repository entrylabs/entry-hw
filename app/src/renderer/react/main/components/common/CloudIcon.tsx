import React from 'react';
import Styled from 'styled-components';
import { connect } from 'react-redux';
import { CloudModeTypesEnum } from '../../constants/constants';
import { IMapStateToProps } from '../../store';

const CloudIconContainer = Styled.div`
    float: left;
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

const CloudIcon: React.FC<IStateProps> = (props) => {
    if (props.isCloudMode === CloudModeTypesEnum.cloud) {
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

interface IStateProps {
    isCloudMode: CloudModeTypesEnum;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    isCloudMode: state.common.isCloudMode,
});

export default connect(mapStateToProps)(CloudIcon);
