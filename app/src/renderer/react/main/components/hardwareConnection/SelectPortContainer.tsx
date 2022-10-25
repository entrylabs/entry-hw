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
    z-index:1;
`;

const PortBoxBody = Styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 400px;
    height: 450px;
    flex-direction: column;
    button {
        cursor: pointer;
        height: 47px;
        width: 160px;
    }
`;

const PortBoxTitle = Styled.div`
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    height: 57px;
    line-height: 57px;
    color: #fff;
    font-weight: bold;
    font-size: 20px;
    width: 100%;
    background-color: rgb(28, 136, 80);

    span{
        margin-left: 20px
    }
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
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
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
    height: 190px;
    width: 320px;
    font-size: 16px;
    color: #2c2c2c;
    margin-bottom: 33px;
    option {
        padding: 10px 20px 10px 20px;
        border: solid 0.5px #dddddd;
    }
`;

const SelectButton = Styled.button`
    background: rgb(28, 136, 80);
    font-size: 16px;
    color: #fff;
    border: 0px;
    border-radius: 3px;
`;

const CancelButton = Styled.button`
    background: white;
    font-size: 16px;
    color: rgb(28, 136, 80);
    border: solid 1px;
    border-color:rgb(28, 136, 80);
    border-radius: 3px;
    margin-right: 11px;
`;

type IProps = {
    handleCancelClicked: () => void;
};

const SelectPortContainer: React.FC<IProps> = (props) => {
    const portList = useSelector<IStoreState, ISerialPortScanData[]>(
        (state) => state.connection.portList
    );
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
                    <span>{translator.translate('Select')}</span>
                    <PortBoxCancelIcon
                        className="cancel_icon cancel_event"
                        onClick={onCancelClicked}
                    />
                </PortBoxTitle>
                <PortBoxContent>
                    <PortBoxDescription>
                        {translator.translate('Select the COM PORT to connect')}
                    </PortBoxDescription>
                    <PortBoxSelectElement
                        size={10}
                        id="select_port"
                        onChange={(e) => {
                            changeSelected(e.target.value);
                        }}
                    >
                        {portList.map((port, index) => (
                            <option
                                title={port.path}
                                value={port.path}
                                key={`${port.path}-${index}`}
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
                        <SelectButton
                            id="btn_select_port"
                            onClick={() => {
                                if (!selectedPort) {
                                    alert(
                                        translator.translate(
                                            'Select the COM PORT to connect'
                                        )
                                    );
                                } else {
                                    onPortSelected(selectedPort);
                                }
                            }}
                        >
                            {translator.translate('Connect')}
                        </SelectButton>
                    </div>
                </PortBoxContent>
            </PortBoxBody>
        </PortBoxContainer>
    );
};

export default SelectPortContainer;
