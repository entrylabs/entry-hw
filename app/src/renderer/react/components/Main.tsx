import React from 'react';
import Styled from 'styled-components';

const HardwareListContainer = Styled.div`
    padding: 40px;
    overflow-y: auto;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    width: 100%;
`;

const HardwarePanel = Styled.div`
    display: none;
    flex-grow: 1;
    width: 100%;
`;

const ReferenceDiv = Styled.div`
    margin-bottom: 25px;
    text-align: right;
    font-weight: bold;
    line-height: 25px;
    font-size: 14px;
    color: #595757;
`;

const ReferenceMidDiv = Styled.div`
    margin: auto;
    height: 100%;
`;

const ReferenceContentSpan = Styled.span`
    width: 100%;
    height: 100%;
    text-align: left;
    cursor: pointer;
    text-decoration: underline;
`;


export default () => {
    return (
        <>
            <div id="alert"/>
            <HardwareListContainer id="hwList"/>
            <HardwarePanel id="hwPanel">
                <ReferenceMidDiv>
                    <ReferenceDiv id="reference">
                        <div id="emailArea">
                            <span id="emailTitle"/>
                            <ReferenceContentSpan id="email"/>
                        </div>
                        <div id="urlArea">
                            <span id="urlTitle"/>
                            <ReferenceContentSpan id="url"/>
                        </div>
                        <div id="videoArea">
                            <span id="videoTitle"/>
                            <ReferenceContentSpan id="video"/>
                        </div>
                    </ReferenceDiv>
                    <div id="client" className="hwPanelElement">
                        <img src="../images/computer.png" alt={''}/>
                        <div id="driverButtonSet">
                            {/*// <!--<button id="driver" class="hwPanelBtn"></button>-->*/}
                        </div>
                    </div>
                    <div id="progress" className="hwPanelElement">
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                        <div className="progressDot"/>
                    </div>
                    <div id="hardware" className="hwPanelElement">
                        <img id="selectedHWThumb" alt={''}/>
                        <div id="firmwareButtonSet">
                            <button name="firmware" className="hwPanelBtn"/>
                        </div>
                    </div>
                </ReferenceMidDiv>
            </HardwarePanel>

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
