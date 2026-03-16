# Optimización de Imágenes - Solución WebP + Compresión

## ¿Qué fue implementado?

Se agregó **optimización automática de imágenes** antes de subirlas a Supabase. Las imágenes pesadas de iPhone se comprimen y convierten a **WebP** (formato más eficiente que JPG).

## Cómo funciona

### 1. **Detección Automática**
- Si la imagen es **menor a 500 KB**, se sube tal cual (no optimizar)
- Si es **mayor a 500 KB**, se optimiza automáticamente

### 2. **Proceso de Optimización**
1. Carga la imagen en el navegador
2. Renderiza en un `<canvas>` HTML5
3. Reduce dimensiones si superan 1920px (ancho o alto)
4. Convierte a **WebP** con calidad 75% (excelente balance entre tamaño y calidad)
5. Si WebP no es soportado, usa PNG como fallback

### 3. **Resultados Esperados**
- **Imágenes de iPhone (4-10 MB)** → **200-500 KB** ✓
- Ahorro de **50-95%** del tamaño original
- Mantiene buena calidad visual
- Carga más rápido desde Supabase

## Archivos Modificados

### ✅ Nuevos
- [src/utils/imageOptimizer.js](src/utils/imageOptimizer.js) - Función de optimización

### ✅ Modificados
- [src/components/ImageUploader.jsx](src/components/ImageUploader.jsx) - Agregada integración

## Uso

No requiere cambios de tu parte. Las imágenes se optimizan **automáticamente** cuando:
- Subes desde **Cámara**
- Subes desde **Galería**
- Pegas desde **Portapapeles**

Los logs en la consola del navegador mostrarán:
```
[ImageOptimizer] Optimizando photo.heic (8.50 MB)
[ImageOptimizer] ✓ Comprimido a WebP: 0.35 MB (95.9% ahorro)
```

## Configuración

Para ajustar parámetros, edita [src/utils/imageOptimizer.js](src/utils/imageOptimizer.js):

```javascript
const MAX_SIZE = 2 * 1024 * 1024        // 2 MB de tamaño máximo
const MAX_DIMENSION = 1920               // Resolución máxima
const WEBP_QUALITY = 0.75                // Calidad (0-1, 0.75 es muy bueno)
```

- **Aumentar WEBP_QUALITY** → mejor calidad, archivo más grande
- **Reducir MAX_DIMENSION** → archivos más pequeños, menos detalles

## Compatibilidad

| Navegador | WebP | Fallback |
|-----------|------|----------|
| Chrome/Edge | ✓ | N/A |
| Firefox | ✓ | N/A |
| Safari iOS | ✓ Reciente | PNG |
| Safari Mac | ✓ Reciente | PNG |

## Próximas Mejoras Opcionales

1. **Redimensionamiento por tipo de imagen**
   - Miniaturas: 400x400px
   - Previsualizaciones: 800x800px
   - Originales: 1920x1920px

2. **Múltiples versiones**
   - Subir versión optimizada + pequeña thumbnail
   - Ahorrar más espacio en Supabase

3. **Progreso visual**
   - Mostrar "Comprimiendo..." durante optimización
   - Indicar ahorro de tamaño al usuario

4. **Soporte para más formatos**
   - HEIC → WebP (conversión en navegador)
   - AVIF (formato más reciente y más eficiente)
