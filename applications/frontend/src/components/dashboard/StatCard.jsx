import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ mb: 1, fontWeight: 600 }}>
              {value}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trend === 'up' && <TrendingUpIcon color="success" fontSize="small" />}
                {trend === 'down' && <TrendingDownIcon color="error" fontSize="small" />}
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              color: `${color}.main`,
              backgroundColor: `${color}.lighter`,
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
