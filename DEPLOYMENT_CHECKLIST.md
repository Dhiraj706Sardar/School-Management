# Deployment Checklist

## ✅ Pre-Deployment

- [ ] Local development working
- [ ] MySQL database setup locally
- [ ] All features tested locally
- [ ] Code committed to GitHub

## 🗄️ Database Setup (Choose One)

### Option A: PlanetScale (Recommended)
- [ ] PlanetScale account created
- [ ] Database created
- [ ] Schema imported
- [ ] Connection string obtained

### Option B: Neon Database
- [ ] Neon account created
- [ ] PostgreSQL database created
- [ ] Code updated for PostgreSQL

### Option C: Supabase
- [ ] Supabase project created
- [ ] Database URL obtained
- [ ] Code updated for PostgreSQL

## 🚀 Vercel Deployment

- [ ] Vercel account connected to GitHub
- [ ] Project imported to Vercel
- [ ] Root directory set to `school-management`
- [ ] Environment variables added:
  - [ ] `DB_HOST`
  - [ ] `DB_USER`
  - [ ] `DB_PASSWORD`
  - [ ] `DB_NAME`
  - [ ] `DB_PORT`
  - [ ] `NEXT_PUBLIC_BASE_URL`
- [ ] First deployment successful

## 🧪 Post-Deployment Testing

- [ ] Home page loads: `https://your-app.vercel.app`
- [ ] Add school form: `https://your-app.vercel.app/addSchool`
- [ ] View schools: `https://your-app.vercel.app/showSchools`
- [ ] API health check: `https://your-app.vercel.app/api/setup`
- [ ] Database connection working
- [ ] Form submissions work
- [ ] Image uploads work (basic test)

## 🔧 Optional Optimizations

- [ ] Custom domain configured
- [ ] Error monitoring setup (Sentry)
- [ ] Performance monitoring
- [ ] Cloud storage for images (Cloudinary/Vercel Blob)
- [ ] CDN configuration

## 📱 Final Checks

- [ ] Mobile responsive design
- [ ] All links working
- [ ] Forms validate properly
- [ ] Error handling works
- [ ] Loading states work

## 🚨 Common Issues

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Review Vercel build logs

### Database Connection
- Test connection string locally first
- Verify environment variables in Vercel
- Check database service status

### Image Upload Issues
- Vercel has read-only filesystem
- Files won't persist between deployments
- Consider cloud storage for production

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)