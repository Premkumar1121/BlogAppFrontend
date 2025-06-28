import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { InterestsComponent } from './interests.component';
import { InterestsService } from '../../../core/services/interests.service';

describe('InterestsComponent', () => {
  let component: InterestsComponent;
  let fixture: ComponentFixture<InterestsComponent>;
  let mockInterestsService: jasmine.SpyObj<InterestsService>;

  beforeEach(async () => {
    const interestsServiceSpy = jasmine.createSpyObj('InterestsService', [
      'getInterestSuggestions', 'getUserInterests', 'createUserInterests', 'updateUserInterests'
    ]);

    await TestBed.configureTestingModule({
      imports: [InterestsComponent, FormsModule],
      providers: [
        { provide: InterestsService, useValue: interestsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InterestsComponent);
    component = fixture.componentInstance;
    mockInterestsService = TestBed.inject(InterestsService) as jasmine.SpyObj<InterestsService>;
    
    // Mock default service responses
    mockInterestsService.getInterestSuggestions.and.returnValue(of(['Technology', 'Sports', 'Music']));
    mockInterestsService.getUserInterests.and.returnValue(of({ interests: ['Technology'] }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load interest suggestions on init', () => {
    component.ngOnInit();
    
    expect(mockInterestsService.getInterestSuggestions).toHaveBeenCalled();
    expect(component.suggestions).toEqual(['Technology', 'Sports', 'Music']);
  });

  it('should load user interests on init when not first time setup', () => {
    component.isFirstTimeSetup = false;
    
    component.ngOnInit();
    
    expect(mockInterestsService.getUserInterests).toHaveBeenCalled();
  });

  it('should not load user interests when first time setup', () => {
    component.isFirstTimeSetup = true;
    
    component.ngOnInit();
    
    expect(mockInterestsService.getUserInterests).not.toHaveBeenCalled();
  });

  it('should toggle interest selection', () => {
    component.selectedInterests = ['Technology'];
    
    // Add new interest
    component.toggleInterest('Sports');
    expect(component.selectedInterests).toContain('Sports');
    
    // Remove existing interest
    component.toggleInterest('Technology');
    expect(component.selectedInterests).not.toContain('Technology');
  });

  it('should limit interests to 20', () => {
    component.selectedInterests = new Array(20).fill('Interest');
    
    component.toggleInterest('NewInterest');
    
    expect(component.selectedInterests.length).toBe(20);
    expect(component.errorMessage).toBe('You can select up to 20 interests only.');
  });

  it('should add custom interest', () => {
    component.customInterest = 'Custom Interest';
    component.selectedInterests = [];
    
    component.addCustomInterest();
    
    expect(component.selectedInterests).toContain('Custom Interest');
    expect(component.customInterest).toBe('');
  });

  it('should not add duplicate custom interest', () => {
    component.customInterest = 'Technology';
    component.selectedInterests = ['Technology'];
    
    component.addCustomInterest();
    
    expect(component.selectedInterests.length).toBe(1);
    expect(component.errorMessage).toBe('Interest already selected.');
  });

  it('should remove interest', () => {
    component.selectedInterests = ['Technology', 'Sports'];
    
    component.removeInterest('Technology');
    
    expect(component.selectedInterests).toEqual(['Sports']);
  });

  it('should save interests for first time setup', () => {
    component.isFirstTimeSetup = true;
    component.userInterests = null;
    component.selectedInterests = ['Technology', 'Sports'];
    const mockResponse = { interests: ['Technology', 'Sports'] };
    mockInterestsService.createUserInterests.and.returnValue(of(mockResponse));
    
    component.saveInterests();
    
    expect(mockInterestsService.createUserInterests).toHaveBeenCalledWith({ interests: ['Technology', 'Sports'] });
    expect(component.successMessage).toBe('Interests saved successfully!');
  });

  it('should update existing interests', () => {
    component.isFirstTimeSetup = false;
    component.userInterests = { interests: ['Technology'] } as any;
    component.selectedInterests = ['Technology', 'Sports'];
    const mockResponse = { interests: ['Technology', 'Sports'] };
    mockInterestsService.updateUserInterests.and.returnValue(of(mockResponse));
    
    component.saveInterests();
    
    expect(mockInterestsService.updateUserInterests).toHaveBeenCalledWith({ interests: ['Technology', 'Sports'] });
    expect(component.successMessage).toBe('Interests saved successfully!');
  });

  it('should require at least one interest to save', () => {
    component.selectedInterests = [];
    
    component.saveInterests();
    
    expect(component.errorMessage).toBe('Please select at least one interest.');
    expect(mockInterestsService.createUserInterests).not.toHaveBeenCalled();
    expect(mockInterestsService.updateUserInterests).not.toHaveBeenCalled();
  });

  it('should handle save interests error', () => {
    component.selectedInterests = ['Technology'];
    const errorResponse = { error: { message: 'Save failed' } };
    mockInterestsService.createUserInterests.and.returnValue(throwError(() => errorResponse));
    
    component.saveInterests();
    
    expect(component.errorMessage).toBe('Save failed');
    expect(component.isLoading).toBeFalse();
  });

  it('should emit setup completed for first time setup', (done) => {
    component.isFirstTimeSetup = true;
    component.selectedInterests = ['Technology'];
    const mockResponse = { interests: ['Technology'] };
    mockInterestsService.createUserInterests.and.returnValue(of(mockResponse));
    
    component.setupCompleted.subscribe(() => {
      done();
    });
    
    component.saveInterests();
  });

  it('should emit interests selected when toggling', (done) => {
    component.interestsSelected.subscribe((interests) => {
      expect(interests).toContain('Technology');
      done();
    });
    
    component.toggleInterest('Technology');
  });

  it('should check if interest is selected', () => {
    component.selectedInterests = ['Technology', 'Sports'];
    
    expect(component.isSelected('Technology')).toBeTrue();
    expect(component.isSelected('Music')).toBeFalse();
  });

  it('should handle interest suggestions loading error', () => {
    mockInterestsService.getInterestSuggestions.and.returnValue(throwError(() => new Error('Failed to load')));
    
    component.ngOnInit();
    
    expect(component.errorMessage).toBe('Failed to load interest suggestions.');
  });

  it('should handle user interests loading error gracefully for 404', () => {
    const error404 = { status: 404 };
    mockInterestsService.getUserInterests.and.returnValue(throwError(() => error404));
    component.isFirstTimeSetup = false;
    
    component.ngOnInit();
    
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe(''); // Should not set error for 404
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { InterestsComponent } from './interests.component';
import { InterestsService } from '../../../core/services/interests.service';

describe('InterestsComponent', () => {
  let component: InterestsComponent;
  let fixture: ComponentFixture<InterestsComponent>;
  let mockInterestsService: jasmine.SpyObj<InterestsService>;

  beforeEach(async () => {
    const interestsServiceSpy = jasmine.createSpyObj('InterestsService', [
      'getInterestSuggestions',
      'getUserInterests',
      'createUserInterests',
      'updateUserInterests'
    ]);

    await TestBed.configureTestingModule({
      imports: [InterestsComponent, FormsModule],
      providers: [
        { provide: InterestsService, useValue: interestsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InterestsComponent);
    component = fixture.componentInstance;
    mockInterestsService = TestBed.inject(InterestsService) as jasmine.SpyObj<InterestsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load interest suggestions on init', () => {
    const mockSuggestions = ['Technology', 'Programming', 'Angular'];
    mockInterestsService.getInterestSuggestions.and.returnValue(of(mockSuggestions));

    component.ngOnInit();

    expect(mockInterestsService.getInterestSuggestions).toHaveBeenCalled();
    expect(component.suggestions).toEqual(mockSuggestions);
  });

  it('should load user interests when not first time setup', () => {
    const mockUserInterests = { interests: ['Technology', 'Programming'] };
    mockInterestsService.getInterestSuggestions.and.returnValue(of([]));
    mockInterestsService.getUserInterests.and.returnValue(of(mockUserInterests));
    component.isFirstTimeSetup = false;

    component.ngOnInit();

    expect(mockInterestsService.getUserInterests).toHaveBeenCalled();
    expect(component.selectedInterests).toEqual(['Technology', 'Programming']);
  });

  it('should toggle interest selection', () => {
    component.toggleInterest('JavaScript');
    expect(component.selectedInterests).toContain('JavaScript');

    component.toggleInterest('JavaScript');
    expect(component.selectedInterests).not.toContain('JavaScript');
  });

  it('should add custom interest', () => {
    component.customInterest = 'Machine Learning';
    
    component.addCustomInterest();
    
    expect(component.selectedInterests).toContain('Machine Learning');
    expect(component.customInterest).toBe('');
  });

  it('should not add duplicate custom interest', () => {
    component.selectedInterests = ['JavaScript'];
    component.customInterest = 'JavaScript';
    
    component.addCustomInterest();
    
    expect(component.errorMessage).toContain('already selected');
  });

  it('should limit interests to 20', () => {
    component.selectedInterests = new Array(20).fill(0).map((_, i) => `Interest${i}`);
    
    component.toggleInterest('NewInterest');
    
    expect(component.errorMessage).toContain('up to 20 interests');
    expect(component.selectedInterests).not.toContain('NewInterest');
  });

  it('should remove interest', () => {
    component.selectedInterests = ['JavaScript', 'Angular'];
    
    component.removeInterest('JavaScript');
    
    expect(component.selectedInterests).not.toContain('JavaScript');
    expect(component.selectedInterests).toContain('Angular');
  });

  it('should save new interests', () => {
    const mockResponse = { interests: ['JavaScript'] };
    mockInterestsService.createUserInterests.and.returnValue(of(mockResponse));
    component.selectedInterests = ['JavaScript'];
    component.userInterests = null;

    component.saveInterests();

    expect(mockInterestsService.createUserInterests).toHaveBeenCalledWith({ interests: ['JavaScript'] });
    expect(component.successMessage).toContain('saved successfully');
  });

  it('should update existing interests', () => {
    const mockResponse = { interests: ['JavaScript', 'Angular'] };
    mockInterestsService.updateUserInterests.and.returnValue(of(mockResponse));
    component.selectedInterests = ['JavaScript', 'Angular'];
    component.userInterests = { interests: ['JavaScript'] };

    component.saveInterests();

    expect(mockInterestsService.updateUserInterests).toHaveBeenCalledWith({ interests: ['JavaScript', 'Angular'] });
  });

  it('should emit setup completed for first time setup', (done) => {
    const mockResponse = { interests: ['JavaScript'] };
    mockInterestsService.createUserInterests.and.returnValue(of(mockResponse));
    component.selectedInterests = ['JavaScript'];
    component.isFirstTimeSetup = true;

    component.setupCompleted.subscribe(() => {
      done();
    });

    component.saveInterests();
  });

  it('should handle save error', () => {
    mockInterestsService.createUserInterests.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));
    component.selectedInterests = ['JavaScript'];

    component.saveInterests();

    expect(component.errorMessage).toBe('Save failed');
    expect(component.isLoading).toBeFalse();
  });

  it('should check if interest is selected', () => {
    component.selectedInterests = ['JavaScript', 'Angular'];

    expect(component.isSelected('JavaScript')).toBeTrue();
    expect(component.isSelected('React')).toBeFalse();
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

