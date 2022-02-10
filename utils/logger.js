let chalk = require('chalk');
let moment = require('moment');

let success = (m) => {
  let daystamp = chalk.italic(moment().format('DD/MM/YYYY'));
  let timestamp = chalk.italic(moment().format('HH:MM:SS'));
  let message = chalk.green(m);

  console.log(`${daystamp} - ${timestamp} - ${message}`);
};

let warning = (m) => {
  let daystamp = chalk.italic(moment().format('DD/MM/YYYY'));
  let timestamp = chalk.italic(moment().format('HH:MM:SS'));
  let message = chalk.yellow(m);

  console.log(`${daystamp} - ${timestamp} - ${message}`);
};

let error = (m) => {
  let daystamp = chalk.italic(moment().format('DD/MM/YYYY'));
  let timestamp = chalk.italic(moment().format('HH:MM:SS'));
  let message = chalk.red(m);

  console.log(`${daystamp} - ${timestamp} - ${message}`);
};

let info = (m) => {
  let daystamp = chalk.italic(moment().format('DD/MM/YYYY'));
  let timestamp = chalk.italic(moment().format('HH:MM:SS'));
  let message = chalk.gray(m);

  console.log(`${daystamp} - ${timestamp} - ${message}`);
};

module.exports = { success, warning, error, info };
