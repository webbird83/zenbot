
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


class Clients {
  constructor() {
    this.clientList = {}
    //this.saveClient = this saveClient.bind(this)
    this.saveClient = saveClient.bind(this)
  }
  saveClient(clientKey, client) {
    this.clientList[clientKey] = client
  }
  deleteClient(clientKey) {
    delete this.clientList[clientKey]
  }
  getSubscription(clientKey,subscription) {
    //return this.clientList[clientKey].subs.subscription ? true : false
    return true
  }
}

class ObjectStore {
  constructor(talkObject) {
    this.objectStore = talkObject
  }
  get objectStore() {
    return this.objectStore
  }
  set objectStore(talkObject) {
    this.objectstore = talkObject
  }
}

var oldOpts = new ObjectStore(null)
var newOpts = new ObjectStore(null)
var rwOpts = new ObjectStore(null)

var committed = false
var lastPeriod = ''
var subscribed =
  {
    'balance': false,
    'product': false,
    'quote': false,
    'status': false,
    'strat': false,
    'trades': false,
    'period': false,
    'lastTrade':false
  }

//========================
// WebSocket helper functions

// Show help for WS use
function showHelp(issue) {
  var wsObjects =
    "\n    Objects are:"
      + "\n\twho"
      + "\n\toptions"
      + "\n\tbalance"
      + "\n\tproduct"
      + "\n\tperiod"
      + "\n\tstrat"
      + "\n\tquote"
      + "\n\tstatus"
      + "\n\ttrades"
      + "\n\tmodified (inspect the changes before \"<commit>\")"
      + "\n\n    set <option> (use \"get options\" to see the options)"
      + "\n\n    commit (commit changes done by \"set <option>\")"

  return 'Usage: get <object>' + wsObjects
}

function updateStatus() {
  var stat = {
    "last_period_id": s.last_period_id,
    "orig_capital": s.orig_capital,
    "orig_price": s.orig_price,
    "start_capital": s.start_capital,
    "start_price": s.start_price,
    "trend": s.trend,
    "action": s.action,
    "signal": s.signal,
    "last_signal": s.last_signal,
    "acted_on_stop": s.acted_on_stop,
    "acted_on_trend": s.acted_on_trend,
    "cancel_down": s.cancel_down,
    "quote": s.quote
  }
    //if (oldOpts.talkObject.debug) console.log(stat)
    return stat
}

//function updateVars(data,no) {
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
    "currency_capital": { "oldValue": oo.currency_capital, "newValue": "Only 'set' in paper mode!" },
    //"asset_capital": { "oldValue": oo.asset_capital, "newValue": no.asset_capital },
    "asset_capital": { "oldValue": oo.asset_capital, "newValue": "Only 'set' in paper mode!" },
    "buy_pct": { "oldValue": oo.buy_pct, "newValue": no.buy_pct },
    "sell_pct": { "oldValue": oo.sell_pct, "newValue": no.sell_pct },
    //"strategy": { "oldValue": oo.strategy, "newValue": no.strategy },
    "strategy": { "oldValue": oo.strategy, "newValue": "Really not recommended to change!" },
    "period":  { "oldValue": oo.period, "newValue": no.period },
    "min_periods": { "oldValue": oo.min_periods, "newValue": no.min_periods },
    "rsi_periods": { "oldValue": oo.rsi_periods, "newValue": no.rsi_periods },
    "oversold_rsi_periods": { "oldValue": oo.oversold_rsi_periods, "newValue": no.oversold_rsi_periods },
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

function setVar(message) {
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
  return writeOpts(rwOpts.talkObject)
}

// Parse command input from client
function getObject(beautify,message) {
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
      "modified": updateVars(s.options, newOpts.talkObject)
  }

  var args = message.split(" ")
  var cmd = args[0]
  if (cmd === 'commit') { 
    committed = true
    //s.options = newOpts.talkObject
    oldOpts.talkObject = newOpts.talkObject
    rwOpts.talkObject = updateVars(false, newOpts.talkObject)
    return "Changes are committed\n" + writeOpts(rwOpts.talkObject)
  }
  if (args.length === 1) return "At least one argument is needed, try <help>"
  var arg = args[1]
  if (arg === 'modified') return writeOpts(rwOpts.talkObject)
  if (beautify) { return JSON.stringify(wsObjects[arg],false,4)
  } else return JSON.stringify(wsObjects[arg])
}

function subscribe(sub,data) {
  var s = data.split(' ')
  subscription = s[1]
  if (s[0] === 'sub') {
    sub[subscription] = true
  } else {
    sub[subscription] = false
  }
  return sub
}

var started = false
var s = false
var returnOpts = {}

var talker = null
var countT = 0
var talkerClients = {}

exports.update = function (data) {
  if (!started) {
    s = data
    oldOpts.talkObject = s.options
    Object.freeze(oldOpts)
    // Copy old variables to new
    newOpts.talkObject = s.options
    // What should be returned to zenbot?
    returnOpts.wsTalker = talk()
    // Populate the variables object
    rwOpts.talkObject = updateVars(s.options, newOpts.talkObject)
    started = true
  }
  returnOpts.subscribed = subscribed
  returnOpts.lastPeriod = lastPeriod

//console.log(s)
  //=========================================================
  // The websockets interface
  //
  function talk(something) {
    var clientInfo = {}
    talkerWS = require('ws')
    messenger = new talkerWS.Server({ 
      port: talkerPort,
      verifyClient: function(info) {
        clientInfo.wsKey = info.req.headers['sec-websocket-key']
        clientInfo.fd = info.req.socket._handle.fd
        clientInfo.host = info.req.headers['host']
        return true    
      }
    }, function listening() {
      console.log('Zen master is talking to you on port ' + talkerPort)
    })

    wsTalker = new emitter()
    wsTalker.on('transmit', function transmit(data) {
      if (talker) {
        talker.send(data)
      }
    })

    wsTalker.on('close', function close() {
      if (talker) talker.close()
        process.exit(0)
    })

    messenger.on('connection', function(newClient) {
      //if (talker) return newClient.terminate()
      talker = newClient
      clientInfo.id = talker._ultron.id
talker.clientInfo = clientInfo
      talkerClients[talker.clientInfo] = clientInfo     
//console.log('\nClients\n',talkerClients)

      if (oldOpts.talkObject.debug) console.log('\nTalker connected to ',countT + ' listener(s)')
      talker.on('close', function close() {
        if (oldOpts.talkObject.debug) console.log('\nTalker #', countT + ' is disconnected')
        //!!delete talkerClients[talker.clientId]
        delete talkerClients[talker.clientInfo]
//console.log('\nClients\n',talkerClients)
        talker = null
        //countT--
      }).on('error', function error(code, description) {
        console.log(code + (description ? ' ' + description : ''))

      }).on('message', function message(data) {
        //if (oldOpts.talkObject.debug) console.log('Talker #' + countT + ' is talking ',data)

        if(data.toLowerCase().match(/sub/)) {
          //talker.subscribed = subscribe(talker.subscribed,data)
          subscribed = subscribe(subscribed,data)
        } else

        if (data === 'who') {
          talker.send(s.options.selector)
        } else

        if (data.match(/get|show|commit/)) {
          msg = getObject(true,data)
            talker.send(msg)
        } else
        
        if (data.match(/set/)) {
          msg = setVar(data)
          talker.send(msg)
        } else

        if (data.toLowerCase().match(/help/)) {
          talker.send(showHelp())
        } else

        if (data !== '') {
          talker.send('Unknown command: ',data)
        }

        talker.emit(data)
      })
    }).on('error', function serverError(error) {
      console.log(error.message)
      process.exit(-1)
    })
    return wsTalker
  }
  if (committed) {
    s.options = newOpts.talkObject
    //committed = false
  }
  returnOpts.s = s
  return returnOpts
}

