import { combineReducers, createStore, applyMiddleware, AnyAction } from 'redux';
import common, { ICommonState } from './modules/common';
import hardware, { IHardwareState } from './modules/hardware';
import entryHardwareMiddleware from './middlewares/entryHardwareMiddleware';
import { Dispatch } from 'react';
import connection, { IConnectionState } from './modules/connection';

// interfaces
export type IMapStateToProps<T> = (store: IStoreState) => T;
export type IMapDispatchToProps<T> = (dispatch: Dispatch<AnyAction>) => T;

export interface IStoreState {
    common: ICommonState;
    hardware: IHardwareState;
    connection: IConnectionState;
}

const reducers = combineReducers<IStoreState>({
    common,
    hardware,
    connection,
});

export default createStore(
    reducers,
    applyMiddleware(entryHardwareMiddleware),
);
