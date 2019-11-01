import { AnyAction } from 'redux';
import produce from 'immer';
import { CloudModeTypesEnum, HardwarePageStateEnum } from '../../constants/constants';
import { makePayloadAction } from '../../functions/makeAction';

const { ipcRenderer } = window;

// interface
export interface ICommonState {
    currentPageState: HardwarePageStateEnum;
    categoryState: string;
    isLicenseShow: boolean;
    isCloudMode: CloudModeTypesEnum;
}

// types
export const LICENSE_VIEW_TOGGLE = 'common/LICENSE_VIEW_TOGGLE';
export const CURRENT_PAGE_STATE_CHANGED = 'common/CURRENT_PAGE_STATE_CHANGED';
export const CLOUD_MODE_CHANGED = 'common/CLOUD_MODE_CHANGED';

// actions
export const toggleLicenseView = makePayloadAction<boolean>(LICENSE_VIEW_TOGGLE);
export const changeCurrentPageState = makePayloadAction<HardwarePageStateEnum>(CURRENT_PAGE_STATE_CHANGED);
export const changeCloudMode = makePayloadAction<CloudModeTypesEnum>(CLOUD_MODE_CHANGED);
// export const selectPost = (pageId: string) => ({ type: SELECT_POST_START, payload: pageId });

// reducer
const initialState: ICommonState = {
    currentPageState: HardwarePageStateEnum.list,
    categoryState: 'all',
    isLicenseShow: false,
    isCloudMode: ipcRenderer.sendSync('getCurrentCloudModeSync'),
};

export default (state = initialState, { type, payload }: AnyAction) => {
    switch (type) {
        case LICENSE_VIEW_TOGGLE:
            return produce(state, (nextState) => {
                nextState.isLicenseShow = payload;
            });
        case CURRENT_PAGE_STATE_CHANGED:
            return produce(state, (nextState) => {
                nextState.currentPageState = payload;
            });
        case CLOUD_MODE_CHANGED:
            return produce(state, (nextState) => {
                nextState.isCloudMode = payload;
            });
        default:
            return produce(state, () => {
            });
    }
}
