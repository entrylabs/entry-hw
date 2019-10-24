import { Dispatch } from 'react';
import { Action } from 'redux';

type PayloadAction<P> = { payload: P } & Action;
export const makePayloadAction = <P>(type: string) =>
    (dispatch: Dispatch<PayloadAction<P>>) => (payload: P) => dispatch({
        type, payload,
    });
;

export const makeAction = (type: string) =>
    (dispatch: Dispatch<Action>) => () => dispatch({ type });
