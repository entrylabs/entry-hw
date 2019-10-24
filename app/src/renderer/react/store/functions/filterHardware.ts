type IHardware = any;

const filterHardwareList = (keyword: string, category: string, hardwareList: IHardware[]) => {
    return hardwareList.filter((hardware) => {
        return (
            categoryFilterHardware(hardware, category) &&
            nameFilterHardware(hardware, keyword)
        );
    });
};

const categoryFilterHardware = (hardwareItem: IHardware, category: string) => {
    return category === 'all' || hardwareItem.category === category;
};

const nameFilterHardware = (hardwareItem: IHardware, keyword: string) => {
    if (keyword === '') {
        return true;
    }
    const en = hardwareItem.name.en.toLowerCase();
    const ko = hardwareItem.name.ko.toLowerCase();
    return ko.indexOf(keyword) > -1 || en.indexOf(keyword) > -1;
};

export default filterHardwareList;
