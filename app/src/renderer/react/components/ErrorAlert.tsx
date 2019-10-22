import React from 'react';

const ErrorAlert = () => {
    return (
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
    )
};

export default ErrorAlert;
