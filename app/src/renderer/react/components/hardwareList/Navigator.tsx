import React from 'react';
import Styled from 'styled-components';

const NavigatorContainer = Styled.div`
    padding-top: 15px;
    width: 100px;
    margin: 0;
`;
const NavigatorButton = Styled.button<{dimImage: string, enabledImage: string, disabledImage: string}>`
    margin-right: 1px;
    vertical-align: top;
    border: none;
    width: 26px;
    height: 26px;
    background-image: ${props => `url('${props.dimImage}')`};
    background-color: transparent;
    &.active{
        background-image: ${props => `url('${props.disabledImage}')`};
        :hover, :active {
            background-image: ${props => `url('${props.enabledImage}')`};
        }
    }
`;

export default () => (
    <NavigatorContainer id="navigator">
        <NavigatorButton
            id="back"
            dimImage={'../images/btn_back_dim.png'}
            enabledImage={'../images/btn_back_on.png'}
            disabledImage={'../images/btn_back_off.png'}
        />
        <NavigatorButton
            id="refresh"
            dimImage={'../images/btn_refresh_off.png'}
            enabledImage={'../images/btn_refresh_on.png'}
            disabledImage={'../images/btn_refresh_on.png'}
        />
    </NavigatorContainer>
)
