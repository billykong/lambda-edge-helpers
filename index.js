/*
  conn = {
    event: event,
    context: context,
    callback: callback
  }
*/

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

const pipeline =  function(...fns) {
  return fns.length > 1 ? fns.reduce((result, f) => (...args) => f(result(...args))) : fns[0];
}

const abAssignment = function(conn, ...grps) {

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
const populateMeta = function(conn, handler) {
  let metaTags = await handler(getRequest(conn).uri);
  let response = getResponse(conn);
  let body = response.body;
  // string replacement here
  let re = /<!-- %meta-section-starts% -->([^()]+)<!-- %meta-section-end% -->/g
  let matches = re.exec(body);
  if (matches) {
    response.body = body.replace(matches[0], metaTags)
  }
}



module.exports = {
  pipeline: pipeline,
  abAssignment: abAssignment,
  respondsOnAssets: respondsOnAssets,
  populateMeta: populateMeta
};