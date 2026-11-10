// Edge shim for roll10000 web: force HTTPS, send the bare domain to www, serve the SPA from static assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:" || url.hostname === "roll10000.com") {
      url.protocol = "https:";
      url.hostname = "www.roll10000.com";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
