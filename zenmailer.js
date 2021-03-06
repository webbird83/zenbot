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
  .option('--sub <object|object list>', 'Subscribes to a specific object or object list'
     + '\n\t\t\t\t  (comma separated list with no space)')
  .option('--unsub <object|object list>', 'Unsubscribes to a specific object or object list'
     + '\n\t\t\t\t  (comma separated list with no space)')
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

    var headers = into({
      clientname: "zenmailer",
      clienttype: "mailclient",
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
      if (program.sub) {
        var msg = 
          {
            "client": wsKey,
            "msg": "sub " + program.sub
          }
        ws.send(JSON.stringify(msg))
      }
      if (program.unsub) {
        var msg = 
          {
            "client": wsKey,
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
      var message = parseJson(data)

      //=================================================================
      // Start implementing messaging here
      // Data from Zenbot is delivered in the
      // "message" JSON object
      //
      // Require the modules,configuration 
      // and template(s) you need for
      // your messaging application
      var mailer = require('nodemailer')
        , c = require('./conf-zenmailer')
        , t = require('./templates/zenmailer.tpl')

      let mailTransport = mailer.createTransport({
        host: c.smtpHost,
        port: c.smtpPort,
        secure: c.smtpPort === 465 ? true : false,
        auth: c.smtpPort === 25 ? false : { user: c.smtpUser, pass: c.smtpPass }
      })

      let smtpOptions = {
          from: c.msgFrom // sender address
          , to: c.msgTo   // list of receivers 
          , subject: ''
          , text: ''
          , html: ''
      }
      if (message) {
        var msgText = message.lastTrade
        //var msgText = data
        msgText.exchange = msgText.selector.split('.')[0]
        msgText.pair = msgText.selector.split('.')[1]
        delete msgText.selector
        var tpl = t.template(msgText)
        // setup esmtp data with unicode symbols
        smtpOptions.subject = tpl.subject // Subject line
        smtpOptions.text = tpl.plain // plain text body
        smtpOptions.html = tpl.html // html body
        //console.log(data)
      } else {
        // Something wrong happened
        smtpOptions.subject = 'Zebot trading failed' // Subject line
        smtpOptions.text = 'Something unusual happened to the trade!\n\n'
        + 'Data returned: ' + data.toString()
        smtpOptions.html = '<b>Something unusual happened to the trade!</b><br><br>'
        + '<b>Data returned: ' + data.toString() + '</b>' // html body
      }
      // Send smtp with defined transport object
      mailTransport.sendMail(smtpOptions, (error, info) => {
        if (error) {
          return console.log(error)
        }
        console.log('Message %s sent: %s', info.messageId, info.response)
      })
      //
      // End of the messaging implementation
      //=================================================================
    })

    setTimeout(() => { /* Just to keep process running */ }, 1000000);

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
