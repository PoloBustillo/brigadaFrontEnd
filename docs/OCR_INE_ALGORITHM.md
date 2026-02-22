# 🪪 Algoritmo OCR para Credencial INE

> **Archivos relevantes:**
> - `lib/ocr/ine-ocr-parser.ts` — Parser principal, cascada de nombres, orquestación
> - `lib/ocr/ine-address.ts` — Extracción experta de domicilio (6 estrategias)
> - `lib/ocr/ine-spatial.ts` — Clasificación espacial por zonas de la INE
> - `lib/ocr/mexican-names.ts` — Diccionario de nombres/apellidos mexicanos + corrección
> - `components/survey/ine-question.tsx` — Componente de captura + invocación OCR
>
> **Fecha:** 2026-02-22 (v3 — spatial + diccionario + domicilio experto)

---

## 1. ¿Qué devuelve ML Kit Text Recognition?

`@react-native-ml-kit/text-recognition` expone una jerarquía de tres niveles con **coordenadas de posición** para cada nivel:

```
VisionText
  └── blocks[]          ← párrafos / regiones semánticas
        ├── frame        { x, y, width, height }  ← bounding box en px
        ├── text         (todo el bloque como string)
        └── lines[]
              ├── frame  { x, y, width, height }
              ├── text
              └── elements[]    ← palabras individuales
                    ├── frame   { x, y, width, height }
                    └── text
```

Cada `block`, `line` y `element` tiene un campo `frame` con la posición exacta del texto en la imagen original.

**Importante:** Ahora preservamos y pasamos los bloques completos (con `frame`) al parser, en vez de descartarlos tras ordenar.

---

## 2. Arquitectura del pipeline OCR (v3)

```
Camera capture (JPEG)
        │
        ▼
ML Kit TextRecognizer.recognize(imagePath)
        │  returns VisionText { blocks[] }
        ▼
┌──────────────────────────────────────────────┐
│  ine-question.tsx: extractIneOcr()           │
│  ├── Ordena bloques por frame.y (top→bottom) │
│  ├── Genera frontText/backText (concatenado)  │
│  └── PRESERVA frontBlocks/backBlocks (frame) │
└──────────────────────────────────────────────┘
        │
        ▼
parseIneOcrText(frontText, backText, modelo, frontBlocks, backBlocks)
        │
        ├── normalizeOcrText()
        │     ├── toUpperCase()
        │     ├── strip watermark chars (◆ ● ■ »)
        │     ├── collapse whitespace per line
        │     └── drop lines < 2 chars
        │
        ├── CURP:           regex loose → fixCurpOcr() → regex strict
        ├── Clave Elector:  regex loose → fixClaveElectorOcr() → regex strict
        ├── Fecha Nac.:     3 formatos (DD/MM/YYYY, DD MMM YYYY, DDMMYYYY)
        ├── Sexo:           regex SEXO: [HM] | derivar de CURP[10]
        ├── Sección:        regex SECCIÓN: NNNN
        ├── Vigencia:       regex VIGENCIA: YYYY
        │
        ├── ◆ NOMBRES (cascada de 4 estrategias + post-procesamiento)
        │     ├── 1. Spatial (ine-spatial.ts) — zonas de la INE
        │     ├── 2. Labels — etiquetas "APELLIDO PATERNO" en texto
        │     ├── 3. Block — bloque pre-CURP
        │     ├── 4. CURP initials — iniciales como último recurso
        │     ├── Post: fixNameOcr() — corregir dígitos→letras
        │     ├── Post: correctNameFromDictionary() — Levenshtein-1
        │     └── Post: matchCurpInitials() — cross-validación CURP↔nombres
        │
        ├── ◆ DOMICILIO (cascada de 6 estrategias — ine-address.ts)
        │     ├── Spatial expert (zonas + heurísticas)
        │     └── Text expert (6 estrategias independientes, mejor score gana)
        │
        └── modeloDetected, confidence, fieldConfidence
```

---

## 3. Extracción de nombres: cascada de estrategias

### Prioridad: spatial > labels > block > curp_initials

| # | Estrategia | Módulo | Confianza | Descripción |
|---|-----------|--------|-----------|-------------|
| 1 | **Spatial** | `ine-spatial.ts` | 0.95 | Clasifica bloques por coordenadas en zonas de la INE (foto=izq, nombres=derecha-sup). Busca etiquetas PATERNO/MATERNO/NOMBRE con tolerancia OCR en la zona correcta. |
| 2 | **Labels** | `ine-ocr-parser.ts` | 0.90 | Busca etiquetas textuales ("APELLIDO PATERNO", "NOMBRE(S)") y la línea siguiente como valor. Acepta match parcial de etiquetas. |
| 3 | **Block** | `ine-ocr-parser.ts` | 0.70 | Busca bloques de texto que parecen nombres cerca de la CURP, usando heurística de posición (2-3 líneas de solo letras mayúsculas antes del CURP). |
| 4 | **CURP initials** | `ine-ocr-parser.ts` | 0.30 | Extrae las 4 primeras letras de la CURP como iniciales de paterno, materno y nombre. Solo useful como placeholder. |

### Post-procesamiento de nombres

1. **`fixNameOcr()`** — Corrige sustituciones de dígitos→letras comunes en OCR (`4→A`, `0→O`, `1→I`, `3→E`, `8→B`, `5→S`, `6→G`, `9→Q`).

2. **`correctNameFromDictionary()`** — Busca en diccionarios de ~200 nombres + ~200 apellidos mexicanos comunes. Si no encuentra match exacto, prueba corrección Levenshtein distancia-1 (una inserción, eliminación o sustitución). Ejemplo: `GARCI4` → `GARCIA`.

3. **`matchCurpInitials()`** — Verifica que las iniciales de nombre, apellido paterno y materno coincidan con las posiciones 0-3 del CURP. Si el score es < 0.5, prueba intercambiar campos (por si estaban en el slot equivocado). Ejemplo: si el parser puso "GARCIA" en nombre y "JUAN" en apellido paterno, pero CURP inicia con "GAJL", el swap corrige a paterno=GARCIA, nombre=JUAN.

### Diccionario de nombres mexicanos (`mexican-names.ts`)

- **~200 apellidos comunes:** GARCIA, HERNANDEZ, LOPEZ, MARTINEZ, RODRIGUEZ, GONZALEZ, PEREZ, SANCHEZ, RAMIREZ, TORRES, FLORES, RIVERA, GOMEZ, DIAZ, REYES, MORALES, JIMENEZ, RUIZ, ORTIZ, etc.
- **~200 nombres comunes (hombres + mujeres):** JUAN, JOSE, CARLOS, MARIA, GUADALUPE, ANA, LUIS, FRANCISCO, ALEJANDRO, PATRICIA, etc.
- **Nombres compuestos:** JOSE LUIS, MARIA GUADALUPE, JUAN CARLOS, ANA MARIA, etc.
- **Scoring:** `scoreAsNombre()` y `scoreAsApellido()` devuelven 0–1 basándose en match exacto y parcial.

---

## 4. Extracción de domicilio: 6 estrategias independientes (`ine-address.ts`)

### Filosofía

En vez de depender de una sola ancla ("DOMICILIO"), atacamos el problema desde **múltiples ángulos**. Cada estrategia produce un candidato con score de confianza independiente. Se elige el mejor, y si los dos mejores se complementan, se fusionan.

### Estructura de dirección mexicana (referencia)

```
CALLE/AV/BLVD NOMBRE  NUM [INT NUM]
COL./COLONIA/FRACC. NOMBRE_COLONIA
C.P. XXXXX  MUNICIPIO/DELEGACIÓN NOMBRE
ESTADO
```

### Las 6 estrategias

| # | Estrategia | Cómo funciona | Fortaleza |
|---|-----------|---------------|-----------|
| **A** | Ancla "DOMICILIO" | Busca etiqueta "DOMICILIO" (con tolerancia OCR: `D0MICILIO`, `DOM1CILIO`, `DOMIC`). Lee 10 líneas hacia adelante. | Más directa cuando la etiqueta es legible. |
| **B** | Código Postal | Busca "C.P. XXXXX" o 5 dígitos aislados. Reconstruye hacia atrás (calle) y adelante (estado). | Muy robusto — el C.P. es fácil de detectar. |
| **C** | Estado mexicano | Detecta uno de los 32 estados de México (más abreviaciones: CDMX, EDOMEX, JAL, etc.). Reconstruye hacia atrás. | Funciona incluso sin "DOMICILIO" ni "C.P." |
| **D** | Colonia/Fraccionamiento | Busca "COL.", "COLONIA", "FRACC.", etc. La calle está arriba, el C.P. y estado abajo. | Pattern muy reconocible. |
| **E** | Tipo de vialidad | Busca líneas que inician con CALLE, AV., AVENIDA, BLVD, etc. Lee hacia adelante. | Funciona cuando no hay ninguna otra etiqueta. |
| **F** | Filtrado negativo | **Último recurso.** Toma TODAS las líneas del reverso, quita lo que NO es dirección (CURP, clave, MRZ, fechas…). Lo que queda es probablemente dirección. | El más robusto ante OCR degradado — no necesita reconocer etiquetas. |

### Filtrado negativo: patrones que NO son dirección

El filtrado negativo identifica y excluye:
- CURP (patrón `[A-Z]{4}\d{6}[HM][A-Z]{5}`)
- Clave de Elector (18 letras consecutivas)
- MRZ (`<<<` o más de 3 `<` consecutivos)
- Fechas (EMISIÓN, VIGENCIA, REGISTRO)
- Sección electoral
- Encabezados institucionales (INSTITUTO, INE, IFE, CREDENCIAL, ELECTORAL)
- Etiquetas de campo (CURP, CLAVE, SEXO, NOMBRE, APELLIDO)
- Números cortos (1-4 dígitos: sección, página)
- Años sueltos (4 dígitos: 2020, 2025)

### Scoring de confianza del domicilio

Cada candidato se puntúa según patrones detectados:

| Patrón | Peso |
|--------|------|
| C.P. etiquetado (C.P. XXXXX) | +0.25 |
| Estado mexicano detectado | +0.20 |
| Número exterior | +0.15 |
| Colonia detectada | +0.15 |
| Municipio/Delegación | +0.10 |
| 2+ líneas de contenido | +0.05 |
| 3+ líneas de contenido | +0.05 |
| Base (hay texto) | +0.10 |
| *Penalidad: CURP mezclado* | -0.20 |
| *Penalidad: Clave mezclada* | -0.20 |

**Máximo teórico:** 1.10 → clamped a 1.0

### Fusión de candidatos

Si el mejor candidato tiene confianza < 0.5 y el segundo candidato tiene contenido complementario (no duplicado), se fusionan las líneas únicas de ambos y se re-puntúa. Si el score fusionado es mejor, se usa el resultado fusionado.

### Datos geográficos incluidos

- **32 estados de México** con variantes con/sin acento
- **~20 abreviaciones de estado**: AGS, BC, BCS, CAMP, CHIS, CHIH, CDMX, D.F., COAH, DGO, EDOMEX, GTO, GRO, HGO, JAL, MICH, MOR, NAY, NL, OAX, PUE, QRO, QROO, SLP, SIN, SON, TAB, TAMPS, TLAX, VER, YUC, ZAC
- Función `detectState()` busca primero estados completos (más largos primero) y luego abreviaciones con word boundary

---

## 5. Extracción espacial (`ine-spatial.ts`)

### Layout de la INE (frente)

```
┌─────────────────────────────────────────────┐
│  INSTITUTO NACIONAL ELECTORAL               │  ← header (y: 0–10%)
├─────────┬───────────────────────────────────┤
│         │  APELLIDO PATERNO                  │
│  FOTO   │  GARCIA                            │  ← nombres (y: 8–55%, x: >25%)
│         │  APELLIDO MATERNO                  │
│         │  LOPEZ                             │
│         │  NOMBRE(S)                         │
│         │  JUAN ANTONIO                      │
├─────────┼───────────────────────────────────┤
│         │  CURP: GALJ900101HMCRPN09         │  ← datos (y: 45–85%)
│ FIRMA   │  FECHA NAC: 01/01/1990  SEXO: H   │
├─────────┴───────────────────────────────────┤
│  CLAVE: GLPJNN90...  SECCIÓN: 1234  VIG: 29│  ← footer
└─────────────────────────────────────────────┘
```

### Layout de la INE (reverso)

```
┌─────────────────────────────────────────────┐
│  DOMICILIO                                   │  ← dirección (y: 0–50%)
│  CALLE REFORMA 123                           │
│  COL. CENTRO                                 │
│  C.P. 06000  CUAUHTÉMOC                      │
│  CIUDAD DE MÉXICO                            │
├─────────────────────────────────────────────┤
│  CLAVE: ...  CURP: ...  SECCIÓN: ...        │  ← datos (y: 40–80%)
├─────────────────────────────────────────────┤
│  MRZ / código de barras / QR                │  ← footer (y: 75–100%)
└─────────────────────────────────────────────┘
```

### Proceso de clasificación

1. **Estimar dimensiones de imagen** — Usa el bloque más lejano en X+width y Y+height
2. **Normalizar coordenadas** — Todas las posiciones se convierten a proporciones 0–1
3. **Clasificar bloques** — Según zona relativa (header, nombres, datos, dirección)
4. **Extraer datos** — Buscar etiquetas + valores en la zona correcta

---

## 6. Corrección OCR posicional (CURP / Clave)

CURP y Clave de Elector tienen esquema `LETRA/DÍGITO` fijo por posición:

### CURP (18 chars)

| Posiciones | Tipo esperado | Correcciones |
|-----------|---------------|--------------|
| 0-3 | Letra | `0→O`, `1→I`, `8→B`, `5→S`, `2→Z`, `6→G` |
| 4-9 | Dígito (fecha YYMMDD) | `O→0`, `I→1`, `L→1`, `B→8`, `S→5`, `Z→2` |
| 10 | Letra (H/M) | correcciones de letra |
| 11-13 | Letra (estado) | correcciones de letra |
| 14-17 | Alfanumérico | sin corrección |

### Clave de Elector (18 chars)

| Posiciones | Tipo esperado | Correcciones |
|-----------|---------------|--------------|
| 0-5 | Letra | `0→O`, `1→I`, etc. |
| 6-13 | Dígito | `O→0`, `I→1`, etc. |
| 14 | Letra (H/M) | correcciones de letra |
| 15-17 | Dígito | correcciones de dígito |

---

## 7. Confianza por campo

| Estrategia | Confianza | Cuándo aplica |
|-----------|-----------|---------------|
| Strict regex + validación post-corrección | **1.0** | CURP/Clave que pasan regex estricto |
| Extracción espacial de nombres | **0.95** | Nombres vía zonas espaciales de la INE |
| Heurística con etiqueta explícita | **0.90** | Nombre vía "APELLIDO PATERNO" label |
| Derivado de otro campo | **0.85** | Sexo inferido de CURP[10] |
| Heurística sin etiqueta (bloque pre-CURP) | **0.70** | Nombre vía posición relativa al CURP |
| Domicilio (multi-estrategia) | **0.15–1.0** | Scoring dinámico según patrones detectados |
| Fallback (iniciales desde CURP) | **0.30** | Nombres solo como iniciales |
| No encontrado | **0.0** | Campo vacío |

---

## 8. Limitaciones conocidas y mitigaciones

| Limitación | Impacto | Mitigación implementada |
|-----------|---------|------------------------|
| ML Kit puede desordenar bloques | Nombres/dirección desordenados | Sorting por `frame.y` + spatial zones |
| OCR confunde letras/dígitos | Nombres erróneos (GARCI4) | Diccionario + Levenshtein-1 + OCR fixes |
| Nombres pueden quedar en slot equivocado | paterno↔nombre intercambiados | CURP cross-validation con auto-swap |
| "DOMICILIO" puede ser ilegible | No se encuentra la dirección | 6 estrategias independientes + filtrado negativo |
| Credenciales reflejadas/borrosas | Texto muy ruidoso | Múltiples anclas: C.P., estado, colonia, filtrado negativo |
| 4 modelos de INE con layouts diferentes | Zonas espaciales varían | Proporciones relativas ±5%, cascada text como fallback |
| MRZ confunde regex de CURP | Falsos positivos | Filtro de líneas con `<<<` |

---

## 9. Roadmap de mejoras

| # | Mejora | Estado |
|---|--------|--------|
| 1 | Ordenar bloques por `frame.y` top→bottom | ✅ Implementado |
| 2 | Filtrar líneas MRZ del reverso | ✅ Implementado |
| 3 | Exponer `modeloDetected` en resultado | ✅ Implementado |
| 4 | Imagen 1600px para OCR | ✅ Implementado |
| 5 | **Extracción espacial por zonas** | ✅ Implementado (v3) |
| 6 | **Diccionario de nombres mexicanos** | ✅ Implementado (v3) |
| 7 | **Cross-validación CURP↔nombres** | ✅ Implementado (v3) |
| 8 | **Domicilio multi-estrategia (6 estrategias)** | ✅ Implementado (v3) |
| 9 | **Datos geográficos (32 estados + abreviaciones)** | ✅ Implementado (v3) |
| 10 | **Filtrado negativo como último recurso** | ✅ Implementado (v3) |
| 11 | Tests unitarios con strings OCR reales | ⬜ Pendiente |
| 12 | Preprocesamiento avanzado (contraste/grayscale) | ⬜ Pendiente |
| 13 | Endpoint OCR en backend (Google Vision) | ⬜ Pendiente |
