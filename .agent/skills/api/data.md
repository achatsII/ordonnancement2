# API Data Skills

Si tu as besoin de gérer de la donnée (lecture, écriture), défini un `app_identifier` pour reconnaître l'application source

#### `POST api/v1/data/{dataType}`

- **But :** insérer un nouveau document dans MongoDB
- **Requête :**
```
POST api/v1/data/{dataType}
```
- **Body : **
```json
{
  "description": "Nouveau profil utilisateur",
  "json_data": {
    "user": {
      "name": "Alice",
      "age": 25
    },
    "status": "active",
    "app_identifier": "app-demo"
  }
}
```

- **Format de réponse :**
```json
  "success": true,
  "results": [
    {
      "inserted_id": "6879104977718aec114d43d1",
      "data_type": "user_profile",
      "json_data": {
        "user": {
          "name": "Alice",
          "age": 25
        },
        "status": "active",
		"app_identifier": "app-demo"
      }
    }
  ]
}
```


#### `GET api/v1/data/{dataType}/all`
- **But :** permet de récupérer tous les documents pour un `dataType` donné
- **Requête :**
```

GET api/v1/data/{dataType}/all

```

- **Body (optionnel) :**
```json
{
  "projection": {
    "_id": 1,
    "data_type": 1,
    "json_data": 1,
    "description": 0
  }
}
```

* **Format de réponse :**

```json
{
  "success": true,
  "results": [
    {
      "_id": "684357ba8d159ef15cb5efd9",
      "data_type": "user_profile",
      "description": "Nouveau profil utilisateur",
      "json_data": {
        "status": "active",
        "user": {
          "age": 25,
          "name": "Alice"
        },
        "app_identifier": "app-demo"
      }
    }
  ]
}
```

> **Remarques :**
>
> * Le champ `projection` est optionnel et suit les règles MongoDB (1 = inclure, 0 = exclure).
> * Les résultats peuvent contenir des documents appartenant à d’autres `app_identifier` que celui de l’application.
> * Disponible en **QA** et en **Production**.

#### `GET api/v1/data/{dataType}/last`

* **But :** Récupérer le dernier document d'un type spécifique
* **Requête :**

```
GET api/v1/data/{dataType}/last
```

* **Body (optionnel) :**

```json
{
  "projection": {
    "_id": 1,
    "data_type": 1,
    "json_data": 1,
    "description": 0
  }
}
```

* **Format de réponse :**

```json
{
  "success": true,
  "results": {
    "_id": "507f1f77bcf86cd799439011",
    "data_type": "user_profile",
    "description": "Profil utilisateur exemple",
    "json_data": {
      "harvestDate": "2025-08-15",
      "location": "Jardin principal",
      "name": "Tomate",
      "notes": "Plante en bonne santé",
      "plantingDate": "2025-06-01",
      "status": "growing",
      "variety": "cerise",
      "app_identifier": "app_demo"
    }
  }
}
```

> **Remarques :**
>
> * Le champ `projection` est optionnel et permet de limiter les champs retournés.
> * Disponible en **QA** et en **Production**.

#### `POST api/v1/data/{dataType}/filter`

* **But :** Filtrer les documents avec un filtre MongoDB personnalisé
* **Requête :**

```
POST api/v1/data/{dataType}/filter
```

* **Body :**

```json
{
  "mongo_filter": {
    "json_data.user.age": {
      "$eq": 25
    }
  },
  "projection": {
    "_id": 1,
    "data_type": 1,
    "json_data": 1,
    "description": 0
  }
}
```

Un autre exemple :

```json
{
  "mongo_filter": {
    "json_data.app_identifier": {
      "$eq": "app_demo"
    }
  }
}
```

* **Format de réponse :**

```json
{
  "success": true,
  "results": [
    {
      "_id": "68791cc877718aec114d43ec",
      "app_identifier": "potager-app",
      "data_type": "user_profile",
      "description": "Nouveau profil utilisateur",
      "grant_id": "bff90681-75b3-4880-8052-e05c0473aa55",
      "json_data": {
        "status": "active",
        "user": {
          "age": 25,
          "name": "Alice"
        },
        "app_identifier": "app_demo"
      }
    }
  ]
}
```

> **Remarques :**
>
> * Le champ `projection` est optionnel et s’applique après le filtre MongoDB.
> * Disponible en **QA** et en **Production**.

```
```


#### `GET api/v1/data/{dataType}/one/{recordId}`
- **But :** Permet de récupérer un document spécifique à partir de son identifiant et de son type
- **Requête :**
```
GET api/v1/data/{dataType}/one/{recordId}
```
- **Format de réponse :**
```json
{
  "success": true,
  "result": {
    "_id": "68791cc877718aec114d43ec",
    "app_identifier": "potager-app",
    "data_type": "user_profile",
    "description": "Nouveau profil utilisateur",
    "grant_id": "bff90681-75b3-4880-8052-e05c0473aa55",
    "json_data": {
      "status": "active",
      "user": {
        "age": 25,
        "name": "Alice"
      },
      "app_identifier": "app_demo"
    }
  }
}
```

#### PUT api/v1/data/{dataType}/one/{recordId}`
- **But** : Mettre à jour un document spécifique dans MongoDB
- **Requête :**
```
PUT api/v1/data/{dataType}/one/{recordId}
```
- **Body** :
```json
{
  "description": "Mise à jour du profil utilisateur",
  "json_data": {
    "user": {
      "name": "Alice",
      "age": 25
    },
    "status": "active",
    "app_identifier"
  }
}
```
- **Format de réponse :**
```json
{
  "success": true,
  "results": [
    {
      "updated_count": 1
    }
  ]
}
```

#### `PATCH api/v1/data/{dataType}/share/{recordId}`
- **But :** Rendre accessible un document sans Bearer token avec la `GET data/public` décrite plus loin.
- **Requête :**
```
PATCH api/v1/data/{dataType}/share/{recordId}
```
- **Format de réponse :**
```json
{
  "success": true,
  "results": [
    {
      "status": "Document partagé avec succès"
    }
  ]
}
```

#### `PATCH api/v1/data/{dataType}/unshare/{recordId}`
- **But :** Rendre privé un document public.
- **Requête :**
```
PATCH api/v1/data/{dataType}/unshare/{recordId}
```
- **Format de réponse :**
```json
{
  "success": true,
  "results": [
    {
      "status": "Document départagé avec succès"
    }
  ]
}
```

#### `POST api/v1/data/{dataType}/many`

* **But :** insérer plusieurs documents en une seule requête
* **Requête :**

```
POST api/v1/data/{dataType}/many
```

* **Body :**

```json
{
  "descriptions": [
    "Profil utilisateur A",
    "Profil utilisateur B"
  ],
  "json_data": [
    {
      "user": { "name": "Alice", "age": 25 },
      "status": "active",
      "app_identifier": "app-demo"
    },
    {
      "user": { "name": "Bob", "age": 32 },
      "status": "inactive",
      "app_identifier": "app-demo"
    }
  ]
}
```

* **Format de réponse :**

```json
{
  "success": true,
  "results": [
    {
      "inserted_id": "6879104977718aec114d43d1",
      "data_type": "user_profile",
      "json_data": {
        "user": { "name": "Alice", "age": 25 },
        "status": "active",
        "app_identifier": "app-demo"
      }
    },
    {
      "inserted_id": "6879104977718aec114d43d2",
      "data_type": "user_profile",
      "json_data": {
        "user": { "name": "Bob", "age": 32 },
        "status": "inactive",
        "app_identifier": "app-demo"
      }
    }
  ]
}
```

#### `PUT api/v1/data/{dataType}/many`
- **But :** Mettre à jour plusieurs documents MongoDB à l'aide d'un filtre
- **Requête :** 
```
PUT api/v1/data/{dataType}/many
```
- **Body :**
```json
{
  "mongo_filter": {
    "json_data.user.age": {
      "$eq": 26
    }
  },
  "json_data": {
    "user": {
      "name": "Salut",
      "age": 26
    },
    "status": "active",
    "app_identifier": "app_demo"
  }
}
```

- Format de réponse :
```json
{
  "success": true,
  "results": [
    {
      "updated_count": 1
    }
  ]
}
```

#### `DELETE api/v1/data/{dataType}/many`

* **But :** supprimer plusieurs documents d’un type donné dans MongoDB
* **Requête :**

```
DELETE api/v1/data/{dataType}/many
```

* **Body :**

```json
{
  "record_list": [
    "675a12f83e52f401f306e21a",
    "675a12f83e52f401f306e21b",
    "675a12f83e52f401f306e21c"
  ]
}
```

* **Format de réponse (succès complet) :**

```json
{
  "success": true,
  "deleted_count": 3}
```

* **Format de réponse (échec partiel) :**

```json
{
  "success": false,
  "deleted_count": 2,
  "failed_ids": [
    "675a12f83e52f401f306e21c"
  ]
}
```

#### `DELETE api/v1/data/{dataType}/{recordId}`
- **But** : Permet de supprimer un document MongoDB
- **Requête :**
```
DELETE api/v1/data/{dataType}/{recordId}
```
- **Format de réponse :**
```json
{
  "success": true,
  "results": [
    {
      "deleted_count": 1
    }
  ]
}
```

#### `GET api/v1/data/public/v0/{dataType}/one/{recordId}`
> Cette route ne nécessite pas d'Authorization

- **But :** Récupérer un document MongoDB public
- **Requête**
```
GET api/v1/data/public/v0/{dataType}/one/{recordId}
```
- **Format de réponse :**
```json
{
  "success": true,
  "results": {
    "_id": "68791cc877718aec114d43ec",
    "app_identifier": "potager-app",
    "data_type": "user_profile",
    "description": "Nouveau profil utilisateur",
    "grant_id": "bff90681-75b3-4880-8052-e05c0473aa55",
    "json_data": {
      "status": "active",
      "user": {
        "age": 25,
        "name": "Alice"
      },
      "app_identifier": "app_demo"
    }
  }
}
```
