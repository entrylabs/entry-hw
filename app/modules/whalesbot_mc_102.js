const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');
const os = require('os');
const BaseModule = require('./baseModule');
const _ = global.$;
const SerialPort = require('serialport');

class WhalesbotMC102 extends BaseModule {
    constructor() {
        super();

        this.portName = "COM3";
        this.getSerialPortList();
        this.baudRate = 1000000;
        this.sp = null;
        this.isConnect = false;
        this.CrcFlashStatus = false;
        this.downloadStatus = false;
        this.DownloadProcess = Object.freeze({
            crcFlash: 0,
            sendCode2M32Buffer: 1,
            copyM32Buffer2Flash: 2,
            saveNameToSTM32: 3,
            runCode: 4,
        });

        this.currentDownloadProcess = this.DownloadProcess.crcFlash;

        this.ping_cmd = [0x55, 0xaa, 0x0, 0x1, 0x8, 0x0, 0x0, 0xf7];
        this.run_cmd = [0x55, 0xaa, 0x0, 0x40, 0xb, 0x0, 0x0, 0xc0, 0x0, 0x8, 0xed];
        this.raw_save_cmd = [0x55, 0xaa, 0x0, 0x30, 0x10, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0];

        this.CMD_M32_2_PC_HEAD0 = 0x66;
        this.CMD_M32_2_PC_HEAD1 = 0xBB;
        this.CMD_WRITEBUFFER = 0x10;

        this.code = [];
        this.CMD_BUFFER_4K_LEN  = 4*1024;
        this.CMD_DW_SEND_SIZE = this.CMD_BUFFER_4K_LEN+8;

        this.CMD_RAM2FLASH_SEND_SIZE = 11;
        this.CMD_RAM2FLASH_REV_SIZE = 11;
        this.CMD_DW_REV_SIZE = 8;

        this.CMD_SAVEFILENAME_SEND_SIZE = 16;

        this.basePath = this.getBasePath();
        this.PRINT_LEVEL = 5; // Adjust logging verbosity

        // Directories
        // this.binaryFile = `C:\\Users\\GAION\\Downloads\\AI_Module_GCC\\MC_902P\\AT32Gcc\\Debug\\Run.bin`;
        this.binaryFile = `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/Run.bin`

        this.srcDirList = [
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Src/user/`,
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Src/externlib/`
        ];

        this.debugSrcDirList = [
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/Src/user/`,
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/Src/externlib/`
        ];

        this.objDirList = [
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/Src/user/`,
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/Src/externlib/`,
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/Src/control/`,
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/STM32_Stdlib/STM32F10x_StdPeriph_Driver/src/`,
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/STM32_Stdlib/FreeRTOS/src/`,
            `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/Startup/`,
        ];

        this.linkParaList = `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/objects.list`;

        this.FLASH_BASE = 0x8000000;
        this.PROGRAM_GCC = this.FLASH_BASE + (52*1024);
        // downloadAddress = 0x08040000;
        // downloadAddress = this.PROGRAM_GCC;
        // downloadAddress = 0x08060000;
        // downloadAddress = 0x0800D000;
        // downloadAddress = 0x0800C000;

        this.custom_crc32_table = new Uint32Array(256).fill(0);

        this.OS_NAME = os.platform();
        // console.log(`-system: ${this.OS_NAME}`);
    }

    async getSerialPortList() {
        try {
            const ports = await SerialPort.list();
            ports.forEach(port => {
                // console.log(`Port: ${port.path}`);
                // console.log(`Manufacturer: ${port.manufacturer}`);
                // console.log(`Serial Number: ${port.serialNumber}`);
                // console.log(`Product Id: ${port.productId}`);
                // console.log(`Vendor Id: ${port.vendorId}`);
                // console.log('----------------------------');
            });
        } catch (err) {
            console.error('Error listing ports:', err);
        }
    }

    /*
    Initial setting after the first connection was made.
    Handler is an object that jsonized data with workspace.(See DataHandler/JSON)
    config is Module.json object.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    requestInitialData(sp) {
        this.isConnect = true;
        if (!this.sp) {
            this.sp = sp;
        }
        return this.pingControl();
        // return Buffer.from(this.ping_cmd)
    }

    checkInitialData(data) {
        return true;
    }

    // use it when you need to verify the data received from the hardware periodically.
    validateLocalData(data) {
        return true;
    }

    /*
    Returns the data to be delivered to the hardware device.
    In the case of slave mode, the device is constantly sent to the device at a duration attribute interval.
    */
    requestLocalData() {
        return null;
    }

    // Data processing from hardware
    handleLocalData(data) {
        // console.log(`this.currentDownloadProcess: ${this.currentDownloadProcess}`)
        if (this.currentDownloadProcess == this.DownloadProcess.crcFlash) {
            this.CrcFlashStatus = false;
            // console.log("data received from crcFlash: ", data);
            const buffer = Buffer.from(data);
            if (data.length == 11) {
                if (data[0] == 0x66 && data[1] == 0xBB) {
                    if (data[10] == this.checksum(data)) {
                        let revcrc = buffer.readUInt8(6) + buffer.readUInt8(7) * 0x100 + buffer.readUInt8(8) * 0x10000 + buffer.readUInt8(9) * 0x1000000;
                        if (revcrc == this.codearray_4k_crc) {
                            this.CrcFlashStatus = true;
                        }
                    }
                }
            }
        }

        if (this.currentDownloadProcess == this.DownloadProcess.sendCode2M32Buffer) {
            // console.log("data received from sendCode2M32Buffer: ", data);
            if (data.length == 8) {
                if (data[0] == 0x66 && data[1] == 0xBB) {
                    if (data[3] == 0x10 && data[7] == this.checksum(data)){
                        this.downloadStatus = true;
                    }
                }
            }
        }

        if (this.currentDownloadProcess == this.DownloadProcess.copyM32Buffer2Flash) {
            const senddata = new Uint32Array(11);
            senddata[0] = 0x55; // CMD_PC_2_M32_HEAD0
            senddata[1] = 0xAA; // CMD_PC_2_M32_HEAD1
            senddata[2] = 0;    // cmd_index
            senddata[3] = 0x20; // CMD_RAM2FLASH

            const datelen = senddata.length;
            senddata[4] = datelen & 0xFF;
            senddata[5] = (datelen & 0xFF00) >> 8;

            senddata[6] = this.flashAddressOfCopyM32Buffer2Flash & 0xFF;
            senddata[7] = (this.flashAddressOfCopyM32Buffer2Flash & 0xFF00) >> 8;
            senddata[8] = (this.flashAddressOfCopyM32Buffer2Flash & 0xFF0000) >> 16;
            senddata[9] = (this.flashAddressOfCopyM32Buffer2Flash & 0xFF000000) >> 24;

            // console.log("data received from copyM32Buffer2Flash: ", data);
            if (data.length == 11) {
                if (data[0] == 0x66 && data[1] == 0xBB) {
                    if ((data[10] == this.checksum(data))) {
                        if (senddata[6] == data[6] && senddata[7] == data[7] && senddata[8] == data[8] && senddata[9] == data[9]) {
                            if (data[3] == 0x21 ) {
                                this.downloadStatus = true;
                            }
                        }
                    }
                }
            }
        }

        if (this.currentDownloadProcess == this.DownloadProcess.saveNameToSTM32) {
            let senddata = Buffer.alloc(this.CMD_SAVEFILENAME_SEND_SIZE);
            senddata[0] = 0x55;
            senddata[1] = 0xAA;
            senddata[2] = 0;
            senddata[3] = 0x30;
            let dataLen = senddata.length;
            senddata[4] = dataLen & 0x000000FF;
            senddata[5] = (dataLen & 0x0000FF00) >> 8;

            // console.log("data received from saveNameToSTM32: ", data);
            if (data.length == 16) {
                if (data[0] == 0x66 && data[1] == 0xBB) {
                    if (data[15] == this.checksum(data)) {
                        if (senddata[6] == data[6] && senddata[7] == data[7] && senddata[8] == data[8] && senddata[9] == data[9]) {
                            if (data[3] == 0x31) {
                                this.downloadStatus = true;
                            }
                        }
                    }
                }
            }
        }

        if (this.currentDownloadProcess == this.DownloadProcess.runCode) {
            const senddata = new Uint32Array(11);
            senddata[0] = 0x55;
            senddata[1] = 0xAA;
            senddata[2] = 0; // cmd_indexa
            senddata[3] = 0x40;
            const datalen = senddata.length;
            senddata[4] = datalen & 0x000000FF;
            senddata[5] = (datalen & 0x0000FF00) >> 8;
            senddata[6] = this.downloadAddressOfRunCode & 0x000000FF;
            senddata[7] = (this.downloadAddressOfRunCode & 0x0000FF00) >> 8;
            senddata[8] = (this.downloadAddressOfRunCode & 0x00FF0000) >> 16;
            senddata[9] = (this.downloadAddressOfRunCode & 0xFF000000) >> 24;
            senddata[datalen - 1] = this.checksum(senddata);

            // console.log("data received from runCode: ", data);
            if (data.length == 11) {
                if (data[0] == 0x66 && data[1] == 0xBB) {
                    if (data[10] == this.checksum(data)) {
                        if (senddata[6] == data[6] && senddata[7] == data[7] && senddata[8] == data[8] && senddata[9] == data[9]) {
                            if (data[3] == 0x41) {
                                // console.log("--RunCode : ok")
                                this.downloadStatus = true;
                            }
                        }
                    }
                }
            }
        }

        if (this.downloadStatus == true) {
            return;
        }

        this.downloadStatus = false;
        // console.log(`this.downloadStatus in handleLocalData is ${this.downloadStatus}`);
    }

    requestRemoteData(handler) {
    }

    // processing of data received from the entry
    async handleRemoteData(handler) {
        const raw_cmd = handler.serverData.cmd;
        let cmd = "";
        let filename = "";

        if (!raw_cmd) {
            return;
        }

        if (raw_cmd instanceof Array) {
            cmd = raw_cmd[0];
            filename = raw_cmd[1];
        }

        // console.log("cmd:", cmd);
        // console.log("filename:", filename);

        // PROGRAM_GCC     =(FLASH_BASE + (52*1024)) #0x0800C000  GCC编译程序所在地址
        // PROGRAM_GUI     =(FLASH_BASE + (256*1024))#0x08040000  用户操作界面所在地址
        // PROGRAM_USBMASS =(FLASH_BASE + (384*1024))#0x08060000  U盘固件所在地址

        try {
            switch (cmd) {
                case 'download':
                    this.ReadBin();
                    await this.sleep();
                    await this.sendPingControl();
                    await this.sleep();
                    // await this.Download(0x08060000);
                    await this.Download(0x0800D000);
                    await this.sleep();
                    await this.SaveNameToSTM32();
                    await this.sleep();
                    break;
                case 'runCode':
                    await this.sendPingControl();
                    await this.RunCode(0x08060000);
                    break;
                default:
                    await this.build(cmd);
                    this.ReadBin();
                    await this.sleep();
                    await this.sendPingControl();
                    await this.sleep();
                    await this.Download(0x0800D000);
                    await this.sleep();
                    await this.SaveNameToSTM32(filename);
                    await this.sleep();
                    await this.RunCode(0x0800D000);
                    await this.sleep();
                    break;
            }
        } catch (error) {
            // console.log(error);
        }
    }

    lostController() {}

    disconnect(connect) {
        if (this.isConnect) {
            this.isConnect = false;

            this.sp = null;
            connect.close();
        }
    }

    async sendPingControl()
    {
        try {
            await this.sp.write(this.pingControl());
        } catch (err) {
            // console.log(1, "PingControl error");
        }
    }

    pingControl() {
        const senddata = new Uint32Array(8);
        senddata[0] = 0x55;
        senddata[1] = 0xAA;
        senddata[2] = 0;  // cmd_index
        senddata[3] = 0x01;
        const datelen = senddata.length;
        senddata[4] = datelen & 0x000000FF;
        senddata[5] = (datelen & 0x0000FF00) >> 8;
        senddata[6] = 0x00;
        senddata[7] = this.checksum(senddata);

        return Buffer.from(senddata)
    }

    checksumcode(data) {
        let sum = 0;
        let codelen = data.length;

        for (let i = 0; i < codelen; i++) {
            sum += data[i];
        }

        sum = sum & 0xff;
        sum = (~sum) & 0xff;

        return sum;
    }

    readBinaryFileToArrayBuffer(filePath) {
        try {
            const buffer = fs.readFile(filePath);
            return buffer;
        } catch (error) {
            throw error;
        }
    }

    writeBufferToFile(filePath, buffer) {
        try {
            fs.writeFileSync(filePath, buffer);
        } catch (error) {
            throw error;
        }
    }

    ReadBin() {
        try {
            // Read the file as a binary buffer
            // console.log("Read file" + this.binaryFile);
            const romtemp = fs.readFileSync(this.binaryFile);
            // this.writeBufferToFile(this.binaryFile+".txt", this.retHex(romtemp));
            // console.log(romtemp.length);
            // this.PrintHex(romtemp)

            const codelen = romtemp.length;  // Code length
            this.code = new Uint32Array(codelen);  // Define the buffer size

            // Copy the binary data into the code array
            for (let i = 0; i < romtemp.length; i++) {
                this.code[i] = romtemp[i];
            }
            // // console.log(romtemp.length);
            // Logging the file read info, size in KB, and checksum
            // console.log(1, `Read Code: ${this.binaryFile}\n---size: ${Math.floor(codelen / 1024)} kbyte checksum: ${this.checksumcode(this.code)}`);

            return true;
        } catch (error) {
            // console.log(error)
            // console.log(1, `Read Code Fail: ${this.binaryFile}`);
            return false;
        }
    }

    async Download(downloadAddress) {
        // console.log(1, `Download Control @ ${downloadAddress.toString(16)} ...`);
        let successState = false;
        let SEND_TIMES = 5;
        let addressoffset = 0;
        // let address = parseInt(downloadAddress, 16);
        this.generate_crc32_table()

        while (true) {
            successState = this.downloadStatus;
            // console.log(`---Download: ${(downloadAddress + addressoffset).toString(16)} - ${parseInt(addressoffset / 1024)}k/${parseInt(this.code.length / 1024)}k`);

            const codebuffer = this.prepareCodeBuffer(addressoffset);
            this.codearray_4k_crc = this.CrcCodeArra(codebuffer);
            await this.CrcFlash(downloadAddress + addressoffset);

            // await this.sleep();
            // console.log(`this.CrcFlashStatus at 388: ${this.CrcFlashStatus}`)
            // console.log(`this.downloadStatus at 389: ${this.downloadStatus}`)
            // console.log(`successState at 390: ${successState}`)

            if (this.CrcFlashStatus === false) {
                if(successState === false)
                {
                    for (let i = 0; i < SEND_TIMES; i++) {
                        await this.SendCode2M32Buffer(codebuffer);
                        successState = this.downloadStatus
                        if (successState) {
                            // console.log("SendCode2M32Buffer return true");
                            break;
                        }
                    }

                    if (successState) {
                        for (let i = 0; i < SEND_TIMES; i++) {
                            await this.CopyM32Buffer2Flash(downloadAddress + addressoffset);
                            successState = this.downloadStatus
                            if (successState) {
                                // console.log("CopyM32Buffer2Flash return true");
                                break;
                            }
                        }
                        // await this.sleep(1000);
                    } else {
                        // console.log("SendCode2M32Buffer false");
                    }

                    this.downloadStatus = false;
                    if (!successState) break;
                }
            } else {
                successState = true;
            }

            addressoffset += this.CMD_BUFFER_4K_LEN;

            if (addressoffset > this.code.length) break;
        }

        // await this.SaveNameToSTM32()

        if (successState) {
            // console.log(1, "---Download Success");
            return true;
        } else {
            // console.log(1, "---Download Fail");
            return false;
        }
    }

    prepareCodeBuffer(addressoffset) {
        const codebuffer = new Uint32Array(this.CMD_BUFFER_4K_LEN);
        for (let i = 0; i < this.CMD_BUFFER_4K_LEN; i++) {
            if (addressoffset + i < this.code.length) {
                codebuffer[i] = this.code[addressoffset + i];
            } else {
                codebuffer[i] = 0xff;
            }
        }
        // console.log("Codebuffer checksum "+this.checksum(codebuffer));
        return codebuffer;
    }

    async SendCode2M32Buffer(codebuffer) {
        this.currentDownloadProcess = this.DownloadProcess.sendCode2M32Buffer;
        const senddata = new Uint32Array(this.CMD_DW_SEND_SIZE);
        // const senddata = Buffer.alloc(this.CMD_DW_SEND_SIZE)
        // const senddata = [];
        senddata[0] = 0x55; // CMD_PC_2_M32_HEAD0
        senddata[1] = 0xAA; // CMD_PC_2_M32_HEAD1
        senddata[2] = 0;    // cmd_index
        senddata[3] = 0x10; // CMD_WRITEBUFFER
        const datelen = senddata.length;
        senddata[4] = datelen & 0x000000FF;
        senddata[5] = (datelen & 0x0000FF00) >> 8;
        senddata[6] = 0x00; // CMD_DUMMY

        for (let i = 0; i < codebuffer.length; i++) {
            senddata[7 + i] = codebuffer[i];
        }

        senddata[datelen - 1] = this.checksum(senddata);

        // console.log("SendCode2M32Buffer checksum" + this.checksum(senddata));
        // this.PrintHex(senddata)

        try {
            await this.sp.write(Buffer.from(senddata));
            await this.sleep();
            // // console.log("SendCode2M32Buffer Return true")
        } catch (err) {
            // console.log(err)
            // console.log(1, "Error in SendCode2M32Buffer");
        }
    }

    async CopyM32Buffer2Flash(flashaddress) {
        this.currentDownloadProcess = this.DownloadProcess.copyM32Buffer2Flash;
        this.flashAddressOfCopyM32Buffer2Flash = flashaddress;
        // console.log(`---Ram to Flash: @ ${flashaddress.toString(16)}`);
        const senddata = new Uint32Array(this.CMD_RAM2FLASH_SEND_SIZE);
        // const senddata = Buffer.alloc(this.CMD_RAM2FLASH_SEND_SIZE)
        senddata[0] = 0x55; // CMD_PC_2_M32_HEAD0
        senddata[1] = 0xAA; // CMD_PC_2_M32_HEAD1
        senddata[2] = 0;    // cmd_index
        senddata[3] = 0x20; // CMD_RAM2FLASH

        const datelen = senddata.length;
        senddata[4] = datelen & 0xFF;
        senddata[5] = (datelen & 0xFF00) >> 8;

        senddata[6] = flashaddress & 0xFF;
        senddata[7] = (flashaddress & 0xFF00) >> 8;
        senddata[8] = (flashaddress & 0xFF0000) >> 16;
        senddata[9] = (flashaddress & 0xFF000000) >> 24;

        senddata[datelen - 1] = this.checksum(senddata);

        // console.log("CopyM32Buffer2Flash checksum " + this.checksum(senddata));
        // this.PrintHex(senddata);

        try {
            const result =  await this.sp.write(Buffer.from(senddata));
            await this.sleep(100);
            // // console.log("CopyM32Buffer2Flash return true");
        } catch (err) {
            // console.log(err);
            // // console.log(1, "Error in CopyM32Buffer2Flash");
        }
    }

    async CrcFlash(flashaddress) {
        this.currentDownloadProcess = this.DownloadProcess.crcFlash;
        const senddata = new Uint32Array(this.CMD_RAM2FLASH_SEND_SIZE)
        senddata[0] = 0x55; // CMD_PC_2_M32_HEAD0
        senddata[1] = 0xAA; // CMD_PC_2_M32_HEAD1
        senddata[2] = 0;    // cmd_index
        senddata[3] = 0x50; // CMD_CRC_FLASH

        const datelen = senddata.length;
        senddata[4] = datelen & 0x000000FF;
        senddata[5] = (datelen & 0x0000FF00) >> 8;
        senddata[6] = flashaddress & 0x000000FF;
        senddata[7] = (flashaddress & 0x0000FF00) >> 8;
        senddata[8] = (flashaddress & 0x00FF0000) >> 16;
        senddata[9] = (flashaddress & 0xFF000000) >> 24;

        senddata[datelen - 1] = this.checksum(senddata);
        // this.PrintHex(senddata);
        // console.log("CRC Flash Checksum: " + this.checksum(senddata));

        try {
            await this.sp.write(Buffer.from(senddata));
            await this.sleep();
        } catch (err) {
            // console.log("err:",err);
            // console.log(1, "Error in CrcFlash");
        }
    }

    CrcCodeArra(codebuffer) {
        return this.crc32_stm(codebuffer);
    }

    crc32_stm(bytesArr) {
        let length = bytesArr.length;
        let k = 0;
        let crc = 0xffffffff;

        // Process 4-byte chunks
        while (length >= 4) {
            let v = ((bytesArr[k] << 24) & 0xFF000000) |
                ((bytesArr[k + 1] << 16) & 0xFF0000) |
                ((bytesArr[k + 2] << 8) & 0xFF00) |
                (bytesArr[k + 3] & 0xFF);

            crc = ((crc << 8) & 0xffffffff) ^ this.custom_crc32_table[0xFF & ((crc >> 24) ^ v)];
            crc = ((crc << 8) & 0xffffffff) ^ this.custom_crc32_table[0xFF & ((crc >> 24) ^ (v >> 8))];
            crc = ((crc << 8) & 0xffffffff) ^ this.custom_crc32_table[0xFF & ((crc >> 24) ^ (v >> 16))];
            crc = ((crc << 8) & 0xffffffff) ^ this.custom_crc32_table[0xFF & ((crc >> 24) ^ (v >> 24))];

            k += 4;
            length -= 4;
        }

        // Process remaining bytes
        if (length > 0) {
            let v = 0;
            for (let i = 0; i < length; i++) {
                v |= (bytesArr[k + i] << (24 - i * 8));
            }

            if (length === 1) {
                v &= 0xFF000000;
            } else if (length === 2) {
                v &= 0xFFFF0000;
            } else if (length === 3) {
                v &= 0xFFFFFF00;
            }

            crc = ((crc << 8) & 0xffffffff) ^ this.custom_crc32_table[0xFF & ((crc >> 24) ^ (v))];
            crc = ((crc << 8) & 0xffffffff) ^ this.custom_crc32_table[0xFF & ((crc >> 24) ^ (v >> 8))];
            crc = ((crc << 8) & 0xffffffff) ^ this.custom_crc32_table[0xFF & ((crc >> 24) ^ (v >> 16))];
            crc = ((crc << 8) & 0xffffffff) ^ this.custom_crc32_table[0xFF & ((crc >> 24) ^ (v >> 24))];
        }

        // // console.log("CRC: "+crc);
        return crc >>> 0;
    }

    async SaveNameToSTM32(filename = "ABC") {
        let cmdIndex = 0;
        // console.log(10, `---Save Name To Flash : ${filename}`);
        let filenameArray = Buffer.from(filename, 'utf-8');

        let sendData = Buffer.alloc(this.CMD_SAVEFILENAME_SEND_SIZE);
        sendData[0] = 0x55;
        sendData[1] = 0xAA;
        sendData[2] = cmdIndex;
        sendData[3] = 0x30;
        let dataLen = sendData.length;
        sendData[4] = dataLen & 0x000000FF;
        sendData[5] = (dataLen & 0x0000FF00) >> 8;

        // Copy filename into send data
        for (let i = 0; i < 8; i++) {
            if (i < filenameArray.length) {
                sendData[6 + i] = filenameArray[i];
            } else {
                sendData[6 + i] = 0;
            }
        }
        // Add checksum
        sendData[dataLen - 1] = this.checksum(sendData);

        await this.sp.write(Buffer.from(sendData));
        await this.sleep(100);
    }

    PrintHex(data) {
        const l = Array.from(data).map(byte => '0x' + byte.toString(16).padStart(1, '0'));
        const hexString = l.join(',');
//        fs.writeFile(`Readbin_js.txt`, hexString, err => {
//            if (err) {
//                console.error("err: ", err);
//            } else {
//                // file written successfully
//            }
//        });
        // console.log(hexString);
    }

    checksum(data) {
        let sum = 0;
        let codelen = data.length - 1;

        for (let i = 0; i < codelen; i++) {
            sum += data[i];
        }

        sum = sum & 0xff;
        sum = (~sum) & 0xff;

        return sum;
    }

    retHex(bytes) {
        const l = Array.from(bytes).map(byte => '0x' + byte.toString(16).padStart(1, '0'));
        const hexString = l.join(',');
        return hexString;
    }

    async RunCode(downloadAddress) {
        this.currentDownloadProcess = this.DownloadProcess.runCode;
        this.downloadAddressOfRunCode = downloadAddress;
        // console.log(4, `---RunCode : @ ${downloadAddress.toString(16)}`);
        let address = parseInt(downloadAddress, 16);
        // console.log(4, `---RunCode address: @ ${address}`);

        try {
            // const senddata = Buffer.alloc(11);
            const senddata = new Uint32Array(11);
            senddata[0] = 0x55;
            senddata[1] = 0xAA;
            senddata[2] = 0; // cmd_indexa
            senddata[3] = 0x40;
            const datalen = senddata.length;
            senddata[4] = datalen & 0x000000FF;
            senddata[5] = (datalen & 0x0000FF00) >> 8;
            senddata[6] = downloadAddress & 0x000000FF;
            senddata[7] = (downloadAddress & 0x0000FF00) >> 8;
            senddata[8] = (downloadAddress & 0x00FF0000) >> 16;
            senddata[9] = (downloadAddress & 0xFF000000) >> 24;
            senddata[datalen - 1] = this.checksum(senddata);

            // console.log("Runcode Checksum " + this.checksum(senddata))
            // this.PrintHex(senddata);
            await this.sp.write(this.pingControl());
            await this.sp.write(Buffer.from(senddata));
            await this.sleep();

        } catch (err) {
            // console.log(err)
            // if (this.port) this.port.close();
            // console.log(1, "Error RunCode");
            return false;
        }
    }

    sleep(time = 50) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    // Dummy base path method to simulate fetching the base path
    getBasePath() {
        return process.cwd(); // Use current directory as base path
    }

    // Logging function with print levels
    printLog(level, msg) {
        if (msg === "") return;
        if (level <= this.PRINT_LEVEL) {
            // console.log(msg);
        }
    }

    // Function to check if a compilation error occurred
    isCompileError(msg) {
        return msg.includes("error");
    }

    // Function to execute shell commands
    runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args);
            let output = '';
            let error = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                error += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(error);
                }
            });
        });
    }

    // Compile function
    async compile() {
        try {
            let errorCount = 0;
            let i = 0;

            for (let dir of this.srcDirList) {
                const files = fs.readdirSync(dir);
                for (let file of files) {
                    if (file.endsWith(".c")) {
                        let filePath = path.join(dir, file);
                        let objFilePath = path.join(this.debugSrcDirList[i], file.replace(".c", ".o"));
                        let objFilePathD = path.join(this.debugSrcDirList[i], file.replace(".c", ".d"));

                        // Command to compile C file
                        const cmdBuilder = [
                            `${this.basePath}/app/drivers/whalesbot_mc_102/arm_gcc_10/bin/arm-none-eabi-gcc.exe`,
                            filePath,
                            "-mcpu=cortex-m3", "-std=gnu11", "-g3", "-DDEBUG", "-DSTM32", "-DSTM32F1", "-DSTM32F101VETx", "-c",
                            `-I${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Inc/user`,
                            `-I${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Inc/control`,
                            `-I${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Inc/externlib`,
                            `-I${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Inc`,
                            `-I${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/STM32_Stdlib/CMSIS/CM3/DeviceSupport/ST/STM32F10x`,
                            `-I${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/STM32_Stdlib/STM32F10x_StdPeriph_Driver/inc`,
                            `-I${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/STM32_Stdlib/CMSIS/CM3/CoreSupport`,
                            `-I${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/STM32_Stdlib/FreeRTOS/inc`,
                            "-Ofast", "-ffunction-sections", "-fdata-sections", "-Wall", "-fstack-usage", "-MMD", "-MP",
                            "-MF", objFilePathD,
                            "-MT", objFilePath,
                            "--specs=nano.specs", "-mfloat-abi=soft", "-mthumb",
                            "-o", objFilePath
                        ];
                        // console.log(10, `Compiling ${file}`);

                        const result = await this.runCommand(cmdBuilder[0], cmdBuilder.slice(1));
                        // console.log(5, result);
                        if (this.isCompileError(result)) {
                            errorCount++;
                        }
                    }
                }
                i++;
            }
            return errorCount === 0;
        } catch (err) {
            // console.log(5, `Compile Error: ${err}`);
            return false;
        }
    }

    // Linking logic
    async link() {
        try {
            let objFiles = [];
            for (let dir of this.objDirList) {
                const files = fs.readdirSync(dir);
                for (let file of files) {
                    if (file.endsWith(".o")) {
                        objFiles.push(path.join(dir, file));
                    }
                }
            }

            fs.writeFileSync(this.linkParaList.replace(/"/g, ""), "");  // Clear file
            objFiles.reverse().forEach((file) => {
                fs.appendFileSync(this.linkParaList.replace(/"/g, ""), `"${file}"\n`);
            });

            const linkCommand = [
                `${this.basePath}/app/drivers/whalesbot_mc_102/arm_gcc_10/bin/arm-none-eabi-gcc`,
                "-o", `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/AT32Gcc.elf`,
                // `@${this.linkParaList}`,
                ...objFiles,
                "-mcpu=cortex-m3","-T",
                `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/linkscript/stm32_flash.ld`,
                "--specs=nosys.specs", `-Wl,-Map=${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/AT32Gcc.map`,
                "-Wl,--gc-sections", "-static", "--specs=nano.specs", "-mfloat-abi=soft", "-mthumb", "-u", "_printf_float", "-u", "_scanf_float", "-Wl,--start-group", "-lc", "-lm", "-Wl,--end-group"
            ];

            const result = await this.runCommand(linkCommand[0], linkCommand.slice(1));
            // console.log(5, result);
            return !this.isCompileError(result);
        } catch (err) {
            // console.log(5, `Link Error: ${err}`);
            return false;
        }
    }

    // Generate binary
    async makeBin() {
        try {
            const binCommand = [
                `${this.basePath}/app/drivers/whalesbot_mc_102/arm_gcc_10/bin/arm-none-eabi-objcopy`,
                "-O", "binary",
                `${this.basePath}/app/drivers/whalesbot_mc_102//AT32Gcc/Debug/AT32Gcc.elf`,
                `${this.basePath}/app/drivers/whalesbot_mc_102//AT32Gcc/Debug/Run.bin`
            ];

            const result = await this.runCommand(binCommand[0], binCommand.slice(1));
            // console.log(5, result);
            return !this.isCompileError(result);
        } catch (err) {
            // console.log(5, `MakeBin Error: ${err}`);
            return false;
        }
    }

    async getSize() {
        try {
            const sizeCommand = [
                `${this.basePath}/app/drivers/whalesbot_mc_102/arm_gcc_10/bin/arm-none-eabi-size`,
                `${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Debug/AT32Gcc.elf`
            ];

            const result = await this.runCommand(sizeCommand[0], sizeCommand.slice(1));
            // console.log(5, result);
            return true;
        } catch (err) {
            // console.log(5, `GetSize Error: ${err}`);
            return false;
        }
    }

    // Main method to execute all steps
    async build(cmd, all = false) {
        try {
            if (all) {
                this.srcDirList.push(`${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Src/control/`);
            }

            this.writeBufferToFile(`${this.basePath}/app/drivers/whalesbot_mc_102/AT32Gcc/Src/user/user_main.c`, cmd)

            const compileSuccess = await this.compile();
            if (!compileSuccess) throw new Error("Compile failed");

            const linkSuccess = await this.link();
            if (!linkSuccess) throw new Error("Linking failed");

            const binSuccess = await this.makeBin();
            if (!binSuccess) throw new Error("Binary generation failed");

            const sizeSuccess = await this.getSize();
            if (!sizeSuccess) throw new Error("Size calculation failed");

            // console.log(5, "Build completed successfully!");
            return true;
        } catch (error) {
            // console.log(5, `Build failed: ${error.message}`);
            return false;
        }
    }

    generate_crc32_table()
    {
        for (let i = 0; i < 256; i++) {
            let c = i << 24;
            for (let j = 0; j < 8; j++) {
                if (c & 0x80000000) {
                    c = ((c << 1) ^ 0x04C11DB7) >>> 0; // Dịch trái và XOR với 0x04C11DB7
                } else {
                    c = (c << 1) >>> 0; // Chỉ dịch trái và ép thành số không dấu
                }
            }
            this.custom_crc32_table[i] = c >>> 0; // Giới hạn mỗi giá trị trong phạm vi 32-bit
        }

        // this.PrintHex(this.custom_crc32_table);
    }
}

module.exports = new WhalesbotMC102();
