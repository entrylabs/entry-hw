import { AnyAction } from 'redux';
import produce from 'immer';

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

// actions
export const searchHardware = (dispatch: any) => (keyword: string) => dispatch({
    type: HARDWARE_SEARCH,
    payload: keyword,
});

export const changeHardwareCategory = (dispatch: any) => (category: string) => dispatch({
    type: CATEGORY_CHANGED,
    payload: category,
});

export const changeHardwareList = (dispatch: any) => (hardwareList: IHardware[]) => dispatch({
    type: HARDWARE_LIST_CHANGED,
    payload: hardwareList,
});

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
