import { Middleware, AnyAction } from 'redux';
import { Dispatch } from 'react';
import { IStoreState } from '../index';
import { CATEGORY_CHANGED, changeHardwareList, HARDWARE_LIST_RESET, HARDWARE_SEARCH } from '../modules/hardware';
import filterHardwareList from '../../functions/filterHardware';

const { rendererRouter } = window;

const entryHardwareMiddleware: Middleware = ({ getState }: { getState: () => IStoreState }) => (next: Dispatch<AnyAction>) => (action: AnyAction) => {
    const { type } = action; // currentAction
    if (type === CATEGORY_CHANGED || type === HARDWARE_SEARCH) {
        next(action);
        const { hardware } = getState();
        const { hardwareFilterKeyword, hardwareFilterCategory } = hardware;
        const hardwareList = filterHardwareList(hardwareFilterKeyword, hardwareFilterCategory, rendererRouter.hardwareList);
        changeHardwareList(next)(hardwareList);
    }

    if (type === HARDWARE_LIST_RESET) {
        changeHardwareList(next)(rendererRouter.hardwareList);
    }
};

export default entryHardwareMiddleware; // 불러와서 사용 할 수 있도록 내보내줍니다.
