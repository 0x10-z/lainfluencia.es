# La Influencia

Archivo digital de investigación sobre el **Caso Zapatero / Plus Ultra** (D.P. 77/2024, Juzgado Central de Instrucción Nº 2 de Madrid).

Datos verificados, fuentes documentadas, código abierto.

---

## Arranque

```bash
npm install
npm run dev        # servidor de desarrollo en localhost:4321
npm run build      # build estático
npm run preview    # previsualizar el build
```

### Scripts auxiliares

```bash
node scripts/fetch-og.mjs        # previews OG de fuentes de prensa (incremental)
node scripts/fetch-photos.mjs    # fotos de perfil de entidades (Wikidata → placeholder JPG)
node scripts/fetch-wikipedia.mjs # URLs de Wikipedia para personas (guarda en entities.json)
node data/validate.js            # validación de integridad referencial del modelo de datos
```

---

## Estructura

```
src/
  data/           JSON con todos los datos del caso
    events.json       Hechos documentados
    entities.json     Personajes e instituciones
    relations.json    Relaciones entre entidades
    sources.json      Fuentes documentales
    cases.json        Expedientes judiciales
    og-cache.json     Caché de metadatos OG (generado por script)
  pages/          Páginas Astro
  components/     Componentes Astro + React
  layouts/        Layout base
  styles/         CSS global y tokens de diseño
  types.ts        Tipos TypeScript compartidos
  utils.ts        Funciones auxiliares
public/
  personas/       Fotos de perfil de personajes (ID.jpg)
scripts/
  fetch-og.mjs    Genera og-cache.json con previews de prensa
```

---

## Stack

- **Astro 5** — SSG estático, sin servidor
- **React 19** — islands interactivos (sidebar, filtros, búsqueda)
- **D3.js** — grafo de relaciones
- **Fuse.js** — búsqueda en navbar
- **Tailwind CSS** + tokens CSS custom

---

## Protocolo editorial

Guía de trabajo para añadir hechos, personajes y documentos al archivo del Caso Zapatero / Plus Ultra.

---

### 1. Añadir un hecho nuevo (evento)

#### Fuentes obligatorias a consultar (por orden de prioridad)

1. **BOE** — boe.es · Resoluciones, autos, contratos, subvenciones
2. **The Objective** — theobjective.com · Investigación propia sobre el caso
3. **El Español** — elespanol.com · Cobertura amplia del caso
4. **Infobae España** — infobae.com/espana · Seguimiento judicial detallado
5. **ABC** — abc.es
6. **La Razón** — larazon.es
7. **Voz Pópuli** — vozpopuli.com
8. **El País** — elpais.com
9. **El Mundo** — elmundo.es
10. **El Confidencial** — elconfidencial.com
11. **Libertad Digital** — libertaddigital.com
12. **Confilegal** — confilegal.com · Información jurídica especializada
13. **Newtral / Maldita** — para verificación de datos

#### Campos obligatorios en events.json

- `id` — slug único en kebab-case (ej. `auto-imputacion-zapatero-may-2026`)
- `date` — formato `YYYY-MM-DD`
- `date_precision` — `day` / `month` / `year`
- `title` — frase corta, máx. 80 caracteres
- `description` — párrafo de contexto, fuentes integradas
- `type` — ver tipos disponibles en types.ts
- `impact` — 1 a 5 (5 = crítico / cambio de fase judicial)
- `cases` — siempre `["dp-77-24"]`
- `entities` — IDs de todos los personajes implicados
- `sources` — IDs de las fuentes que lo acreditan (mínimo 1)
- `verified` — `true` / `"partial"` / `false`
- `pending` — `true` solo si el hecho aún no ha ocurrido

#### Criterio de impacto

| Nivel | Criterio |
|-------|----------|
| 5 | Auto judicial, imputación, detención, sentencia |
| 4 | Informe policial relevante, filtración documentada |
| 3 | Comparecencia, declaración pública significativa |
| 2 | Noticia de prensa con datos nuevos |
| 1 | Contexto, antecedente, referencia |

---

### 2. Añadir un personaje nuevo (entidad)

#### Investigación obligatoria

- [ ] **Wikipedia** — buscar artículo en es.wikipedia.org. Si existe, añadir URL en `notes` o como fuente de tipo `reference`
- [ ] **BOE** — comprobar si aparece como cargo público, concesionario, apoderado
- [ ] **Registro Mercantil** — si es empresario, buscar sociedades en registradores.es
- [ ] **Foto de perfil** — buscar imagen libre o de prensa para usar en ficha y nodo de red:
  - Fuentes: Wikipedia Commons, foto de prensa con atribución, web oficial
  - Guardar en `public/personas/{id}.jpg` (ratio 1:1, mín. 200×200px)
  - Si no hay foto, usar placeholder según tipo (`person`, `company`, `institution`)
- [ ] **Relaciones con personajes existentes** — revisar todas las entidades actuales y documentar vínculos:
  - Laborales (empleador / empleado)
  - Societarios (administrador / socio)
  - Políticos (partido, cargo, nombramiento)
  - Familiares si son relevantes para el caso
  - Financieros (pagos, transferencias, contratos)

#### Campos obligatorios en entities.json

- `id` — slug único (`nombre-apellido`)
- `type` — `person` / `company` / `institution` / `account`
- `name` — nombre completo oficial
- `aliases` — apodos, siglas, nombres abreviados
- `role` — cargo o función en el caso (una línea)
- `cases` — `["dp-77-24"]`
- `status` — estado procesal actual (ver types.ts)
- `tags` — 2-4 etiquetas descriptivas en minúsculas
- `notes` — contexto relevante, fuente Wikipedia si existe

#### Foto de perfil — flujo

```
1. Buscar en Commons: commons.wikimedia.org/w/index.php?search={nombre}
2. Si no hay: buscar foto de prensa en Google Images > Herramientas > Licencias de uso
3. Guardar como public/personas/{entity-id}.jpg
4. Añadir campo "photo": "/{entity-id}.jpg" en entities.json (cuando se implemente)
```

---

### 3. Añadir una fuente documental (source)

#### Campos obligatorios en sources.json

- `id` — slug descriptivo (`medio-tema-año`)
- `type` — `judicial_order` / `police_report` / `official` / `press` / `fact_check` / `reference`
- `subtype` — para `police_report`: `UDEF` / `UCO` / `GC`
- `title` — título exacto del documento o artículo
- `date` — fecha de publicación `YYYY-MM-DD`
- `cases` — `["dp-77-24"]`
- `availability` — `public` / `partial` / `restricted`
- `url` — URL directa al documento o artículo (no a la homepage)

#### Actualizar og-cache.json tras añadir fuentes de prensa

```bash
node scripts/fetch-og.mjs
```

Ejecutar siempre que se añadan fuentes de tipo `press` o `fact_check` con URL. El script es incremental — no re-descarga lo que ya está en caché.

---

### 4. Añadir una relación nueva

#### Campos obligatorios en relations.json

- `id` — slug (`from--tipo--to`)
- `from` / `to` — IDs de entidades existentes
- `type` — ver RelationType en types.ts
- `label` — verbo corto para el grafo (ej. "coordina", "paga", "controla")
- `description` — una frase explicando la relación con contexto
- `cases` — `["dp-77-24"]`
- `sources` — IDs de fuentes que acreditan la relación
- `verified` — `true` / `"partial"` / `false`
- `amount` — si hay transferencia económica: `{ value, currency, approximate }`
- `period` — si se conoce el periodo: `{ from: "YYYY", to: "YYYY" | null }`

---

### 5. Leer documentos judiciales (PDFs)

Los PDFs fuente están en `data/pdf/`. El flujo para extraer datos de un documento judicial y volcarlo al modelo es:

#### Estado de lectura

- [x] `auto-zapatero.pdf` — Auto de imputación del JCI Nº 2 (38 pp.) — leído completo 25/05/2026
- [x] `Informe UDEF Caso Zapatero - Caso Plus Ultra.pdf` — Informe UDEF 1908/26 UDEF-BBCA (22/04/2026, 157 pp.) — leído completo 25/05/2026

#### Flujo con Claude

Pedir a Claude que lea el PDF por tramos y extraiga directamente a JSON. No hace falta convertir a Markdown — es un paso intermedio que no aporta y consume más contexto.

```text
"Lee data/pdf/auto-zapatero.pdf páginas 1-15 y extrae hechos,
entidades y relaciones nuevas para añadir al modelo de datos"
```

Claude lee el PDF en bloques de hasta 20 páginas y vuelca directamente a `events.json`, `entities.json`, `relations.json` y `sources.json`.

#### Qué extraer de cada tipo de documento

**Auto judicial** (`judicial_order`)

- Hechos imputados → eventos con `type: "judicial"`, `impact: 5`
- Personas imputadas → entidades con `status: "investigated"` o `"accused"`
- Relaciones entre imputados que describe el juez → relations con `verified: true`
- Fechas de los hechos descritos (no la fecha del auto)
- Cantidades económicas mencionadas → `amount` en la relación correspondiente

**Informe policial UDEF/UCO** (`police_report`)

- Operaciones y transferencias → eventos con `type: "money_transfer"` o `"investigation"`
- Sociedades instrumentales → entidades `type: "company"`
- Cuentas bancarias y jurisdicciones → entidades `type: "account"`
- Flujos de dinero → relations con `type: "transfers"` o `"pays"` + `amount`
- El informe en sí como fuente con `subtype: "UDEF"` o `"UCO"`

#### Criterio para decidir si algo entra al modelo

| ¿Entra? | Criterio                                                                |
| ------- | ----------------------------------------------------------------------- |
| Sí      | Dato específico, fechado, atribuible a una fuente                       |
| Sí      | Nombre, cantidad, fecha o relación nueva no documentada                 |
| Parcial | Dato mencionado una sola vez sin corroboración (`verified: "partial"`)  |
| No      | Valoraciones, opiniones, contexto genérico sin datos concretos          |
| No      | Hechos ya existentes en el modelo (verificar antes por fecha)           |

#### Tras añadir datos de un PDF

```bash
node data/validate.js            # verificar integridad — debe terminar sin errores
node scripts/fetch-photos.mjs    # si hay personajes nuevos, buscar fotos
node scripts/fetch-wikipedia.mjs # si hay personajes nuevos, buscar Wikipedia
node scripts/fetch-og.mjs        # si hay fuentes de prensa nuevas
```

---

### 6. Checklist al añadir cualquier elemento

- [ ] El evento/entidad/fuente tiene al menos una fuente verificable
- [ ] Los IDs son únicos y no rompen referencias existentes
- [ ] Se ha ejecutado `npx astro build` sin errores antes de commitear
- [ ] Si hay fuentes de prensa nuevas: ejecutar `node scripts/fetch-og.mjs`
- [ ] Si hay personaje nuevo: buscar foto y relaciones con los existentes
- [ ] `verified: false` si el dato es de una sola fuente no oficial

---

### 6. Recomendaciones

#### Trazabilidad judicial
- Consultar el **CENDOJ** (cendoj.poderjudicial.es) para autos y sentencias publicados
- Los autos del Juzgado Central nº 2 de Madrid suelen filtrarse en Confilegal antes de publicarse oficialmente

#### Geolocalización de sociedades
- Para empresas offshore o extranjeras: **OpenCorporates** (opencorporates.com)
- Para sociedades españolas: **Registro Mercantil Central** (rmc.es)

#### Seguimiento de agenda judicial
- Anotar fechas de próximas diligencias como eventos con `pending: true`
- Actualizar `pending` a `false` cuando el hecho ocurra y añadir la fuente

#### Control de duplicados
- Antes de añadir un evento, buscar por fecha en events.json para evitar duplicados
- Los hechos con `date_precision: month` o `year` son más propensos a duplicarse

#### Verificación cruzada
- Un hecho con una sola fuente → `verified: "partial"`
- Un hecho con dos fuentes independientes → `verified: true`
- Documentos judiciales filtrados sin confirmación oficial → `verified: "partial"`

#### Consistencia de nombres
- Usar siempre el nombre oficial completo en `name`
- Los alias y apodos van en `aliases`, nunca en `name`
- Las empresas llevan su forma jurídica (S.L., S.A., etc.) en el nombre

---

*Última actualización: mayo 2026*
