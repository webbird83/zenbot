// Configuration file for Zensmtper
var c = module.exports = {}
// Parameters for your SMTP host
// Your internet provider's SMTP host name
c.smtpHost = 'YOUR-SMTP-HOST'
// Your internet provider's SMTP port, usually 465, 587 or 25
c.smtpPort = 25
// Your SMTP username at your internet provider
c.smtpUser = ''
// Your SMTP password at your internet provider
c.smtpPass = ''
//Set this to 'true' if smtpPort is 465
c.smtpSec = false

// Parameters for the messages
// Who should the message come from?

c.msgFrom = '"Zenbot Trade" <YOUR-SENDER-ADDRESS>'
// What would you like the subject to be?
c.msgSubject = 'Zenbot is trading'
// To whom should the zenmailer send messages?
c.msgTo = '"Zen Master" <YOUR-MAIL-ADDRSS>'
