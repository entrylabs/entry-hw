declare type IBleCharacteristic = {
    key: string;
    uuid: string;
    type: 'read' | 'write';
}
declare type IBleProfileInformation = {
    service: string;
    characteristics: IBleCharacteristic[];
}
