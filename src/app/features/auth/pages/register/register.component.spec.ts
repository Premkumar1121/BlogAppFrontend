import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ReactiveFormsModule ],
      declarations: [ RegisterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('email field validity', () => {
    const email = component.registerForm.controls['email'];
    email.setValue('test');
    expect(email.valid).toBeFalsy();
  });

  it('should match passwords', () => {
    component.registerForm.controls['password'].setValue('Test12345!');
    component.registerForm.controls['confirm_password'].setValue('Test12345!');
    expect(component.registerForm.valid).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'register', 'isAuthenticated'
    ], {
      isLoading$: of(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    fixture.detectChanges();

    expect(component.registerForm.get('full_name')?.hasError('required')).toBeTruthy();
    expect(component.registerForm.get('email')?.hasError('required')).toBeTruthy();
    expect(component.registerForm.get('password')?.hasError('required')).toBeTruthy();
    expect(component.registerForm.get('confirmPassword')?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.registerForm.get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();

    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.registerForm.get('password');
    passwordControl?.setValue('123');
    passwordControl?.markAsTouched();

    expect(passwordControl?.hasError('minlength')).toBeTruthy();
  });

  it('should validate password confirmation match', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'differentpassword'
    });

    expect(component.registerForm.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should submit valid form', () => {
    const mockResponse = { 
      message: 'Registration successful',
      user: { id: '1', email: 'test@example.com' }
    };
    mockAuthService.register.and.returnValue(of(mockResponse));
    
    component.registerForm.patchValue({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    component.onSubmit();
    
    expect(mockAuthService.register).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should handle registration error', () => {
    const errorResponse = { error: { message: 'Email already exists' } };
    mockAuthService.register.and.returnValue(throwError(() => errorResponse));
    
    component.registerForm.patchValue({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Email already exists');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    
    component.togglePasswordVisibility();
    
    expect(component.showPassword).toBeTrue();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.showConfirmPassword).toBeFalse();
    
    component.toggleConfirmPasswordVisibility();
    
    expect(component.showConfirmPassword).toBeTrue();
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

