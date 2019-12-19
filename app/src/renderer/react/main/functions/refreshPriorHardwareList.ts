export default (newHardwareName: string) => {
    const prevHardwareList: Array<string> = JSON.parse(localStorage.getItem('hardwareList') || '[]');
    const foundPrevHardwareIndex = prevHardwareList.findIndex((hardwareName) => hardwareName === newHardwareName);
    if (foundPrevHardwareIndex > -1) {
        prevHardwareList.splice(foundPrevHardwareIndex, 1);
    }
    prevHardwareList.push(newHardwareName);
    localStorage.setItem('hardwareList', JSON.stringify(prevHardwareList));
};
