# API Analytics Skills

### `Analytics`
Ces routes permettent d’interagir avec notre données BigQuery

#### `POST /api/v1/analytics/query/sql`
- **But :** Faire une requête SQL à la base BigQuery
- **Requête :** 
```
POST /api/v1/analytics/query/sql
```
- **Body :**
```json
{
  "query": "SELECT * FROM `project.dataset.table` WHERE age > 25 LIMIT 10"
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

#### `POST /api/v1/analytics/query/nl`
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
