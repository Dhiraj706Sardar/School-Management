# Local Development Setup

## Prerequisites
- Node.js 18+ installed
- MySQL installed and running locally

## Quick Setup

### 1. Install MySQL
```bash
# macOS
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt install mysql-server
sudo systemctl start mysql
```

### 2. Create Database
```bash
mysql -u root -p
CREATE DATABASE school_management;
exit;
```

### 3. Configure Environment
Update `.env.local`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=school_management
DB_PORT=3306
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Setup and Run
```bash
npm install
npm run setup-db
npm run dev
```

Visit `http://localhost:3000` to see your app!