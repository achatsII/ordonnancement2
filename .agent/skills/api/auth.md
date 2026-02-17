# API Auth Skills

### `Auth`

- **But :** Récupérer les informations sur l'utilisateur connecté
- **Requête :**

```
GET /api/v1/auth/me
```

- **Format de réponse :**

```json
{
  "success": true,
  "user": {
    "sub": "12345678-1234-1234-1234-123456789abc"
  },
  "results": {
    "email": "user@example.com",
    "profile": {
      "company": "Example Corp",
      "fullname": "John Doe",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "applications": [
      {
        "id": "app-12345678-1234-1234-1234-123456789abc",
        "name": "Example App",
        "roles": [
          "admin"
        ],
        "scopes": [
          "*"
        ],
        "metadata": {
          "dev": "true",
          "company": "Example Corp"
        }
      }
    ],
    "organization": {
      "id": "org-12345678-1234-1234-1234-123456789abc",
      "name": "Example Organization"
    }
  }
}
```
