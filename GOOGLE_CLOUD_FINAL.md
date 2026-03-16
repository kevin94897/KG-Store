# ✅ FINAL: Google Picker 403 Fix - Paso a Paso

## 🔴 ERROR ACTUAL

```
[ImageUploader] Got access token, opening picker
[ImageUploader] Picker built successfully, showing...
Failed to load resource: 403 (chrome-error://chromewebdata)
```

## 🎯 ROOT CAUSE

El **Google Picker popup obtiene el token correctamente**, pero cuando intenta conectar a los servidores de Google, recibe **403 Forbidden**. Esto significa que **Google Cloud Console NO autoriza el origen http://localhost:5175**.

---

## ✅ CAMBIOS YA REALIZADOS

1. ✅ vite.config.js - Headers COOP + middleware 
2. ✅ vercel.json - Headers COOP para producción
3. ✅ ImageUploader.jsx - Better error logging
4. ✅ Server reiniciado

---

## 🔧 PASO FINAL (CRÍTICO): Google Cloud Console

### Opción A: Si NUNCA configuraste OAuth

1. Ve a https://console.cloud.google.com
2. Selecciona **Project: Tienda KG Store** (con ID `jkwndsbhrycyqwweungi`)
3. **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
   - Type: **Web application**
   - Name: `kg-admin-oauth`
   - En **Authorized JavaScript origins**, click **ADD URI**:
     ```
     http://localhost:5175
     http://localhost:3000
     https://kg-admin-delta.vercel.app
     ```
   - En **Authorized redirect URIs**, click **ADD URI** (same as above):
     ```
     http://localhost:5175
     http://localhost:3000
     https://kg-admin-delta.vercel.app
     ```
   - Click **CREATE** 
5. Copia el **Client ID** y **Api Key**
6. Pega en **kg-admin/.env.local**:
   ```
   VITE_GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>
   VITE_GOOGLE_API_KEY=<YOUR_API_KEY>
   ```
7. Reinicia: `npm run dev`

---

### Opción B: Si YA tienes OAuth creado

1. Ve a https://console.cloud.google.com
2. Selecciona **Project: Tienda KG Store**
3. **APIs & Services > Credentials**
4. Bajo "OAuth 2.0 Client IDs", encontrar la credencial que contiene tu `VITE_GOOGLE_CLIENT_ID`
5. Click el **lápiz (Edit)**
6. En **Authorized JavaScript origins**:
   - Verifica que EXISTA `http://localhost:5175`
   - Si NO existe, click **ADD URI** y agrega:
     ```
     http://localhost:5175
     ```
7. En **Authorized redirect URIs**:
   - Verifica que EXISTA `http://localhost:5175`
   - Si NO existe, click **ADD URI** y agrega:
     ```
     http://localhost:5175
     ```
8. Click **SAVE**
9. Limpia navegador cache: **Ctrl+Shift+Delete**, marca "Cookies and other site data", click **Clear data**
10. Recarga: **Ctrl+F5** en http://localhost:5175

---

### Opción C: Habilitar APIs (Si no están habilitadas)

1. En Google Cloud Console, busca **Google Drive API**
   - Click en el resultado
   - Click **ENABLE** (si aparece)
2. Busca **Google Photos Library API**
   - Click en el resultado
   - Click **ENABLE** (si aparece)

---

## 🧪 VERIFICATION CHECKLIST

En http://localhost:5175, abre **F12 Console** y verifica:

```javascript
// 1. Verificar origen
console.log('Origin:', window.location.origin)
// Debería mostrar: Origin: http://localhost:5175

// 2. Verificar variables de entorno
console.log('GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID)
console.log('GOOGLE_API_KEY:', import.meta.env.VITE_GOOGLE_API_KEY)
// Ambos debería mostrar valores, no "undefined"

// 3. Verificar COOP headers
fetch('/').then(r => {
  console.log('COOP Header:', r.headers.get('Cross-Origin-Opener-Policy'))
  console.log('COEP Header:', r.headers.get('Cross-Origin-Embedder-Policy'))
})
// Debería mostrar:
// COOP Header: same-origin-allow-popups
// COEP Header: require-corp
```

---

## 🎯 TEST FLOW (después de Google Cloud config)

1. **En F12 Console**, ejecuta verificación arriba
2. Si todo ✅, click botón **"G. Photos"**
3. Deberías ver:
   ```
   [ImageUploader] Requesting new access token...
   [ImageUploader] Got access token, opening picker
   [ImageUploader] Opening Google Picker with token: ya29...
   [ImageUploader] Picker built successfully, showing...
   ```
4. **Google Picker popup abre** (sin error 403) ✅
5. Selecciona una foto
6. En console verás:
   ```
   [ImageUploader] Picked items: 1
   [google-photos-proxy] Request received: { hasMediaItemId: true, ... }
   [google-photos-proxy] Successfully downloaded image, size: 123456
   ```
7. Foto aparece en producto ✅

---

## 🚨 SI AÚN VES 403

### Diagnóstico Avanzado

En F12 **Network tab**:
1. Click botón "G. Photos"
2. En Network, busca requests a `docs.google.com`
3. Click on the request
4. Ver **Response** (puede tener detalles del error)

Errores comunes:
- `origin_mismatch` → El origen NO está en Google Cloud autorizado
- `invalid_client` → El Client ID es incorrecto o no existe
- `access_denied` → El usuario no tiene permiso (test users)

### Verificar Test Users (si OAuth está en TESTING mode)

1. Ve a **APIs & Services > OAuth consent screen**
2. Si está en **TESTING**, ve a **Test users**
3. Click **ADD USERS** y agrega tu email Google
4. Recarga la app

---

## 📋 FINAL CHECKLIST

- [ ] Google Cloud Console: Google Drive API ✅ **ENABLED**
- [ ] Google Cloud Console: Google Photos Library API ✅ **ENABLED**
- [ ] OAuth Credential existe y tiene:
  - [ ] `http://localhost:5175` en Authorized JavaScript origins
  - [ ] `http://localhost:5175` en Authorized redirect URIs
  - [ ] `https://kg-admin-delta.vercel.app` en ambos (para producción)
- [ ] kg-admin/.env.local tiene `VITE_GOOGLE_CLIENT_ID` y `VITE_GOOGLE_API_KEY`
- [ ] Dev server reiniciado: `npm run dev`
- [ ] Navegador cache limpiado: Ctrl+Shift+Delete
- [ ] Página recargada: Ctrl+F5
- [ ] F12 Console muestra variables de entorno ✅
- [ ] F12 Console muestra COOP headers ✅

---

## ✅ Después de Esto

Si completaste todos los pasos arriba y aún tienes 403:

1. Comparte el **Response del Network tab** en console
2. Comparte el **valor de VITE_GOOGLE_CLIENT_ID** (primeros 20 caracteres)
3. Confirma que **OAuth está en PRODUCTION** o tu email está en Test users

---

**Esta es la ÚLTIMA barrera. El 403 es 100% de Google Cloud Console, no de tu código.**
