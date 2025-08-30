# PlanetScale Setup for Vercel Deployment

PlanetScale is the easiest way to deploy your MySQL app to Vercel.

## Step 1: Create PlanetScale Account

1. Go to [planetscale.com](https://planetscale.com)
2. Sign up with GitHub
3. Create a new database: `school-management`

## Step 2: Get Connection String

1. In your PlanetScale dashboard
2. Click your database → "Connect"
3. Select "Connect with: Node.js"
4. Copy the connection details

Example connection details:
```
Host: aws.connect.psdb.cloud
Username: your-username
Password: your-password
Database: school-management
Port: 3306
```

## Step 3: Update Local Environment

Update your `.env.local`:
```env
# PlanetScale Connection
DB_HOST=aws.connect.psdb.cloud
DB_USER=your-planetscale-username
DB_PASSWORD=your-planetscale-password
DB_NAME=school-management
DB_PORT=3306
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Step 4: Test Locally

```bash
npm run dev
# Visit: http://localhost:3000/api/setup
```

This will create the schools table in PlanetScale.

## Step 5: Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory: `school-management`

3. **Add Environment Variables**:
   In Vercel project settings, add:
```env
DB_HOST=aws.connect.psdb.cloud
DB_USER=your-planetscale-username
DB_PASSWORD=your-planetscale-password
DB_NAME=school-management
DB_PORT=3306
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

4. **Deploy**: Click "Deploy" and wait for completion!

## Step 6: Test Production

Visit your Vercel URL and test:
- Add school form
- View schools page
- API endpoints

## Why PlanetScale?

✅ **MySQL Compatible**: No code changes needed
✅ **Serverless**: Scales automatically
✅ **Free Tier**: Perfect for demos
✅ **Vercel Integration**: Works seamlessly
✅ **Easy Setup**: 5-minute configuration

Your app will work exactly the same as locally, but now it's deployed to the cloud!