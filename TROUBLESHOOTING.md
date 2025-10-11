# 🔧 TROUBLESHOOTING & SETUP GUIDE

## 🚨 "Server niet bereikbaar" - FIXES

### **STAP 1: Clean Install**

```bash
# Ga naar project folder
cd /path/to/cosmos-predictions

# Verwijder oude node_modules en lock files
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Als errors, probeer:
npm install --legacy-peer-deps
```

---

### **STAP 2: Environment Variables**

```bash
# Kopieer example file
cp .env.local.example .env.local

# Edit .env.local (gebruik nano, vim, of VS Code)
nano .env.local
```

**Minimaal nodig:**
```env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**⚠️ BELANGRIJK:** API key is VERPLICHT voor predictions te werken!

---

### **STAP 3: Start Development Server**

```bash
# Start server
npm run dev

# Je moet zien:
# ✓ Ready in 2.3s
# ○ Local:    http://localhost:3000
```

**Als je errors ziet, check hieronder:** ↓

---

## 🐛 **COMMON ERRORS & FIXES:**

### **ERROR: "Module not found: @anthropic-ai/sdk"**

**FIX:**
```bash
npm install @anthropic-ai/sdk@latest
npm run dev
```

---

### **ERROR: "Module not found: three"**

**FIX:**
```bash
npm install three@0.144.0 @types/three@0.144.0
npm run dev
```

---

### **ERROR: "Cannot find module 'next'"**

**FIX:**
```bash
npm install next@14.2.18 react@18.3.1 react-dom@18.3.1
npm run dev
```

---

### **ERROR: TypeScript errors**

**FIX 1 - Rebuild:**
```bash
rm -rf .next
npm run dev
```

**FIX 2 - Update TypeScript:**
```bash
npm install -D typescript@latest
npm run dev
```

---

### **ERROR: "Port 3000 is already in use"**

**FIX - Use different port:**
```bash
npm run dev -- -p 3001
# Then open: http://localhost:3001
```

**Or kill existing process:**
```bash
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

---

### **ERROR: Canvas/WebGL not working**

**Check browser console (F12):**
- Look for WebGL errors
- Update browser to latest version
- Try different browser (Chrome recommended)

---

## ✅ **COMPLETE FRESH SETUP:**

Als ALLES faalt, complete reset:

```bash
# 1. Delete everything
rm -rf node_modules package-lock.json .next

# 2. Fresh install all dependencies
npm install

# 3. Install peer dependencies explicitly
npm install react@18.3.1 react-dom@18.3.1
npm install next@14.2.18
npm install three@0.144.0 @types/three@0.144.0
npm install @anthropic-ai/sdk@latest
npm install tailwindcss@latest autoprefixer@latest postcss@latest

# 4. Install dev dependencies
npm install -D typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest

# 5. Create .env.local
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local

# 6. Start server
npm run dev
```

---

## 🔍 **VERIFY SETUP:**

### **Check 1: Dependencies installed**
```bash
npm list three
npm list next
npm list @anthropic-ai/sdk
```

**Should show versions, not "UNMET DEPENDENCY"**

### **Check 2: TypeScript compiles**
```bash
npx tsc --noEmit
```

**Should show no errors (or only warnings)**

### **Check 3: Environment variables**
```bash
cat .env.local
```

**Should show your API key**

---

## 🚀 **MINIMAL WORKING SETUP:**

Als je ALLEEN Matrix → Cosmos wilt testen (zonder predictions):

1. **Comment out API calls:**

```typescript
// In app/predictions/page.tsx
// Comment out line ~30-35:
/*
const response = await fetch('/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question })
});
*/

// Replace with mock data:
const data = {
  question: question,
  scenarios: [/* mock scenarios */]
};
setResult(data);
```

2. **Skip .env.local:**
No API key needed for landing page!

3. **Start server:**
```bash
npm run dev
```

**✅ Matrix → Cosmos should work without API key!**

---

## 📱 **BROWSER REQUIREMENTS:**

**Minimum versions:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required features:**
- ✅ Canvas 2D (Matrix phase)
- ✅ WebGL (Cosmos phase)
- ✅ ES2017+ JavaScript

**To check WebGL support:**
Visit: https://get.webgl.org/

---

## 🎯 **QUICK TEST:**

Once server is running:

1. **Open:** http://localhost:3000
2. **You should see:**
   - Black screen
   - Green Matrix code starts falling (immediate)
   - After 3s: Morphing text
   - After 5s: Cosmos sphere appears
   - After 7s: Form appears

3. **Open browser console (F12):**
   - Should see no red errors
   - May see Three.js info (that's OK)

---

## 🆘 **STILL NOT WORKING?**

**Share these details:**

1. **Error message** (exact text from terminal)
2. **Node version:** `node -v`
3. **npm version:** `npm -v`
4. **Operating system:** Mac/Windows/Linux
5. **Browser:** Chrome/Firefox/Safari/Edge

**Most common issue:** Missing `.env.local` or wrong API key!

---

## 📞 **SUPPORT CHECKLIST:**

- [ ] Fresh `npm install` done
- [ ] `.env.local` created with API key
- [ ] Port 3000 not in use
- [ ] Browser supports WebGL
- [ ] No red errors in terminal
- [ ] No red errors in browser console

**If all checked and still broken:** Share terminal output! 🙏

---

## 💡 **PRO TIPS:**

**VS Code users:**
```bash
# Open project in VS Code
code .

# Terminal inside VS Code: Ctrl + `
npm run dev
```

**Speed up development:**
```bash
# Use turbo mode (experimental)
npm run dev --turbo
```

**Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

---

**Need help? Share:**
1. Terminal error message
2. Browser console screenshot (F12)
3. Output of `npm list`

**Let's fix it together!** 💪🔧
