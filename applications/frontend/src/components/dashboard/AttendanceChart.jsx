import { Paper, Typography, Box } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const AttendanceChart = ({ data = [] }) => {
  // Define colors for different attendance rates
  const getColorByRate = (rate) => {
    if (rate >= 90) return '#4caf50'; // Green - High
    if (rate >= 70) return '#2196f3'; // Blue - Good
    if (rate >= 50) return '#ff9800'; // Orange - Medium
    return '#f44336'; // Red - Low
  };

  // Prepare data with colors
  const chartData = data.map(item => ({
    ...item,
    color: getColorByRate(item.attendance_rate),
  }));

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Attendance by Event
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current attendance vs. maximum capacity
      </Typography>

      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="title"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              label={{
                value: 'Attendance (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: 8,
              }}
              formatter={(value, name) => {
                if (name === 'attendance_rate') return [`${value}%`, 'Attendance Rate'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="attendance_rate"
              name="Attendance Rate"
              fill="#8884d8"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Legend explanation */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: 1 }} />
          <Typography variant="caption">90%+ Full</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#2196f3', borderRadius: 1 }} />
          <Typography variant="caption">70-89% Full</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: 1 }} />
          <Typography variant="caption">50-69% Full</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#f44336', borderRadius: 1 }} />
          <Typography variant="caption">Below 50%</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default AttendanceChart;
