import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LandingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change chart visibility', () => {
    component.changeChart('highchart');
    expect(component.visible).toEqual('highchart');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with echart as default visible chart', () => {
    expect(component.visible).toBe('echart');
  });

  it('should change chart visibility', () => {
    component.changeChart('highchart');
    expect(component.visible).toBe('highchart');
    
    component.changeChart('chartjs');
    expect(component.visible).toBe('chartjs');
  });

  it('should log chart change value', () => {
    spyOn(console, 'log');
    
    component.changeChart('test-chart');
    
    expect(console.log).toHaveBeenCalledWith('test-chart');
  });
});

