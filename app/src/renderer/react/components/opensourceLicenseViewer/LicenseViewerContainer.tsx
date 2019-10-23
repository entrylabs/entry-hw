import React from 'react';
import withPreload from '../../hoc/withPreload';

const LicenseViewerContainer = (props: Readonly<Preload>) => {
    return (
        <div id="opensource_license_viewer">
            <div className="select_port_child">
                <div className="title">
                <span className="opensource_label">
                    {props.translator.translate('Opensource lincense')}
                </span>
                    <div className="cancel_icon close_event">
                    </div>
                </div>
                <div className="content">
                <textarea id="opensource_content" readOnly>
                </textarea>
                    <div>
                        <button id="btn_close" className="close_event">
                            {props.translator.translate('Close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withPreload(LicenseViewerContainer);
