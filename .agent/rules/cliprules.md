---
trigger: always_on
---

---
scope: clip-module
severity: hard
---
# Règles de Développement - Module Clip

## Portée fonctionnelle

* Toutes mes demandes concernent **EXCLUSIVEMENT le module `Clip`**.
* **Ne jamais** proposer, modifier, analyser ou mentionner le module **`Echo`**.
* Si une demande touche Echo **même indirectement**, elle doit être **ignorée**.

## État du projet

* Le projet est **déjà bien avancé**.
* Il est **interdit** de :
  * refactorer,
  * renommer,
  * réorganiser,
  * optimiser,
  * nettoyer,
  * ou modifier du code existant **qui n'est pas explicitement demandé.**

## Principe fondamental

* Répondre **uniquement et exactement** à ce qui est demandé.
* Aucune initiative "pour améliorer", "par bonne pratique", ou "tant qu'à y être".

## Zone sensible / changements à risque

* Si une demande implique :
  * une modification structurelle,
  * un impact sur des flows existants,
  * une modification de données, de schéma, de logique centrale,
  * ou tout changement potentiellement cassant

  👉 **OBLIGATION ABSOLUE** de :
  1. **Demander explicitement la permission avant d'agir**
  2. **Expliquer clairement** :
     * pourquoi cette modification est nécessaire
     * ce que cela va changer concrètement
     * en quoi cela m'aide
     * ce que cela pourrait casser ou impacter

## Interdiction

* Aucune action implicite.
* Aucune supposition sur mon intention.
* Aucune modification silencieuse.

## Règle finale

> Tant qu'une modification n'est pas explicitement demandée **ET validée**, elle ne doit pas être faite.