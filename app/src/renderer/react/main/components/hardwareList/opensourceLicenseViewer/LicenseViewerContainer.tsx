import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IStoreState } from '../../../store';
import { toggleLicenseView } from '../../../store/modules/common';
import Styled from 'styled-components';
import CloseButtonImage from '../../../../../images/btn_close.png';
import usePreload from '../../../hooks/usePreload';

const ViewerContainer = Styled.div`
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
`;

const ViewerBody = Styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 80%;
    height: 70%;
    flex-direction: column;
`;

const ViewerTitle = Styled.div`
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    height: 57px;
    line-height: 57px;
    color: #fff;
    font-weight: bold;
    font-size: 20px;
    width: 100%;
    background-color: rgb(0, 185, 0);
    span{
        padding-left:20px;
    }
`;

const CancelIcon = Styled.div`
    cursor: pointer;
    float: right;
    content: " ";
    width: 22px;
    height: 57px;
    margin-right: 20px;
    display: inline-block;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url(${CloseButtonImage});
`;

const ViewerContent = Styled.div`
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    background-color: #fff;
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const LicenseTextArea = Styled.textarea`
    width: 80%;
    flex: 1;
    overflow-x: hidden;
    -webkit-user-select: auto;
    -khtml-user-select: auto;
    -moz-user-select: auto;
    -ms-user-select: auto;
    user-select: auto;
    resize: none;
    padding:10px 10%;
    border: none;
`;

const CloseButton = Styled.button`
    cursor: pointer;
    height: 47px;
    width: 110px;
    margin: 10px;
    background: rgb(28, 136, 80);
    font-size: 16px;
    color: #fff;
    border: 0;
    border-radius: 3px;
`;

const LicenseViewerContainer: React.FC = () => {
    const [content, setContent] = useState<string>('Loading...');
    const { translator, rendererRouter } = usePreload();
    const dispatch = useDispatch();
    const isLicenseShow = useSelector<IStoreState>(
        (state) => state.common.isLicenseShow
    );
    useEffect(() => {
        rendererRouter
            .getOpenSourceContents()
            .then((contents: string) => {
                setContent(contents);
            })
            .catch((e: Error) => {
                console.error(e);
            });
    }, []);

    if (isLicenseShow) {
        return (
            <ViewerContainer>
                <ViewerBody>
                    <ViewerTitle>
                        <span>
                            {translator.translate('Opensource lincense')}
                        </span>
                        <CancelIcon
                            onClick={() => {
                                toggleLicenseView(dispatch)(false);
                            }}
                        />
                    </ViewerTitle>
                    <ViewerContent>
                        <LicenseTextArea readOnly value={content} />
                        <div>
                            <CloseButton
                                onClick={() => {
                                    toggleLicenseView(dispatch)(false);
                                }}
                            >
                                {translator.translate('Close')}
                            </CloseButton>
                        </div>
                    </ViewerContent>
                </ViewerBody>
            </ViewerContainer>
        );
    } else {
        return <div />;
    }
};

export default LicenseViewerContainer;
