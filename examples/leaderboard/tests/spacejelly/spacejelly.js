module.exports = {

	// should spacejelly start selenium?
	// if so, nightwatch.selenium.start_process will be set to 'false'
	"startSelenium": true,

	// should spacejelly set the selenium-server-{..}.jar path?
	// if so, nightwatch.selenium.server_path will be replaced
	"replaceSeleniumPath": true, 

	"timeout": false, // not implemented yet. timeout for tests

	"meteor": {
		"rootUrl": "http://localhost",
		"port": 4096,
		"mongoUrl": "",
		"production": true,
		"release": false,
		"settings": false // Path of settings file. Runs meteor with --settings <settings>
	},

	"nightwatch": {
		"src_folders" : ["./tests/spacejelly/tests"],
		"output_folder" : "./tests/spacejelly/reports",
		"custom_commands_path" : "./tests/spacejelly/commands",
		"custom_assertions_path" : "./tests/spacejelly/assertions",
		"globals_path" : "",

		"selenium" : {
			"start_process" : false, // may be replaced (startSelenium)
			"server_path" : false,   // may be replaced (replaceSeleniumPath)
			"log_path" : "./tests/spacejelly/logs",
			"host" : "127.0.0.1",
			"port" : 4444,
			"cli_args" : {
				"webdriver.chrome.driver" : "",
				"webdriver.ie.driver" : ""
			}  
		},

		"test_settings" : {
			"default" : {
				"launch_url" : '', // will be provided by Spacejelly
				"selenium_port"  : 4444,
				"selenium_host"  : "localhost",
				"silent": true,
				"screenshots" : {
					"enabled" : false,
					"path" : ""
				},
				"globals": require('./data/dev'), // ATTENTION: path is relative to spacejelly-folder
				"desiredCapabilities": {
					/* 
						desiredCapabilities will be provided by spacejelly.
						Spacejelly will use phantomjs.
					*/
				}
			}
		}
	}
};