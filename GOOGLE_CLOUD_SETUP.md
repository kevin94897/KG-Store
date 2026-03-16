# COOP/CORS Fix para Google Picker - Google Cloud Configuration

## 🔴 PROBLEMA

El Google Picker lanza error:
```
Cross-Origin-Opener-Policy policy would block the window.opener call
Failed to load resource (403)
```

## ✅ SOLUCION IMPLEMENTADA

### 1. Headers COOP Agregados en Frontend

✅ **vercel.json** - Headers para producción
```json
"Cross-Origin-Opener-Policy": "same-origin-allow-popups"
"Cross-Origin-Embedder-Policy": "require-corp"
```

✅ **vite.config.js** - Headers para desarrollo local
```javascript
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  }
}
```

### 2. ⚠️ PRÓXIMO PASO - Configurar Google Cloud Console

Necesitas **AUTORIZAR LOS ORÍGENES** en Google Cloud:

#### En Google Cloud Console:
1. Ve a **APIs & Services > Credentials**
2. Selecciona tu OAuth 2.0 App (que contiene VITE_GOOGLE_CLIENT_ID)
3. Click en **Edit** (lápiz)
4. En **Authorized JavaScript origins**, AGREGA:

```
http://localhost:5175
https://kg-admin-delta.vercel.app
```

5. En **Authorized redirect URIs**, AGREGA (si no está):

```
http://localhost:5175
https://kg-admin-delta.vercel.app
```

6. Click **SAVE**

#### En Google Cloud > API Details (Drive & Photos Library):
1. Ve a **Enabled APIs & services**
2. **Google Drive API** > Click en él
3. Ir a **OAuth consent screen**
4. Bajo **Test users**, asegúrate que tu email está agregado
5. Repetir para **Google Photos Library API**

---

## 🧪 TESTING LOCAL

Después de hacer cambios en Google Cloud Console:

```bash
cd kg-admin
npm run dev
# Visita http://localhost:5175
```

En el navegador:
1. Click "G. Photos"
2. Deberías ver el Google Picker sin errores COOP
3. Selecciona una foto
4. Verifica Supabase Function logs

---

## 🚀 TESTING EN PRODUCCIÓN

Después del deploy a Vercel:

```bash
# Desde raíz del proyecto
git add .
git commit -m "Fix: Add COOP headers for Google Picker"
git push
```

Vercel desplegará automáticamente.

Luego:
1. Visita https://kg-admin-delta.vercel.app
2. Click "G. Photos"
3. Selecciona foto

---

## 📋 CHECKLIST GOOGLE CLOUD CONSOLE

- [ ] OAuth 2.0 Credential tiene mi Google Cloud Project ID
- [ ] `http://localhost:5175` está en **Authorized JavaScript origins**
- [ ] `https://kg-admin-delta.vercel.app` está en **Authorized JavaScript origins**
- [ ] Google Drive API está **Enabled**
- [ ] Google Photos Library API está **Enabled**
- [ ] Mi email está en **Test users** (si app está en Testing mode)

---

## 🔍 DEBUG - Si Aún Ves 403

En la consola del navegador (F12 > Console):

```javascript
// Captura el error real del Picker
window.gapi.picker.setListener(function(data) {
  if (data.action === 'error') {
    console.log('Picker Error:', data.error);
  }
});
```

O verifica el Network tab (F12 > Network):
- Busca requests a `docs.google.com/picker`
- Click en el request
- Mira la response (puede tener mensaje de error real)

---

## 🎯 DESPUÉS DE CONFIGURAR GOOGLE CLOUD

1. Limpia cache del navegador (Ctrl+Shift+Delete)
2. Recarga la app (Ctrl+F5)
3. Intenta Google Picker de nuevo

Si aún hay errores, comparte en Console los logs:
```javascript
console.log(document.currentScript?.src) // Verifica origin
```

---

**Status**: Frontend COOP headers ✅ - Pendiente: Google Cloud Console configuration
