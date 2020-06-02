import React, { useCallback, useState } from 'react';
import Styled from 'styled-components';
import { IStoreState } from '../../store';
import { useDispatch, useSelector } from 'react-redux';
import { changePortList, selectPort } from '../../store/modules/connection';
import CloseButton from '../../../../images/btn_close.png';
import usePreload from '../../hooks/usePreload';

const PortBoxContainer = Styled.div`
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
`;

const PortBoxBody = Styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 360px;
    height: 379px;
    flex-direction: column;
    button {
        cursor: pointer;
        height: 47px;
        width: 110px;
    }
`;

const PortBoxTitle = Styled.div`
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

const PortBoxCancelIcon = Styled.div`
    cursor: pointer;
    float: right;
    content: " ";
    width: 22px;
    height: 57px;
    margin-right: 20px;
    display: inline-block;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url(${CloseButton});
`;

const PortBoxContent = Styled.div`
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
    background-color: #fff;
    text-align: center;
    flex: 1;
    width: 100%
`;

const PortBoxDescription = Styled.div`
    font-size: 18px;
    color: #232323;
    margin: 30px 0 20px 0;
`;

const PortBoxSelectElement = Styled.select`
    height: 142px;
    width: 247px;
    font-size: 16px;
    color: #2c2c2c;
    margin-bottom: 33px;
    option {
        padding: 8px 20px 8px 20px;
    }
`;

const SelectButton = Styled.button`
    background: #6e5ae6;
    font-size: 16px;
    color: #fff;
    border: 0px;
    border-radius: 3px;
`;

const CancelButton = Styled.button`
    background: #dbdbdb;
    font-size: 16px;
    color: #9e9e9f;
    border: 0;
    border-radius: 3px;
    margin-right: 11px;
`;

type IProps = {
    handleCancelClicked: () => void;
};

const SelectPortContainer: React.FC<IProps> = (props) => {
    const portList = useSelector<IStoreState, ISerialPortScanData[]>(state => state.connection.portList);
    const { translator } = usePreload();
    const dispatch = useDispatch();
    const [selectedPort, changeSelected] = useState<string>('');

    const onCancelClicked = useCallback(() => {
        props.handleCancelClicked();
        changePortList(dispatch)([]);
    }, []);

    const onPortSelected = useCallback((porName: string) => {
        selectPort(dispatch)(porName);
    }, []);

    return (
        <PortBoxContainer id="select_port_box">
            <PortBoxBody className="select_port_child">
                <PortBoxTitle>
                    <span>
                        {translator.translate('Select')}
                    </span>
                    <PortBoxCancelIcon
                        className="cancel_icon cancel_event"
                        onClick={onCancelClicked}
                    />
                </PortBoxTitle>
                <PortBoxContent>
                    <PortBoxDescription>
                        {translator.translate('Select the COM PORT to connect')}
                    </PortBoxDescription>
                    <PortBoxSelectElement size={10} id="select_port" onChange={(e) => {
                        changeSelected(e.target.value);
                    }}>
                        {portList.map((port, index) => (
                            <option
                                title={port.path} value={port.path} key={`${port.path}-${index}`}
                                onDoubleClick={() => {
                                    onPortSelected(port.path);
                                }}
                            >
                                {port.path}
                            </option>
                        ))}
                    </PortBoxSelectElement>
                    <div>
                        <CancelButton
                            id="btn_select_port_cancel"
                            className="cancel_event"
                            onClick={onCancelClicked}
                        >
                            {translator.translate('Cancel')}
                        </CancelButton>
                        <SelectButton id="btn_select_port" onClick={() => {
                            if (!selectedPort) {
                                alert(translator.translate('Select the COM PORT to connect'));
                            } else {
                                onPortSelected(selectedPort);
                            }
                        }}>
                            {translator.translate('Connect')}
                        </SelectButton>
                    </div>
                </PortBoxContent>
            </PortBoxBody>
        </PortBoxContainer>
    );
};

export default SelectPortContainer;
