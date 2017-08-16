#!/usr/bin/env node

/*
 * A node.js program client for
 * finding Zentalk port/selector
 * relation
 */

var events = require('events')
  , WebSocket = require('ws')
  , portastic = require('portastic')
  , c = require('./conf')

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

var options = {}

var headers = into({
   clientname: "zenwho",
   clienttype: "stdout",
   clientid: Math.floor(Math.random()*(99-11)+10), // Random number 10 to 99
   clientpid: process.pid
}, ([]).map(function split(s) {
  return splitOnce(':', s)
}))



var portRange = c.talker_port_range
var freePorts = []

for (p = portRange.min; p <= portRange.max; p++) {
  freePorts.push(p)
}

portastic.filter(freePorts).then(function(ports){
  for (var i = 0; i < ports.length; i++) {
    freePorts.splice(ports[i]-portRange.min)
  }

  var getPort = function (p) {    
    var connectUrl = 'ws://localhost:' + freePorts[p]

    options.headers = headers
    var ws = new WebSocket(connectUrl)
    var wsKey = ws._req._headers['sec-websocket-key']
    ws.on('open', function open() {
      var msg = { "client": wsKey, "msg": "who" }
      ws.send(JSON.stringify(msg))
    }).on('close', function close() {
      //process.exit()
    }).on('error', function error(code, description) {
      console.log('Error: ', code + (description ? ' ' + description : ''))
      process.exit(-1)
    }).on('message', function message(data, flags) {
      console.log('Connect-URL: '+ connectUrl + ' --> Selector ',data)
      ws.close()
      //console.log(data)
    })
    return freePorts[p]
  }

  for (var p = 0; p < freePorts.length; p++) {
    var port = getPort(p)
    //console.log('Get Port ', getPort(j)) 
  } 
  //console.log('Zentalk ports you can connect to: ',freePorts)
})
