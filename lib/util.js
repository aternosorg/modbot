const util = {};

util.retry = async (fn, thisArg, args = [], maxRetries = 5, returnValMatch = null) => {
    let err;
    for (let i = 0; i < maxRetries; i++) {
        let res;
        try {
            res = await Promise.resolve(fn.apply(thisArg, args));
        } catch (e) {
            err = e;
            continue;
        }
        if (typeof returnValMatch === 'function' && !returnValMatch(res)) {
            err = new Error('Returned value did not match requirements');
            continue;
        }
        return res;
    }
    throw err;
}

util.channelMentionToId = (mention) => {
  return mention.replace('<','').replace('#','').replace('>','');
}

util.timeToSec = (time) => {
  //Convert time to s
  let seconds = 0;
  let words = time.split(' ');
  for (word of words) {
      if (word.endsWith('s')) {
          seconds += parseInt(word);
      }
      else if (word.endsWith('m')) {
          seconds += parseInt(word) * 60;
      }
      else if (word.endsWith('h')) {
          seconds += parseInt(word) * 60 * 60;
      }
      else if (word.endsWith('d')) {
          seconds += parseInt(word) * 60 * 60 * 24;
      }
      else if (word.endsWith('w')) {
          seconds += parseInt(word) * 7 * 60 * 60 * 24;
      }
      else if (word.endsWith('y')) {
          seconds += parseInt(word) * 365 * 60 * 60 * 24;
      }
      else {
        break;
      }
  };

  return Math.abs(seconds);
}

util.secToTime = (seconds) => {
  seconds = parseInt(seconds);

  let years,weeks,days,hours,minutes;
  years = Math.floor(seconds/31536000);
  seconds = seconds - 31536000 * years;
  weeks = Math.floor(seconds/8467200);
  seconds = seconds - 8467200 * weeks;
  days = Math.floor(seconds/86400);
  seconds = seconds - 86400 * days
  hours = Math.floor(seconds/3600);
  seconds = seconds - 3600 * hours;
  minutes = Math.floor(seconds/60);
  seconds = seconds - 60 * minutes;

  let time = '';
  if(years)
    time += years+'y '
  if(weeks)
    time += weeks+'w '
  if(days)
    time += days+'d '
  if(hours)
    time += hours+'h '
  if(minutes)
    time += minutes+'m '
  if(seconds)
    time += seconds+'s '

  return time.slice(0,time.length-1);
}

module.exports = util;
