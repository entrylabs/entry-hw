
function watch_dog_logger(log_message){
    let watch_dog = new Module();
    
    return watch_dog.log_message = log_message;
}


function micros (return_float) {
    // http://jsphp.co/jsphp/fn/view/gettimeofday
    // + original by: Brett Zamir (http://brett-zamir.me)
    // +      derived from: Josh Fraser (http://onlineaspect.com/2007/06/08/auto-detect-a-time-zone-with-javascript/)
    // +         parts by: Breaking Par Consulting Inc (http://www.breakingpar.com/bkp/home.nsf/0/87256B280015193F87256CFB006C45F7)
    // +  revised by: Theriault
    // *   example 1: gettimeofday();
    // *   returns 1: {sec: 12, usec: 153000, minuteswest: -480, dsttime: 0}
    // *   example 1: gettimeofday(true);
    // *   returns 1: 1238748978.49
    var t = new Date(),
        y = 0;

    if (return_float) {
        return t.getTime() / 1000;
    }

    y = t.getFullYear(); // Store current year.
    return {
        sec: t.getUTCSeconds(),
        usec: t.getUTCMilliseconds() * 1000,
        minuteswest: t.getTimezoneOffset(),
        // Compare Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC to see if DST is observed.
        dsttime: 0 + (((new Date(y, 0)) - Date.UTC(y, 0)) !== ((new Date(y, 6)) - Date.UTC(y, 6)))
    };
}

function _delay_us(return_float){
    delay = function (ms) {
        ms += +new Date();
        while (+new Date() < ms) { }
    }
    return (delay * 1000);
}

class twi{
    constructor(){
        this.F_CPU  = 1000000;
        this.TWI_FREQ = 100000; 
        this.TWI_BUFFER_LENGTH = 32;
        this.WIRE_HAS_END = 0;
    
        this.TWI_READY = 0;
        this.TWI_MRX   = 1;
        this.TWI_MTX   = 2;
        this.TWI_SRX   = 3;
        this.TWI_STX   = 4;
        
        this.SFR_MEM_ADDR(sfr) = (new Uint16Array() & (sfr));
        this._SFR_ADDR(sfr) = _SFR_MEM_ADDR(sfr);
        this._MMIO_BYTE(mem_addr) = new Uint8Array(mem_addr);

        this._SFR_BYTE(sfr) = this._MMIO_BYTE(_SFR_ADDR(sfr));

        this.cbi(sfr, bit) = (this._SFR_BYTE(sfr) &= ~ this._BV(bit));
        this.sbi(sfr, bit) = (this._SFR_BYTE(sfr) |= this._BV(bit));
        

        this.twi_state = new Uint8Array();
        this.twi_slarw = new Uint8Array();
        this.twi_sendStop = new Uint8Array();			// should the transaction end with a stop
        this.twi_inRepStart = new Uint8Array();			// in the middle of a repeated start
        
        // twi_timeout_us > 0 prevents the code from getting stuck in various while loops here
        // if twi_timeout_us == 0 then timeout checking is disabled (the previous Wire lib behavior)
        // at some point in the future, the default twi_timeout_us value could become 25000
        // and twi_do_reset_on_timeout could become true
        // to conform to the SMBus standard
        // http://smbus.org/specs/SMBus_3_1_20180319.pdf

        this.twi_timeout_us = new Uint32Array();
        this.twi_timeout_us = 0 ;

        this.twi_timed_out_flag = false;  // a timeout has been seen
        this.twi_do_reset_on_timeout = false;  // reset the TWI registers on timeout
        
        
        this.twi_masterBuffer[TWI_BUFFER_LENGTH] = new Uint8Array();
        this.twi_masterBufferIndex = new Uint8Array();
        this.twi_masterBufferLength = new Uint8Array();
        
        this.twi_txBuffer[TWI_BUFFER_LENGTH] = new Uint8Array();
        this.twi_txBufferIndex = new Uint8Array();
        this.twi_txBufferLength = new Uint8Array();
        
        this.twi_rxBuffer[TWI_BUFFER_LENGTH] = new Uint8Array();
        this.twi_rxBufferIndex = new Uint8Array();

        this.twi_error = new Uint8Array();        

        /*
            Initilize TWSR, ...
        */

        this.TWBR7,
        this.TWBR6,
        this.TWBR5,
        this.TWBR4,
        this.TWBR3,
        this.TWBR2,
        this.TWBR1,
        this.TWBR0 = 0;
        this.TWBR = new Uint8Array([this.TWBR7, this.TWBR6, this.TWBR5, this.TWBR4, this.TWBR3, this.TWBR2, this.TWBR1, this.TWBR0]);
              
        this.TWINT,
        this.TWEA,
        this.TWSTA,
        this.TWSTO, 
        this.TWWC, 
        this.TWEN, 
        this.TWIE = 0; 
        this.TWCR = new Uint8Array([this.TWINT, this.TWEA, this.TWSTA, this.TWSTO, this.TWWC, this.TWEN, 0, this.TWIE]);
        

        this.TWS7, this.TWS6, this.TWS5, this.TWS4, this.TWS3 = 1;
        this.TWPS1, this.TWPS0 = 0;
        this.TWSR = new Uint8Array([this.TWS7, this.TWS6, this.TWS5, this.TWS4, this.TWS3, 0, this.TWPS1, this.TWPS0]);

        this.TWA6, this.TWA6, this.TWA6, this.TWA6, this.TWA6, this.TWA6, this.TWA6 = 1;
        this.TWGCE = 0;
        this.TWAR = new Uint8Array([this.TWA6, this.TWA6, this.TWA6, this.TWA6, this.TWA6, this.TWA6, this.TWA6, this.TWGCE]);

        let wait_data =  0x00;
        this.TWDR = wait_data;

        this.SDA = 4;   //A4(SDA) port
        this.SCL = 5;   //A5(SCL) port

    
        /*@{*/
        /* Master */
        /** \ingroup util_twi
        \def TW_START
        start condition transmitted */
        this.TW_START = 0x08;

        /** \ingroup util_twi
            \def TW_REP_START
            repeated start condition transmitted */
        this.TW_REP_START = 0x10;
        
        /* Master Transmitter */
        /** \ingroup util_twi
            \def TW_MT_SLA_ACK
            SLA+W transmitted, ACK received */
        this.TW_MT_SLA_ACK	= 0x18;
        
        /** \ingroup util_twi
            \def TW_MT_SLA_NACK
            SLA+W transmitted, NACK received */
        this.TW_MT_SLA_NACK	= 0x20;
        
        /** \ingroup util_twi
            \def TW_MT_DATA_ACK
            data transmitted, ACK received */
        this.TW_MT_DATA_ACK	= 0x28;
        
        /** \ingroup util_twi
            \def TW_MT_DATA_NACK
            data transmitted, NACK received */
        this.TW_MT_DATA_NACK = 0x30;
        
        /** \ingroup util_twi
            \def TW_MT_ARB_LOST
            arbitration lost in SLA+W or data */
        this.TW_MT_ARB_LOST = 0x38;
        
        /* Master Receiver */
        /** \ingroup util_twi
            \def TW_MR_ARB_LOST
            arbitration lost in SLA+R or NACK */
        this.TW_MR_ARB_LOST	 = 0x38;
        
        /** \ingroup util_twi
            \def TW_MR_SLA_ACK
            SLA+R transmitted, ACK received */
        this.TW_MR_SLA_ACK	= 0x40;
        
        /** \ingroup util_twi
            \def TW_MR_SLA_NACK
            SLA+R transmitted, NACK received */
        this.TW_MR_SLA_NACK	= 0x48;
        
        /** \ingroup util_twi
            \def TW_MR_DATA_ACK
            data received, ACK returned */
        this.TW_MR_DATA_ACK	= 0x50;
        
        /** \ingroup util_twi
            \def TW_MR_DATA_NACK
            data received, NACK returned */
        this.TW_MR_DATA_NACK = 0x58;
        
        /* Slave Transmitter */
        /** \ingroup util_twi
            \def TW_ST_SLA_ACK
            SLA+R received, ACK returned */
        this.TW_ST_SLA_ACK = 0xA8;
        
        /** \ingroup util_twi
            \def TW_ST_ARB_LOST_SLA_ACK
            arbitration lost in SLA+RW, SLA+R received, ACK returned */
        this.TW_ST_ARB_LOST_SLA_ACK	= 0xB0;
        
        /** \ingroup util_twi
            \def TW_ST_DATA_ACK
            data transmitted, ACK received */
        this.TW_ST_DATA_ACK	= 0xB8;
        
        /** \ingroup util_twi
            \def TW_ST_DATA_NACK
            data transmitted, NACK received */
        this.TW_ST_DATA_NACK = 0xC0;
        
        /** \ingroup util_twi
            \def TW_ST_LAST_DATA
            last data byte transmitted, ACK received */
        this.TW_ST_LAST_DATA = 0xC8;
        
        /* Slave Receiver */
        /** \ingroup util_twi
            \def TW_SR_SLA_ACK
            SLA+W received, ACK returned */
        this.TW_SR_SLA_ACK	= 0x60;
        
        /** \ingroup util_twi
            \def TW_SR_ARB_LOST_SLA_ACK
            arbitration lost in SLA+RW, SLA+W received, ACK returned */
        this.TW_SR_ARB_LOST_SLA_ACK	 = 0x68;
        
        /** \ingroup util_twi
            \def TW_SR_GCALL_ACK
            general call received, ACK returned */
        this.TW_SR_GCALL_AC =0x70;
        
        /** \ingroup util_twi
            \def TW_SR_ARB_LOST_GCALL_ACK
            arbitration lost in SLA+RW, general call received, ACK returned */
        this.TW_SR_ARB_LOST_GCALL_ACK  = 0x78;
        
        /** \ingroup util_twi
            \def TW_SR_DATA_ACK
            data received, ACK returned */
        this.TW_SR_DATA_ACK	= 0x80;
        
        /** \ingroup util_twi
            \def TW_SR_DATA_NACK
            data received, NACK returned */
        this.TW_SR_DATA_NACK = 0x88;
        
        /** \ingroup util_twi
            \def TW_SR_GCALL_DATA_ACK
            general call data received, ACK returned */
        this.TW_SR_GCALL_DATA_ACK = 0x90;
        
        /** \ingroup util_twi
            \def TW_SR_GCALL_DATA_NACK
            general call data received, NACK returned */
        this.TW_SR_GCALL_DATA_NACK	= 0x98;
        
        /** \ingroup util_twi
            \def TW_SR_STOP
            stop or repeated start condition received while selected */
        this.TW_SR_STOP	 = 0xA0;
        
        /* Misc */
        /** \ingroup util_twi
            \def TW_NO_INFO
            no state information available */
        this.TW_NO_INFO	= 0xF8;
        
        /** \ingroup util_twi
            \def TW_BUS_ERROR
            illegal start or stop condition */
        this.TW_BUS_ERROR = 0x00;


        /**
         * \ingroup util_twi
         * \def TW_STATUS_MASK
         * The lower 3 bits of TWSR are reserved on the ATmega163.
         * The 2 LSB carry the prescaler bits on the newer ATmegas.
         */
        this.TW_STATUS_MASK	= (this._BV(this.TWS7)|this._BV(this.TWS6)|this._BV(this.TWS5)|this._BV(this.TWS4)|this._BV(this.TWS3));
        /**
        * \ingroup util_twi
        * \def TW_STATUS
        *
        * TWSR, masked by TW_STATUS_MASK
        */
        this.TW_STATUS = (TWSR & this.TW_STATUS_MASK);
        /*@}*/
        /**
         * \name R/~W bit in SLA+R/W address field.
         */

        /*@{*/
        /** \ingroup util_twi
            \def TW_READ
            SLA+R address */
        this.TW_READ = 1;

        /** \ingroup util_twi
            \def TW_WRITE
            SLA+W address */
        this.TW_WRITE = 0;
        /*@}*/
        this.digitalWrite_Module = new Module();
    }


    _BV(n){
        return (1 << n);
    }

    /* 
    * Function twi_init
    * Desc     readys twi pins and sets twi bitrate
    * Input    none
    * Output   none
    */
    twi_init(){
        // initialize state
        this.twi_state = this.TWI_READY;
        this.twi_sendStop = true;		// default value
        this.twi_inRepStart = false;
        
        // activate internal pullups for twi.
        this.digitalWrite(this.SDA, 1);
        this.digitalWrite(this.SCL, 1);

        // initialize twi prescaler and bit rate
        this.cbi(this.TWSR, this.TWPS0);
        this.cbi(this.TWSR, this.TWPS1);
        this.TWBR = ((this.F_CPU / this.TWI_FREQ) - 16) / 2;

        /* twi bit rate formula from atmega128 manual pg 204
        SCL Frequency = CPU Clock Frequency / (16 + (2 * TWBR))
        note: TWBR should be 10 or higher for master mode
        It is 72 for a 16mhz Wiring board with 100kHz TWI */

        // enable twi module, acks, and twi interrupt
        this.TWCR = this._BV(this.TWEN) | this._BV(this.TWIE) | this._BV(this.TWEA);
    }


    /*
    *   Function digitalWrite
    *   Desc    I2C Configuration
    *   Input   I2C_typper, value
    *   Output  none
    *   Author  Remoted
    */


    digitalWrite(I2C_typper, value){
        let buffer = new Buffer();
   
        //Breaking Point
        buffer = Buffer.concat([buffer, this.digitalWrite_Module.makeOutputBuffer(this.digitalWrite_Module.sensorTypes.ANALOG, I2C_typper, value)]);
        
        // send data to device
        if (buffer.length) {
            this.digitalWrite_Module.sendBuffers.push(buffer);
        } 
    }
    
    /* 
    * Function twi_disable
    * Desc     disables twi pins
    * Input    none
    * Output   none
    */
    twi_disable(){
        // disable twi module, acks, and twi interrupt
        this.TWCR &= ~(this._BV(this.TWEN) | this._BV(this.TWIE) | this._BV(this.TWEA));
        // deactivate internal pullups for twi.
     
        this.digitalWrite(this.SDA, 0);
        this.digitalWrite(this.SCL, 0);
    }

    /* 
    * Function twi_slaveInit
    * Desc     sets slave address and enables interrupt
    * Input    none
    * Output   none
    */
    twi_setAddress(address){
      // set twi slave address (skip over TWGCE bit)
      let _address = new Uint8Array();
      _address = address;
      this.TWAR = _address << 1;
      
      watch_dog_logger("address setting: " + _address);
    }

    /* 
    * Function twi_setClock
    * Desc     sets twi bit rate
    * Input    Clock Frequency
    * Output   none
    */
    twi_setFrequency(frequency){
        let _frequency = new Uint32Array();
        _frequency = frequency;

        this.TWBR = ((this.F_CPU / _frequency) - 16) / 2;
        
        /* twi bit rate formula from atmega128 manual pg 204
        SCL Frequency = CPU Clock Frequency / (16 + (2 * TWBR))
        note: TWBR should be 10 or higher for master mode
        It is 72 for a 16mhz Wiring board with 100kHz TWI */
    }

    /* 
    * Function twi_readFrom
    * Desc     attempts to become twi bus master and read a
    *          series of bytes from a device on the bus
    * Input    address: 7bit i2c device address
    *          data: pointer to byte array
    *          length: number of bytes to read into array
    *          sendStop: Boolean indicating whether to send a stop at the end
    * Output   number of bytes read
    */
    twi_readFrom(address, data, length, sendStop){
        let i = new Uint8Array();

        // ensure data will fit into buffer
        if(this.TWI_BUFFER_LENGTH < length){
            return 0;
        }

        // wait until twi is ready, become master receiver
        // micro_second method
        let startMicros =  new Uint32Array();
        startMicros = micros();

        while(this.TWI_READY != this.twi_state){
            if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
            this.twi_handleTimeout(this.twi_do_reset_on_timeout);
            return 0;
            }
        }
        this.twi_state = this.TWI_MRX;
        this.twi_sendStop = sendStop;
        // reset error state (0xFF.. no error occured)
        this.twi_error = 0xFF;

        // initialize buffer iteration vars
        this.twi_masterBufferIndex = 0;
        this.twi_masterBufferLength = length-1;  // This is not intuitive, read on...
        // On receive, the previously configured ACK/NACK setting is transmitted in
        // response to the received byte before the interrupt is signalled. 
        // Therefor we must actually set NACK when the _next_ to last byte is
        // received, causing that NACK to be sent in response to receiving the last
        // expected byte of data.

        // build sla+w, slave device address + w bit
        this.twi_slarw = this.TW_READ;
        this.twi_slarw |= address << 1;

        if (true == this.twi_inRepStart) {
            // if we're in the repeated start state, then we've already sent the start,
            // (@@@ we hope), and the TWI statemachine is just waiting for the address byte.
            // We need to remove ourselves from the repeated start state before we enable interrupts,
            // since the ISR is ASYNC, and we could get confused if we hit the ISR before cleaning
            // up. Also, don't enable the START interrupt. There may be one pending from the 
            // repeated start that we sent ourselves, and that would really confuse things.
            this.twi_inRepStart = false;			// remember, we're dealing with an ASYNC ISR
            startMicros = micros();
            do {
                this.TWDR = this.twi_slarw;
                if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
                    this.twi_handleTimeout(this.twi_do_reset_on_timeout);
                    return 0;
                }
            } while(this.TWCR & this._BV(this.TWWC));
            this.TWCR = this._BV(this.TWINT) | this._BV(this.TWEA) | this._BV(this.TWEN) | this._BV(this.TWIE);	// enable INTs, but not START
        } else {
            // send start condition
            this.TWCR = this._BV(this.TWEN) | this._BV(this.TWIE) | this._BV(this.TWEA) | this._BV(this.TWINT) | this._BV(this.TWSTA);
        }

        // wait for read operation to complete
        startMicros = micros();
        while(this.TWI_MRX == this.twi_state){
            if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
                this.twi_handleTimeout(this.twi_do_reset_on_timeout);
                return 0;
            }
        }

        if (this.twi_masterBufferIndex < length) {
            length = this.twi_masterBufferIndex;
        }

        // copy twi buffer to data
        for(i = 0; i < length; ++i){
            data[i] = this.twi_masterBuffer[i];
        }

        return length;
        //uint_8  - unsigned char
    }


    /* 
    * Function twi_writeTo
    * Desc     attempts to become twi bus master and write a
    *          series of bytes to a device on the bus
    * Input    address: 7bit i2c device address
    *          data: pointer to byte array
    *          length: number of bytes in array
    *          wait: boolean indicating to wait for write or not
    *          sendStop: boolean indicating whether or not to send a stop at the end
    * Output   0 .. success
    *          1 .. length to long for buffer
    *          2 .. address send, NACK received
    *          3 .. data send, NACK received
    *          4 .. other twi error (lost bus arbitration, bus error, ..)
    *          5 .. timeout
    */
    twi_writeTo(address, data, length, wait, sendStop){
        let i = Uint8Array();

        // ensure data will fit into buffer
        if(this.TWI_BUFFER_LENGTH < length){
            return 1;
        }

        // wait until twi is ready, become master transmitter
        let startMicros = new Uint32Array();
        startMicros = micros();

        while(this.TWI_READY != this.twi_state){
            if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
                this.twi_handleTimeout(this.twi_do_reset_on_timeout);
                return (5);
            }
        }
        this.twi_state = this.TWI_MTX;
        this.twi_sendStop = sendStop;
        // reset error state (0xFF.. no error occured)
        this.twi_error = 0xFF;

        // initialize buffer iteration vars
        this.twi_masterBufferIndex = 0;
        this.twi_masterBufferLength = length;
        
        // copy data to twi buffer
        for(i = 0; i < length; ++i){
            this.twi_masterBuffer[i] = data[i];
        }
        
        // build sla+w, slave device address + w bit
        this.twi_slarw = this.TW_WRITE;
        this.twi_slarw |= address << 1;
        
        // if we're in a repeated start, then we've already sent the START
        // in the ISR. Don't do it again.
        //
        if (true == this.twi_inRepStart) {
            // if we're in the repeated start state, then we've already sent the start,
            // (@@@ we hope), and the TWI statemachine is just waiting for the address byte.
            // We need to remove ourselves from the repeated start state before we enable interrupts,
            // since the ISR is ASYNC, and we could get confused if we hit the ISR before cleaning
            // up. Also, don't enable the START interrupt. There may be one pending from the 
            // repeated start that we sent outselves, and that would really confuse things.
            this.twi_inRepStart = false;			// remember, we're dealing with an ASYNC ISR
            startMicros = micros();
            do {
                this.TWDR = this.twi_slarw;
                if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
                    this.twi_handleTimeout(this.twi_do_reset_on_timeout);
                    return (5);
                }
            } while(this.TWCR & this._BV(this.TWWC));
            this.TWCR = this._BV(this.TWINT) | this._BV(this.TWEA) | this._BV(this.TWEN) | this._BV(this.TWIE);	// enable INTs, but not START
        } else {
            // send start condition
            this.TWCR = this._BV(this.TWINT) | this._BV(this.TWEA) | this._BV(this.TWEN) | this._BV(this.TWIE) | this._BV(this.TWSTA);	// enable INTs
        }

        // wait for write operation to complete
        startMicros = micros();
        while(wait && (this.TWI_MTX == this.twi_state)){
            if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
                this.twi_handleTimeout(this.twi_do_reset_on_timeout);
                return (5);
            }
        }
        
        if (this.twi_error == 0xFF)
            return 0;	// success
        else if (this.twi_error == this.TW_MT_SLA_NACK)
            return 2;	// error: address send, nack received
        else if (this.twi_error == this.TW_MT_DATA_NACK)
            return 3;	// error: data send, nack received
        else
            return 4;	// other twi error
    }

    /* 
    * Function twi_transmit
    * Desc     fills slave tx buffer with data
    *          must be called in slave tx event callback
    * Input    data: pointer to byte array
    *          length: number of bytes in array
    * Output   1 length too long for buffer
    *          2 not slave transmitter
    *          0 ok
    */
    twi_transmit(data, length){
        let i = new Uint8Array();

        // ensure data will fit into buffer
        if(this.TWI_BUFFER_LENGTH < (this.twi_txBufferLength+length)){
            return 1;
        }
        
        // ensure we are currently a slave transmitter
        if(this.TWI_STX != this.twi_state){
            return 2;
        }
        
        // set length and copy data into tx buffer
        for(i = 0; i < length; ++i){
            this.twi_txBuffer[this.twi_txBufferLength+i] = data[i];
        }
        this.twi_txBufferLength += length;
        
        return 0;
    }

    /* 
    * Function twi_attachSlaveRxEvent
    * Desc     sets function called before a slave read operation
    * Input    function: callback function to use
    * Output   none
    */
    twi_attachSlaveRxEvent(recv_function){
        this.twi_onSlaveReceive = recv_function(uint8_t_param, int_t_param);
    }

    /* 
    * Function twi_attachSlaveTxEvent
    * Desc     sets function called before a slave write operation
    * Input    function: callback function to use
    * Output   none
    */
    twi_attachSlaveTxEvent(recv_function){
        this.twi_onSlaveTransmit = recv_function();
    }

    /* 
    * Function twi_reply
    * Desc     sends byte or readys receive line
    * Input    ack: byte indicating to ack or to nack
    * Output   none
    */
    twi_reply(ack){
        // transmit master read ready signal, with or without ack
        if(ack){
            this.TWCR = this._BV(this.TWEN) | this._BV(this.TWIE) | this._BV(this.TWINT) | this._BV(this.TWEA);
        }else{
            this.TWCR = this._BV(this.TWEN) | this._BV(this.TWIE) | this._BV(this.TWINT);
        }
    }

    /* 
    * Function twi_stop
    * Desc     relinquishes bus master status
    * Input    none
    * Output   none
    */
    twi_stop(){
        // send stop condition
        this.TWCR = this._BV(this.TWEN) | this._BV(this.TWIE) | this._BV(this.TWEA) | this._BV(this.TWINT) | this._BV(this.TWSTO);

        // wait for stop condition to be exectued on bus
        // TWINT is not set after a stop condition!
        // We cannot use micros() from an ISR, so approximate the timeout with cycle-counted delays
        const us_per_loop = new Uint8Array();
        us_per_loop = 8;

        let counter = Uint32Array();
        counter = (this.twi_timeout_us + us_per_loop - 1)/us_per_loop; // Round up
        while(this.TWCR & this._BV(this.TWSTO)){
            if(this.twi_timeout_us > 0){
                if (counter > 0){
                    _delay_us(10);
                    counter--;
                } else {
                    this.twi_handleTimeout(this.twi_do_reset_on_timeout);
                    return;
                }
            }
        }

        // update twi state
        this.twi_state = this.TWI_READY;
    }

    /* 
    * Function twi_releaseBus
    * Desc     releases bus control
    * Input    none
    * Output   none
    */
    twi_releaseBus(){
        // release bus
        this.TWCR = this._BV(this.TWEN) | this._BV(this.TWIE) | this._BV(this.TWEA) | this._BV(this.TWINT);

        // update twi state
        this.twi_state = this.TWI_READY;
    }

    /* 
    * Function twi_setTimeoutInMicros
    * Desc     set a timeout for while loops that twi might get stuck in
    * Input    timeout value in microseconds (0 means never time out)
    * Input    reset_with_timeout: true causes timeout events to reset twi
    * Output   none
    */
    twi_setTimeoutInMicros(timeout, reset_with_timeout){
        this.twi_timed_out_flag = false;
        this.twi_timeout_us = timeout;
        this.twi_do_reset_on_timeout = reset_with_timeout;
    }
    
    /* 
    * Function twi_handleTimeout
    * Desc     this gets called whenever a while loop here has lasted longer than
    *          twi_timeout_us microseconds. always sets twi_timed_out_flag
    * Input    reset: true causes this function to reset the twi hardware interface
    * Output   none
    */
    twi_handleTimeout(reset){
        this.twi_timed_out_flag = true;
    
        if (reset) {
            // remember bitrate and address settings
            let previous_TWBR = new Uint8Array();
            previous_TWBR = this.TWBR;


            let previous_TWAR = new Uint8Array();
            previous_TWAR = this.TWAR;
        
            // reset the interface
            this.twi_disable();
            this.twi_init();
        
            // reapply the previous register values
            this.TWAR = previous_TWAR;
            this.TWBR = previous_TWBR;
        }
    }



    /*
    * Function twi_manageTimeoutFlag
    * Desc     returns true if twi has seen a timeout
    *          optionally clears the timeout flag
    * Input    clear_flag: true if we should reset the hardware
    * Output   none
    */
    twi_manageTimeoutFlag(clear_flag){
        flag = this.twi_timed_out_flag;
        if (clear_flag){
            this.twi_timed_out_flag = false;
        }
        return (flag);
    }

    ISR(TWI_vect)
    {
      switch(this.TW_STATUS){
        // All Master
        case this.TW_START:     // sent start condition
        case this.TW_REP_START: // sent repeated start condition
          // copy device address and r/w bit to output register and ack
          this.TWDR = this.twi_slarw;
          this.twi_reply(1);
          break;
    
        // Master Transmitter
        case this.TW_MT_SLA_ACK:  // slave receiver acked address
        case this.TW_MT_DATA_ACK: // slave receiver acked data
          // if there is data to send, send it, otherwise stop 
          if(this.twi_masterBufferIndex < this.twi_masterBufferLength){
            // copy data to output register and ack
            TWDR = this.twi_masterBuffer[this.twi_masterBufferIndex++];
            this.twi_reply(1);
          }else{
                if (this.twi_sendStop){
                    this.twi_stop();
                } else {
                    this.twi_inRepStart = true;	// we're gonna send the START
                    // don't enable the interrupt. We'll generate the start, but we
                    // avoid handling the interrupt until we're in the next transaction,
                    // at the point where we would normally issue the start.
                    this.TWCR = this._BV(this.TWINT) | this._BV(this.TWSTA)| this._BV(this.TWEN) ;
                    this.twi_state = this.TWI_READY;
                }
          }
          break;
        case this.TW_MT_SLA_NACK:  // address sent, nack received
            this.twi_error = this.TW_MT_SLA_NACK;
            this.twi_stop();
            break;
        case this.TW_MT_DATA_NACK: // data sent, nack received
            this.twi_error = this.TW_MT_DATA_NACK;
            this.twi_stop();
            break;
        case this.TW_MT_ARB_LOST: // lost bus arbitration
            this.twi_error = this.TW_MT_ARB_LOST;
            this.twi_releaseBus();
            break;
    
        // Master Receiver
        case this.TW_MR_DATA_ACK: // data received, ack sent
          // put byte into buffer
          this.twi_masterBuffer[this.twi_masterBufferIndex++] = this.TWDR;
          //__attribute__ ((fallthrough));
        case this.TW_MR_SLA_ACK:  // address sent, ack received
          // ack if more bytes are expected, otherwise nack
          if(this.twi_masterBufferIndex < this.twi_masterBufferLength){
            this.twi_reply(1);
          }else{
            this.twi_reply(0);
          }
          break;
        case this.TW_MR_DATA_NACK: // data received, nack sent
          // put final byte into buffer
          this.twi_masterBuffer[this.twi_masterBufferIndex++] = this.TWDR;
          if (this.twi_sendStop){
            this.twi_stop();
          } else {
            this.twi_inRepStart = true;	// we're gonna send the START
            // don't enable the interrupt. We'll generate the start, but we
            // avoid handling the interrupt until we're in the next transaction,
            // at the point where we would normally issue the start.
            this.TWCR = this._BV(this.TWINT) | this._BV(this.TWSTA)| this._BV(this.TWEN) ;
            this.twi_state = this.TWI_READY;
          }
          break;
        case this.TW_MR_SLA_NACK: // address sent, nack received
            this.twi_stop();
          break;
        // TW_MR_ARB_LOST handled by TW_MT_ARB_LOST case
    
        // Slave Receiver
        case this.TW_SR_SLA_ACK:   // addressed, returned ack
        case this.TW_SR_GCALL_ACK: // addressed generally, returned ack
        case this.TW_SR_ARB_LOST_SLA_ACK:   // lost arbitration, returned ack
        case this.TW_SR_ARB_LOST_GCALL_ACK: // lost arbitration, returned ack
          // enter slave receiver mode
          this.twi_state = this.TWI_SRX;
          // indicate that rx buffer can be overwritten and ack
          this.twi_rxBufferIndex = 0;
          this.twi_reply(1);
          break;
        case this.TW_SR_DATA_ACK:       // data received, returned ack
        case this.TW_SR_GCALL_DATA_ACK: // data received generally, returned ack
          // if there is still room in the rx buffer
          if(this.twi_rxBufferIndex < this.TWI_BUFFER_LENGTH){
            // put byte in buffer and ack
            this.twi_rxBuffer[this.twi_rxBufferIndex++] = this.TWDR;
            this.twi_reply(1);
          }else{
            // otherwise nack
            this.twi_reply(0);
          }
          break;
        case this.TW_SR_STOP: // stop or repeated start condition received
          // ack future responses and leave slave receiver state
          this.twi_releaseBus();
          // put a null char after data if there's room
          if(this.twi_rxBufferIndex < this.TWI_BUFFER_LENGTH){
            this.twi_rxBuffer[this.twi_rxBufferIndex] = '\0';
          }
          // callback to user defined callback
          this.twi_onSlaveReceive(this.twi_rxBuffer, this.twi_rxBufferIndex);
          // since we submit rx buffer to "wire" library, we can reset it
          this.twi_rxBufferIndex = 0;
          break;
        case this.TW_SR_DATA_NACK:       // data received, returned nack
        case this.TW_SR_GCALL_DATA_NACK: // data received generally, returned nack
          // nack back at master
          this.twi_reply(0);
          break;
        
        // Slave Transmitter
        case this.TW_ST_SLA_ACK:          // addressed, returned ack
        case this.TW_ST_ARB_LOST_SLA_ACK: // arbitration lost, returned ack
          // enter slave transmitter mode
          this.twi_state = this.TWI_STX;
          // ready the tx buffer index for iteration
          this.twi_txBufferIndex = 0;
          // set tx buffer length to be zero, to verify if user changes it
          this.twi_txBufferLength = 0;
          // request for txBuffer to be filled and length to be set
          // note: user must call twi_transmit(bytes, length) to do this
          this.twi_onSlaveTransmit();
          // if they didn't change buffer & length, initialize it
          if(0 == this.twi_txBufferLength){
            this.twi_txBufferLength = 1;
            this.twi_txBuffer[0] = 0x00;
          }
          //__attribute__ ((fallthrough));		  
          // transmit first byte from buffer, fall
        case this.TW_ST_DATA_ACK: // byte sent, ack returned
          // copy data to output register
          this.TWDR = this.twi_txBuffer[this.twi_txBufferIndex++];
          // if there is more to send, ack, otherwise nack
          if(this.twi_txBufferIndex < this.twi_txBufferLength){
            this.twi_reply(1);
          }else{
            this.twi_reply(0);
          }
          break;
        case this.TW_ST_DATA_NACK: // received nack, we are done 
        case this.TW_ST_LAST_DATA: // received ack, but we are done already!
          // ack future responses
          this.twi_reply(1);
          // leave slave receiver state
          this.twi_state = this.TWI_READY;
          break;
    
        // All
        case this.TW_NO_INFO:   // no state information
          break;
        case this.TW_BUS_ERROR: // bus error, illegal stop/start
          this.twi_error = this.TW_BUS_ERROR;
          this.twi_stop();
          break;
      }
    }    
}


class TwoWire{
    constructor(){
        // Initialize Class Variables //////////////////////////////////////////////////
        // Class Variable, externed, combined to one class

        this.BUFFER_LENGTH = 32;

        // WIRE_HAS_END means Wire has end()
        this.WIRE_HAS_END  = 1;

        this.rxBuffer[BUFFER_LENGTH] = new Uint8Array(); // static uint8_t
        this.rxBufferIndex = new Uint8Array(); // static uint8_t
        this.rxBufferLength = new Uint8Array();    // static uint8_t

        this.txAddress = new Uint8Array(); // static uint8_t
        this.txBuffer[BUFFER_LENGTH] = new Uint8Array(); // static uint8_t
        this.txBufferIndex = new Uint8Array(); // static uint8_t
        this.txBufferLength = new Uint8Array();    // static uint8_t

        this.transmitting = new Uint8Array();  // static uint8_t 
       
        this.rxBufferIndex = 0;
        this.rxBufferLength = 0;
        
        this.txAddress = 0;
        this.txBufferIndex = 0;
        this.txBufferLength = 0;
        this.transmitting = 0;
    
        this.twi_ = new twi();

        this.user_onReceive;
        this.user_onRequest;
    }

    // Public Methods //////////////////////////////////////////////////////////////
    begin(address){
        watch_dog_logger("begin process 1 start");
        if(address instanceof Uint8Array){
            this.begin();
            this.twi_.twi_setAddress(address);   
        } 

        if((Number.isInteger(address) === true) && !(address instanceof Uint8Array)){
            let _address = new Uint8Array();
            _address = address;
            this.begin(_address);
        }

        if(typeof address !== "undefined"){
            watch_dog_logger("normal begin process.. process is safe");
            this.rxBufferIndex = 0;
            this.rxBufferLength = 0;
            
            this.txBufferIndex = 0;
            this.txBufferLength = 0;
            
            this.twi_.twi_init();
        
            this.twi_.twi_attachSlaveTxEvent(onRequestService); // default callback must exist
            this.twi_.twi_attachSlaveRxEvent(onReceiveService); // default callback must exist    
        }
    }

    end(){
        this.twi_.twi_disable();
    }    

    setClock(clock){
        // clock assigned to uint32_t
        if(clock instanceof Uint32Array)
            this.twi_.twi_setFrequency(clock);
    }
    

    /***
     * Sets the TWI timeout.
     *
     * This limits the maximum time to wait for the TWI hardware. If more time passes, the bus is assumed
     * to have locked up (e.g. due to noise-induced glitches or faulty slaves) and the transaction is aborted.
     * Optionally, the TWI hardware is also reset, which can be required to allow subsequent transactions to
     * succeed in some cases (in particular when noise has made the TWI hardware think there is a second
     * master that has claimed the bus).
     *
     * When a timeout is triggered, a flag is set that can be queried with `getWireTimeoutFlag()` and is cleared
     * when `clearWireTimeoutFlag()` or `setWireTimeoutUs()` is called.
     *
     * Note that this timeout can also trigger while waiting for clock stretching or waiting for a second master
     * to complete its transaction. So make sure to adapt the timeout to accomodate for those cases if needed.
     * A typical timeout would be 25ms (which is the maximum clock stretching allowed by the SMBus protocol),
     * but (much) shorter values will usually also work.
     *
     * In the future, a timeout will be enabled by default, so if you require the timeout to be disabled, it is
     * recommended you disable it by default using `setWireTimeoutUs(0)`, even though that is currently
     * the default.
     *
     * @param timeout a timeout value in microseconds, if zero then timeout checking is disabled
     * @param reset_with_timeout if true then TWI interface will be automatically reset on timeout
     *                           if false then TWI interface will not be reset on timeout

    */    

    setWireTimeout(timeout, reset_with_timeout){
        //uint32_t timeout, bool reset_with_timeout
        if(timeout instanceof Uint32Array)
            this.twi_.twi_setTimeoutInMicros(timeout, reset_with_timeout);
    }    

    /***
     * Returns the TWI timeout flag.
     *
     * @return true if timeout has occured since the flag was last cleared.
     */

    getWireTimeoutFlag(){
        return(this.twi_.twi_manageTimeoutFlag(false));
    }

    /***
     * Clears the TWI timeout flag.
     */
    clearWireTimeoutFlag(){
        this.twi_.twi_manageTimeoutFlag(true);
    }

    requestFrom(address, quantity, iaddress, isize, sendStop){
        //uint8_t address, uint8_t quantity, uint32_t iaddress, uint8_t isize, uint8_t sendStop
        if ((isize > 0) && (isize instanceof Uint8Array)) {
            // send internal address; this mode allows sending a repeated start to access
            // some devices' internal registers. This function is executed by the hardware
            // TWI module on other processors (for example Due's TWI_IADR and TWI_MMR registers)
          
            if(address instanceof Uint8Array)
                this.beginTransmission(address);
          
            // the maximum size of internal address is 3 bytes
            if (isize > 3){
              isize = 3;
            }
          
            let temp_val = new Uint8Array();
            temp_val = (iaddress >> (isize*8));
            // write internal register address - most significant byte first
            while (isize-- > 0)
              this.write(temp_val);
            this.endTransmission(false);
        }
          
        // clamp to buffer length
        if(quantity > this.BUFFER_LENGTH){
            quantity = this.BUFFER_LENGTH;
        }
        // perform blocking read into buffer
        let read = new Uint8Array();
        read = this.Wire.twi_readFrom(address, rxBuffer, quantity, sendStop);

        // set rx buffer iterator vars
        this.rxBufferIndex = 0;
        this.rxBufferLength = read;
        
        return read;    //return needed uint8_t
    }

    requestFrom(address, quantity, sendStop) {
        //uint8_t address, uint8_t quantity, uint8_t sendStop
        let _address = new Uint8Array();
        _address = address;

        let _quantity = new Uint8Array();
        _quantity = quantity;

        let _sendStop = new Uint8Array();
        _sendStop = sendStop;
        
        let zero_filed = new Uint32Array();

        return this.requestFrom(_address, _quantity, zero_filed, zero_filed, _sendStop);
    }    

    requestFrom(address, quantity){
        let _address = new Uint8Array();
        _address = address;
 
        let _quantity = new Uint8Array();
        _quantity = quantity;
        
        let _temp_bool = new Uint8Array();
        _temp_bool = true;

      return this.requestFrom(_address, _quantity, _temp_bool);
    }    

    requestFrom(address, quantity, sendStop){
        let _address = new Uint8Array();
        _address = address;
 
        let _quantity = new Uint8Array();
        _quantity = quantity;
        
        let _sendStop = new Uint8Array();
        _sendStop = sendStop;    
        
        return this.requestFrom(_address, _quantity, _sendStop);
    }    

    beginTransmission(address){
        let _address = new Uint8Array();

        _address = address;
        // indicate that we are transmitting
        this.transmitting = 1;
        // set address of targeted slave
        this.txAddress = _address;
        // reset tx buffer iterator vars
        this.txBufferIndex = 0;
        this.txBufferLength = 0;
    }
    
    //
    //	Originally, 'endTransmission' was an f(void) function.
    //	It has been modified to take one parameter indicating
    //	whether or not a STOP should be performed on the bus.
    //	Calling endTransmission(false) allows a sketch to 
    //	perform a repeated start. 
    //
    //	WARNING: Nothing in the library keeps track of whether
    //	the bus tenure has been properly ended with a STOP. It
    //	is very possible to leave the bus in a hung state if
    //	no call to endTransmission(true) is made. Some I2C
    //	devices will behave oddly if they do not see a STOP.
    //
    endTransmission(sendStop){
        let _sendStop = new Uint8Array();
        _sendStop = sendStop;   
        // transmit buffer (blocking)
        let ret = new Uint8Array();
        ret = this.twi_.twi_writeTo(txAddress, txBuffer, txBufferLength, 1, _sendStop);
 
        // reset tx buffer iterator vars
        this.txBufferIndex = 0;
        this.txBufferLength = 0;
        // indicate that we are done transmitting
        this.transmitting = 0;

        return ret;
    }    
    //	This provides backwards compatibility with the original
    //	definition, and expected behaviour, of endTransmission
    //
    endTransmission(){
        let _temp_bool = new Uint8Array();
        _temp_bool = true;
        
        return this.endTransmission(_temp_bool);
    }    

    // must be called in:
    // slave tx event callback
    // or after beginTransmission(address)
    write(data){
        let _data = new Uint8Array();
        _data = data;
    
        if(this.transmitting){
        // in master transmitter mode
        // don't bother if buffer is full
        if(this.txBufferLength >= this.BUFFER_LENGTH){
            this.twi_.setWriteError();
            
            return 0;
        }
        // put byte in tx buffer
        this.txBuffer[this.txBufferIndex] = _data;
        ++this.txBufferIndex;
        // update amount in buffer   
        this.txBufferLength = this.txBufferIndex;
        }else{
            // in slave send mode
            // reply to master
            this.twi_.twi_transmit(_data, 1);
            //&data 
        }

        return 1;
    }

    // must be called in:
    // slave tx event callback
    // or after beginTransmission(address)
    write(data, quantity){
        let _data = new Uint8Array();
        _data = data;

        if(this.transmitting){
        // in master transmitter mode
            for(let i = 0; i < quantity; ++i){
                this.write(data[i]);
            }
        }else{
            // in slave send mode
            // reply to master
            this.twi_.twi_transmit(_data, quantity);
        }
        return quantity;
    }        

    // must be called in:
    // slave rx event callback
    // or after requestFrom(address, numBytes)
    available(){
        return this.rxBufferLength - this.rxBufferIndex;
    }    

    // must be called in:
    // slave rx event callback
    // or after requestFrom(address, numBytes)
    read(){
        //int TwoWire::read(void)
        let value = -1;
        
        // get each successive byte on each call
        if(this.rxBufferIndex < this.rxBufferLength){
            value = this.rxBuffer[this.rxBufferIndex];
            ++this.rxBufferIndex;
        }
    
        return value;
    }

    // must be called in:
    // slave rx event callback
    // or after requestFrom(address, numBytes)
    peek(){
        let value = -1;
        
        if(this.rxBufferIndex < this.rxBufferLength){
            value = this.rxBuffer[this.rxBufferIndex];
        }
    
        return value;
    }

    flush(){
        // XXX: to be implemented.
    }  
    
    // behind the scenes function that is called when data is received
    onReceiveService(inBytes, numBytes){

        //void TwoWire::onReceiveService(uint8_t* inBytes, int numBytes)
        // don't bother if user hasn't registered a callback
        if(!this.user_onReceive){
            return;
        }

        // don't bother if rx buffer is in use by a master requestFrom() op
        // i know this drops data, but it allows for slight stupidity
        // meaning, they may not have read all the master requestFrom() data yet
        if(this.rxBufferIndex < this.rxBufferLength){
            return;
        }
        // copy twi rx buffer into local read buffer
        // this enables new reads to happen in parallel
        for(let i = 0; i < numBytes; ++i){
        //uint8_t i = 0; i < numBytes; ++i
        //unsigned char
            this.rxBuffer[i] = inBytes[i];    
        }
        // set rx iterator vars
        this.rxBufferIndex = 0;
        this.rxBufferLength = numBytes;
        // alert user program
        let callback = this.user_onReceive;
        callback(numBytes);
    }

    // behind the scenes function that is called when data is requested
    onRequestService(){
        // don't bother if user hasn't registered a callback
        if(!this.user_onRequest){
            return;
        }
        // reset tx buffer iterator vars
        // !!! this will kill any pending pre-master sendTo() activity
        this.txBufferIndex = 0;
        this.txBufferLength = 0;
        // alert user program
        let callback = this.user_onRequest;
        callback();
    }

    // sets function called on slave write
    onReceive(callback){
        //void (*function)(int)
        this.user_onReceive = callback;
    }
    
    // sets function called on slave read
    onRequest(callback){
        //void TwoWire::onRequest( void (*function)(void) )
        this.user_onRequest = callback;
    }  
}


function Module() {
    this.sp = null;
    this.sensorTypes = {
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        PWM: 3,
        SERVO_PIN: 4,
        TONE: 5,
        PULSEIN: 6,
        ULTRASONIC: 7,
        TIMER: 8,
        READ_BLUETOOTH: 9,
        WRITE_BLUETOOTH: 10,
        LCD: 11,
        RGBLED: 12,
        DCMOTOR: 13,
        OLED: 14,
    };

    this.actionTypes = {
        GET: 1,
        SET: 2,
        MODULE: 3,
        RESET: 4,
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
        STRING: 4,
    };

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.sensorData = {
        ULTRASONIC: 0,
        DIGITAL: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 0,
            '12': 0,
            '13': 0,
        },
        ANALOG: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
        },
        PULSEIN: {},
        TIMER: 0,
        READ_BLUETOOTH: 0,
    };

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;

    this.log_message = [];
}

let sensorIdx = 0;

Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function(sp) {
    const self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    return true;
    // MRT 개선 코드 구성 중 : 주석 처리 시 자사 다른 펌웨어와의 연결 오류 없음
    //return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};


Module.prototype.checkInitialData = function(data, config) {
    return true;
    // 이후에 체크 로직 개선되면 처리
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
};

Module.prototype.afterConnect = function(that, cb) {
    that.connected = true;
    if (cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.requestRemoteData = function(handler) {
    // 디바이스에서 데이터를 받아온 후, 브라우저로 데이터를 보내기 위해 호출되는 로직. handler 를 세팅하는 것으로 값을 보낼 수 있다.
    // handler.write(key, value) 로 세팅한 값은 Entry.hw.portData 에서 받아볼 수 있다.
    const self = this;
    if (!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach((key) => {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
    
    setTimeout(function() {
        handler.write("watch_dog", this.log_message);
        handler.write("watch_dog", "What?");
    }, 1000);
};


// Because there are no testino hw code, digitalPin Module wasn't available.
Module.prototype.handleRemoteData = function(handler) {
    // 엔트리 브라우저에서 온 데이터를 처리한다. handler.read 로 브라우저의 데이터를 읽어올 수 있다.
    // handler 의 값은 Entry.hw.sendQueue 에 세팅한 값과 같다.    
    const self = this;
    const getDatas = handler.read('GET');
    const setDatas = handler.read('SET') || this.defaultOutput;
    const time = handler.read('TIME');
    let buffer = new Buffer([]);
    if (getDatas) {
        const keys = Object.keys(getDatas);
        keys.forEach((key) => {
            let isSend = false;
            const dataObj = getDatas[key];
            if (typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                const time = self.digitalPortTimeList[dataObj.port];
                if (dataObj.time > time) {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } else if (Array.isArray(dataObj.port)) {
                isSend = dataObj.port.every((port) => {
                    const time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if (isSend) {
                    dataObj.port.forEach((port) => {
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if (isSend) {
                // buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                if (!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data,
                    };

                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                }
            }
        });
    }

    // LCD Address init needed 

    // LCD_Init type data protocol defined
    /*
    Entry.hw.sendQueue['SET'][device] = {
        type: Entry.GorillaCell.sensorTypes.LCD,
        data: {
            text0: text[0],
            text1: text[1],
        },
        time: new Date().getTime(),
    };
    */
    // device -> port

    if (setDatas) {
        const setKeys = Object.keys(setDatas);
        setKeys.forEach((port) => {
            const data = setDatas[port];
            if (data) {
                if (self.digitalPortTimeList[port] < data.time) {
                    self.digitalPortTimeList[port] = data.time;

                    if (!self.isRecentData(port, data.type, data.data)) {
                        self.recentCheckData[port] = {
                            type: data.type,
                            data: data.data,
                        };
                        buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                    }
                }
            }
        });
    }

    // send data to device
    if (buffer.length) {
        this.sendBuffers.push(buffer);
    }
};

Module.prototype.isRecentData = function(port, type, data) {
    let isRecent = false;

    if (port in this.recentCheckData) {
        if (type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
            isRecent = true;
        }
    }

    return isRecent;
};

Module.prototype.requestLocalData = function() {
    // 디바이스로 데이터를 보내는 로직. control: slave 인 경우 duration 주기에 맞춰 디바이스에 데이터를 보낸다.
    // return 값으로 버퍼를 반환하면 디바이스로 데이터를 보내나, 아두이노의 경우 레거시 코드를 따르고 있다.
    const self = this;
    if (!this.isDraing && this.sendBuffers.length > 0) {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), () => {
            if (self.sp) {
                self.sp.drain(() => {
                    self.isDraing = false;
                });
            }
        });
    }

    return null;
};

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    const self = this;
    const datas = this.getDataByBuffer(data);

    datas.forEach((data) => {
        if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
        const readData = data.subarray(2, data.length);
        let value;
        switch (readData[0]) {
            case self.sensorValueSize.FLOAT: {
                value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                value = Math.round(value * 100) / 100;
                break;
            }
            case self.sensorValueSize.SHORT: {
                value = new Buffer(readData.subarray(1, 3)).readInt16LE();
                break;
            }
            case self.sensorValueSize.STRING: {
                value = new Buffer(readData[1] + 3);
                value = readData.slice(2, readData[1] + 3);
                value = value.toString('ascii', 0, value.length);
                break;
            }
            default: {
                value = 0;
                break;
            }
        }

        const type = readData[readData.length - 1];
        const port = readData[readData.length - 2];

        switch (type) {
            case self.sensorTypes.DIGITAL: {
                self.sensorData.DIGITAL[port] = value;
                break;
            }
            case self.sensorTypes.ANALOG: {
                self.sensorData.ANALOG[port] = value;
                break;
            }
            case self.sensorTypes.PULSEIN: {
                self.sensorData.PULSEIN[port] = value;
                break;
            }
            case self.sensorTypes.ULTRASONIC: {
                self.sensorData.ULTRASONIC = value;
                break;
            }
            case self.sensorTypes.TIMER: {
                self.sensorData.TIMER = value;
                break;
            }
            case self.sensorTypes.READ_BLUETOOTH: {
                self.sensorData.READ_BLUETOOTH = value;
                break;
            }
            default: {
                break;
            }
        }
    });
};

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    let buffer;
    const dummy = new Buffer([10]);
    if(device == this.sensorTypes.DIGITAL){
        // data  PullDown 0 or Pullup 2
        if(!data){
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
        }else{
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, data, 10]);
        }
    }else if(device == this.sensorTypes.ANALOG){
        // data  PullDown 0 or Pullup 2
        if(!data){
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
        }else{
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, data, 10]);
        }
    }else if (device == this.sensorTypes.ULTRASONIC) {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
    } else if (device == this.sensorTypes.READ_BLUETOOTH) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
    }else {
        value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.GET, device, port, 10]);
        buffer = Buffer.concat([buffer, value, dummy]);
    }
    sensorIdx++;
    if (sensorIdx > 254) {
        sensorIdx = 0;
    }

    return buffer;
};

// 255 85   36  0   1   10  9   0    0  10
//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function(device, port, data) {
    let buffer;
    const value = new Buffer(2);
    const dummy = new Buffer([10]);
    switch (device) {
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.RGBLED: {
            const redValue = new Buffer(2);
            const greenValue = new Buffer(2);
            const blueValue = new Buffer(2);
            if ($.isPlainObject(data)) {
                redValue.writeInt16LE(data.redValue);
                greenValue.writeInt16LE(data.greenValue);
                blueValue.writeInt16LE(data.blueValue);
            } else {
                redValue.writeInt16LE(0);
                greenValue.writeInt16LE(0);
                blueValue.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 10, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, redValue, greenValue, blueValue, dummy]);
            break;
        }
        case this.sensorTypes.TONE: {
            const time = new Buffer(2);
            if ($.isPlainObject(data)) {
                value.writeInt16LE(data.value);
                time.writeInt16LE(data.duration);
            } else {
                value.writeInt16LE(0);
                time.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        }
        case this.sensorTypes.DCMOTOR: {
            const directionPort = new Buffer(2);
            const speedPort = new Buffer(2);
            const directionValue = new Buffer(2);
            const speedValue = new Buffer(2);
            if ($.isPlainObject(data)) {
                directionPort.writeInt16LE(data.port0);
                speedPort.writeInt16LE(data.port1);
                directionValue.writeInt16LE(data.value0);
                speedValue.writeInt16LE(data.value1);
            } else {
                directionPort.writeInt16LE(0);
                speedPort.writeInt16LE(0);
                directionValue.writeInt16LE(0);
                speedValue.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 12, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, directionPort, speedPort, directionValue, speedValue, dummy]);
            break;
        }
        case this.sensorTypes.WRITE_BLUETOOTH:
        case this.sensorTypes.LCD: {
            var text0 = new Buffer(2);
            var text1 = new Buffer(2);
            var text2 = new Buffer(2);
            var text3 = new Buffer(2);
            var text4 = new Buffer(2);
            var text5 = new Buffer(2);
            var text6 = new Buffer(2);
            var text7 = new Buffer(2);
            var text8 = new Buffer(2);
            var text9 = new Buffer(2);
            var text10 = new Buffer(2);
            var text11 = new Buffer(2);
            var text12 = new Buffer(2);
            var text13 = new Buffer(2);
            var text14 = new Buffer(2);
            var text15 = new Buffer(2);

            if ($.isPlainObject(data)) {
                text0.writeInt16LE(data.text0);
                text1.writeInt16LE(data.text1);
                text2.writeInt16LE(data.text2);
                text3.writeInt16LE(data.text3);
                text4.writeInt16LE(data.text4);
                text5.writeInt16LE(data.text5);
                text6.writeInt16LE(data.text6);
                text7.writeInt16LE(data.text7);
                text8.writeInt16LE(data.text8);
                text9.writeInt16LE(data.text9);
                text10.writeInt16LE(data.text10);
                text11.writeInt16LE(data.text11);
                text12.writeInt16LE(data.text12);
                text13.writeInt16LE(data.text13);
                text14.writeInt16LE(data.text14);
                text15.writeInt16LE(data.text15);
            } else {
                text0.writeInt16LE(0);
                text1.writeInt16LE(0);
                text2.writeInt16LE(0);
                text3.writeInt16LE(0);
                text4.writeInt16LE(0);
                text5.writeInt16LE(0);
                text6.writeInt16LE(0);
                text7.writeInt16LE(0);
                text8.writeInt16LE(0);
                text9.writeInt16LE(0);
                text10.writeInt16LE(0);
                text11.writeInt16LE(0);
                text12.writeInt16LE(0);
                text13.writeInt16LE(0);
                text14.writeInt16LE(0);
                text15.writeInt16LE(0);
            }


            if(data.length === 2){
                let address = new Uint8Array();
                address = text1;

                Wire = new TwoWire();
                Wire.begin(address);
                
                
                /*
                var lcd = new LiquidCrystal_I2C({
                    board: board,
                    pins: {rs:12, rw:11, e:10, data:[5, 4, 3, 2]}
                });
       
                buffer = new Buffer([255, 85, 36, sensorIdx, this.actionTypes.MODULE, device, port]);
                buffer = Buffer.concat([buffer, text0, text1, dummy]);     
                */
            } else {
                buffer = new Buffer([255, 85, 36, sensorIdx, this.actionTypes.MODULE, device, port]);
                buffer = Buffer.concat([buffer, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10, text11, text12, text13, text14, text15, dummy]);
            }
            break;
        }
        case this.sensorTypes.OLED: {
            const coodinate_x = new Buffer(2);
            const coodinate_y = new Buffer(2);
            var text0 = new Buffer(2);
            var text1 = new Buffer(2);
            var text2 = new Buffer(2);
            var text3 = new Buffer(2);
            var text4 = new Buffer(2);
            var text5 = new Buffer(2);
            var text6 = new Buffer(2);
            var text7 = new Buffer(2);
            var text8 = new Buffer(2);
            var text9 = new Buffer(2);
            var text10 = new Buffer(2);
            var text11 = new Buffer(2);
            var text12 = new Buffer(2);
            var text13 = new Buffer(2);
            var text14 = new Buffer(2);
            var text15 = new Buffer(2);
            if ($.isPlainObject(data)) {
                coodinate_x.writeInt16LE(data.value0);
                coodinate_y.writeInt16LE(data.value1);
                text0.writeInt16LE(data.text0);
                text1.writeInt16LE(data.text1);
                text2.writeInt16LE(data.text2);
                text3.writeInt16LE(data.text3);
                text4.writeInt16LE(data.text4);
                text5.writeInt16LE(data.text5);
                text6.writeInt16LE(data.text6);
                text7.writeInt16LE(data.text7);
                text8.writeInt16LE(data.text8);
                text9.writeInt16LE(data.text9);
                text10.writeInt16LE(data.text10);
                text11.writeInt16LE(data.text11);
                text12.writeInt16LE(data.text12);
                text13.writeInt16LE(data.text13);
                text14.writeInt16LE(data.text14);
                text15.writeInt16LE(data.text15);
            } else {
                coodinate_x.writeInt16LE(0);
                coodinate_y.writeInt16LE(0);
                text0.writeInt16LE(0);
                text1.writeInt16LE(0);
                text2.writeInt16LE(0);
                text3.writeInt16LE(0);
                text4.writeInt16LE(0);
                text5.writeInt16LE(0);
                text6.writeInt16LE(0);
                text7.writeInt16LE(0);
                text8.writeInt16LE(0);
                text9.writeInt16LE(0);
                text10.writeInt16LE(0);
                text11.writeInt16LE(0);
                text12.writeInt16LE(0);
                text13.writeInt16LE(0);
                text14.writeInt16LE(0);
                text15.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 40, sensorIdx, this.actionTypes.MODULE, device, port]);
            buffer = Buffer.concat([buffer, coodinate_x, coodinate_y, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10, text11, text12, text13, text14, text15, dummy]);
            break;
        }
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    const datas = [];
    let lastIndex = 0;
    buffer.forEach((value, idx) => {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};


Module.prototype.disconnect = function(connect) {
    const self = this;
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

    this.sensorData.PULSEIN = {};
};

module.exports = new Module();
