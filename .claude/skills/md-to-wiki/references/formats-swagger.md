# Format 2 — Swagger / OpenAPI

Parse markdown specs for API contracts and generate an OpenAPI 3.0 spec served with Swagger UI.

#### 3a. Scan for API specs

Search the selected files for anything API-related:
- Files named `api.md`, `openapi.md`, `contract.md`, `endpoints.md`
- Any markdown file containing `## Endpoints`, `## API`, `## Routes`, `## OpenAPI`
- Any `spec.md` that references HTTP methods (GET, POST, PUT, DELETE, PATCH)

Present findings and ask the user to confirm.

#### 3b. Extract endpoints and generate OpenAPI YAML

Read each identified file and extract API information. Build an `openapi.yml`:

```yaml
openapi: "3.0.3"
info:
  title: <Project Name> — API Specs
  version: "1.0.0"
  description: Auto-generated from spec-driven development markdowns

servers:
  - url: <ask user for base URL>
    description: <ask user for environment>

paths:
  /<path>:
    get:
      summary: <extracted from markdown headings>
      description: <extracted from markdown body>
      parameters:
        - name: <param>
          in: query
          schema:
            type: string
      responses:
        "200":
          description: <extracted or generic>
```

Heuristics for extraction:
- `### GET /api/users` → path `/api/users`, method `GET`
- `**Request:**` followed by JSON block → request body schema
- `**Response:**` followed by JSON block → response schema
- `**Parameters:**` followed by table → parameter definitions

If the markdown doesn't have structured API definitions, tell the user and offer to create a skeleton OpenAPI that they can fill in.

#### 3c. Serve with Swagger UI

Option A — Swagger UI (interactive):
```bash
npx swagger-ui-cli openapi.yml --port 8080
```

Option B — ReDoc (clean docs look):
```bash
npx redoc-cli serve openapi.yml
```

Option C — Static HTML with embedded Swagger UI:
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "openapi.yml", dom_id: "#swagger-ui" })
  </script>
</body>
</html>
```

Output: `site/api-docs/index.html` + `openapi.yml`.

---
