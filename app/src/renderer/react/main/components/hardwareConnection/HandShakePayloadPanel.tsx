import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
import {useDispatch} from "react-redux";
import {setHandshakePayload} from "../../store/modules/connection";

const Container = styled.div`
    width: 137px;
    margin-right: -7px;
    padding-top: 30px;
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const HandShakePayloadPanel: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch();
    const onButtonClicked = useCallback(() => {
        const value = inputRef?.current?.value;
        setHandshakePayload(dispatch)(value);
    }, []);

    return (
        <Container>
            <div>
                <span>-------></span>
                <input type="text" ref={inputRef}/>
                <button onClick={onButtonClicked}>Send</button>
            </div>
        </Container>
    );
};

export default HandShakePayloadPanel;
