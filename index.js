/*
  conn = {
    event: event,
    context: context,
    callback: callback
  }
*/

const constructConnection = function(event, context, callback) {
  return {
    event: event,
    context: context,
    callback: callback
  }
}

const getRequest = function(conn) {
  return conn.event.Records[0].cf.request;
}

const getResponse = function(conn) {
  return conn.event.Records[0].cf.response;
}

const getHeaders = function(conn) {
  let request = getRequest(conn);
  return request.headers;
}

// const pipeline =  function(...fns) {
//   if (fns.length > 1) {
//     return fns.reduce(async (result, f) => async (...args) => {
//       return await f(await result(...args));
//     });
//   } else {
//     return fns[0];
//   }
//   // return fns.length > 1 ? fns.reduce((result, f) => (...args) => f(await result(...args))) : fns[0];
// }

// const pipelineSync =  function(fns) {
//   return fns.length > 1 ? fns.reduce((result, f) => (args) => f(result(args))) : fns[0];
// }

const abAssignment = function(conn, ...grps) {
  /*
    let experimentUri;
    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            if (headers.cookie[i].value.indexOf(cookieExperimentA) >= 0) {
                console.log('Experiment A cookie found');
                experimentUri = pathExperimentA;
                break;
            } else if (headers.cookie[i].value.indexOf(cookieExperimentB) >= 0) {
                console.log('Experiment B cookie found');
                experimentUri = pathExperimentB;
                break;
            }
        }
    }

    if (!experimentUri) {
        console.log('Experiment cookie has not been found. Throwing dice...');
        if (Math.random() < 0.75) {
            experimentUri = pathExperimentA;
        } else {
            experimentUri = pathExperimentB;
        }
    }

    request.uri = experimentUri;
    console.log(`Request uri set to "${request.uri}"`);
    callback(null, request);
  */
  
}

const respondsOnAssets = function(conn) {
  // if the request.uri has file suffix(except index.html), exit with callback
  // else set uri to index.html and continue
  let request = getRequest(conn);
  let re = /(?<!index)\.[a-z]+$/g
  let matches = re.exec(request.uri);
  if (!matches) {
    request.uri = 'index.html';
  }
  conn.callback(null, request);
}

/*
  async handler::(uri:string) -> (meta:string)
  meta:string `<meta property="og:url" content="${uri}"> <meta property="og:title" content="${title}">`
*/
const populateMeta = async function(handler, conn) {
  let metaTags = await handler(getRequest(conn).uri);
  let response = getResponse(conn);
  let body = response.body;
  // string replacement here
  let re = /<!-- %meta-section-starts% -->([^()]+)<!-- %meta-section-end% -->/g
  let matches = re.exec(body);
  if (matches) {
    response.body = body.replace(matches[0], metaTags)
  }
  return conn;
}

const respond = function(conn) {
  conn.callback(null, getRequest(conn));
  return conn;
}

const logger = function(fn) {
  return async function(args) {
    console.log(`${fn.name} args: \n${JSON.stringify(args, null, 2)}\n`);
    let result = await fn(args);
    console.log(`${fn.name} result: \n${JSON.stringify(result, null, 2)}\n`);
    return result;
  }
}



module.exports = {
  constructConnection: constructConnection,
  abAssignment: abAssignment,
  respondsOnAssets: respondsOnAssets,
  populateMeta: populateMeta,
  respond: respond,
  logger: logger 
};
