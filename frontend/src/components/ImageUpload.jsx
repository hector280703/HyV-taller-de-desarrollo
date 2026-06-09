import { useState, useRef } from 'react';
import axiosInstance from '@services/root.service.js';
import '@styles/imageUpload.css';

/**
 * Componente de carga de imágenes con preview para Cloudinary.
 *
 * Props:
 *   - currentImageUrl: URL de la imagen existente (modo edición)
 *   - onImageUploaded: callback(url) invocado cuando la imagen se sube exitosamente
 *   - onUploadStart: callback() opcional para indicar que inició el upload
 *   - onUploadEnd:   callback() opcional para indicar que terminó el upload
 */
const ImageUpload = ({ currentImageUrl = '', onImageUploaded, onUploadStart, onUploadEnd }) => {
    const [preview, setPreview] = useState(currentImageUrl || null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        // Validar tipo
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            setError('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)');
            return;
        }

        // Validar tamaño (5 MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen no puede superar los 5 MB');
            return;
        }

        setError('');

        // Mostrar preview local inmediato
        const localUrl = URL.createObjectURL(file);
        setPreview(localUrl);

        // Subir al backend → Cloudinary
        setUploading(true);
        onUploadStart?.();

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await axiosInstance.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const result = response.data;

            if (result.status === 'Client error' || result.status === 'Server error') {
                throw new Error(result.message || 'Error al subir la imagen');
            }

            const cloudinaryUrl = result.data?.imageUrl;
            setPreview(cloudinaryUrl);
            onImageUploaded?.(cloudinaryUrl);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Error al subir la imagen';
            setError(msg);
            setPreview(currentImageUrl || null);
        } finally {
            setUploading(false);
            onUploadEnd?.();
        }
    };

    const handleInputChange = (e) => {
        handleFile(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleRemove = () => {
        setPreview(null);
        setError('');
        onImageUploaded?.('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="image-upload-wrapper">
            {preview ? (
                <div className="image-upload-preview-container">
                    <img src={preview} alt="Preview del material" className="image-upload-preview" />
                    {uploading && (
                        <div className="image-upload-overlay">
                            <div className="image-upload-spinner" />
                            <span>Subiendo...</span>
                        </div>
                    )}
                    {!uploading && (
                        <button
                            type="button"
                            className="image-upload-remove-btn"
                            onClick={handleRemove}
                            title="Eliminar imagen"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ) : (
                <div
                    className={`image-upload-dropzone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                    onClick={() => !uploading && inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    {uploading ? (
                        <>
                            <div className="image-upload-spinner" />
                            <p className="image-upload-hint">Subiendo imagen...</p>
                        </>
                    ) : (
                        <>
                            <div className="image-upload-icon">🖼️</div>
                            <p className="image-upload-text">
                                Arrastra una imagen aquí o <span className="image-upload-link">haz clic</span>
                            </p>
                            <p className="image-upload-hint">JPG, PNG, WEBP o GIF · Máx 5 MB</p>
                        </>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={handleInputChange}
            />

            {error && <p className="image-upload-error">{error}</p>}
        </div>
    );
};

export default ImageUpload;
