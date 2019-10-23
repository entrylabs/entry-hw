import { AnyAction } from 'redux';
import produce from 'immer';
import { HardwareStateEnum } from '../../constants/constants';

// interface
export interface IHardwareState {
    hardwareFilterKeyword: string;
    hardwareFilterCategory: string;
    hardwareList: any[];
}

// types
export const HARDWARE_SEARCH = 'hardware/HARDWARE_SEARCH';
export const CATEGORY_CHANGED = 'hardware/CATEGORY_CHANGED';

// actions
export const searchHardware = (dispatch: any) => (keyword: string) => dispatch({
    type: HARDWARE_SEARCH,
    payload: keyword,
});

export const changeHardwareCategory = (dispatch: any) => (category: string) => dispatch({
    type: CATEGORY_CHANGED,
    payload: category,
});

// reducer
const initialState: IHardwareState = {
    hardwareFilterKeyword: '',
    hardwareFilterCategory: '',
    hardwareList: [],
};

export default (state = initialState, { type, payload }: AnyAction) => {
    switch (type) {
        case HARDWARE_SEARCH:
            return produce(state, (nextState) => {

            });
        case CATEGORY_CHANGED:
            return produce(state, (nextState) => {
                nextState.hardwareFilterCategory = payload;
            });
        default:
            return produce(state, () => {
            });
    }
}
