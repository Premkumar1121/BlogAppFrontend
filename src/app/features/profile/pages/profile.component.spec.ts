import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'updateProfile', 'changePassword'
    ], {
      currentUser$: of({ 
        email: 'test@example.com', 
        username: 'testuser' 
      }),
      isLoading$: of(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms with validators', () => {
    fixture.detectChanges();

    expect(component.profileForm.get('email')?.hasError('required')).toBeFalsy();
    expect(component.profileForm.get('username')?.hasError('required')).toBeFalsy();
    expect(component.passwordForm.get('current_password')?.hasError('required')).toBeTruthy();
    expect(component.passwordForm.get('new_password')?.hasError('required')).toBeTruthy();
    expect(component.passwordForm.get('confirm_password')?.hasError('required')).toBeTruthy();
  });

  it('should populate profile form with current user data', () => {
    const mockUser = {
      email: 'test@example.com',
      username: 'testuser'
    };
    mockAuthService.currentUser$ = of(mockUser);

    component.ngOnInit();

    expect(component.profileForm.get('email')?.value).toBe('test@example.com');
    expect(component.profileForm.get('username')?.value).toBe('testuser');
  });

  it('should validate email format', () => {
    const emailControl = component.profileForm.get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();

    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should validate username minimum length', () => {
    const usernameControl = component.profileForm.get('username');
    usernameControl?.setValue('a');
    usernameControl?.markAsTouched();

    expect(usernameControl?.hasError('minlength')).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.passwordForm.get('new_password');
    passwordControl?.setValue('123');
    passwordControl?.markAsTouched();

    expect(passwordControl?.hasError('minlength')).toBeTruthy();
  });

  it('should validate password confirmation match', () => {
    component.passwordForm.patchValue({
      new_password: 'password123',
      confirm_password: 'differentpassword'
    });

    const confirmPasswordControl = component.passwordForm.get('confirm_password');
    expect(confirmPasswordControl?.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should update profile successfully', () => {
    const mockResponse = { message: 'Profile updated successfully' };
    mockAuthService.updateProfile.and.returnValue(of(mockResponse));
    
    component.currentUser = { email: 'test@example.com', username: 'oldusername' } as any;
    component.profileForm.patchValue({
      email: 'test@example.com',
      username: 'newusername'
    });
    
    component.onUpdateProfile();
    
    expect(mockAuthService.updateProfile).toHaveBeenCalledWith({ username: 'newusername' });
    expect(component.successMessage).toBe('Username updated successfully!');
  });

  it('should handle profile update error', () => {
    const errorResponse = { error: { detail: 'Username already exists' } };
    mockAuthService.updateProfile.and.returnValue(throwError(() => errorResponse));
    
    component.currentUser = { email: 'test@example.com', username: 'oldusername' } as any;
    component.profileForm.patchValue({
      email: 'test@example.com',
      username: 'newusername'
    });
    
    component.onUpdateProfile();
    
    expect(component.errorMessage).toBe('Username already exists');
  });

  it('should change password successfully', () => {
    const mockResponse = { message: 'Password changed successfully' };
    mockAuthService.changePassword.and.returnValue(of(mockResponse));
    
    component.passwordForm.patchValue({
      current_password: 'oldpassword',
      new_password: 'newpassword123',
      confirm_password: 'newpassword123'
    });
    
    component.onChangePassword();
    
    expect(mockAuthService.changePassword).toHaveBeenCalledWith('oldpassword', 'newpassword123', 'newpassword123');
    expect(component.passwordSuccessMessage).toBe('Password changed successfully!');
  });

  it('should handle password change error', () => {
    const errorResponse = { error: { message: 'Current password is incorrect' } };
    mockAuthService.changePassword.and.returnValue(throwError(() => errorResponse));
    
    component.passwordForm.patchValue({
      current_password: 'wrongpassword',
      new_password: 'newpassword123',
      confirm_password: 'newpassword123'
    });
    
    component.onChangePassword();
    
    expect(component.passwordErrorMessage).toBe('Current password is incorrect');
  });

  it('should calculate password strength correctly', () => {
    component['calculatePasswordStrength']('weakpass');
    expect(component.newPasswordStrength).toBeLessThan(80);
    
    component['calculatePasswordStrength']('StrongPass123!');
    expect(component.newPasswordStrength).toBe(100);
  });

  it('should toggle password visibility', () => {
    expect(component.showCurrentPassword).toBeFalse();
    expect(component.showNewPassword).toBeFalse();
    expect(component.showConfirmPassword).toBeFalse();
    
    component.togglePasswordVisibility('current');
    expect(component.showCurrentPassword).toBeTrue();
    
    component.togglePasswordVisibility('new');
    expect(component.showNewPassword).toBeTrue();
    
    component.togglePasswordVisibility('confirm');
    expect(component.showConfirmPassword).toBeTrue();
  });

  it('should set active tab and clear messages', () => {
    component.successMessage = 'Test message';
    component.errorMessage = 'Test error';
    
    component.setActiveTab('password');
    
    expect(component.activeTab).toBe('password');
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('should get user initials correctly', () => {
    component.currentUser = { username: 'testuser' } as any;
    expect(component.getUserInitials()).toBe('TE');
    
    component.currentUser = { email: 'john@example.com' } as any;
    expect(component.getUserInitials()).toBe('JO');
  });

  it('should navigate to home', () => {
    component.navigateToHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

