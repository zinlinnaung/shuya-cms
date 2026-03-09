import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Paper,
  Chip,
  Container,
  Stack,
  IconButton,
  Avatar,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import dayjs from "dayjs";

// Icons
import {
  FileDownloadOutlined,
  TrendingUp,
  PeopleAltOutlined,
  CalendarToday,
  InsertChartOutlined,
  FavoriteBorder,
  ChromeReaderModeOutlined,
  ArrowUpward,
  DescriptionOutlined,
  TableChartOutlined,
  RefreshOutlined,
  ErrorOutline,
} from "@mui/icons-material";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

// --- Sub-Components ---
const MetricCard = ({ title, value, icon, color, trend }) => (
  <Card
    sx={{
      borderRadius: 3,
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      border: "1px solid #f0f0f0",
      height: "100%",
    }}
  >
    <CardContent>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            variant="caption"
            color="textSecondary"
            fontWeight={600}
            sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>
            {value}
          </Typography>
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}15`,
            color: color,
            borderRadius: 2,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children, height = 350, loading }) => (
  <Card
    sx={{
      borderRadius: 4,
      p: 2,
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      border: "1px solid #f1f5f9",
      position: "relative",
    }}
  >
    <Typography variant="subtitle1" fontWeight={700} mb={3} color="#1e293b">
      {title}
    </Typography>
    <Box
      sx={{
        width: "100%",
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {loading ? <CircularProgress size={30} /> : children}
    </Box>
  </Card>
);

const ReportingPage = () => {
  const [fromDate, setFromDate] = useState(
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  );
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [data, setData] = useState({
    stats: [],
    growth: [],
    status: [],
    plans: [],
    cycles: [],
    blogs: [],
    channels: [],
    ageGroups: [],
  });

  const abortController = useRef(null);

  const fetchData = useCallback(async () => {
    // Cancel any ongoing requests if filters change rapidly
    if (abortController.current) abortController.current.abort();
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);

    const params = {
      from: fromDate,
      to: toDate,
      ...(statusFilter !== "All" && { status: statusFilter }),
      ...(planFilter !== "All" && { plan: planFilter }),
    };

    const API_BASE = "https://shuyaapi.tharapa.ai/api";

    try {
      // 1. Fetch Core Stats First (Fastest)
      const statsRes = await axios.get(`${API_BASE}/dashboard/stats`, {
        params,
        signal: abortController.current.signal,
      });

      const coreStats = [
        {
          name: "Total Users",
          value: statsRes.data.totalUsers || 0,
          icon: <PeopleAltOutlined />,
          color: "#6366f1",
        },
        {
          name: "Active Users",
          value: statsRes.data.activeUsers || 0,
          icon: <TrendingUp />,
          color: "#10b981",
        },
        {
          name: "Avg Cycle",
          value: `${statsRes.data.avgCycleLength || 0}d`,
          icon: <CalendarToday />,
          color: "#f59e0b",
        },
        {
          name: "Avg Period",
          value: `${statsRes.data.avgPeriodLength || 0}d`,
          icon: <InsertChartOutlined />,
          color: "#ef4444",
        },
        {
          name: "Total Blogs",
          value: statsRes.data.totalBlogs || 0,
          icon: <ChromeReaderModeOutlined />,
          color: "#8b5cf6",
        },
        {
          name: "Reactions",
          value: statsRes.data.totalReactions || 0,
          icon: <FavoriteBorder />,
          color: "#ec4899",
        },
      ];

      setData((prev) => ({ ...prev, stats: coreStats }));

      // 2. Staggered Loading for heavy charts to prevent 504 Gateway Timeout
      const [growth, status, plans, ages, blogs, channels] = await Promise.all([
        axios
          .get(`${API_BASE}/dashboard/user-growth`, { params })
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE}/dashboard/user-status`, { params })
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE}/dashboard/family-plan`, { params })
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE}/dashboard/age-segmentation`, { params })
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE}/dashboard/top-blogs`, { params })
          .catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/channels`).catch(() => ({ data: [] })),
      ]);

      setData({
        stats: coreStats,
        growth: growth.data,
        status: status.data,
        plans: plans.data,
        ageGroups: ages.data,
        blogs: blogs.data,
        channels: channels.data,
      });
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(
          "Server is taking too long to respond. Please try a shorter date range.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, statusFilter, planFilter]);

  useEffect(() => {
    fetchData();
    return () => abortController.current?.abort();
  }, [fetchData]);

  // Export Logic
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsStats = XLSX.utils.json_to_sheet(
      data.stats.map((s) => ({ Metric: s.name, Value: s.value })),
    );
    XLSX.utils.book_append_sheet(wb, wsStats, "Summary");
    XLSX.writeFile(wb, `Shuya_Analytics_${dayjs().format("YYYY-MM-DD")}.xlsx`);
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        mb={4}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            Reporting Hub
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Track real-time platform metrics
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<TableChartOutlined />}
            onClick={exportExcel}
          >
            Excel
          </Button>
          <IconButton onClick={fetchData} sx={{ border: "1px solid #e2e8f0" }}>
            <RefreshOutlined />
          </IconButton>
        </Stack>
      </Stack>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 3, border: "1px solid #e2e8f0" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1}>
              <TextField
                type="date"
                size="small"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                label="Start"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                type="date"
                size="small"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                label="End"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1}>
              <TextField
                select
                size="small"
                fullWidth
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Single">Single</MenuItem>
                <MenuItem value="Married">Married</MenuItem>
                <MenuItem value="Pregnant">Pregnant</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                fullWidth
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                label="Plan"
              >
                <MenuItem value="All">All Plans</MenuItem>
                <MenuItem value="Conceiving">Conceiving</MenuItem>
                <MenuItem value="AvoidPregnant">Avoid Pregnancy</MenuItem>
              </TextField>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert
          severity="error"
          icon={<ErrorOutline />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      <div id="report-area">
        <Grid container spacing={3} mb={4}>
          {data.stats.map((metric, i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <MetricCard {...metric} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} lg={8}>
            <ChartCard title="User Acquisition Growth" loading={loading}>
              <ResponsiveContainer>
                <AreaChart data={data.growth}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={0.1}
                    fill="#6366f1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
          <Grid item xs={12} lg={4}>
            <ChartCard title="Family Plan Adoption" loading={loading}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.plans}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                  >
                    {data.plans.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>
      </div>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReportingPage;
