import React from 'react';
import Styled from 'styled-components';
import HardwareConnectionContainer from './HardwareConnectionContainer';

const HardwareListContainer = Styled.div`
    padding: 40px;
    overflow-y: auto;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    width: 100%;
`;




export default () => {
    return (
        <>
            <div id="alert"/>
            <HardwareListContainer id="hwList"/>
            <HardwareConnectionContainer />

            <div id="select_port_box">
                <div className="select_port_child">
                    <div className="title">
                <span>
                    선택하세요.
                </span>
                        <div className="cancel_icon cancel_event">
                        </div>
                    </div>
                    <div className="content">
                        <div className="description">
                            연결할 COM PORT를 선택하세요.
                        </div>
                        <select multiple size={10} id="select_port">
                        </select>
                        <div>
                            <button id="btn_select_port_cancel" className="cancel_event">취소</button>
                            <button id="btn_select_port">선택</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="errorAlert">
                <div>
                    <img src="../images/alert.png"/>
                    <span className="alertMsg">
                <span className="alertMsg1">하드웨어 연결과 작동 시 예기치 못한 문제가 발생할 수 있습니다.</span>
                <span className="alertMsg2">문제 발생 시 해당 하드웨어 업체에 문의해주세요.</span>
            </span>
                </div>
                <div className="comment">
                    * 하드웨어 연결 프로그램에 등록된 하드웨어들은 각 업체가 제공하고 개발한 것이며, 엔트리교육연구소는 본 프로그램 이외에는 책임지지 않습니다.
                </div>
            </div>
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
        </>
    );
};
