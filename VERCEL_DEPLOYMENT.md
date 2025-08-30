# Vercel Deployment Guide

This guide will help you deploy your School Management System to Vercel with a cloud database.

## Option 1: Deploy with PlanetScale (Recommended)

PlanetScale is a MySQL-compatible serverless database that works perfectly with Vercel.

### Step 1: Setup PlanetScale Database

1. **Create PlanetScale Account**
   - Go to [planetscale.com](https://planetscale.com)
   - Sign up with GitHub
   - Create a new database (e.g., "school-management")

2. **Get Connection Details**
   - Go to your database dashboard
   - Click "Connect"
   - Select "Connect with: Node.js"
   - Copy the connection details

3. **Create Database Schema**
   - In PlanetScale console, go to "Console" tab
   - Run the SQL from `database/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  contact VARCHAR(15) NOT NULL,
  email_id VARCHAR(255) NOT NULL,
  image VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_city ON schools(city);
CREATE INDEX idx_state ON schools(state);
CREATE INDEX idx_email ON schools(email_id);
```

### Step 2: Update Environment Variables

Update your `.env.local` for local development with PlanetScale:

```env
# Local Development with PlanetScale
DB_HOST=your-planetscale-host
DB_USER=your-planetscale-username
DB_PASSWORD=your-planetscale-password
DB_NAME=your-database-name
DB_PORT=3306
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 3: Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your repository
   - Set root directory to `school-management`

3. **Add Environment Variables in Vercel**
   In your Vercel project settings → Environment Variables, add:
```env
DB_HOST=your-planetscale-host
DB_USER=your-planetscale-username
DB_PASSWORD=your-planetscale-password
DB_NAME=your-database-name
DB_PORT=3306
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your live URL!

## Option 2: Deploy with Neon Database

Neon is a PostgreSQL-compatible serverless database. You'll need to modify the app to use PostgreSQL instead of MySQL.

### Step 1: Setup Neon Database
1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Get connection string

### Step 2: Update Dependencies
```bash
npm uninstall mysql2
npm install pg @types/pg
```

### Step 3: Update Database Configuration
You'll need to modify `lib/db.ts` to use PostgreSQL instead of MySQL.

## Option 3: Deploy with Supabase

Supabase provides a PostgreSQL database with additional features.

### Step 1: Setup Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get database URL from settings

### Step 2: Similar to Neon setup above

## Option 4: Local MySQL + Vercel (Development Only)

For development/demo purposes, you can deploy to Vercel without a database (forms won't save data).

### Step 1: Create Mock Database
Create `lib/mock-db.ts`:
```typescript
// Mock database for Vercel deployment without real database
let schools: any[] = [
  {
    id: 1,
    name: "Demo High School",
    address: "123 Education Street",
    city: "New York",
    state: "NY",
    contact: "1234567890",
    email_id: "info@demohigh.edu",
    image: null,
    created_at: new Date(),
    updated_at: new Date()
  }
];

export const mockDb = {
  async execute(query: string, params?: any[]) {
    if (query.includes('SELECT')) {
      return [schools];
    }
    if (query.includes('INSERT')) {
      const newSchool = {
        id: schools.length + 1,
        name: params?.[0] || '',
        address: params?.[1] || '',
        city: params?.[2] || '',
        state: params?.[3] || '',
        contact: params?.[4] || '',
        email_id: params?.[5] || '',
        image: params?.[6] || null,
        created_at: new Date(),
        updated_at: new Date()
      };
      schools.push(newSchool);
      return [{ insertId: newSchool.id }];
    }
    return [[]];
  }
};
```

## Recommended: PlanetScale Setup

I recommend PlanetScale because:
- ✅ MySQL compatible (no code changes needed)
- ✅ Serverless (scales automatically)
- ✅ Free tier available
- ✅ Works perfectly with Vercel
- ✅ Easy to set up

## Testing Your Deployment

After deployment, test these URLs:
- **Home**: `https://your-app.vercel.app`
- **Add School**: `https://your-app.vercel.app/addSchool`
- **View Schools**: `https://your-app.vercel.app/showSchools`
- **API Health**: `https://your-app.vercel.app/api/setup`

## Troubleshooting

### Build Errors
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify environment variables are set

### Database Connection Issues
- Test connection locally first
- Check database service is running
- Verify connection credentials
- Ensure database allows external connections

### Image Upload Issues
- Vercel has read-only filesystem
- Consider using Vercel Blob Storage or Cloudinary for production
- Current setup works for demo but files won't persist

## Production Considerations

### File Storage
Replace local file storage with:
- Vercel Blob Storage
- AWS S3
- Cloudinary
- UploadThing

### Database Optimization
- Add connection pooling
- Implement caching
- Add database indexes
- Monitor performance

### Security
- Add rate limiting
- Implement CORS
- Use environment variables for secrets
- Add input validation

Would you like me to help you set up with PlanetScale or another database option?