import { Dispatch } from 'react';
import { AnyAction } from 'redux';

export default <P>(type: string) => {
    return (dispatch: Dispatch<AnyAction>) => (payload: P) => dispatch({
        type,
        payload,
    });
}
