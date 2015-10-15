## XenoBot Official Scripts

Official XenoBot cavebot scripts for botting on Tibia and some Open-Tibia servers.

[![Slack Status](https://ox-slackin.herokuapp.com/badge.svg)](http://slack.xenobot.net)

### Dependencies
Before attempting to get started, please install the following depedencies if you do not already have them.

**You may need to restart your computer after installing these dependencies!**

- [Install NodeJS](https://nodejs.org/en/)
- [Install Python 3.3](https://www.python.org/downloads/release/python-336/) (make sure you install in PATH!)
- [Install Lua 5.1](https://github.com/rjpcomputing/luaforwindows/releases/tag/v5.1.4-49)
- [Install ZMQ (py33)](https://github.com/zeromq/pyzmq/downloads)
- [Install Git](https://git-scm.com/download/win)


### Getting Started

*Make sure you have all the required depedencies listed above installed!*

Open the command prompt and navigate to the directory you wish to clone to and run the following:

```shell
$ git clone git@github.com:OXGaming/oxscripts.git oxscripts
$ cd oxscripts
$ npm install                                # Install dependencies in ./package.json
$ npm start --script="Edron Demons (MS)"     # Start the build server
```

### How to run the live reload server
This will start a build server that detects changes to source and live-reloads the script.

```shell
$ npm start --script="Edron Demons (MS)"
```

### How to build a single script without live reload
Packages the source files into a single file and copies it to your XenoBot settings folder.

```shell
$ npm run build --script="Edron Demons (MS)"
```

### Directory Layout

```
.
├── /build/                     # The folder for compiled scripts
├── /node_modules/              # 3rd-party libraries and utilities
├── /src/                       # The library lua scripts
├── /waypoints/                 # Contains waypoints for scripts and towns
├── /tools/                     # Build automation scripts and utilities
│   ├── /lib/                   # Library for utility functions
│   ├── /build.js               # Triggers the clean and bundle tasks
│   ├── /bundle.js              # Bundles the source files into a single script
│   ├── /clean.js               # Cleans up the output (build) folder
│   ├── /run.js                 # Launches the compiled XBST file
│   └── /start.js               # Launches the build server to auto build changes
└── package.json                # The list of 3rd party libraries and utilities
```
