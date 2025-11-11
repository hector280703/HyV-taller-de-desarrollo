"use strict";
import {
  createProductService,
  deleteProductService,
  getProductService,
  getProductsService,
  updateProductService,
} from "../services/product.service.js";
import {
  productBodyValidation,
  productCreateValidation,
  productQueryValidation,
} from "../validations/product.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function createProduct(req, res) {
  try {
    const { body } = req;

    const { error: bodyError } = productCreateValidation.validate(body);

    if (bodyError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en los datos enviados",
        bodyError.message
      );
    }

    const [product, errorProduct] = await createProductService(body);

    if (errorProduct) {
      return handleErrorClient(res, 400, "Error creando el producto", errorProduct);
    }

    handleSuccess(res, 201, "Producto creado correctamente", product);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getProduct(req, res) {
  try {
    const { id, codigo, nombre } = req.query;

    const { error } = productQueryValidation.validate({ id, codigo, nombre });

    if (error) return handleErrorClient(res, 400, error.message);

    const [product, errorProduct] = await getProductService({ id, codigo, nombre });

    if (errorProduct) return handleErrorClient(res, 404, errorProduct);

    handleSuccess(res, 200, "Producto encontrado", product);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getProducts(req, res) {
  try {
    const [products, errorProducts] = await getProductsService();

    if (errorProducts) return handleErrorClient(res, 404, errorProducts);

    products.length === 0
      ? handleSuccess(res, 204)
      : handleSuccess(res, 200, "Productos encontrados", products);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateProduct(req, res) {
  try {
    const { id, codigo, nombre } = req.query;
    const { body } = req;

    const { error: queryError } = productQueryValidation.validate({
      id,
      codigo,
      nombre,
    });

    if (queryError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en la consulta",
        queryError.message
      );
    }

    const { error: bodyError } = productBodyValidation.validate(body);

    if (bodyError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en los datos enviados",
        bodyError.message
      );
    }

    const [product, errorProduct] = await updateProductService(
      { id, codigo, nombre },
      body
    );

    if (errorProduct) {
      return handleErrorClient(res, 400, "Error modificando el producto", errorProduct);
    }

    handleSuccess(res, 200, "Producto modificado correctamente", product);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id, codigo, nombre } = req.query;

    const { error: queryError } = productQueryValidation.validate({
      id,
      codigo,
      nombre,
    });

    if (queryError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en la consulta",
        queryError.message
      );
    }

    const [productDeleted, errorProductDeleted] = await deleteProductService({
      id,
      codigo,
      nombre,
    });

    if (errorProductDeleted) {
      return handleErrorClient(res, 404, "Error eliminando el producto", errorProductDeleted);
    }

    handleSuccess(res, 200, "Producto eliminado correctamente", productDeleted);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
