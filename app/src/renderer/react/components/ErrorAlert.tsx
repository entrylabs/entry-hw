import React from 'react';
import withPreload from '../hoc/withPreload';

const ErrorAlert = (props: Preload) => {
    return (
        <div id="errorAlert">
            <div>
                <img src="../images/alert.png"/>
                <span className="alertMsg">
                <span className="alertMsg1">
                    {props.translator.translate(
                        'If unexpected problem occurs while operating,',
                    )}
                </span>
                <span className="alertMsg2">
                    {props.translator.translate(
                        'contact the hardware company to resolve the problem.',
                    )}
                </span>
            </span>
            </div>
            <div className="comment">
                {
                    props.translator.translate(
                        '* Entry Labs is not responsible for the extension program and hardware products on this site.',
                    )
                }
            </div>
        </div>
    );
};

export default withPreload(ErrorAlert);
