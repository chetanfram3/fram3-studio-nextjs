import { useTheme, alpha } from '@mui/material';
import type { ChartOptions } from 'chart.js';

export function useChartConfig() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const chartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        angleLines: {
          color: '#FF0000'
        },
        grid: {
          color: '#FF0000'
        },
        pointLabels: {
          font: {
            size: 12,
            family: theme.typography.fontFamily
          },
          color: theme.palette.text.primary
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 10,
            family: theme.typography.fontFamily
          },
          color: theme.palette.secondary.contrastText
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            family: theme.typography.fontFamily
          },
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          family: theme.typography.fontFamily,
          weight: 600
        },
        bodyFont: {
          size: 12,
          family: theme.typography.fontFamily
        },
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.r;
            return `${label}: ${value} occurrences`;
          }
        }
      }
    }
  };

  return {
    options: chartOptions,
    colors: {
      fill: isDarkMode ? alpha('#0A74DA', 0.1) : 'rgba(255, 223, 0, 0.1)',
      border: isDarkMode ? '#0A74DA' : theme.palette.secondary.dark
    }
  };
}