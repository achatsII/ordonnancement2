---
description: cinquième et dernière partie des instructions système
---

### 2.10 `Redirect`

Les routes `/redirect` permettent de créer des liens publics de redirection avec génération de tokens d'accès.

#### 2.10.1 `POST /api/v1/redirect/create`
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

#### 2.10.2 `GET /api/v1/redirect/{uuid}`
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


Voici le bearer token pour ces endpoints là à mettre en dur : 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InZUZHJUTTNzQmRRcmtmb0oifQ.eyJpc3MiOiJodHRwczovL3BiY3Vzam5reGJ5aWtyZ293YXRjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3NmYxYjY5Yy05YmQyLTRjY2UtOTlhNC1kMGNkOTdjNTk5MzkiLCJhdWQiOiJ2MCIsImlhdCI6MTc2Mjk4MzgxMiwiZXhwIjoyMDc4NTUzMzMyLCJlbWFpbCI6InYwQGV4YW1wbGUuY29tIiwiZ3JhbnRfaWQiOiJhZTFiYTkzMC1jNDQyLTQwNTMtYjhhOC04MzZlZDM0MGEzYzgiLCJvcmdhbml6YXRpb24iOnsiaWQiOiJjMjE3OWJiNC03OGQyLTRmZWMtYjU0Zi01YTE4MDg3MDY0NjUiLCJuYW1lIjoiRMOpdmVsb3BwZXVyIHYwIiwicm9sZSI6InVzZXIifSwiYXBwbGljYXRpb24iOnsiaWQiOiIyNGE1MWQxYi04MzkyLTQzN2UtODE3MS0zZWU3MDJhOTJjNzciLCJuYW1lIjoiUHJvamV0IHYwIiwiaWRlbnRpZmllciI6InYwIn0sInJvbGUiOiJ1c2VyIiwic2NvcGVzIjpbIioiXSwibWV0YWRhdGEiOnt9fQ.V5zrL3u2z6HGhMkzBCjlozc-CEtYQicPwGbBkCEfaFs