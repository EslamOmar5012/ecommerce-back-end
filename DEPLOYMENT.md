# 🚀 E-Commerce Backend — Production Deployment Guide

This guide covers options for deploying your NestJS E-Commerce Backend to production hosting providers.

---

## 📋 Pre-Deployment Checklist

- [x] Environment variables configured in `.env` or cloud dashboard.
- [x] MongoDB Atlas instance or container ready.
- [x] Cloudinary account configured for image uploads.
- [x] Paymob account credentials configured.
- [x] Build passes (`npm run build`).

---

## Option 1: Deploy with Docker & Docker Compose (VPS / DigitalOcean / AWS EC2)

### 1. Transfer Project Files to Server
```bash
git clone <YOUR_GIT_REPOSITORY_URL>
cd ecommerce-back-end
```

### 2. Configure Production `.env`
Create `.env` on your server using `.env.example` as a template:
```bash
cp .env.example .env
nano .env
```

### 3. Launch Container Stack
```bash
docker-compose up -d --build
```

### 4. Verify Health Check
```bash
curl http://localhost:3000/health
```

---

## Option 2: Deploy to Render / Railway / Render

### Render Deployment
1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service**.
3. Environment: `Node`.
4. Build Command: `npm run build`.
5. Start Command: `npm run start:prod`.
6. Environment Variables: Copy all variables from `.env.example` into Render's Environment section.

### Railway Deployment
1. Connect your repository on [Railway.app](https://railway.app).
2. Railway automatically detects NestJS (`npm run build` and `npm run start:prod`).
3. Add MongoDB and Redis plugins from Railway Marketplace, or connect your external MongoDB Atlas URI.
4. Add environment variables.

---

## Option 3: Deploy to Vercel (Serverless API)

For Vercel deployment, ensure MongoDB Atlas URI is used (no local MongoDB).

### Create `vercel.json` in Root Directory:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/main.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/main.js"
    }
  ]
}
```

---

## 🔍 Post-Deployment Verification

1. **Swagger Documentation**: Open `https://<YOUR_DOMAIN>/api/docs` to test endpoints interactively.
2. **System Health Probe**: Open `https://<YOUR_DOMAIN>/health` to check database status.
3. **Paymob Callback Webhook**: Configure your webhook callback URL in Paymob Dashboard to point to:
   `https://<YOUR_DOMAIN>/orders/paymob-webhook`
