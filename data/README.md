# La Influencia — Modelo de Datos

Modelo de datos para investigación periodística sobre corrupción política en España.
Inspirado en la arquitectura de [ladonacion.es](https://github.com/JaimeObregon/ladonacion.es)
pero extendido con relaciones bidireccionales, validación por esquema y soporte multi-caso.

---

## Estructura de archivos

```
influencia/
├── data/
│   ├── cases.json       ← Los expedientes judiciales
│   ├── entities.json    ← Personas, empresas, instituciones, cuentas
│   ├── relations.json   ← Vínculos entre entidades
│   ├── events.json      ← Hechos concretos anclados en fechas
│   └── sources.json     ← Fuentes: autos, informes, prensa
└── schema/
    ├── entities.schema.json
    ├── events.schema.json
    ├── relations.schema.json
    └── sources.schema.json
```

---

## Los cinco planos del modelo

A diferencia de ladonacion.es (4 planos), este modelo añade un quinto:

| Plano | Archivo | Descripción |
|-------|---------|-------------|
| 1 | `cases.json` | Los expedientes judiciales que enmarcan todo |
| 2 | `entities.json` | Quién es quién: personas, empresas, instituciones |
| 3 | `relations.json` | Cómo se relacionan entre sí |
| 4 | `events.json` | Qué pasó, cuándo y con qué pruebas |
| 5 | `sources.json` | De dónde viene cada dato |

---

## Cómo añadir un nuevo evento

Copia esta plantilla en `events.json` dentro del array `events[]`:

```json
{
  "id": "ev-XXX",
  "date": "YYYY-MM-DD",
  "date_precision": "day",
  "title": "Título breve del hecho",
  "description": "Descripción detallada con contexto. Puedes usar **negrita** en Markdown.",
  "cases": ["dp-77-24"],
  "type": "judicial",
  "impact": 3,
  "entities": ["id-entidad-1", "id-entidad-2"],
  "relations": ["rel-001"],
  "sources": ["id-fuente-1"],
  "verified": true
}
```

### Tipos de evento disponibles (`type`):
- `contract` — Adjudicación o firma de un contrato
- `judicial` — Auto, sentencia, procesamiento, imputación
- `political` — Nombramiento, cese, declaración pública
- `police_operation` — Registro, detención, operación policial
- `investigation` — Apertura de diligencias, informe policial
- `scandal` — Hecho escandaloso (Parador de Teruel, etc.)
- `trial` — Sesión de juicio oral
- `corruption` — Pago de comisión, favor, cohecho
- `context` — Hecho de contexto (BOE, pandemia, etc.)
- `money_transfer` — Transferencia de dinero documentada

### Nivel de impacto (`impact`):
- `5` — Crítico: imputación, prisión, hecho central de la trama
- `4` — Alto: registro, detención, declaración clave
- `3` — Medio: apertura de diligencias, informe policial
- `2` — Bajo: nombramiento, contexto relevante
- `1` — Marginal: contexto general

---

## Cómo añadir una nueva entidad

```json
{
  "id": "nombre-apellido",
  "type": "person",
  "name": "Nombre Completo Oficial",
  "aliases": ["Apodo"],
  "role": "Descripción de su papel en el caso",
  "cases": ["caso-koldo"],
  "status": "investigated",
  "tags": ["etiqueta1", "etiqueta2"],
  "notes": "Información adicional relevante"
}
```

### Tipos de entidad (`type`):
- `person` — Persona física
- `company` — Sociedad mercantil
- `institution` — Organismo público o privado
- `account` — Cuenta bancaria o estructura financiera

### Estados procesales (`status`):
- `investigated` — En investigación
- `accused` — Acusado formalmente
- `convicted` — Condenado
- `acquitted` — Absuelto
- `witness` — Testigo
- `judge` / `prosecutor` / `lawyer` — Rol procesal

---

## Cómo añadir una nueva relación

```json
{
  "id": "rel-XXX",
  "from": "id-entidad-origen",
  "to": "id-entidad-destino",
  "type": "pays",
  "label": "etiqueta corta del vínculo",
  "description": "Descripción de la relación con evidencia.",
  "cases": ["caso-koldo"],
  "sources": ["id-fuente"],
  "verified": true,
  "amount": {
    "value": 500000,
    "currency": "EUR",
    "approximate": false
  },
  "period": {
    "from": "2020-03",
    "to": "2021-06"
  }
}
```

### Tipos de relación (`type`):
- `coordinates` — Coordina o dirige la actividad
- `employs` — Relación laboral/contractual
- `controls` — Control societario o de cuentas
- `influences` — Presión o influencia sobre una decisión
- `pays` — Pago de comisión, soborno o favor económico
- `transfers` — Transferencia de fondos
- `awards_contract` — Adjudicación de contrato
- `investigates` — Relación investigador/investigado
- `imputes` — Acto de imputación judicial
- `processes` — Procesamiento judicial
- `advises` — Asesoría (legal, política, informal)
- `produces_documents` — Generación de documentación

---

## Cómo añadir una nueva fuente

```json
{
  "id": "slug-descriptivo",
  "type": "press",
  "title": "Título del artículo o documento",
  "publisher": "Nombre del medio o institución",
  "author": "Nombre del autor (opcional)",
  "date": "YYYY-MM-DD",
  "cases": ["caso-koldo"],
  "availability": "public",
  "url": "https://..."
}
```

### Tipos de fuente (`type`):
- `judicial_order` — Auto, sentencia, providencia
- `police_report` — Informe UDEF, UCO u otra unidad
- `press` — Artículo periodístico
- `fact_check` — Verificación por organismo especializado
- `reference` — Wikipedia, bases de datos, hemerotecas
- `official` — BOE, DOUE, comunicado oficial

### Disponibilidad (`availability`):
- `public` — Accesible libremente con URL
- `partial` — Solo extractos o filtraciones en prensa
- `restricted` — En sumario judicial, no público

---

## Cómo añadir noticias para extender el modelo

Si encuentras una noticia relevante, puedes pasármela en este formato
y yo actualizaré los archivos correspondientes:

```
NOTICIA:
- Titular: "..."
- Medio: El País / El Español / etc.
- Fecha: DD/MM/YYYY
- URL: https://...
- Resumen: [2-3 frases de lo que cuenta]
- Personas mencionadas: [nombres]
- Tipo de hecho: contrato / judicial / político / escándalo / etc.
```

Con eso puedo añadir automáticamente:
1. La fuente en `sources.json`
2. El evento en `events.json`
3. Las entidades nuevas que aparezcan en `entities.json`
4. Las relaciones nuevas que implique en `relations.json`

---

## Estado actual del modelo

| Archivo | Registros |
|---------|-----------|
| cases.json | 2 casos |
| entities.json | 23 entidades |
| relations.json | 19 relaciones |
| events.json | 23 eventos |
| sources.json | 21 fuentes |

---

## Licencia y créditos

Modelo de datos: libre uso para periodismo de investigación.
Inspirado en el trabajo de [Jaime Gómez-Obregón](https://github.com/JaimeObregon/ladonacion.es).
Los hechos recogidos provienen de fuentes públicas verificadas.
La imputación o procesamiento no implica condena.
