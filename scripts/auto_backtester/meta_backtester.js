#!/usr/bin/env node

/* Zenbot 4.04 Meta-Backtester v0.2
 * Sebastian Vogel <webbird83@gmail.com>
 * 09/10/2017
 *
 * Usage: Pass in the same parameters as you would to "backtester.js", EXCEPT for:
 * Output CSV filename: --output
 * Strategies as comma-separated list: --strategies
 *
 * Example: ./meta_backtester.js gdax.ETH-USD --days=10 --currency_capital=5 --strategy "trend_ema" --output testresults.csv strategies trend_ema,rsi,sar
*/

let shell     = require('shelljs');
let parallel  = require('run-parallel-limit');
let roundp    = require('round-precision');

let VERSION = 'Zenbot 4.04 Meta-Backtester v0.2';

let PARALLEL_LIMIT = 1;

let resultFileName = `backtesting_${Math.round(+new Date()/1000)}.csv`;

let runCommand = (strategyName, cb) => {
  let command = `scripts/auto_backtester/backtester.js ${simArgs} --output ${resultFileName} --strategy ${strategyName}`;
  console.log(`[ ${strategyName} ] ${command}`);

  shell.exec(command, {silent:false, async:false}, (code, stdout, stderr) => {
    if (code) {
      console.error(command)
      console.error(stderr)
      return cb(null, null)
    }
    cb(null, stdout);
  });
};

let args = process.argv;
args.shift();
args.shift();
let simArgs = args.join(' ');
let strategyNames = 'cci_srsi,srsi_macd,macd,rsi,sar,speed,trend_ema';
if (args.indexOf('--strategies') !== -1) {
  strategyNames = args[args.indexOf('--strategies') + 1];
}

resultFileName = `backtesting_${strategyNames.replace(/,/g , "-")}_${Math.round(+new Date()/1000)}.csv`;
if (args.indexOf('--output') !== -1) {
  resultFileName = args[args.indexOf('--output') + 1];
}

let strategyNameList = strategyNames.split(',');
let tasks = strategyNameList.map(strategyName => {
      return cb => {
        runCommand(strategyName, cb)
      }
    });

console.log(`\n--==${VERSION}==--`);
console.log(new Date().toUTCString());
console.log(`\nBacktesting [${tasks.length}] strategies...\n`);
console.log(`\nResults are available at ${resultFileName}\n`);

parallel(tasks, PARALLEL_LIMIT, (err, results) => {
  console.log(`\nBacktesting complete, results available at ${resultFileName}`);
});
