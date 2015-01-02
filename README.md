**THIS IS STILL BEING WORKED ON. DO NOT USE YET.**

[![Build Status](https://travis-ci.org/dferber90/spacejelly.svg?branch=master)](https://travis-ci.org/dferber90/spacejelly)

# Spacejelly

An npm package to run end-to-end tests on your Meteor app.
Use in continuous integration environments, such as Travis CI.

This package starts your [Meteor](https://github.com/meteor/meteor) app, spawns a [Selenium](https://code.google.com/p/selenium/) Server (Jar-File is provided), and runs the [Nightwatch](https://github.com/beatfactor/nightwatch/) tests. Then, it finishes using a semantic exit code.

## Quickstart
    
    # 1) install
    $ npm install spacejelly -g

    # 2) create config file
    # you currently have to create this manually.
    # Example config: examples/leaderboard/tests/spacejelly/spacejelly.js

    # run spacejelly
    $ spacejelly


## Table of Contents

- [Installation](#installation)
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








## Development


### Fancy Installation

Get this code, and then do this:

    npm link

# License
The MIT License (MIT)

Copyright (c) 2014 Dominik Ferber. See [LICENSE](/LICENSE).