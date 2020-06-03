import { AnyAction, Middleware } from 'redux';
import { Dispatch } from 'react';
import { IStoreState } from '../index';
import {
    CATEGORY_CHANGED,
    changeHardwareList,
    HARDWARE_LIST_RESET,
    HARDWARE_MODULE_DOWNLOAD_REQUESTED,
    HARDWARE_SEARCH_KEYWORD_CHANGED,
} from '../modules/hardware';
import filterHardwareList from '../../functions/filterHardware';
import { changeAlertMessage, CURRENT_PAGE_STATE_CHANGED } from '../modules/common';
import { HardwareStatement } from '../../../../../common/constants';
import { HardwarePageStateEnum } from '../../constants/constants';
import refreshPriorHardwareList from '../../functions/refreshPriorHardwareList';
import {
    changePortList,
    changeVisiblePortList,
    FIRMWARE_INSTALL_REQUESTED,
    HARDWARE_SELECTED,
    PORT_SELECTED,
} from '../modules/connection';

const { translator, rendererRouter } = window;

/**
 * RendererRouter 의 ipc 통신 로직을 담당한다.
 * 리액트 엘리먼트에서는 뷰 전환에 관련한 로직만 생각하고, 여기서는 메인프로세스와의 통신만을 다룬다.
 */
// eslint-disable-next-line max-len
const entryHardwareMiddleware: Middleware = ({ getState }: { getState: () => IStoreState }) => (next: Dispatch<AnyAction>) => async (action: AnyAction) => {
    const { type, payload } = action; // currentAction

    switch (type) {
        case CATEGORY_CHANGED: {
            next(action);
            const { hardware } = getState();
            const { hardwareFilterKeyword, hardwareFilterCategory } = hardware;
            const hardwareList = filterHardwareList(
                hardwareFilterKeyword,
                hardwareFilterCategory,
                rendererRouter.hardwareList,
            );
            changeHardwareList(next)(hardwareList);
            break;
        }
        case HARDWARE_SEARCH_KEYWORD_CHANGED: {
            const { hardware } = getState();
            const { hardwareFilterCategory } = hardware;
            const { payload: keyword } = action;
            
            new Promise<IHardwareConfig[]>(resolve => {
                resolve(filterHardwareList(
                    keyword,
                    hardwareFilterCategory,
                    rendererRouter.hardwareList,
                ))
            }).then((hardwareList) => {
                changeHardwareList(next)(hardwareList);
            });
            next(action);
            break;
        }
        case CURRENT_PAGE_STATE_CHANGED: {
            const { payload: nextState } = action;
            if (nextState === HardwarePageStateEnum.list) {
                rendererRouter.close();
                //NOTE resetHardwareList 를 쓰고자 했는데 안먹힌다. 왤까?
                changeHardwareList(next)(rendererRouter.hardwareList);
                changePortList(next)([]);
            }
            next(action);
            break;
        }
        case HARDWARE_SELECTED: {
            const { payload: hardware } = action;
            // noinspection JSIgnoredPromiseFromCall
            if (hardware.name && hardware.name.ko) {
                refreshPriorHardwareList(hardware.name.ko);
            }

            rendererRouter.startScan(hardware);
            next(action);
            break;
        }
        case HARDWARE_LIST_RESET: {
            changeHardwareList(next)(rendererRouter.hardwareList);
            break;
        }
        case PORT_SELECTED: {
            rendererRouter.sendSelectedPort(action.payload);
            next(action);
            break;
        }
        case FIRMWARE_INSTALL_REQUESTED: {
            const { common } = getState();
            const { moduleState } = common;

            if (
                action.payload.type !== 'copy' &&
                moduleState !== HardwareStatement.beforeConnect &&
                moduleState !== HardwareStatement.connected
            ) {
                alert(translator.translate('Hardware Device Is Not Connected'));
            } else {
                rendererRouter.requestFlash(action.payload)
                    .then(() => {
                        changeAlertMessage(next)({
                            message: translator.translate('Firmware Uploaded!'),
                            duration: 1000,
                        });
                    })
                    .catch(() => {
                        changeAlertMessage(next)({
                            message: translator.translate('Failed Firmware Upload'),
                        });
                    })
                    .finally(() => {
                        if (action.payload.type === 'copy') {
                            changeVisiblePortList(next)(false);
                        }
                    });
            }
            break;
        }
        case HARDWARE_MODULE_DOWNLOAD_REQUESTED: {
            await rendererRouter.requestDownloadModule(payload);
            changeHardwareList(next)(rendererRouter.hardwareList);
            break;
        }
        default:
            next(action);
    }
};

export default entryHardwareMiddleware;
