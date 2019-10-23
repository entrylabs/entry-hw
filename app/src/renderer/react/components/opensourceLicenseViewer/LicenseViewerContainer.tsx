import React, { useEffect, useState } from 'react';
import withPreload from '../../hoc/withPreload';
import { connect } from 'react-redux';
import { IMapDispatchToProps, IMapStateToProps } from '../../store';
import { LICENSE_VIEW_TOGGLE } from '../../store/modules/common';

type IProps = Preload & IDispatchProps & IStateProps;
const LicenseViewerContainer: React.FC<IProps> = (props) => {
    const [content, setContent] = useState<string>('Loading...');
    useEffect(() => {
        console.log('called UseEffect');
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
            <div id="opensource_license_viewer" style={{ display: 'flex' }}>
                <div className="select_port_child">
                    <div className="title">
                <span className="opensource_label">
                    {props.translator.translate('Opensource lincense')}
                </span>
                        <div className="cancel_icon close_event">
                        </div>
                    </div>
                    <div className="content">
                <textarea id="opensource_content" readOnly value={content}>
                </textarea>
                        <div>
                            <button
                                id="btn_close"
                                className="close_event"
                                onClick={() => {
                                    props.hideLicenseView();
                                }}
                            >
                                {props.translator.translate('Close')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        return <div/>
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
