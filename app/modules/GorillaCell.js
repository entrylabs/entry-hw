function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function delay(milli_second) {
  await sleep(milli_second);
}
delay();


class LiquidCristal_I2C_Custom{
    constructor(){
        console.log("Remoted Custom LiquidCristal_I2C Library On");
    }
    //I2C_HandleTypeDef hi2c1;
    /* USER CODE BEGIN PV */
    /* Private variables ---------------------------------------------------------*/
    I2C_addr_PCF8574 = 0x20 << 1;
    Backlight = [ 0x80, 0x00 ];  // off, on
    /* USER CODE END PV */
    Data_Buffer = new Array();
    
    /* USER CODE BEGIN PFP */
    /* Private function prototypes -----------------------------------------------*/
    I2C_LCD_command_8(command){ 
        // write a command(instruction) to text LCD
        //P0: D4  P1: D5  P2: D6  P3: D7
        //P4: E   P5: RW  P6: RS  P7: BJT base

        let T_buf = new Array(2);  // transmit buffer
        T_buf[T_buf.length] = (command >> 4) | 0x10;   // high 4 bit, E = 0, RS = 0, base = low (Backlight on)
        T_buf[T_buf.length] = T_buf[0] & 0xEF;         // E = 0

        //HAL_I2C_Master_Transmit(&hi2c1, I2C_addr_PCF8574, T_buf, 2, 1000);
        //  Maybe, set device master mode & PCF8574 to T_Buf
        this.Data_Buffer = T_buf;
    }

    I2C_LCD_command(command) {
        // write a command(instruction) to text LCD
        //P0: D4  P1: D5  P2: D6  P3: D7
        //P4: E   P5: RW  P6: RS  P7: BJT base
        let T_buf = new Array(4);  // transmit buffer

        T_buf[T_buf.length] = (command >> 4) | 0x10;   // high 4 bit, E = 1, RS = 0, base = low (Backlight on)
        T_buf[T_buf.length] = T_buf[0] & 0xEF;         // E = 0

        T_buf[T_buf.length] = (command & 0x0F) | 0x10; // low 4 bit, E = 1
        T_buf[T_buf.length] = T_buf[2] & 0xEF;         // E = 0

        this.Data_Buffer = T_buf;
        //HAL_I2C_Master_Transmit(&hi2c1, I2C_addr_PCF8574, T_buf, 4, 1000);
        //HAL_I2C_Master_Transmit( &I2cHandle, address, buff, size, 10000ms)
    }    

    I2C_LCD_data(data) // display a character on text LCD
    {

        //P0: D4  P1: D5  P2: D6  P3: D7
        //P4: E   P5: RW  P6: RS  P7: BJT base

        let T_buf = new Array(4);  // transmit buffer

        T_buf[T_buf.length] = (data >> 4) | 0x50;      // high 4 bit, E = 1, RS = 1
        T_buf[T_buf.length] = T_buf[0] & 0xEF;         // E = 0

        T_buf[T_buf.length] = (data & 0x0F) | 0x50;    // low 4 bit, E = 1, RS = 1
        T_buf[T_buf.length] = T_buf[2] & 0xEF;         // E = 0

        this.Data_Buffer = T_buf;
        //HAL_I2C_Master_Transmit(&hi2c1, I2C_addr_PCF8574, T_buf, 4, 1000);

    }

    LCD_string(command, string) {
        // display a string on LCD
        this.I2C_LCD_command(command);                // start position of string
        while (string != '\0'){                  // display string
        
            this.I2C_LCD_data(string);
            string++;
        }
    }
    
    Initialize_LCD() // initialize text LCD module
    {
        // 8-bit mode
        this.I2C_LCD_command_8(0x30);
        delay(10);
        this.I2C_LCD_command_8(0x30);
        delay(6);
        this.I2C_LCD_command_8(0x30);


        this.I2C_LCD_command_8(0x20);        // changes to 4-bit mode
        // 4-bit mode
        this.I2C_LCD_command(0x28);          // function set(4-bit, 2 line, 5x7 dot)
        this.I2C_LCD_command(0x0C);          // display control(display ON, cursor OFF)
        this.I2C_LCD_command(0x06);          // entry mode set(increment, not shift)
        this.I2C_LCD_command(0x01);          // clear display
        delay(3);
    }
}


//---------------------------------------------------------------------------------------

function LiquidCrystal_I2C(){
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
  
  //this.En = B00000100;  // Enable bit
  //this.Rw = B00000010;  // Read/Write bit
  //this.Rs = B00000001;  // Register select bit
  
  this.En = 0x04;  // Enable bit
  this.Rw = 0x02;  // Read/Write bit
  this.Rs = 0x01;  // Register select bit
   

  /**
   * This is the driver for the Liquid Crystal LCD displays that use the I2C bus.
   *
   * After creating an instance of this class, first call begin() before anything else.
   * The backlight is on by default, since that is the most likely operating mode in
   * most cases.
   */
  
  let _addr;
  let _displayfunction;
  let _displaycontrol;
  let _displaymode;
  let _cols;
  let _rows;
  let _charsize;
  let _backlightval;
}


// When the display powers up, it is configured as follows:
//
// 1. Display clear
// 2. Function set:
//    DL = 1; 8-bit interface data
//    N = 0; 1-line display
//    F = 0; 5x8 dot character font
// 3. Display on/off control:
//    D = 0; Display off
//    C = 0; Cursor off
//    B = 0; Blinking off
// 4. Entry mode set:
//    I/D = 1; Increment by 1
//    S = 0; No shift
//
// Note, however, that resetting the Arduino doesn't reset the LCD, so we
// can't assume that its in that state when a sketch starts (and the
// LiquidCrystal constructor is called).    

LiquidCrystal_I2C.prototype.LiquidCrystal_I2C = function(lcd_addr, lcd_cols, lcd_rows, charsize){
  this._addr = lcd_addr;
  this._cols = lcd_cols;
  this._rows = lcd_rows;
  this._charsize = charsize;
  this._backlightval = LCD_BACKLIGHT;
}

LiquidCrystal_I2C.prototype.begin = function(){
Wire.begin();
    
  _displayfunction = this.LCD_4BITMODE | this.LCD_1LINE | this.LCD_5x8DOTS;
if (this._rows > 1) {
  this._displayfunction |= this.LCD_2LINE;
}

// for some 1 line displays you can select a 10 pixel high font
if ((this._charsize != 0) && (this._rows == 1)) {
  this._displayfunction |= this.LCD_5x10DOTS;
}

// SEE PAGE 45/46 FOR INITIALIZATION SPECIFICATION!
// according to datasheet, we need at least 40ms after power rises above 2.7V
// before sending commands. Arduino can turn on way befer 4.5V so we'll wait 50
delay(50);

// Now we pull both RS and R/W low to begin commands
this.expanderWrite(this._backlightval);	// reset expanderand turn backlight off (Bit 8 =1)
delay(1000);

//put the LCD into 4 bit mode
// this is according to the hitachi HD44780 datasheet
// figure 24, pg 46

// we start in 8bit mode, try to set 4 bit mode
this.write4bits(0x03 << 4);
delay(4500); // wait min 4.1ms

// second try
this.write4bits(0x03 << 4);
delay(4500); // wait min 4.1ms

// third go!
this.write4bits(0x03 << 4);
delay(150);

// finally, set to 4-bit interface
this.write4bits(0x02 << 4);

// set # lines, font size, etc.
this.command(this.LCD_FUNCTIONSET | this._displayfunction);

// turn the display on with no cursor or blinking default
this._displaycontrol = this.LCD_DISPLAYON | this.LCD_CURSOROFF | this.LCD_BLINKOFF;
this.display();

// clear it off
this.clear();

// Initialize to default text direction (for roman languages)
this._displaymode = this.LCD_ENTRYLEFT | this.LCD_ENTRYSHIFTDECREMENT;

// set the entry mode
this.command(this.LCD_ENTRYMODESET | this._displaymode);

this.home();   
}

/********** high level commands, for the user! */
LiquidCrystal_I2C.prototype.clear = function(){
this.command(this.LCD_CLEARDISPLAY);// clear display, set cursor position to zero
delay(2000);  // this command takes a long time!
}

LiquidCrystal_I2C.prototype.home = function(){
this.command(this.LCD_RETURNHOME);  // set cursor position to zero
delay(2000);  // this command takes a long time!
}

LiquidCrystal_I2C.prototype.setCursor = function(col, row){
//uint8_t col, uint8_t row
let row_offsets = [0x00, 0x40, 0x14, 0x54];
if (row > this._rows) {
  row = this._rows-1;    // we count rows starting w/0
}
this.command(this.LCD_SETDDRAMADDR | (col + row_offsets[row]));
}

// Turn the display on/off (quickly)
LiquidCrystal_I2C.prototype.noDisplay = function() {
this._displaycontrol &= ~this.LCD_DISPLAYON;
this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
}

LiquidCrystal_I2C.prototype.display = function() {
this._displaycontrol |= this.LCD_DISPLAYON;
this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
}

// Turns the underline cursor on/off
LiquidCrystal_I2C.prototype.noCursor = function() {
this._displaycontrol &= ~this.LCD_CURSORON;
this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
}

LiquidCrystal_I2C.prototype.cursor = function() {
this._displaycontrol |= this.LCD_CURSORON;
this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
}

// Turn on and off the blinking cursor
LiquidCrystal_I2C.prototype.noBlink = function() {
this._displaycontrol &= ~this.LCD_BLINKON;
this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
}
LiquidCrystal_I2C.prototype.blink = function() {
this._displaycontrol |= this.LCD_BLINKON;
this.command(this.LCD_DISPLAYCONTROL | this._displaycontrol);
}

// These commands scroll the display without changing the RAM
LiquidCrystal_I2C.prototype.scrollDisplayLeft = function() {
this.command(this.LCD_CURSORSHIFT | this.LCD_DISPLAYMOVE | this.LCD_MOVELEFT);
}
LiquidCrystal_I2C.prototype.scrollDisplayRight = function() {
this.command(this.LCD_CURSORSHIFT | this.LCD_DISPLAYMOVE | this.LCD_MOVERIGHT);
}

// This is for text that flows Left to Right
LiquidCrystal_I2C.prototype.leftToRight = function() {
this._displaymode |= this.LCD_ENTRYLEFT;
this.command(this.LCD_ENTRYMODESET | this._displaymode);
}

// This is for text that flows Right to Left
LiquidCrystal_I2C.prototype.rightToLeft = function() {
this._displaymode &= ~this.LCD_ENTRYLEFT;
this.command(this.LCD_ENTRYMODESET | this._displaymode);
}

// This will 'right justify' text from the cursor
LiquidCrystal_I2C.prototype.autoscroll = function() {
this._displaymode |= this.LCD_ENTRYSHIFTINCREMENT;
this.command(this.LCD_ENTRYMODESET | this._displaymode);
}

// This will 'left justify' text from the cursor
LiquidCrystal_I2C.prototype.noAutoscroll = function() {
this._displaymode &= ~this.LCD_ENTRYSHIFTINCREMENT;
this.command(this.LCD_ENTRYMODESET | this._displaymode);
}

// Allows us to fill the first 8 CGRAM locations
// with custom characters
LiquidCrystal_I2C.prototype.createChar = function(location, charmap) {
//uint8_t location, uint8_t charmap[]

location &= 0x7; // we only have 8 locations 0-7
this.command(this.LCD_SETCGRAMADDR | (location << 3));
for (let i=0; i<8; i++) {
  this.write(charmap[i]);
}
}

// Turn the (optional) backlight off/on
LiquidCrystal_I2C.prototype.noBacklight = function() {
this._backlightval=this.LCD_NOBACKLIGHT;
this.expanderWrite(0);
}

LiquidCrystal_I2C.prototype.backlight = function() {
this._backlightval=this.LCD_BACKLIGHT;
this.expanderWrite(0);
}
LiquidCrystal_I2C.prototype.getBacklight = function() {
//bool type return
return this._backlightval == this.LCD_BACKLIGHT;
}


/*********** mid level commands, for sending data/cmds */
//inline void LiquidCrystal_I2C::command(uint8_t value) {
LiquidCrystal_I2C.prototype.command = function(value) {
this.send(value, 0);
}

//inline size_t LiquidCrystal_I2C::write(uint8_t value) {
//define unsigned long long site_t
LiquidCrystal_I2C.prototype.write = function(value) {
this.send(value, Rs);
return 1;
}


/************ low level data pushing commands **********/

// write either command or data
LiquidCrystal_I2C.prototype.send = function(value, mode) {
//uint8_t value, uint8_t mode
//unsigned char uint8_t
let highnib=value&0xf0;
let lownib=(value<<4)&0xf0;
this.write4bits((highnib)|mode);
this.write4bits((lownib)|mode);
}

LiquidCrystal_I2C.prototype.write4bits = function(value) {
//uint8_t value
this.expanderWrite(value);
this.pulseEnable(value);
}

LiquidCrystal_I2C.prototype.expanderWrite = function(_data){
//uint8_t _data
Wire.beginTransmission(this._addr);
Wire.write(parseInt((_data) | this._backlightval));
Wire.endTransmission();
}

LiquidCrystal_I2C.prototype.pulseEnable = function(_data){
//uint8_t _data
this.expanderWrite(_data | this.En);	// En high
delay(1);		// enable pulse must be >450ns

this.expanderWrite(_data & ~this.En);	// En low
delay(50);		// commands need > 37us to settle
}

LiquidCrystal_I2C.prototype.load_custom_character = function(char_num, rows){
//uint8_t char_num, uint8_t *rows
this.createChar(char_num, rows);
}

LiquidCrystal_I2C.prototype.setBacklight = function(new_val){
//uint8_t new_val
if (new_val) {
  this.backlight();		// turn backlight on
} else {
  this.noBacklight();		// turn backlight off
}
}

LiquidCrystal_I2C.prototype.printstr = function(c){
//const char c[]
//This function is not identical to the function used for "real" I2C displays
//it's here so the user sketch doesn't have to be changed
//print(c);
}


function Module() {
    this.digitalValue = new Array(14);
    this.analogValue = new Array(6);

    this.remoteDigitalValue = new Array(14);
    this.readablePorts = null;
    this.remainValue = null;
    this.I2C_addr = null;
    this.I2C_str0 = "";
    this.I2C_str1 = "";
}



//--------------------------------------------------------------
Module.prototype.init = function(handler, config) {};

Module.prototype.requestInitialData = function() {
    return null;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.handleRemoteData = function(handler) {
    // 엔트리 브라우저에서 온 데이터를 처리한다. handler.read 로 브라우저의 데이터를 읽어올 수 있다.
    // handler 의 값은 Entry.hw.sendQueue 에 세팅한 값과 같다.


    /*
    let buffer = new Buffer([]);
    const digitalPin = this.digitalPin;
    */

    /*

    for (let i = 0 ; i < 14 ; i++) {
        digitalPin[i] = handler.read(i);

        buffer = Buffer.concat([
            buffer,
            this.makeOutputBuffer(1, i, digitalPin[i] === 1 ? 255 : 0),
        ]);
    }

    if (buffer.length) {
        this.sendBuffers.push(buffer);
    }
    */

    // processing entry browser data
    this.readablePorts = handler.read('readablePorts');
    this.I2C_addr = handler.read('I2C_addr_PCF8574');
    this.I2C_str0 = handler.read('I2C_str0');   //received string buf0
    this.I2C_str1 = handler.read('I2C_str1');   //received string buf1

    var digitalValue = this.remoteDigitalValue;
    for (var port = 0; port < 14; port++) {
        digitalValue[port] = handler.read(port);
    }
    
};

Module.prototype.requestLocalData = function() {
  // 디바이스로 데이터를 보내는 로직. control: slave 인 경우 duration 주기에 맞춰 디바이스에 데이터를 보낸다.
  // return 값으로 버퍼를 반환하면 디바이스로 데이터를 보내나, 아두이노의 경우 레거시 코드를 따르고 있다.    
    var queryString = [];

    var readablePorts = this.readablePorts;
    var I2C_LCD_avaiable = this.I2C_addr;
    /* MCU Configuration----------------------------------------------------------*/
    I2C_lcd_on = new LiquidCristal_I2C_Custom();
    I2C_lcd_on.Initialize_LCD();
    I2C_lcd_on.LCD_string(0x80, this.I2C_str0);
    I2C_lcd_on.LCD_string(0x80 + 0x40, this.I2C_str1);
    /* USER CODE END 2 */

    /* Infinite loop */
    /* USER CODE BEGIN WHILE */

    /* USER CODE END WHILE */
    // Backlight off

    if(I2C_LCD_avaiable){
        //HAL_I2C_Master_Transmit(&hi2c1, I2C_addr_PCF8574, I2C_lcd_on.Backlight[0], 1, 1000);
        delay(500);
        // 주소값 셋팅하면서 아날로그로 데이터를 보내야함 (MCU로)

        // Backlight on
        //HAL_I2C_Master_Transmit(&hi2c1, I2C_addr_PCF8574, I2C_lcd_on.Backlight[1], 1, 1000);
        //delay(500);
    }
    /* USER CODE BEGIN 3 */

    /* USER CODE END 3 */
    
    

    if (readablePorts) {
        for (var i in readablePorts) {
            var query = (5 << 5) + (readablePorts[i] << 1);
            queryString.push(query);
        }
    }
    var readablePortsValues =
        (readablePorts && Object.values(readablePorts)) || [];
    var digitalValue = this.remoteDigitalValue;
    for (var port = 0; port < 14; port++) {
        if (readablePortsValues.indexOf(port) > -1) {
            continue;
        }
        var value = digitalValue[port];
        if (value === 255 || value === 0) {
            var query = (7 << 5) + (port << 1) + (value == 255 ? 1 : 0);
            queryString.push(query);
        } else if (value > 0 && value < 255) {
            var query = (6 << 5) + (port << 1) + (value >> 7);
            queryString.push(query);
            query = value & 127;
            queryString.push(query);
        }
    }
    return queryString;
};

Module.prototype.handleLocalData = function(data) {
    // data: Native Buffer
    var pointer = 0;
    for (var i = 0; i < 32; i++) {
        var chunk;
        if (!this.remainValue) {
            chunk = data[i];
        } else {
            chunk = this.remainValue;
            i--;
        }
        if (chunk >> 7) {
            if ((chunk >> 6) & 1) {
                var nextChunk = data[i + 1];
                if (!nextChunk && nextChunk !== 0) {
                    this.remainValue = chunk;
                } else {
                    this.remainValue = null;

                    var port = (chunk >> 3) & 7;
                    this.analogValue[port] =
                        ((chunk & 7) << 7) + (nextChunk & 127);
                }
                i++;
            } else {
                var port = (chunk >> 2) & 15;
                this.digitalValue[port] = chunk & 1;
            }
        }
    }
};

Module.prototype.requestRemoteData = function(handler) {
    // send from Device-data to Browser-Data
 // 디바이스에서 데이터를 받아온 후, 브라우저로 데이터를 보내기 위해 호출되는 로직. handler 를 세팅하는 것으로 값을 보낼 수 있다.
 // handler.write(key, value) 로 세팅한 값은 Entry.hw.portData 에서 받아볼 수 있다.    
    for (var i = 0; i < this.analogValue.length; i++) {
        var value = this.analogValue[i];
        handler.write('a' + i, value);
    }
    for (var i = 0; i < this.digitalValue.length; i++) {
        var value = this.digitalValue[i];
        handler.write(i, value);
    }
};

Module.prototype.reset = function() {};

module.exports = new Module();
