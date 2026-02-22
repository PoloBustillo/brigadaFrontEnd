# 🪪 Algoritmo OCR para Credencial INE

> **Archivo relevante:** `lib/ocr/ine-ocr-parser.ts`  
> **Componente consumidor:** `components/survey/ine-question.tsx`  
> **Fecha:** 2026-02-21

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

### Ejemplo de salida real (credencial INE 2019)

```json
{
  "blocks": [
    {
      "text": "INSTITUTO NACIONAL ELECTORAL",
      "frame": { "x": 12, "y": 5, "width": 280, "height": 14 }
    },
    {
      "text": "APELLIDO PATERNO\nGARCIA",
      "frame": { "x": 12, "y": 55, "width": 160, "height": 30 }
    },
    {
      "text": "CURP\nGARC901205HMCRZN09",
      "frame": { "x": 165, "y": 55, "width": 180, "height": 30 }
    }
  ]
}
```

---

## 2. Dos enfoques posibles: coordenadas vs. texto

| Enfoque                       | Cómo funciona                                                                                                                        | Ventajas                                                                    | Desventajas                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Coordenadas (spatial)**     | Dividir la imagen en zonas fijas (p. ej. "CURP siempre está en X 165–345, Y 50–90") y mapear bloques a esas zonas por su `frame.x/y` | Muy preciso si el layout es constante                                       | El layout varía entre modelos A/B/C/D; requiere calibración por modelo; falla si la foto está rotada o perspectivada |
| **Texto relativo (adoptado)** | Extraer `.text` de cada bloque, concatenar en orden de lectura, aplicar regex + heurística de "línea siguiente a etiqueta"           | Funciona independientemente de tamaño y modelo de INE; tolera rotación leve | Depende de que ML Kit preserve el orden de bloques (generalmente lo hace top→bottom, left→right)                     |

### ¿Por qué elegimos el enfoque de texto?

1. **4 modelos emitidos** (IFE 2008, IFE 2013, INE 2015, INE 2019): cada uno tiene un layout diferente. Las coordenadas absolutas de "CURP" varían en decenas de píxeles entre modelos.

2. **Fotografías inclinadas**: la cámara del teléfono rara vez está perfectamente paralela a la credencial. Una inclinación de 10° desplaza los bloques varios píxeles, haciendo inútil cualquier zona fija.

3. **Escalado**: la imagen capturada puede ser 1080×700px o 3024×2016px dependiendo del dispositivo. Las coordenadas absolutas son inútiles sin normalizar al tamaño real de la tarjeta.

4. **Las etiquetas son el ancla**: INE imprime "APELLIDO PATERNO", "CURP", "CLAVE DE ELECTOR" en texto —usar esas etiquetas como anclas textuales es más robusto que sus coordenadas.

---

## 3. Cuándo SÍ conviene usar coordenadas (trabajo futuro)

Si la precisión actual de los nombres (estrategia heurística ≈ 70%) no es suficiente, se puede adoptar un enfoque híbrido:

```
1. Detectar el modelo INE (ya implementado en detectIneModelo())
2. Por modelo, definir regiones de interés (ROI) relativas al tamaño de la tarjeta:
     MODELO_D: nombres en bloque inferior-izquierdo (y > 35% altura, x < 55% ancho)
     MODELO_C: nombres en franja central-izquierda (y 30-60%, x < 60%)
3. Filtrar blocks cuyo frame.y / imageHeight esté dentro del ROI
4. Sobre ese subconjunto aplicar los regex actuales
```

Esto requiere pasar `imageWidth` / `imageHeight` al parser, o calcular los ROIs en porcentajes relativos al frame del bloque más alto y más bajo detectados.

---

## 4. Arquitectura del algoritmo actual

```
Camera capture (JPEG)
        │
        ▼
ML Kit TextRecognizer.recognize(imagePath)
        │  returns VisionText { blocks[] }
        ▼
blocks.map(b => b.text).join('\n')   ← descartamos frame por ahora
        │
        ▼
normalizeOcrText()
  ├── toUpperCase()
  ├── strip watermark chars (◆ ● ■ »)
  ├── collapse whitespace per line
  └── drop lines < 2 chars
        │
        ▼
parseIneOcrText(frontText, backText)
  ├── CURP:           regex loose → fixCurpOcr() → regex strict
  ├── Clave Elector:  regex loose → fixClaveElectorOcr() → regex strict
  ├── Fecha Nac.:     3 formatos (DD/MM/YYYY, DD MMM YYYY, DDMMYYYY)
  ├── Sexo:           regex SEXO: [HM] | derivar de CURP[10]
  ├── Sección:        regex SECCIÓN: NNNN
  ├── Vigencia:       regex VIGENCIA: YYYY
  ├── Nombres:        cascada (etiquetas → bloque pre-CURP → iniciales CURP)
  └── Domicilio:      multi-línea post-"DOMICILIO" hasta label token
        │
        ▼
IneOcrResult { ...campos, confidence, fieldConfidence }
        │
        ▼
ine-question.tsx renderiza campos + badge de confianza por campo
```

---

## 5. Corrección de confusión OCR (posición a posición)

El parser aplica correcciones **posicionales** —distintas al layout de la imagen— sobre las cadenas candidatas. Esto se basa en que CURP y Clave de Elector tienen un esquema `LETRA/DÍGITO` fijo por posición:

### CURP (18 chars)

| Posiciones | Tipo esperado         | Correcciones                             |
| ---------- | --------------------- | ---------------------------------------- |
| 0-3        | Letra                 | `0→O`, `1→I`, `8→B`, `5→S`, `2→Z`, `6→G` |
| 4-9        | Dígito (fecha YYMMDD) | `O→0`, `I→1`, `L→1`, `B→8`, `S→5`, `Z→2` |
| 10         | Letra (H/M)           | mismas correcciones de letra             |
| 11-13      | Letra (estado)        | mismas correcciones de letra             |
| 14-17      | Alfanumérico          | sin corrección (ambos son válidos)       |

### Clave de Elector (18 chars)

| Posiciones | Tipo esperado | Correcciones           |
| ---------- | ------------- | ---------------------- |
| 0-5        | Letra         | `0→O`, `1→I`, etc.     |
| 6-13       | Dígito        | `O→0`, `I→1`, etc.     |
| 14         | Letra (H/M)   | correcciones de letra  |
| 15-17      | Dígito        | correcciones de dígito |

---

## 6. Confianza por campo

La confianza no es la confianza de ML Kit (que aplica a nivel de elemento gráfico, no semántico). Se calcula por la **estrategia de extracción** usada:

| Estrategia                                   | Confianza | Cuándo aplica                          |
| -------------------------------------------- | --------- | -------------------------------------- |
| Strict regex + validación post-corrección    | **1.0**   | CURP/Clave que pasan el regex estricto |
| Heurística con etiqueta explícita            | **0.9**   | Nombre via "APELLIDO PATERNO" label    |
| Heurística sin etiqueta (bloque pre-CURP)    | **0.7**   | Nombre via posición relativa al CURP   |
| Loose regex / regex sin validación estricta  | **0.75**  | CURP/Clave que no pasan regex estricto |
| Derivado de otro campo (ej. sexo desde CURP) | **0.85**  | Sexo inferido de CURP[10]              |
| Fallback (iniciales desde CURP)              | **0.3**   | Nombres solo como iniciales            |
| No encontrado                                | **0.0**   | Campo vacío                            |

La confianza global es: `sum(fieldConf[i] para campos con valor) / totalCampos`

---

## 7. Limitaciones conocidas

| Limitación                           | Impacto                           | Mitigación posible                                                 |
| ------------------------------------ | --------------------------------- | ------------------------------------------------------------------ |
| ML Kit no garantiza orden de bloques | Estrategia de bloque puede fallar | Usar `frame.y` para ordenar manualmente                            |
| No se usan coordenadas de ML Kit     | Perdemos información de layout    | Implementar ROI por modelo (ver §3)                                |
| Credenciales muy reflejadas          | Texto demasiado ruidoso           | Preprocesar imagen (contrast/threshold) con expo-image-manipulator |
| MRZ en reverso de algunos modelos    | Confunde regex de CURP            | Filtrar líneas con `<<<` o dígitos de check                        |
| Solo probado con texto sintético     | Resultados reales pueden diferir  | Unit tests con strings OCR reales capturados                       |

---

## 8. Uso del formato de confianza ML Kit (trabajo futuro)

ML Kit también expone `confidence` a nivel de `element` (palabra). Podría usarse para:

```ts
// Filtrar palabras con baja confianza antes de concatenar
const highConfidenceText = visionText.blocks
  .flatMap((b) => b.lines)
  .flatMap((l) => l.elements)
  .filter((e) => (e.confidence ?? 1) > 0.7)
  .map((e) => e.text)
  .join(" ");
```

Esto no está implementado en la versión actual porque `@react-native-ml-kit/text-recognition` no expone `confidence` directamente en su interface TypeScript (depende de la versión nativa).

---

## 9. Cómo mejorar la precisión (roadmap)

| #   | Mejora                                                                                                                        | Estado          |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | **Ordenar bloques por `frame.y`** — ordenar `blocks` por `frame.y` ascendente para garantizar orden top→bottom                | ✅ Implementado |
| 2   | **Filtrar líneas MRZ** (`<<<`) del reverso que confunden el regex de CURP                                                     | ✅ Implementado |
| 3   | **Exponer `modeloDetected`** en `IneOcrResult` y mostrar badge en la UI                                                       | ✅ Implementado |
| 4   | **Imagen más grande para OCR** — resize 1200 → 1600px antes de ML Kit                                                         | ✅ Implementado |
| 5   | **Tests unitarios con strings OCR reales** — fixtures en `lib/ocr/__tests__/ine-ocr-parser.test.ts`                           | ⬜ Pendiente    |
| 6   | **ROI por modelo** — filtros espaciales (`frame.y / imageHeight`) por modelo para nombres/domicilio                           | ⬜ Pendiente    |
| 7   | **Preprocesamiento avanzado** — contraste/grayscale cuando `expo-image-manipulator` lo soporte                                | ⬜ Pendiente    |
| 8   | **Endpoint OCR en backend** — FastAPI `/ocr/ine` con Google Vision `document_text_detection`                                  | ⬜ Pendiente    |
| 9   | **Mejorar domicilio** — expandir de 4 a 6 líneas y ajustar `LABEL_TOKENS` para modelos con colonia/municipio/estado separados | ⬜ Pendiente    |
