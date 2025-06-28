import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login', 'isAuthenticated'
    ], {
      isLoading$: of(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { queryParams: {} }
    });

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.loginForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.loginForm.get('password')?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();

    expect(emailControl?.hasError('email')).toBeTruthy();
    expect(component.getFieldError('email')).toContain('valid email');
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('123');
    passwordControl?.markAsTouched();

    expect(passwordControl?.hasError('minlength')).toBeTruthy();
    expect(component.getFieldError('password')).toContain('at least 6');
  });

  it('should redirect to home if already authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    
    component.ngOnInit();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should submit valid form', () => {
    const mockResponse = { user: { id: '1', email: 'test@example.com' }, access_token: 'token' };
    mockAuthService.login.and.returnValue(of(mockResponse));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should handle login error', () => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    mockAuthService.login.and.returnValue(throwError(() => errorResponse));
    
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Invalid credentials');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    
    component.togglePasswordVisibility();
    
    expect(component.showPassword).toBeTrue();
  });

  it('should mark fields as touched when form is invalid', () => {
    component.onSubmit();
    
    expect(component.loginForm.get('email')?.touched).toBeTrue();
    expect(component.loginForm.get('password')?.touched).toBeTrue();
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

