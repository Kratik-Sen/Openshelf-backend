# Redis Caching Setup Guide

This application uses Redis (official npm package) to cache frequently accessed data for improved performance.

## What is Cached?

1. **Books List** (`/get-files`) - Cached for 5 minutes
   - All book metadata (title, category, cover image URLs, etc.)
   - Significantly speeds up the home page loading

2. **PDF Files** (`/files/:id/pdf`) - Cached for 1 hour
   - Complete PDF file buffers
   - Reduces S3 API calls and speeds up PDF viewing

## Redis Cloud Setup (Recommended)

### Step 1: Create Redis Cloud Account
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up for a free account
3. Create a new database

### Step 2: Get Connection Details
After creating your database, you'll get:
- **Endpoint/Host**: e.g., `redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com`
- **Port**: Usually `12345` or `6379`
- **Password**: Your database password

### Step 3: Configure Environment Variables

Add to your `.env` file:

**Option 1: Using Redis URL (Recommended for Redis Cloud)**
```env
# Redis Cloud Connection URL
REDIS_URL=redis://default:your_password@your_host:your_port
# Example:
# REDIS_URL=redis://default:abc123xyz@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345
```

**Option 2: Using Individual Parameters**
```env
# Redis Cloud Connection (Alternative method)
REDIS_HOST=redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your_password_here
```

## Local Redis Setup (Development)

### Option 1: Local Installation

**Windows:**
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Or use WSL: `sudo apt-get install redis-server`
3. Start Redis: `redis-server`

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

### Option 2: Docker
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Local Configuration
For local Redis, add to `.env`:
```env
# Local Redis (defaults - optional)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=  # Leave empty if no password
```

## How It Works

1. **First Request**: Data is fetched from MongoDB/S3 and stored in Redis
2. **Subsequent Requests**: Data is served directly from Redis (much faster)
3. **Cache Invalidation**: When books are uploaded, updated, or deleted, relevant cache entries are automatically cleared

## Cache TTL (Time To Live)

- Books List: 5 minutes
- PDF Files: 1 hour
- Book Details: 10 minutes (if implemented)

## Monitoring

The application will log cache operations:
- `📦 Serving from Redis cache` - Cache hit
- `💾 Fetching from MongoDB/S3` - Cache miss
- `🗑️ Invalidated cache` - Cache cleared

## Troubleshooting

### Redis Connection Errors
If Redis is not available, the application will continue to work without caching. You'll see:
```
❌ Redis Connection Error: [error message]
```

The app gracefully degrades to direct database/S3 access.

### Redis Cloud Connection Issues

1. **Check your connection URL format:**
   ```
   redis://default:password@host:port
   ```
   Make sure there are no spaces and the password is URL-encoded if it contains special characters.

2. **Verify credentials:**
   - Double-check your Redis Cloud password
   - Ensure the endpoint and port are correct
   - Check if your IP is whitelisted (if required by your Redis Cloud plan)

3. **Test connection:**
   ```bash
   # Using redis-cli (if installed locally)
   redis-cli -h your_host -p your_port -a your_password ping
   # Should return: PONG
   ```

### Clear All Cache

**Using Redis Cloud Console:**
- Log into Redis Cloud dashboard
- Navigate to your database
- Use the CLI or flush commands

**Using redis-cli:**
```bash
redis-cli -h your_host -p your_port -a your_password FLUSHALL
```

**Local Redis:**
```bash
redis-cli FLUSHALL
```

### Check Redis Status
```bash
# Redis Cloud
redis-cli -h your_host -p your_port -a your_password ping

# Local Redis
redis-cli ping
# Should return: PONG
```

### Common Issues

1. **"Connection refused"**
   - Check if Redis Cloud database is active
   - Verify endpoint and port
   - Check firewall/network settings

2. **"Authentication failed"**
   - Verify password is correct
   - Check if password needs URL encoding in REDIS_URL

3. **"Too many reconnection attempts"**
   - Check network connectivity
   - Verify Redis Cloud database is running
   - Check if you've exceeded connection limits

## Performance Benefits

- **Books List**: ~90% faster on subsequent requests
- **PDF Files**: ~80% faster, especially for frequently accessed books
- **Reduced S3 Costs**: Fewer API calls to AWS S3
- **Better User Experience**: Faster page loads and PDF viewing

