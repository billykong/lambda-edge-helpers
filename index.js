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
  let request = conn.event.Records[0].cf.request;
  return request;
}

const getResponse = function(conn) {
  let response = conn.event.Records[0].cf.response;
  return response;
}

const setResponse = function(response, conn) {
  conn.event.Records[0].cf.response = response;
  return conn;
}

const getHeaders = function(conn) {
  let request = getRequest(conn);
  return request.headers;
}


const exitOnAssets = function(conn) {
  // if the request.uri has file suffix(except index.html), exit with callback
  // else set uri to index.html and continue
  let request = getRequest(conn);
  let re = /(?<!index)\.[a-z]+$/g
  let matches = re.exec(request.uri);
  if (!matches) {
    return conn;
  } else {
    requestCallback(conn);
    return undefined;
  }
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
    console.log('matches: ' + JSON.stringify(matches));
    response.body = body.replace(matches[0], metaTags)
  }
  conn = setResponse(response, conn);
  return conn;
}

const responseCallback = function(conn) {
  console.log('responseCallback');
  conn.callback(null, getResponse(conn));
  return conn;
}

const requestCallback = function(conn) {
  console.log('requestCallback');
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
  exitOnAssets: exitOnAssets,
  populateMeta: populateMeta,
  responseCallback: responseCallback,
  requestCallback: requestCallback,
  getRequest: getRequest,
  getResponse: getResponse,
  setResponse: setResponse,
  logger: logger 
};
