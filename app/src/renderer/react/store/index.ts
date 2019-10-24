import { combineReducers, createStore, applyMiddleware } from 'redux';
import common, {ICommonState}  from './modules/common';
import hardware, {IHardwareState} from './modules/hardware';
import entryHardwareMiddleware from './middlewares/entryHardwareMiddleware';

// interfaces
export type IMapStateToProps<T> = (store: IStoreState) => T;
export type IMapDispatchToProps<T> = (dispatch: any) => T;

export interface IStoreState {
    common: ICommonState;
    hardware: IHardwareState;
}

const reducers = combineReducers<IStoreState>({
    common,
    hardware,
});

export default createStore(reducers, applyMiddleware(entryHardwareMiddleware));
