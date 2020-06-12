import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { setHandshakePayload } from '../../store/modules/connection';
import RightConnectionArrowImage from '../../../../images/connection-arrow.png';
import LeftConnectionArrowImage from '../../../../images/connection-arrow-2.png';
import usePreload from '../../hooks/usePreload';

const Container = styled.div`
    width: 240px;
    display: inline-block;
    height: 100%;
    text-align: center;
    vertical-align: top;
`;

const IndicateTextDiv = styled.div<{ isValid: boolean }>`
    font-size: 12px;
    font-weight: bold;
    color: ${({ isValid }) => (isValid ? '#979797' : '#fb5533')};
    
    margin-bottom: 25px;
`;

enum SendButtonState { inactive, active, sending }

const SendButton = styled.button<{ state: SendButtonState }>`
    width: 62px;
    height: 40px;
    border-radius: 4px;
    border: ${({ state }) => (state === SendButtonState.active ? 'none' : 'solid 1px #e2e2e2')}
    background-color: ${({ state }) => {
        if (state === SendButtonState.sending) {
            return '#6e5ae6';
        } else if (state === SendButtonState.active) {
            return '#4f80ff';
        } else {
            return '#f9f9f9';
        }
    }};
    cursor: ${({ state }) => (state === SendButtonState.inactive ? 'not-allowed' : 'pointer')}
    
    letter-spacing: -0.33px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: ${({ state }) => (state === SendButtonState.inactive ? '#cbcbcb' : '#ffffff')};
`;

const SendInput = styled.input<{ state: SendButtonState }>`
    width: 62px;
    height: 40px;
    border-radius: 4px;
    border: solid 1px #e2e2e2;
    background-color: ${({ state }) => (state === SendButtonState.sending ? '#f9f9f9' : '#ffffff')};
    
    letter-spacing: -0.33px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: ${({ state }) => (state === SendButtonState.sending ? '#cbcbcb' : '#2c313d')};
`;

const ArrowImageDiv = styled.div<{ image: string }>`
    min-height: 40px;
    line-height: 40px;
    background-image: url(${props => props.image});
    background-repeat: no-repeat;
    background-position: center;
    
    margin-bottom: 16px;
`;

const HandShakePayloadPanel: React.FC = () => {
    const { translator } = usePreload();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isTextShowValid, setTextShowValid] = useState(true);
    const [indicatorText, setIndicatorText] = useState(translator.translate(
        'Please enter a value for hardware connection.',
    ));
    const [currentState, setButtonState] = useState(SendButtonState.inactive);

    const dispatch = useDispatch();

    const onPayloadChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const isValid = !!/^[a-zA-Z0-9]+$/.exec(e.target.value);
        if (isValid) {
            setButtonState(SendButtonState.active);
            setIndicatorText(translator.translate('Please enter a value for hardware connection.'));
        } else {
            setButtonState(SendButtonState.inactive);
            setIndicatorText(translator.translate('Please enter a valid value.'));
        }

        setTextShowValid(isValid); // initial state 만 다르고 위와 동일하다
    }, []);

    const onButtonClicked = useCallback(() => {
        const ref = inputRef?.current;
        if (currentState === SendButtonState.active) {
            setButtonState(SendButtonState.sending);
            setIndicatorText(translator.translate('Please wait until the hardware is connected.'));
            setHandshakePayload(dispatch)(ref?.value);
        } else if (currentState === SendButtonState.sending) {
            setButtonState(SendButtonState.active);
        } else if (currentState === SendButtonState.inactive) {
            ref?.focus();
        }
    }, [currentState]);

    return (
        <Container>
            <div>
                <IndicateTextDiv isValid={isTextShowValid}>{indicatorText}</IndicateTextDiv>
                <ArrowImageDiv image={LeftConnectionArrowImage}>
                    <SendInput
                        onChange={onPayloadChanged}
                        disabled={currentState === SendButtonState.sending}
                        state={currentState}
                        ref={inputRef}
                    />
                </ArrowImageDiv>
                <ArrowImageDiv image={RightConnectionArrowImage}>
                    <SendButton onClick={onButtonClicked} state={currentState}>{
                        currentState === SendButtonState.sending
                            ? translator.translate('Reset')
                            : translator.translate('Set')
                    }</SendButton>
                </ArrowImageDiv>
            </div>
        </Container>
    );
};

export default HandShakePayloadPanel;
