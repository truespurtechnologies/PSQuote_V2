/**
 * Rate limiting utility for API routes
 * Uses in-memory storage for development, can be extended to use Redis or other storage
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

// In-memory storage for rate limits (for development)
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Clean up expired rate limit records
 */
const cleanupExpiredRecords = () => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom identifier generator (defaults to IP address) */
  identifierGenerator?: (request: Request) => Promise<string>;
  /** Skip rate limiting for certain conditions */
  skip?: (request: Request) => boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // API routes - 10 requests per minute
  API: { limit: 10, windowMs: 60 * 1000 },
  
  // Auth routes - 5 requests per minute (more restrictive)
  AUTH: { limit: 5, windowMs: 60 * 1000 },
  
  // User management - 3 requests per minute (very restrictive)
  USERS: { limit: 3, windowMs: 60 * 1000 },
  
  // General routes - 100 requests per minute
  GENERAL: { limit: 100, windowMs: 60 * 1000 },
} as const;

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Skip if configured
  if (config.skip?.(request)) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      resetTime: Date.now() + config.windowMs,
    };
  }

  // Generate identifier
  const identifier = config.identifierGenerator ? 
    await config.identifierGenerator(request) : 
    getDefaultIdentifier(request);

  // Clean up expired records
  cleanupExpiredRecords();

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // If no record exists, create one
  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newRecord);

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: newRecord.resetTime,
    };
  }

  // Increment count
  record.count++;

  // Check if limit exceeded
  const success = record.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining: Math.max(0, config.limit - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Get default identifier from request
 */
function getDefaultIdentifier(request: Request): string {
  // Try to get IP address from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  let ip = realIp || cfConnectingIp || forwardedFor?.split(',')[0]?.trim() || 'unknown';
  
  // If no IP, use user agent as fallback
  if (ip === 'unknown') {
    const userAgent = request.headers.get('user-agent') || 'no-agent';
    ip = `no-ip-${userAgent.slice(0, 20)}`;
  }
  
  return ip;
}

/**
 * Create rate limit middleware for Next.js API routes
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware(request: Request) {
    const result = await rateLimit(request, config);

    if (!result.success) {
      return {
        success: false,
        response: Response.json(
          {
            error: config.errorMessage || 'Too many requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            }
          }
        ),
      };
    }

    return {
      success: true,
      response: {
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        }
      }
    };
  };
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  api: createRateLimitMiddleware({
    ...RATE_LIMITS.API,
    errorMessage: 'API rate limit exceeded',
  }),
  
  auth: createRateLimitMiddleware({
    ...RATE_LIMITS.AUTH,
    errorMessage: 'Auth rate limit exceeded. Please try again later.',
    skip: (request) => {
      // Skip rate limiting for health checks
      return request.url.includes('/health') || request.url.includes('/api/health');
    },
  }),
  
  users: createRateLimitMiddleware({
    ...RATE_LIMITS.USERS,
    errorMessage: 'User management rate limit exceeded',
  }),
  
  general: createRateLimitMiddleware(RATE_LIMITS.GENERAL),
};
