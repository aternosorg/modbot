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
      else {
        break;
      }
  };

  return Math.abs(seconds);
}

util.secToTime = (seconds) => {
  seconds = parseInt(seconds);
  let d,h,m,s;
  d = Math.floor(seconds/86400);
  h = Math.floor((seconds-86400*d)/3600);
  m = Math.floor(((seconds-86400*d)-3600*h)/60);
  s = Math.floor(((seconds-86400*d)-3600*h)-60*m);

  let time = '';
  if(d)
    time += d+'d '
  if(h)
    time += h+'h '
  if(m)
    time += m+'m '
  if(s)
    time += s+'s '

  return time.slice(0,time.length-1);
}

module.exports = util;
