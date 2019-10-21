import React from 'react';
import Styled from 'styled-components';

const NavigatorContainer = Styled.div`
    padding-top: 15px;
    width: 100px;
    margin: 0;
`;
const NavigatorButton = Styled.button<{dimImage: string, onImage: string, offImage: string}>`
    margin-right: 1px;
    vertical-align: top;
    border: none;
    width: 26px;
    height: 26px;
    background-image: ${props => `url('${props.dimImage}')`};
    background-color: transparent;
    &.active{
        background-image: ${props => `url('${props.offImage}')`};
        :hover, :active {
            background-image: ${props => `url('${props.onImage}')`};
        }
    }
`;

export default () => (
    <NavigatorContainer id="navigator">
        <NavigatorButton
            id="back"
            dimImage={'../images/btn_back_dim.png'}
            onImage={'../images/btn_back_on.png'}
            offImage={'../images/btn_back_off.png'}
        />
        <NavigatorButton
            id="refresh"
            dimImage={'../images/btn_refresh_off.png'}
            onImage={'../images/btn_refresh_on.png'}
            offImage={'../images/btn_refresh_on.png'}
        />
    </NavigatorContainer>
)
