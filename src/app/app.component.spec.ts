import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { of, Subject } from 'rxjs';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDocument: jasmine.SpyObj<Document>;
  let routerEventsSubject: Subject<any>;

  beforeEach(async () => {
    routerEventsSubject = new Subject();
    const routerSpy = jasmine.createSpyObj('Router', [], {
      events: routerEventsSubject.asObservable(),
      url: '/'
    });
    const documentSpy = jasmine.createSpyObj('Document', [], {
      body: {
        classList: {
          add: jasmine.createSpy('add'),
          remove: jasmine.createSpy('remove')
        }
      }
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: DOCUMENT, useValue: documentSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockDocument = TestBed.inject(DOCUMENT) as jasmine.SpyObj<Document>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title', () => {
    expect(component.title).toBe('BlogPlatform');
  });

  it('should hide header on landing page', () => {
    (mockRouter as any).url = '/landing';
    
    component.ngOnInit();
    
    expect(component.shouldShowHeader).toBeFalse();
    expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('has-header');
  });

  it('should hide header on login page', () => {
    (mockRouter as any).url = '/auth/login';
    
    component.ngOnInit();
    
    expect(component.shouldShowHeader).toBeFalse();
    expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('has-header');
  });

  it('should hide header on register page', () => {
    (mockRouter as any).url = '/auth/register';
    
    component.ngOnInit();
    
    expect(component.shouldShowHeader).toBeFalse();
    expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('has-header');
  });

  it('should show header on home page', () => {
    (mockRouter as any).url = '/home';
    
    component.ngOnInit();
    
    expect(component.shouldShowHeader).toBeTrue();
    expect(mockDocument.body.classList.add).toHaveBeenCalledWith('has-header');
  });

  it('should show header on posts page', () => {
    (mockRouter as any).url = '/posts';
    
    component.ngOnInit();
    
    expect(component.shouldShowHeader).toBeTrue();
    expect(mockDocument.body.classList.add).toHaveBeenCalledWith('has-header');
  });

  it('should respond to navigation events', () => {
    component.ngOnInit();
    
    // Simulate navigation to a page that should show header
    const navigationEvent = new NavigationEnd(1, '/profile', '/profile');
    routerEventsSubject.next(navigationEvent);
    
    expect(component.shouldShowHeader).toBeTrue();
    expect(mockDocument.body.classList.add).toHaveBeenCalledWith('has-header');
  });

  it('should respond to navigation events for hidden header routes', () => {
    component.ngOnInit();
    
    // Simulate navigation to landing page
    const navigationEvent = new NavigationEnd(1, '/landing', '/landing');
    routerEventsSubject.next(navigationEvent);
    
    expect(component.shouldShowHeader).toBeFalse();
    expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('has-header');
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

