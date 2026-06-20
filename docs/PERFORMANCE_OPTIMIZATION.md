# Performance Optimization Guide

## Database Optimization

### 1. Index Implementation
Run the indexes from `OPTIMIZATION_INDEXES.sql` to improve query performance:

```bash
# Connect to your Supabase database and run:
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f docs/OPTIMIZATION_INDEXES.sql
```

### 2. Query Optimization

#### Before (Multiple Queries)
```typescript
// Inefficient: Multiple separate queries
const user = await supabase.from('profiles').select('*').eq('id', userId);
const quotations = await supabase.from('quotations').select('*').eq('created_by', userId);
const items = await supabase.from('quotation_items').select('*').in('quotation_id', quotationIds);
```

#### After (Batch Operations)
```typescript
// Efficient: Single query with joins
const result = await supabase
  .from('quotations')
  .select(`
    *,
    quotation_items(*),
    profiles:created_by(username, full_name)
  `)
  .eq('created_by', userId)
  .order('created_at', { ascending: false });
```

### 3. Caching Strategy

#### Client-Side Caching
```typescript
// Implement React Query for data caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const useQuotations = (userId: string) => {
  return useQuery({
    queryKey: ['quotations', userId],
    queryFn: () => fetchQuotations(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

#### Server-Side Caching
```typescript
// Implement API response caching
export async function GET(request: Request) {
  const cache = caches.default;
  const cacheKey = new Request(request.url);
  
  let response = await cache.match(cacheKey);
  
  if (!response) {
    // Fetch data
    const data = await fetchData();
    
    response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    });
    
    await cache.put(cacheKey, response.clone());
  }
  
  return response;
}
```

## React Performance

### 1. Component Memoization
```typescript
import React, { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
const QuotationItem = memo(({ item }: { item: QuotationItem }) => {
  const formattedTotal = useMemo(() => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(item.totalValue), [item.totalValue]
  );

  return (
    <div>
      <span>{item.description}</span>
      <span>{formattedTotal}</span>
    </div>
  );
});
```

### 2. Virtual Scrolling
```typescript
// For large lists, implement virtual scrolling
import { FixedSizeList as List } from 'react-window';

const QuotationList = ({ quotations }: { quotations: Quotation[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <QuotationItem item={quotations[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={quotations.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. Bundle Optimization
```typescript
// Dynamic imports for code splitting
const QuotationPreview = dynamic(() => import('./QuotationPreview'), {
  loading: () => <div>Loading preview...</div>,
  ssr: false
});

// Use in component
const QuotationPage = () => {
  const [showPreview, setShowPreview] = useState(false);
  
  return (
    <div>
      {/* Other content */}
      {showPreview && <QuotationPreview />}
    </div>
  );
};
```

## API Performance

### 1. Response Compression
```typescript
// next.config.js
const nextConfig = {
  compress: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react']
  }
};
```

### 2. Request Debouncing
```typescript
// Implement debouncing for search
import { useDebouncedCallback } from 'use-debounce';

const SearchComponent = () => {
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      // Perform search
      searchQuotations(query);
    },
    300
  );

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search quotations..."
    />
  );
};
```

### 3. Pagination
```typescript
// Implement efficient pagination
const fetchQuotations = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  
  const { data } = await supabase
    .from('quotations')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  return {
    quotations: data,
    hasMore: data.length === limit,
    total: data.length
  };
};
```

## Monitoring & Analytics

### 1. Performance Monitoring
```typescript
// Add performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // Send to your analytics service
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_category: 'Web Vitals'
  });
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 2. Error Tracking
```typescript
// Implement error boundary with tracking
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send error to tracking service
    trackError(error, errorInfo);
  }
}
```

## Security Performance

### 1. Rate Limiting
```typescript
// Implement efficient rate limiting
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 2. Input Validation
```typescript
// Validate and sanitize inputs early
const validateInput = (input: unknown) => {
  const schema = z.object({
    query: z.string().max(100).transform(sanitizeString),
    page: z.number().min(1).max(1000),
  });
  
  return schema.parse(input);
};
```

## Deployment Optimization

### 1. Build Optimization
```json
{
  "scripts": {
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "start": "next start",
    "lint": "next lint --fix",
    "typecheck": "tsc --noEmit"
  }
}
```

### 2. Environment Variables
```bash
# Production optimizations
NEXT_PUBLIC_MINIFY=true
NEXT_PUBLIC_OPTIMIZE_FONTS=true
NEXT_PUBLIC_ENABLE_IMAGE_OPTIMIZATION=true
```

## Testing Performance

### 1. Load Testing
```typescript
// Implement load testing
import { load } from 'cheerio';
import { performance } from 'perf_hooks';

const testPageLoad = async (url: string) => {
  const start = performance.now();
  const response = await fetch(url);
  const html = await response.text();
  const end = performance.now();
  
  return {
    loadTime: end - start,
    pageSize: html.length,
    elements: load(html).('*').length
  };
};
```

### 2. Database Performance
```sql
-- Monitor slow queries
SELECT 
  query,
  mean_time,
  calls,
  total_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC 
LIMIT 10;
```

## Regular Maintenance

### 1. Database Maintenance
```sql
-- Regular maintenance tasks
VACUUM ANALYZE;
REINDEX DATABASE your_database;
```

### 2. Cache Cleanup
```typescript
// Implement cache cleanup
const cleanupCache = () => {
  // Clear expired cache entries
  const expiredKeys = cache.keys().filter(key => 
    cache.get(key).expiresAt < Date.now()
  );
  
  expiredKeys.forEach(key => cache.delete(key));
};

// Run cleanup periodically
setInterval(cleanupCache, 60 * 60 * 1000); // Every hour
```

This guide provides comprehensive optimization strategies for the PSQuote application. Implement these changes gradually and monitor performance improvements.
