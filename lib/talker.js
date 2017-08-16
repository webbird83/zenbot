
// Websockets additions
var EventEmitter = require('events').EventEmitter
  , WebSocket = require('ws')
  , util = require('util')
  , port = require('portastic')
  , colors = require('colors')
  , z = require('zero-fill')
  , n = require('numbro')
  , c = require('../conf')

function emitter() {
  EventEmitter.call(this)
}
util.inherits(emitter, EventEmitter)

var talkerPort = 0

port.find( c.talker_port_range ).then(function(ports){
  talkerPort = ports[0]
  //commanderPort =  ports[1]
})

class ObjectStore {
  constructor(talkObject) {
    this.objectStore = talkObject
  }
  get objectStore() {
    return this.objStore
  }
  set objectStore(talkObject) {
    this.objStore = talkObject
  }
}

//var clientStore = new ClientStore(null)
var oldOpts = new ObjectStore(null)
var newOpts = new ObjectStore(null)
var rwOpts = new ObjectStore(null)

var committed = false
var lastPeriod = ''
var subscriptions = {}


function getId(str) {
var min =10,
  max = 99
  return Math.floor(Math.random()*(max-min+1)+min)
}


/*
var subscribed =
  {
    'balance': false,
    'product': false,
    'quote': false,
    'status': false,
    'strat': false,
    'trades': false,
    'period': false,
    'candle': false,
    'lastTrade':false
  }
*/
//========================
// WebSocket helper functions

// Show help for WS use
function showHelp(issue) {
  var ret = ''
  console.log('\nHelp>' + issue + '<' )
  if (issue === 'help') {
    ret =
      "Usage: [ID] <command> [object] [value]"
      + "\n    who\t(returns client ID)"
      + "\n    id\t(returns client ID)"
      + "\n    <ID> get <object>"
      + "\n    <ID> sub|unsub <event>"
      + "\n    <ID> alarm <alarm> <value>"
      + "\n    <ID> set <option> <value>"
      + "\n    <ID> commit\t(commits changes)"
      + "\n\n  Try \"help\" <get|sub|alarm|set|commit>"
      + "\n\n  The <ID> (IM-client ID) is only used"
      + "\n  when called from a IM client (zenxmpp)"
      + "\n  Remove the <ID> from the command"
      + "\n  when other clients are used"
    return ret
  } else 
    issue = issue.replace(/help /, '')
  if (issue === 'get') {
    ret =
      "<ID> get <object>"
      + "\n  <ID> is the numeric ID"
      + "\n  returned form the <id> command"
      + "\n\n  Objects are:"
      + "\n    options"
      + "\n    balance"
      + "\n    product"
      + "\n    period"
      + "\n    strat"
      + "\n    quote"
      + "\n    status"
      + "\n    trades"
      + "\n    modified"
      + "\n\n  Examples: \"get options\""
      + "\n  IM-client: \"27 get options\""
    return ret
  } else

  if (issue === 'sub' || issue === 'unsub') {
    ret =
      "<ID> sub|unsub <event>"
      + "\n    Events are:"
      + "\n      trades, candles, periods, signals"
      + "\n\n  Example: \"sub candles\""
      + "\n  IM-client: \"27 sub trades\""
    return ret
  } else

  if (issue === 'alarm') {
    ret =
      "<ID> alarm <event> <value>"
      + "\n    Alarms are:"
      + "\n      price_hi, price_lo, rsi_hi, rsi_lo"
      + "\n\n  Example: \"27 alarm rsi_hi 84\""
    return ret
  } else

  if (issue === 'set') {
    ret =
      "<ID> set <option> <value>"
      + "\n    Try \"<ID> get modified\""
      + "\n    to see modifiable options"
      + "\n\n  Example: \"set period 30s\""
      + "\n  IM-client: \"27 set period 2m\""
    return ret
  } else

  if (issue === 'commit') {
    ret =
      "<ID> commit (commit changes done by \"set <option>\")"
    return ret
  } else
    return "No help for the \"" + issue + "\" command"
}

function updateStatus() {
  var stat = {
    "last_period_id": s.last_period_id,
    "orig_capital": s.orig_capital,
    "orig_price": s.orig_price,
    "start_capital": s.start_capital,
    "start_price": s.start_price,
    "trend": s.trend,
    "last_action": s.last_action,
    "last_signal": s.last_signal,
    "acted_on_stop": s.acted_on_stop,
    "acted_on_trend": s.acted_on_trend,
    "cancel_down": s.cancel_down,
    "quote": s.quote
  }
    //if (oldOpts.talkObject.debug) console.log(stat)
    return stat
}

function updateVars(data,newOpt) {
  var oo = oldOpts.talkObject
  var no = newOpts.talkObject
  if (data) { 
    oo = data
  }
  var rwo =
  {
    "mode": { "oldValue": oo.mode, "newValue": no.mode },
    "paper": { "oldValue": oo.paper, "newValue": no.paper },
    "stats": { "oldValue": oo.stats, "newValue": no.stats },
    "order_type": { "oldValue": oo.order_type, "newValue": no.order_type },
    //"reset_profit": { "oldValue": oo.reset_profit, "newValue": no.reset_profit },
    "reset_profit": { "oldValue": oo.reset_profit, "newValue": "Highly experimental!" },
    //"currency_capital": { "oldValue": oo.currency_capital, "newValue": no.currency_capital },
    //"currency_capital": { "oldValue": oo.currency_capital, "newValue": "Only 'set' in paper mode!" },
    //"asset_capital": { "oldValue": oo.asset_capital, "newValue": no.asset_capital },
    //"asset_capital": { "oldValue": oo.asset_capital, "newValue": "Only 'set' in paper mode!" },
    "buy_pct": { "oldValue": oo.buy_pct, "newValue": no.buy_pct },
    "sell_pct": { "oldValue": oo.sell_pct, "newValue": no.sell_pct },
    //"strategy": { "oldValue": oo.strategy, "newValue": no.strategy },
    "strategy": { "oldValue": oo.strategy, "newValue": "Really not recommended to change!" },
    "period":  { "oldValue": oo.period, "newValue": no.period },
    "min_periods": { "oldValue": oo.min_periods, "newValue": no.min_periods },
    "rsi_periods": { "oldValue": oo.rsi_periods, "newValue": no.rsi_periods },
    "overbought_rsi_periods": { "oldValue": oo.overbought_rsi_periods, "newValue": no.overbought_rsi_periods },
    "oversold_rsi_periods": { "oldValue": oo.oversold_rsi_periods, "newValue": no.oversold_rsi_periods },
    "overbought_rsi": { "oldValue": oo.overbought_rsi, "newValue": no.overbought_rsi },
    "oversold_rsi": { "oldValue": oo.oversold_rsi, "newValue": no.oversold_rsi },
    "trend_ema": { "oldValue": oo.trend_ema, "newValue": no.trend_ema },
    "max_slippage": { "oldValue": oo.max_slippage, "newValue": no.max_slippage },
    "neutral_rate": { "oldValue": oo.neutral_rate, "newValue": no.neutral_rate },
    "order_adjust_time": { "oldValue": oo.order_adjust_time, "newValue": no.order_adjust_time },
    "order_poll_time": { "oldValue": oo.order_poll_time, "newValue": no.order_poll_time },
    "poll_trades": { "oldValue": oo.poll_trades, "newValue": no.poll_trades },
    "sell_stop_pct": { "oldValue": oo.sell_stop_pct, "newValue": no.sell_stop_pct },
    "buy_stop_pct": { "oldValue": oo.buy_stop_pct, "newValue": no.buy_stop_pct },
    "profit_stop_enable_pct": { "oldValue": oo.profit_stop_enable_pct, "newValue": no.profit_stop_enable_pct },
    "profit_stop_pct": { "oldValue": oo.profit_stop_pct, "newValue": no.profit_stop_pct },
    "markup_pct": { "oldValue": oo.markup_pct, "newValue": no.markup_pct },
    "max_slippage_pct": { "oldValue": oo.max_slippage_pct, "newValue": no.max_slippage_pct },
    "avg_slippage_pct": { "oldValue": oo.avg_slippage_pct, "newValue": no.avg_slippage_pct },
    //"selector": { "oldValue": oo.selector, "newValue": no.selector },
    //"selector": { "oldValue": oo.selector, "newValue": "RO" },
    "debug": { "oldValue": oo.debug, "newValue": no.debug }
  }
  return rwo
}

function writeOpts (message) {
  var opts = '\n'
  var ov = ''
  var nv = ''
  var pad = 9
  Object.keys(message).forEach(function(key){
    var option = message[key]
    opts += ' '.repeat(24 - key.length) + colors.cyan(key + '  =  ')
    if (option.oldValue === undefined) {
      ov = '    undef'
    } else 
    if (n(option.oldValue) >= 0 || option.oldValue === false) {
      ov = ' '.repeat(pad - option.oldValue.toString().length) + option.oldValue
    } else
      ov = ' '.repeat(pad - option.oldValue.length) + option.oldValue
    opts += colors.green(ov)

    if (option.newValue === undefined) {
      nv = 'undef'
    } else
      nv = option.newValue

    if (option.oldValue === option.newValue) {
      opts += colors.green(' --> ' + nv)
    } else
      opts += colors.red(' ==> ' + nv)

    opts += colors.cyan('\n')
  })
  return opts
}

function setVar(type,message) {
// Set one single "s.options" variable

  var args = message.split(" ",3)
  if (args.length < 3) return "Usage: set <option variable> <value>"
  var cmd = args[0]
  var arg = args[1]
  if (rwOpts.talkObject[arg] == undefined) return "'"+ arg + "' Variable not found"
  var val = args[2]
  if (args[2] === "true") { 
    val = true
  }
  else if (args[2] === "false") { 
    val = false
  }
  else if (!isNaN(Number(args[2]))) { 
    val = Number(args[2])
  } 

  newOpts.talkObject[arg] = val

  rwOpts.talkObject = updateVars(false, newOpts.talkObject)
  //rwOpts.talkObject = updateVars(false, update)
  return type === 'imclient' ? JSON.stringify(rwOpts.talkObject,false,4) : writeOpts(rwOpts.talkObject) 
  //return rwOpts.talkObject
  //return writeOpts(rwOpts.talkObject)
}

// Parse command input from client
function getObject(message, type, beautify) {
// Called from websocket client
  var stat = updateStatus()
  // Global to pick up some variables
  var wsObjects =
    {
      "balance": s.balance,
      "options": s.options,
      "product": s.product,
      "period":s.period,
      "quote": s.quote,
      "strat": s.strategy,
      "trades": s.my_trades,
      "status": stat,
      //"modified": rwOpts.talkObject
//      "subs": subscriptions,
      "modified": updateVars(s.options, newOpts.talkObject)
  }
//console.log('\nsubscriptions: ', subscriptions)

  var args = message.split(" ")
  var cmd = args[0]
  if (cmd === 'commit') { 
    committed = true
    //s.options = newOpts.talkObject
    oldOpts.talkObject = JSON.parse(JSON.stringify(newOpts.talkObject))
    rwOpts.talkObject = updateVars(false, newOpts.talkObject)
    return type === 'imclient' ? JSON.stringify(rwOpts.talkObject,false,4) 
      : "Changes are committed\n" + writeOpts(rwOpts.talkObject)
  }
  if (args.length === 1) 
    return "At least one argument is needed, try <help>"
  var arg = args[1]
  if (arg === 'modified') 
    return  type === 'imclient' ? JSON.stringify(rwOpts.talkObject,false,4) 
      : writeOpts(rwOpts.talkObject)
  if (beautify) {
    return JSON.stringify(wsObjects[arg],false,4)
  } else 
    return JSON.stringify(wsObjects[arg])
}

function subscribe(sub,data) {
  var s = data.split(' ')
  var object = s[1]
  if (s[0] === 'sub') {
    sub[object] = true
  } else {
    sub[object] = false
  }
  return sub 
}

function setAlarm(alm,data) {
  var a = data.split(' ')[1]
  alm[a] = {
    "val": Number(data.split(' ')[2]),
    "active": true
  }
  return alm 
}

var selector = ''
var started = false
var s = false
var returnOpts = {}
var talker = null
var talkerClients = {}

// ci = short for client info
// ci holds all information about the client,
// subscriptions and alarms included
// When the client disconnects
// the ci object gets destroyed
var ci = {} 

exports.update = function (data) {
  if (!started) {
    s = data
    selector = s.selector
    oldOpts.talkObject = s.options
    // Copy old variables to new
    newOpts.talkObject = JSON.parse(JSON.stringify(s.options))
    // What should be returned to zenbot?
    returnOpts.wsTalker = talk()
    // Populate the variables object
    rwOpts.talkObject = updateVars(s.options, newOpts.talkObject)
    started = true
  }

  //=========================================================
  // The websockets interface
  //
  function talk() {
    var clientHeaders = {}
    // clientHeaders holds header information
    // sent from the client
    //WebSocket = require('ws')
    messenger = new WebSocket.Server({ 
      port: talkerPort,
      verifyClient: function(info) {
        clientHeaders.wsKey = info.req.headers['sec-websocket-key']
        clientHeaders.fd = info.req.socket._handle.fd
        clientHeaders.clientHost = info.req.headers['host']
        clientHeaders.clientPid = info.req.headers['clientpid']
        clientHeaders.clientName = info.req.headers['clientname']
        clientHeaders.clientType = info.req.headers['clienttype']
        clientHeaders.clientid = info.req.headers['clientid']
        return true    
      }
    }, function listening() {
      console.log('Zen master is talking to you on port ' + talkerPort)
    })

    messenger.on('connection', function(newClient) {
      talker = newClient
      const wsKey = clientHeaders.wsKey
      const wsNam = clientHeaders.clientName
      const wsTyp = clientHeaders.clientType
      const cid = clientHeaders.clientid
      ci[clientHeaders.wsKey] = {}
      ci[clientHeaders.wsKey].talker = talker
      ci[clientHeaders.wsKey].subs = {}

      if (oldOpts.talkObject.debug) 
        console.log('\nTalker connected to '+ wsNam + ' ' + wsTyp + ' ' + cid + ' ' + wsKey)
      //ci[cli].talker.send('Hvem i helvete er du?')
      talker.on('error', function error(code, description) {
        console.log(code + (description ? ' ' + description : ''))
      }).on('message', function message(data) {
      //  setTimeout(() => {
        var d = JSON.parse(data)
        var cli = d.client
        var message = d.msg.toLowerCase().replace(/\s\s*$/, '').replace(/^\s\s*/, '').replace(/\s+/g, ' ')
        //message.replace(/^\s/, '')
        //message.replace(/\s$/, '')
        if (oldOpts.talkObject.debug) 
            console.log('\nMessage from client ' + wsNam + ' ' + cid + ' ' + cli +'\n',data)
        if (message.match(/closing/)) {
            // remove Subscriptions and alarms
            delete ci[cli].subs
        } else {
          var id = 0
          var msg = ''
          //if (message.match(/\:/)) {
          if (message.match(/^[0-9]+/)) {
            id = message.split(' ')[0]
            msg = message.replace(/^[0-9]+ /, '')
            //} else
          }  else {
              msg = message 
          }
          if (wsTyp !== 'imclient' || id === cid) {
            if (msg.match(/^help/)) {
              ci[cli].talker.send(showHelp(msg))
            } else
            if (msg.match(/^sub/)) {
              ci[cli].subs = subscribe(ci[cli].subs,msg)
            } else
            if(msg.match(/^alarm/)) {
              ci[cli].subs = setAlarm(ci[cli].subs,msg)
            } else
            if (msg.match(/^get|^show|^commit/)) {
              msg = getObject(msg, wsTyp, true)
              ci[cli].talker.send(msg)
            } else
            if (msg.match(/^set/)) {
              msg = setVar(wsTyp, msg)
              ci[cli].talker.send(msg)
            } //else
            //if (msg !== '') {
              //ci[cli].talker.send('Unknown command ',msg)
            //}
          }
          if (msg === 'who') {
            cid == undefined ? ci[cli].talker.send(`${oldOpts.talkObject.selector}`)
              : ci[cli].talker.send(`${cid} ${oldOpts.talkObject.selector}`)
            //ci[cli].talker.send('Hvem i helvete er du?')
          } else
          if (msg === 'id') {
            ci[cli].talker.send(`${cid} ${oldOpts.talkObject.selector} connected`)
            //ci[cli].talker.send(JSON.stringify({"msg": cid + ' ' + oldOpts.talkObject.selector}))
          } //else
          //if (msg !== '' && id !== cid) {
          //  ci[cli].talker.send('Unknown command: ',msg)
          //}
        }
      }).on('close', function close() {
        setTimeout(() => {
          if (oldOpts.talkObject.debug) 
            console.log('\nTalker is disconnected from ' + wsNam + ' ' + cid + ' ' + wsKey)
            clientHeaders = {}
            delete ci[wsKey]
            talker = null
        }, 100)
      })
    }).on('error', function serverError(error) {
      console.log(error.message)
      process.exit(-1)
    })

    wsTalker = new emitter()
    wsTalker.on('period', function transmit(data) {
      //if (talker) {
        setTimeout(() => {
          Object.keys(ci).forEach(function(wsKey) {
            if (ci[wsKey].subs.periods) {
              ci[wsKey].talker.send(JSON.stringify({"period": JSON.parse(data)}))
            } else
            if (ci[wsKey].subs.candles) {
              var can = JSON.parse(data)
              var candle = {"candle": {
                time: can.sime,
                open: can.open,
                high: can.high,
                low: can.low,
                close: can.close,
                volume: can.volume
              }}
              ci[wsKey].talker.send(JSON.stringify(candle))
            }
          })
        }, 100)
      //}
    })

    wsTalker.on('alarms', function transmit(data) {
        var alarm = JSON.parse(data)
        Object.keys(ci).forEach(function(wsKey) {

        if (ci[wsKey].subs.price_hi) {
          if (alarm.close > ci[wsKey].subs.price_hi.val) {
            if (ci[wsKey].subs.price_hi.active) {
              var msg = `Alert! Price is up on ${oldOpts.talkObject.selector}.` + '\n' + `Last price is ${alarm.close}`
              ci[wsKey].talker.send(JSON.stringify({"alarm": msg}))
              ci[wsKey].subs.price_hi.active = false
            } 
          }
          // Alarm reset 1% threshold
          if (alarm.close < ci[wsKey].subs.price_hi.val * 0.99) 
            ci[wsKey].subs.price_hi.active = true
        }

        if (ci[wsKey].subs.price_lo) {
          if (alarm.close < ci[wsKey].subs.price_lo.val) {
            if (ci[wsKey].subs.price_lo.active) {
              var msg = `Alert! Price is down on ${oldOpts.talkObject.selector}.` + '\n' + `Last price is ${alarm.close}`
              ci[wsKey].talker.send(JSON.stringify({"alarm": msg}))
              ci[wsKey].subs.price_lo.active = false
            }
          }
          // Alarm reset 1% threshold
          if (alarm.close > ci[wsKey].subs.price_lo.val * 1.01) 
            ci[wsKey].subs.price_lo.active = true
        }

        if (ci[wsKey].subs.rsi_hi) {
          if (alarm.rsi > ci[wsKey].subs.rsi_hi.val) {
            if (ci[wsKey].subs.rsi_hi.active) {
              var msg = `Alert! RSI is up on ${oldOpts.talkObject.selector}.` + '\n' + `Last RSI is ${alarm.rsi}`
              ci[wsKey].talker.send(JSON.stringify({"alarm": msg}))
              ci[wsKey].subs.rsi_hi.active = false
            }
          }
          // Alarm reset threshold
          if (alarm.rsi < ci[wsKey].subs.rsi_hi.val - 2) 
            ci[wsKey].subs.rsi_hi.active = true
        }

        if (ci[wsKey].subs.rsi_lo) {
          if (alarm.rsi < ci[wsKey].subs.rsi_lo.val) {
            if (ci[wsKey].subs.rsi_lo.active) {
              var msg = `Alert! RSI is down on ${oldOpts.talkObject.selector}.` + '\n' + `Last RSI is ${alarm.rsi}`
              ci[wsKey].talker.send(JSON.stringify({"alarm": msg}))
              ci[wsKey].subs.rsi_lo.active = false
            }
          }
          // Alarm reset threshold
          if (alarm.rsi > ci[wsKey].subs.rsi_lo.val + 2) 
            ci[wsKey].subs.rsi_lo.active = true
        }
        if (oldOpts.talkObject.debug) 
          console.log('\nClient: ' + wsKey + '\n', ci[wsKey].subs)
      })
    })

    wsTalker.on('trade', function transmit(data) {
      //if (talker) {
        var tr = JSON.parse(data)
        tr.selector = s.selector
        var msg = JSON.stringify({"trade": tr})
        Object.keys(ci).forEach(function(wsKey) {
          if (ci[wsKey].subs.trades || ci[wsKey].subs.lastTrade)
            ci[wsKey].talker.send(msg)
        })
      //}
    })

    wsTalker.on('signal', function transmit(data) {
      //if (talker) {
        Object.keys(ci).forEach(function(wsKey) {
          if (ci[wsKey].subs.signals)
            ci[wsKey].talker.send(data)
        })
      //}
    })

    wsTalker.on('close', function close() {
      //if (talker) talker.close()
        process.exit(0)
    })
    return wsTalker
  }
  if (committed) {
    s.options = JSON.parse(JSON.stringify(oldOpts.talkObject)) 
    committed = false
  }
  returnOpts.s = s
  return returnOpts
}

