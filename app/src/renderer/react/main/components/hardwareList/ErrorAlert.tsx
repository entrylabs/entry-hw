import React from 'react';
import Styled from 'styled-components';
import AlertImage from '../../../../images/alert.png';
import usePreload from '../../hooks/usePreload';

const ErrorAlertContainer = Styled.div`
    min-height: 75px;
    background: #f1f1f1;
    padding: 24px 44px 21px;
    overflow: hidden;
    display:flex;
    flex-direction:column;
    align-items:center;
`;

const ErrorImage = Styled.img`
    margin-right: 15px;
`;

const ErrorMessageSpanContainer = Styled.span`
    display: inline-block;
    margin-bottom: 6px;
`;

const MessageSpan = Styled.span`
    display: block;
    font-size: 17px;
    font-weight: bold;
    color: black;
`;

const CommentMessage = Styled.div`
    font-size: 11px;
`;

const ErrorAlert = () => {
    const { translator } = usePreload();
    return (
        <ErrorAlertContainer>
            <div>
                <ErrorImage src={AlertImage} />
                <ErrorMessageSpanContainer>
                    <MessageSpan>
                        {translator.translate(
                            'If unexpected problem occurs while operating,'
                        )}
                    </MessageSpan>
                    <MessageSpan>
                        {translator.translate(
                            'contact the hardware company to resolve the problem.'
                        )}
                    </MessageSpan>
                </ErrorMessageSpanContainer>
            </div>

            <CommentMessage>
                {translator.translate(
                    '* Entry Labs is not responsible for the extension program and hardware products on this site.'
                )}
            </CommentMessage>
        </ErrorAlertContainer>
    );
};

export default ErrorAlert;
