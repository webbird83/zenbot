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

function parseJson(str) {
    try {
        return JSON.parse(str);
    } catch (ex) {
        return null;
    }
}

var freshStart = true
var who = {}

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
  .option('--sub <object>', 'Subscribes to a specific object'
     + '\n\t\t\t\t  (Objects are: trades, periods, candles and signals)')
  .option('--unsub <object>', 'Unsubscribes to a specific object')
  .option('--rsi_hi <RSI value>', 'When the RSI value goes ABOVE this value, Zentalk will send an alertl')
  .option('--rsi_lo <RSI value>', 'When the RSI value goes BELOW this value, Zentalk will send an alertl')
  .option('--price_hi <price level>', 'When the price level goes ABOVE this level, Zentalk will send an alert')
  .option('--price_lo <price level>', 'When the price level goes BELOW this level, Zentalk will send an alert')
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
    if (program.rsi_hi) options.rsi_hi = program.rsi_hi
    if (program.rsi_lo) options.rsi_lo = program.rsi_lo
    if (program.price_hi) options.price_hi = program.price_hi
    if (program.price_lo) options.price_lo = program.price_lo

    //const cid = Math.floor(Math.random()*(99-11)+10) // Random number 10 to 99

    var headers = into({
      clientname: "zenxmpp",
      clienttype: "imclient",
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
    console.log('Client ID: ' + headers.clientid, wsKey + ' Pid: ' + process.pid)

    // Messages sent to the Zenbot server by talker.js
    ws.on('open', function open() {
      // Ask for client short ID "cid"
      if (program.sub) {
        var msg = { "client": wsKey, "msg": "sub " + program.sub }
        ws.send(JSON.stringify(msg))
      }
      if (program.unsub) {
        var msg = { "client": wsKey, "msg": "unsub " + program.unsub }
        ws.send(JSON.stringify(msg))
      }
      if (program.rsi_hi) {
        var msg = { "client": wsKey, "msg": "alarm rsi_hi " + program.rsi_hi }
        ws.send(JSON.stringify(msg))
      }
      if (program.rsi_lo) {
        var msg = { "client": wsKey, "msg": "alarm rsi_lo " + program.rsi_lo }
        ws.send(JSON.stringify(msg))
      }
      if (program.price_hi) {
        var msg = { "client": wsKey, "msg": "alarm price_hi " + program.price_hi }
        ws.send(JSON.stringify(msg))
      }
      if (program.price_lo) {
        var msg = { "client": wsKey, "msg": "alarm price_lo " + program.price_lo }
        ws.send(JSON.stringify(msg))
      }

      setTimeout(() => {
      // Make sure it is enought time to get answer
      var msg = {"client": wsKey, "msg": "id"}
        ws.send(JSON.stringify(msg))
      },1000)

    }).on('close', function close() {
      process.exit()
    }).on('error', function error(code, description) {
      console.log(code + (description ? ' ' + description : ''))
      process.exit(-1)
    })

    var Client = require('node-xmpp-client/index')
      , cnf = require('./conf-zenxmpp')
      , tp = require('./templates/zenmailer.tpl')

    var client = new Client({ 
      jid: cnf.clientId,
      password: cnf.clientPasswd,
      host: cnf.clientHost,
      port: cnf.clientPort,
      reconnect: true,
      autostart: true
    })

    client.connection.socket.on('error', function (error) {
      console.error(error)
      process.exit(1)
    })

    client.on('offline', function () {
      console.log('Client is offline')
    })
    client.on('connect', function () {
      console.log('Client is connected')
    })
    client.on('reconnect', function () {
      console.log('Client reconnects …')
    })
    client.on('disconnect', function (e) {
      console.log('Client is disconnected', client.connection.reconnect, e)
    })
    client.on('error', function (err) {
      console.error(err)
      process.exit(1)
    })

    client.on('stanza', function (stanza) {
//      console.log('Received stanza: ',  stanza.toString())
      if (stanza.is('message') && stanza.attrs.type === 'chat' && !stanza.getChild('delay')) {
        var body = stanza.getChildText('body').toLowerCase()
        var msg = {
          "client": wsKey,
          "msg": body
        }
        ws.send(JSON.stringify(msg))
        console.log(msg)
      }
    })

    // Start the Zentall server side client, waut for messages
    client.on('online', function (data) {
      console.log('Connected as ' + data.jid.local + '@' + data.jid.domain + '/' + data.jid.resource)
      client.send('<presence/>')
      
      // Messages sent back to XMPP client
      ws.on('message', function message(data, flags) {
        var textMsg = ''
        var json = parseJson(data)
//console.log(data)
        if (json) {
          if (json.cid) {
            cid = json.cid
            textMsg = `Client ${json.cid}, ${json.selector} connected`
//console.log('\naCID: ', json)
          } else
          if (json.alarm) {
            textMsg = json.alarm
          } else
          if (json.trade) {
            var msgText = json.trade
            //var msgText = data
            msgText.exchange = msgText.selector.split('.')[0]
            msgText.pair = msgText.selector.split('.')[1]
            delete msgText.selector
            var tpl = tp.template(msgText)
            textMsg = tpl.plain
            //console.log(data)
          } else 
            textMsg = JSON.stringify(json,false,4)
        } else {
          // Something wrong happened
          textMsg = data.toString()
        }
        var stanza = new Client.Stanza('message', {
          to: cnf.receiver, type: 'chat'
        })
        stanza.c('body').t(textMsg)
        client.send(stanza)
//        client.end()
      })
    })

    //=================================================================
    // Start implementing messaging here
    // Data from Zenbot is delivered in the
    // "message" JSON object
    //
    // Require the modules,configuration 
    // and template(s) you need for
    // your messaging application

      //
      // End of the messaging implementation
      //=================================================================

//    setTimeout(() => { /* Just to keep process running */ }, 1000000);

    nodeCleanup(function(exitCode,signal) {
      if (signal) {
        console.log('Connection closed, signal ',signal, ' ', exitCode)
      var msg =
        {
          "client": wsKey,
          "msg": "closing " + wsKey
        }
      ws.send(JSON.stringify(msg))
      ws.close()
      }
      return false
    })

    ws.on('close', function close() {
      var msg =
        {
          "client": wsKey,
          "msg": "closing " + wsKey
        }
      ws.send(JSON.stringify(msg))
      ws.close()
      process.exit(-1)
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
