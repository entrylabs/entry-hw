import { AnyAction } from 'redux';
import produce from 'immer';
import { makePayloadAction, makeAction } from '../../functions/makeAction';

// interface
export interface IHardwareState {
    hardwareFilterKeyword: string;
    hardwareFilterCategory: string;
    hardwareList: IHardware[];
}

// types
export const HARDWARE_SEARCH_KEYWORD_CHANGED = 'hardware/HARDWARE_SEARCH_KEYWORD_CHANGED';
export const CATEGORY_CHANGED = 'hardware/CATEGORY_CHANGED';
export const HARDWARE_LIST_CHANGED = 'hardware/HARDWARE_LIST_CHANGED';
export const HARDWARE_LIST_RESET = 'hardware/HARDWARE_LIST_RESET';

// actions
export const changeHardwareSearchKeyword = makePayloadAction<string>(HARDWARE_SEARCH_KEYWORD_CHANGED);
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
        case HARDWARE_SEARCH_KEYWORD_CHANGED:
            return produce(state, (nextState) => {
                nextState.hardwareFilterKeyword = payload;
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
