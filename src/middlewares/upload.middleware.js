import multer from 'multer';
import cloudinary from '../config/cloudinary.config.js';

const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, callback) => {
    if (tiposPermitidos.includes(file.mimetype)) {
        callback(null, true);
        return;
    }

    callback(new Error('Formato de archivo no válido. Solo se permiten JPG, PNG, WEBP o GIF.'), false);
};

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 5
    },
    fileFilter
});

export const subirImagenCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result?.secure_url) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Cloudinary no devolvió una URL segura para la imagen.'));
                }
            }
        );

        stream.end(buffer);
    });
};
