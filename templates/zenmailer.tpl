exports.template = function (trade) {
  var template = {}

  // Template for message subject
  template.subject = 'Zenbot did a "'
    + trade.order_type + '" '
    + trade.type + ' order on '
    + trade.exchange

  // Returns message body in HTML format
  template.html =
    '<b>Zenbot has done a "' + trade.order_type + '" ' 
    + trade.type + ' on ' 
    + trade.exchange + '</b><br />'
    + 'Trading pair: ' + trade.pair + '<br />'
    + 'Time: ' + trade.time + '<br />'
    + 'Execution time: ' + trade.execution_time + '<br />'
    + 'Slippage: ' + trade.slippage + '<br />'
    + 'Size: ' + trade.size + '<br />'
    + 'Fee: ' + trade.fee + '<br />'
    + 'Price: ' + trade.price + '<br />'
    + 'Order type: ' + trade.order_type + '<br />'

  // Returns message as plain text for
  // clients that don't support HTML
  template.plain =
    'Zenbot has done a "' + trade.order_type + '" ' 
    + trade.type + ' on ' + trade.exchange + '\n'
    + 'Trading pair: ' + trade.pair + '\n'
    + 'Time: ' + trade.time + '\n'
    + 'Execution time: ' + trade.execution_time + '\n'
    + 'Slippage: ' + trade.slippage + '\n'
    + 'Size: ' + trade.size + '\n'
    + 'Fee: ' + trade.fee + '\n'
    + 'Price: ' + trade.price + '\n'
    + 'Order type: ' + trade.order_type + '\n'

  return template
}

