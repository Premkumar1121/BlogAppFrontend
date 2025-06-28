import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyBlogsComponent } from './my-blogs.component';

describe('MyBlogsComponent', () => {
  let component: MyBlogsComponent;
  let fixture: ComponentFixture<MyBlogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyBlogsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyBlogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load blogs on init', () => {
    spyOn(component, 'loadBlogs');
    component.ngOnInit();
    expect(component.loadBlogs).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MyBlogsComponent } from './my-blogs.component';
import { BlogStateService } from '../../../../core/services/blog-state.service';

describe('MyBlogsComponent', () => {
  let component: MyBlogsComponent;
  let fixture: ComponentFixture<MyBlogsComponent>;
  let mockBlogStateService: jasmine.SpyObj<BlogStateService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const blogStateServiceSpy = jasmine.createSpyObj('BlogStateService', [
      'loadMyBlogs', 'deleteBlog'
    ], {
      blogs$: of([]),
      loading$: of(false),
      error$: of(null)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MyBlogsComponent],
      providers: [
        { provide: BlogStateService, useValue: blogStateServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyBlogsComponent);
    component = fixture.componentInstance;
    mockBlogStateService = TestBed.inject(BlogStateService) as jasmine.SpyObj<BlogStateService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load blogs on init', () => {
    mockBlogStateService.loadMyBlogs.and.returnValue(of([]));
    
    component.ngOnInit();
    
    expect(mockBlogStateService.loadMyBlogs).toHaveBeenCalled();
  });

  it('should subscribe to blogs state changes', () => {
    const mockBlogs = [{ _id: '1', title: 'Test Blog', published: true }];
    mockBlogStateService.blogs$ = of(mockBlogs);
    
    component.ngOnInit();
    
    expect(component.blogs).toEqual(mockBlogs as any);
  });

  it('should subscribe to loading state changes', () => {
    mockBlogStateService.loading$ = of(true);
    
    component.ngOnInit();
    
    expect(component.loading).toBeTrue();
  });

  it('should subscribe to error state changes', () => {
    mockBlogStateService.error$ = of('Error loading blogs');
    
    component.ngOnInit();
    
    expect(component.error).toBe('Error loading blogs');
  });

  it('should navigate to edit blog with valid ID', () => {
    const mockBlog = { _id: '123', title: 'Test Blog' };
    
    component.onEditBlog(mockBlog as any);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/posts/edit', '123']);
  });

  it('should handle edit blog with API response format (id)', () => {
    const mockBlog = { id: '123', title: 'Test Blog' };
    
    component.onEditBlog(mockBlog as any);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/posts/edit', '123']);
  });

  it('should show alert for invalid blog ID', () => {
    spyOn(window, 'alert');
    const mockBlog = { _id: '', title: 'Test Blog' };
    
    component.onEditBlog(mockBlog as any);
    
    expect(window.alert).toHaveBeenCalledWith('Cannot edit blog: Invalid blog ID. Please check the blog data.');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should open delete modal', () => {
    const mockBlog = { _id: '123', title: 'Test Blog' };
    
    component.onDeleteBlog(mockBlog as any);
    
    expect(component.selectedBlogForDelete).toEqual(mockBlog as any);
    expect(component.showDeleteModal).toBeTrue();
  });

  it('should confirm delete and close modal', () => {
    const mockBlog = { _id: '123', title: 'Test Blog' };
    component.selectedBlogForDelete = mockBlog as any;
    mockBlogStateService.deleteBlog.and.returnValue(of({}));
    
    component.confirmDelete();
    
    expect(mockBlogStateService.deleteBlog).toHaveBeenCalledWith('123');
    expect(component.showDeleteModal).toBeFalse();
    expect(component.selectedBlogForDelete).toBeNull();
  });

  it('should handle delete error', () => {
    const mockBlog = { _id: '123', title: 'Test Blog' };
    component.selectedBlogForDelete = mockBlog as any;
    mockBlogStateService.deleteBlog.and.returnValue(throwError(() => new Error('Delete failed')));
    
    component.confirmDelete();
    
    expect(component.showDeleteModal).toBeFalse();
    expect(component.selectedBlogForDelete).toBeNull();
  });

  it('should close delete modal', () => {
    component.showDeleteModal = true;
    component.selectedBlogForDelete = { _id: '123' } as any;
    
    component.closeDeleteModal();
    
    expect(component.showDeleteModal).toBeFalse();
    expect(component.selectedBlogForDelete).toBeNull();
  });

  it('should return correct status badge class', () => {
    expect(component.getStatusBadgeClass(true)).toBe('status-published');
    expect(component.getStatusBadgeClass(false)).toBe('status-draft');
  });

  it('should return correct status text', () => {
    expect(component.getStatusText(true)).toBe('Published');
    expect(component.getStatusText(false)).toBe('Draft');
  });

  it('should get content preview from JSON blocks', () => {
    const mockBlog = {
      content: JSON.stringify([
        { type: 'content', data: 'This is test content for preview' },
        { type: 'subtitle', data: 'Test subtitle' }
      ])
    };
    
    const preview = component.getContentPreview(mockBlog as any);
    
    expect(preview).toBe('This is test content for preview');
  });

  it('should get content preview from plain text', () => {
    const mockBlog = {
      content: 'This is plain text content'
    };
    
    const preview = component.getContentPreview(mockBlog as any);
    
    expect(preview).toBe('This is plain text content');
  });

  it('should truncate long content preview', () => {
    const longContent = 'a'.repeat(200);
    const mockBlog = { content: longContent };
    
    const preview = component.getContentPreview(mockBlog as any);
    
    expect(preview.length).toBe(153); // 150 chars + '...'
    expect(preview.endsWith('...')).toBeTrue();
  });

  it('should navigate to write page', () => {
    component.navigateToWrite();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/posts/write']);
  });

  it('should navigate to home page', () => {
    component.navigateToHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should count published blogs', () => {
    component.blogs = [
      { published: true },
      { published: false },
      { published: true }
    ] as any[];
    
    expect(component.getPublishedCount()).toBe(2);
  });

  it('should count draft blogs', () => {
    component.blogs = [
      { published: true },
      { published: false },
      { published: true }
    ] as any[];
    
    expect(component.getDraftCount()).toBe(1);
  });

  it('should return placeholder image URL', () => {
    const placeholderUrl = component.getPlaceholderImage();
    expect(placeholderUrl).toContain('unsplash.com');
  });

  it('should process image URLs correctly', () => {
    expect(component.getImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    expect(component.getImageUrl('uploads/image.jpg')).toBe('https://blog-app-2025.s3.amazonaws.com/uploads/image.jpg');
    expect(component.getImageUrl('')).toContain('unsplash.com');
    expect(component.getImageUrl(undefined)).toContain('unsplash.com');
  });

  it('should track blogs by ID', () => {
    const mockBlog1 = { _id: '123' };
    const mockBlog2 = { id: '456' };
    
    expect(component.trackByBlogId(0, mockBlog1 as any)).toBe('123');
    expect(component.trackByBlogId(0, mockBlog2 as any)).toBe('456');
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

