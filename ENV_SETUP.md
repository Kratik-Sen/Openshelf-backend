# Environment Variables Setup Guide

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. Never commit `.env` to git!

## Required Environment Variables

### 1. **MONGO_URL** (Required)
- MongoDB connection string
- **Local MongoDB**: `mongodb://localhost:27017/openshelf`
- **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/database`

### 2. **JWT_SECRET** (Required)
- Secret key for JWT token signing
- Generate a strong secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 3. **Redis Configuration** (Required for caching)
Choose **ONE** method:

**Method 1: REDIS_URL** (Recommended for Redis Cloud)
```env
REDIS_URL=redis://default:password@host:port
```

**Method 2: Individual Parameters**
```env
REDIS_HOST=your_host
REDIS_PORT=your_port
REDIS_PASSWORD=your_password
```

### 4. **AWS S3 Configuration** (Required for file uploads)
- **AWS_REGION**: e.g., `us-east-1`
- **AWS_S3_BUCKET**: Your S3 bucket name
- **AWS_ACCESS_KEY_ID**: From AWS IAM
- **AWS_SECRET_ACCESS_KEY**: From AWS IAM

### 5. **Razorpay** (Optional - for payments)
- **RAZORPAY_KEY_ID**: From Razorpay Dashboard
- **RAZORPAY_KEY_SECRET**: From Razorpay Dashboard

### 6. **PORT** (Optional)
- Server port (default: 5000)

## Where to Get Credentials

### Redis Cloud
1. Sign up: https://redis.com/try-free/
2. Create database
3. Copy connection URL from dashboard

### MongoDB Atlas
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string from "Connect" button

### AWS S3
1. Create S3 bucket in AWS Console
2. Create IAM user with S3 permissions
3. Generate access keys

### Razorpay
1. Sign up: https://razorpay.com/
2. Get API keys from Dashboard → Settings → API Keys

## Example .env File

```env
PORT=5000
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/openshelf
JWT_SECRET=your-generated-secret-key-here
REDIS_URL=redis://default:password@redis-12345.cloud.redislabs.com:12345
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-openshelf-bucket
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=test_secret_key
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` to git
- Use strong, random secrets in production
- Rotate credentials regularly
- Use different credentials for development and production
- Keep `.env` file secure and backed up

