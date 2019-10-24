import React, { useMemo } from 'react';
import withPreload from '../../hoc/withPreload';

const HardwareElement: React.FC<Preload & any> = (props) => {
    const { hardware, translator } = props;
    const langType = useMemo(() => translator.currentLanguage, [translator]);

    return (
        <div className="hardwareType" id={`${hardware.id}`}>
            <img className="hwThumb" src={`../../../modules/${hardware.icon}`} alt=""/>
            <h2 className="hwTitle">
                {`${hardware.name && hardware.name[langType] || hardware.name.en}`}
            </h2>
        </div>
    )
};

export default withPreload(HardwareElement);
