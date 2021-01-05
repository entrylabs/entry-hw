import {CategoryTypeEnum} from '../constants/constants';

const filterHardwareList = (keyword: string, category: string, hardwareList: IHardwareConfig[]) =>
    hardwareList.filter((hardware) => (
        categoryFilterHardware(hardware, category) &&
            nameFilterHardware(hardware, keyword)
    ));

const categoryFilterHardware = (hardwareItem: IHardwareConfig, category: string) =>
    category === CategoryTypeEnum.all || hardwareItem.category === category;

const nameFilterHardware = (hardwareItem: IHardwareConfig, keyword: string) => {
    if (keyword === '') {
        return true;
    }
    const en = hardwareItem.name?.en?.toLowerCase();
    const ko = hardwareItem.name?.ko?.toLowerCase();
    return (ko && ko.indexOf(keyword) > -1) || (en && en.indexOf(keyword) > -1);
};

export default filterHardwareList;
