import { AnyAction } from 'redux';
import produce from 'immer';
import { makePayloadAction, makeAction } from '../../functions/makeAction';

type IHardware = any;

// interface
export interface IHardwareState {
    hardwareFilterKeyword: string;
    hardwareFilterCategory: string;
    hardwareList: IHardware[];
}

// types
export const HARDWARE_SEARCH = 'hardware/HARDWARE_SEARCH';
export const CATEGORY_CHANGED = 'hardware/CATEGORY_CHANGED';
export const HARDWARE_LIST_CHANGED = 'hardware/HARDWARE_LIST_CHANGED';
export const HARDWARE_LIST_RESET = 'hardware/HARDWARE_LIST_RESET';

// actions
export const searchHardware = makePayloadAction<string>(HARDWARE_SEARCH);
export const changeHardwareCategory = makePayloadAction<string>(CATEGORY_CHANGED);
export const changeHardwareList = makePayloadAction<IHardware[]>(HARDWARE_LIST_CHANGED);
export const resetHardwareList = makeAction(HARDWARE_LIST_RESET);

// reducer
const initialState: IHardwareState = {
    hardwareFilterKeyword: '',
    hardwareFilterCategory: 'all',
    hardwareList: [],
};

export default (state = initialState, { type, payload }: AnyAction) => {
    switch (type) {
        case HARDWARE_SEARCH:
            return produce(state, (nextState) => {

            });
        case CATEGORY_CHANGED:
            return produce(state, (nextState) => {
                if (nextState.hardwareFilterCategory !== payload) {
                    nextState.hardwareFilterKeyword = '';
                    nextState.hardwareFilterCategory = payload;
                }
            });
        case HARDWARE_LIST_CHANGED:
            return produce(state, (nextState) => {
                nextState.hardwareList = payload;
            });
        default:
            return produce(state, () => {
            });
    }
}
