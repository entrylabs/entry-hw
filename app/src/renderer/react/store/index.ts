import { combineReducers, createStore } from 'redux';
import common, {ICommonState}  from './modules/common';

// interfaces
export type IMapStateToProps<T> = (store: IStoreState) => T;
export type IMapDispatchToProps<T> = (dispatch: any) => T;

export interface IStoreState {
    common: ICommonState;
}


export default createStore(combineReducers<IStoreState>({
    common,
}));
