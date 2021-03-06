**THIS IS STILL BEING WORKED ON. DO NOT USE YET.**

[![Build Status](https://travis-ci.org/dferber90/spacejelly.svg?branch=master)](https://travis-ci.org/dferber90/spacejelly)

# Spacejelly

An npm package to run end-to-end tests on your Meteor app.
Use in continuous integration environments, such as [Travis CI](https://travis-ci.org).

This package starts your [Meteor](https://github.com/meteor/meteor) app, spawns a [Selenium](https://code.google.com/p/selenium/) Server (Jar-File is provided), and runs the [Nightwatch](https://github.com/beatfactor/nightwatch/) tests. Then, it finishes using a semantic exit code.

## Quickstart
    
    # 1) install
    $ npm install spacejelly -g

    # 2) create nightwatch tests in your meteor app

    # 3) run spacejelly from meteor app
    $ spacejelly


## Table of Contents

- [Installation](#installation)
- [Project Setup](#project-setup)
	- [Configuration](#configuration)
		- [Selenium](#selenium)
	- [Exit Codes](#exit-codes)
- [Example](#example)
- [Development](#development)
   - [Fancy Installation](#fancy-installation)
- [License](#license)


## Installation

For current user:

```bash
npm install -g spacejelly
```

For all users:

```bash
# The -H is required
sudo -H npm install -g spacejelly
```


## Project Setup

### Configuration

#### Selenium
Tests also use Selenium.
There is currently an error in v2.44.0, so we use v2.43.1.
https://github.com/beatfactor/nightwatch/issues/309
https://code.google.com/p/selenium/issues/detail?id=8088



### Exit Codes

See [here](https://github.com/joyent/node/blob/master/doc/api/process.markdown#exit-codes) for node exit codes.

Spacejam codes:

*  0: everything was fine. all tests passed.
* 21: Tests failed.
* 22: Spacejelly failed.
* 23: Spacejelly timed out (increase timeout with `-t` flag or in config)
* 24: Meteor failed to start. There is probably an error within your app. Try starting it on its own. 
* 25: Mongo failed (maybe `meteor reset` may help).
* 26: Selenium failed.
* 27: Nightwatch failed.

> **TIP**
> Run `$?` in terminal to get the exit code of the previous commmand. You can use this to get the exit code of spacejelly by running it after spacejelly finishes.

See `lib/Spacejelly.js` for up-to-date list.


## Example

An example for a Meteor app with Nightwatch tests is provided in `examples/leaderboard`.
Check out this repository, `$ cd examples/leaderboard` and run `$ spacejelly` to see it in action.




## Development

### Fancy Installation

Get this code, and then do this:

    npm link

# License
The MIT License (MIT)

Copyright (c) 2014 Dominik Ferber. See [LICENSE](/LICENSE).