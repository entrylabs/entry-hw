import React, { useEffect, useState } from 'react';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapDispatchToProps, IMapStateToProps } from '../../store';
import { LICENSE_VIEW_TOGGLE } from '../../store/modules/common';
import Styled from 'styled-components';

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
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    height: 57px;
    padding-left: 20px;
    line-height: 57px;
    color: #fff;
    font-weight: bold;
    font-size: 20px;
    width: 100%;
    background-color: #2a7def;
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
    background-image: url(../images/btn_close.png);
`;

const ViewerContent = Styled.div`
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
    background-color: #fff;
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const LicenseTextArea = Styled.textarea`
    width: 100%;
    flex: 1;
    overflow-x: hidden;
    -webkit-user-select: auto;
    -khtml-user-select: auto;
    -moz-user-select: auto;
    -ms-user-select: auto;
    user-select: auto;
    resize: none;
`;

const CloseButton = Styled.button`
    cursor: pointer;
    height: 47px;
    width: 110px;
    margin: 10px;
    background: #6e5ae6;
    font-size: 16px;
    color: #fff;
    border: 0;
    border-radius: 3px;
`;


type IProps = Preload & IDispatchProps & IStateProps;
const LicenseViewerContainer: React.FC<IProps> = (props) => {
    const [content, setContent] = useState<string>('Loading...');
    useEffect(() => {
        props.rendererRouter.getOpensourceContents()
            .then((contents: string) => {
                setContent(contents);
            })
            .catch((e: Error) => {
                console.error(e);
            });
    }, []);

    if (props.isLicenseShow) {
        return (
            <ViewerContainer>
                <ViewerBody>
                    <ViewerTitle>
                            {props.translator.translate('Opensource lincense')}
                        <CancelIcon onClick={() => {
                            props.hideLicenseView();
                        }}/>
                    </ViewerTitle>
                    <ViewerContent>
                        <LicenseTextArea readOnly value={content}/>
                        <div>
                            <CloseButton
                                onClick={() => {
                                    props.hideLicenseView();
                                }}
                            >
                                {props.translator.translate('Close')}
                            </CloseButton>
                        </div>
                    </ViewerContent>
                </ViewerBody>
            </ViewerContainer>
        );
    } else {
        return <div/>;
    }
};

interface IStateProps {
    isLicenseShow: boolean;
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    isLicenseShow: state.common.isLicenseShow,
});

interface IDispatchProps {
    hideLicenseView: () => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    hideLicenseView: () => dispatch({ type: LICENSE_VIEW_TOGGLE, payload: false }),
});

export default connect(mapStateToProps, mapDispatchToProps)(withPreload(LicenseViewerContainer));
