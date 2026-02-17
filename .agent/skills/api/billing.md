# API Billing Skills

### `Billing`

Les routes `/billing` permettent de gérer la facturation Stripe, les abonnements et la consommation de fonctionnalités.

> **Note :** Ces routes nécessitent des headers additionnels :
> - `x-user-id` : ID de l'utilisateur
> - `x-application` : Identifiant de l'application
> - `x-org-id` : ID de l'organisation

#### `POST /api/v1/billing/stripe/checkout-session`
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

#### `POST /api/v1/billing/stripe/portal-session`
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

#### `GET /api/v1/billing/entitlements`
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

#### `GET /api/v1/billing/balance`
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

#### `POST /api/v1/billing/consume`
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
