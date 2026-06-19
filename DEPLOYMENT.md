# Vercel Deployment Guide

## Prerequisites
- Vercel account
- Supabase project configured
- Custom domain purchased (optional)

## Environment Variables Required

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Application Settings
- `NEXT_PUBLIC_DEBUG` - Set to `false` for production
- `NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT` - Set to `false`
- `NEXT_PUBLIC_SESSION_REFRESH_INTERVAL` - `300000`
- `NODE_ENV` - `production`
- `LOG_LEVEL` - `info`
- `NEXT_PUBLIC_FEATURE_AUTH` - `true`
- `NEXT_PUBLIC_FEATURE_ANALYTICS` - `false`

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from Project Root
```bash
cd d:\Mine\BusinessOfficial\PopularSteels\PSQuoteApp_Revised\PSQuote_V2
vercel
```

### 4. Configure Environment Variables in Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all required environment variables from above
4. Redeploy after adding variables

### 5. Custom Domain Configuration
1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate provisioning

## Alternative: GitHub Integration
1. Push your code to GitHub repository
2. Import project in Vercel dashboard
3. Configure environment variables
4. Automatic deployment on git push

## Build Configuration
The `vercel.json` file includes:
- Next.js framework detection
- Build command: `npm run build`
- Function timeout: 30 seconds for API routes
- Optimized region: US East (iad1)

## Post-Deployment Checklist
- [ ] Environment variables configured
- [ ] Supabase connection working
- [ ] Authentication flow tested
- [ ] Custom domain SSL active
- [ ] All API routes functional
- [ ] Database operations working

## Troubleshooting
- **Build fails**: Check Node.js version (requires >=18.18.0)
- **Supabase errors**: Verify environment variables
- **Domain issues**: Check DNS configuration
- **API timeouts**: Verify function duration limits
