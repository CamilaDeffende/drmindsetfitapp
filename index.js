
export default {
  async fetch(request, env) {
    // Servir assets estáticos via ASSETS binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    
    return new Response('App not configured', { status: 500 });
  }
};
