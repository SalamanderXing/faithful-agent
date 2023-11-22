import { DateTime } from 'luxon';
const currentDay = DateTime.now().toISO({ includeOffset: false }).split('T')[0];
console.log(currentDay);
// If the 'luxon' package is not already installed, run `npm install luxon` to install it first.
