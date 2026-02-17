# API Assistant Skills

### `Assistant`

Les routes `/assistant` permettent d'accéder aux modèles LLM (GPT d'OpenAI, Gemini de Google (par defaut) et Claude d'Anthropic) ainsi qu'à la recherche sur internet via GPT Search.

#### `POST /api/v2/assistant/ask`

- **But :** Permet de poser une question à un modèle LLM (OpenAI, Google (par defaut) ou Anthropic).

- Le modèle exact est déterminé par deux champs :

  **1. `provider` — Le fournisseur LLM**  
  Valeurs possibles (minuscules uniquement) :
  - `openai`
  - `google`
  - `anthropic`

  **2. `level` — Le niveau de raisonnement / complexité du modèle**  
  Valeurs possibles (minuscules uniquement) :
  - `low`
  - `mid`
  - `high`

  *Ces deux champs permettent de sélectionner automatiquement le bon modèle interne selon le fournisseur choisi et la puissance nécessaire.*

---

### **Champ optionnel : `history`**

- `history` permet de maintenir le contexte d'une conversation (mémoire) en envoyant les échanges précédents.
- **Type :** `Array<Object>`
- **Important :** Ne pas inclure la question actuelle (`prompt`) dans l'historique. L'API se charge de fusionner l'historique fourni avec le nouveau prompt.

Structure des objets (Format standard Google) :

- `role` : `"user"` (pour l'utilisateur) ou `"model"` (pour l'IA).
- `parts` : Tableau contenant un objet `text`.

**Exemple de structure `history` :**

```json
[
  {
    "role": "user",
    "parts": [{ "text": "Bonjour, je m'appelle Victor." }]
  },
  {
    "role": "model",
    "parts": [{ "text": "Bonjour Victor ! Comment puis-je vous aider ?" }]
  }
]
```

---

### **Champ optionnel : `json_schema`**

- `json_schema` permet de **forcer** le modèle à répondre selon un format strict (Structured Output).
- Le schéma doit être un **schéma JSON valide** (type, properties, required, etc.).
- Si `json_schema` est fourni :
  - le modèle produira un JSON **strictement conforme au schéma**.
  - **la réponse reste toujours dans le champ `assistant_response`**, même si elle est structurée.

Exemple de schéma simple :

```json
{
  "type": "object",
  "properties": {
    "text": { "type": "string" }
  },
  "required": ["text"]
}
```

---

### **Champ optionnel : `useSearch`**

* `useSearch` permet **d’autoriser le modèle à effectuer des recherches web** lorsque nécessaire.
* Type : `boolean`
* Valeur par défaut : `false`

Comportement :

* Si `useSearch = true` et que le modèle effectue une recherche :

  * la réponse inclura un champ `citations` contenant les sources utilisées.
* Si `useSearch = false` ou omis :

  * le modèle répond uniquement à partir de ses connaissances internes.

---

### ⚠️ **Limitations connues selon le fournisseur**

**Google**

* Seul le niveau `high` supporte **simultanément** :

  * `useSearch = true`
  * `json_schema`
* Les niveaux `low` et `mid` supportent :

  * soit la recherche web
  * soit le structured output
  * **pas les deux en même temps**

**OpenAI**

* Lorsque `useSearch = true` **et** `json_schema` est fourni :

  * le champ `citations` est présent mais **vide**

Tous les autres modèles supportent toutes les combinaisons.

---

### **Requête**

```
POST /api/v2/assistant/ask
```

---

### **Body**

Exemple sans schéma, sans recherche web :

```json
{
  "prompt": "Quelle est la capitale de la France ?",
  "system_instruction": "Tu es un assistant concis.",
  "provider": "openai",
  "level": "mid"
}
```

Exemple avec recherche web :

```json
{
  "prompt": "Quels sont les impacts économiques de l'IA générative en 2024 ?",
  "system_instruction": "Réponds de manière structurée et cite tes sources.",
  "provider": "anthropic",
  "level": "high",
  "useSearch": true
}
```

Exemple avec historique de conversation :

```json
{
  "prompt": "C'est noté. Et quel est mon nom ?",
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "Bonjour, je m'appelle Martin." }]
    },
    {
      "role": "model",
      "parts": [{ "text": "Bonjour Martin ! Comment puis-je vous aider ?" }]
    }
  ],
  "provider": "google",
  "level": "mid"
}
```

Exemple avec schéma structuré :

```json
{
  "prompt": "Explique-moi la fusion nucléaire.",
  "system_instruction": "Réponds selon le schéma fourni.",
  "provider": "google",
  "level": "high",
  "json_schema": {
    "type": "object",
    "properties": {
      "summary": { "type": "string" },
      "difficulty": { "type": "number" }
    },
    "required": ["summary"]
  }
}
```

---

### **Format de réponse**

Que `json_schema` soit utilisé ou non, la structure reste identique.
La réponse (texte libre ou JSON structuré) est toujours renvoyée dans `assistant_response`.

```json
{
  "success": true,
  "results": {
    "assistant_response": "Salut !\n\nComment puis-je te rendre service aujourd’hui ?",
    "model": "gpt-5-mini",
    "company": "openai",
    "citations": []
  }
}
```

Exemple lorsque `json_schema` est fourni :

```json
{
  "success": true,
  "results": {
    "assistant_response": "{\"summary\":\"La fusion nucléaire consiste à...\",\"difficulty\":4}",
    "model": "models/gemini-3-pro-preview",
    "company": "google",
    "citations": []
  }
}
```

Exemple avec recherche web (citations présentes) :

```json
{
  "success": true,
  "results": {
    "assistant_response": "Réponse enrichie à l’aide de sources web.",
    "model": "claude-sonnet-4-5-20250929",
    "company": "anthropic",
    "citations": [
      {
        "url": "https://example.com/source-1",
        "title": "Titre de la source 1"
      },
      {
        "url": "https://example.com/source-2",
        "title": "Titre de la source 2"
      }
    ]
  }
}
```

### **Note importante**

Lorsque `json_schema` est utilisé, la valeur de `assistant_response` contient un **JSON encodé en string**.
Il est donc nécessaire de faire un `JSON.parse(assistant_response)` pour exploiter la réponse sous forme d’objet JSON.


#### `POST /api/v1/assistant/search
- **But :** Permet de poser une question à un modèle LLM pour faire une recherche sur Internet
- **Requête :**
```
POST /api/v1/assistant/search
```
- **Body :**
```json
{
  "query": "Quelle est la capital de la Canada ?"
}
```

- **Format de réponse**
```json
{
  "index": 0,
  "message": {
    "role": "assistant",
    "content": "La capitale du Canada est Ottawa, située dans la province de l'Ontario. Fondée en 1826 sous le nom de Bytown, elle a été choisie en 1857 par la reine Victoria pour devenir la capitale de la province du Canada, en raison de sa position géographique stratégique à la frontière entre le Haut-Canada et le Bas-Canada, favorisant ainsi l'unité entre les communautés anglophones et francophones. ([fr.wikipedia.org](https://fr.wikipedia.org/wiki/Ottawa?utm_source=openai)) Ottawa est le siège du gouvernement fédéral, abritant des institutions telles que le Parlement du Canada, la Cour suprême et la résidence du gouverneur général. ([larousse.fr](https://www.larousse.fr/encyclopedie/ville/Ottawa/136511?utm_source=openai))",
    "refusal": null,
    "annotations": [
      {
        "type": "url_citation",
        "url_citation": {
          "end_index": 466,
          "start_index": 390,
          "title": "Ottawa — Wikipédia",
          "url": "https://fr.wikipedia.org/wiki/Ottawa?utm_source=openai"
        }
      },
      {
        "type": "url_citation",
        "url_citation": {
          "end_index": 719,
          "start_index": 628,
          "title": "Ottawa - LAROUSSE",
          "url": "https://www.larousse.fr/encyclopedie/ville/Ottawa/136511?utm_source=openai"
        }
      }
    ]
  },
  "finish_reason": "stop"
}
```

#### `POST /api/v1/assistant/deep-research/start`

* **But :** Démarrer une nouvelle recherche Deep Research en arrière-plan.
  Cette opération crée une tâche asynchrone longue, dont le résultat doit être récupéré via l’endpoint de *polling*.

* **Requête :**

```

POST /api/v1/assistant/deep-research/start

````

* **Body :**

```json
{
  "prompt": "Analyse complète des tendances de l'industrie aéronautique en 2025.",
  "company": "perplexity"
}
````

* **Notes importantes :**

  * `prompt` est obligatoire.
  * `company` est optionnel.

    * Si omis → la valeur par défaut est **"openai"**.
    * Les fournisseurs supportés sont : **"openai"**, **"perplexity"** (toujours en minuscules).
  * Cette route **ne retourne pas le résultat de la recherche**, seulement un **ID** permettant de vérifier son avancement.

* **Format de réponse :**

```json
{
  "success": true,
  "id": "dr_9f7c2a12e3b1498a",
  "company": "perplexity"
}
```

#### `POST /api/v1/assistant/deep-research/poll`

* **But :** Vérifier l’état ou récupérer le résultat final d’une recherche Deep Research.
  Cette opération doit être appelée périodiquement jusqu’à ce que le statut devienne `completed`.

* **Requête :**

````

POST /api/v1/assistant/deep-research/poll

````

* **Body :**

```json
{
  "researchId": "dr_9f7c2a12e3b1498a",
  "company": "openai"
}
````

* **Notes importantes :**

  * `researchID` est **obligatoire**.
  * `company` est optionnel.

    * Si omis → la valeur par défaut est **"openai"**.
    * Fournisseurs supportés : **"openai"**, **"perplexity"** (toujours en minuscules).
  * L’agent doit appeler cet endpoint **en boucle** jusqu’à `status = "completed"`.

* **Format de réponse (en cours) :**

```json
{
  "id": "dr_9f7c2a12e3b1498a",
  "status": "running"
}
```

* **Format de réponse (terminé) :**

```json
{
  "success": true,
  "id": "dr_9f7c2a12e3b1498a",
  "status": "completed",
  "content": {
    "text": "…texte généré…",
    "annotations": [
      {
        "type": "url_citation",
        "start_index": 337,
        "end_index": 506,
        "title": "Where Did Halloween Come From?",
        "url": "https://www.britannica.com/question/Where-Did-Halloween-Come-From"
      }
    ]
  }
}
```

* **Description :**

  * `success` : indique si la vérification a réussi.
  * `id` : identifiant de la recherche.
  * `status` : (`queued`, `running`, `completed`).
  * `content` : présent uniquement lorsque la recherche est terminée.
