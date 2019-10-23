import { AnyAction } from 'redux';
import produce from 'immer';
import { HardwareStateEnum } from '../../constants/constants';

// interface
export interface ICommonState {
    currentState: HardwareStateEnum;
    categoryState: string;
    isLicenseShow: boolean;
    isCloudMode: boolean;
    hardwareList: any[];
}

// types
export const LICENSE_VIEW_TOGGLE = 'common/LICENSE_VIEW_TOGGLE';
export const CURRENT_STATE_CHANGED = 'common/CURRENT_STATE_CHANGED';

// actions
export const toggleLicenseView = (dispatch: any) => (isShow: boolean) => dispatch({
    type: LICENSE_VIEW_TOGGLE,
    payload: isShow,
});
export const changeCurrentState = (dispatch: any) => (state: string) => ({
    type: CURRENT_STATE_CHANGED,
    payload: state,
});
// export const selectPost = (pageId: string) => ({ type: SELECT_POST_START, payload: pageId });

// reducer
const initialState: ICommonState = {
    currentState: HardwareStateEnum.disconnected,
    categoryState: 'all',
    isLicenseShow: false,
    isCloudMode: false,
    hardwareList: [],
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
