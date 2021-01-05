import { AnyAction } from 'redux';
import produce from 'immer';
import { makeAction, makePayloadAction } from '../../functions/makeAction';
import { CategoryTypeEnum } from '../../constants/constants';

// interface
export interface IHardwareState {
    hardwareFilterKeyword: string;
    hardwareFilterCategory: CategoryTypeEnum;
    hardwareList: IHardwareConfig[];
}

// types
export const HARDWARE_MODULE_DOWNLOAD_REQUESTED = 'hardware/HARDWARE_MODULE_DOWNLOAD_REQUESTED';
export const HARDWARE_SEARCH_KEYWORD_CHANGED = 'hardware/HARDWARE_SEARCH_KEYWORD_CHANGED';
export const CATEGORY_CHANGED = 'hardware/CATEGORY_CHANGED';
export const HARDWARE_LIST_CHANGED = 'hardware/HARDWARE_LIST_CHANGED';
export const HARDWARE_LIST_RESET = 'hardware/HARDWARE_LIST_RESET';

// actions
export const requestHardwareModuleDownload = makePayloadAction<string>(HARDWARE_MODULE_DOWNLOAD_REQUESTED);
export const changeHardwareSearchKeyword = makePayloadAction<string>(HARDWARE_SEARCH_KEYWORD_CHANGED);
export const changeHardwareCategory = makePayloadAction<CategoryTypeEnum>(CATEGORY_CHANGED);
export const changeHardwareList = makePayloadAction<IHardwareConfig[]>(HARDWARE_LIST_CHANGED);
export const resetHardwareList = makeAction(HARDWARE_LIST_RESET);

// reducer
const initialState: IHardwareState = {
    hardwareFilterKeyword: '',
    hardwareFilterCategory: CategoryTypeEnum.all,
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
};
