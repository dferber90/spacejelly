# Leaderboard example

Fully-configured spacejelly example for the Meteor leaderboard application.

This folder provides nightwatch-tests, which you can execute using spacejelly by running `$ spacejelly` in the command line (after installing it globally) from the `leaderboard` folder (this folder).

Spacejelly will start the Meteor app, start a Selenium Server and run the Nightwatch tests for you. It will log the output to the console and exit with code 0 if everything was fine. Otherwise it will use different exit codes to indicate the kind of error. This makes spacejelly perfect for CI.

## Config
The config for spacejelly is in `tests/spacejelly/spacejelly.js`.
Please note that some parts of the config under the `nightwatch` key may be overwritten by spacejelly.





## Nightwatch
Nightwatch really comes with a ton of useful features.
This project provides examples for some of them (data, custom assertions, custom commands).


### Data
To avoid hard-coding data into your tests, you can use the `tests/spacejelly/data` folder. Examples are provided.
Location of data folder is specified in spacejelly configuration file, under `nightwatch.test_settings.globals` key.

### Custom assertions and commands
One example for a custom command, and one example for a assertion is provided in `tests/spacejelly/commands`, or `tests/spacejelly/assertions`, respectively.

