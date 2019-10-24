import { AnyAction } from 'redux';
import produce from 'immer';
import { HardwarePageStateEnum } from '../../constants/constants';
import { makePayloadAction } from '../../functions/makeAction';

// interface
export interface ICommonState {
    currentState: HardwarePageStateEnum;
    categoryState: string;
    isLicenseShow: boolean;
    isCloudMode: boolean;
}

// types
export const LICENSE_VIEW_TOGGLE = 'common/LICENSE_VIEW_TOGGLE';
export const CURRENT_STATE_CHANGED = 'common/CURRENT_STATE_CHANGED';

// actions
export const toggleLicenseView = makePayloadAction<boolean>(LICENSE_VIEW_TOGGLE);
export const changeCurrentState = makePayloadAction<HardwarePageStateEnum>(CURRENT_STATE_CHANGED);
// export const selectPost = (pageId: string) => ({ type: SELECT_POST_START, payload: pageId });

// reducer
const initialState: ICommonState = {
    currentState: HardwarePageStateEnum.list,
    categoryState: 'all',
    isLicenseShow: false,
    isCloudMode: false,
};

export default (state = initialState, { type, payload }: AnyAction) => {
    switch (type) {
        case LICENSE_VIEW_TOGGLE:
            return produce(state, (nextState) => {
                nextState.isLicenseShow = payload;
            });
        case CURRENT_STATE_CHANGED:
            return produce(state, (nextState) => {
                nextState.currentState = payload;
            });
        default:
            return produce(state, () => {
            });
    }
}
