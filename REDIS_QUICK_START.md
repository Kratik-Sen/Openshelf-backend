# Redis Cloud Quick Start Guide

## Step 1: Get Your Redis Cloud Connection String

1. Log into [Redis Cloud](https://redis.com/try-free/)
2. Create or select your database
3. Copy the connection URL (looks like: `redis://default:password@host:port`)

## Step 2: Add to .env File

Create or update `backend/.env`:

```env
# Redis Cloud Connection (choose one method)

# Method 1: Using URL (Recommended)
REDIS_URL=redis://default:your_password@your_host:your_port

# Method 2: Using Individual Parameters
# REDIS_HOST=your_host
# REDIS_PORT=your_port
# REDIS_PASSWORD=your_password
```

**Example:**
```env
REDIS_URL=redis://default:abc123xyz@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
```

## Step 3: Start Your Backend

```bash
cd backend
npm start
```

You should see:
```
✅ Redis: Connected and ready
```

## That's It! 🎉

Your app now uses Redis caching:
- ✅ Books list cached for 5 minutes
- ✅ PDF files cached for 1 hour
- ✅ Automatic cache invalidation on updates

## Troubleshooting

**If you see connection errors:**
- Double-check your REDIS_URL format
- Verify password is correct
- Check if your IP needs whitelisting in Redis Cloud

**The app will work without Redis** - it just won't have caching benefits.

