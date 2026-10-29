// SCRIPT GLOBAL PARA MOSTRAR/OCULTAR CONTRASEÑAS
document.addEventListener('DOMContentLoaded', () => {
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach(input => {
        // Evitar duplicados si el script se carga dos veces
        if (input.parentElement.classList.contains('password-wrapper')) return;

        // Crear el contenedor relativo para posicionar el ícono
        const wrapper = document.createElement('div');
        wrapper.className = 'password-wrapper';

        // Insertar el wrapper antes del input y mover el input adentro
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // Crear el botón con el ícono del ojo
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'toggle-password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        toggleBtn.setAttribute('aria-label', 'Mostrar u ocultar contraseña');

        wrapper.appendChild(toggleBtn);

        // Lógica para cambiar el tipo de input y el ícono
        toggleBtn.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);

            const icon = toggleBtn.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
});
