// Configuración de autenticación
const secret = process.env.JWT_SECRET;

// Validación de la variable de entorno JWT_SECRET
if (!secret) {
    throw new Error('La variable de entorno JWT_SECRET es obligatoria.');
}

// Validación de la longitud del secreto
if (secret.length < 32) {
    throw new Error('La variable de entorno JWT_SECRET debe tener al menos 32 caracteres.');
}

// Configuración de autenticación
export const authConfig = {
    secret,
    expiracionMs: 24 * 60 * 60 * 1000,
};
