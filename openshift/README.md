# PO Suite — OpenShift Deployment Guide

## Voraussetzungen

- OpenShift 4.12+ mit `restricted-v2` SCC (Standard)
- `oc` CLI eingeloggt und auf das Ziel-Namespace gesetzt
- Secrets befüllt (siehe unten — nie in Git committen)

---

## 1. Secrets erstellen

```bash
# Datenbank-Credentials (für den Postgres-Pod)
oc create secret generic posuite-db-credentials \
  --from-literal=username=posuite \
  --from-literal=password='<sicheres-passwort>'

# App-Secrets (Backend)
oc create secret generic posuite-secrets \
  --from-literal=ANTHROPIC_API_KEY='sk-ant-...' \
  --from-literal=JWT_SECRET="$(openssl rand -hex 32)" \
  --from-literal=DATABASE_URL='postgresql://posuite:<passwort>@posuite-db:5432/posuite'
```

---

## 2. Manifests anpassen

Passe folgende Werte vor dem Deployment an:

| Datei | Feld | Beispiel |
|---|---|---|
| `configmap.yml` | `ALLOWED_ORIGINS` | `https://posuite.apps.mycluster.ch` |
| `backend/route.yml` | `spec.host` | `posuite-api.apps.mycluster.ch` |
| `frontend/route.yml` | `spec.host` | `posuite.apps.mycluster.ch` |
| `backend/deployment.yml` | `image` | `ghcr.io/larsjoss/posuite-backend:v1.0.0` |
| `frontend/deployment.yml` | `image` | `ghcr.io/larsjoss/posuite-frontend:v1.0.0` |

---

## 3. Erstmaliges Deployment

```bash
# Namespace anlegen (falls nicht vorhanden)
oc new-project posuite

# ConfigMap
oc apply -f openshift/configmap.yml

# Datenbank
oc apply -f openshift/db/persistent-volume-claim.yml
oc apply -f openshift/db/deployment.yml
oc apply -f openshift/db/service.yml

# Warten bis DB bereit
oc rollout status deployment/posuite-db --timeout=3m

# Backend (initContainer führt Prisma-Migrationen aus)
oc apply -f openshift/backend/deployment.yml
oc apply -f openshift/backend/service.yml
oc apply -f openshift/backend/route.yml

oc rollout status deployment/posuite-backend --timeout=3m

# Frontend
oc apply -f openshift/frontend/deployment.yml
oc apply -f openshift/frontend/service.yml
oc apply -f openshift/frontend/route.yml

oc rollout status deployment/posuite-frontend --timeout=3m
```

---

## 4. Erster Benutzer anlegen

```bash
# Pod-Name ermitteln
POD=$(oc get pod -l component=backend -o jsonpath='{.items[0].metadata.name}')

# Benutzer erstellen (im Backend-Container)
oc exec "$POD" -- node dist/scripts/create-user.js \
  --email admin@firma.ch \
  --password '<sicheres-passwort>'
```

> **Hinweis:** Das Script liegt unter `backend/scripts/create-user.ts` und wird
> im Production-Image als `dist/scripts/create-user.js` kompiliert.
> Füge `scripts/` zu `backend/tsconfig.json` `include` hinzu, falls es noch
> nicht gebaut wird.

---

## 5. Image-Updates / Rolling Rollout

```bash
SHA="<github-sha>"

oc set image deployment/posuite-backend \
  "backend=ghcr.io/larsjoss/posuite-backend:${SHA}"

oc set image deployment/posuite-frontend \
  "frontend=ghcr.io/larsjoss/posuite-frontend:${SHA}"

oc rollout status deployment/posuite-backend --timeout=3m
oc rollout status deployment/posuite-frontend --timeout=3m
```

---

## 6. Rollback

```bash
oc rollout undo deployment/posuite-backend
oc rollout undo deployment/posuite-frontend
```

---

## 7. GitHub Actions Secrets

Füge folgende Secrets in den Repository-Einstellungen unter
*Settings → Secrets and variables → Actions* ein:

| Secret | Beschreibung | Pflicht |
|---|---|---|
| `VITE_AUTH_EMAIL` | Credentials für GitHub-Pages-Build | Nein (alt) |
| `VITE_AUTH_PASSWORD` | Credentials für GitHub-Pages-Build | Nein (alt) |
| `REGISTRY_URL` | Container-Registry (leer = GHCR) | Nein |
| `REGISTRY_USERNAME` | Registry-Login (leer = github.actor) | Nein |
| `REGISTRY_PASSWORD` | Registry-Passwort (leer = GITHUB_TOKEN) | Nein |
| `VITE_API_URL` | Backend-URL im enterprise-Build | Ja |
| `OC_SERVER` | OpenShift API Server URL | Optional |
| `OC_TOKEN` | OpenShift Service-Account-Token | Optional |
| `OC_NAMESPACE` | OpenShift Ziel-Namespace | Optional |

> `OC_*` Secrets sind optional. Ohne sie werden Images gebaut und gepusht,
> aber kein automatisches Rollout durchgeführt. Nutze dann ArgoCD oder einen
> manuellen `oc rollout`-Schritt.

---

## 8. SCC-Kompatibilität

Alle Container laufen als non-root (`restricted-v2` SCC):

- Backend: `USER node` (uid 1000), Port 3000
- Frontend: `USER nginx` (uid 101), Port 8080
- Postgres: `runAsNonRoot: true`, PGDATA unter `/var/lib/postgresql/data/pgdata`
- `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]` überall gesetzt
