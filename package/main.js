(function() {
	'use strict';

	var VERSION = 1.1;

	// initialize options
	var options = {};
	var gui = require('nw.gui');
	gui.App.argv.forEach(function(item, index) {
		if(item == '-debug') {
			options.debug = true;
		}
	});

	// show devtools if console
	var win = gui.Window.get();
	if(options.debug) {
		win.showDevTools();
	}

	// language
	var translator = require('translator');
	var lang = translator.getLanguage();
	// console.log('language: ' + lang);

	// logger
	var logger = {
		v: function(str) {
			console.log(str);
		},
		i: function(str) {
			console.info('%c' + str, 'color: dodgerblue');
		},
		w: function(str) {
			console.warn('%c' + str, 'color: orange');
		},
		e: function(str) {
			console.error('%c' + str, 'color: red');
		}
	};
	require('logger').set(logger);

	// server
	var server = require('entry');
	server.open(logger);

	// router
	var router = require('router').init(server);
	window.router = router;

	// flasher
	var flasher = require('flasher');
	// ui & control
	$('#driver').text(translator.translate('Install Device Driver'));
	$('#firmware').text(translator.translate('Install Firmware'));
	$('#other-robot .text').text(translator.translate('Connect Other Hardware'));
	$('#entry .text').text(translator.translate('Show Entry Web Page'));
//	$('#reconnect .text').text(translator.translate('Reconnect Hardware'));

	var ui = {
		countRobot: 0,
		showRobotList: function() {
			router.close();
			router.stopScan();
			delete window.currentConfig;
			$('#title').text(translator.translate('Select hardware'));
			$('#hwList').show();
			$('#hwPanel').hide();
			ui.showIeGuide();
			this.hideAlert();
		},
		showConnecting: function() {
			$('#title').text(translator.translate('hardware > connecting'));
			$('#hwList').hide();
			$('#hwPanel').show();
			ui.hideIeGuide();
			this.showAlert(translator.translate('Connecting to hardware device.'));
		},
		showConnected: function() {
			$('#title').text(translator.translate('hardware > connected'));
			$('#hwList').hide();
			$('#hwPanel').show();
			ui.hideIeGuide();
			this.showAlert(translator.translate('Connected to hardware device.'), 2000);
		},
		showDisconnected: function() {
			$('#title').text(translator.translate('hardware > disconnected'));
			$('#hwList').hide();
			$('#hwPanel').show();
			ui.hideIeGuide();
			this.showAlert(translator.translate('Hardware device is disconnected. Please restart this program.'));
		},
		showAlert: function(message, duration) {
			$('#alert').text(message);

			$('#alert').css({
				height: '0px'
			});
			$('#alert').animate({
				height: '35px'
			});

			if (duration) {
				setTimeout(function(){
					$('#alert').animate({
						height: '0px'
					});
				}, duration);
			}
		},
		hideAlert: function(message) {
			$('#alert').animate({
				height: '0px'
			});
		},
		addRobot: function(config) {
			ui.showRobotList();
			var name;
			if(config.name) {
				name = config.name[lang] || config.name['en'];
			}

			$('#hwList').append(
					'<div class="hardwareType" id="' + config.id + '">' +
					'<img class="hwThumb" src="../modules/' + config.icon + '">' +
					'<h2 class="hwTitle">' + name + '</h2></div>');

			$('#' + config.id).click(function() {
				if(config.hardware.type === 'bluetooth') {
					is_select_port = true;
				}

				
				// if(config.select_com_port) {
				// 	var com_port = prompt('사용하실 COM 포트를 적어주세요.');
				// 	if(!com_port)
				// 		return;
				// 	config.this_com_port = com_port;
				// }

				ui.hardware = config.id.substring(0, 4);
				ui.numLevel = 1;
//				if(config.level) {
//					ui.numLevel = parseInt(config.level);
//				}
				ui.showConnecting();
				router.startScan(config);
				window.currentConfig = config;

				var icon = '../modules/' + config.icon;
				$('#selectedHWThumb').attr('src', icon);

				if(config.url) {
					$('#url').text(config.url);
					$('#url').show();
					$('#url').unbind('click');
					$('#url').click(function() {
						gui.Shell.openItem(config.url);
					});
				} else {
					$('#url').hide();
				}

//				$('#reconnect').click(function() {
//					ui.showConnecting();
//					router.startScan(config);
//				});

				$('#driver').hide();
				$('#firmware').hide();
				$('#extFirmware').hide();				
				$('#firmware').on('click', function () {
					ui.flashFirmware(this.firmware, config);
				});
				$('#extFirmware').on('click', function () {
					ui.flashFirmware(this.firmware, config);
				});

				if(config.driver) {
					var os = process.platform + '-' + (isOSWin64() ? 'x64' : process.arch);
					var driverPath = config.driver[os];
					if(driverPath) {
						$('#driver').show();
						$('#driver').unbind('click');
						$('#driver').click(function() {
							var path = require('path');
							gui.Shell.openItem(path.join(process.cwd() + '/drivers/', driverPath));
						});
					}
					if (config.firmware) {
						$('#firmware').show();
						if(typeof config.firmware === 'string') {
							$('#firmware').text(translator.translate('Install Firmware'));
							$('#firmware').prop('firmware', config.firmware);
						} else if(Array.isArray(config.firmware)) {
							var firmware = config.firmware[0];
							var extFirmware = config.firmware[1];
							$('#extFirmware').show().text(translator.translate(extFirmware.translate));
							$('#extFirmware').prop('firmware', extFirmware.name);
							$('#firmware').text(translator.translate(firmware.translate));
							$('#firmware').prop('firmware', firmware.name);
						}

					}
				}
//				if(config.description) {
//					var connection = config.description.connection;
//					if(connection) {
//						var description = connection[lang] || connection['en'];
//						$('#description').text(description);
//					}
//				}
			});
		},
		flashFirmware: function(firmware, config) {
			$('#firmwareButtonSet').hide();
			if (!router.connector) {
				alert(translator.translate('Hardware Device Is Not Connected'));
				return;
			}
			ui.showAlert(translator.translate("Firmware Uploading..."));
			var port = router.connector.sp.path;
			var baudRate = config.firmwareBaudRate;
			router.close();
            setTimeout(function () {
    			flasher.flash(
    				firmware,
    				port,
    				baudRate
    				,
    				function(error, stdout, stderr) {
    					// console.log(error, stdout, stderr);
    					$('#firmwareButtonSet').show();
    					ui.showAlert(translator.translate("Firmware Uploaded!"));
    					router.startScan(config);
    				}
    			);
            }, 200);
		},
		setState: function(state) {
			if(state == 'connected') {
				ui.showConnected();
//				if(ui.numLevel > 1) {
//					ui.showLevelPanel();
//				} else {
//					ui.level = 1;
//				}
			} else if(state == 'lost') {
				$('#message').text(translator.translate('Connecting...'));
			} else if(state == 'disconnected') {
				ui.showDisconnected();
//				ui.showReconnectButton(true);
			}
		},
		quit: function() {
			win.close();
		},
		showIeGuide: function() {
			$('#ieGuide').show();
		},
		hideIeGuide: function() {
			$('#ieGuide').hide();
		}
	};

	$('#back.navigate_button').click(function(e) {
		delete window.currentConfig.this_com_port;
		ui.showRobotList();
		router.close();
	});

	$('.chromeButton').click(function(e) {
		window.open("https://www.google.com/chrome/browser/desktop/index.html");
	});


	function isOSWin64() {
  		return process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
	};

	// close
	win.on('close', function() {
		var isQuit = true;
		if(router.connector && router.connector.connected) {
			isQuit = confirm(translator.translate('Connection to the hardware will terminate once program is closed.'));
		}		

		if(isQuit) {
			this.hide();
			router.close();
			server.close();
			if(ui.winEntry) {
				ui.winEntry.close(true);
				ui.winEntry = undefined;
			}
			this.close(true);
		}
	});

	$('#select_port').dblclick(function () {
		$('#btn_select_port').trigger('click');
	});

	$('#btn_select_port').click(function(e) {
		var com_port = $("#select_port").val();
		if(!com_port) {
			alert('연결할 COM PORT를 선택하세요.');
		} else {
			window.currentConfig.this_com_port = com_port[0];
			clear_select_port();
		}
	});

	$('#btn_select_port_cancel').click(function(e) {
		clear_select_port();
		clearTimeout(select_port_connection);
		ui.showRobotList();
	});

	function clear_select_port() {
		is_select_port = false;
		_cache_object = '';
		$('#select_port_box').css('display', 'none');
	}


	var _cache_object = '';
	var _com_port = '';
	var is_select_port = true;
	var select_port_connection;
	// state
	router.on('state', function(state, data) {
		if (state === "select_port") {
			router.close();
			var _temp = JSON.stringify(data);
			if(_temp !== _cache_object && is_select_port) {
				var port_html = '';
				data.forEach(function (port) {
					port_html += '<option>' + port.comName + '</option>';
				});				

				$('#select_port_box').css('display', 'flex');
				$('#select_port_box select').html(port_html);

				_cache_object = _temp;		
			}		
			if(is_select_port) {
				select_port_connection = setTimeout(function () {
					router.startScan(window.currentConfig);
				}, 1000);
			} else {
				is_select_port = true;
			}
			return;
		} else if (state === "flash") {
			console.log('flash');
            $('#firmware').trigger('click');
		} else if (state === "connect" && window.currentConfig.softwareReset) {
			var sp = router.connector.sp;
			sp.set({dtr: false}, function(){});
			setTimeout(function() {sp.set({dtr: true}, function(){})}, 1000);
			return;
		} else if ((state === "lost" || state === "disconnected") && window.currentConfig.reconnect) {
			router.close();
			ui.showConnecting();
			router.startScan(window.currentConfig);
			return;
		} else if(state === 'before_connect' && window.currentConfig.firmware) {
			ui.showAlert(translator.translate('Connecting to hardware device.') + ' 펌웨어를 선택해 주세요.');
		}
		ui.setState(state);
		server.setState(state);
	});

	// configuration
	var fs = require('fs');
	fs.readdir('./modules', function(error, files) {
		if(error) {
			logger.e(error);
			return;
		}
		files.filter(function(file) {
			return /(?:\.([^.]+))?$/.exec(file)[1] == 'json';
		}).forEach(function(file) {
			try {
				var config = fs.readFileSync('./modules/' + file);
				ui.addRobot(JSON.parse(config));
			} catch(e) {}
		});
	});
}());
