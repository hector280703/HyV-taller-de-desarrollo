import Form from './Form';
import '@styles/popup.css';
import CloseIcon from '@assets/XIcon.svg';
import QuestionIcon from '@assets/QuestionCircleIcon.svg';

export default function Popup({ show, setShow, data, action, isProductForm = false, isCreateMode = false }) {
    const userData = data && data.length > 0 ? data[0] : {};
    const productData = data && data.length > 0 ? data[0] : {};

    const handleSubmit = (formData) => {
        action(formData);
    };

    const patternRut = new RegExp(/^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7}|29\.999\.999|29999999)-[\dkK]$/);
    
    // Campos para formulario de usuarios
    const userFields = [
        {
            label: "Nombre completo",
            name: "nombreCompleto",
            defaultValue: userData.nombreCompleto || "",
            placeholder: 'Héctor Bastián Díaz Fernández',
            fieldType: 'input',
            type: "text",
            required: true,
            minLength: 15,
            maxLength: 50,
            pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
            patternMessage: "Debe contener solo letras y espacios",
        },
        {
            label: "Correo electrónico",
            name: "email",
            defaultValue: userData.email || "",
            placeholder: 'example@gmail.cl',
            fieldType: 'input',
            type: "email",
            required: true,
            minLength: 15,
            maxLength: 30,
        },
        {
            label: "Rut",
            name: "rut",
            defaultValue: userData.rut || "",
            placeholder: '21.353.846-2',
            fieldType: 'input',
            type: "text",
            minLength: 9,
            maxLength: 12,
            pattern: patternRut,
            patternMessage: "Debe ser xx.xxx.xxx-x o xxxxxxxx-x",
            required: true,
        },
        {
            label: "Rol",
            name: "rol",
            fieldType: 'select',
            options: [
                { value: 'administrador', label: 'Administrador' },
                { value: 'usuario', label: 'Usuario' },
            ],
            required: true,
            defaultValue: userData.rol || "",
        },
        {
            label: (
                <span>
                    Nueva contraseña
                    <span className='tooltip-icon'>
                        <img src={QuestionIcon} />
                        <span className='tooltip-text'>Este campo es opcional</span>
                    </span>
                </span>
            ),
            name: "newPassword",
            placeholder: "**********",
            fieldType: 'input',
            type: "password",
            required: false,
            minLength: 8,
            maxLength: 26,
            pattern: /^[a-zA-Z0-9]+$/,
            patternMessage: "Debe contener solo letras y números",
        }
    ];

    // Campos para formulario de productos
    const productFields = [
        {
            label: "Nombre del producto",
            name: "nombre",
            defaultValue: productData.nombre || "",
            placeholder: 'Ejemplo: Laptop HP',
            fieldType: 'input',
            type: "text",
            required: true,
            minLength: 3,
            maxLength: 100,
        },
        {
            label: "Código del producto",
            name: "codigo",
            defaultValue: productData.codigo || "",
            placeholder: 'Ejemplo: PROD-001',
            fieldType: 'input',
            type: "text",
            required: true,
            minLength: 1,
            maxLength: 50,
        },
        {
            label: "Descripción",
            name: "descripcion",
            defaultValue: productData.descripcion || "",
            placeholder: 'Descripción del producto',
            fieldType: 'input',
            type: "text",
            required: false,
            maxLength: 500,
        },
        {
            label: "Precio",
            name: "precio",
            defaultValue: productData.precio || "",
            placeholder: '0.00',
            fieldType: 'input',
            type: "number",
            required: true,
            min: 0,
            step: 0.01,
        },
        {
            label: "Stock",
            name: "stock",
            defaultValue: productData.stock || 0,
            placeholder: '0',
            fieldType: 'input',
            type: "number",
            required: true,
            min: 0,
        },
        {
            label: "Categoría",
            name: "categoria",
            defaultValue: productData.categoria || "",
            placeholder: 'Ejemplo: Electrónica',
            fieldType: 'input',
            type: "text",
            required: false,
            maxLength: 50,
        },
        {
            label: "Estado",
            name: "activo",
            fieldType: 'select',
            options: [
                { value: 'true', label: 'Activo' },
                { value: 'false', label: 'Inactivo' },
            ],
            required: true,
            defaultValue: productData.activo !== undefined ? String(productData.activo) : "true",
        }
    ];

    const fields = isProductForm ? productFields : userFields;
    const title = isProductForm 
        ? (isCreateMode ? "Crear Producto" : "Editar Producto")
        : "Editar usuario";
    const buttonText = isProductForm
        ? (isCreateMode ? "Crear producto" : "Actualizar producto")
        : "Editar usuario";

    return (
        <div>
            { show && (
            <div className="bg">
                <div className="popup">
                    <button className='close' onClick={() => setShow(false)}>
                        <img src={CloseIcon} />
                    </button>
                    <Form
                        title={title}
                        fields={fields}
                        onSubmit={handleSubmit}
                        buttonText={buttonText}
                        backgroundColor={'#fff'}
                    />
                </div>
            </div>
            )}
        </div>
    );
}