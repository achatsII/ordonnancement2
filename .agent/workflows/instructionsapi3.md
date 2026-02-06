---
description: troisieme partie des intructionsapi
---

#### 2.5.2 `POST /api/v1/analytics/query/nl`
- **But :** Faire une requête en language naturel à la base BigQuery
- **Requête :** 
```
POST /api/v1/analytics/query/nl
```
- **Body :**
```json
{
  "query": "Je veux ..."
}
```
- **Format de réponse :**
```json
{
  "success": true,
  "results": [
    {
      "col1": "valeur1",
      "col2": 123
    },
    {
      "col1": "valeur2",
      "col2": 456
    }
  ]
}
```
### 2.6 `Web`

#### 2.6.1 `POST /api/v1/web/fetch`
- **But :** Récupérer le contenu d'une page internet
- **Requête :**
```
POST /api/v1/web/fetch
```
- **Body :**
```json
{
  "url": "https://example.com"
}
```
- **Format de réponse :**
```json
{
  "raw": "string",
  "content": "string"
}
```

#### 2.6.2 `POST /api/v1/web/search`
- **But :** Rechercher sur le web comme avec un moteur de recherche
- **Requête**
```
POST /api/v1/web/search
```
- **Body :**
```json
{
  "query": "intelligence industrielle montreal"
}
```
- **Format de réponse :**
```json
{
  "search_metadata": {
    "id": "string",
    "status": "string",
    "created_at": "2025-08-14T19:22:24.664Z",
    "processed_at": "2025-08-14T19:22:24.664Z",
    "total_time_taken": 0
  },
  "organic_results": [
    {
      "position": 0,
      "title": "string",
      "link": "string",
      "snippet": "string"
    }
  ],
  "recipes_results": [
    {
      "title": "string",
      "link": "string",
      "source": "string",
      "total_time": "string",
      "ingredients": [
        "string"
      ]
    }
  ],
  "shopping_results": [
    {
      "position": 0,
      "title": "string",
      "price": "string",
      "link": "string"
    }
  ],
  "local_results": {
    "places": [
      {
        "position": 0,
        "title": "string",
        "rating": 0,
        "reviews": 0,
        "address": "string"
      }
    ]
  }
}
```

#### 2.6.3 `POST /api/v1/web/screenshot`

* **But :** Capturer une capture d'écran d'un site web ou de tout média accessible par URL (site, PDF, vidéo, etc.)
* **Requête**

```
POST /api/v1/web/screenshot
```

* **Body :**

```json
{
  "websiteUrl": "https://example.com"
}
```

* **Format de réponse :**

```json
{
  "success": true,
  "error": null,
  "results": [
    {
      "name": "2025-12-05T11:40:01.658-05:00_86572d1d-3878-4758-a1b6-c5d5a89a1ec3.png",
      "imageURL": "https://ii-file.tor1.cdn.digitaloceanspaces.com/Puppeteer-Screenshots/2025-12-05T11:40:01.658-05:00_86572d1d-3878-6758-a1b6-c5d5a89a1ec3.png"
    }
  ]
}
```

### 2.7 `AI`

#### 2.7.2 `POST /api/v2/ai/files/analyze`

* **But :** Endpoint pour l’analyse d’un fichier via URL avec sélection du fournisseur (Google ou OpenAI) et du niveau de modèle.
* **Limitation connue:** ne peut pas analyser un fichier plus gros que 400MB.
* **Requête :**

```
POST /api/v2/ai/files/analyze
```

* **Body :**

```json
{
  "prompt": "Analyse ce rapport et identifie les points clés.",
  "fileUrl": "https://example.com/files/report.pdf",
  "provider": "Google",
  "level": "mid"
}
```

* **Format de réponse :**

```json
{
  "success": true,
  "results": [
    {
      "analysis": "Résumé détaillé du contenu du fichier…",
      "model": "gemini-2.5-pro"
    }
  ]
}
```

#### 2.7.2 `POST /api/v2/ai/generate/image`
- **But :** Générer des images en utilisant un fournisseur (`provider`) et un niveau (`level`).

- **Requête :**

````

POST /api/v2/ai/generate/image

````

- **Body :**

```json
{
  "prompt": "Un robot qui joue du piano",
  "provider": "google",
  "level": "mid",
  "width": 1024,
  "height": 1024,
  "quantity": 1,
  "referenceImages": [
    "https://example.com/ref.png",
    "https://example2.com/ref2.jpg"
  ]
}
````

* **Notes :**

  * Champs obligatoires : `prompt`, `provider`, `level`, `width`, `height`.
  * `provider` valeurs supportées : **"google"**.
  * `level` valeurs supportées : **"low"**, **"mid"**, **"high"**.

* **Format de réponse :**

```json
[
  {
    "success": true,
    "results": [
      {
        "name": "a1.jpg",
        "imageURL": "https://ii-file.../a1.jpg",
        "model": "google:3@3",
        "company": "google",
        "type": "Image Generation"
      }
    ]
  }
]
```

#### 2.7.3 `POST /api/v1/ai/generate/video`
- **But :** Générer une vidéo à partir d’un prompt, avec sélection automatique du modèle selon `provider` + `level`.

- **Requête :**

````

POST /api/v1/ai/generate/video

````

- **Body :**

```json
{
  "prompt": "Un oiseau mécanique survole une ville futuriste",
  "provider": "google",
  "level": "high",
  "width": 1280,
  "height": 720,
  "duration": 8,
  "referenceImages": [
    "https://example.com/bird.png"
  ]
}
````

* **Notes importantes :**

  * Champs obligatoires : `prompt`, `provider`, `level`, `duration`, `width`, `height`.
  * `provider` supportés : **"google"**, **"openai"**.
  * `level` supportés : **"low"**, **"mid"**, **"high"**.
  * Les valeurs `width`, `height` et `duration` sont **réinterprétées** pour correspondre aux contraintes du modèle choisi.

* **Format de réponse :**

```json
[
  {
    "success": true,
    "results": [
      {
        "name": "video_abc123.mp4",
        "videoURL": "https://ii-file.../video_abc123.mp4",
        "model": "google:4@1",
        "company": "google",
        "type": "Video Generation"
      }
    ]
  }
]
```

#### 2.7.4 `POST /api/v1/ai/generate/slidefabrik`

- **But :** Générer une présentation PowerPoint via SlideFabrik à partir d'un prompt

- **Requête :**

```
POST /api/v1/ai/generate/slidefabrik

```

- **Body :**

```json

{

  "prompt": "Créer une présentation sur les avantages de notre solution CS 360 pour le client",

  "title": "Présentation CS 360 - Sivaco Québec",

  "customInstructions": "Utiliser un style moderne et professionnel",

  "description": "Présentation pour le client Sivaco Québec",

  "folderName": "test"

}

```

> **Note :** Les champs `customInstructions`, `description` et `folderName` sont optionnels. Si non fournis, ils seront définis à `undefined`.

- **Format de réponse :**

```json

[

  {

    "success": true,

    "slideshow_id": "692f521d8246c35ad8675919",

    "title": "Présentation originale",

    "slide_count": 3,

    "edit_url": "https://slidefabrik.tools.intelligenceindustrielle.com/edit?id=692f521d8246c35ad8675919",

    "share_url_fr": "https://slidefabrik.tools.intelligenceindustrielle.com/play/692f521d8246c35ad8675919?lang=fr",

    "share_url_en": "https://slidefabrik.tools.intelligenceindustrielle.com/play/692f521d8246c35ad8675919?lang=en",

    "created_at": "2025-12-02T20:54:53.659Z",

    "message": "Présentation créée. 3 slide(s) générée(s)."

  }

]

```

## **2.7.5 `POST /api/v1/ai/image/remove-background`**

> Nécessite un token Bearer contenant un scope : `*`, `ai:*` ou `ai:generate`

* **But :** Supprimer automatiquement l’arrière-plan d’une image à partir de son URL.
* **Requête :**

```
POST /api/v1/ai/image/remove-background
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageUrl": "https://example.com/photo.png"
}
```

* **Réponse attendue :**

### **Succès**

```json
{
  "success": true,
  "results": [
    {
      "name": "cleaned_image.png",
      "imageURL": "https://cdn.../cleaned_image.png",
      "type": "Background Removal",
      "cost": 0.002
    }
  ]
}
```

### **Échec**

```json
{
  "success": false,
  "error": {
    "message": "Invalid image URL",
    "code": "bad_request"
  }
}
```

## **2.7.6 `POST /api/v1/ai/image/upscale`**

> Nécessite un token Bearer contenant un scope : `*`, `ai:*` ou `ai:generate`

* **But :** Agrandir et améliorer la qualité d’une image via un facteur d’upscale (`regular` ou `high`).
* **Requête :**

```
POST /api/v1/ai/image/upscale
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageUrl": "https://example.com/photo.png",
  "upscaleFactor": "high"
}
```

* **Réponse attendue :**

### **Succès**

```json
{
  "success": true,
  "results": [
    {
      "name": "upscaled_photo.png",
      "imageURL": "https://cdn.../upscaled_photo.png",
      "type": "Image Upscale",
      "cost": 0.004
    }
  ]
}
```

### **Échec**

```json
{
  "success": false,
  "error": {
    "message": "Unsupported upscale factor",
    "code": "invalid_factor"
  }
}
```

### 2.8 `Files`

#### 2.8.1 `POST /api/v1/files/audio/transcribe`
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

#### 2.8.2 `POST /api/v1/files/upload/generate/link`
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