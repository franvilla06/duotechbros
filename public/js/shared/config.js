// CONFIGURACION GLOBAL DEL FRONTEND
// este script se carga PRIMERO en todas las paginas HTML
// su funcion es detectar en que puerto corre el frontend y ajustar las URLs
// de la API para que funcionen tanto con el servidor Node como con Live Server

(function () {
    // determinar la base de la API segun el puerto actual
    const port = window.location.port;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // si estamos en el puerto 3000 (servidor Node), las rutas relativas funcionan
    // si estamos en otro puerto (Live Server), hay que apuntar al backend en el 3000
    let apiBase = '';

    if (port !== '3000' && port !== '') {
        apiBase = `${protocol}//${hostname}:3000`;
        console.log(`[config] Frontend en puerto ${port} - API apunta a ${apiBase}`);
    } else {
        console.log('[config] Frontend en puerto 3000 (mismo servidor)');
    }

    // exponer globalmente
    window.API_BASE = apiBase;

    // interceptar fetch para agregar la base de la API automaticamente
    // cuando la url empieza con /api
    // esto permite que el resto del codigo siga usando rutas relativas
    const fetchOriginal = window.fetch;

    window.fetch = function (url, opciones) {
        // si la url es un string y empieza con /api, prependemos la base
        if (typeof url === 'string' && url.startsWith('/api')) {
            url = apiBase + url;
        }
        return fetchOriginal.call(this, url, opciones);
    };
})();