# Google Photos Picker CORS/COOP - Fix Summary

## ✅ CAMBIOS REALIZADOS

### 1. **vercel.json** - Headers COOP para Producción
```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      {
        "key": "Cross-Origin-Opener-Policy",
        "value": "same-origin-allow-popups"
      },
      {
        "key": "Cross-Origin-Embedder-Policy",
        "value": "require-corp"
      }
    ]
  }
]
```

### 2. **vite.config.js** - Headers COOP para Development
```javascript
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  }
}
```

### 3. **ImageUploader.jsx** - Better Error Handling & Logging
- ✅ Agregado logging en cada paso: `[ImageUploader]` 
- ✅ Manejo de Picker errors
- ✅ Logging de access token obtenido
- ✅ Try-catch en picker builder

---

## 🔧 PRÓXIMOS PASOS (CRÍTICO)

### PASO 1: Commit & Push

```bash
cd "C:\Users\yehes\OneDrive\Escritorio\Kevin\kg-ecosystem"
git add kg-admin/vercel.json kg-admin/vite.config.js kg-admin/src/components/ImageUploader.jsx
git commit -m "Fix: Add COOP headers and improve Google Picker error handling"
git push
```

Vercel desplegará automáticamente en ~1-2 minutos.

---

### PASO 2: Configurar Google Cloud Console ⚠️ MUY IMPORTANTE

Sin esto, verás 403 en el Google Picker.

#### A. Habilitar APIs

1. Ve a https://console.cloud.google.com
2. Selecciona tu **Project ID: jkwndsbhrycyqwweungi** (si no está seleccionado)
3. En buscador superior, busca "Google Drive API"
   - Click en "Google Drive API"
   - Click **ENABLE** (si no está habilitado)
4. Vuelve atrás, busca "Google Photos Library API"
   - Click en "Google Photos Library API"
   - Click **ENABLE** (si no está habilitado)

#### B. Configurar OAuth Credentials

1. Ve a **APIs & Services > Credentials**
2. Bajo "OAuth 2.0 Client IDs", busca tu credencial (debe ser "Web application")
3. Click el lápiz (Edit)
4. En **Authorized JavaScript origins**, agrega (si no están):
   ```
   http://localhost:5175
   http://localhost:3000
   https://kg-admin-delta.vercel.app
   ```
5. En **Authorized redirect URIs**, agrega (si no están):
   ```
   http://localhost:5175
   http://localhost:3000
   https://kg-admin-delta.vercel.app
   ```
6. Click **SAVE**

#### C. Verificar OAuth 2.0 Consent Screen

1. Ve a **APIs & Services > OAuth consent screen**
2. Revisa que el estado sea uno de:
   - **PRODUCTION** (ideal) - no necesitas test users
   - **TESTING** - necesitas agregar tu email en "Test users"
3. Si está en **TESTING**:
   - Click **ADD USERS**
   - Agrega tu email (el que usas para Google)
   - Click **SAVE AND CONTINUE**

---

## 🧪 TESTING

### Testing Local (Desarrollo)

```bash
cd kg-admin
npm run dev
```

Luego:
1. Abre http://localhost:5175 en Chrome/Firefox/Safari
2. Click botón "G. Photos"
3. En **F12 Console**, deberías ver:
   ```
   [ImageUploader] Opening Google Picker with token: ya29...
   [ImageUploader] Picker built successfully, showing...
   ```
4. El Google Picker popup debería abrirse SIN error 403
5. Selecciona una foto
6. Deberías ver en console:
   ```
   [ImageUploader] Picked items: 1
   [ImageUploader] Processing item 1 / 1
   [google-photos-proxy] Request received: { hasMediaItemId: true, ... }
   ```

### Testing Producción (Después de Push)

1. Espera 1-2 minutos a que Vercel termine el deploy
2. Abre https://kg-admin-delta.vercel.app en Safari/Chrome
3. Click "G. Photos"
4. En **F12 Console**, deberías ver los mismos logs `[ImageUploader]`
5. Verifica Supabase Function logs: https://supabase.com/dashboard/project/jkwndsbhrycyqwweungi/functions

---

## 🔍 SI AÚN HAY ERRORES 403

En **F12 > Console**, ejecuta:

```javascript
// Ver el origen actual
console.log('Current Origin:', window.location.origin)

// Ver si gapi está cargado
console.log('gapi ready?', !!window.gapi)

// Ver si google está cargado
console.log('google.accounts ready?', !!window.google?.accounts)

// Ver environment variables
console.log('GOOGLE_API_KEY:', import.meta.env.VITE_GOOGLE_API_KEY?.substring(0, 10) + '...')
console.log('GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 10) + '...')
```

Si ves mensajes como:
- `Current Origin: http://localhost:5175` ← OK ✅
- `gapi ready? true` ← OK ✅
- `google.accounts ready? true` ← OK ✅

Pero aún hay 403, entonces el problema está en **Google Cloud Console** (autorizaciones de origen).

---

## 📋 FINAL CHECKLIST

- [ ] Cambios en vercel.json, vite.config.js, ImageUploader.jsx subidos a git
- [ ] Vercel deployment completado (revisa en deployments)
- [ ] Google Drive API habilitado en Google Cloud Console
- [ ] Google Photos Library API habilitado en Google Cloud Console
- [ ] Orígenes autorizados en OAuth credentials:
  - [ ] http://localhost:5175
  - [ ] https://kg-admin-delta.vercel.app
- [ ] OAuth consent screen está en PRODUCTION o tengo mi email en Test users
- [ ] F12 Console muestra `[ImageUploader]` logs sin errores
- [ ] Google Picker abre sin error 403

---

**Status**: Frontend ✅ - Pendiente: Google Cloud Console configuration
**Next Action**: Completar PASO 2 (Google Cloud Console) y testear
