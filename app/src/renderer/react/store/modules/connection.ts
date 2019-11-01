import { AnyAction } from 'redux';
import produce from 'immer';
import { makePayloadAction } from '../../functions/makeAction';

export interface IConnectionState {
    selectedHardware?: IHardware;
    isNeedPortSelect: boolean;
    portList: ISerialPortScanData[];
}

export const HARDWARE_SELECTED = 'connection/HARDWARE_SELECTED';
export const PORTLIST_CHANGED = 'connection/PORTLIST_CHANGED';
export const PORT_SELECTED = 'connection/PORT_SELECTED';

export const selectHardware = makePayloadAction<IHardware>(HARDWARE_SELECTED);
export const changePortList = makePayloadAction<ISerialPortScanData[]>(PORTLIST_CHANGED);
export const selectPort = makePayloadAction<string>(PORT_SELECTED);

const initialState: IConnectionState = {
    selectedHardware: undefined,
    isNeedPortSelect: false,
    portList: [],
};

export default (state = initialState, { type, payload }: AnyAction) => {
    switch (type) {
        case HARDWARE_SELECTED:
            return produce(state, (nextState) => {
                nextState.selectedHardware = payload;
            });
        case PORTLIST_CHANGED:
            return produce(state, (nextState) => {
                nextState.isNeedPortSelect = (payload as ISerialPortScanData[]).length !== 0;
                nextState.portList = payload;
            });
        case PORT_SELECTED:
            return produce(state, (nextState) => {
                nextState.isNeedPortSelect = false;
            });
        default:
            return produce(state, () => {
            });
    }
}
