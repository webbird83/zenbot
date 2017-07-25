
// Websockets additions
var   EventEmitter = require('events').EventEmitter

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


var lastPeriod = ''
var subscribed =
  {
    'balance': false,
    'product': false,
    'period': false,
    'quote': false,
    'status': false,
    'strat': false,
    'trades': false,
    'lastTrade':false
  }


//========================
// WebSocket helper functions

// Show help for WS use
function showHelp(issue) {
  var wsObjects =
    "\n    Objects are:"
      + "\n\twho"
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

function runStatus() {
  var stat = {
    "last_period_id": s.last_period_id,
    "acted_on_stop": s.acted_on_stop,
    "action": s.action,
    "signal": s.signal,
    "acted_on_trend": s.acted_on_trend,
    "trend": s.trend,
    "cancel_down": s.cancel_down,
    "orig_capital": s.orig_capital,
    "orig_price": s.orig_price,
    "start_capital": s.start_capital,
    "start_price": s.start_price,
    "last_signal": s.last_signal,
    "quote": s.quote
  }
    //if (so.debug) console.log(stat)
    return stat
}

function subscribe(data) {
  var s = data.split(' ')
  sub = s[1]
  if (s[0] === 'sub') {
    subscribed[sub] = true
  } else {
    subscribed[sub] = false
  }
}

// Parse command input from client
function getObject(beautify,message) {
  var stat = runStatus()
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
      "modified": rwOptions
  }

  var args = message.split(" ")
  var cmd = args[0]
  if (cmd === 'commit') { 
    committed = true
    oo = no
    initVars()
    return "Changes are committed"
  }
  if (args.length === 1) return "At least one argument is needed, try <help>"
  var arg = args[1]
  if (arg === 'modified') return writeOpts(rwOptions)
  if (beautify) return JSON.stringify(wsObjects[arg],false,4)
  return JSON.stringify(wsObjects[arg])
}

var started = false
var committed = false
var s = false
var rwOptions = {}
var oo = {}
var no = {}

function initVars() {
  var rwOpts =
  {
    "paper": { "oldValue": oo.paper, "newValue": no.paper },
    "trend_ema": { "oldValue": oo.trend_ema, "newValue": no.trend_ema },
    "period":  { "oldValue": oo.period, "newValue": no.period },
    "max_slippage": { "oldValue": oo.max_slippage, "newValue": no.max_slippage },
    "order_adjust_time": { "oldValue": oo.order_adjust_time, "newValue": no.order_adjust_time },
    "oversold_rsi_period": { "oldValue": oo.oversold_rsi_period, "newValue": no.oversold_rsi_period },
    "oversold_rsi": { "oldValue": oo.oversold_rsi, "newValue": no.oversold_rsi },
    "max_sell_loss_pct": { "oldValue": oo.max_sell_loss_pct, "newValue": no.max_sell_loss_pct },
    //"reset_profit": { "oldValue": oo.reset_profit, "newValue": no.reset_profit },
    "reset_profit": { "oldValue": oo.reset_profit, "newValue": "Highly experimental!" },
    //"strategy": { "oldValue": oo.strategy, "newValue": no.strategy },
    "strategy": { "oldValue": oo.strategy, "newValue": "Really not recommended to change!" },
    "sell_stop_pct": { "oldValue": oo.sell_stop_pct, "newValue": no.sell_stop_pct },
    "buy_stop_pct": { "oldValue": oo.buy_stop_pct, "newValue": no.buy_stop_pct },
    "profit_stop_enable_pct": { "oldValue": oo.profit_stop_enable_pct, "newValue": no.profit_stop_enable_pct },
    "profit_stop_pct": { "oldValue": oo.profit_stop_pct, "newValue": no.profit_stop_pct },
    "max_slippage_pct": { "oldValue": oo.max_slippage_pct, "newValue": no.max_slippage_pct },
    "buy_pct": { "oldValue": oo.buy_pct, "newValue": no.buy_pct },
    "sell_pct": { "oldValue": oo.sell_pct, "newValue": no.sell_pct },
    "order_poll_time": { "oldValue": oo.order_poll_time, "newValue": no.order_poll_time },
    "markup_pct": { "oldValue": oo.markup_pct, "newValue": no.markup_pct },
    "order_type": { "oldValue": oo.order_type, "newValue": no.order_type },
    "poll_trades": { "oldValue": oo.poll_trades, "newValue": no.poll_trades },
    //"currency_capital": { "oldValue": oo.currency_capital, "newValue": no.currency_capital },
    "currency_capital": { "oldValue": oo.currency_capital, "newValue": "Only 'set' in paper mode!" },
    //"asset_capital": { "oldValue": oo.asset_capital, "newValue": no.asset_capital },
    "asset_capital": { "oldValue": oo.asset_capital, "newValue": "Only 'set' in paper mode!" },
    "rsi_periods": { "oldValue": oo.rsi_periods, "newValue": no.rsi_periods },
    "avg_slippage_pct": { "oldValue": oo.avg_slippage_pct, "newValue": no.avg_slippage_pct },
    "stats": { "oldValue": oo.stats, "newValue": no.stats },
    "mode": { "oldValue": oo.mode, "newValue": no.mode },
    //"selector": { "oldValue": oo.selector, "newValue": no.selector },
    //"selector": { "oldValue": oo.selector, "newValue": "RO" },
    "min_periods": { "oldValue": oo.min_periods, "newValue": no.min_periods },
    "neutral_rate": { "oldValue": oo.neutral_rate, "newValue": no.neutral_rate },
    "debug": { "oldValue": oo.debug, "newValue": no.debug }
  }
  return rwOpts
}

function writeOpts (message) {
  var opts = '\n'
  var ov = ''
  var nv = ''
  Object.keys(message).forEach(function(key){
    var func = message[key]
    opts += ' '.repeat(24 - key.length) + colors.blue(key + '  =  ')
    if (func.oldValue === undefined) { 
      ov = '    undef'
    } else if (n(func.oldValue) >= 0) {
      ov = ' '.repeat(9 - func.oldValue.toString().length) + func.oldValue
      //ov = z(9, func.oldValue, ' ')
    } else
      ov = ' '.repeat(9 - func.oldValue.length) + func.oldValue 
    opts += colors.green(ov)

    if (func.newValue === undefined) {
      nv = 'undef'
    } else
      nv = func.newValue

    if (func.oldValue === func.newValue) {
      opts += colors.green(' --> ' + nv)
    } else
      opts += colors.red(' ==> ' + nv)

    opts += colors.blue('\n')
  })
  return opts
}

function setVar(message) {
  //console.log(rwOptions)
  
  var args = message.split(" ",3)
  if (args.length < 3) return "Usage: set <option variable> <value>"
  var cmd = args[0]
  var arg = args[1]
  if (rwOptions[arg] == undefined) return "'"+ arg + "' Variable not found"
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
  no[arg] = val
  rwOptions[arg]['newValue'] = val
  committed = false
  return writeOpts(rwOptions)
  //return JSON.stringify(rwOptions,false,4)
}

//var talker = null
//var commander = null
var countC = 0
var countT = 0
var commanderClients = {}
var talkerClients = {}
var curTalker = {}
var curCommander = {}
var ret = {}
var command = []

var commanderPort = 0
var talkerPort = 0

port.find( c.talker_port_range ).then(function(ports){
  talkerPort = ports[0]
  commanderPort =  ports[1]
})

exports.update = function (data) {
  s = data
  var so = s.options
  oo = so
  if (!started) {
    no = so
    ret.wsTalker = talk(so)
    ret.wsCommand = command(so)
    started = true
  }
  rwOptions = initVars()

  ret.subscribed = subscribed
  ret.lastPeriod = lastPeriod

//console.log(s)
  //=========================================================
  // The wsCommand sends objets whatever subscriber asks for
  //

  function  command(something) {
    // Interactively get and set objects and variables
    var clientInfo = {}
    clientInfo.cli = {}
    clientInfo.con = {}
    cWS = require('ws')
    command = new cWS.Server({ 
      port: commanderPort,
      verifyClient: function(info) {
        clientInfo.cli.wsKey = info.req.headers['sec-websocket-key']
        clientInfo.cli.fd = info.req.socket._handle.fd
        clientInfo.cli.host = info.req.headers['host']
        return true    
      }
    }, function listening() {
      console.log('Zen master is listening to you on port ', commanderPort )
    })
    
    wsCommand = new emitter()

    wsCommand.on('transmit', function transmit(data) {
      if (commander) {
        commander.send(data)
      }
    })

    wsCommand.on('close', function close(data) {
      if (commander) commander.close()
      process.exit(0)
    })


    command.on('connection', function(newClient) {
      //if (talker) return newClient.terminate()
      //clientInfo.client = newClient
      var commander = newClient
      commander.clientId = countC++
    //commander.clientIid.wsKey = clientInfo
      commanderClients[commander.clientId] = commander     
      clientInfo.con.fd = commander._socket._handle.fd
      clientInfo.con.id = commander._ultron.id
      clientInfo.con.number = countC
//console.log('commanderClients ' + countC + ' ',commanderClients[commander.clientId])
      if (so.debug) console.log('\nCommander #', countC + ' is connected')
      commander.on('close', function close() {
        if (so.debug) console.log('\nCommander #', countC + ' is disconnected')
//console.log('commanderClients ' + countC + ' ',commanderClients[commander.clientId])
//console.log('Commander ==================', commander)
        delete commanderClients[commander.clientId]
        commander = null
        //countC--
      }).on('error', function error(code, description) {
        console.log(code + (description ? ' ' + description : ''))
      }).on('message', function message(data) {
        if (so.debug) console.log('Commander #' + countC + ' is talking ',data)
        if (data.match(/get|show|commit/)) {
          msg = getObject(true,data)
            commander.send(msg)
        } else if (data.toLowerCase().match(/help/)) {
          msg = showHelp()
          commander.send(msg)
        } else if (data.match(/set/)) {
          commander.send(setVar(data))
        } else if (data === 'who') {
          commander.send(s.options.selector)
        } else if (data !== '') commander.send('Unknown command: ',data)
        // Does echo data
        //commander.send('==> ' + data)
        //commander.send(data)
      })
    }).on('error', function serverError(error) {
      console.log(error.message)
      process.exit(-1)
    })
    return wsCommand
  }

  //=========================================================
  // The wsTalker sends subscribed objets to *engine.js*
  //
  function talk(something) {


    var tWS = require('ws')
    var messenger = new tWS.Server({ 
      port: talkerPort,
      verifyClient: function(info) {
        //clientInfo.cli.wsKey = info.req.headers['sec-websocket-key']
        //clientInfo.cli.fd = info.req.socket._handle.fd
        //clientInfo.cli.host = info.req.headers['host']
        return true    
      }
    }, function listening() {
      console.log('Zen master is talking to you on port ' + talkerPort)
    })

    wsTalker = new emitter()
//console.log('wsTalker: ', wsTalker)
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
      var talker = newClient
      talker.clientId = countC++
      talkerClients[talker.clientId] = talker     
      countT++
      if (so.debug) console.log('\nTalker connected to ',countT + ' listener(s)')
      talker.on('close', function close() {
        if (so.debug) console.log('\nTalker #', countT + ' is disconnected')
        delete talkerClients[talker.clientId]
        talker = null
        //countT--
      }).on('error', function error(code, description) {
        console.log(code + (description ? ' ' + description : ''))
      }).on('message', function message(data) {
        if (so.debug) console.log('Talker #' + countT + ' is talking ',data)
        if(data.toLowerCase().match(/sub/)) {
          subscribe(data)
        }
        // Does not echo data
        talker.emit(data)
      })
    }).on('error', function serverError(error) {
      console.log(error.message)
      process.exit(-1)
    })
    return wsTalker
  }
  if (committed) { 
    s.options = no
    committed = true
  }
  ret.s = s
  return ret
}

