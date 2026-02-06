---
description: quatrième partie des intructionsapi
---


#### 2.8.3 `POST /api/v1/files/upload/direct`
- **But :** Permet d'uploader un fichier directement et récupérer un lien du fichier upload
- **Requête :**
```
POST /api/v1/files/upload/direct
```

```bash
curl -X 'POST' \
  'https://qa.gateway.intelligenceindustrielle.com/api/v1/files/upload/direct' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer token' \
  -H 'Content-Type: multipart/form-data' \
  -F 'files=@instruction_API(3).md;type=text/markdown' \
  -F 'path=uploads/documents'
```

- **Format de réponse :**
```json
{
  "success": true,
  "files": [
    {
      "originalName": "instruction_API(3).md",
      "rawOriginalName": "instruction_API(3).md",
      "url": "https://ii-file.tor1.digitaloceanspaces.com/slidefabrik/e814303a-3a6e-46fc-9e74-64408e52677f/uploads/documents/instruction_API(3)_1755200224277_c5aa5853.md",
      "path": "slidefabrik/e814303a-3a6e-46fc-9e74-64408e52677f/uploads/documents/instruction_API(3)_1755200224277_c5aa5853.md",
      "size": 31517,
      "type": "text/markdown",
      "uploadSuccess": true,
      "timestamp": 1755200224277,
      "etag": "\"495a3df6f4cc715003a883288927faa3\"",
      "index": 0
    }
  ],
  "summary": {
    "totalFiles": 1,
    "successful": 1,
    "failed": 0,
    "totalSize": 31517
  },
  "uploadPath": "slidefabrik/e814303a-3a6e-46fc-9e74-64408e52677f/uploads/documents"
}
```

#### 2.8.4 `POST /api/v1/files/image/describe`
- **But :** Permet de décrire une image
- **Requête** :
```bash
curl -X 'POST' \
  'https://qa.gateway.intelligenceindustrielle.com/api/v1/files/image/describe' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer token' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@67f8154df458dbf810d4a56b_Leonardo_Phoenix_09_Close_up_an_ultradark_minimalist_Pixarstyl_0 (7).jpg;type=image/jpeg'
```
- **Format de réponse :**
```json
{
  "success": true,
  "results": [
    {
      "description": "Description détaillée de l'image"
    }
  ]
}
```
#### 2.8.5 `POST /api/v1/files/pdf/extract`
- **But :** Permet d'extraire le texte d'un PDF
- **Requête :**
```bash
curl -X 'POST' \
  'https://qa.gateway.intelligenceindustrielle.com/api/v1/files/pdf/extract' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer token' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@Adapter une API REST au protocole MCP (Node.js_TypeScript).pdf;type=application/pdf'
```
- **Format de réponse**
```json
{
  "success": true,
  "results": [
    {
      "text": "Ceci est un exemple de texte extrait d'un document PDF. Il contient plusieurs paragraphes de texte formaté qui ont été extraits avec succès. Le texte peut contenir des sauts de ligne et des caractères spéciaux.\n\nCe deuxième paragraphe montre comment le texte est structuré dans la réponse. Il peut contenir des informations importantes extraites du document original."
    }
  ]
}
```

#### 2.8.6 `POST /api/v1/files/upload/multipart`
- **But :** Créer une session d'upload multipart (TUS) pour fichiers volumineux avec reprise sur erreur
- **Requête :**
```
POST /api/v1/files/upload/multipart
```
- **Headers requis :**
```
Tus-Resumable: 1.0.0
Upload-Length: 1048576
Upload-Metadata: filename dGVzdC5tcDQ=,contentType dmlkZW8vbXA0
Authorization: Bearer token
```
- **Format de réponse (201 Created) :**
```
Location: /api/v1/files/upload/multipart/{upload-id}
Tus-Resumable: 1.0.0
Upload-Offset: 0
X-Public-Url: https://bucket.region.digitaloceanspaces.com/path/file.mp4
X-S3-Key: path/file.mp4
```

#### 2.8.7 `PATCH /api/v1/files/upload/multipart/{upload-id}`
- **But :** Uploader un chunk de fichier pour une session d'upload multipart existante
- **Requête :**
```
PATCH /api/v1/files/upload/multipart/{upload-id}
```
- **Headers requis :**
```
Tus-Resumable: 1.0.0
Upload-Offset: 0
Content-Type: application/offset+octet-stream
Content-Length: 1048576
Authorization: Bearer token
```
- **Body :** Données binaires du chunk
- **Format de réponse (204 No Content) :**
```
Tus-Resumable: 1.0.0
Upload-Offset: 1048576
Upload-Length: 10485760
X-Public-Url: https://bucket.region.digitaloceanspaces.com/path/file.mp4 (si upload terminé)
X-S3-Key: path/file.mp4
```

#### 2.8.8 `GET /api/v1/files/upload/multipart/{upload-id}`
- **But :** Vérifier le statut d'un upload multipart (TUS)
- **Requête :**
```
GET /api/v1/files/upload/multipart/{upload-id}
```
- **Headers requis :**
```
Tus-Resumable: 1.0.0
Authorization: Bearer token
```
- **Format de réponse :**
```
Tus-Resumable: 1.0.0
Upload-Length: 10485760
Upload-Offset: 5242880
Upload-Metadata: filename dGVzdC5tcDQ=,contentType dmlkZW8vbXA0
X-Public-Url: https://bucket.region.digitaloceanspaces.com/path/file.mp4 (si upload terminé)
X-S3-Key: path/file.mp4
```

#### 2.8.9 `POST /api/v1/files/video/process`
- **But :** Traiter une vidéo (transcodage, normalisation) via URL ou upload direct
- **Requête :**
```
POST /api/v1/files/video/process
```
- **Body (mode JSON avec URL) :**
```json
{
  "url": "https://bucket.region.digitaloceanspaces.com/path/video.mp4",
  "resolution": "original",
  "preset": "ultrafast",
  "normalize": false
}
```
- **Body (mode multipart/form-data) :**
```
files: [fichier vidéo]
path: "videos/user-123" (optionnel)
resolution: "original" (optionnel: original, 480p, 720p, 1080p)
```
- **Format de réponse :**
```json
{
  "success": true,
  "url": "https://bucket.region.digitaloceanspaces.com/path/video.mp4",
  "metadata": {
    "originalSize": 1420409880,
    "processedSize": 125000000,
    "duration": 176.42,
    "normalized": true,
    "preset": "ultrafast",
    "resolution": "original"
  },
  "uploadResult": {
    "streamed": true,
    "etag": "\"eb5765ff3a3e793cabdbc422f752050d\"",
    "uploadSuccess": true
  }
}
```

#### 2.8.10 `POST /api/v1/files/upload/generate/presigned-url`
- **But :** Générer des URL pré-signées pour un upload direct vers Spaces
- **Requête :**
```
POST /api/v1/files/upload/generate/presigned-url
```
- **Body (mode simple - un fichier) :**
```json
{
  "fileName": "demo.mp4",
  "contentType": "video/mp4",
  "path": "videos/user-123",
  "expiresIn": 3600,
  "metadata": {
    "tag": "marketing",
    "campaign": "spring"
  }
}
```
- **Body (mode multiple) :**
```json
{
  "files": [
    {
      "fileName": "photo1.jpg",
      "contentType": "image/jpeg"
    },
    {
      "fileName": "video2.mp4",
      "contentType": "video/mp4"
    }
  ],
  "path": "uploads/batch-456",
  "expiresIn": 3600
}
```
- **Format de réponse (mode simple) :**
```json
{
  "success": true,
  "url": "https://bucket.region.digitaloceanspaces.com/upload/path/app_1/grant_2/demo_1699450012345_UUID.mp4?X-Amz-Algorithm=...",
  "filePath": "app_1/grant_2/upload/path/demo_1699450012345_UUID.mp4",
  "publicUrl": "https://bucket.region.digitaloceanspaces.com/app_1/grant_2/upload/path/demo_1699450012345_UUID.mp4",
  "expiresAt": "2025-01-01T10:15:30.000Z",
  "expiresIn": 3600,
  "uploadPath": "app_1/grant_2/upload/path"
}
```
- **Format de réponse (mode multiple) :**
```json
{
  "success": true,
  "urls": [
    {
      "preSignedUrl": "https://bucket.region.digitaloceanspaces.com/...photo1_UUID.jpg?X-Amz-Algorithm=...",
      "filePath": "app_1/grant_2/uploads/batch-456/photo1_UUID.jpg",
      "publicUrl": "https://bucket.region.digitaloceanspaces.com/app_1/grant_2/uploads/batch-456/photo1_UUID.jpg",
      "expiresAt": "2025-01-01T10:20:00.000Z",
      "expiresIn": 3600,
      "fileName": "photo1_UUID.jpg",
      "originalFileName": "photo1.jpg"
    }
  ],
  "uploadPath": "app_1/grant_2/uploads/batch-456",
  "expiresIn": 3600,
  "count": 2
}
```

#### 2.8.11 `POST /api/v1/files/gifs/generate`
- **But :** Générer des GIFs ou captures d'écran à partir d'une vidéo
- **Requête :**
```
POST /api/v1/files/gifs/generate
```
- **Body :**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "timestamps": [
    {
      "start": "00:00:05",
      "duration": 3,
      "type": "gif",
      "name": "intro"
    },
    {
      "start": "00:00:10",
      "end": "00:00:13",
      "type": "gif",
      "name": "mid"
    },
    {
      "start": "00:01:10",
      "type": "screenshot",
      "name": "keyframe"
    }
  ],
  "options": {
    "uploadPath": "gifs-generated",
    "resolution": "720p",
    "fps": 10
  }
}
```
- **Format de réponse :**
```json
{
  "success": true,
  "requestId": "req_abc123",
  "processed": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "filePath": "temp/gifs/gif_1234567890_abc123.gif",
      "fileSize": 1234567,
      "duration": 3,
      "resolution": "1280x720",
      "url": "https://storage.example.com/bucket/path/filename.gif",
      "uploadSuccess": true,
      "name": "intro"
    }
  ],
  "errors": []
}
```

### 2.9 `Billing`

Les routes `/billing` permettent de gérer la facturation Stripe, les abonnements et la consommation de fonctionnalités.

> **Note :** Ces routes nécessitent des headers additionnels :
> - `x-user-id` : ID de l'utilisateur
> - `x-application` : Identifiant de l'application
> - `x-org-id` : ID de l'organisation

#### 2.9.1 `POST /api/v1/billing/stripe/checkout-session`
- **But :** Créer une session de checkout Stripe pour le paiement
- **Requête :**
```
POST /api/v1/billing/stripe/checkout-session
```
- **Headers :**
```
x-user-id: uuid-user
x-application: app-identifier
x-org-id: uuid-org
Authorization: Bearer token
```
- **Body :**
```json
{
  "plan_code": "premium_monthly"
}
```
- **Format de réponse :**
```json
{
  "session_id": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
}
```

#### 2.9.2 `POST /api/v1/billing/stripe/portal-session`
- **But :** Créer une session du portail client Stripe pour la gestion des abonnements
- **Requête :**
```
POST /api/v1/billing/stripe/portal-session
```
- **Headers :**
```
x-user-id: uuid-user
x-application: app-identifier
x-org-id: uuid-org
Authorization: Bearer token
```
- **Body :**
```json
{
  "redirect_url": "https://example.com/billing"
}
```
- **Format de réponse :**
```json
{
  "session_id": "bps_1234567890",
  "url": "https://billing.stripe.com/p/session_1234567890"
}
```

#### 2.9.3 `GET /api/v1/billing/entitlements`
- **But :** Récupérer les droits d'accès de l'utilisateur/organisation
- **Requête :**
```
GET /api/v1/billing/entitlements
```
- **Headers :**
```
x-user-id: uuid-user
x-application: app-identifier
x-org-id: uuid-org
Authorization: Bearer token
```
- **Format de réponse :**
```json
{
  "entitlements": [
    {
      "feature": "ai_generation",
      "enabled": true,
      "limit": 1000,
      "used": 150
    },
    {
      "feature": "data_storage",
      "enabled": true,
      "limit": 10000,
      "used": 2500
    }
  ]
}
```

#### 2.9.4 `GET /api/v1/billing/balance`
- **But :** Récupérer le solde de facturation pour une fonctionnalité spécifique
- **Requête :**
```
GET /api/v1/billing/balance?feature_key=ai_generation
```
- **Headers :**
```
x-user-id: uuid-user
x-application: app-identifier
x-org-id: uuid-org
Authorization: Bearer token
```
- **Query Parameters :**
  - `feature_key` (optionnel) : Clé de la fonctionnalité (ex: "ai_generation")
- **Format de réponse :**
```json
{
  "balance": 850,
  "feature": "ai_generation",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### 2.9.5 `POST /api/v1/billing/consume`
- **But :** Consommer des unités de facturation pour une fonctionnalité
- **Requête :**
```
POST /api/v1/billing/consume
```
- **Headers :**
```
x-user-id: uuid-user
x-application: app-identifier
x-org-id: uuid-org
Authorization: Bearer token
```
- **Body :**
```json
{
  "feature_key": "ai_generation",
  "amount": 1,
  "metadata": {
    "model": "gpt-4",
    "tokens": 150
  }
}
```
- **Format de réponse :**
```json
{
  "success": true,
  "remaining_balance": 849,
  "consumed": 1
}
```

> **Note :** En cas de solde insuffisant (402 Payment Required), la réponse sera :
> ```json
> {
>   "error": "Insufficient balance",
>   "required_balance": 1,
>   "current_balance": 0
> }
> ```
