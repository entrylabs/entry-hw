import React from 'react';

const LicenseViewerContainer = () => {
    return (
        <div id="opensource_license_viewer">
            <div className="select_port_child">
                <div className="title">
                <span className="opensource_label">
                    오픈소스 라이선스
                </span>
                    <div className="cancel_icon close_event">
                    </div>
                </div>
                <div className="content">
                <textarea id="opensource_content" readOnly>
                </textarea>
                    <div>
                        <button id="btn_close" className="close_event">닫기</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LicenseViewerContainer;
