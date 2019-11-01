import React, { useCallback } from 'react';
import Styled from 'styled-components';
import withPreload from '../hoc/withPreload';
import { HardwarePageStateEnum } from '../constants/constants';
import { IMapDispatchToProps, IMapStateToProps } from '../store';
import { connect } from 'react-redux';
import { changeCurrentPageState } from '../store/modules/common';

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
    background-image: url(../images/btn_close.png);
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

type IProps = IDispatchProps & IStateProps & Preload;
const SelectPortContainer: React.FC<IProps> = (props) => {
    const { translator, portList } = props;

    const onCancelClicked = useCallback(() => {
        props.changeCurrentPageState(HardwarePageStateEnum.list);
    }, []);

    return (
        <PortBoxContainer id="select_port_box">
            <PortBoxBody className="select_port_child">
                <PortBoxTitle>
                    <span>
                        {translator.translate('Select')}
                    </span>
                    <PortBoxCancelIcon className="cancel_icon cancel_event"/>
                </PortBoxTitle>
                <PortBoxContent>
                    <PortBoxDescription>
                        {translator.translate('Select the COM PORT to connect')}
                    </PortBoxDescription>
                    <PortBoxSelectElement size={10} id="select_port">
                        {portList.map((port) => (
                            <option title={port.comName} key={port.comName}>
                                {port.comName}
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
                        <SelectButton id="btn_select_port">
                            {translator.translate('Connect')}
                        </SelectButton>
                    </div>
                </PortBoxContent>
            </PortBoxBody>
        </PortBoxContainer>
    );
};

interface IStateProps {
    portList: ISerialPortScanData[];
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    portList: state.connection.portList,
});

interface IDispatchProps {
    changeCurrentPageState: (page: HardwarePageStateEnum) => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    changeCurrentPageState: changeCurrentPageState(dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(withPreload(SelectPortContainer));
