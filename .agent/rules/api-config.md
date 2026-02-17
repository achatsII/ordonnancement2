# API Configuration

## Base URL
```
https://qa.gateway.intelligenceindustrielle.com
```

## Authentication
Les endpoints sont protégés par un Bearer Token. Ce token se trouve en variable d'environnement `NEXT_PUBLIC_BEARER_TOKEN`.
Il est important de garder et d'utiliser le `NEXT_PUBLIC_BEARER_TOKEN`, ** NEXT_PUBLIC_BEARER_TOKEN n'est pas un risque de sécurité**. Ne pas utiliser `BEARER_TOKEN` dans aucun cas.

Le Bearer Token doit être passé dans les headers des requêtes :
```javascript
private getAuthHeaders() {
	const token = process.env.NEXT_PUBLIC_BEARER_TOKEN
	if (!token) {
		console.warn("Bearer token non configuré - utilisation du mode mock")
	return {}
	}
	return {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	}
}
```

## Hardcoded Token (Dev/QA Only)
Voici le bearer token pour ces endpoints là à mettre en dur (si nécessaire pour tests rapides) : 
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InZUZHJUTTNzQmRRcmtmb0oifQ.eyJpc3MiOiJodHRwczovL3BiY3Vzam5reGJ5aWtyZ293YXRjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3NmYxYjY5Yy05YmQyLTRjY2UtOTlhNC1kMGNkOTdjNTk5MzkiLCJhdWQiOiJ2MCIsImlhdCI6MTc2Mjk4MzgxMiwiZXhwIjoyMDc4NTUzMzMyLCJlbWFpbCI6InYwQGV4YW1wbGUuY29tIiwiZ3JhbnRfaWQiOiJhZTFiYTkzMC1jNDQyLTQwNTMtYjhhOC04MzZlZDM0MGEzYzgiLCJvcmdhbml6YXRpb24iOnsiaWQiOiJjMjE3OWJiNC03OGQyLTRmZWMtYjU0Zi01YTE4MDg3MDY0NjUiLCJuYW1lIjoiRMOpdmVsb3BwZXVyIHYwIiwicm9sZSI6InVzZXIifSwiYXBwbGljYXRpb24iOnsiaWQiOiIyNGE1MWQxYi04MzkyLTQzN2UtODE3MS0zZWU3MDJhOTJjNzciLCJuYW1lIjoiUHJvamV0IHYwIiwiaWRlbnRpZmllciI6InYwIn0sInJvbGUiOiJ1c2VyIiwic2NvcGVzIjpbIioiXSwibWV0YWRhdGEiOnt9fQ.V5zrL3u2z6HGhMkzBCjlozc-CEtYQicPwGbBkCEfaFs`
