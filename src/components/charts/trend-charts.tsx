"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import type { ChartDataPoint } from "@/lib/chart-data";

export type { ChartDataPoint };

export function MoodTrendChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) return null;

  return (
    <div
      role="img"
      aria-label="Line chart showing mood, anxiety, and confidence trends over time"
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-violet-100" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="mood" stroke="#7c3aed" strokeWidth={2} name="Mood" dot={{ r: 3 }} />
          <Line type="monotone" dataKey="anxiety" stroke="#ef4444" strokeWidth={2} name="Anxiety" dot={{ r: 3 }} />
          <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} name="Confidence" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WellnessScoreChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) return null;

  return (
    <div
      role="img"
      aria-label="Area chart showing wellness score and stress predictor over time"
    >
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-violet-100" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="wellnessScore"
            stroke="#7c3aed"
            fill="#7c3aed"
            fillOpacity={0.15}
            name="Wellness Score"
          />
          <Area
            type="monotone"
            dataKey="stressPredictor"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.1}
            name="Stress Predictor"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SleepStudyChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) return null;

  return (
    <div
      role="img"
      aria-label="Line chart showing sleep and study hours over time"
    >
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-violet-100" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2} name="Sleep (hrs)" dot={{ r: 3 }} />
          <Line type="monotone" dataKey="study" stroke="#8b5cf6" strokeWidth={2} name="Study (hrs)" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
