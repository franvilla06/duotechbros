const bcrypt = require('bcryptjs');
const adminModel = require('../models/admin.model');
const usuariosModel = require('../models/usuarios.model');
const { generarToken } = require('../utils/token.util');

function registrarUsuario(db, usuario, password) {
    const existe = usuariosModel.contarPorUsuario(db, usuario);
    if (existe.count > 0) return { existe: true };

    const hash = bcrypt.hashSync(password, 10);
    const info = usuariosModel.crear(db, usuario, hash);
    const token = generarToken('usuario', usuario);

    return { existe: false, id: info.lastInsertRowid, token };
}

function autenticarUsuario(db, usuario, password) {
    const user = usuariosModel.buscarPorUsuario(db, usuario);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return null;

    return {
        usuario: user.usuario,
        id: user.id,
        token: generarToken('usuario', user.usuario),
    };
}

function autenticarAdministrador(db, usuario, password) {
    const admin = adminModel.buscarPorUsuario(db, usuario);
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) return null;

    return {
        usuario: admin.usuario,
        token: generarToken('admin', admin.usuario),
    };
}

// cambiar la contrasenia del usuario
// requiere la contrasenia actual como confirmacion
function cambiarPassword(db, usuario, passwordActual, passwordNueva) {
    const user = usuariosModel.buscarPorUsuario(db, usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    if (!bcrypt.compareSync(passwordActual, user.password_hash)) {
        return { error: 'La contrasenia actual es incorrecta.' };
    }

    const nuevoHash = bcrypt.hashSync(passwordNueva, 10);
    usuariosModel.actualizarPassword(db, usuario, nuevoHash);

    return { success: true };
}

// dar de baja la cuenta del usuario
// los pedidos historicos se mantienen para futuros analisis
function darDeBaja(db, usuario) {
    const user = usuariosModel.buscarPorUsuario(db, usuario);
    if (!user) {
        return { error: 'Usuario no encontrado.' };
    }

    // eliminar la cuenta
    // los pedidos historicos quedan intactos porque la tabla pedidos
    // no tiene fk hacia usuarios
    usuariosModel.eliminar(db, usuario);

    return { success: true };
}

module.exports = {
    registrarUsuario,
    autenticarUsuario,
    autenticarAdministrador,
    cambiarPassword,
    darDeBaja,
};