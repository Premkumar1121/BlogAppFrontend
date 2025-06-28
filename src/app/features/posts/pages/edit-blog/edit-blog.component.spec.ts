import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditBlogComponent } from './edit-blog.component';

describe('EditBlogComponent', () => {
  let component: EditBlogComponent;
  let fixture: ComponentFixture<EditBlogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditBlogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditBlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load blog on init', () => {
    spyOn(component, 'loadBlog');
    component.ngOnInit();
    expect(component.loadBlog).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EditBlogComponent } from './edit-blog.component';
import { BlogStateService } from '../../../../core/services/blog-state.service';
import { BlogService } from '../../../../core/services/blog.service';
import { ImageUploadService } from '../../../../core/services/image-upload.service';

describe('EditBlogComponent', () => {
  let component: EditBlogComponent;
  let fixture: ComponentFixture<EditBlogComponent>;
  let mockBlogStateService: jasmine.SpyObj<BlogStateService>;
  let mockBlogService: jasmine.SpyObj<BlogService>;
  let mockImageUploadService: jasmine.SpyObj<ImageUploadService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    const blogStateServiceSpy = jasmine.createSpyObj('BlogStateService', [
      'getBlogById', 'clearSelectedBlog', 'resetChanges'
    ], {
      selectedBlog$: of(null),
      hasChanges$: of(false)
    });
    const blogServiceSpy = jasmine.createSpyObj('BlogService', ['getTags', 'updateBlog']);
    const imageUploadServiceSpy = jasmine.createSpyObj('ImageUploadService', ['uploadImage']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('123')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [EditBlogComponent],
      providers: [
        { provide: BlogStateService, useValue: blogStateServiceSpy },
        { provide: BlogService, useValue: blogServiceSpy },
        { provide: ImageUploadService, useValue: imageUploadServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditBlogComponent);
    component = fixture.componentInstance;
    mockBlogStateService = TestBed.inject(BlogStateService) as jasmine.SpyObj<BlogStateService>;
    mockBlogService = TestBed.inject(BlogService) as jasmine.SpyObj<BlogService>;
    mockImageUploadService = TestBed.inject(ImageUploadService) as jasmine.SpyObj<ImageUploadService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load blog on init with valid ID', () => {
    mockBlogStateService.getBlogById.and.returnValue(of({ 
      _id: '123', 
      title: 'Test Blog',
      content: 'Test content',
      tags: ['javascript'],
      main_image_url: 'image.jpg'
    }));

    component.ngOnInit();

    expect(mockBlogStateService.getBlogById).toHaveBeenCalledWith('123');
    expect(component.blogId).toBe('123');
  });

  it('should redirect to posts when no blog ID', () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue('');
    
    component.ngOnInit();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/posts']);
  });

  it('should initialize edit form with blog data', () => {
    const mockBlog = {
      _id: '123',
      title: 'Test Blog',
      content: JSON.stringify([{ type: 'content', data: 'Test content' }]),
      tags: ['javascript', 'angular'],
      main_image_url: 'image.jpg'
    };

    component['initializeEditForm'](mockBlog as any);

    expect(component.blogTitle).toBe('Test Blog');
    expect(component.selectedTags).toEqual(['javascript', 'angular']);
    expect(component.mainImageUrl).toBe('image.jpg');
    expect(component.blogBlocks.length).toBe(1);
  });

  it('should handle plain text content in initialization', () => {
    const mockBlog = {
      _id: '123',
      title: 'Test Blog',
      content: 'Plain text content',
      tags: [],
      main_image_url: ''
    };

    component['initializeEditForm'](mockBlog as any);

    expect(component.blogBlocks.length).toBe(1);
    expect(component.blogBlocks[0].type).toBe('content');
    expect(component.blogBlocks[0].data).toBe('Plain text content');
  });

  it('should generate unique block ID', () => {
    const id1 = component['generateId']();
    const id2 = component['generateId']();
    
    expect(id1).toContain('block_');
    expect(id2).toContain('block_');
    expect(id1).not.toBe(id2);
  });

  it('should return correct placeholder for block types', () => {
    expect(component['getPlaceholder']('subtitle')).toBe('Enter subtitle...');
    expect(component['getPlaceholder']('content')).toBe('Start writing your content...');
    expect(component['getPlaceholder']('image')).toBe('Enter image URL...');
    expect(component['getPlaceholder']('unknown')).toBe('Enter text...');
  });

  it('should handle blog loading error', () => {
    mockBlogStateService.getBlogById.and.returnValue(throwError(() => new Error('Blog not found')));
    
    component.ngOnInit();
    
    expect(component.loading).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/posts']);
  });

  it('should load available tags', () => {
    const mockTags = [
      { _id: '1', name: 'JavaScript', created_at: '2023-01-01' },
      { _id: '2', name: 'Angular', created_at: '2023-01-02' }
    ];
    mockBlogService.getTags.and.returnValue(of(mockTags));
    
    component['loadAvailableTags']();
    
    expect(mockBlogService.getTags).toHaveBeenCalled();
    expect(component.availableTags).toEqual(mockTags);
  });

  it('should handle tags loading error with fallback', () => {
    mockBlogService.getTags.and.returnValue(throwError(() => new Error('Failed to load tags')));
    
    component['loadAvailableTags']();
    
    expect(component.isLoadingTags).toBeFalse();
    expect(component.availableTags.length).toBeGreaterThan(0);
  });

  it('should subscribe to blog state changes', () => {
    const mockBlog = { _id: '123', title: 'Test' };
    mockBlogStateService.selectedBlog$ = of(mockBlog);
    spyOn(component, 'initializeEditForm' as any);
    
    component.ngOnInit();
    
    expect(component.blog).toEqual(mockBlog as any);
  });

  it('should subscribe to hasChanges state', () => {
    mockBlogStateService.hasChanges$ = of(true);
    
    component.ngOnInit();
    
    expect(component.hasChanges).toBeTrue();
  });

  it('should clear selected blog on destroy', () => {
    component.ngOnDestroy();
    
    expect(mockBlogStateService.clearSelectedBlog).toHaveBeenCalled();
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

