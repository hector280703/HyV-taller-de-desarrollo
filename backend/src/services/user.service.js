"use strict";
import User from "../entity/user.entity.js";
import Customer from "../entity/customer.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { comparePassword, encryptPassword } from "../helpers/bcrypt.helper.js";

export async function getUserService(query) {
  try {
    const { rut, id, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const { password, ...userData } = userFound;

    // Obtener también campos de perfil de cliente si existen
    try {
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({ where: { user: { id: userFound.id } } });
      if (customer) {
        userData.telefono = customer.telefono || "";
        userData.direccion = customer.direccion || "";
      }
    } catch (err) {
      console.error("Error al obtener perfil de cliente vinculado:", err);
    }

    return [userData, null];
  } catch (error) {
    console.error("Error obtener el usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getUsersService() {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const users = await userRepository.find();

    if (!users || users.length === 0) return [null, "No hay usuarios"];

    const usersData = [];
    const customerRepository = AppDataSource.getRepository(Customer);

    for (const u of users) {
      const { password, ...userData } = u;
      try {
        const customer = await customerRepository.findOne({ where: { user: { id: u.id } } });
        if (customer) {
          userData.telefono = customer.telefono || "";
          userData.direccion = customer.direccion || "";
        }
      } catch (err) {
        // Ignorar
      }
      usersData.push(userData);
    }

    return [usersData, null];
  } catch (error) {
    console.error("Error al obtener a los usuarios:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateUserService(query, body) {
  try {
    const { id, rut, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    const existingUser = await userRepository.findOne({
      where: [{ rut: body.rut }, { email: body.email }],
    });

    if (existingUser && existingUser.id !== userFound.id) {
      return [null, "Ya existe un usuario con el mismo rut o email"];
    }

    if (body.password) {
      const matchPassword = await comparePassword(
        body.password,
        userFound.password,
      );

      if (!matchPassword) return [null, "La contraseña no coincide"];
    }

    const dataUserUpdate = {
      nombreCompleto: body.nombreCompleto,
      rut: body.rut,
      email: body.email,
      rol: body.rol,
      updatedAt: new Date(),
    };

    if (body.newPassword && body.newPassword.trim() !== "") {
      dataUserUpdate.password = await encryptPassword(body.newPassword);
    }

    await userRepository.update({ id: userFound.id }, dataUserUpdate);

    // Actualizar también campos de telefono y direccion en la entidad Customer
    if (body.telefono !== undefined || body.direccion !== undefined) {
      try {
        const customerRepository = AppDataSource.getRepository(Customer);
        let customer = await customerRepository.findOne({ where: { user: { id: userFound.id } } });
        if (!customer) {
          customer = customerRepository.create({ user: userFound });
        }
        if (body.telefono !== undefined) customer.telefono = body.telefono;
        if (body.direccion !== undefined) customer.direccion = body.direccion;
        await customerRepository.save(customer);
      } catch (customerErr) {
        console.error("Error al actualizar perfil de cliente vinculado:", customerErr);
      }
    }

    const userData = await userRepository.findOne({
      where: { id: userFound.id },
    });

    if (!userData) {
      return [null, "Usuario no encontrado después de actualizar"];
    }

    const { password, ...userUpdated } = userData;

    // Incluir telefono y direccion en la respuesta
    try {
      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({ where: { user: { id: userData.id } } });
      if (customer) {
        userUpdated.telefono = customer.telefono || "";
        userUpdated.direccion = customer.direccion || "";
      }
    } catch (err) {
      // Ignorar
    }

    return [userUpdated, null];
  } catch (error) {
    console.error("Error al modificar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteUserService(query) {
  try {
    const { id, rut, email } = query;

    const userRepository = AppDataSource.getRepository(User);

    const userFound = await userRepository.findOne({
      where: [{ id: id }, { rut: rut }, { email: email }],
    });

    if (!userFound) return [null, "Usuario no encontrado"];

    if (userFound.rol === "administrador") {
      return [null, "No se puede eliminar un usuario con rol de administrador"];
    }

    const userDeleted = await userRepository.remove(userFound);

    const { password, ...dataUser } = userDeleted;

    return [dataUser, null];
  } catch (error) {
    console.error("Error al eliminar un usuario:", error);
    return [null, "Error interno del servidor"];
  }
}