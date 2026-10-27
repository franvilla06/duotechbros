// MENU HAMBURGUESA DEL SITIO PUBLICO
// se encarga de abrir y cerrar el menu en pantallas chicas
// tambien cierra el menu al hacer click en un link, fuera del nav o al pasar a desktop

(function () {
    const nav = document.querySelector('header nav');
    const toggle = document.getElementById('nav-toggle');

    if (!nav || !toggle) return;

    const icono = toggle.querySelector('i');

    // actualiza el icono seg?n el estado del men?.
    function actualizarIcono(abierto) {
        if (!icono) return;
        icono.className = abierto ? 'fas fa-times' : 'fas fa-bars';
    }

    // muestra el men? de navegaci?n m?vil.
    function abrirMenu() {
        nav.classList.add('menu-abierto');
        toggle.setAttribute('aria-label', 'Cerrar menú');
        toggle.setAttribute('aria-expanded', 'true');
        actualizarIcono(true);
    }

    // oculta el men? de navegaci?n m?vil.
    function cerrarMenu() {
        nav.classList.remove('menu-abierto');
        toggle.setAttribute('aria-label', 'Abrir menú');
        toggle.setAttribute('aria-expanded', 'false');
        actualizarIcono(false);
    }

    // alternar la visibilidad del men? de navegaci?n m?vil.
    function toggleMenu() {
        if (nav.classList.contains('menu-abierto')) {
            cerrarMenu();
        } else {
            abrirMenu();
        }
    }

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    nav.querySelectorAll('.nav-menu a').forEach((link) => {
        link.addEventListener('click', cerrarMenu);
    });

    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) {
            cerrarMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarMenu();
        }
    });

    let ultimoAncho = window.innerWidth;
    window.addEventListener('resize', () => {
        const anchoActual = window.innerWidth;
        const cruzoBreakpoint =
            (ultimoAncho <= 768 && anchoActual > 768) ||
            (ultimoAncho > 768 && anchoActual <= 768);

        if (cruzoBreakpoint && anchoActual > 768) {
            cerrarMenu();
        }

        ultimoAncho = anchoActual;
    });
})();
