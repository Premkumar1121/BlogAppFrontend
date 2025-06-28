import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EchartsComponent } from './echarts.component';
import { DashboardService } from '../../../../core/services/dashboard.service';

describe('EchartsComponent', () => {
  let component: EchartsComponent;
  let fixture: ComponentFixture<EchartsComponent>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;

  beforeEach(async () => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', [
      'getTotals', 'getPostsOverTime', 'getUsersOverTime', 'getTopTags',
      'getPostsByCategory', 'getMostLiked'
    ]);

    await TestBed.configureTestingModule({
      imports: [EchartsComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EchartsComponent);
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

  it('should initialize with default ranges', () => {
    expect(component.selectedPostsRange).toBe('all');
    expect(component.selectedUsersRange).toBe('all');
  });

  it('should load all echarts on init', () => {
    spyOn(component, 'loadAllECharts');
    
    component.ngOnInit();
    
    expect(component.loadAllECharts).toHaveBeenCalled();
  });

  it('should load chart data from dashboard service', () => {
    component.loadAllECharts();
    
    expect(mockDashboardService.getTotals).toHaveBeenCalled();
    expect(mockDashboardService.getTopTags).toHaveBeenCalled();
    expect(mockDashboardService.getPostsByCategory).toHaveBeenCalled();
    expect(mockDashboardService.getMostLiked).toHaveBeenCalled();
  });

  it('should handle posts range change', () => {
    spyOn(component, 'loadPostsChart');
    const mockEvent = {
      target: { value: '30d' }
    } as any;
    
    component.onPostsRangeChange(mockEvent);
    
    expect(component.selectedPostsRange).toBe('30d');
    expect(component.loadPostsChart).toHaveBeenCalled();
  });

  it('should handle users range change', () => {
    spyOn(component, 'loadUsersChart');
    const mockEvent = {
      target: { value: '7d' }
    } as any;
    
    component.onUsersRangeChange(mockEvent);
    
    expect(component.selectedUsersRange).toBe('7d');
    expect(component.loadUsersChart).toHaveBeenCalled();
  });

  it('should load posts chart with selected range', () => {
    component.selectedPostsRange = '30d';
    
    component.loadPostsChart();
    
    expect(mockDashboardService.getPostsOverTime).toHaveBeenCalledWith('30d');
  });

  it('should load users chart with selected range', () => {
    component.selectedUsersRange = '7d';
    
    component.loadUsersChart();
    
    expect(mockDashboardService.getUsersOverTime).toHaveBeenCalledWith('7d');
  });

  it('should update totals when data is loaded', () => {
    const mockTotals = {
      total_posts: 25,
      total_users: 10,
      total_likes: 50,
      total_comments: 30
    };
    mockDashboardService.getTotals.and.returnValue(of(mockTotals));
    
    component.loadAllECharts();
    
    expect(component.totals).toEqual(mockTotals);
  });
});

