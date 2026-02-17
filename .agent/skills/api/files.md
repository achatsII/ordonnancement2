# API Files Skills

### `Files`

#### `POST /api/v1/files/audio/transcribe`
- **But :** Permet de transcrire un fichier audio

Cette route reçoit un fichier audio ou un champ `audio_url` et renvoie un **texte brut** (sans JSON) contenant la transcription.
##### Conseils et configuration pour l'enregistrement audio
1. **Configuration MediaRecorder optimisée pour iOS**
- Mono (`channelCount: 1`)
- Fréquence d'échantillonnage : 44.1 kHz
- Bitrate réduit à 32 kbps via `audioBitsPerSecond: 32000`
- Traitement audio activé (echoCancellation, autoGainControl, noiseSuppression)
2. **Stratégie de buffering**
- Découpage en micro-chunks de 50 ms via `mediaRecorder.start(50)` pour éviter les problèmes de mémoire tampon sur Safari iOS.
3. **Détection dynamique du format**
- Évaluer le MIME type supporté par le navigateur
- Adapter automatiquement l'extension lors de l'envoi POST (webm / wav / mp4 / aac)
4. **Envoi FormData**
```javascript
formData.append('file', audioBlob, `recording_${timestamp}.${fileExtension}`);
fetch(endpoint, { method: 'POST', body: formData });
```
5. **Gestion timeout**
- Implémenter un `AbortController` avec un timeout de 30 s pour les environnements iOS instables.
**Avantage technique** : la combinaison du micro-buffering et du bitrate réduit contourne les limitations de WebKit sur iOS, tout en conservant une qualité suffisante pour les moteurs de transcription.
**Exemple** :
```
curl -X POST \
-F "file=@monAudio.wav" \
```
*(Réponse : texte brut.)*

L'idée est d'ajouter un bouton ou icône micro dans vos champs texte : lorsqu'on enregistre un audio, on l'envoie à cet endpoint puis on **ajoute** (sans remplacer) la transcription obtenue dans la zone de saisie.

#### `POST /api/v1/files/upload/generate/link`
- **But :** Générer un lien d'upload sécurisé
- **Requête :**
```
POST /api/v1/files/upload/generate/link
```
- **Body :**
```json
{
  "path": "video-guide/guide1",
  "allowedTypes": [
    "image",
    "video"
  ],
  "maxFiles": 3,
  "redirectUri": "https://www.youtube.com/callback",
  "validationToken": "test-token-123456"
}
```

- **Explication :**
Génère un lien temporaire sécurisé pour l'upload de fichiers.
Cette route permet de créer une URL temporaire chiffrée qui peut être utilisée pour permettre l'upload de fichiers par des utilisateurs sans exposer directement les credentials de stockage.
Redirection après upload:
- Si `redirectUri` est fournie, l'interface d'upload redirige automatiquement l'utilisateur à la fin du téléversement
- Les données sont transmises en Base64 avec le format : `{baseUrl, files: ["nom1.ext", "nom2.ext"]}`

- **Format de réponse :**
```json
{
  "finalPath": "test-s3/a091f298-2f2e-414b-966d-4d55b5ef2fc0/video-guide/guide1",
  "redirectUri": "https://www.youtube.com/callback",
  "restrictions": {
    "allowedTypes": [
      "image",
      "video"
    ],
    "maxFiles": 3,
    "supportedMimeTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/webm",
      "video/quicktime"
    ]
  },
  "success": true,
  "uploadUrl": "http://uploads.tools.intelligenceindustrielle.com/u/50d5c66a60f556a0d9b56bac79add922:40f33eef9b5743112d29da0731ee7033033af4bc702a6a3eb76033a6dc2e32cf447dc09bd244a3d709603bc3141b557221093f0deb8d62a295953ee317ad7ac9346478dfc4f3530841d822a9c573c82f4cfe2fb93f8bb14471883da8454ef2edba090d95d83ca27ddeb12897b60441f9ac344d3da104b758d9b4f4fdacb55e12eb40f40579c13849aea8bd9ab2ee591d38a3ad2c5ebc0d7b7a4a8027ec631bdc706a558227efcf295a8c9010e7d1fcec2735f4bbb6e11a365aef3f1aac34a8ce285f0980df6ee19232138d681f63c599768877ced198eb5bfb45441425e1750b05cb69259f1607cf6835a274aa007d98",
  "validationToken": "test-token-123456"
}
```

#### `POST /api/v1/files/upload/direct`
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

#### `POST /api/v1/files/image/describe`
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
#### `POST /api/v1/files/pdf/extract`
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

#### `POST /api/v1/files/upload/multipart`
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

#### `PATCH /api/v1/files/upload/multipart/{upload-id}`
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

#### `GET /api/v1/files/upload/multipart/{upload-id}`
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

#### `POST /api/v1/files/video/process`
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

#### `POST /api/v1/files/upload/generate/presigned-url`
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

#### `POST /api/v1/files/gifs/generate`
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
