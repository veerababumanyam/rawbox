# Performance & Scalability Guidelines

## Target Scale

The application must support 20,000+ photographer customers, each with multiple galleries, clients, and thousands of photos.

## Core Web Vitals Targets

- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5 seconds
- **Total Blocking Time (TBT)**: < 300 milliseconds

## Code Splitting & Lazy Loading

### Route-Based Code Splitting

Split code by major views to reduce initial bundle size:

```typescript
// Lazy load heavy components
const AlbumDetailView = lazy(() => import('./components/AlbumDetailView'));
const AlbumDesigner = lazy(() => import('./components/album-design/AlbumDesigner'));
const ClientsView = lazy(() => import('./components/ClientsView'));
const PeopleView = lazy(() => import('./components/PeopleView'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AlbumDetailView />
</Suspense>
```

### Component-Level Lazy Loading

- Lazy load modals (only load when opened)
- Lazy load heavy UI components (image cropper, design canvas)
- Defer loading of below-the-fold content

### Image Optimization

```typescript
// Always use lazy loading for images
<img 
  src={photo.url} 
  loading="lazy" 
  width={photo.width} 
  height={photo.height}
  alt={photo.title}
/>

// Use thumbnail URLs for grids
<img src={photo.thumbnailUrl} loading="lazy" />

// Implement progressive image loading
// 1. Show low-quality placeholder
// 2. Load thumbnail
// 3. Load full resolution on demand
```

## Data Management at Scale

### Pagination & Virtual Scrolling

Never render all items at once:

```typescript
// For photo grids with 1000+ photos
import { useVirtualizer } from '@tanstack/react-virtual';

// Paginate API requests
const ITEMS_PER_PAGE = 50;
const loadPhotos = (page: number) => {
  return fetch(`/api/photos?page=${page}&limit=${ITEMS_PER_PAGE}`);
};

// Virtual scrolling for long lists
const virtualizer = useVirtualizer({
  count: photos.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200,
  overscan: 5
});
```

### Efficient State Management

```typescript
// Don't store all data in memory
// ❌ Bad: Load all 10,000 photos into state
const [allPhotos, setAllPhotos] = useState<Photo[]>([]);

// ✅ Good: Load paginated data
const [currentPage, setCurrentPage] = useState(1);
const [photos, setPhotos] = useState<Photo[]>([]); // Only current page

// Use indexes and references instead of duplicating data
// ❌ Bad: Store full album objects in multiple places
const [selectedAlbum, setSelectedAlbum] = useState<Album>(album);

// ✅ Good: Store album ID and look up from main list
const [selectedAlbumId, setSelectedAlbumId] = useState<string>(albumId);
const selectedAlbum = albums.find(a => a.id === selectedAlbumId);
```

### Debouncing & Throttling

```typescript
// Debounce search inputs
import { useMemo } from 'react';

const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);

// Throttle scroll handlers
const handleScroll = throttle(() => {
  // Handle scroll
}, 100);
```

## Memory Management

### Cleanup & Resource Management

```typescript
// Always cleanup in useEffect
useEffect(() => {
  const subscription = dataSource.subscribe();
  
  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);

// Revoke object URLs to prevent memory leaks
useEffect(() => {
  const objectUrl = URL.createObjectURL(file);
  
  return () => {
    URL.revokeObjectURL(objectUrl);
  };
}, [file]);
```

### Avoid Memory Leaks

```typescript
// ❌ Bad: Creating new functions on every render
<button onClick={() => handleClick(id)}>Click</button>

// ✅ Good: Memoize callbacks
const handleClick = useCallback((id: string) => {
  // Handle click
}, []);

// ❌ Bad: Large objects in state that never change
const [config] = useState(HUGE_CONFIG_OBJECT);

// ✅ Good: Use refs for non-reactive data
const configRef = useRef(HUGE_CONFIG_OBJECT);
```

## Network Optimization

### Request Batching

```typescript
// Batch multiple API calls
const batchRequests = async (photoIds: string[]) => {
  // Instead of 100 individual requests
  // Make 1 request with all IDs
  return fetch('/api/photos/batch', {
    method: 'POST',
    body: JSON.stringify({ ids: photoIds })
  });
};
```

### Caching Strategy

```typescript
// Cache API responses
const cache = new Map<string, any>();

const fetchWithCache = async (url: string) => {
  if (cache.has(url)) {
    return cache.get(url);
  }
  
  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, data);
  return data;
};

// Use stale-while-revalidate pattern
// Show cached data immediately, fetch fresh data in background
```

### Optimistic Updates

```typescript
// Update UI immediately, sync with server in background
const handleFavorite = async (photoId: string) => {
  // Optimistic update
  setPhotos(photos.map(p => 
    p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
  ));
  
  try {
    // Sync with server
    await api.toggleFavorite(photoId);
  } catch (error) {
    // Revert on error
    setPhotos(photos.map(p => 
      p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  }
};
```

## Bundle Size Optimization

### Target Bundle Sizes

- **Initial bundle**: < 200 KB (gzipped)
- **Total JavaScript**: < 500 KB (gzipped)
- **Per-route chunks**: < 100 KB (gzipped)

### Dependency Management

```typescript
// ❌ Avoid: Importing entire libraries
import _ from 'lodash';

// ✅ Good: Import only what you need
import debounce from 'lodash/debounce';

// ❌ Avoid: Heavy date libraries
import moment from 'moment';

// ✅ Good: Use native Date or lightweight alternatives
const date = new Date().toLocaleDateString();
```

### Tree Shaking

```typescript
// Ensure imports are tree-shakeable
// ✅ Good: Named exports
export const Button = () => {};
export const Input = () => {};

// ❌ Bad: Default exports with object
export default { Button, Input };
```

## Rendering Performance

### Memoization

```typescript
// Memoize expensive computations
const filteredPhotos = useMemo(() => {
  return photos.filter(p => p.tags.includes(selectedTag));
}, [photos, selectedTag]);

// Memoize components that don't need to re-render
const PhotoCard = memo(({ photo }: { photo: Photo }) => {
  return <div>{photo.title}</div>;
});
```

### Avoid Unnecessary Re-renders

```typescript
// ❌ Bad: Inline object creation
<Component style={{ margin: 10 }} />

// ✅ Good: Define outside render
const style = { margin: 10 };
<Component style={style} />

// ❌ Bad: Inline array creation
<Component items={[1, 2, 3]} />

// ✅ Good: Define outside or memoize
const items = [1, 2, 3];
<Component items={items} />
```

### Virtualization for Long Lists

```typescript
// For lists with 100+ items, use virtualization
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={photos.length}
  itemSize={200}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <PhotoCard photo={photos[index]} />
    </div>
  )}
</FixedSizeList>
```

## AI Service Optimization

### Rate Limiting & Queuing

```typescript
// Don't overwhelm Gemini API with concurrent requests
class AIQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private maxConcurrent = 3;
  private currentConcurrent = 0;
  
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }
  
  private async process() {
    if (this.currentConcurrent >= this.maxConcurrent) return;
    
    const task = this.queue.shift();
    if (!task) return;
    
    this.currentConcurrent++;
    await task();
    this.currentConcurrent--;
    this.process();
  }
}

const aiQueue = new AIQueue();

// Use queue for AI requests
const analyzePhoto = (url: string) => {
  return aiQueue.add(() => geminiService.analyzePhoto(url));
};
```

### Batch AI Processing

```typescript
// Process photos in batches instead of one-by-one
const batchAnalyzePhotos = async (photos: Photo[]) => {
  const BATCH_SIZE = 10;
  const results = [];
  
  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(p => analyzePhoto(p.url))
    );
    results.push(...batchResults);
    
    // Progress update
    onProgress(i + batch.length, photos.length);
  }
  
  return results;
};
```

## Monitoring & Metrics

### Performance Monitoring

```typescript
// Track performance metrics
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  
  // Log slow operations
  if (duration > 100) {
    console.warn(`Slow operation: ${name} took ${duration}ms`);
  }
};

// Monitor component render time
useEffect(() => {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    console.log(`Component mounted for ${duration}ms`);
  };
}, []);
```

### Error Boundaries

```typescript
// Prevent entire app crashes
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service
    console.error('Component error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Database & Backend Considerations

While this is a frontend app, consider these backend requirements:

- **Pagination**: All list endpoints must support pagination
- **Filtering**: Server-side filtering for large datasets
- **Indexing**: Database indexes on frequently queried fields
- **CDN**: Serve images from CDN, not application server
- **Caching**: Redis/Memcached for frequently accessed data
- **Rate limiting**: Protect API endpoints from abuse
- **Compression**: Gzip/Brotli compression for API responses

## Performance Checklist

Before deploying:

- [ ] Run Lighthouse audit (score > 90)
- [ ] Test with 1000+ photos in a gallery
- [ ] Test with slow 3G network throttling
- [ ] Verify bundle sizes are within targets
- [ ] Check for memory leaks (Chrome DevTools Memory profiler)
- [ ] Test on low-end mobile devices
- [ ] Verify images are lazy loaded
- [ ] Confirm code splitting is working
- [ ] Test with React DevTools Profiler
- [ ] Verify no unnecessary re-renders
