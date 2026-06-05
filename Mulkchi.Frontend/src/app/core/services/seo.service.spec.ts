import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';
import { Meta, Title } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { UIStore } from '../stores/ui.store';
import { signal } from '@angular/core';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;
  let uiStoreSpy: any;

  beforeEach(() => {
    uiStoreSpy = {
      language: signal('uz'),
      setLanguage: jasmine.createSpy('setLanguage')
    };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        SeoService,
        { provide: UIStore, useValue: uiStoreSpy }
      ]
    });
    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set title correctly', () => {
    spyOn(titleService, 'setTitle');
    spyOn(metaService, 'updateTag');

    service.setTitle('Test Title');

    expect(titleService.setTitle).toHaveBeenCalledWith('Test Title | Mulkchi');
    expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'title', content: 'Test Title' });
  });

  it('should configure basic meta tags', () => {
    spyOn(metaService, 'updateTag');

    service.updateMetaTags({
      title: 'Custom Title',
      description: 'Custom Description',
      keywords: ['custom', 'keyword']
    });

    expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'description', content: 'Custom Description' });
    expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'keywords', content: 'custom, keyword' });
  });

  it('should set robots meta tag for noIndex and noFollow', () => {
    spyOn(metaService, 'updateTag');

    service.setRobotsMeta(true, true);
    expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'robots', content: 'noindex, nofollow' });

    service.setRobotsMeta(true, false);
    expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'robots', content: 'noindex, follow' });

    service.setRobotsMeta(false, true);
    expect(metaService.updateTag).toHaveBeenCalledWith({ name: 'robots', content: 'index, nofollow' });
  });

  it('should reset meta tags to default', () => {
    spyOn(service, 'updateMetaTags');
    
    service.resetMetaTags();
    
    expect(service.updateMetaTags).toHaveBeenCalledWith(jasmine.objectContaining({
      type: 'website'
    }));
  });

  it('should set language correctly', () => {
    service.setLanguage('ru_RU');
    expect(document.documentElement.lang).toBe('ru');
    expect(uiStoreSpy.setLanguage).toHaveBeenCalledWith('ru');
  });
});
