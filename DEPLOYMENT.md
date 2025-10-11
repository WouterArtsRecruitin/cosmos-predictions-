# 🚀 Deployment Checklist

## Pre-Deployment

- [ ] All environment variables added to Vercel
- [ ] Claude API key tested and working
- [ ] Jotform form created and tested
- [ ] Zapier zap created and tested
- [ ] Pipedrive pipeline configured
- [ ] Custom domain DNS configured (if applicable)
- [ ] README updated with project specifics

## Deployment Steps

### 1. GitHub Setup (5 min)
```bash
cd /path/to/cosmos-predictions
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/cosmos-predictions.git
git push -u origin main
```

### 2. Vercel Deployment (10 min)
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
5. Add Environment Variables:
   - `ANTHROPIC_API_KEY`: Your Claude API key
   - `NEXT_PUBLIC_JOTFORM_FORM_ID`: Your Jotform form ID
6. Click "Deploy"

### 3. Domain Setup (Optional, 15 min)
1. In Vercel: Settings → Domains
2. Add domain: `predictions.recruitin.nl`
3. Update DNS:
   ```
   Type: CNAME
   Name: predictions
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-30 min)

### 4. Jotform Integration (15 min)
1. Create form: https://www.jotform.com/build
2. Fields:
   - Email (required, email validation)
   - Naam (optional, text)
   - Telefoonnummer (optional, phone)
3. Design:
   - Background: #000000
   - Text: #FFFFFF
   - Accent: #4ADE80 (green)
4. Settings:
   - Thank You Page: Redirect to `https://predictions.recruitin.nl/thank-you`
   - Notifications: Admin email on submission
5. Get Form ID from URL: `https://form.jotform.com/FORM_ID`
6. Add to Vercel env vars: `NEXT_PUBLIC_JOTFORM_FORM_ID`

### 5. Zapier Setup (20 min)
1. Go to https://zapier.com/app/zaps
2. Click "Create Zap"
3. **Trigger:**
   - App: Jotform
   - Event: New Submission
   - Account: Connect your Jotform
   - Form: Select your newsletter form
   - Test: Should show recent submission
4. **Action:**
   - App: Pipedrive
   - Event: Create Deal
   - Account: Connect your Pipedrive
   - Fields:
     - Title: `Cosmos Newsletter - {{1. Naam}}`
     - Person Name: `{{1. Naam}}`
     - Person Email: `{{1. Email}}`
     - Value: 0
     - Currency: EUR
     - Stage: Newsletter Subscribers
     - Pipeline: Marketing Leads
     - Custom Fields:
       - Source: "Cosmos Predictions"
       - Signup Date: `{{1. Created At}}`
   - Test: Should create test deal in Pipedrive
5. Name zap: "Cosmos → Pipedrive"
6. Turn ON

### 6. Pipedrive Configuration (15 min)
1. **Create Pipeline:**
   - Settings → Pipelines → Add Pipeline
   - Name: "Marketing Leads"
   - Stages:
     1. Newsletter (probability: 10%)
     2. Engaged (probability: 30%)
     3. Qualified (probability: 60%)
     4. Customer (probability: 100%)
2. **Add Custom Fields:**
   - Settings → Data Fields → Deal fields → Add
   - Field 1:
     - Name: Source
     - Type: Text
   - Field 2:
     - Name: Signup Date
     - Type: Date
   - Field 3:
     - Name: Last Prediction
     - Type: Long text
   - Field 4:
     - Name: Engagement Score
     - Type: Numeric
3. **Set Defaults:**
   - Assign new deals to: Your name
   - Default value: €0
   - Default stage: Newsletter

## Post-Deployment Testing

- [ ] Visit production URL
- [ ] Test Globular Cluster loads
- [ ] Submit test prediction question
- [ ] Verify prediction generation (10-15s)
- [ ] Check all 3 scenarios render correctly
- [ ] Test newsletter form submission
- [ ] Verify Zapier trigger fires
- [ ] Check Pipedrive for new deal
- [ ] Test mobile responsiveness
- [ ] Test different browsers (Chrome, Safari, Firefox)
- [ ] Check Vercel Analytics tracking

## Monitoring Setup

### Vercel Dashboard
- [ ] Enable Analytics
- [ ] Set up Error Notifications
- [ ] Configure Budget Alerts

### Uptime Monitoring (Optional)
- [ ] UptimeRobot: https://uptimerobot.com
- [ ] Add URL: Your production domain
- [ ] Alert contacts: Your email
- [ ] Check interval: 5 minutes

## Performance Optimization

- [ ] Enable Vercel Edge Caching
- [ ] Compress images (if any added)
- [ ] Add service worker (PWA, optional)
- [ ] Implement route prefetching

## Security Checklist

- [ ] API keys stored in environment variables
- [ ] No secrets committed to Git
- [ ] HTTPS enabled (auto by Vercel)
- [ ] Content Security Policy configured
- [ ] Rate limiting on `/api/predict` (optional)

## Marketing Launch

- [ ] Announce on company website
- [ ] Share on LinkedIn
- [ ] Email existing customers
- [ ] Add to Recruitin.nl navigation
- [ ] Create demo video
- [ ] Write blog post

## Cost Monitoring

| Service | Monthly Cost | Usage Limit | Alert Threshold |
|---------|-------------|-------------|-----------------|
| Vercel | €20 | Unlimited | N/A |
| Claude API | €5-30 | 500-3k predictions | 80% |
| Jotform | €99 | Unlimited | N/A |
| Zapier | €50 | 2k tasks | 80% (1600 tasks) |
| Pipedrive | €49 | Unlimited | N/A |
| **Total** | **€223-248** | | |

## Backup & Recovery

- [ ] Backup `.env.local` securely (1Password/Bitwarden)
- [ ] Document all integrations (this file!)
- [ ] Export Pipedrive data monthly
- [ ] Screenshot Zapier zap configuration
- [ ] Keep local development copy updated

## Success Metrics (Week 1)

- [ ] Unique visitors: Target 100+
- [ ] Predictions generated: Target 50+
- [ ] Newsletter signups: Target 20+
- [ ] Conversion rate: Target 20%+
- [ ] Avg time on site: Target 2+ minutes
- [ ] Bounce rate: Target <60%

---

## Quick Reference

**Production URL:** https://predictions.recruitin.nl  
**Vercel Dashboard:** https://vercel.com/dashboard  
**Jotform Dashboard:** https://www.jotform.com/myforms  
**Zapier Dashboard:** https://zapier.com/app/zaps  
**Pipedrive:** https://recruitin.pipedrive.com  

**Emergency Contact:** support@recruitin.nl  
**Last Updated:** 2025-01-11  
**Deployed By:** Wouter Arts  
**Status:** ✅ Production Ready  

---

**Ready to ship! 🚀**
