# 🚀 Guía de configuración para Vercel + Neon + Cloudinary

## 1. Cloudinary — Crear Upload Preset

El upload de imágenes usa un "preset" sin firma para simplificar. Sigue estos pasos:

1. Entra a https://cloudinary.com → **Settings** (ícono de engranaje)
2. Ve a la pestaña **"Upload"**
3. Baja hasta **"Upload presets"** → clic en **"Add upload preset"**
4. Configura así:
   - **Preset name:** `kanm_products`  ← debe ser exactamente este nombre
   - **Signing mode:** `Unsigned`
   - **Folder:** `kanm`
5. Clic en **"Save"**

---

## 2. Variables de entorno en Vercel

Una vez hagas el deploy, debes agregar estas variables en Vercel:

1. Entra a https://vercel.com → tu proyecto → **Settings** → **Environment Variables**
2. Agrega cada una:
3. Asegúrate de marcar **Production**, **Preview** y **Development** para cada variable.

---

## 3. Conectar Vercel con GitHub

1. En Vercel → **Add New Project** → selecciona tu repo `kan-m`
2. Framework: **Next.js** (lo detecta automático)
3. **Build Command:** `prisma generate && prisma migrate deploy && next build`
4. Agrega las variables de entorno del paso 2
5. Clic en **Deploy**

---

## 4. Flujo después del deploy

Cada vez que hagas cambios:
```
git add .
git commit -m "descripción del cambio"
git push
```
Vercel detecta el push y redeploya automáticamente.

---

## ✅ Resumen de cómo funciona en producción

- **Imágenes:** Se suben directamente a Cloudinary → URL permanente guardada en Neon
- **Base de datos:** Neon PostgreSQL serverless → sobrevive cualquier redeploy
- **Deploy:** Vercel con CI/CD automático desde GitHub
