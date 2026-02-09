# 🌩️ Integración con Cloudinary - Arquitectura de Upload

**Fecha**: Febrero 9, 2026  
**Versión**: 1.0.0

---

## 📑 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Flujo de Upload Paso a Paso](#flujo-de-upload-paso-a-paso)
4. [Implementación Backend (FastAPI)](#implementación-backend-fastapi)
5. [Implementación Mobile (React Native)](#implementación-mobile-react-native)
6. [Seguridad](#seguridad)
7. [Metadata en Base de Datos](#metadata-en-base-de-datos)
8. [Casos de Uso](#casos-de-uso)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

### Problema a Resolver

Los brigadistas capturan archivos (INE, firmas, fotos) **offline**, pero necesitamos:

- ✅ Almacenar archivos en Cloudinary (no en DB)
- ✅ Upload seguro con autorización del backend
- ✅ Mantener referencias en BD
- ✅ Vincular archivos a respuestas de encuestas
- ✅ Minimizar tráfico de datos

### Solución: Upload Firmado con Cloudinary

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUJO DE UPLOAD SEGURO                         │
└──────────────────────────────────────────────────────────────────┘

1. CAPTURA OFFLINE (Mobile)
   ┌─────────────────┐
   │ 📱 Mobile App   │ → Captura foto INE
   │                 │ → Guarda en FileSystem local
   │                 │ → Registra en SQLite (sync_status='pending')
   └─────────────────┘

2. REQUEST UPLOAD PERMISSION (Mobile → Backend)
   ┌─────────────────┐         ┌──────────────────┐
   │ 📱 Mobile App   │────────►│ 🖥️ FastAPI       │
   │                 │  POST   │                  │
   │ file_metadata   │  /api/  │ Valida usuario   │
   │ (nombre, tipo,  │  files/ │ Valida encuesta  │
   │  tamaño)        │  request│ Valida permisos  │
   └─────────────────┘  -upload└──────────────────┘
                                        │
                                        ▼
3. GENERATE SIGNED UPLOAD (Backend → Mobile)
   ┌──────────────────┐
   │ 🖥️ FastAPI       │
   │                  │ → Genera firma Cloudinary
   │ Cloudinary SDK   │ → Crea public_id único
   │                  │ → Define transformaciones
   │                  │ → Responde con:
   │                  │   • signature
   │                  │   • timestamp
   │                  │   • api_key
   │                  │   • upload_url
   │                  │   • public_id
   └──────────────────┘
            │
            │ Respuesta JSON
            ▼
   ┌─────────────────┐
   │ 📱 Mobile App   │ ← Recibe signed params
   └─────────────────┘

4. DIRECT UPLOAD TO CLOUDINARY (Mobile → Cloudinary)
   ┌─────────────────┐         ┌──────────────────┐
   │ 📱 Mobile App   │────────►│ ☁️ Cloudinary     │
   │                 │  POST   │                  │
   │ Archivo +       │  (HTTP  │ Valida signature │
   │ Signed params   │  Multipart)                │
   └─────────────────┘         └──────────────────┘
                                        │
                                        │ Upload exitoso
                                        ▼
                               ┌──────────────────┐
                               │ ☁️ Cloudinary     │
                               │                  │
                               │ Retorna:         │
                               │ • secure_url     │
                               │ • public_id      │
                               │ • resource_type  │
                               │ • format         │
                               │ • bytes          │
                               └──────────────────┘
                                        │
                                        ▼
5. CONFIRM UPLOAD (Mobile → Backend)
   ┌─────────────────┐         ┌──────────────────┐
   │ 📱 Mobile App   │────────►│ 🖥️ FastAPI       │
   │                 │  POST   │                  │
   │ cloudinary_     │  /api/  │ Guarda metadata  │
   │ response        │  files/ │ en PostgreSQL    │
   │                 │  confirm│                  │
   └─────────────────┘         └──────────────────┘
            │
            │ Actualiza SQLite local
            ▼
   ┌─────────────────┐
   │ 📱 Mobile App   │
   │                 │ → sync_status = 'uploaded'
   │ SQLite          │ → remote_url = secure_url
   └─────────────────┘
```

---

## 🏗️ Arquitectura del Sistema

### Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  FileCapture     │  │  FileRepository  │  │  SyncService │  │
│  │  Component       │→ │  (SQLite)        │→ │  (Upload)    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│         │                       │                      │         │
│         │ Local Storage         │ Metadata             │ Upload  │
│         ▼                       ▼                      ▼         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  FileSystem      │  │  SQLite DB       │  │  HTTP Client │  │
│  │  (Expo)          │  │  local_files     │  │  (axios)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ API Calls
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Auth            │  │  File Upload     │  │  Database    │  │
│  │  Middleware      │→ │  Controller      │→ │  Repository  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                │                      │          │
│                                │ Generate Signature   │ Save     │
│                                ▼                      ▼          │
│                       ┌──────────────────┐  ┌──────────────┐   │
│                       │  Cloudinary SDK  │  │  PostgreSQL  │   │
│                       └──────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ SDK Call
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CLOUDINARY CDN                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Upload API      │  │  Storage         │  │  Transformations││
│  │  /upload         │→ │  (Images/PDFs)   │→ │  (Resize, etc) ││
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Flujo de Upload Paso a Paso

### Paso 1: Request Upload Permission (Mobile → Backend)

**Endpoint**: `POST /api/v1/files/request-upload`

**Request Body**:

```json
{
  "file_id": "uuid-1234",
  "response_id": "response-uuid-5678",
  "file_type": "ine_front",
  "question_id": "q3-ine",
  "file_name": "ine_front.jpg",
  "file_size": 2048576,
  "mime_type": "image/jpeg",
  "metadata": {
    "device_id": "device-abc123",
    "captured_at": "2026-02-09T10:30:00Z",
    "gps_latitude": 19.4326,
    "gps_longitude": -99.1332
  }
}
```

**Backend Validations**:

1. ✅ Usuario autenticado (JWT token)
2. ✅ Usuario tiene permisos de brigadista
3. ✅ Response exists y pertenece al usuario
4. ✅ File type es válido (ine_front, ine_back, signature, photo, file)
5. ✅ File size dentro de límites (max 10MB)
6. ✅ MIME type permitido (image/jpeg, image/png, application/pdf)

---

### Paso 2: Generate Signed Upload (Backend)

**Backend genera firma Cloudinary**:

```python
# backend/app/services/cloudinary_service.py
import cloudinary
import cloudinary.uploader
from datetime import datetime, timedelta

def generate_upload_signature(
    file_id: str,
    file_type: str,
    response_id: str,
    user_id: str
) -> dict:
    # 1. Configurar Cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET
    )

    # 2. Generar public_id único y organizado
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    public_id = f"brigada/responses/{response_id}/{file_type}_{file_id}_{timestamp}"

    # 3. Definir parámetros de upload
    upload_params = {
        "public_id": public_id,
        "folder": "brigada/responses",
        "resource_type": "auto",  # Detecta tipo automáticamente
        "timestamp": int(datetime.utcnow().timestamp()),
        "tags": [
            f"user_{user_id}",
            f"response_{response_id}",
            f"type_{file_type}",
            "brigada_2026"
        ],

        # Transformaciones automáticas
        "transformation": [
            {
                "quality": "auto:good",
                "fetch_format": "auto"
            }
        ],

        # Restricciones de seguridad
        "allowed_formats": ["jpg", "jpeg", "png", "pdf"],

        # Context metadata
        "context": {
            "file_id": file_id,
            "response_id": response_id,
            "user_id": user_id,
            "file_type": file_type,
            "app_version": "1.0.0"
        }
    }

    # 4. Generar firma
    signature = cloudinary.utils.api_sign_request(
        upload_params,
        settings.CLOUDINARY_API_SECRET
    )

    # 5. Retornar parámetros firmados
    return {
        "upload_url": f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/auto/upload",
        "signature": signature,
        "timestamp": upload_params["timestamp"],
        "api_key": settings.CLOUDINARY_API_KEY,
        "public_id": public_id,
        "folder": upload_params["folder"],
        "tags": ",".join(upload_params["tags"]),
        "context": "|".join([f"{k}={v}" for k, v in upload_params["context"].items()]),
        "transformation": "q_auto:good,f_auto",
        "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat()
    }
```

**Response**:

```json
{
  "success": true,
  "data": {
    "upload_url": "https://api.cloudinary.com/v1_1/brigada-cloud/auto/upload",
    "signature": "a1b2c3d4e5f6g7h8i9j0",
    "timestamp": 1707476400,
    "api_key": "123456789012345",
    "public_id": "brigada/responses/response-uuid-5678/ine_front_uuid-1234_20260209_103000",
    "folder": "brigada/responses",
    "tags": "user_user-123,response_response-uuid-5678,type_ine_front,brigada_2026",
    "context": "file_id=uuid-1234|response_id=response-uuid-5678|user_id=user-123|file_type=ine_front|app_version=1.0.0",
    "transformation": "q_auto:good,f_auto",
    "expires_at": "2026-02-09T11:30:00Z"
  }
}
```

---

### Paso 3: Upload to Cloudinary (Mobile → Cloudinary)

**Mobile realiza upload directo**:

```typescript
// mobile/lib/services/cloudinary-upload.service.ts
import * as FileSystem from "expo-file-system";
import axios from "axios";

export class CloudinaryUploadService {
  async uploadFile(
    localPath: string,
    signedParams: CloudinarySignedParams,
  ): Promise<CloudinaryUploadResponse> {
    // 1. Preparar FormData
    const formData = new FormData();

    // Archivo
    formData.append("file", {
      uri: localPath,
      type: "image/jpeg", // O mime_type del archivo
      name: "upload.jpg",
    } as any);

    // Parámetros firmados
    formData.append("signature", signedParams.signature);
    formData.append("timestamp", signedParams.timestamp.toString());
    formData.append("api_key", signedParams.api_key);
    formData.append("public_id", signedParams.public_id);
    formData.append("folder", signedParams.folder);
    formData.append("tags", signedParams.tags);
    formData.append("context", signedParams.context);
    formData.append("transformation", signedParams.transformation);

    // 2. Upload con progress tracking
    try {
      const response = await axios.post(signedParams.upload_url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          console.log(`Upload progress: ${percentCompleted}%`);
          // Emitir evento para UI
          this.emitProgress(percentCompleted);
        },
        timeout: 60000, // 60 segundos
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new CloudinaryUploadError(
          error.response?.data?.error?.message || "Upload failed",
          error.response?.status,
        );
      }
      throw error;
    }
  }
}
```

**Cloudinary Response**:

```json
{
  "public_id": "brigada/responses/response-uuid-5678/ine_front_uuid-1234_20260209_103000",
  "version": 1707476500,
  "signature": "x9y8z7w6v5u4t3s2r1",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2026-02-09T10:35:00Z",
  "tags": [
    "user_user-123",
    "response_response-uuid-5678",
    "type_ine_front",
    "brigada_2026"
  ],
  "bytes": 2048576,
  "type": "upload",
  "etag": "a1b2c3d4e5f6g7h8i9j0",
  "placeholder": false,
  "url": "http://res.cloudinary.com/brigada-cloud/image/upload/v1707476500/brigada/responses/response-uuid-5678/ine_front_uuid-1234_20260209_103000.jpg",
  "secure_url": "https://res.cloudinary.com/brigada-cloud/image/upload/v1707476500/brigada/responses/response-uuid-5678/ine_front_uuid-1234_20260209_103000.jpg",
  "context": {
    "custom": {
      "file_id": "uuid-1234",
      "response_id": "response-uuid-5678",
      "user_id": "user-123",
      "file_type": "ine_front",
      "app_version": "1.0.0"
    }
  }
}
```

---

### Paso 4: Confirm Upload (Mobile → Backend)

**Endpoint**: `POST /api/v1/files/confirm-upload`

**Request Body**:

```json
{
  "file_id": "uuid-1234",
  "cloudinary_response": {
    "public_id": "brigada/responses/response-uuid-5678/ine_front_uuid-1234_20260209_103000",
    "secure_url": "https://res.cloudinary.com/brigada-cloud/image/upload/v1707476500/...",
    "resource_type": "image",
    "format": "jpg",
    "bytes": 2048576,
    "width": 1920,
    "height": 1080,
    "created_at": "2026-02-09T10:35:00Z"
  }
}
```

**Backend guarda en PostgreSQL**:

```sql
INSERT INTO response_files (
  file_id,
  response_id,
  file_type,
  question_id,
  cloudinary_public_id,
  cloudinary_secure_url,
  cloudinary_resource_type,
  file_format,
  file_size,
  width,
  height,
  uploaded_by_user_id,
  uploaded_at,
  metadata
) VALUES (
  'uuid-1234',
  'response-uuid-5678',
  'ine_front',
  'q3-ine',
  'brigada/responses/response-uuid-5678/ine_front_uuid-1234_20260209_103000',
  'https://res.cloudinary.com/brigada-cloud/image/upload/v1707476500/...',
  'image',
  'jpg',
  2048576,
  1920,
  1080,
  'user-123',
  '2026-02-09T10:35:00Z',
  '{"device_id": "device-abc123", "gps_latitude": 19.4326, "gps_longitude": -99.1332}'::jsonb
);
```

**Mobile actualiza SQLite**:

```typescript
await fileRepository.markAsUploaded(
  "uuid-1234",
  "https://res.cloudinary.com/brigada-cloud/image/upload/v1707476500/...",
);
```

---

## 🔐 Seguridad

### 1. Autenticación y Autorización

```typescript
// Backend: Endpoint protegido
@router.post("/files/request-upload")
async def request_upload(
    file_request: FileUploadRequest,
    current_user: User = Depends(get_current_active_user)
):
    # 1. Verificar que el usuario es brigadista
    if current_user.role not in ['brigadista', 'admin']:
        raise HTTPException(
            status_code=403,
            detail="Only brigadistas can upload files"
        )

    # 2. Verificar que la respuesta pertenece al usuario
    response = await get_response(file_request.response_id)
    if response.brigadista_user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only upload files to your own responses"
        )

    # 3. Verificar límites
    if file_request.file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=413,
            detail="File size exceeds 10MB limit"
        )

    # 4. Generar firma
    signed_params = cloudinary_service.generate_upload_signature(
        file_id=file_request.file_id,
        file_type=file_request.file_type,
        response_id=file_request.response_id,
        user_id=current_user.id
    )

    return {"success": True, "data": signed_params}
```

### 2. Firma Cloudinary (Signed Upload)

**¿Por qué usar signed uploads?**

- ✅ Previene uploads no autorizados
- ✅ Backend controla parámetros (public_id, tags, transformations)
- ✅ Expira después de 1 hora
- ✅ Solo el backend conoce el API Secret

**Validación de firma**:

```python
# Cloudinary valida automáticamente
# Si la firma no coincide, retorna error 401
```

### 3. Restricciones de Cloudinary

```python
upload_params = {
    # Solo estos formatos permitidos
    "allowed_formats": ["jpg", "jpeg", "png", "pdf"],

    # Tamaño máximo (10MB)
    "max_file_size": 10485760,

    # Tipo de recurso
    "resource_type": "auto",  # Solo imágenes y PDFs

    # Expira en 1 hora
    "timestamp": int(datetime.utcnow().timestamp())
}
```

### 4. Rate Limiting

```python
# Backend: Rate limiting por usuario
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/files/request-upload")
@limiter.limit("10/minute")  # Máximo 10 requests por minuto
async def request_upload(...):
    ...
```

### 5. Validación de Metadata

```python
# Backend valida metadata antes de confirmar
@router.post("/files/confirm-upload")
async def confirm_upload(
    confirmation: FileUploadConfirmation,
    current_user: User = Depends(get_current_active_user)
):
    # 1. Verificar que el public_id pertenece al usuario
    if not confirmation.cloudinary_response.public_id.startswith(
        f"brigada/responses/{confirmation.response_id}"
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid public_id"
        )

    # 2. Verificar que el archivo existe en Cloudinary
    try:
        cloudinary_file = cloudinary.api.resource(
            confirmation.cloudinary_response.public_id
        )
    except cloudinary.exceptions.NotFound:
        raise HTTPException(
            status_code=404,
            detail="File not found in Cloudinary"
        )

    # 3. Guardar en BD
    await save_file_metadata(confirmation)

    return {"success": True}
```

---

## 💾 Metadata en Base de Datos

### PostgreSQL (Backend)

```sql
-- Tabla de archivos en PostgreSQL
CREATE TABLE response_files (
    file_id UUID PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES survey_responses(response_id),
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('photo', 'signature', 'ine_front', 'ine_back', 'file')),
    question_id VARCHAR(100) NOT NULL,

    -- Cloudinary metadata
    cloudinary_public_id VARCHAR(500) NOT NULL UNIQUE,
    cloudinary_secure_url TEXT NOT NULL,
    cloudinary_resource_type VARCHAR(20) NOT NULL,
    cloudinary_version INTEGER,

    -- File metadata
    file_format VARCHAR(10) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,

    -- Upload metadata
    uploaded_by_user_id UUID NOT NULL REFERENCES users(user_id),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Additional metadata (JSON)
    metadata JSONB,

    -- OCR data (solo para INE)
    ine_ocr_data JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Índices
    INDEX idx_response_files_response_id (response_id),
    INDEX idx_response_files_file_type (file_type),
    INDEX idx_response_files_uploaded_by (uploaded_by_user_id)
);

-- Vista para obtener archivos con información de respuesta
CREATE VIEW v_response_files_with_details AS
SELECT
    rf.*,
    sr.survey_id,
    sr.survey_version,
    sr.brigadista_name,
    sr.estado as response_status,
    u.name as uploader_name,
    u.email as uploader_email
FROM response_files rf
JOIN survey_responses sr ON rf.response_id = sr.response_id
JOIN users u ON rf.uploaded_by_user_id = u.user_id;
```

### SQLite (Mobile)

```sql
-- Tabla local (ya existe en schema.sql)
-- Actualizar con nuevos campos

ALTER TABLE local_files ADD COLUMN cloudinary_public_id TEXT;
ALTER TABLE local_files ADD COLUMN cloudinary_version INTEGER;

-- La tabla completa queda:
CREATE TABLE local_files (
    file_id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('photo', 'signature', 'ine_front', 'ine_back', 'file')),
    question_id TEXT NOT NULL,

    -- Local storage
    local_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,

    -- Cloudinary metadata (después de upload)
    cloudinary_public_id TEXT,
    cloudinary_version INTEGER,
    remote_url TEXT,

    -- Sync status
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'uploading', 'uploaded', 'error')),
    uploaded_at TEXT,

    -- OCR data
    ine_ocr_data TEXT,

    -- Thumbnail
    thumbnail_path TEXT,

    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (response_id) REFERENCES responses(response_id) ON DELETE CASCADE
);
```

---

## 🎯 Casos de Uso

### Caso 1: Upload INE con OCR

```typescript
// 1. Capturar INE (offline)
const inePhoto = await cameraService.capturePhoto();

// 2. Guardar localmente
const fileId = await fileRepository.createFile({
  file_id: crypto.randomUUID(),
  response_id: currentResponseId,
  file_type: "ine_front",
  question_id: "q3-ine",
  local_path: inePhoto.uri,
  file_name: "ine_front.jpg",
  mime_type: "image/jpeg",
});

// 3. Procesar OCR (offline con ML Kit o similar)
const ocrData = await ocrService.processINE(inePhoto.uri);
await fileRepository.updateOcrData(fileId, ocrData);

// 4. Cuando hay conexión: Request upload
const signedParams = await apiClient.post("/files/request-upload", {
  file_id: fileId,
  response_id: currentResponseId,
  file_type: "ine_front",
  question_id: "q3-ine",
  file_name: "ine_front.jpg",
  file_size: inePhoto.fileSize,
  mime_type: "image/jpeg",
});

// 5. Upload directo a Cloudinary
const cloudinaryResponse = await cloudinaryUploadService.uploadFile(
  inePhoto.uri,
  signedParams.data,
);

// 6. Confirmar con backend
await apiClient.post("/files/confirm-upload", {
  file_id: fileId,
  cloudinary_response: cloudinaryResponse,
});

// 7. Actualizar local
await fileRepository.markAsUploaded(fileId, cloudinaryResponse.secure_url);
```

### Caso 2: Firma Digital

```typescript
// 1. Capturar firma (offline)
const signature = await signaturePad.toDataURL();

// 2. Convertir a archivo
const signatureFile = await FileSystem.writeAsStringAsync(
  `${FileSystem.documentDirectory}signatures/sig_${Date.now()}.png`,
  signature.split(',')[1],
  { encoding: FileSystem.EncodingType.Base64 }
);

// 3. Guardar localmente
const fileId = await fileRepository.createFile({
  file_id: crypto.randomUUID(),
  response_id: currentResponseId,
  file_type: 'signature',
  question_id: 'q10-firma',
  local_path: signatureFile,
  file_name: 'signature.png',
  mime_type: 'image/png'
});

// 4. Upload cuando hay conexión (mismo flujo que INE)
...
```

### Caso 3: Múltiples Fotos

```typescript
// 1. Capturar múltiples fotos (offline)
const photos = await cameraService.captureMultiplePhotos(5);

// 2. Guardar todas localmente
const fileIds = await Promise.all(
  photos.map((photo) =>
    fileRepository.createFile({
      file_id: crypto.randomUUID(),
      response_id: currentResponseId,
      file_type: "photo",
      question_id: "q7-fotos-vivienda",
      local_path: photo.uri,
      file_name: photo.fileName,
      mime_type: "image/jpeg",
    }),
  ),
);

// 3. Upload batch cuando hay conexión
await syncService.uploadPendingFiles();
```

---

## 🔧 Implementación Completa

### Backend: FastAPI Endpoints

```python
# backend/app/routers/files.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import cloudinary
import cloudinary.uploader
import cloudinary.api

router = APIRouter(prefix="/api/v1/files", tags=["files"])

@router.post("/request-upload")
async def request_upload(
    file_request: FileUploadRequest,
    current_user: User = Depends(get_current_active_user)
) -> FileUploadSignedResponse:
    """
    Generate Cloudinary signed upload parameters
    """
    # Validations
    await validate_upload_request(file_request, current_user)

    # Generate signature
    signed_params = cloudinary_service.generate_upload_signature(
        file_id=file_request.file_id,
        file_type=file_request.file_type,
        response_id=file_request.response_id,
        user_id=current_user.id
    )

    # Log request
    await audit_log_service.log_upload_request(
        user_id=current_user.id,
        file_id=file_request.file_id,
        file_type=file_request.file_type
    )

    return FileUploadSignedResponse(
        success=True,
        data=signed_params
    )

@router.post("/confirm-upload")
async def confirm_upload(
    confirmation: FileUploadConfirmation,
    current_user: User = Depends(get_current_active_user)
) -> FileUploadConfirmResponse:
    """
    Confirm successful upload and save metadata
    """
    # Validate Cloudinary response
    await validate_cloudinary_response(confirmation, current_user)

    # Save to database
    file_record = await file_repository.create_file_record(
        file_id=confirmation.file_id,
        cloudinary_response=confirmation.cloudinary_response,
        user_id=current_user.id
    )

    # Trigger OCR if it's an INE
    if file_record.file_type in ['ine_front', 'ine_back']:
        await ocr_service.process_ine_async(file_record)

    return FileUploadConfirmResponse(
        success=True,
        data=file_record
    )

@router.get("/response/{response_id}")
async def get_response_files(
    response_id: str,
    current_user: User = Depends(get_current_active_user)
) -> List[FileRecord]:
    """
    Get all files for a response
    """
    # Validate access
    response = await response_repository.get_by_id(response_id)
    if response.brigadista_user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    files = await file_repository.get_by_response_id(response_id)
    return files

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user)
) -> DeleteFileResponse:
    """
    Delete file from Cloudinary and database
    """
    # Get file
    file_record = await file_repository.get_by_id(file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    # Validate access
    if file_record.uploaded_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Delete from Cloudinary
    try:
        cloudinary.api.delete_resources([file_record.cloudinary_public_id])
    except Exception as e:
        logger.error(f"Error deleting from Cloudinary: {e}")

    # Delete from database
    await file_repository.delete(file_id)

    return DeleteFileResponse(success=True)
```

### Mobile: Upload Service

```typescript
// mobile/lib/services/file-upload.service.ts
import { fileRepository } from "@/lib/db";
import { apiClient } from "@/lib/api";
import { CloudinaryUploadService } from "./cloudinary-upload.service";

export class FileUploadService {
  private cloudinaryService = new CloudinaryUploadService();

  /**
   * Upload pending files
   */
  async uploadPendingFiles(limit: number = 5): Promise<void> {
    const pendingFiles = await fileRepository.getPendingFiles(limit);

    for (const file of pendingFiles) {
      try {
        await this.uploadFile(file.file_id);
      } catch (error) {
        console.error(`Error uploading file ${file.file_id}:`, error);
        await fileRepository.markUploadError(file.file_id, error.message);
      }
    }
  }

  /**
   * Upload single file
   */
  async uploadFile(fileId: string): Promise<void> {
    // 1. Get file from local DB
    const file = await fileRepository.getFileById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // 2. Check if file exists locally
    const fileInfo = await FileSystem.getInfoAsync(file.local_path);
    if (!fileInfo.exists) {
      throw new Error("Local file not found");
    }

    // 3. Request upload permission
    const signedParamsResponse = await apiClient.post("/files/request-upload", {
      file_id: file.file_id,
      response_id: file.response_id,
      file_type: file.file_type,
      question_id: file.question_id,
      file_name: file.file_name,
      file_size: file.file_size,
      mime_type: file.mime_type,
    });

    const signedParams = signedParamsResponse.data.data;

    // 4. Update status to uploading
    await this.updateUploadStatus(fileId, "uploading");

    // 5. Upload to Cloudinary
    const cloudinaryResponse = await this.cloudinaryService.uploadFile(
      file.local_path,
      signedParams,
    );

    // 6. Confirm with backend
    await apiClient.post("/files/confirm-upload", {
      file_id: fileId,
      cloudinary_response: cloudinaryResponse,
    });

    // 7. Update local DB
    await fileRepository.markAsUploaded(fileId, cloudinaryResponse.secure_url);

    console.log(`✅ File uploaded successfully: ${fileId}`);
  }

  /**
   * Update upload status in local DB
   */
  private async updateUploadStatus(
    fileId: string,
    status: "uploading" | "uploaded" | "error",
  ): Promise<void> {
    const connection = db.getConnection();
    await connection.runAsync(
      "UPDATE local_files SET sync_status = ? WHERE file_id = ?",
      [status, fileId],
    );
  }
}

export const fileUploadService = new FileUploadService();
```

---

## 🐛 Troubleshooting

### Error: "Invalid signature"

**Causa**: Timestamp expiró (>1 hora) o parámetros incorrectos

**Solución**:

```typescript
// Verificar que el timestamp no expiró
const signedParams = await apiClient.post('/files/request-upload', ...);
const expiresAt = new Date(signedParams.data.expires_at);
if (new Date() > expiresAt) {
  // Re-request signed params
  signedParams = await apiClient.post('/files/request-upload', ...);
}
```

### Error: "File too large"

**Causa**: Archivo excede 10MB

**Solución**:

```typescript
// Comprimir imagen antes de upload
import * as ImageManipulator from "expo-image-manipulator";

const compressedImage = await ImageManipulator.manipulateAsync(
  localUri,
  [{ resize: { width: 1920 } }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
);
```

### Error: "Upload failed: Network error"

**Causa**: Sin conexión o timeout

**Solución**:

```typescript
// Retry con exponential backoff
async function uploadWithRetry(
  fileId: string,
  maxRetries: number = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fileUploadService.uploadFile(fileId);
      return;
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`Retry ${attempt}/${maxRetries} in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

---

## 📚 Referencias

- **Cloudinary Upload API**: https://cloudinary.com/documentation/upload_images
- **Signed Uploads**: https://cloudinary.com/documentation/upload_images#signed_uploads
- **Mobile Upload Guide**: https://cloudinary.com/documentation/react_native_integration

---

**✅ CONCLUSIÓN**: Esta arquitectura garantiza uploads seguros, eficientes y escalables con control total del backend sobre las operaciones de almacenamiento.
