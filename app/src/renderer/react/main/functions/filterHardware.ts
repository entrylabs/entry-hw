import { CategoryTypeEnum } from '../constants/constants';

const filterHardwareList = (keyword: string, category: string, hardwareList: IHardware[]) => hardwareList.filter((hardware) => (
            categoryFilterHardware(hardware, category) &&
            nameFilterHardware(hardware, keyword)
        ));

const categoryFilterHardware = (hardwareItem: IHardware, category: string) => category === CategoryTypeEnum.all || hardwareItem.category === category;

const nameFilterHardware = (hardwareItem: IHardware, keyword: string) => {
    if (keyword === '') {
        return true;
    }
    const en = hardwareItem.name.en.toLowerCase();
    const ko = hardwareItem.name.ko.toLowerCase();
    return ko.indexOf(keyword) > -1 || en.indexOf(keyword) > -1;
};

export default filterHardwareList;
