# Step-by-Step Vercel Dashboard Setup

## 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Use GitHub, GitLab, Bitbucket, or email to create account

## 2. Create New Project
1. After logging in, click **"Add New..."** in dashboard
2. Select **"Project"** from dropdown
3. **Import Git Repository** section:
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Click **"Import Git Repository"**
   - Browse and select your PSQuote_V2 repository
   - Click **"Import"**

## 3. Configure Project Settings
### Build & Development Settings
1. **Framework Preset**: Select "Next.js" (auto-detected)
2. **Root Directory**: Keep as "./" (project root)
3. **Build Command**: Should auto-populate as "npm run build"
4. **Output Directory**: Should be ".next"
5. **Install Command**: Should be "npm install"

### Environment Variables (Critical Step)
1. Scroll down to **"Environment Variables"** section
2. Add these variables one by one:

#### Required Supabase Variables:
```
NEXT_PUBLIC_SUPABASE_URL
https://your-project-id.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
your-supabase-anon-key
```

#### Application Settings:
```
NEXT_PUBLIC_DEBUG
false
```

```
NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT
false
```

```
NEXT_PUBLIC_SESSION_REFRESH_INTERVAL
300000
```

```
NODE_ENV
production
```

```
LOG_LEVEL
info
```

```
NEXT_PUBLIC_FEATURE_AUTH
true
```

```
NEXT_PUBLIC_FEATURE_ANALYTICS
false
```

3. For each variable:
   - Enter the **Name** (e.g., NEXT_PUBLIC_SUPABASE_URL)
   - Enter the **Value** (your actual value)
   - Select **Environment**: Production, Preview, Development
   - Click **"Add"**

## 4. Deploy Project
1. Review all settings
2. Click **"Deploy"** button at bottom
3. Wait for build to complete (usually 2-5 minutes)
4. You'll get a deployment URL like `ps-quote-v2.vercel.app`

## 5. Configure Custom Domain
### Add Domain to Project
1. In your project dashboard, go to **"Settings"** tab
2. Click **"Domains"** in left sidebar
3. Click **"Add"** button
4. Enter your custom domain (e.g., `yourdomain.com`)
5. Click **"Add"**

### Configure DNS Records
Vercel will show you the DNS records to configure:

#### If using Root Domain (yourdomain.com):
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 300 (or default)
```

#### If using Subdomain (app.yourdomain.com):
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 300 (or default)
```

### Update DNS at Your Domain Registrar
1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS management
3. Add the records shown by Vercel
4. Save changes

### Wait for Propagation
1. DNS changes take 5-30 minutes to propagate
2. Vercel will automatically issue SSL certificate
3. You'll receive email when domain is ready

## 6. Test Deployment
1. Visit your Vercel URL to verify basic functionality
2. Test authentication flow
3. Verify Supabase connection
4. Test custom domain once DNS propagates

## 7. Configure Automatic Deployments (Optional)
1. In project settings, go to **"Git"** tab
2. Enable **"Automatic Deployments"**
3. Choose branches to auto-deploy (main, develop, etc.)
4. Now every git push will trigger deployment

## 8. Monitor and Troubleshoot
### View Logs
1. Go to **"Logs"** tab in project dashboard
2. Filter by function, build, or runtime
3. Check for any errors

### Check Build Status
1. Go to **"Deployments"** tab
2. View build logs and status
3. Redeploy if needed

### Common Issues
- **Build fails**: Check environment variables and Node.js version
- **Supabase errors**: Verify URL and API keys are correct
- **Domain not working**: Check DNS configuration and wait for propagation
- **SSL errors**: Wait longer for certificate issuance

## 9. Production Checklist
- [ ] All environment variables configured
- [ ] Custom domain DNS configured
- [ ] SSL certificate active
- [ ] Authentication working
- [ ] Database operations functional
- [ ] API routes responding
- [ ] Automatic deployments enabled (if desired)

## Important Notes
- Never commit actual environment variables to Git
- Keep Supabase keys secure
- Monitor your Vercel usage and billing
- Regularly update dependencies
- Test thoroughly after each deployment
