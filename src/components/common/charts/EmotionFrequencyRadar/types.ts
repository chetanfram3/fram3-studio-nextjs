export interface EmotionFrequency {
  emotion: string;
  frequency: number;
}

export interface RadarChartConfig {
  scales: {
    min: number;
    max: number;
    stepSize: number;
  };
  colors: {
    fill: string;
    border: string;
  };
  legend: {
    position: 'top' | 'bottom' | 'left' | 'right';
  };
}