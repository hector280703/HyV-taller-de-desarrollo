import Swal from 'sweetalert2';

const customStyles = {
  popup: 'animate__animated animate__fadeInDown',
  confirmButton: 'custom-confirm-btn',
  cancelButton: 'custom-cancel-btn'
};

export async function deleteDataAlert() {
  return Swal.fire({
    title: "¿Estás seguro?",
    text: "¡No podrás revertir esto!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ff6b35",
    cancelButtonColor: "#95a5a6",
    confirmButtonText: "Sí, eliminar!",
    cancelButtonText: "Cancelar",
    showClass: {
      popup: 'animate__animated animate__zoomIn'
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut'
    },
    customClass: {
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn'
    }
  })
}

export const showSuccessAlert = (titleMessage, message) => {
  Swal.fire({
    title: titleMessage,
    text: message,
    icon: 'success',
    confirmButtonColor: "#27ae60",
    confirmButtonText: "¡Genial!",
    showClass: {
      popup: 'animate__animated animate__bounceIn'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    },
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      confirmButton: 'swal-success-btn'
    }
  });
};

export const showErrorAlert = (titleMessage, message) => {
  Swal.fire({
    title: titleMessage,
    text: message,
    icon: 'error',
    confirmButtonColor: "#e74c3c",
    confirmButtonText: "Entendido",
    showClass: {
      popup: 'animate__animated animate__shakeX'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut'
    },
    customClass: {
      confirmButton: 'swal-error-btn'
    }
  });
};

export const showConfirmAlert = async (titleMessage, message) => {
  const result = await Swal.fire({
    title: titleMessage,
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ff6b35",
    cancelButtonColor: "#95a5a6",
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    showClass: {
      popup: 'animate__animated animate__flipInX'
    },
    hideClass: {
      popup: 'animate__animated animate__flipOutX'
    },
    customClass: {
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn'
    }
  });
  return result.isConfirmed;
};

export const showLoadingAlert = (message = 'Procesando...') => {
  Swal.fire({
    title: message,
    html: '<div class="custom-loader"></div>',
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

export const closeLoadingAlert = () => {
  Swal.close();
};