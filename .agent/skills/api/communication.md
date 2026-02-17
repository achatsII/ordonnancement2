# API Communication Skills

### `Communication`

#### `POST /api/v1/communication/sms`
- **But :** Envoyer un SMS, le numéro doit forcément commencer par +1
- **Requête :**
```
POST /api/v1/communication/sms
```
- **Body :**
```json
{
  "receiver": "+19876543211",
  "message": "Bonjour, ceci est un test SMS depuis l'API !"
}
```
- **Format de réponse :**
```json
{
	"success": true
}
```

#### `POST /api/v1/communication/call`
- **But :** Envoyer un SMS un numéro, le numéro doit forcément commencer par +1
- **Requête :**
```
POST /api/v1/communication/call
```
- **Body :**
```json
{
  "receiver": "+19876543211"
}
```
- **Format de réponse :**
```json
{
  "success": true,
  "results": [
    {
      "status": "Appel effectué avec succès"
    }
  ]
}
```

#### `POST /api/v1/communication/email`
- **But :** Envoyer un email
- **Requête**
```
POST /api/v1/communication/email
```
- **Body :**
```json
{
  "recipients": "destinataire1@example.com,destinataire2@example.com",
  "cc": "cc1@example.com",
  "bcc": "bcc1@example.com",
  "subject": "Sujet de l'email",
  "body": "Contenu de l'email.",
  "body_type": "html"
}
```
