import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { week: "W1", volume: 1200 },
  { week: "W2", volume: 1600 },
  { week: "W3", volume: 2100 },
];

export function AdvancedProgress() {
  return (
    <div>
      <h3>Progressão de Volume</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="week" />
          <Tooltip />
          <Line dataKey="volume" stroke="#0A84FF" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
