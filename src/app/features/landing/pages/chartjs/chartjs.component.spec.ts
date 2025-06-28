import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ChartjsComponent } from './chartjs.component';
import { DashboardService } from '../../../../core/services/dashboard.service';

describe('ChartjsComponent', () => {
  let component: ChartjsComponent;
  let fixture: ComponentFixture<ChartjsComponent>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;

  beforeEach(async () => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', [
      'getTotals', 'getPostsOverTime', 'getUsersOverTime', 'getTopTags',
      'getPostsByCategory', 'getMostLiked'
    ]);

    await TestBed.configureTestingModule({
      imports: [ChartjsComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChartjsComponent);
    component = fixture.componentInstance;
    mockDashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    
    // Mock all service methods to return empty data
    mockDashboardService.getTotals.and.returnValue(of({
      total_posts: 10,
      total_users: 5,
      total_likes: 20,
      total_comments: 15
    }));
    mockDashboardService.getPostsOverTime.and.returnValue(of({ labels: [], counts: [] }));
    mockDashboardService.getUsersOverTime.and.returnValue(of({ labels: [], counts: [] }));
    mockDashboardService.getTopTags.and.returnValue(of([]));
    mockDashboardService.getPostsByCategory.and.returnValue(of([]));
    mockDashboardService.getMostLiked.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default selected range', () => {
    expect(component.selectedRange).toBe('all');
  });

  it('should load all charts on init', () => {
    spyOn(component, 'loadAllCharts');
    
    component.ngOnInit();
    
    expect(component.loadAllCharts).toHaveBeenCalledWith('all');
  });

  it('should load chart data from dashboard service', () => {
    component.loadAllCharts('7d');
    
    expect(mockDashboardService.getTotals).toHaveBeenCalled();
    expect(mockDashboardService.getPostsOverTime).toHaveBeenCalledWith('7d');
    expect(mockDashboardService.getUsersOverTime).toHaveBeenCalledWith('7d');
    expect(mockDashboardService.getTopTags).toHaveBeenCalled();
    expect(mockDashboardService.getPostsByCategory).toHaveBeenCalled();
    expect(mockDashboardService.getMostLiked).toHaveBeenCalled();
  });

  it('should handle range change', () => {
    spyOn(component, 'loadAllCharts');
    const mockEvent = {
      target: { value: '30d' }
    } as any;
    
    component.onRangeChange(mockEvent);
    
    expect(component.loadAllCharts).toHaveBeenCalledWith('30d');
  });

  it('should destroy charts on component destroy', () => {
    // Mock chart instances
    component['postsChart'] = { destroy: jasmine.createSpy('destroy') } as any;
    component['usersChart'] = { destroy: jasmine.createSpy('destroy') } as any;
    
    component.ngOnDestroy();
    
    expect(component['postsChart'].destroy).toHaveBeenCalled();
    expect(component['usersChart'].destroy).toHaveBeenCalled();
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});

