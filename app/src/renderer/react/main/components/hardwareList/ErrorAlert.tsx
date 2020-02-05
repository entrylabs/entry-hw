import React from 'react';
import withPreload from '../../hoc/withPreload';
import Styled from 'styled-components';

const ErrorAlertContainer = Styled.div`
    min-height: 118px;
    background: #f1f1f1;
    padding: 24px 44px 21px;
    overflow: hidden;
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
    color: #fa5536;
    margin-bottom: 6px;
`;

const CommentMessage = Styled.div`
    font-size: 11px;
`;

const ErrorAlert = (props: Preload) => (
        <ErrorAlertContainer>
            <div>
                <ErrorImage src="../images/alert.png"/>
                <ErrorMessageSpanContainer>
                    <MessageSpan>
                        {props.translator.translate(
                            'If unexpected problem occurs while operating,',
                        )}
                    </MessageSpan>
                    <MessageSpan>
                        {props.translator.translate(
                            'contact the hardware company to resolve the problem.',
                        )}
                    </MessageSpan>
                </ErrorMessageSpanContainer>
            </div>
            <CommentMessage>
                {
                    props.translator.translate(
                        '* Entry Labs is not responsible for the extension program and hardware products on this site.',
                    )
                }
            </CommentMessage>
        </ErrorAlertContainer>
    );

export default withPreload(ErrorAlert);
