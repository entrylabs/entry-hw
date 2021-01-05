import { AnyAction } from 'redux';
import produce from 'immer';
import { HardwareStatement } from '../../../../../common/constants';
import { CategoryTypeEnum, CloudModeTypesEnum, HardwarePageStateEnum } from '../../constants/constants';
import { makeAction, makePayloadAction } from '../../functions/makeAction';

const { translator, ipcRenderer } = window;

// interface
export interface ICommonState {
    stateTitle: string;
    alertMessage?: IAlertMessage
    currentPageState: HardwarePageStateEnum;
    categoryState: CategoryTypeEnum;
    moduleState: HardwareStatement;
    isLicenseShow: boolean;
    isCloudMode: CloudModeTypesEnum;
    isSocketConnected: boolean;
    isInvalidBuild: boolean;
}

export interface IAlertMessage {
    message: string;
    duration?: number;
}

// types
export const LICENSE_VIEW_TOGGLE = 'common/LICENSE_VIEW_TOGGLE';
export const STATE_TITLE_CHANGED = 'common/STATE_TITLE_CHANGED';
export const CURRENT_PAGE_STATE_CHANGED = 'common/CURRENT_PAGE_STATE_CHANGED';
export const CLOUD_MODE_CHANGED = 'common/CLOUD_MODE_CHANGED';
export const ALERT_MESSAGE_CHANGED = 'common/ALERT_MESSAGE_CHANGED';
export const MODULE_STATE_CHANGED = 'common/MODULE_STATE_CHANGED';
export const SOCKET_CONNECT_STATE_CHANGED = 'common/SOCKET_CONNECT_STATE_CHANGED';
export const BUILD_INVALIDATED = 'common/BUILD_INVALIDATED';

// actions
export const toggleLicenseView = makePayloadAction<boolean>(LICENSE_VIEW_TOGGLE);
export const changeCurrentPageState = makePayloadAction<HardwarePageStateEnum>(CURRENT_PAGE_STATE_CHANGED);
export const changeCloudMode = makePayloadAction<CloudModeTypesEnum>(CLOUD_MODE_CHANGED);
export const changeStateTitle = makePayloadAction<string>(STATE_TITLE_CHANGED);
export const changeAlertMessage = makePayloadAction<IAlertMessage>(ALERT_MESSAGE_CHANGED);
export const changeHardwareModuleState = makePayloadAction<HardwareStatement>(MODULE_STATE_CHANGED);
export const changeSocketConnectionState = makePayloadAction<boolean>(SOCKET_CONNECT_STATE_CHANGED);
export const invalidateBuild = makeAction(BUILD_INVALIDATED);

// reducer
const initialState: ICommonState = {
    stateTitle: translator.translate('Select hardware'),
    currentPageState: HardwarePageStateEnum.list,
    categoryState: CategoryTypeEnum.all,
    moduleState: HardwareStatement.disconnected,
    isLicenseShow: false,
    isCloudMode: ipcRenderer.sendSync('getCurrentCloudModeSync'),
    isSocketConnected: false,
    isInvalidBuild: false,
};

export default (state = initialState, { type, payload }: AnyAction) => {
    switch (type) {
    case BUILD_INVALIDATED:
        return produce(state, (nextState) => {
            nextState.isInvalidBuild = true;
        });
    case LICENSE_VIEW_TOGGLE:
        return produce(state, (nextState) => {
            nextState.isLicenseShow = payload;
        });
    case CURRENT_PAGE_STATE_CHANGED:
        return produce(state, (nextState) => {
            if ((payload as HardwarePageStateEnum) === HardwarePageStateEnum.list) {
                nextState.alertMessage = undefined;
            }
            nextState.currentPageState = payload;
        });
    case CLOUD_MODE_CHANGED:
        return produce(state, (nextState) => {
            nextState.isCloudMode = payload;
        });
    case STATE_TITLE_CHANGED:
        return produce(state, (nextState) => {
            nextState.stateTitle = payload;
        });
    case ALERT_MESSAGE_CHANGED:
        return produce(state, (nextState) => {
            nextState.alertMessage = payload;
        });
    case MODULE_STATE_CHANGED:
        return produce(state, (nextState) => {
            nextState.moduleState = payload;
        });
    case SOCKET_CONNECT_STATE_CHANGED:
        return produce(state, (nextState) => {
            nextState.isSocketConnected = payload;
        });
    default:
        return produce(state, () => {
        });
    }
};
