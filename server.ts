import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

interface HabitInput {
  id: string;
  title: string;
  category: string;
  trackingType: 'boolean' | 'numeric';
  targetValue: number;
  unit: string;
  scheduleDays: number[];
}

interface LogInput {
  habitId: string;
  dateKey: string;
  value: number;
  completed: boolean;
}

interface WeekDayInput {
  dateKey: string;
  weekdayShort: string;
}

interface WeeklySummaryRequestBody {
  todayKey: string;
  weekDays: WeekDayInput[];
  habits: HabitInput[];
  logs: LogInput[];
  currentStreak: number;
}

const PORT = 3000;

function parseDateKeyLocal(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delayMs = 350 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.post('/api/weekly-summary', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as Partial<WeeklySummaryRequestBody> | undefined;
    if (
      !body ||
      typeof body.todayKey !== 'string' ||
      !Array.isArray(body.weekDays) ||
      !Array.isArray(body.habits) ||
      !Array.isArray(body.logs)
    ) {
      res.status(400).json({ error: 'Invalid weekly summary payload.' });
      return;
    }

    const habitsList = body.habits.slice(0, 40);
    const weekDaysList = body.weekDays.slice(0, 7);
    const todayKey = body.todayKey;

    const logMap = new Map<string, LogInput>();
    for (const log of body.logs) {
      if (log && typeof log.habitId === 'string' && typeof log.dateKey === 'string') {
        logMap.set(`${log.habitId}_${log.dateKey}`, log);
      }
    }

    let totalScheduled = 0;
    let totalCompleted = 0;
    const perHabitStats: Array<{
      title: string;
      category: string;
      scheduledDays: number;
      completedDays: number;
      trackingType: string;
      target: string;
    }> = [];

    for (const habit of habitsList) {
      let scheduledDays = 0;
      let completedDays = 0;

      for (const day of weekDaysList) {
        const weekday = parseDateKeyLocal(day.dateKey).getDay();
        if (Array.isArray(habit.scheduleDays) && habit.scheduleDays.includes(weekday)) {
          scheduledDays += 1;
          totalScheduled += 1;
          const entry = logMap.get(`${habit.id}_${day.dateKey}`);
          if (entry?.completed) {
            completedDays += 1;
            totalCompleted += 1;
          }
        }
      }

      if (scheduledDays > 0) {
        perHabitStats.push({
          title: String(habit.title).slice(0, 80),
          category: String(habit.category),
          scheduledDays,
          completedDays,
          trackingType: habit.trackingType,
          target:
            habit.trackingType === 'numeric'
              ? `${habit.targetValue} ${habit.unit || 'units'}`.trim()
              : 'check-off',
        });
      }
    }

    const completionRate =
      totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

    if (totalScheduled === 0) {
      res.status(400).json({
        error: 'No habits are scheduled during this 7-day period yet.',
      });
      return;
    }

    const dailyBreakdown = weekDaysList.map((day) => {
      const weekday = parseDateKeyLocal(day.dateKey).getDay();
      let scheduled = 0;
      let completed = 0;
      for (const habit of habitsList) {
        if (Array.isArray(habit.scheduleDays) && habit.scheduleDays.includes(weekday)) {
          scheduled += 1;
          if (logMap.get(`${habit.id}_${day.dateKey}`)?.completed) {
            completed += 1;
          }
        }
      }
      return {
        date: day.dateKey,
        day: day.weekdayShort,
        completed,
        scheduled,
      };
    });

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const summaryPrompt = JSON.stringify({
      period: `${weekDaysList[0]?.dateKey ?? ''} to ${todayKey}`,
      overallCompletionRatePercent: completionRate,
      totalCompleted,
      totalScheduled,
      currentStreakDays: Number(body.currentStreak) || 0,
      habits: perHabitStats,
      dailyBreakdown,
    });

    try {
      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Analyze this 7-day habit log summary and produce the user's weekly overview:\n${summaryPrompt}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'You are a concise, motivating habit tracker assistant inside Daymark. Produce two short plain-text fields from the exact statistics provided: (1) headline: one crisp sentence under 14 words stating their weekly percentage (for example, "You hit 85% of your goals this week!"), and (2) insight: one brief sentence under 24 words naming a standout habit, streak, or practical focus from the data. Never invent metrics that conflict with the numbers provided.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: {
                  type: Type.STRING,
                  description: 'Short weekly summary sentence with exact completion percentage.',
                },
                insight: {
                  type: Type.STRING,
                  description: 'One-sentence observation grounded in the habit breakdown.',
                },
              },
              required: ['headline', 'insight'],
            },
          },
        })
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
        return;
      }

      const parsed = JSON.parse(rawText) as { headline?: string; insight?: string };
      if (!parsed.headline || !parsed.insight) {
        res.status(502).json({ error: 'Unable to parse weekly summary response.' });
        return;
      }

      res.json({
        headline: parsed.headline,
        insight: parsed.insight,
        completionRate,
        totalCompleted,
        totalScheduled,
      });
    } catch (error) {
      console.error('Gemini weekly summary error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate weekly summary.';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daymark server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
