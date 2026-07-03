"use strict";
import Customer from "../entity/customer.entity.js";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";

/**
 * Obtener el perfil de cliente del usuario autenticado.
 */
export async function getMyCustomerProfileService(userId) {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { user: { id: userId } },
      relations: ["user"],
    });

    if (!customer) return [null, "Perfil de cliente no encontrado"];

    const { user: { password, ...userData }, ...customerData } = customer;
    return [{ ...customerData, user: userData }, null];
  } catch (error) {
    console.error("Error al obtener perfil de cliente:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Actualizar el perfil de cliente del usuario autenticado.
 */
export async function updateMyCustomerProfileService(userId, body) {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { user: { id: userId } },
      relations: ["user"],
    });

    if (!customer) return [null, "Perfil de cliente no encontrado"];

    const allowedFields = ["telefono", "direccion", "ciudad", "region", "codigoPostal"];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        customer[field] = body[field];
      }
    }

    const updated = await customerRepository.save(customer);
    const { user: { password, ...userData }, ...customerData } = updated;

    return [{ ...customerData, user: userData }, null];
  } catch (error) {
    console.error("Error al actualizar perfil de cliente:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Listar todos los clientes (solo admin).
 */
export async function getCustomersService() {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    const customers = await customerRepository.find({
      relations: ["user"],
      order: { createdAt: "DESC" },
    });

    const result = customers.map(({ user: { password, ...userData }, ...customerData }) => ({
      ...customerData,
      user: userData,
    }));

    return [result, null];
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Obtener un cliente por su ID (solo admin).
 */
export async function getCustomerByIdService(customerId) {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id: customerId },
      relations: ["user"],
    });

    if (!customer) return [null, "Cliente no encontrado"];

    const { user: { password, ...userData }, ...customerData } = customer;
    return [{ ...customerData, user: userData }, null];
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    return [null, "Error interno del servidor"];
  }
}
