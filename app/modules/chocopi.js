function Module() {
	this.sp = null;
	this.sensor_count = 0;
	this.blocklist = []
	this.blockdata = []
	this.entry = false
	this.needStop = false
	this.staretedM = []
	this.stopBoundary=[]
	this.outputHw = []
	this.eventdata = []
	this.eventmask = 0
	this.datamask = 0

	this.eventblock = []
	this.has_bl = false
	this.pd = new Array(128)
	this.pi = 0
	this.mp = {}


	for (var i = 0; i < 16; i++) {
		this.blockdata.push({ g: this, connected: false, ps: () => { }, empty: true, is_sensor: false });
		this.eventdata[i] = {}
		this.blocklist[i] = { id: 0, name: '' }
		this.stopBoundary[i]=-1
		this.needStop[i]=false
	}
	this.ps = () => { }
	this.command = { listblock: 0x0D, name: 0x0C, version: 0x08, ping: 0xE4 }
}

function make_packet(bytearray) {
	var data = [];
	var checksum = 0xFF;
	data.push(0x7E); data.push(bytearray.length + 1); //data + length byte + checksum
	checksum ^= bytearray.length + 1;
	for (var i = 0; i < bytearray.length; i++) {
		checksum ^= bytearray[i];
		if ((bytearray[i] == 0x7E) || (bytearray[i] == 0x7D)) {
			data.push(0x7D); data.push(bytearray[i] ^ 0x20);
		} else {
			data.push(bytearray[i]);
		}
	}
	if (checksum == 0x7E) {
		data.push(0x7D); data.push(0x5E)
	} else if (checksum == 0x7D) {
		data.push(0x7D); data.push(0x5D)
	} else {
		data.push(checksum)
	}
	return  Buffer.from(data)
}

Module.prototype.init = function (handler, config) { 
	this.checkStop()
}

Module.prototype.setSerialPort = function (sp) {
	this.sp = sp;
	this.send_array([0xE0, this.command.listblock]) //0D block list, 0x0C name
}

Module.prototype.requestInitialData = function (sp) {
	this.sp = sp
	this.send_array([0xE0, this.command.version])
	return null
}

Module.prototype.lostController = function(self, cb) {};


Module.prototype.checkInitialData = function (data, config) { return true }
// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function (data) { // data: Native Buffer
	for (var i = 0; i < data.length; i++) {
		var b = data[i]
		if (b == 0x7E) {
			this.ps = this.ps_start;
			this.pi = 0;
			continue
		} else {
			if (b == 0x7D) {
				i++
				b = data[i] == 0x5E ? 0x7E : 0x7D
			}			
		}
		this.process(b)
	}
}


// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function (handler) {
	if (this.datamask) {
		var data = {}
		for (var i = 0; i < 8; i++) {
			if ((this.datamask & (1 << i)) > 0) {
				data[i] = this.blockdata[i].data
			}
		}
		handler.write('d', data);
	} else {
		handler.write('d', null)
	}
	if (this.eventmask > 0) {
		ev = {}
		for (var i = 0; i < 8; i++) {
			if ((this.eventmask & (1 << i)) > 0) {
				ev[i] = this.eventdata[i]
			}
		}
		handler.write('ev', ev)
	} else {
		handler.write('ev', null)
	}
	if (this.has_bl) {
		handler.write('bl', this.blocklist)
		this.has_bl = false
	} else {
		handler.write('bl', null)
	}
	this.datamask = 0
	this.eventmask = 0
}

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function (handler) {
	if (handler.read('init')) {
		this.send_array([0xE0, this.command.listblock])
	}
	
	var data = handler.read('data');
	if (data) {
		for (var i in data) {
			if (data[i] && this.outputHw[i]) {
				this.outputHw[i](i, data[i])
			}
		}
	}
	if (handler.read('stop') == 'stop') {}
	this.entry=true
}


// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function () {
	if (this.sensor_count == 0) {
		return make_packet([this.command.ping])
	}
	return null; //not by Entry but by this module
}

Module.prototype.connect = function () { 
}

Module.prototype.disconnect = function (connect) {
}

Module.prototype.reset = function () { }

//additional definitions

Module.prototype.send_array = function (data) {
	if (this.sp) this.sp.write(make_packet(data))
}

Module.prototype.process = function (b) {
	this.pd[this.pi++] = b
	if (this.pi > 128) this.pi = 127;
	this.ps(b);
}

Module.prototype.ps_null = function (b) { }

Module.prototype.ps_start = function (b) {
	this.pi = 0;
	if (b < 0xE0) {
		this.mp.detail = b & 0xF0;
		this.mp.port = b & 0x0F;
		if (this.mp.port >= 16) {
			this.ps = this.ps_null
			return
		}
		this.ps = this.blockdata[this.mp.port].ps.bind(this.blockdata[this.mp.port])
	} else {
		switch (b) {
			case 0xE0: this.ps = this.ps_chocopi; break
			case 0xE1: this.ps = this.ps_block_connected; break
			case 0xE2: this.ps = this.ps_block_disconnected; break
			case 0xE4: this.ps = this.ps_got_ping; break
		}
	}
}
Module.prototype.ps_got_ping = function () { }
Module.prototype.ps_chocopi = function (b) {
	switch (b) {
		case 0x08: this.ps = this.ps_get_version; break
		case 0x0D: this.ps = this.ps_block_list; break
		case 27: this.ps = this.ps_block_list_ble; break
	}

}

Module.prototype.ps_get_version = function (b) {
	if (this.pi == 10) {
		this.version = 'V' + this.pd[8] + '.' + this.pd[9]
	}
}

Module.prototype.ps_block_list = function (b) {
	var rp = 1;
	if (this.pi < 17) return;
	for (var port = 0; port < 8; port++) {
		var block_type = this.pd[rp] + (this.pd[rp + 1] * 256)
		rp += 2
		this.blocklist[port] = this.connectBlock(block_type, port);
	}
	console.log('block list')
	this.has_bl = true
	this.ps = this.ps_null
}

Module.prototype.ps_block_list_ble = function () {
	this.has_bl = true
}

Module.prototype.ps_block_connected = function (b) {
	if (this.pi == 3) {
		var block_type = this.pd[1] + (this.pd[2] * 256)
		var port = this.pd[0]
		this.has_bl = true
		this.blocklist[port] = this.connectBlock(block_type, port)
	}
}

Module.prototype.ps_block_disconnected = function (b) {
	if (b > 15) return
	var bd = this.blockdata[b]
	bd.connect = false
	if (bd.is_sensor) {
		bd.is_sensor = false
		this.sensor_count--
		if (this.sensor_count < 0) this.sensor_count = 0
	}
	this.blocklist[b] = { id: 0, name: '' }
	this.has_bl = true
	console.log(bd.name + ' disconnected')
}

Module.prototype.connectBlock = function (block, port) {
	if (port > 15) return;
	var bd = this.blockdata[port]

	switch (block) {
		case 0: bd.ps = this.ps_null; break
		case 8: bd.ps = this.sensorB; break
		case 9: bd.ps = this.touchB; break
		case 10: bd.ps = this.controlB; break
		case 11: bd.ps = this.motionB; break
		case 12: bd.ps = this.ledB; break
		case 13: bd.ps = this.stepperB; break
		case 14: bd.ps = this.dcmotorB; break
		case 15: bd.ps = this.servoB; break
		default: console.log('strange block' + block); return 0
	}
	bd.port = port
	bd.ps.call(bd, 0, 'init');
	return { id: block, name: bd.name }
}


Module.prototype.sensorB = function (b, init) {
	if (init) {
		this.data = {}
		this.name = 'sensor'
		this.g.send_array([0x10 | this.port, 0xdf, 30, 0]);
		this.connected = true
		if (!this.is_sensor) { this.is_sensor = true; this.g.sensor_count++ }
		return
	}
	if (this.g.pi == 1) {
		this.fb = b;
		this.pk_length = 2;
		for (var i = 0; i < 8; i++) {
			if (b & (1 << i)) {
				this.pk_length += 2;
			}
		}
	} else if (this.pk_length == this.g.pi) {
		var value, i, dp = 1;
		for (i = 0; i < 8; i++) {
			if (this.fb & (1 << i)) {
				value = this.g.pd[dp] + (this.g.pd[dp + 1] * 256);
				switch (i) { //for temperature
					case 6: this.data.temp = (value - 27315) * 0.01; break
					case 7: this.data.humi = value * 0.01; break
					case 4: this.data.light = value; break
					case 0: ; case 1: ; case 2: ; case 3: this.data[i] = value; break
				}
				dp += 2;
			}
		}
		this.g.ps = this.g.ps_null
		this.g.datamask |= 1 << this.port
	}
}


Module.prototype.touchB = function (b, init) {
	if (init) {
		this.name = 'touch'
		this.g.send_array([0x10 | this.port, 0x68, 30, 0]);
		this.connected = true
		if (!this.is_sensor) { this.is_sensor = true; this.g.sensor_count++ }
		this.data = { tv: new Array(12) }
		this.prev_touch = 0
		return
	}
	if (this.g.mp.detail != 0x10) return
	if (this.g.pi == 1) {
		this.fb = b;
		this.pk_length = 2;
		this.pk_length = 2;
		if (b & (1 << 0)) { this.pk_length += 4; }
		if (b & (1 << 1)) { this.pk_length += 2; }
		if (b & (1 << 2)) { this.pk_length += 2; }
		if (b & (1 << 3)) { this.pk_length += 24; }
	} else if (this.pk_length == this.g.pi) {
		var value, i, dp = 1;
		if (this.fb & (1 << 0)) {
			this.data.ts = this.g.pd[dp] + (this.g.pd[dp + 1] * 256)
			dp += 4
		} //button status
		if (this.fb & (1 << 1)) { this.data.ts = this.g.pd[dp] + (this.g.pd[dp + 1] * 256); dp += 2; }
		if (this.fb & (1 << 2)) { this.data.ts = this.g.pd[dp] + (this.g.pd[dp + 1] * 256); dp += 2; }
		if (this.fb & (1 << 3)) {
			for (i = 0; i < 12; i++) {
				this.data.tv[i] = this.g.pd[dp] + (this.g.pd[dp + 1] * 256); dp += 2;
			}
		}
		var change = this.prev_touch ^ this.data.ts

		if (change > 0) {
			this.g.eventdata[this.port].id = change
			this.prev_touch = this.data.ts
			this.g.eventmask |= 1 << this.port
		}
		this.g.ps = this.g.ps_null
		this.g.datamask |= 1 << this.port
	}
}

Module.prototype.controlB = function (b, init) {
	if (init) {
		this.name = 'control'
		this.g.send_array([0x10 | this.port, 0x0f, 30, 0])
		if (!this.is_sensor) { this.is_sensor = true; this.g.sensor_count++ }
		this.prev_button = 0
		return
	}
	if (this.g.pi == 1) {
		this.fb = b;
		this.pk_length = 2;
		for (var i = 0; i < 4; i++) { if (b & (1 << i)) { this.pk_length += 2; } }
	} else if (this.pk_length == this.g.pi) {
		this.data = { xyp: [0, 0] }
		var value, i, dp = 1;
		for (i = 0; i < 3; i++) {
			if (this.fb & (1 << i)) {
				value = this.g.pd[dp] + (this.g.pd[dp + 1] * 256);
				this.data.xyp[i] = value;
				dp += 2;
			}
		}
		if (this.fb & 8) {
			var buttons = this.g.pd[dp] & 0x1E
			var ev = this.g.eventdata[this.port]
			ev.btn = []
			for (i = 0; i < 4; i++) {
				ev.btn[i] = buttons & (1 << (4 - i)) ? 1 : 0;
			}
			var change = buttons ^ this.prev_button
			if (change > 0) {
				ev.id = change
				this.prev_button = buttons
				this.g.eventmask |= 1 << this.port
			}
		}

		this.g.datamask |= 1 << this.port
		this.g.ps = this.g.ps_null
	}
}

Module.prototype.motionB = function (b, init) {
	if (init) {
		this.name = 'motion'
		this.g.send_array([0x10 | this.port, 0x0f, 30, 0])
		if (!this.is_sensor) { this.is_sensor = true; this.g.sensor_count++ }
		var ev = this.g.eventdata[this.port]
		ev.pg = [0, 0]
		return
	}
	if (this.g.mp.detail === 0x10) {
		if (this.g.pi == 1) {
			this.fb = b;
			this.pk_length = 2;
			for (var i = 0; i < 3; i++) {
				if (b & (1 << i)) this.pk_length += 6
			}
			if (b & (1 << 3)) this.pk_length += 1
		} else if (this.pk_length == this.g.pi) {
			this.data = { s: [] }
			var value, i, dp = 1;
			for (i = 0; i < 3; i++) {
				if (this.fb & (1 << 0)) {
					for (j = 0; j < 3; j++) {
						value = this.g.pd[dp] + (this.g.pd[dp + 1] * 256); dp += 2;
						value = (value << 16) >> 16;
						this.data.s[i * 3 + j] = value;
					}
				}
			}
			if (this.functionbit & (1 << 4)) {
				this.data.pg[0] = (this.g.pd[dp] & 1) ? 1 : 0
				this.data.pg[1] = (this.g.pd[dp] & 2) ? 1 : 0
			}
			this.g.ps = this.g.ps_null
			this.g.datamask |= 1 << this.port
		}
	} else if (this.g.mp.detail === 0x20) { //photogate event
		if (this.g.pi == 1) {
			this.event_count = b;
			if (this.event_count > 10) {
				this.g.ps = this.g.ps_null
				return
			}
			this.pk_length = this.event_count * 5 + 2
		} else if (this.g.pi === this.pk_length) {
			var ev = this.g.eventdata[this.port]
			if (!ev.time) ev.time = [[0, 0], [0, 0]]
			var value, i, dp = 1, status1, status2;
			for (i = 0; i < this.event_count; i++) {
				var pg = this.g.pd[dp]
				var pgid = (pg & 4) ? 0 : 1
				status1 = (pg & 1) ? 1 : 0
				status2 = (pg & 2) ? 1 : 0
				ev.pg[0] = status1;
				ev.pg[1] = status2;
				event_time = this.g.pd[dp + 1] + (this.g.pd[dp + 2] * 256) + (this.g.pd[dp + 3] * 65536) + (this.g.pd[dp + 4] * 16777216)
				var event_time_s = event_time * 0.0001;
				if (pgid == 0) {
					ev.time[pgid][status1] = event_time_s
				} else {
					ev.time[pgid][status2] = event_time_s
				}
				dp += 5
			}
			this.g.ps = this.g.ps_null
			this.g.datamask |= 1 << this.port
			this.g.eventmask |= 1 << this.port
		}
	}
}

Module.prototype.ledB = function (b, init) {
	if (init) {
		this.name = 'led'
		this.g.outputHw[this.port] = this.g.ledBhw.bind(this.g)
	}
}
Module.prototype.servoB = function (b, init) {
	if (init) {
		this.name = 'servo'
		this.g.outputHw[this.port] = this.g.servoBhw.bind(this.g)
	}
}
Module.prototype.dcmotorB = function (b, init) {
	if (init) {
		this.name = 'dcmotor'
		this.g.outputHw[this.port] = this.g.dcmotorBhw.bind(this.g)
	}
}
Module.prototype.stepperB = function (b, init) {
	if (init) {
		this.name = 'stepper'
		this.g.outputHw[this.port] = this.g.stepperBhw.bind(this.g)
	}
}

Module.prototype.ledBhw = function (port, data) {
	var l, r, g, b
	[l, r, g, b] = data
	if (l > 0) l--;
	if (r > 255) r = 255; if (r < 0) r = 0;
	if (g > 255) g = 255; if (g < 0) g = 0;
	if (b > 255) b = 255; if (b < 0) b = 0;	
	this.send_array([0x00 | port, l, g, r, b])
	this.staretedM[port]	= true
	this.needStop = true
	if(this.stopBoundary[port]< l ) this.stopBoundary[port] = l 
}


Module.prototype.dcmotorBhw = function (port, data) {
	var id, s, d, code
	[id, s, d] = data
	if (s < 0) {
		s = -s
		d = 1 - d
	}
	code = (d == 1) ? 0x10 : 0x00
	code += id * 0x20
	code |= port;
	s *= 20.48
	if (s > 2047) s = 2047
	s = Math.round(s)
	this.send_array([code, s & 0xFF, s >>= 8])
	if(s>0) {
		this.staretedM[port]=true
		this.needStop = true		
		if(this.stopBoundary[port]< id) this.stopBoundary[port]=id
	}
}


Module.prototype.servoBhw = function (port, data) {
	var id, a
	[id, a] = data
	if (a > 200) {
		a = 200;
	} else if (a < 0) { a = 0 }
	a *= 100;
	this.send_array([((id + 1) << 4) | port, a & 0xFF, a >>= 8])
}

Module.prototype.stepperBhw = function (port, data) {
	var id, s, d, c, packet
	[c, id, s, d] = data
	if (s < 0) {
		s = -s
		d = !d
	}
	s *= 100;
	if (s > 32767) s = 32767;
	s = Math.round(s);

	if (c == 's') {
		code = (d) ? 0x10 : 0x00;
		code += motor_id * 0x20;
		code |= port;
		packet = [code, s & 0xFF, s >>= 8]

	} else if (c == 'sa') { //speed angle
		code = (d) ? 0x10 : 0x00;
		code += 0x80 + id * 0x20;
		code |= port;
		var packet = [d, s & 0xFF, s >>= 8];
		a = Math.round(a)
		packet.push(a & 0xFF); a >>= 8;
		packet.push(a & 0xFF); a >>= 8;
		packet.push(a & 0xFF); a >>= 8;
		packet.push(a & 0xFF);
	}
	this.send_array(packet)
}

Module.prototype.checkStop = function () {	
	var me = this	
	setTimeout(me.checkStop.bind(me), 200)
	if(this.entry) {
		this.entry=false
		return
	}
	if(!me.needStop) return
	me.needStop = false;
	for(var i=0;i<16;i++){
		if(this.staretedM[i]){
			this.staretedM[i]=false
			if(this.blocklist[i].name=='led'){				
				for(var j=0; j<= this.stopBoundary[i]; j++){
					this.send_array([0x00 | i, j, 0, 0, 0])
				}
			}else if(this.blocklist[i].name=='dcmotor'){
				for(var j=0; j<= this.stopBoundary[i]; j++){
					me.dcmotorBhw(i,[j,0,0])
				}
			}
		}
	}
}

module.exports = new Module()