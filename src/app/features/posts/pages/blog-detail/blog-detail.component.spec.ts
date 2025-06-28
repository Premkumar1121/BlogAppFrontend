import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogDetailComponent } from './blog-detail.component';

describe('BlogDetailComponent', () => {
  let component: BlogDetailComponent;
  let fixture: ComponentFixture<BlogDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlogDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a blogId defined after initialization', () => {
    component.ngOnInit();
    expect(component.blogId).toBeDefined();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BlogDetailComponent } from './blog-detail.component';
import { BlogService } from '../../../../core/services/blog.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AiSummaryService } from '../../../../core/services/ai-summary.service';
import { CommentService } from '../../../../core/services/comment.service';
import { LikeService } from '../../../../core/services/like.service';

describe('BlogDetailComponent', () => {
  let component: BlogDetailComponent;
  let fixture: ComponentFixture<BlogDetailComponent>;
  let mockBlogService: jasmine.SpyObj<BlogService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockAiSummaryService: jasmine.SpyObj<AiSummaryService>;
  let mockCommentService: jasmine.SpyObj<CommentService>;
  let mockLikeService: jasmine.SpyObj<LikeService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    const blogServiceSpy = jasmine.createSpyObj('BlogService', ['getBlogById']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const aiSummaryServiceSpy = jasmine.createSpyObj('AiSummaryService', ['generateSummary']);
    const commentServiceSpy = jasmine.createSpyObj('CommentService', ['getComments', 'addComment', 'updateComment', 'deleteComment']);
    const likeServiceSpy = jasmine.createSpyObj('LikeService', ['toggleLike', 'getLikeStatus', 'getLikesCount']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('123')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [BlogDetailComponent],
      providers: [
        { provide: BlogService, useValue: blogServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AiSummaryService, useValue: aiSummaryServiceSpy },
        { provide: CommentService, useValue: commentServiceSpy },
        { provide: LikeService, useValue: likeServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BlogDetailComponent);
    component = fixture.componentInstance;
    mockBlogService = TestBed.inject(BlogService) as jasmine.SpyObj<BlogService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockAiSummaryService = TestBed.inject(AiSummaryService) as jasmine.SpyObj<AiSummaryService>;
    mockCommentService = TestBed.inject(CommentService) as jasmine.SpyObj<CommentService>;
    mockLikeService = TestBed.inject(LikeService) as jasmine.SpyObj<LikeService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load blog on init with valid ID', () => {
    const mockBlog = {
      _id: '123',
      title: 'Test Blog',
      content: 'Test content',
      likes_count: 5,
      comment_count: 3
    };
    mockBlogService.getBlogById.and.returnValue(of(mockBlog));
    spyOn(component, 'loadLikeStatus');
    spyOn(component, 'loadBlogLikesCount');
    spyOn(component, 'loadComments');

    component.ngOnInit();

    expect(mockBlogService.getBlogById).toHaveBeenCalledWith('123');
    expect(component.blog).toEqual(mockBlog as any);
    expect(component.likesCount).toBe(5);
    expect(component.commentCount).toBe(3);
  });

  it('should handle blog loading error', () => {
    mockBlogService.getBlogById.and.returnValue(throwError(() => new Error('Blog not found')));

    component.ngOnInit();

    expect(component.error).toContain('Failed to load blog');
    expect(component.loading).toBeFalse();
  });

  it('should navigate back to home', () => {
    component.navigateBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should parse JSON content blocks', () => {
    const jsonContent = JSON.stringify([
      { type: 'subtitle', data: 'Test Subtitle' },
      { type: 'content', data: 'Test content' }
    ]);
    component.blog = { content: jsonContent } as any;

    const blocks = component.getContentBlocks();

    expect(blocks.length).toBe(2);
    expect(blocks[0].type).toBe('subtitle');
    expect(blocks[1].type).toBe('content');
  });

  it('should handle plain text content', () => {
    component.blog = { content: 'Plain text content' } as any;

    const blocks = component.getContentBlocks();

    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('content');
  });

  it('should get first name from full name', () => {
    expect(component.getFirstName('john@example.com')).toBe('john');
    expect(component.getFirstName('John Doe')).toBe('John Doe');
  });

  it('should handle image URL processing', () => {
    expect(component.getImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    expect(component.getImageUrl('uploads/image.jpg')).toBe('https://blog-app-2025.s3.amazonaws.com/uploads/image.jpg');
    expect(component.getImageUrl('')).toBeNull();
    expect(component.getImageUrl(undefined)).toBeNull();
  });

  it('should generate default avatar URL', () => {
    const avatarUrl = component.getDefaultAvatar('John Doe');
    expect(avatarUrl).toContain('ui-avatars.com');
    expect(avatarUrl).toContain('John%20Doe');
  });

  it('should set error when blog ID is not found', () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
    
    component.ngOnInit();
    
    expect(component.error).toBe('Blog ID not found');
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

