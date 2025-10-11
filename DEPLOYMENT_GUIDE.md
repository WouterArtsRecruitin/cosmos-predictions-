# 🚀 Cosmos Predictions - Deployment Guide

## ✅ GitHub Repository
**Repository:** https://github.com/WouterArtsRecruitin/cosmos-predictions-.git
**Status:** ✅ Code successfully pushed

## 📦 Netlify Deployment

### Step 1: Login to Netlify
1. Ga naar [netlify.com](https://netlify.com)
2. Login met je GitHub account

### Step 2: Import Project
1. Klik **"Add new site"** → **"Import an existing project"**
2. Selecteer **"Deploy with GitHub"**  
3. Zoek en selecteer: **`WouterArtsRecruitin/cosmos-predictions-`**

### Step 3: Build Settings
**Deze zijn automatisch geconfigureerd via netlify.toml:**
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** `18`

### Step 4: Environment Variables
Ga naar **Site settings → Environment variables** en voeg toe:

```env
ANTHROPIC_API_KEY = your-claude-api-key-from-console.anthropic.com
NGROK_API_TOKEN = your-ngrok-token-here
NEXT_PUBLIC_API_URL = https://your-site-name.netlify.app/api
```

**⚠️ Important:** Use your actual API keys from:
- **Anthropic Console:** https://console.anthropic.com/
- **Ngrok Dashboard:** https://dashboard.ngrok.com/

### Step 5: Deploy
1. Klik **"Deploy site"**
2. Wacht op build completion (2-3 minuten)
3. Je site is live! 🎉

## 🌐 Expected URL
`https://cosmic-predictions-[random].netlify.app`

## 🔧 Custom Domain (Optional)
1. Ga naar **Site settings → Domain management**
2. Add custom domain: `cosmos-predictions.yourdomain.com`
3. Configure DNS records zoals getoond

## ⚡ Features Live
✨ **Matrix Rain Animation**  
🌌 **3D Cosmos Visualization**  
🤖 **Claude AI Predictions**  
📱 **Fully Responsive**  
🔒 **Security Headers Configured**

## 🐛 Troubleshooting
- **Build fails:** Check Node.js version (should be 18)
- **API errors:** Verify ANTHROPIC_API_KEY is set correctly  
- **3D not loading:** Check browser WebGL support

---

**Ready for launch!** 🚀🌌