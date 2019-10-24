import React, { useCallback, useEffect } from 'react';
import Styled from 'styled-components';
import { IMapDispatchToProps, IMapStateToProps } from '../../store';
import { connect } from 'react-redux';
import HardwareElement from './HardwareElement';
import { resetHardwareList } from '../../store/modules/hardware';

const HardwareListContainerRoot = Styled.div`
    padding: 40px;
    overflow-y: auto;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    width: 100%;
`;

const HardwareListContainer: React.FC<IStateProps & IDispatchProps> = (props) => {
    const { hardwareList } = props;
    useEffect(() => {
        if (hardwareList.length === 0) {
            props.resetHardwareList();
        }
    }, []);

    return (
        <HardwareListContainerRoot id="pyapyahwList">
            {
                hardwareList.map((hardware) => (
                    <HardwareElement key={hardware.id} hardware={hardware}/>
                ))
            }
        </HardwareListContainerRoot>
    );
};

interface IStateProps {
    hardwareList: any[];
}

const mapStateToProps: IMapStateToProps<IStateProps> = (state) => ({
    hardwareList: state.hardware.hardwareList,
});

interface IDispatchProps {
    resetHardwareList: () => void;
}

const mapDispatchToProps: IMapDispatchToProps<IDispatchProps> = (dispatch) => ({
    resetHardwareList: resetHardwareList(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(HardwareListContainer);
