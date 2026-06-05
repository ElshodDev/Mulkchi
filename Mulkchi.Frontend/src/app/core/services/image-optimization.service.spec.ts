import { TestBed } from '@angular/core/testing';
import { ImageOptimizationService } from './image-optimization.service';

describe('ImageOptimizationService', () => {
  let service: ImageOptimizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageOptimizationService]
    });
    service = TestBed.inject(ImageOptimizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the original url for external links', () => {
    const externalUrl = 'https://images.unsplash.com/photo-test';
    expect(service.getOptimizedImage(externalUrl)).toBe(externalUrl);
  });

  it('should generate srcset properly', () => {
    const srcsetUrl = 'test.jpg';
    const srcset = service.generateSrcset(srcsetUrl, [320, 640]);
    expect(srcset).toContain('320w');
    expect(srcset).toContain('640w');
  });

  it('should validate image urls correctly', () => {
    expect(service.isValidImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(service.isValidImageUrl('invalid-url')).toBe(false);
  });

  it('should return a fallback image', () => {
    expect(service.getFallbackImage()).toContain('images.unsplash.com');
  });

  it('should generate optimized image object', () => {
    const result = service.createOptimizedImage('test.jpg', {
      widths: [320],
      quality: 80,
      withPlaceholder: true,
      lazy: true
    });

    expect(result.src).toBeDefined();
    expect(result.srcset).toBeDefined();
    expect(result.sizes).toBeDefined();
    expect(result.placeholder).toBeDefined();
    expect(result.lazy).toBe(true);
  });
});
