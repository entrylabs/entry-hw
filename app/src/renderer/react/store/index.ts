import { combineReducers, createStore } from 'redux';
import common, {ICommonState}  from './modules/common';
import hardware, {IHardwareState} from './modules/hardware';

// interfaces
export type IMapStateToProps<T> = (store: IStoreState) => T;
export type IMapDispatchToProps<T> = (dispatch: any) => T;

export interface IStoreState {
    common: ICommonState;
    hardware: IHardwareState;
}


export default createStore(combineReducers<IStoreState>({
    common,
    hardware,
}));
