import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { BlogService } from '../../../../core/services/blog.service';
import { AuthService } from '../../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockBlogService: jasmine.SpyObj<BlogService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const blogServiceSpy = jasmine.createSpyObj('BlogService', ['getPosts', 'getTagNames', 'searchPosts', 'getPostsByTag']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated$: of(true),
      currentUser$: of({ full_name: 'Test User' })
    });

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: BlogService, useValue: blogServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    mockBlogService = TestBed.inject(BlogService) as jasmine.SpyObj<BlogService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial data on init', () => {
    spyOn(component, 'loadInitialData');
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.loadInitialData).toHaveBeenCalled();
  });

  it('should toggle user menu open state', () => {
    expect(component.isUserMenuOpen).toBeFalse();
    component.toggleUserMenu(new Event('click'));
    expect(component.isUserMenuOpen).toBeTrue();
  });

  it('should close user menu on document click', () => {
    component.isUserMenuOpen = true;
    component.onDocumentClick(new Event('click'));
    expect(component.isUserMenuOpen).toBeFalse();
  });

  it('should load posts on search query change', () => {
    mockBlogService.searchPosts.and.returnValue(of({ posts: [], page: 1, total_pages: 1 }));
    component.onSearchInput('Angular');
    expect(mockBlogService.searchPosts).toHaveBeenCalledWith('Angular', 1, 10);
  });

  it('should handle posts loading error in search', () => {
    mockBlogService.searchPosts.and.returnValue(throwError(() => new Error('Error loading data')));
    component.onSearchInput('Error');
    expect(component.posts.length).toBe(0);
  });

  it('should load posts by tag', () => {
    mockBlogService.getPostsByTag.and.returnValue(of({ posts: [], page: 1, total_pages: 1 }));
    component.onTagClick('JavaScript');
    expect(mockBlogService.getPostsByTag).toHaveBeenCalledWith('JavaScript', 1, 10);
  });

  it('should log out and close user menu', () => {
    spyOn(mockAuthService, 'logout');
    component.logout();
    expect(component.isUserMenuOpen).toBeFalse();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});

