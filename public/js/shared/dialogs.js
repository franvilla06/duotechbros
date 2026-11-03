(function () {
    let resolverActivo = null;
    let elementoEnfocado = null;
    let permitirCancelar = false;

    const injectHTML = () => {
        if (document.getElementById('dialogo-overlay')) return;

        document.body.insertAdjacentHTML('beforeend', `
            <div class="dialogo-overlay" id="dialogo-overlay">
                <section class="dialogo-card" role="alertdialog" aria-modal="true"
                    aria-labelledby="dialogo-titulo" aria-describedby="dialogo-mensaje">
                    <div class="dialogo-icono" id="dialogo-icono"></div>
                    <h3 class="dialogo-titulo" id="dialogo-titulo"></h3>
                    <p class="dialogo-mensaje" id="dialogo-mensaje"></p>
                    <div class="dialogo-acciones" id="dialogo-acciones"></div>
                </section>
            </div>
        `);
    };

    document.addEventListener('DOMContentLoaded', injectHTML);

    const cerrarDialogo = (resultado) => {
        const overlay = document.getElementById('dialogo-overlay');
        if (!overlay || !resolverActivo) return;

        overlay.classList.remove('visible');
        overlay.onclick = null;
        document.removeEventListener('keydown', manejarTecla);

        const resolver = resolverActivo;
        resolverActivo = null;
        resolver(resultado);
        permitirCancelar = false;

        if (elementoEnfocado?.isConnected) elementoEnfocado.focus();
        elementoEnfocado = null;
    };

    const manejarTecla = (evento) => {
        if (evento.key === 'Escape') {
            if (permitirCancelar) cerrarDialogo(false);
            return;
        }

        if (evento.key !== 'Tab') return;

        const acciones = document.getElementById('dialogo-acciones');
        const botones = Array.from(acciones.querySelectorAll('button'));
        if (!botones.length) return;

        const primero = botones[0];
        const ultimo = botones[botones.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primero.focus();
        }
    };

    window.mostrarDialogo = ({ titulo, mensaje, tipo, textoAceptar, textoCancelar }) => {
        injectHTML();
        if (resolverActivo) cerrarDialogo(false);

        const overlay = document.getElementById('dialogo-overlay');
        const icono = document.getElementById('dialogo-icono');
        const elTitulo = document.getElementById('dialogo-titulo');
        const elMensaje = document.getElementById('dialogo-mensaje');
        const acciones = document.getElementById('dialogo-acciones');
        const peligro = tipo === 'peligro';

        elementoEnfocado = document.activeElement;
        elTitulo.textContent = titulo || '';
        elMensaje.textContent = mensaje || '';
        icono.className = `dialogo-icono ${peligro ? 'peligro' : 'info'}`;
        icono.replaceChildren();

        const iconoFuente = document.createElement('i');
        iconoFuente.className = peligro
            ? 'fas fa-exclamation-triangle'
            : 'fas fa-info-circle';
        icono.appendChild(iconoFuente);
        acciones.replaceChildren();

        return new Promise((resolve) => {
            resolverActivo = resolve;
            permitirCancelar = Boolean(textoCancelar);

            if (textoCancelar) {
                const botonCancelar = document.createElement('button');
                botonCancelar.type = 'button';
                botonCancelar.className = 'dialogo-btn dialogo-btn-cancelar';
                botonCancelar.textContent = textoCancelar;
                botonCancelar.addEventListener('click', () => cerrarDialogo(false));
                acciones.appendChild(botonCancelar);
            }

            const botonAceptar = document.createElement('button');
            botonAceptar.type = 'button';
            botonAceptar.className = `dialogo-btn ${peligro ? 'dialogo-btn-peligro' : 'dialogo-btn-aceptar'}`;
            botonAceptar.textContent = textoAceptar || 'Aceptar';
            botonAceptar.addEventListener('click', () => cerrarDialogo(true));
            acciones.appendChild(botonAceptar);

            overlay.onclick = (evento) => {
                if (evento.target === overlay && textoCancelar) cerrarDialogo(false);
            };
            document.addEventListener('keydown', manejarTecla);
            overlay.classList.add('visible');
            (textoCancelar ? acciones.firstElementChild : botonAceptar).focus();
        });
    };

    window.confirmarAccion = (mensaje, titulo = '¿Estás seguro?') => {
        return window.mostrarDialogo({
            titulo,
            mensaje,
            tipo: 'peligro',
            textoAceptar: 'Sí, continuar',
            textoCancelar: 'Cancelar',
        });
    };

    window.mostrarAlerta = (mensaje, titulo = 'Aviso') => {
        return window.mostrarDialogo({
            titulo,
            mensaje,
            tipo: 'info',
            textoAceptar: 'Entendido',
        });
    };
})();
