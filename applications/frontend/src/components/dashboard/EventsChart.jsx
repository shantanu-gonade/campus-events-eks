import {
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const EventsChart = ({ data }) => {
  return (
    <Card elevation={2}>
      <CardHeader title="Events Over Time" />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="events"
              stroke="#1976d2"
              strokeWidth={2}
              name="Events Created"
            />
            <Line
              type="monotone"
              dataKey="rsvps"
              stroke="#2e7d32"
              strokeWidth={2}
              name="Total RSVPs"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EventsChart;
