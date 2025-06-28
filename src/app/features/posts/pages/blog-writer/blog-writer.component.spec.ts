import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BlogWriterComponent } from './blog-writer.component';
import { AuthService } from '../../../../core/services/auth.service';
import { BlogService } from '../../../../core/services/blog.service';
import { ImageUploadService } from '../../../../core/services/image-upload.service';

describe('BlogWriterComponent', () => {
  let component: BlogWriterComponent;
  let fixture: ComponentFixture<BlogWriterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockBlogService: jasmine.SpyObj<BlogService>;
  let mockImageUploadService: jasmine.SpyObj<ImageUploadService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated$: of(true)
    });
    const blogServiceSpy = jasmine.createSpyObj('BlogService', ['getTags', 'createBlog']);
    const imageUploadServiceSpy = jasmine.createSpyObj('ImageUploadService', ['uploadImage']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BlogWriterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: BlogService, useValue: blogServiceSpy },
        { provide: ImageUploadService, useValue: imageUploadServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BlogWriterComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockBlogService = TestBed.inject(BlogService) as jasmine.SpyObj<BlogService>;
    mockImageUploadService = TestBed.inject(ImageUploadService) as jasmine.SpyObj<ImageUploadService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle add menu', () => {
    expect(component.showAddMenu).toBeFalse();
    component.toggleAddMenu();
    expect(component.showAddMenu).toBeTrue();
  });

  it('should close add menu', () => {
    component.showAddMenu = true;
    component.closeAddMenu();
    expect(component.showAddMenu).toBeFalse();
    expect(component.currentBlockId).toBeNull();
  });

  it('should add new block', () => {
    const initialBlockCount = component.blogBlocks.length;
    component.addBlock('content');
    expect(component.blogBlocks.length).toBe(initialBlockCount + 1);
    expect(component.blogBlocks[0].type).toBe('content');
  });

  it('should remove block', () => {
    component.addBlock('content');
    const blockId = component.blogBlocks[0].id;
    component.removeBlock(blockId);
    expect(component.blogBlocks.length).toBe(0);
  });

  it('should move block up', () => {
    component.addBlock('subtitle');
    component.addBlock('content');
    const secondBlockId = component.blogBlocks[1].id;
    
    component.moveBlockUp(secondBlockId);
    
    expect(component.blogBlocks[0].id).toBe(secondBlockId);
  });

  it('should move block down', () => {
    component.addBlock('subtitle');
    component.addBlock('content');
    const firstBlockId = component.blogBlocks[0].id;
    
    component.moveBlockDown(firstBlockId);
    
    expect(component.blogBlocks[1].id).toBe(firstBlockId);
  });

  it('should update block content', () => {
    component.addBlock('content');
    const blockId = component.blogBlocks[0].id;
    const newContent = 'Updated content';
    
    component.onBlockChange(blockId, newContent);
    
    expect(component.blogBlocks[0].data).toBe(newContent);
  });

  it('should open publish modal when blog has title and content', () => {
    component.blogTitle = 'Test Blog';
    component.addBlock('content');
    
    component.openPublishModal();
    
    expect(component.showPublishModal).toBeTrue();
  });

  it('should not open publish modal without title', () => {
    spyOn(window, 'alert');
    component.blogTitle = '';
    component.addBlock('content');
    
    component.openPublishModal();
    
    expect(window.alert).toHaveBeenCalledWith('Please enter a blog title');
    expect(component.showPublishModal).toBeFalse();
  });

  it('should add custom tag', () => {
    component.newTagInput = 'JavaScript';
    
    component.addCustomTag();
    
    expect(component.selectedTags).toContain('JavaScript');
    expect(component.newTagInput).toBe('');
  });

  it('should remove selected tag', () => {
    component.selectedTags = ['JavaScript', 'Angular'];
    
    component.removeTag('JavaScript');
    
    expect(component.selectedTags).not.toContain('JavaScript');
    expect(component.selectedTags).toContain('Angular');
  });

  it('should publish blog successfully', () => {
    const mockResponse = { id: '1', title: 'Test Blog' };
    mockBlogService.createBlog.and.returnValue(of(mockResponse));
    
    component.blogTitle = 'Test Blog';
    component.addBlock('content');
    component.selectedTags = ['JavaScript'];
    
    component.publishBlog();
    
    expect(mockBlogService.createBlog).toHaveBeenCalled();
    expect(component.isPublishing).toBeFalse();
  });

  it('should handle publish error', () => {
    mockBlogService.createBlog.and.returnValue(throwError(() => new Error('Publish failed')));
    
    component.blogTitle = 'Test Blog';
    component.addBlock('content');
    
    component.publishBlog();
    
    expect(component.isPublishing).toBeFalse();
  });

  it('should upload image successfully', () => {
    const mockResponse = { imageUrl: 'https://example.com/image.jpg' };
    mockImageUploadService.uploadImage.and.returnValue(of(mockResponse));
    
    component.addBlock('image');
    const blockId = component.blogBlocks[0].id;
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    component['uploadImageToS3'](file, blockId);
    
    expect(mockImageUploadService.uploadImage).toHaveBeenCalledWith(file);
    expect(component.blogBlocks[0].data).toBe('https://example.com/image.jpg');
  });

  it('should close publish modal and reset values', () => {
    component.showPublishModal = true;
    component.mainImageUrl = 'test-url';
    component.selectedTags = ['tag1'];
    component.newTagInput = 'test';
    
    component.closePublishModal();
    
    expect(component.showPublishModal).toBeFalse();
    expect(component.mainImageUrl).toBe('');
    expect(component.selectedTags.length).toBe(0);
    expect(component.newTagInput).toBe('');
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

