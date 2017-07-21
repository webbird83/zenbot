## The Zentalk Concept

**Zentalk** is a small set of programs that makes it easy to monitor and make use data from Zenbot without interupting its operation.
Most notably this is the start options, trades, periods and a lot more. The most important parts are the **talker** program
that enables *websockets* (*WS*) on **Zenbot** and some client programs to make use of the data from **Zenbot**.
The two programs are **zentalk**, **zenmailer**, **zenxmpp* and **zenout**. The first one is a fullblown *websocket* CLI program to inspect the data from **Zenbot**.
The other programs are lightweight *websocket* streaming clients which can *subscribe* to data objects from **Zenbot** 
for use in other programs.  With **zenout** as an example one can do some simple node programming to use the output as anything thinkable.
Here are some examples:

 - a *messaging bot* which can send trading events
 - write data that later can be used for statistics or graphing
 - producing data for a web front end
 - and a lot of other stuff

In the **zenmailer** and **zenxmpp** program, the commenting shows how to implement other types of messaging 
(or other functions)


### talker

The **talker** program is a leightweight *websocket server* loosely connected to **Zenbot**.
Some small modifications are necessary to the **lib/engine.js** program to get useful data from the system.
The modifications are kept small to get a slim footprint into the program.

A pair of ports are used, one listener port for **zentalk** and one talking (output) port for the
**zenout**, **zenmailer** and **xenxmpp** programs
The ports are automatically selected from free ports in a short range of ports, currently 3000 to 3020.
By editing *conf.js* it is possible to modify the range to something more suitable.
**Zentalk** is announcing the ports like this when you start the bot:
```
Zen master is talking to you on port 3000
Zen master is listening to you on port  3001
```
To invoke the programs with a command like this (the example is for zenmailer):
```
./zenmailer.js -c localhost:3000
```
If you open the required ports on the firewall you can also run the utilities from a remote location,
either from outside or from your local network. Then you need to use the ip address of your **Zenbot**
installation. Obviously you also need to copy the **Zentalker** programs and configuration/template 
files to your local computer. Then the invokation will be like this:
```
./zenmailer.js -c <ip_address_of_your_remote_server:remote_port>
```

### zentalk

The **zentalk** program connects to a TCP port has a comand line interface with a few simple commands to control its operation.
It has a help command to show the available commands. The help command gives this output:
```
> help
  Usage: get <object>
    Objects are:
        who
        balance
        product
        period
        strat
        quote
        status
        trades
        modified (inspect the changes before "<commit>")

    set <option> (use "get options" to see the options)

    commit (commit changes done by "set <option>")
```
The data is delevered as beautified *JSON* data. Here are a some examples:
```
> get options
  {
    "paper": true,
    "strategy": "trend_ema",
    "reset_profit": true,
    "sell_stop_pct": 0,
    "buy_stop_pct": 0,
    "profit_stop_enable_pct": 0,
    "profit_stop_pct": 1,
    "max_slippage_pct": 5,
    "buy_pct": 99,
    "sell_pct": 99,
    "order_adjust_time": 30000,
    "max_sell_loss_pct": 25,
    "order_poll_time": 5000,
    "markup_pct": 0,
    "order_type": "maker",
    "poll_trades": 30000,
    "currency_capital": 1000,
    "asset_capital": 0,
    "rsi_periods": 14,
    "avg_slippage_pct": 0.045,
    "stats": true,
    "mode": "paper",
    "selector": "bitfinex.XRP-USD",
    "period": "2m",
    "min_periods": 52,
    "trend_ema": 26,
    "neutral_rate": "auto",
    "oversold_rsi_periods": 14,
    "oversold_rsi": 10
}
> get period
  {
    "period_id": "2m12490313",                                           
    "size": "2m",                                                        
    "time": 1498837560000,                                               
    "open": 0.255,                                                       
    "high": 0.25502,                                                     
    "low": 0.255,                                                        
    "close": 0.25502,                                                    
    "volume": 3160.1400000000003,                                        
    "close_time": 1498837618000,                                         
    "trend_ema": 0.25246624412245805,                                    
    "oversold_rsi_avg_gain": 0.00038205180780631186,                     
    "oversold_rsi_avg_loss": 0.00018113157638666248,                     
    "oversold_rsi": 68,                                                  
    "trend_ema_rate": 0.08098743204999516,                               
    "trend_ema_stddev": 0.016211589445806786,                            
    "id": "ff7f935e",                                                    
    "selector": "bitfinex.XRP-USD",                                      
    "session_id": "51b6adf3",                                            
    "rsi_avg_gain": 0.00038205180780631186,                              
    "rsi_avg_loss": 0.00018113157638666248,                              
    "rsi": 68                                                            
} 
> get balance
  {
    "asset": "3901.42011835",                                            
    "currency": "11.11735266"                                            
} 
> get trades
  [
    {
        "time": 1498836575000,
        "execution_time": 61000,
        "slippage": 0.0004499802449624344,
        "type": "buy",
        "size": "3911.49743185",
        "fee": 3.90532544379,
        "price": "0.25321389",
        "order_type": "maker",
        "id": "74db29b9",
        "selector": "bitfinex.XRP-USD",
        "session_id": "51b6adf3",
        "mode": "paper"
    }
]
>
```
Before you use the *set* command, it is wise to perform a *get options* command to see which options are used.
For each option you change, you will see the old and new values like this. The *undef* values simply means that
the option is not used for the running strategy.
```
> set period 10m

                   paper  =   true  -->  true
               trend_ema  =  undef  -->  undef
                  period  =     1m  -->  10m
            max_slippage  =  undef  -->  undef
       order_adjust_time  =  30000  -->  30000
     oversold_rsi_period  =  undef  -->  undef
            oversold_rsi  =  undef  -->  undef
       max_sell_loss_pct  =     25  -->  10
            reset_profit  =  undef  -->  Highly experimental!
                strategy  =  speed  -->  Really not recommended to change!
           sell_stop_pct  =  undef  -->  14
            buy_stop_pct  =      0  -->  0
  profit_stop_enable_pct  =      0  -->  0
         profit_stop_pct  =      1  -->  1
        max_slippage_pct  =      5  -->  5
                 buy_pct  =     99  -->  50
                sell_pct  =     99  -->  50
         order_poll_time  =   5000  -->  3600
              markup_pct  =      0  -->  0
              order_type  =  maker  -->  taker
             poll_trades  =  24000  -->  24000
        currency_capital  =    400  -->  Only 'set' in paper mode!
           asset_capital  =      0  -->  Only 'set' in paper mode!
             rsi_periods  =     14  -->  14
        avg_slippage_pct  =  0.045  -->  0.045
                   stats  =   true  -->  true
                    mode  =  paper  -->  paper
             min_periods  =   3000  -->  3000
            neutral_rate  =  undef  -->  undef
                   debug  =  undef  -->  undef
```  
Be aware that different strategies 
have different options. Not all options are visible. That is part on purpose and part on availability.

For the **zentalk** program, you need to use the listener port.
When you start **Zenbot**, you will see the port anounced like this:
```
Zen master is talking to you on port 3000
Zen master is listening to you on port  3001
```

To invoke the programs, a command like this is used:
```
./zentalk.js -c localhost:3001
```
The programs can also be used from a remote location like this:
```
./zentalk.js -c <your_remote_zentalk_ip_or_host_name:remote_port>
```
Be aware that you need to open the actual port on the firewall.

### zenout

Basicly the **zenout** program delivers the same data as the **zentalk** program.
The difference is the invocation but the the output *raw JSON* makes it more usable
for other programs outside of **Zenbot**. The output goes to *stdout*.
It is invoked from the command line with *host:port* as parameters.
```
$ ./zenout.js -c localhost:3001
```
However, to get something useful from the progran you need to subscribe to data
```
$ ./zenout.js -c localhost:3000 --sub lastTrade
```
With this option you will get the last trade from *Zenbot*.
It is possible to stop the client and start it again without losing the subscription, meaning you can start it without a new subscription.
If you want to get another set of data, it is wise to unsubscribe the previous subscription. This can be done in one operation.
```
./zenout.js -c localhost:3001 --unsub lastTrade --sub period
```
The programs can also be used from a remote location like this:
```
./zenout.js -c <your_remote_zentalk_ip_or_host_name:remote_port>
```
Be aware that you need to open the actual port on the firewall.

### zenmailer and zenxmpp

As the names imply, these programs deliver messages when interesting events occur. In this version the programs
deliver trades with the trade specific data. A template file, ./templates/zenmailer.tpl is provided. 
This template file has sections for plain text and HTML. For the *zenmailer.js* both the plain and HTML text are used.
The template delivers messages with simple formatting. The template is ease to customize for more sexy messages

Before using the programs, the configuration files *conf-zenmailer.js* and *conf-zenxmpp.js* 
have to be edited with your preferences.

To use the programs, you need to connect to **Zenbot**. 
When you start **Zenbot**, you will see this message:
```
Zen master is talking to you on port 3000
Zen master is listening to you on port  3001
```
For the **zenmailer** and **zenxmpp**, you need to use the talking port. 
To invoke the programs, a command like this is used:
```
./zenmailer.js -c localhost:3000
```
The programs can also be used from a remote location like this:
```
./zenmailer.js -c <your_remote_zentalk_ip_or_host_name:remote_port>
```
Be aware that you need to open the actual port on the firewall.

### Final words

These utilities are still in an early stage of development. The same warings that is given for **Zentalk**
also applies to **The Zentalker Concept**. The listening utilities are quite safe. These only distributes
data from **Zenbot**. The **zentalker** to the contrary, is able to change options that **Zenbot** operates with.
That is also the purpose of the program. **You are warned!**
