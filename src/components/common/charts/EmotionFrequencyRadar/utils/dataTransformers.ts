import { EmotionFrequency } from '../types';
import type { Scene } from "@/types/overview/emotionTypes";;

export function extractEmotionFrequencies(scenes: Scene[]): EmotionFrequency[] {
  const emotionCounts = new Map<string, number>();

  scenes.forEach((scene) => {
    scene.lines.forEach((line) => {
      const sentiment = line.sentimentAnalysis?.sentiment;
      if (sentiment) {
        const count = emotionCounts.get(sentiment) || 0;
        emotionCounts.set(sentiment, count + 1);
      }
    });
  });

  return Array.from(emotionCounts.entries())
    .map(([emotion, frequency]) => ({ emotion, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
}

export function prepareChartData(
  frequencies: EmotionFrequency[],
  colors: { fill: string; border: string }
) {
  return {
    labels: frequencies.map((f) => f.emotion),
    datasets: [
      {
        label: 'Emotion Frequency',
        data: frequencies.map((f) => f.frequency),
        fill: true,
        backgroundColor: colors.fill,
        borderColor: colors.border,
        borderWidth: 2,
        pointBackgroundColor: colors.border,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: colors.border,
      },
    ],
  };
}