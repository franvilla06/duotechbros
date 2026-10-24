const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error('La variable de entorno JWT_SECRET es obligatoria.');
}

if (secret.length < 32) {
    throw new Error('La variable de entorno JWT_SECRET debe tener al menos 32 caracteres.');
}

export const authConfig = {
    secret,
    expiracionMs: 24 * 60 * 60 * 1000,
};
