export default (newHardwareName: string) => {
    const prevHardwareList: Array<string> = JSON.parse(localStorage.getItem('hardwareList') || '[]');
    prevHardwareList.push(newHardwareName);
    localStorage.setItem('hardwareList', JSON.stringify(prevHardwareList));
}
