/* eslint-disable no-plusplus, no-param-reassign, camelcase */
const tabs = (num) => {
  let tab = '';
  while (num > 0) {
    tab += '\t';
    num--;
  }
  return tab;
};

const newline = (data, indent = 0) => {
  let block = '';
  try {
    Object.entries(data).forEach((array) => {
      if (array[1] === null) {
        block += `${tabs(indent)}${array[0]}: null\n`;
      } else if (typeof array[1] === 'object') {
        block += `${tabs(indent)}${array[0]}:\n${newline(array[1], indent + 1)}`;
      } else {
        block += `${tabs(indent)}${array[0]}: ${array[1]}\n`;
      }
    });
  } catch (error) {
    return 'error';
  }
  return block;
};

const convert = (o) => {
  console.log(o);
  const p = JSON.parse(o);
  const {
    created, livemode, pending_webhooks, type, data,
  } = p;
  const date = new Date(created * 1000).toLocaleString();
  console.log('we got this far: ', type, date);
  return `Received Stripe notification (${date}). Type: ${type}. In livemode? ${livemode}. Pending hooks: ${pending_webhooks}. Data: ${newline(data)}`;
};

module.exports = convert;
