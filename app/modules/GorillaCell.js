
var events = require('events'),
    util   = require('util'),
    colors = require('colors'),
    child  = require('child_process'),
    serial = require('serialport');


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


/*
 * The main Arduino constructor
 * Connect to the serial port and bind
 */

var Board = function (options) {
    this.log('info', 'initializing');
    this.debug = false;
    this.device = options && options.device || 'usb|ttyACM*|ttyS|COM1|COM2|COM3|COM4|COM5}';
    this.baudrate = 115200;
    this.writeBuffer = [];

    var self = this;
    this.device = '/dev/COM5';
    /*
    this.detect(function (err, serial) {
        if (err) {
        if(self.listeners('error').length)
            self.emit('error', err);
        else
            throw new Error(err);
        }else{
            self.serial = serial;
            self.emit('connected');

            self.log('info', 'binding serial events');
            self.serial.on('data', function(data){
                self.log('receive', data.toString().red);
                self.emit('data', data);
            });

                setTimeout(function(){
                    self.log('info', 'board ready');
                    self.sendClearingBytes();

                    if (self.debug) {
                    self.log('info', 'sending debug mode toggle on to board');
                    self.write('99' + self.normalizePin(0) + self.normalizeVal(1));
                    process.on('SIGINT', function(){
                        self.log('info', 'sending debug mode toggle off to board');
                        self.write('99' + self.normalizePin(0) + self.normalizeVal(0));
                        delete self.serial;
                        setTimeout(function(){
                        process.exit();
                        }, 100);
                    });
                    }

                    if (self.writeBuffer.length > 0) {
                    self.processWriteBuffer();
                    }

                    self.emit('ready');      
                }, 500);
        }
    });
    */
}
  
  /*
   * EventEmitter, I choose you!
   */
util.inherits(Board, events.EventEmitter);
  
  /*
   * Detect an Arduino board
   * Loop through all USB devices and try to connect
   * This should really message the device and wait for a correct response
   */
  Board.prototype.detect = function (callback) {
    //this.log('info', 'attempting to find Arduino board');
    var self = this;
    child.exec('ls /dev | grep -E "'+ self.device +'"', function(err, stdout, stderr){
      var usb = stdout.slice(0, -1).split('\n'),
          found = false,
          err = null,
          possible, temp, com_temp;
  
      while ( usb.length ) {
        possible = usb.pop();
  
        if (possible.slice(0, 2) !== 'cu') {
          try {
            temp = new serial.SerialPort('/dev/' + possible, {
              baudrate: self.baudrate,
              parser: serial.parsers.readline('\n')
            });

            com_temp = new serial.SerialPort('/dev/COM5' , {
                baudrate: self.baudrate,
                parser: serial.parsers.readline('\n')
            });

          } catch (e) {
            err = e;
          }
          if (!err) {
            if(!temp)
                found = temp;
            else if(!com_temp)
                found = com_temp;
            //self.log('info', 'found board at ' + temp.port);
            break;
          } else {
            err = new Error('Could not find Arduino');
          }
        }
      }
  
      callback(err, found);
    });
  }
  
  /*
   * The board will eat the first 4 bytes of the session
   * So we give it crap to eat
   */
  Board.prototype.sendClearingBytes = function () {
    this.serial.write('00000000');
  }
  
  /*
   * Process the writeBuffer (messages attempted before serial was ready)
   */
  Board.prototype.processWriteBuffer = function () {
    //this.log('info', 'processing buffered messages');
    while (this.writeBuffer.length > 0) {
      //this.log('info', 'writing buffered message');
      this.write(this.writeBuffer.shift());
    }
  }
  
  /*
   * Low-level serial write
   */
  Board.prototype.write = function (m) {
    if (this.serial) {
      //this.log('write', m);
      this.serial.write('!' + m + '.');
    } else {
      //this.log('info', 'serial not ready, buffering message: ' + m.red);
      this.writeBuffer.push(m);
    }
  }
  
  /*
   * Add a 0 to the front of a single-digit pin number
   */
  Board.prototype.normalizePin = function (pin) {
    return this.lpad( 2, '0', pin );
  }
  
  Board.prototype.normalizeVal = function(val) {
      return this.lpad( 3, '0', val );
  }
  
  //
  Board.prototype.lpad = function(len, chr, str) {
    return (Array(len + 1).join(chr || ' ') + str).substr(-len);
  };
  
  /*
   * Define constants
   */
  Board.prototype.HIGH = '255';
  Board.prototype.LOW = '000';
  
  /*
   * Set a pin's mode
   * val == out = 001
   * val == in  = 000
   */
  Board.prototype.pinMode = function (pin, val) {
    pin = this.normalizePin(pin);
    //this.log('info', 'set pin ' + pin + ' mode to ' + val);
    val = (
      val == 'out' ?
      this.normalizeVal(1) :
      this.normalizeVal(0)
    );
    this.write('00' + pin + val);
  }
  
  /*
   * Tell the board to write to a digital pin
   */
  Board.prototype.digitalWrite = function (pin, val) {
    pin = this.normalizePin(pin);
    val = this.normalizeVal(val);
    //this.log('info', 'digitalWrite to pin ' + pin + ': ' + val.green);
    this.write('01' + pin + val);
  }
  
  /*
   * Tell the board to extract data from a pin
   */
  Board.prototype.digitalRead = function (pin) {
    pin = this.normalizePin(pin);
    //this.log('info', 'digitalRead from pin ' + pin);
    this.write('02' + pin + this.normalizeVal(0));
  }
  
  Board.prototype.analogWrite = function (pin, val) {
      pin = this.normalizePin(pin);
      val = this.normalizeVal(val);
      //this.log('info', 'analogWrite to pin ' + pin + ': ' + val.green);
      this.write('03' + pin + val);
  }
  Board.prototype.analogRead = function (pin) {
      pin = this.normalizePin(pin);
      //this.log('info', 'analogRead from pin ' + pin);
      this.write('04' + pin + this.normalizeVal(0));
  }
  
  /*
   * Utility function to pause for a given time
   */
  Board.prototype.delay = function (ms) {
    ms += +new Date();
    while (+new Date() < ms) { }
  }

/*
 * Logger utility function
 */
Board.prototype.log = function (/*level, message*/) {
    var args = [].slice.call(arguments);
    if (this.debug) {
      console.log(String(+new Date()).grey + ' duino '.blue + args.shift().magenta + ' ' + args.join(', '));
    }
}

//Full Used Library

class twi{
    constructor(){
        this.TWI_FREQ = 100000; 
        this.TWI_BUFFER_LENGTH = 32;
    
        this.TWI_READY = 0;
        this.TWI_MRX   = 1;
        this.TWI_MTX   = 2;
        this.TWI_SRX   = 3;
        this.TWI_STX   = 4;
        
        this.cbi(sfr, bit) = (_SFR_BYTE(sfr) &= ~_BV(bit));
        this.sbi(sfr, bit) = (_SFR_BYTE(sfr) |= _BV(bit));
        
        this.twi_state;
        this.twi_slarw;
        this.twi_sendStop;			// should the transaction end with a stop
        this.twi_inRepStart;			// in the middle of a repeated start
        
        // twi_timeout_us > 0 prevents the code from getting stuck in various while loops here
        // if twi_timeout_us == 0 then timeout checking is disabled (the previous Wire lib behavior)
        // at some point in the future, the default twi_timeout_us value could become 25000
        // and twi_do_reset_on_timeout could become true
        // to conform to the SMBus standard
        // http://smbus.org/specs/SMBus_3_1_20180319.pdf

        this.twi_timeout_us = 0;
        this.twi_timed_out_flag = false;  // a timeout has been seen
        this.twi_do_reset_on_timeout = false;  // reset the TWI registers on timeout
        
        
        this.twi_masterBuffer[TWI_BUFFER_LENGTH];
        this.twi_masterBufferIndex;
        this.twi_masterBufferLength;
        
        this.twi_txBuffer[TWI_BUFFER_LENGTH];
        this.twi_txBufferIndex;
        this.twi_txBufferLength;
        
        this.twi_rxBuffer[TWI_BUFFER_LENGTH];
        this.twi_rxBufferIndex;
        
        this.twi_error;        

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
        digitalWrite(SDA, 1);
        digitalWrite(SCL, 1);

        // initialize twi prescaler and bit rate
        cbi(TWSR, TWPS0);
        cbi(TWSR, TWPS1);
        TWBR = ((F_CPU / TWI_FREQ) - 16) / 2;

        /* twi bit rate formula from atmega128 manual pg 204
        SCL Frequency = CPU Clock Frequency / (16 + (2 * TWBR))
        note: TWBR should be 10 or higher for master mode
        It is 72 for a 16mhz Wiring board with 100kHz TWI */

        // enable twi module, acks, and twi interrupt
        TWCR = _BV(TWEN) | _BV(TWIE) | _BV(TWEA);
    }

    /* 
    * Function twi_disable
    * Desc     disables twi pins
    * Input    none
    * Output   none
    */
    twi_disable(){
    // disable twi module, acks, and twi interrupt
    TWCR &= ~(_BV(TWEN) | _BV(TWIE) | _BV(TWEA));

        // deactivate internal pullups for twi.
        digitalWrite(SDA, 0);
        digitalWrite(SCL, 0);
    }

    /* 
    * Function twi_slaveInit
    * Desc     sets slave address and enables interrupt
    * Input    none
    * Output   none
    */
    twi_setAddress(address){
    // set twi slave address (skip over TWGCE bit)
        TWAR = (address << 1) >>> 0;
    }

    /* 
    * Function twi_setClock
    * Desc     sets twi bit rate
    * Input    Clock Frequency
    * Output   none
    */
    twi_setFrequency(frequency){
        TWBR = (((F_CPU / frequency) - 16) / 2) >>> 0;
        
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
        let i = [];

        // ensure data will fit into buffer
        if(this.TWI_BUFFER_LENGTH < length){
            return 0;
        }

        // wait until twi is ready, become master receiver
        // micro_second method
        let startMicros = micros();
        //unsigneds int
        while(this.TWI_READY != twi_state){
            if((twi_timeout_us > 0) && ((micros() - startMicros) > twi_timeout_us)) {
            twi_handleTimeout(twi_do_reset_on_timeout);
            return 0;
            }
        }
        twi_state = this.TWI_MRX;
        twi_sendStop = sendStop;
        // reset error state (0xFF.. no error occured)
        twi_error = 0xFF;

        // initialize buffer iteration vars
        twi_masterBufferIndex = 0;
        twi_masterBufferLength = length-1;  // This is not intuitive, read on...
        // On receive, the previously configured ACK/NACK setting is transmitted in
        // response to the received byte before the interrupt is signalled. 
        // Therefor we must actually set NACK when the _next_ to last byte is
        // received, causing that NACK to be sent in response to receiving the last
        // expected byte of data.

        // build sla+w, slave device address + w bit
        twi_slarw = TW_READ;
        twi_slarw |= address << 1;

        if (true == twi_inRepStart) {
            // if we're in the repeated start state, then we've already sent the start,
            // (@@@ we hope), and the TWI statemachine is just waiting for the address byte.
            // We need to remove ourselves from the repeated start state before we enable interrupts,
            // since the ISR is ASYNC, and we could get confused if we hit the ISR before cleaning
            // up. Also, don't enable the START interrupt. There may be one pending from the 
            // repeated start that we sent ourselves, and that would really confuse things.
            twi_inRepStart = false;			// remember, we're dealing with an ASYNC ISR
            startMicros = micros();
            do {
            TWDR = this.twi_slarw;
            if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
                twi_handleTimeout(twi_do_reset_on_timeout);
                return 0;
            }
            } while(TWCR & _BV(TWWC));
            TWCR = _BV(TWINT) | _BV(TWEA) | _BV(TWEN) | _BV(TWIE);	// enable INTs, but not START
        } else {
            // send start condition
            TWCR = _BV(TWEN) | _BV(TWIE) | _BV(TWEA) | _BV(TWINT) | _BV(TWSTA);
        }

        // wait for read operation to complete
        startMicros = micros();
        while(TWI_MRX == twi_state){
            if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
            twi_handleTimeout(twi_do_reset_on_timeout);
            return 0;
            }
        }

        if (twi_masterBufferIndex < length) {
            length = twi_masterBufferIndex;
        }

        // copy twi buffer to data
        for(i = 0; i < length; ++i){
            data[i] = twi_masterBuffer[i];
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
        let i = [];

        // ensure data will fit into buffer
        if(this.TWI_BUFFER_LENGTH < length){
            return 1;
        }

        // wait until twi is ready, become master transmitter
        startMicros = micros();
        while(this.TWI_READY != twi_state){
            if((this.twi_timeout_us > 0) && ((micros() - startMicros) > this.twi_timeout_us)) {
            twi_handleTimeout(twi_do_reset_on_timeout);
            return (5);
            }
        }
        twi_state = TWI_MTX;
        twi_sendStop = sendStop;
        // reset error state (0xFF.. no error occured)
        twi_error = 0xFF;

        // initialize buffer iteration vars
        twi_masterBufferIndex = 0;
        twi_masterBufferLength = length;
        
        // copy data to twi buffer
        for(i = 0; i < length; ++i){
            twi_masterBuffer[i] = data[i];
        }
        
        // build sla+w, slave device address + w bit
        twi_slarw = TW_WRITE;
        twi_slarw |= address << 1;
        
        // if we're in a repeated start, then we've already sent the START
        // in the ISR. Don't do it again.
        //
        if (true == twi_inRepStart) {
            // if we're in the repeated start state, then we've already sent the start,
            // (@@@ we hope), and the TWI statemachine is just waiting for the address byte.
            // We need to remove ourselves from the repeated start state before we enable interrupts,
            // since the ISR is ASYNC, and we could get confused if we hit the ISR before cleaning
            // up. Also, don't enable the START interrupt. There may be one pending from the 
            // repeated start that we sent outselves, and that would really confuse things.
            twi_inRepStart = false;			// remember, we're dealing with an ASYNC ISR
            startMicros = micros();
            do {
            TWDR = twi_slarw;
            if((twi_timeout_us > 0) && ((micros() - startMicros) > twi_timeout_us)) {
                twi_handleTimeout(twi_do_reset_on_timeout);
                return (5);
            }
            } while(TWCR & _BV(TWWC));
            TWCR = _BV(TWINT) | _BV(TWEA) | _BV(TWEN) | _BV(TWIE);	// enable INTs, but not START
        } else {
            // send start condition
            TWCR = _BV(TWINT) | _BV(TWEA) | _BV(TWEN) | _BV(TWIE) | _BV(TWSTA);	// enable INTs
        }

        // wait for write operation to complete
        startMicros = micros();
        while(wait && (TWI_MTX == twi_state)){
            if((twi_timeout_us > 0) && ((micros() - startMicros) > twi_timeout_us)) {
            twi_handleTimeout(twi_do_reset_on_timeout);
            return (5);
            }
        }
        
        if (twi_error == 0xFF)
            return 0;	// success
        else if (twi_error == TW_MT_SLA_NACK)
            return 2;	// error: address send, nack received
        else if (twi_error == TW_MT_DATA_NACK)
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
        let i;

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
            twi_txBuffer[this.twi_txBufferLength+i] = data[i];
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
      twi_onSlaveReceive = recv_function(uint8_t_param, int_t_param);
    }

    /* 
    * Function twi_attachSlaveTxEvent
    * Desc     sets function called before a slave write operation
    * Input    function: callback function to use
    * Output   none
    */
    twi_attachSlaveTxEvent(recv_function){
        twi_onSlaveTransmit = recv_function();
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
            TWCR = _BV(TWEN) | _BV(TWIE) | _BV(TWINT) | _BV(TWEA);
        }else{
            TWCR = _BV(TWEN) | _BV(TWIE) | _BV(TWINT);
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
        TWCR = _BV(TWEN) | _BV(TWIE) | _BV(TWEA) | _BV(TWINT) | _BV(TWSTO);

        // wait for stop condition to be exectued on bus
        // TWINT is not set after a stop condition!
        // We cannot use micros() from an ISR, so approximate the timeout with cycle-counted delays
        let us_per_loop = 8;
        let counter = (twi_timeout_us + us_per_loop - 1)/us_per_loop; // Round up
        while(TWCR & _BV(TWSTO)){
            if(twi_timeout_us > 0){
                if (counter > 0){
                    _delay_us(10);
                    counter--;
                } else {
                    twi_handleTimeout(twi_do_reset_on_timeout);
                    return;
                }
            }
        }

        // update twi state
        twi_state = TWI_READY;
    }

    /* 
    * Function twi_releaseBus
    * Desc     releases bus control
    * Input    none
    * Output   none
    */
    twi_releaseBus(){
        // release bus
        TWCR = _BV(TWEN) | _BV(TWIE) | _BV(TWEA) | _BV(TWINT);

        // update twi state
        twi_state = TWI_READY;
    }

    /* 
    * Function twi_setTimeoutInMicros
    * Desc     set a timeout for while loops that twi might get stuck in
    * Input    timeout value in microseconds (0 means never time out)
    * Input    reset_with_timeout: true causes timeout events to reset twi
    * Output   none
    */
    twi_setTimeoutInMicros(timeout, reset_with_timeout){
        twi_timed_out_flag = false;
        twi_timeout_us = timeout;
        twi_do_reset_on_timeout = reset_with_timeout;
    }
    
    /* 
    * Function twi_handleTimeout
    * Desc     this gets called whenever a while loop here has lasted longer than
    *          twi_timeout_us microseconds. always sets twi_timed_out_flag
    * Input    reset: true causes this function to reset the twi hardware interface
    * Output   none
    */
    twi_handleTimeout(reset){
        twi_timed_out_flag = true;
    
        if (reset) {
        // remember bitrate and address settings
        previous_TWBR = TWBR;
        previous_TWAR = TWAR;
    
        // reset the interface
        twi_disable();
        twi_init();
    
        // reapply the previous register values
        TWAR = previous_TWAR;
        TWBR = previous_TWBR;
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
        flag = twi_timed_out_flag;
        if (clear_flag){
        twi_timed_out_flag = false;
        }
        return(flag);
    }

    ISR(TWI_vect)
    {
      switch(TW_STATUS){
        // All Master
        case TW_START:     // sent start condition
        case TW_REP_START: // sent repeated start condition
          // copy device address and r/w bit to output register and ack
          TWDR = this.twi_slarw;
          this.twi_reply(1);
          break;
    
        // Master Transmitter
        case TW_MT_SLA_ACK:  // slave receiver acked address
        case TW_MT_DATA_ACK: // slave receiver acked data
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
             TWCR = _BV(TWINT) | _BV(TWSTA)| _BV(TWEN) ;
             this.twi_state = this.TWI_READY;
            }
          }
          break;
        case TW_MT_SLA_NACK:  // address sent, nack received
            this.twi_error = TW_MT_SLA_NACK;
            this.twi_stop();
          break;
        case TW_MT_DATA_NACK: // data sent, nack received
            this.twi_error = TW_MT_DATA_NACK;
            this.twi_stop();
          break;
        case TW_MT_ARB_LOST: // lost bus arbitration
        this.twi_error = TW_MT_ARB_LOST;
          this.twi_releaseBus();
          break;
    
        // Master Receiver
        case TW_MR_DATA_ACK: // data received, ack sent
          // put byte into buffer
          this.twi_masterBuffer[this.twi_masterBufferIndex++] = TWDR;
          __attribute__ ((fallthrough));
        case TW_MR_SLA_ACK:  // address sent, ack received
          // ack if more bytes are expected, otherwise nack
          if(this.twi_masterBufferIndex < this.twi_masterBufferLength){
            this.twi_reply(1);
          }else{
            this.twi_reply(0);
          }
          break;
        case TW_MR_DATA_NACK: // data received, nack sent
          // put final byte into buffer
          this.twi_masterBuffer[this.twi_masterBufferIndex++] = TWDR;
          if (this.twi_sendStop){
            this.twi_stop();
          } else {
            this.twi_inRepStart = true;	// we're gonna send the START
            // don't enable the interrupt. We'll generate the start, but we
            // avoid handling the interrupt until we're in the next transaction,
            // at the point where we would normally issue the start.
            TWCR = _BV(TWINT) | _BV(TWSTA)| _BV(TWEN) ;
            this.twi_state = this.TWI_READY;
          }
          break;
        case TW_MR_SLA_NACK: // address sent, nack received
            this.twi_stop();
          break;
        // TW_MR_ARB_LOST handled by TW_MT_ARB_LOST case
    
        // Slave Receiver
        case TW_SR_SLA_ACK:   // addressed, returned ack
        case TW_SR_GCALL_ACK: // addressed generally, returned ack
        case TW_SR_ARB_LOST_SLA_ACK:   // lost arbitration, returned ack
        case TW_SR_ARB_LOST_GCALL_ACK: // lost arbitration, returned ack
          // enter slave receiver mode
          this.twi_state = this.TWI_SRX;
          // indicate that rx buffer can be overwritten and ack
          this.twi_rxBufferIndex = 0;
          this.twi_reply(1);
          break;
        case TW_SR_DATA_ACK:       // data received, returned ack
        case TW_SR_GCALL_DATA_ACK: // data received generally, returned ack
          // if there is still room in the rx buffer
          if(this.twi_rxBufferIndex < this.TWI_BUFFER_LENGTH){
            // put byte in buffer and ack
            this.twi_rxBuffer[this.twi_rxBufferIndex++] = TWDR;
            this.twi_reply(1);
          }else{
            // otherwise nack
            this.twi_reply(0);
          }
          break;
        case TW_SR_STOP: // stop or repeated start condition received
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
        case TW_SR_DATA_NACK:       // data received, returned nack
        case TW_SR_GCALL_DATA_NACK: // data received generally, returned nack
          // nack back at master
          this.twi_reply(0);
          break;
        
        // Slave Transmitter
        case TW_ST_SLA_ACK:          // addressed, returned ack
        case TW_ST_ARB_LOST_SLA_ACK: // arbitration lost, returned ack
          // enter slave transmitter mode
          this.twi_state = TWI_STX;
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
          __attribute__ ((fallthrough));		  
          // transmit first byte from buffer, fall
        case TW_ST_DATA_ACK: // byte sent, ack returned
          // copy data to output register
          TWDR = this.twi_txBuffer[this.twi_txBufferIndex++];
          // if there is more to send, ack, otherwise nack
          if(this.twi_txBufferIndex < this.twi_txBufferLength){
            this.twi_reply(1);
          }else{
            this.twi_reply(0);
          }
          break;
        case TW_ST_DATA_NACK: // received nack, we are done 
        case TW_ST_LAST_DATA: // received ack, but we are done already!
          // ack future responses
          this.twi_reply(1);
          // leave slave receiver state
          this.twi_state = this.TWI_READY;
          break;
    
        // All
        case TW_NO_INFO:   // no state information
          break;
        case TW_BUS_ERROR: // bus error, illegal stop/start
          this.twi_error = TW_BUS_ERROR;
          this.twi_stop();
          break;
      }
    }    
}


class LiquidCrystal_I2C{
    constructor(lcd_Addr, lcd_cols, lcd_rows){
        // port of LiquidCrystal.cpp by natevw
        // commands
        this.LCD_CLEARDISPLAY = 0x01;
        this.LCD_RETURNHOME = 0x02;
        this.LCD_ENTRYMODESET = 0x04;
        this.LCD_DISPLAYCONTROL =0x08;
        this.LCD_CURSORSHIFT = 0x10;
        this.LCD_FUNCTIONSET = 0x20;
        this.LCD_SETCGRAMADDR = 0x40;
        this.LCD_SETDDRAMADDR = 0x80;
        
        // flags for display entry mode
        this.LCD_ENTRYRIGHT = 0x00;
        this.LCD_ENTRYLEFT = 0x02;
        this.LCD_ENTRYSHIFTINCREMENT = 0x01;
        this.LCD_ENTRYSHIFTDECREMENT = 0x00;
        
        // flags for display on/off control
        this.LCD_DISPLAYON = 0x04;
        this.LCD_DISPLAYOFF = 0x00;
        this.LCD_CURSORON = 0x02;
        this.LCD_CURSOROFF = 0x00;
        this.LCD_BLINKON = 0x01;
        this.LCD_BLINKOFF = 0x00;
        
        // flags for display/cursor shift
        this.LCD_DISPLAYMOVE = 0x08;
        this.LCD_CURSORMOVE = 0x00;
        this.LCD_MOVERIGHT = 0x04;
        this.LCD_MOVELEFT = 0x00;
        
        // flags for functi on set
        this.LCD_8BITMODE = 0x10;
        this.LCD_4BITMODE = 0x00;
        this.LCD_2LINE = 0x08;
        this.LCD_1LINE = 0x00;
        this.LCD_5x10DOTS = 0x04;
        this.LCD_5x8DOTS = 0x00;
        
        // flags for backlight control
        this.LCD_BACKLIGHT = 0x08;
        this.LCD_NOBACKLIGHT = 0x00;
        this.En = 0x04; // Enable bit
        this.Rw = 0x02; // Read/Write bit
        this.Rs = 0x01; // Register select bit

        this._oled = 0x00;
        this._numlines = 0x00;
        this._displaycontrol = 0x00;
        this._displaymode = 0x00;

        _Addr = lcd_Addr;
        _cols = lcd_cols;
        _rows = lcd_rows;
        _backlightval = this.LCD_NOBACKLIGHT;
        
        if (!options || !options.board) throw new Error('Must supply required options');
        this.board = options.board;
        // modify needed

        var pins = options.pins || [12, 11, 5, 4, 3, 2];
        // default pin assigned  12, 11, 5, 4, 3, 2
        // modify needed

        if (!Array.isArray(pins))
          this.pins = pins;
        else if (pins.length % 2)
          this.pins = {rs:pins[0], rw:pins[1], e:pins[2], data:pins.slice(3)};
          // length of pins was even-number, Rs, Rw, E, data
        else
          this.pins = {rs:pins[0], e:pins[1], data:pins.slice(2)};

        if (!('rw' in this.pins)) this.pins.rw = 255;
        // Rw was set, pins.rw assigned to 255(0xFF)

        this.board.pinMode(this.pins.rs, 'out');
        if (this.pins.rw !== 255) {
            this.board.pinMode(this.pins.rw, 'out');
        }
        this.board.pinMode(this.pins.e, 'out');
        
        this.begin(16, 1);        
    }
    
    oled_init(){
        this._oled = true;
        init_priv();
    }

    init(){
        init_priv();
    }

    init_priv()
    {
        Wire.begin();      //not implemented.
        _displayfunction = this.LCD_4BITMODE | this.LCD_1LINE | this.LCD_5x8DOTS;
        begin(_cols, _rows);  
    } 

    begin(cols, lines, dotsize) {
        this._numlines = lines;
  
        var displayfunction = 0;
        displayfunction |= (lines > 1) ? this.LCD_2LINE : this.LCD_1LINE;
        displayfunction |= (dotsize && lines === 1) ? this.LCD_5x10DOTS : this.LCD_5x8DOTS;
        
        this._delayMicroseconds(50000);

        this.board.digitalWrite(this.pins.rs, this.board.LOW);
        this.board.digitalWrite(this.pins.e, this.board.LOW);
        if (this.pins.rw !== 255)
          this.board.digitalWrite(this.pins.rw, this.board.LOW);
        
        // put the LCD into 4 bit or 8 bit mode
        if (this.pins.data.length === 4) {
          displayfunction |= this.LCD_4BITMODE;
          this._writeNbits(4, 0x03);
          this._delayMicroseconds(4500);
          this._writeNbits(4, 0x03);
          this._delayMicroseconds(4500);
          this._writeNbits(4, 0x03);
          this._delayMicroseconds(150);
          this._writeNbits(4, 0x02);
        } else {
          displayfunction |= this.LCD_8BITMODE;
          this.command(this.LCD_FUNCTIONSET | displayfunction);
          this._delayMicroseconds(4500);
          this.command(this.LCD_FUNCTIONSET | displayfunction);
          this._delayMicroseconds(150);
          this.command(this.LCD_FUNCTIONSET | displayfunction);
        }
        
        this.command(this.LCD_FUNCTIONSET | displayfunction);
        
        this._displaycontrol = this.LCD_DISPLAYON | this.LCD_CURSOROFF | this.LCD_BLINKOFF;
        this.display();
        
        this.clear();
        
        this._displaymode = this.LCD_ENTRYLEFT | this.LCD_ENTRYSHIFTDECREMENT;
        this.leftToRight();

        this.home();
      
    }      

    clear(){
        this.command(this.LCD_CLEARDISPLAY);
        this._delayMicroseconds(2000);  // this command takes a long time!
        if (this._oled) setCursor(0,0);
    }

    home() {
        this.command(this.LCD_RETURNHOME);
        this._delayMicroseconds(2000);
    }    

    setCursor(col, row) {
        if (row >= this._numlines) {
          row = this._numlines - 1;
        }
        
        var row_offsets = [0x00, 0x40, 0x14, 0x54];
        this.command(this.LCD_SETDDRAMADDR | (col + row_offsets[row]));
    }

    display(on) {
        on = (arguments.length) ? on : true;
        if (on) this._displaycontrol |= this.LCD_DISPLAYON;
        else this._displaycontrol &= ~this.LCD_DISPLAYON;
        this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
    }

    noDisplay() { this.display(false); }

    cursor(on) {
        on = (arguments.length) ? on : true;
        if (on) this._displaycontrol |= this.LCD_CURSORON;
        else this._displaycontrol &= ~this.LCD_CURSORON;
        this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
    }

    noCursor() { this.cursor(false); }

    blink(on) {
        on = (arguments.length) ? on : true;
        if (on) this._displaycontrol |= this.LCD_BLINKON;
        else this._displaycontrol &= ~this.LCD_BLINKON;
        this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
    }
      
    noBlink() { this.blink(false); } 

    scrollDisplayLeft() {
        this.command(this.LCD_CURSORSHIFT | this.LCD_DISPLAYMOVE | this.LCD_MOVELEFT);
    }
      
    scrollDisplayRight() {
        this.command(this.LCD_CURSORSHIFT | this.LCD_DISPLAYMOVE | this.LCD_MOVERIGHT);
    }

    leftToRight() {
        this._displaymode |= this.LCD_ENTRYLEFT;
        this.command(this.LCD_ENTRYMODESET | this._displaymode);
    }
    
    rightToLeft() {
        this._displaymode &= ~LCD_ENTRYLEFT;
        this.command(LCD_ENTRYMODESET | this._displaymode);
    }    

    autoscroll(on) {
        on = (arguments.length) ? on : true;
        if (on) this._displaymode |= this.LCD_ENTRYSHIFTINCREMENT;
        else this._displaymode &= ~this.LCD_ENTRYSHIFTINCREMENT;
        this.command(this.LCD_ENTRYMODESET | this._displaymode);
    }    

    noAutoscroll() { this.autoscroll(false); }

    createChar(location, charmap) {
      location &= 0x7;
      this.command(this.LCD_SETCGRAMADDR | (location << 3));
      
      var buffer = new Buffer(8);
      if (Array.isArray(charmap)) for (var i = 0; i < 8; i++) {
        buffer[i] = parseInt(charmap[i], 2);
      } else if (typeof charmap === 'string') for (var i = 0; i < 8; i++) {
        var byte = 0;
        if (charmap[5*i + 0] !== ' ') byte |= 0x10;
        if (charmap[5*i + 1] !== ' ') byte |= 0x08;
        if (charmap[5*i + 2] !== ' ') byte |= 0x04;
        if (charmap[5*i + 3] !== ' ') byte |= 0x02;
        if (charmap[5*i + 4] !== ' ') byte |= 0x01;
        buffer[i] = byte;
      } else buffer = charmap;
      this.write(buffer);
    }
    
    /*
    * mid/low level stuff
    */

    command(value) {
        this.send(value, this.board.LOW);
    }

    send(value, mode) {
        this.board.digitalWrite(this.pins.rs, mode);
        if (this.pins.rw !== 255) {
            this.board.digitalWrite(this.pins.rw, this.board.LOW);
        }
        if (this.pins.data.length === 8) {
            this._writeNbits(8, value);
        } else {
            this._writeNbits(4, value >> 4);
            this._writeNbits(4, value & 0xF);
        }
    }

    _writeNbits(n, value) {
        //expanderWrite Part 
        //expanderWrite(uint8_t _data);
        /*
            Wire.beginTransmission(_Addr);
            Wire.send(((int)(_data) | _backlightval));
            Wire.endTransmission();   
        */
        for (var i = 0; i < n; i++) {
            this.board.pinMode(this.pins.data[i], 'out');
            var bit = (value >> i) & 0x01;
            this.board.digitalWrite(this.pins.data[i], (bit) ? this.board.HIGH : this.board.LOW);
        }
        //----------------------
        this._pulseEnable();
    }  

    _pulseEnable() {
        /*
            expanderWrite(_data | En);	// En high
            delayMicroseconds(1);		// enable pulse must be >450ns
            
            expanderWrite(_data & ~En);	// En low
            delayMicroseconds(50);		// commands need > 37us to settle
        */
        this.board.digitalWrite(this.pins.e, this.board.LOW);
        this._delayMicroseconds(1);
        this.board.digitalWrite(this.pins.e, this.board.HIGH);
        this._delayMicroseconds(1);    // enable pulse must be >450ns
        this.board.digitalWrite(this.pins.e, this.board.LOW);
        this._delayMicroseconds(100);   // commands need > 37us to settle
    }

    /*
    expanderWrite(_data){                                        
        Wire.beginTransmission(_Addr);
        Wire.send(((int)(_data) | _backlightval));
        Wire.endTransmission();   
    }   
    */


    _delayMicroseconds(us) {
        this.board.delay(us/1000);
    }

    write = print = function (str) {
        // TODO: map misc Unicode chars to typical LCD extended charset?
        var bytes = (typeof str === 'string') ? new Buffer(str, 'ascii') :
            (typeof str === 'object') ? str : new Buffer([str]);
        for (var i = 0, len = bytes.length; i < len; i++)
            this.send(bytes[i], this.board.HIGH);
    }   
    
    
    /*
    var lcd = new d.LCD({
        board: board,
        pins: {rs:12, rw:11, e:10, data:[5, 4, 3, 2]}
    });

    lcd.begin(16, 2);
    lcd.print("Hello Internet.");
    */
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
    const self = this;
    if (!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach((key) => {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
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
                var lcd = new LiquidCrystal_I2C({
                    board: board,
                    pins: {rs:12, rw:11, e:10, data:[5, 4, 3, 2]}
                });
       
                buffer = new Buffer([255, 85, 36, sensorIdx, this.actionTypes.MODULE, device, port]);
                buffer = Buffer.concat([buffer, text0, text1, dummy]);     
                console.log(buffer);
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
