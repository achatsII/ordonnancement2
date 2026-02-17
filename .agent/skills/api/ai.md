# API AI Skills

### `AI`

#### `POST /api/v2/ai/files/analyze`

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

#### `POST /api/v2/ai/generate/image`
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

#### `POST /api/v1/ai/generate/video`
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

#### `POST /api/v1/ai/generate/slidefabrik`

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

## **`POST /api/v1/ai/image/remove-background`**

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

## **`POST /api/v1/ai/image/upscale`**

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
