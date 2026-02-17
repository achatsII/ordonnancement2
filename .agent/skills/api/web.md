# API Web Skills

### `Web`

#### `POST /api/v1/web/fetch`
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

#### `POST /api/v1/web/search`
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

#### `POST /api/v1/web/screenshot`

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
