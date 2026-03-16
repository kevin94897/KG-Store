# 🔑 OBTENER SUPABASE API KEY

## Error Actual
```
No API key found in request
```

## ✅ Solución

### Paso 1: Ve a Supabase Dashboard
1. ➜ https://supabase.com/dashboard/project/jkwndsbhrycyqwweungi/settings/api

### Paso 2: Copia el "anon public" API key
- Busca la sección **"Project API keys"**
- Copia el valor bajo **"anon public"**
- Es un token JWT que empieza con `eyJ...`
- ⚠️ **Copia TODO el valor, debe ser largo (varios cientos de caracteres)**

### Paso 3: Pega en .env.local
```
VITE_SUPABASE_URL=https://jkwndsbhrycyqwweungi.supabase.co
VITE_SUPABASE_ANON_KEY=<PEGA_AQUI_TODO_EL_JWT>
```

**Ejemplo (NO USES ESTE, ES FALSO):**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprd25kc2JocnljeXF3d2V1bmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkzNDI5NjcsImV4cCI6MjAyNDkxODk2N30.XXXXXXXXXXXXXXXXXXXXXXXX
```

### Paso 4: Recarga el navegador
- Ctrl+F5 (hard refresh)
- Intenta loguearte de nuevo

---

## 🔍 Si Aún Tienes Error

Si después de pegar el API key aún ves "No API key found", verifica:

1. **El API key está completo?**
   - Debe tener 3 partes separadas por puntos: `xxx.xxx.xxx`
   - Debe tener varios cientos de caracteres

2. **Está en la línea correcta?**
   ```
   VITE_SUPABASE_ANON_KEY=<AQUI>
   ```

3. **Sin espacios extras?**
   - No debe haber espacios antes/después

---

## 💡 Alternativa: USA PRODUCCIÓN

Si prefires no configurar lo local, simplemente:
1. `git push` los cambios
2. Vercel despliega automáticamente
3. Tu app en `https://kg-admin-delta.vercel.app` ya tiene el API key configurado

---

**⏰ Acción Inmediata: Obtén el API key de Supabase Dashboard y actualiza .env.local**
