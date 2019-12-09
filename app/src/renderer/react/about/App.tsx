import ReactDOM from 'react-dom';
import React from 'react';

ReactDOM.render(
    <>
        <div className="container">
            <div className="container_inner">
                <div className="logo_wrapper">
                    <img src="../images/about/logo.png" className="logo"/>
                </div>
                <div>
                    <div className="txtVersion">
                        Version
                        <span id="version"></span>
                        <br/>
                        <a href="#" id="playEntryBtn">
                            https://playentry.org
                        </a>
                    </div>
                    <div>
                        <div className="btnVersionUpdate">
                        </div>
                        <div className="txtAlreadyVersion">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>,
    document.getElementById('__main'),
);

// 첫 렌더가 완료된 후 프로그램을 업데이트한다.
// rendererRouter.checkProgramUpdate();
