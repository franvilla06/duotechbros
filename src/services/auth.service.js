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

module.exports = { registrarUsuario, autenticarUsuario, autenticarAdministrador };
