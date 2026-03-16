# Google Photos Integration - Análisis y Correcciones

## 🔴 PROBLEMA IDENTIFICADO: 403 Forbidden

Las imágenes de Google Photos no se descargaban debido a **confusión entre tipos de IDs y uso incorrecto de autenticación**.

---

## ✅ ROOT CAUSES Y SOLUCIONES

### 1. **Confusión de IDs (📌 CAUSA RAÍZ)**

| Componente | ID Devuelto | Esperado | Problema |
|------------|-------------|----------|----------|
| Google Photos Picker | `mediaItemId` | Drive API `fileId` ❌ | Formato incompatible → 403 |
| Drive API | `fileId` | - | No es Google Photos |
| Photos Library API | `mediaItemId` | `mediaItemId` ✅ | Correcto |

**FIX:** El Edge Function ahora espera `mediaItemId` (no `fileId`)

### 2. **Bearer Token en URLs Públicas Firmadas (📌 CAUSA CRÍTICA)**

Estrategia Original (❌):
```typescript
const highResUrl = thumbnailUrl.replace(/=w\d+/, '=w2048')
const res = await fetch(highResUrl, {
  headers: { Authorization: `Bearer ${accessToken}` }  // ← PROBLEMA
})
```

Las URLs de Google Photos ya son **públicamente firmadas** (`s=<signature>`). Agregar `Authorization: Bearer` causa **403 Forbidden** porque Google rechaza solicitudes autenticadas a URLs públicas.

**FIX:** Remover header de autenticación en URLs públicas:
```typescript
const res = await fetch(downloadUrl) // Sin Bearer token
```

### 3. **Estrategias de Descarga Reorganizadas**

Antes: `[Thumbnail + Bearer ❌, Drive API ❌, Photos API]`
Después: `[Photos Library API (PRINCIPAL ✅), Drive API (fallback), Thumbnail (sin Bearer ✅)]`

---

## 📝 CAMBIOS REALIZADOS

### ✏️ Edge Function: `index.ts`

**Cambios:**
1. ✅ Agregado TypeScript interface `RequestBody`
2. ✅ Reordenadas estrategias: Photos Library API primero
3. ✅ Parámetro `mediaItemId` en lugar de `fileId`
4. ✅ Thumbnail URL sin Bearer token
5. ✅ Logging comprehensivo en cada paso
6. ✅ Error messages detallados con hints
7. ✅ Validación de variables de entorno

**Antes:**
```typescript
const { fileId, mimeType, accessToken, thumbnailUrl } = await req.json()
// ... 
if (thumbnailUrl) {
  const res = await fetch(highResUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }, // 403!
  })
}
```

**Ahora:**
```typescript
const body: RequestBody = await req.json()
const { mediaItemId, fileId, mimeType, accessToken, thumbnailUrl } = body

// ... Photos Library API primary strategy
console.log('[google-photos-proxy] Trying Photos Library API with mediaItemId:', mediaItemId)

// ... Thumbnail sin Bearer
const res = await fetch(highResUrl) // ✅ Sin Bearer token
```

### ✏️ Frontend: `ImageUploader.jsx`

**Cambio crítico:**
```typescript
// Antes ❌
body: JSON.stringify({
  fileId:       item.id,  // Incorrecto para Google Photos
  ...
})

// Ahora ✅
body: JSON.stringify({
  mediaItemId:  item.id,  // Correcto - es mediaItemId del picker
  ...
})
```

---

## 🧪 TESTING CHECKLIST

### Local Testing (Antes de Deploy)
- [ ] Verificar logs del Edge Function en Supabase Dashboard
  ```
  supabase functions deploy google-photos-proxy --no-verify-jwt
  ```
- [ ] Ver en tiempo real: Supabase > Edge Functions > google-photos-proxy > Logs

### Actions con Expected Behavior

| Acción | Expected Log | Status |
|--------|--------------|--------|
| Click "G. Photos" | `Request received: { hasMediaItemId: true, ...}` | ✅ |
| Seleccionar foto | `Trying Photos Library API with mediaItemId: ...` | ✅ |
| Download exitoso | `Successfully downloaded image, size: 123456` | ✅ |
| Upload a Storage | `Uploading to Supabase Storage...` | ✅ |
| URL generada | `Generated public URL: https://...` | ✅ |

### Error Scenarios

| Scenario | Error Message |
|----------|---------------|
| Token expirado | `Photos Library API error: 401` en logs |
| mediaItemId inválido | `Download failed - no image blob or too small` |
| Storage bucket no existe | `Storage upload error: Bucket not found` |
| Falta SUPABASE_URL | `Missing Supabase environment variables` |

---

## 📦 ENVIRONMENT VARIABLES (Edge Function)

Asegúrate que en **Supabase > Edge Functions > google-photos-proxy > Secrets**:
```
SUPABASE_URL        = https://jkwndsbhrycyqwweungi.supabase.co  ✅
SERVICE_ROLE_KEY    = eyJhbGc...  (sin prefijo SUPABASE_)        ✅
SUPABASE_ANON_KEY   = eyJhbGc...                                 ✅
```

---

## 📤 DEPLOYMENT

```bash
# Navega al proyecto
cd c:\Users\yehes\OneDrive\Escritorio\Kevin\kg-ecosystem

# Deploy el Edge Function corregido
supabase functions deploy google-photos-proxy

# Ver logs en tiempo real
supabase functions tail google-photos-proxy
```

---

## 🔍 DEBUGGING

Si aún obtienes 403:

1. **Verifica el accessToken:**
   ```javascript
   console.log('Token:', accessToken.substring(0, 20) + '...')
   console.log('Token scopes en browser:', tokenClient.requestAccessToken({ prompt: '' }))
   ```

2. **Verifica mediaItemId en Picker:**
   ```javascript
   console.log('Picked items:', picked.map(p => ({ id: p.id, type: p.mimeType })))
   ```

3. **Consulta Logs de Edge Function:**
   - Supabase Dashboard > Edge Functions > google-photos-proxy > Logs
   - Busca `[google-photos-proxy]` para ver todos los pasos

4. **Simula request con curl (en powershell):**
   ```powershell
   $body = @{
     mediaItemId = "ACYx1234..."
     mimeType = "image/jpeg"
     accessToken = "ya29.abc..."
     thumbnailUrl = "https://lh3.google..."
   } | ConvertTo-Json

   curl -X POST https://jkwndsbhrycyqwweungi.supabase.co/functions/v1/google-photos-proxy `
     -H "Content-Type: application/json" `
     -d $body
   ```

---

## 📚 REFERENCIAS

- [Google Photos Library API v1](https://developers.google.com/photos/library/guides/get-started)
- [Google Drive API v3](https://developers.google.com/drive/api/guides/manage-downloads)
- [Google Picker Parameters](https://developers.google.com/picker/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✨ NEXT STEPS

1. **Deploy** el Edge Function con `supabase functions deploy google-photos-proxy`
2. **Test** seleccionando una foto de Google Photos desde iOS Safari
3. **Monitor** los logs en Supabase Dashboard
4. **Celebra** si ves: `Generated public URL: https://...` ✅

---

**Status:** Ready for deployment ✅
**Last Updated:** 2026-03-16
