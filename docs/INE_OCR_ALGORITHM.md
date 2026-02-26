# 🪪 Algoritmo OCR de la INE — Documentación Técnica

Documentación completa del sistema de extracción OCR para la Credencial para Votar (INE/IFE) de México.

---

## Índice

1. [Visión General](#1-visión-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Captura y Preprocesamiento](#3-captura-y-preprocesamiento)
4. [Pipeline de Extracción](#4-pipeline-de-extracción)
5. [Extracción de Nombres — Merge Inteligente](#5-extracción-de-nombres--merge-inteligente)
6. [Parser MRZ (Machine Readable Zone)](#6-parser-mrz-machine-readable-zone)
7. [Clasificación Espacial](#7-clasificación-espacial)
8. [Diccionario de Nombres Mexicanos](#8-diccionario-de-nombres-mexicanos)
9. [Extracción de Domicilio](#9-extracción-de-domicilio)
10. [Cross-Validación CURP ↔ Nombres](#10-cross-validación-curp--nombres)
11. [Corrección de Errores OCR](#11-corrección-de-errores-ocr)
12. [Sistema de Confianza](#12-sistema-de-confianza)
13. [Modelos de INE Soportados](#13-modelos-de-ine-soportados)
14. [Layout Físico de la INE](#14-layout-físico-de-la-ine)
15. [Archivos del Sistema](#15-archivos-del-sistema)
16. [Limitaciones Conocidas](#16-limitaciones-conocidas)

---

## 1. Visión General

El OCR de la INE funciona **100% on-device** usando ML Kit Text Recognition. No hay procesamiento del lado del servidor — todo el reconocimiento de texto y la extracción de campos ocurre en el teléfono del brigadista.

### Flujo simplificado

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐
│  Captura de  │ →  │  ML Kit Text │ →  │  Parser OCR  │ →  │  Formulario│
│  foto (2x)   │    │  Recognition │    │  + MRZ + NLP │    │  editable  │
└─────────────┘    └──────────────┘    └──────────────┘    └────────────┘
  Frente/Reverso    Texto + Bloques     Campos + Confianza   Revisión manual
```

### Tecnologías

| Componente           | Tecnología                                                    |
| -------------------- | ------------------------------------------------------------- |
| Captura de imagen    | `react-native-document-scanner-plugin` (edge detection)       |
| Redimensionado       | `expo-image-manipulator` (1600px, JPEG 85%)                   |
| OCR                  | `@react-native-ml-kit/text-recognition` (on-device, gratuito) |
| Validación CURP      | Regex local + RENAPO API (via proxy backend)                  |
| Almacenamiento fotos | Cloudinary (signed upload 2 fases)                            |

---

## 2. Arquitectura del Sistema

```
lib/ocr/
├── ine-ocr-parser.ts    # Parser principal — orquesta todo (~1400 líneas)
├── ine-mrz.ts           # Parser MRZ (Machine Readable Zone) del reverso
├── ine-spatial.ts        # Clasificación espacial por bounding boxes (~930 líneas)
├── ine-address.ts        # Extracción experta de domicilio (~870 líneas)
├── mexican-names.ts      # Diccionario + corrección de nombres (~700 líneas)
└── curp-validator.ts     # Validación CURP local + RENAPO

components/survey/
└── ine-question.tsx      # UI — captura, ML Kit calls, formulario editable (~1500 líneas)
```

### Dependencias entre módulos

```
ine-question.tsx
    └── ine-ocr-parser.ts (parseIneOcrText)
            ├── ine-mrz.ts (parseMrz)
            ├── ine-spatial.ts (classifyFrontBlocks, extractNamesFromSpatial)
            ├── ine-address.ts (extractDomicilioExpert, extractAddressFromSpatialExpert)
            └── mexican-names.ts (fixNameOcr, correctNameFromDictionary, matchCurpInitials)
```

---

## 3. Captura y Preprocesamiento

### Captura de fotos

El brigadista captura dos fotos:

1. **Frente** — contiene nombres, domicilio, CURP (modelos C/D), foto, firma
2. **Reverso** — contiene CURP, MRZ, código de barras, QR

Cada foto pasa por:

1. `react-native-document-scanner-plugin` — detección automática de bordes y corrección de perspectiva
2. `expo-image-manipulator` — redimensionado a 1600px de ancho, compresión JPEG al 85%

### ML Kit Text Recognition

```typescript
const result = await TextRecognition.recognize(uri);
// result.blocks: OcrBlock[] con { text, frame: {x,y,width,height}, lines[] }
```

Los bloques se **ordenan por Y** (top→bottom) para simular orden de lectura antes de pasar al parser:

```typescript
const sorted = [...r.blocks].sort(
  (a, b) => (a.frame?.y ?? 0) - (b.frame?.y ?? 0),
);
```

### Normalización de texto

`normalizeOcrText()` en `ine-ocr-parser.ts`:

1. Convertir a MAYÚSCULAS
2. Reconstruir Ñ: `N~` → `Ñ`, `~N` → `Ñ`
3. Eliminar símbolos de marca de agua (`◆ ● ■ » * | ~`)
4. Colapsar espacios múltiples
5. Eliminar líneas cortas (< 2 chars)
6. **Filtrar líneas MRZ** (contienen `<`) — estas se procesan aparte por `ine-mrz.ts`

---

## 4. Pipeline de Extracción

La función principal `parseIneOcrText()` ejecuta la extracción en este orden:

```
Paso 0: Extraer MRZ del texto CRUDO (antes de normalizar)
Paso 1: Normalizar texto (frente + reverso)
Paso 2: Dividir en líneas
Paso 3: Inicializar confianzas por campo

Campo por campo:
├── CURP          → regex loose + fixCurpOcr()
├── Clave Elector → regex loose + fixClaveElectorOcr()
├── Fecha Nac.    → 3 formatos (DD/MM/YYYY, DD MES YYYY, DDMMYYYY)
│                   + fallback desde CURP + fallback desde MRZ
├── Sexo          → etiqueta "SEXO H/M" + fallback CURP + fallback MRZ
├── Sección       → regex "SECCIÓN XXXX"
├── Vigencia      → regex "VIGENCIA YYYY"
├── Nombres       → MERGE INTELIGENTE de 5 estrategias (ver §5)
│                   + cross-validación CURP ↔ nombres
├── Domicilio     → cascada 4 fuentes (ver §9)
└── Modelo INE    → auto-detección + modeloHint del brigadista

Final: Calcular confianza global ponderada
```

### Campos extraídos (IneOcrResult)

| Campo             | Tipo      | Ejemplo                                      |
| ----------------- | --------- | -------------------------------------------- |
| `nombre`          | string    | `"JUAN ANTONIO"`                             |
| `apellidoPaterno` | string    | `"GARCIA"`                                   |
| `apellidoMaterno` | string    | `"LOPEZ"`                                    |
| `curp`            | string    | `"GALJ900101HMCRPN09"`                       |
| `claveElector`    | string    | `"GRCLPJ90010100H001"`                       |
| `fechaNacimiento` | string    | `"01/01/1990"`                               |
| `sexo`            | string    | `"H"` o `"M"`                                |
| `seccion`         | string    | `"1234"`                                     |
| `vigencia`        | string    | `"2029"`                                     |
| `domicilio`       | string    | `"C REFORMA 234, COL CENTRO, C.P. 06000..."` |
| `modeloDetected`  | IneModelo | `"C_INE2015"`                                |
| `confidence`      | number    | `0.87`                                       |
| `fieldConfidence` | Record    | `{ nombre: 0.95, curp: 1.0, ... }`           |

---

## 5. Extracción de Nombres — Merge Inteligente

### Problema con la cascada anterior

El sistema anterior usaba una cascada `??`:

```typescript
// ANTES (bloqueaba estrategias parciales)
const nameResult = spatial ?? labels ?? block ?? curpInitials;
```

**Problema:** Si `spatial` retornaba `{ apellidoPaterno: "GARCIA", nombre: "" }` (parcial), las estrategias `labels` y `block` que SÍ tenían el nombre **nunca se consultaban**.

### Solución: Merge por campo

```typescript
// AHORA (combina lo mejor de cada estrategia)
const merged = selectBestNames(allStrategies, curp);
```

Se ejecutan **las 5 estrategias** y se selecciona el mejor candidato **por campo individual**:

### Las 5 estrategias de nombres

| #   | Estrategia        | Confianza base | Fuente                            | Cuándo funciona                       |
| --- | ----------------- | -------------- | --------------------------------- | ------------------------------------- |
| 1   | **MRZ**           | ~0.88          | Reverso (línea 3 del TD1)         | Siempre que ML Kit lea el MRZ         |
| 2   | **Spatial**       | 0.95           | Zona de nombres (bounding boxes)  | Labels claras + foto bien centrada    |
| 3   | **Labels**        | 0.90           | Regex en texto combinado          | Etiquetas "APELLIDO PATERNO" legibles |
| 4   | **Block**         | 0.70           | Líneas antes del ancla CURP/FECHA | CURP extraída + texto limpio          |
| 5   | **CURP initials** | 0.30           | Posiciones 0-3 del CURP           | Último recurso (solo iniciales)       |

### Scoring de candidatos

Cada candidato por campo se puntúa con:

```
Score = ConfianzaBase
      + (matchDiccionario × 0.20)    // bonus si está en diccionario INEGI
      + (matchCURP × 0.15)            // bonus si inicial coincide con CURP
      - (0.20 si valor < 4 chars)     // penalización por valores cortos
      - (0.30 si es curp_initials)    // penalización por ser solo iniciales
```

**Ejemplo de merge:**

```
Spatial   → apellidoPaterno: "GARCIA" (score 1.30), nombre: "" (no encontrado)
Labels    → apellidoPaterno: ""      , nombre: "JUAN" (score 1.25)
Block     → apellidoPaterno: "GARC1A" (score 0.85), nombre: "JUAN" (score 0.85)

Merge     → apellidoPaterno: "GARCIA" (de spatial), nombre: "JUAN" (de labels)
```

---

## 6. Parser MRZ (Machine Readable Zone)

### ¿Qué es el MRZ?

La Machine Readable Zone es el texto codificado en formato ICAO 9303 (TD1) que aparece en la parte inferior del reverso de la INE. Está impreso en fuente OCR-B y tiene un formato determinístico.

### Formato TD1 (3 líneas × 30 chars)

```
Línea 1: I<MEX[DocNum:9][CD][Opcional:15]
Línea 2: [DOB:YYMMDD][CD][Sexo:M/F][Exp:YYMMDD][CD][MEX][Opc][CD]
Línea 3: PATERNO<MATERNO<<NOMBRE1<NOMBRE2<<<<<<<<<<
```

### Codificación de nombres (Línea 3)

```
GARCIA<LOPEZ<<JUAN<ANTONIO<<<<<<<<<<<<
       │           │
       │           └── < simple separa nombres
       └── << doble separa apellidos de nombres

→ Paterno: GARCIA
→ Materno: LOPEZ
→ Nombre:  JUAN ANTONIO
```

### Ventajas del MRZ

- **Formato determinístico** — no depende de heurísticas posicionales
- **Nombres completos** — siempre contiene los 3 campos
- **Consistente** entre modelos de INE
- **Fallback confiable** — funciona incluso cuando el frente es ilegible

### Mapeo de sexo ICAO → INE

| MRZ (ICAO)   | INE          |
| ------------ | ------------ |
| `M` (Male)   | `H` (Hombre) |
| `F` (Female) | `M` (Mujer)  |

### Lógica de siglo dinámica

```typescript
const currentYear = new Date().getFullYear();
const cutoff = (currentYear - 18) % 100; // 2026 → cutoff=8, 2027 → cutoff=9
const century = yy <= cutoff ? 2000 : 1900;
```

Esto asegura que la lógica **nunca se rompe** conforme pasan los años. Antes era:

```typescript
const year = yy <= 8 ? 2000 + yy : 1900 + yy; // ❌ se rompía en 2027
```

---

## 7. Clasificación Espacial

### Algoritmo: Anclas + Fallback Proporcional

El módulo `ine-spatial.ts` clasifica cada bloque OCR en una zona de la credencial usando las coordenadas (bounding boxes) de ML Kit.

### Paso 1: Detección de anclas

Busca etiquetas conocidas en los bloques OCR:

| Ancla            | Regex (OCR-tolerante)         | Zona que delimita   |
| ---------------- | ----------------------------- | ------------------- |
| APELLIDO PATERNO | `/PATERN[O0]/i`               | Inicio de NOMBRES   |
| DOMICILIO        | `/D[O0]M[I1]C[I1]L[I1][O0]/i` | Inicio de DIRECCIÓN |
| CLAVE DE ELECTOR | `/CLAVE.*ELECT/i`             | Inicio de DATOS     |
| CURP             | `/^CURP$/i`                   | Inicio de DATOS     |
| INSTITUTO        | `/INSTITUTO\|ELECTORAL/i`     | HEADER              |

### Paso 2: Zonas dinámicas

Con las posiciones Y normalizadas de las anclas se calculan fronteras:

```
HEADER:    y = 0           →  min(ancla_paterno - 3%, 10%)
NOMBRES:   ancla_paterno   →  ancla_domicilio
DOMICILIO: ancla_domicilio →  ancla_clave
DATOS:     ancla_clave     →  100%
```

### Paso 3: Fallback a proporciones fijas

Si una ancla no se encuentra (OCR ruidoso):

| Ancla ausente | Proporción fija   |
| ------------- | ----------------- |
| PATERNO       | nameYMin = 8%     |
| DOMICILIO     | addressYMin = 28% |
| CLAVE/CURP    | dataYMin = 55%    |

### Ejemplo visual

```
Bloque "INSTITUTO NACIONAL..."    y=0.04  → HEADER
Bloque "APELLIDO PATERNO"         y=0.12  → ★ Ancla PATERNO
Bloque "GARCIA"                    y=0.17  → NOMBRES
Bloque "DOMICILIO"                 y=0.38  → ★ Ancla DOMICILIO
Bloque "C REFORMA 234"            y=0.43  → DOMICILIO
Bloque "CLAVE DE ELECTOR"         y=0.56  → ★ Ancla CLAVE
Bloque "GALJ900101HMCRPN09"       y=0.61  → DATOS
```

### Extracción de nombres desde zona spatial

Maneja 3 patrones de ML Kit:

1. **Bloques separados:** etiqueta en un bloque, valor en el siguiente
2. **Inline:** `"APELLIDO PATERNO GARCIA"` en una sola línea
3. **Multi-línea fusionada:** ML Kit fusiona etiqueta + valor en un solo bloque

**Nuevo: Fallback posicional** — Si no se detectan etiquetas pero hay ≥2 líneas de texto tipo nombre en la zona, se asignan por posición:

- Línea 1 → Apellido Paterno
- Línea 2 → Apellido Materno
- Línea 3+ → Nombre(s)

---

## 8. Diccionario de Nombres Mexicanos

### Cobertura

- ~200 apellidos más comunes (INEGI/RENAPO)
- ~180 nombres de hombre + ~80 nombres de mujer
- ~50 nombres compuestos (`JOSE LUIS`, `MARIA GUADALUPE`, etc.)

### Funciones

| Función                            | Propósito                               |
| ---------------------------------- | --------------------------------------- |
| `scoreAsNombre(text)`              | Score 0–1: ¿parece nombre propio?       |
| `scoreAsApellido(text)`            | Score 0–1: ¿parece apellido?            |
| `fixNameOcr(raw)`                  | Corrige confusiones OCR (1→I, 0→O, 5→S) |
| `correctNameFromDictionary(raw)`   | Levenshtein ≤1: `GARC1A` → `GARCIA`     |
| `matchCurpInitials(curp, n, p, m)` | Cross-validación CURP ↔ nombres         |

### Correcciones OCR de nombres

```
MART1NEZ → MARTINEZ  (1→I)
G0NZALEZ → GONZALEZ  (0→O)
5ANCHEZ  → SANCHEZ   (5→S)
8AUTISTA → BAUTISTA  (8→B)
2AMORA   → ZAMORA    (2→Z)
```

---

## 9. Extracción de Domicilio

### 6 estrategias independientes

El módulo `ine-address.ts` implementa una cascada de estrategias por fuente:

| #   | Estrategia        | Ancla                        | Confianza típica |
| --- | ----------------- | ---------------------------- | ---------------- |
| 1   | Ancla DOMICILIO   | Texto después de "DOMICILIO" | +base            |
| 2   | Código Postal     | C.P. XXXXX como ancla        | +0.25            |
| 3   | Estado mexicano   | CDMX, JALISCO...             | +0.20            |
| 4   | Colonia           | COL./COLONIA/FRACC.          | +0.15            |
| 5   | Tipo de calle     | AV/BLVD/C/CALLE              | +0.15            |
| 6   | Filtrado negativo | Todo menos CURP/fechas/MRZ   | baja             |

### 4 fuentes de domicilio

1. **Espacial del frente** (zona de dirección por bounding boxes) — boost +0.05
2. **Texto del frente** (regex en texto normalizado) — boost +0.05
3. **Espacial del reverso** (fallback modelos IFE antiguos)
4. **Texto del reverso** (fallback)

Se elige el candidato con **mayor confianza** entre las 4 fuentes.

### Scoring del domicilio

| Componente                | Score |
| ------------------------- | ----- |
| C.P. presente (5 dígitos) | +0.25 |
| Número exterior           | +0.15 |
| Colonia detectada         | +0.15 |
| Estado mexicano           | +0.20 |
| Municipio/delegación      | +0.10 |
| ≥ 2 líneas de contenido   | +0.10 |
| Sin CURP/clave mezclada   | +0.05 |
| Base (hay texto)          | +0.10 |

---

## 10. Cross-Validación CURP ↔ Nombres

### Estructura del CURP (posiciones de nombre)

```
G A L J 900101 H MCRPN 09
│ │ │ │
│ │ │ └── Pos 3: Primera letra del NOMBRE
│ │ └──── Pos 2: Primera letra del APELLIDO MATERNO
│ └────── Pos 1: Primera vocal interna del APELLIDO PATERNO
└──────── Pos 0: Primera letra del APELLIDO PATERNO
```

### Proceso de validación

1. Verificar coincidencia de iniciales entre nombres extraídos y posiciones CURP
2. Si score < 0.5, probar **5 permutaciones** de los campos:
   - swap nombre ↔ paterno
   - swap nombre ↔ materno
   - swap paterno ↔ materno
   - rotación completa A
   - rotación completa B
3. Elegir la permutación con mejor score
4. Si aún falla, usar diccionario para desambiguar nombre vs apellido

---

## 11. Corrección de Errores OCR

### Confusiones estándar de cámara

| Carácter real | OCR lee    |
| ------------- | ---------- |
| O (letra)     | 0 (cero)   |
| I (letra)     | 1 (uno), L |
| B             | 8          |
| S             | 5          |
| Z             | 2          |
| G             | 6          |
| Ñ             | N~, ~N, N˜ |

### Corrección por posición (campos fijos)

Para CURP y Clave de Elector, el formato es determinístico:

```
CURP:  [LETRA×4][DÍGITO×6][LETRA][LETRA×3][ALFANUM×4]
CLAVE: [LETRA×6][DÍGITO×8][LETRA][DÍGITO×3]
```

Se corrige **posición por posición**:

- Si posición debe ser LETRA y OCR devolvió DÍGITO → corregir (0→O, 1→I, etc.)
- Si posición debe ser DÍGITO y OCR devolvió LETRA → corregir (O→0, I→1, etc.)

---

## 12. Sistema de Confianza

### Confianza por campo

Cada campo tiene confianza individual 0–1:

| Nivel    | Score    | Significado                     |
| -------- | -------- | ------------------------------- |
| Perfecto | 1.0      | Regex estricto validado         |
| Alto     | 0.9–0.95 | Estrategia con etiquetas claras |
| Medio    | 0.7–0.85 | Heurística o derivado de CURP   |
| Bajo     | 0.3–0.6  | Fallback o parcial              |
| Nulo     | 0.0      | Campo no encontrado             |

### Confianza global ponderada

```
Pesos:
  CURP:           2.0   Clave Elector:  1.5
  Nombre:         1.5   Ap. Paterno:    1.2
  Ap. Materno:    1.0   Fecha Nac.:     1.2
  Sexo:           0.8   Domicilio:      0.8
  Sección:        0.6   Vigencia:       0.6

confianzaGlobal = Σ(peso × confianza_campo) / Σ(peso)
```

---

## 13. Modelos de INE Soportados

| Modelo    | Período   | Institución | Detección                      |
| --------- | --------- | ----------- | ------------------------------ |
| A_IFE2008 | 2008–2013 | IFE         | "INSTITUTO FEDERAL ELECTORAL"  |
| B_IFE2013 | 2013–2017 | IFE         | Vigencia ≥ 2014                |
| C_INE2015 | 2015–2019 | INE         | "INSTITUTO NACIONAL ELECTORAL" |
| D_INE2019 | 2019+     | INE         | Vigencia ≥ 2024                |

### Diferencias clave entre modelos

- **A/B (IFE):** CURP solo en reverso, fuente serif
- **C (INE 2015):** CURP en frente + reverso, rediseño
- **D (INE 2019):** Modelo F, chip NFC, fuente sans-serif más pequeña

---

## 14. Layout Físico de la INE

### Frente

```
┌─────────────────────────────────────────────────────────────────┐
│  INSTITUTO NACIONAL ELECTORAL                   │  ← HEADER (0–8%)
├─────────┬───────────────────────────────────────┤
│         │  APELLIDO PATERNO                      │
│  FOTO   │  GARCIA                                │  ← NOMBRES (8–30%)
│         │  APELLIDO MATERNO                      │    (x > 25%)
│         │  LOPEZ                                 │
│         │  NOMBRE(S)                             │
│         │  JUAN ANTONIO                          │
│         ├───────────────────────────────────────┤
│         │  DOMICILIO                             │
│         │  C REFORMA 234                         │  ← DOMICILIO (30–55%)
│         │  COL CENTRO C.P. 06000                 │    (x > 25%)
│         │  CUAUHTÉMOC CDMX                       │
│         ├───────────────────────────────────────┤
│         │  CLAVE DE ELECTOR                      │
│ FIRMA   │  CURP: GRCLPJ900101HMCRPN09           │  ← DATOS (55–80%)
│         │  SECCIÓN: 1234  AÑO REG: 2015         │    (x > 25%)
│         │  FECHA NAC: 01/01/1990                 │
├─────────┴───────────────────────────────────────┤
│  SEXO: H  │  VIGENCIA 2029  │  MRZ inferior     │  ← FOOTER (80–100%)
└─────────────────────────────────────────────────┘
```

### Reverso

```
┌─────────────────────────────────────────────────┐
│  Datos adicionales                               │
│  Código de barras                                │
│  QR code                                         │
│  ─────────────────────────────────────────────── │
│  I<MEXGALJ900101<<<<00<<<<<<<<<1                 │  ← MRZ Línea 1
│  9001011H2901015MEX<<<<<<<<<<<4                  │  ← MRZ Línea 2
│  GARCIA<LOPEZ<<JUAN<ANTONIO<<<<<<<<<<<<<         │  ← MRZ Línea 3 (nombres)
└─────────────────────────────────────────────────┘
```

---

## 15. Archivos del Sistema

| Archivo                              | Líneas | Función                                          |
| ------------------------------------ | ------ | ------------------------------------------------ |
| `lib/ocr/ine-ocr-parser.ts`          | ~1415  | Parser principal, orquesta todas las estrategias |
| `lib/ocr/ine-mrz.ts`                 | ~270   | Parser de Machine Readable Zone                  |
| `lib/ocr/ine-spatial.ts`             | ~960   | Clasificación espacial por bounding boxes        |
| `lib/ocr/ine-address.ts`             | ~870   | Extracción experta de domicilio (6 estrategias)  |
| `lib/ocr/mexican-names.ts`           | ~700   | Diccionario INEGI + corrección OCR de nombres    |
| `lib/ocr/curp-validator.ts`          | ~150   | Validación CURP regex + RENAPO                   |
| `components/survey/ine-question.tsx` | ~1536  | UI: captura, ML Kit, formulario editable         |

---

## 16. Limitaciones Conocidas

1. **No hay OCR server-side** — todo depende del dispositivo del usuario
2. **ML Kit no garantiza orden de bloques** — se usan heurísticas de posición
3. **Credenciales dañadas o con reflejo intenso** — pueden producir texto ilegible
4. **MRZ depende de la calidad de captura del reverso** — si la foto del reverso está borrosa o recortada, el MRZ no se parsea
5. **RENAPO API es inestable** — timeout de 4s, falla intermitentemente
6. **Diccionario limitado** — ~400 nombres/apellidos, no cubre el 100% de la población
7. **Nombres extranjeros o indígenas** — pueden no estar en el diccionario
8. **No se detectan INEs duplicadas** — dos fotos de la misma credencial no se comparan
