#!/usr/bin/env node

/*
 * A node.js websocket client for
 * data extraction from Zenbot
 */

var program = require('commander')
  , nodeCleanup = require('node-cleanup')
  , read = require('read')
  , events = require('events')
  , WebSocket = require('ws')
  , fs = require('fs')
  , portastic = require('portastic')
  , c = require('./conf')

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
  .option('--passphrase [passphrase]', 'Specify a Client SSL Certificate Key\'s passphrase.'
     + '\n\t\t\t\t  If you don\'t provide a value, it will be prompted for.')
  .option('--sub <object|object list>', 'Subscribes to a specific object or object list'
     + '\n\t\t\t\t  (comma separated list with no space)')
  .option('--unsub <object|object list>', 'Unsubscribes to a specific object or object list'
     + '\n\t\t\t\t  (comma separated list with no space)')
  .option('-b, --beautify', 'Beautify JSON output')
  .parse(process.argv)

if (program.connect) {
  var options = {}
  var cont = function () {

    if (program.protocol) options.protocolVersion = +program.protocol
    if (program.origin) options.origin = program.origin
    if (program.subprotocol) options.protocol = program.subprotocol
    if (program.host) options.host = program.host
    if (!program.check) options.rejectUnauthorized = program.check
    if (program.ca) options.ca = fs.readFileSync(program.ca)
    if (program.cert) options.cert = fs.readFileSync(program.cert)
    if (program.key) options.key = fs.readFileSync(program.key)
    if (program.sub) options.sub = program.sub
    if (program.unsub) options.unsub = program.unsub
    if (program.beautify) options.beautify = program.beautify

    var headers = into({
       clientname: "zenout",
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
    var key = ws._req._headers['sec-websocket-key']

    ws.on('open', function open() {
      if (program.sub) {
        var msg =
          {
            "client": key,
            "msg": "sub " + program.sub
          }
        ws.send(JSON.stringify(msg))
      }
      if (program.unsub) {
        var msg =
          {
            "client": key,
            "msg": "unsub " + program.sub
          }
        ws.send(JSON.stringify(msg))
      }
    }).on('close', function close() {
      process.exit()
    }).on('error', function error(code, description) {
      console.log(code + (description ? ' ' + description : ''))
      process.exit(-1)
    }).on('message', function message(data, flags) {
      options.beautify ? console.log(JSON.stringify(JSON.parse(data),null,4)) : console.log(data)
      //console.log(data)
    })

    setTimeout(() => { /* Just to keep process running */ }, 1000000);

    nodeCleanup(function(exitCode,signal) {
      if (signal) {
        console.log('Connection closed, signal ',signal, ' ', exitCode)
      }
      return false
    })

    ws.on('close', function close() {
      var msg =
        {
          "client": key,
          "msg": "closing " + key
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

  var portRange = c.talker_port_range
  //var portRange = { min: 3000, max: 3020}
  var range = []
  for (p = portRange.min; p <= portRange.max; p++) {
    range.push(p)
  }
/*
  portastic.filter(range)
    .then(function(ports){
      for (var i = 0; i < ports.length; i++) {
        range.splice(ports[i]-portRange.min)
      }
      //console.log('Zentalk ports you can connect to: ',range)
      console.log('Invocation: ./zentalk.js -c localhost:' + range[0])
    })
*/
  //program.help()
}
