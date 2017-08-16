#!/usr/bin/env node

/*!
 * ws: a node.js websocket client
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var program = require('commander')
//  , ON_DEATH = require('death') // ({debug: true, SIGINT: true, SIGTERM: true})
  , nodeCleanup = require('node-cleanup')
  , readline = require('readline')
  , read = require('read')
  , colors = require('colors')
  , events = require('events')
  , WebSocket = require('ws')
  , util = require('util')
  , fs = require('fs')
  , tty = require('tty')

/**
 * InputReader - processes console input.
 */
function Console() {
  if (!(this instanceof Console)) return new Console()

  this.stdin = process.stdin
  this.stdout = process.stdout

  this.readlineInterface = readline.createInterface(this.stdin, this.stdout)

  var self = this

  this.readlineInterface.on('line', function line(data) {
    self.emit('line', data)
  }).on('close', function close() {
    self.emit('close')
  })

  this._resetInput = function() {
    self.clear()
  }
}

util.inherits(Console, events.EventEmitter)

Console.Colors = {
  Red: '\033[31m',
  Green: '\033[32m',
  Yellow: '\033[33m',
  Blue: '\033[34m',
  Default: '\033[39m'
}

Console.Types = {
  Incoming: '',
  Control: '',
  Error: 'error: ',
}

Console.prototype.prompt = function prompt() {
  this.readlineInterface.prompt()
}

Console.prototype.print = function print(type, msg, color) {
  if (tty.isatty(1)) {
    this.clear()
    color = color || Console.Colors.Default
    this.stdout.write(color + type + msg + Console.Colors.Default + '\n')
    this.prompt()
  } else if (type === Console.Types.Incoming) {
    this.stdout.write(msg + '\n')
  } else {
    // is a control message and we're not in a tty... drop it.
  }
}

Console.prototype.clear = function clear() {
  if (tty.isatty(1)) {
    this.stdout.write('\033[2K\033[E')
  }
}

Console.prototype.pause = function pausing() {
  this.stdin.on('keypress', this._resetInput)
}

Console.prototype.resume = function resume() {
  this.stdin.removeListener('keypress', this._resetInput)
}

function appender(xs) {
  xs = xs || []

  return function (x) {
    xs.push(x)
    return xs
  }
}

function into(obj, kvals) {
  kvals.forEach(function (kv) {
    obj[kv[0]] = kv[1]
  })

  return obj
}

function splitOnce(sep, str) { // sep can be either String or RegExp
  var tokens = str.split(sep)
  return [tokens[0], str.replace(sep, '').substr(tokens[0].length)]
}

/**
 * The actual application
 */
//var version = require('./package.json').version

program
//  .version(version)
  .usage('[options] (--connect <url>)')
  .option('-c, --connect <url>', 'connect to a websocket server')
  .option('-p, --protocol <version>', 'optional protocol version')
  .option('-o, --origin <origin>', 'optional origin')
  .option('--host <host>', 'optional host')
  .option('-s, --subprotocol <protocol>', 'optional subprotocol')
  .option('-n, --no-check', 'Do not check for unauthorized certificates')
  .option('-H, --header <header:value>', 'Set an HTTP header. Repeat to set multiple.', appender(), [])
  .option('--auth <username:password>', 'Add basic HTTP authentication header.')
  .option('--ca <ca>', 'Specify a Certificate Authority.')
  .option('--cert <cert>', 'Specify a Client SSL Certificate.')
  .option('--key <key>', 'Specify a Client SSL Certificate\'s key.')
  .option('--passphrase [passphrase]', 'Specify a Client SSL Certificate Key\'s passphrase. If you don\'t provide a value, it will be prompted for.')
  .parse(process.argv)

if (program.connect) {
  var options = {}
  var cont = function () {
    var wsConsole = new Console()

    if (program.protocol) options.protocolVersion = +program.protocol
    if (program.origin) options.origin = program.origin
    if (program.subprotocol) options.protocol = program.subprotocol
    if (program.host) options.host = program.host
    if (!program.check) options.rejectUnauthorized = program.check
    if (program.ca) options.ca = fs.readFileSync(program.ca)
    if (program.cert) options.cert = fs.readFileSync(program.cert)
    if (program.key) options.key = fs.readFileSync(program.key)

    var headers = into({
      clientname: "zentalk", 
      clienttype: "interactive",
      clientid: Math.floor(Math.random()*(99-11)+10), // Random number 10 to 99
      clientpid: process.pid
    }, (program.header || []).map(function split(s) {
      return splitOnce(':', s)
    }))
    if (program.auth) {
      headers.Authorization = 'Basic '+ new Buffer(program.auth).toString('base64')
    }

    var connectUrl = program.connect
    if (!connectUrl.match(/\w+:\/\/.*$/i)) {
      connectUrl = 'ws://' + connectUrl
    }

    options.headers = headers
    var ws = new WebSocket(connectUrl, options)
    var wsKey = ws._req._headers['sec-websocket-key']
    console.log('Client ID: ', wsKey + ' Pid: ' + process.pid)

    ws.on('open', function open() {
      wsConsole.print(Console.Types.Control, 'connected (press CTRL+C to quit)', Console.Colors.Blue)
      wsConsole.on('line', function line(data) {
        if (data.match(/closing/)) data = 'are you joking?'
        var msg =
          {
            "client": wsKey,
            "msg": data
          }
        ws.send(JSON.stringify(msg))
        wsConsole.prompt()
      })
    }).on('close', function close() {
      wsConsole.print(Console.Types.Control, 'disconnected', Console.Colors.Blue)
      wsConsole.clear()
      process.exit()
    }).on('error', function error(code, description) {
      wsConsole.print(Console.Types.Error, code + (description ? ' ' + description : ''), Console.Colors.Yellow)
      process.exit(-1)
    }).on('message', function message(data, flags) {
      wsConsole.print(Console.Types.Incoming, data, Console.Colors.Blue)
    })
    
    setTimeout(() => { /* Just to keep process running */ }, 1000000);

    nodeCleanup(function(exitCode,signal) {
      if (signal) {
        console.log('Connection closed, signal ',signal, ' ', exitCode)
      }
      return false
    })

    wsConsole.on('close', function close() {
      var msg =
        {
          "client": wsKey,
          "msg": "closing " + wsKey
        }
      ws.send(JSON.stringify(msg))
      ws.close()
    })
  }

  if (program.passphrase === true) {
    var readOptions = {
      prompt: 'Passphrase: ',
      silent: true,
      replace: '*'
    }
    read(readOptions, function(err, passphrase) {
      options.passphrase = passphrase
      cont()
    })
  } else if (typeof program.passphrase === 'string') {
    options.passphrase = program.passphrase
    cont()
  } else {
    cont()
  }
} else {
  program.help()
}
