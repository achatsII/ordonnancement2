# API Redirect Skills

### `Redirect`

Les routes `/redirect` permettent de créer des liens publics de redirection avec génération de tokens d'accès.

#### `POST /api/v1/redirect/create`
- **But :** Préparer un enregistrement pour un lien public de redirection. Initialise un enregistrement qui **permettra** la création d'un lien public, mais **ne crée pas** directement le lien : il renvoie simplement l'UUID qui identifie ce futur lien.
- **Requête :**
```
POST /api/v1/redirect/create
```
- **Body :**
```json
{
  "redirect_url": "https://app.example.com/redirect",
  "permissions": ["orders:read", "orders:write"],
  "ttl_minutes": 30
}
```
- **Format de réponse :**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": null
}
```

> **Note :** Si `ttl_minutes` n'est pas fourni, l'enregistrement n'a pas d'expiration (`expires_at` sera `null`).

#### `GET /api/v1/redirect/{uuid}`
- **But :** Obtenir un access token via UUID (endpoint public, aucune authentification requise)
- **Requête :**
```
GET /api/v1/redirect/550e8400-e29b-41d4-a716-446655440000
```
- **Format de réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": null,
  "data": {
    "permissions": ["data:read"],
    "role": "guest",
    "app_identifier": "info-display",
    "grant_id": "4a7edf01-36cc-453d-a4f7-31fa0a...",
    "redirect_url_final": "http://example.com/view/1758308849697",
    "usage_count": 6,
    "expires_at": null
  }
}
```

> **Note :** `expires_in` est en secondes avant expiration, ou `null` si aucune expiration. `usage_count` indique le nombre de fois que ce lien a été utilisé.
