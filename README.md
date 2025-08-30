# School Management System

A comprehensive school management system built with Next.js, TypeScript, MySQL, and Tailwind CSS. Features include school registration with image uploads, form validation, and a responsive display interface.

## Features

- **Add School Form**: Responsive form with react-hook-form validation
- **School Display**: Card-based responsive layout showing all schools
- **Image Upload**: File upload with storage in `/public/schoolImages`
- **Form Validation**: Email, phone number, and required field validation
- **MySQL Integration**: Full database integration with connection pooling
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL with mysql2
- **Form Handling**: react-hook-form
- **File Upload**: Multer
- **Image Processing**: Sharp

## Project Structure

```
school-management/
├── app/
│   ├── addSchool/
│   │   └── page.tsx          # Add school form
│   ├── showSchools/
│   │   └── page.tsx          # Display schools
│   ├── api/
│   │   └── schools/
│   │       └── route.ts      # API endpoints
│   ├── layout.tsx
│   └── page.tsx              # Home page
├── lib/
│   ├── db.ts                 # MySQL connection
│   └── multer.ts             # File upload config
├── database/
│   └── schema.sql            # Database schema
├── public/
│   └── schoolImages/         # Uploaded images
└── .env.local                # Environment variables
```

## Database Schema

The `schools` table includes:
- `id` (Primary Key)
- `name` (School name)
- `address` (Full address)
- `city` (City)
- `state` (State)
- `contact` (10-digit phone number)
- `email_id` (Email address)
- `image` (Image file path)
- `created_at` & `updated_at` (Timestamps)

## Setup Instructions

### 1. Install Dependencies

```bash
cd school-management
npm install
```

### 2. Database Setup

#### Local MySQL Setup:
1. Install MySQL on your system
2. Create database and table:
```sql
mysql -u root -p < database/schema.sql
```

#### Or use the SQL commands directly:
```sql
CREATE DATABASE school_management;
USE school_management;

CREATE TABLE schools (
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
```

### 3. Environment Configuration

Update `.env.local` with your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_management
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## API Endpoints

### GET /api/schools
Fetch all schools from the database.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ABC School",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "contact": "1234567890",
      "email_id": "contact@abcschool.com",
      "image": "/schoolImages/school-123456789.jpg"
    }
  ]
}
```

### POST /api/schools
Add a new school with image upload.

**Request:** FormData with fields:
- `name` (required)
- `address` (required)
- `city` (required)
- `state` (required)
- `contact` (required, 10 digits)
- `email_id` (required, valid email)
- `image` (optional, image file)

## Form Validation

The add school form includes comprehensive validation:

- **Name**: Required, minimum 2 characters
- **Address**: Required, minimum 10 characters
- **City**: Required, minimum 2 characters
- **State**: Required, minimum 2 characters
- **Contact**: Required, exactly 10 digits
- **Email**: Required, valid email format
- **Image**: Optional, image files only, max 5MB

## Deployment Guide

### Deploy to Vercel with PlanetScale

#### 1. Setup PlanetScale Database

1. Create account at [PlanetScale](https://planetscale.com/)
2. Create a new database
3. Get connection details from dashboard
4. Create the schema using PlanetScale console or CLI

#### 2. Update Environment Variables

In your Vercel deployment, add these environment variables:

```env
DB_HOST=your-planetscale-host
DB_USER=your-planetscale-username
DB_PASSWORD=your-planetscale-password
DB_NAME=your-database-name
NEXT_PUBLIC_BASE_URL=https://your-vercel-app.vercel.app
```

#### 3. Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

#### Alternative: Railway Database

1. Create account at [Railway](https://railway.app/)
2. Create MySQL database
3. Use provided connection details
4. Update environment variables

### Local Production Build

```bash
npm run build
npm start
```

## Usage

### Adding a School

1. Navigate to "Add New School" from home page
2. Fill in all required fields
3. Optionally upload a school image
4. Submit form
5. Redirected to schools display page

### Viewing Schools

1. Navigate to "View All Schools"
2. Browse schools in card layout
3. Each card shows:
   - School image (or placeholder)
   - School name
   - Full address
   - City and state
   - Contact number
   - Email address

## File Upload Details

- Images stored in `/public/schoolImages/`
- Filename format: `school-{timestamp}-{originalname}`
- Supported formats: JPG, PNG, GIF
- Maximum file size: 5MB
- Database stores relative path: `/schoolImages/filename.jpg`

## Responsive Design

The application is fully responsive with breakpoints:
- Mobile: Single column layout
- Tablet: 2-column grid
- Desktop: 3-4 column grid
- Large screens: 4+ column grid

## Error Handling

- Form validation errors displayed inline
- API errors shown with user-friendly messages
- Database connection errors handled gracefully
- File upload errors with specific feedback

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - feel free to use this project for educational purposes.