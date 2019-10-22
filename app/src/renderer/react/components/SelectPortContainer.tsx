import React from 'react';

const SelectPortContainer = () => {
    return (
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
    )
};

export default SelectPortContainer;
