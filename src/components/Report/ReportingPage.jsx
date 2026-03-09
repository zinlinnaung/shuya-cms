import React, { useState, useEffect, useCallback } from "react";
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
  Divider,
  Tooltip as MuiTooltip,
  Avatar,
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
  FilterList,
  TrendingUp,
  PeopleAltOutlined,
  CalendarToday,
  Equalizer,
  InsertChartOutlined,
  FavoriteBorder,
  ChromeReaderModeOutlined,
  ArrowUpward,
  DescriptionOutlined,
  TableChartOutlined,
  RefreshOutlined,
} from "@mui/icons-material";

// Global Theme Colors
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
          {trend && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ArrowUpward sx={{ fontSize: 14, color: "#10b981" }} />
              <Typography
                variant="caption"
                sx={{ color: "#10b981", fontWeight: 700 }}
              >
                {trend}%{" "}
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                  vs last month
                </span>
              </Typography>
            </Stack>
          )}
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

const ChartCard = ({ title, children, height = 350 }) => (
  <Card
    sx={{
      borderRadius: 4,
      p: 2,
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      border: "1px solid #f1f5f9",
    }}
  >
    <Typography variant="subtitle1" fontWeight={700} mb={3} color="#1e293b">
      {title}
    </Typography>
    <Box sx={{ width: "100%", height }}>{children}</Box>
  </Card>
);

// --- Main Page Component ---

const ReportingPage = () => {
  const [fromDate, setFromDate] = useState(
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  );
  const [toDate, setToDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [loading, setLoading] = useState(false);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        from: fromDate,
        to: toDate,
        ...(statusFilter !== "All" && { status: statusFilter }),
        ...(planFilter !== "All" && { plan: planFilter }),
      };

      const [stats, growth, status, plans, cycles, blogs, channels, ages] =
        await Promise.all([
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/stats", {
            params,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/user-growth", {
            params,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/user-status", {
            params,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/family-plan", {
            params,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/cycle-data", {
            params,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/top-blogs", {
            params,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/channels"),
          axios.get(
            "https://shuyaapi.tharapa.ai/api/dashboard/age-segmentation",
            { params },
          ),
        ]);

      setData({
        stats: [
          {
            name: "Total Users",
            value: stats.data.totalUsers || 0,
            icon: <PeopleAltOutlined />,
            color: "#6366f1",
          },
          {
            name: "Active Users",
            value: stats.data.activeUsers || 0,
            icon: <TrendingUp />,
            color: "#10b981",
          },
          {
            name: "Avg Cycle",
            value: `${stats.data.avgCycleLength || 0}d`,
            icon: <CalendarToday />,
            color: "#f59e0b",
          },
          {
            name: "Avg Period",
            value: `${stats.data.avgPeriodLength || 0}d`,
            icon: <InsertChartOutlined />,
            color: "#ef4444",
          },
          {
            name: "Total Blogs",
            value: stats.data.totalBlogs || 0,
            icon: <ChromeReaderModeOutlined />,
            color: "#8b5cf6",
          },
          {
            name: "Reactions",
            value: stats.data.totalReactions || 0,
            icon: <FavoriteBorder />,
            color: "#ec4899",
          },
        ],
        growth: growth.data,
        status: status.data,
        plans: plans.data,
        cycles: cycles.data,
        blogs: blogs.data,
        channels: channels.data,
        ageGroups: ages.data,
      });
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, statusFilter, planFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Export Handlers ---

  const exportCSV = () => {
    const csvRows = data.stats.map((s) => ({ Metric: s.name, Value: s.value }));
    const worksheet = XLSX.utils.json_to_sheet(csvRows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Report_${dayjs().format("YYYY-MM-DD")}.csv`);
    link.click();
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsStats = XLSX.utils.json_to_sheet(
      data.stats.map((s) => ({ Metric: s.name, Value: s.value })),
    );
    XLSX.utils.book_append_sheet(wb, wsStats, "Summary");
    const wsGrowth = XLSX.utils.json_to_sheet(data.growth);
    XLSX.utils.book_append_sheet(wb, wsGrowth, "Growth Data");
    XLSX.writeFile(wb, `Shuya_Analytics_${dayjs().format("YYYY-MM-DD")}.xlsx`);
  };

  const exportPDF = () => {
    const input = document.getElementById("report-area");
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.text("Shuya Analytics Report", 10, 10);
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${dayjs().format("MMMM D, YYYY HH:mm")}`, 10, 16);
      pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);
      pdf.save(`Shuya_Report_${dayjs().format("YYYYMMDD")}.pdf`);
    });
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}
    >
      {/* 1. Page Header */}
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
            Track user metrics, content performance and platform health
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<DescriptionOutlined />}
            onClick={exportCSV}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChartOutlined />}
            color="success"
            onClick={exportExcel}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadOutlined />}
            onClick={exportPDF}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              bgcolor: "#1e293b",
              "&:hover": { bgcolor: "#0f172a" },
            }}
          >
            Export PDF
          </Button>
          <IconButton onClick={fetchData} sx={{ border: "1px solid #e2e8f0" }}>
            <RefreshOutlined />
          </IconButton>
        </Stack>
      </Stack>

      {/* 2. Filter Bar */}
      <Paper
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          border: "1px solid #e2e8f0",
        }}
      >
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
          <Grid item xs={12} md={2}>
            <TextField
              select
              size="small"
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="User Status"
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Single">Single</MenuItem>
              <MenuItem value="Married">Married</MenuItem>
              <MenuItem value="Pregnant">Pregnant</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              size="small"
              fullWidth
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              label="Family Plan"
            >
              <MenuItem value="All">All Plans</MenuItem>
              <MenuItem value="Conceiving">Conceiving</MenuItem>
              <MenuItem value="AvoidPregnant">Avoid Pregnancy</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  size="small"
                  variant="soft"
                  color="inherit"
                  onClick={() => {
                    setFromDate(
                      dayjs().subtract(days, "day").format("YYYY-MM-DD"),
                    );
                    setToDate(dayjs().format("YYYY-MM-DD"));
                  }}
                  sx={{ borderRadius: 2, bgcolor: "#f1f5f9", fontWeight: 600 }}
                >
                  Last {days}D
                </Button>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Report Content Area */}
      <div id="report-area">
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="40vh"
          >
            <CircularProgress thickness={5} size={50} />
          </Box>
        ) : (
          <>
            {/* Metric Cards Row */}
            <Grid container spacing={3} mb={4}>
              {data.stats.map((metric, i) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
                  <MetricCard {...metric} />
                </Grid>
              ))}
            </Grid>

            {/* Main Charts Row */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} lg={8}>
                <ChartCard title="User Acquisition Growth">
                  <ResponsiveContainer>
                    <AreaChart
                      data={data.growth}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorUser"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#6366f1"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#6366f1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorUser)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              <Grid item xs={12} lg={4}>
                <ChartCard title="Family Plan Adoption">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.plans}
                        dataKey="value"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        cornerRadius={4}
                      >
                        {data.plans.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: 20 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>

            {/* Secondary Charts Row */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Age Group Segmentation">
                  <ResponsiveContainer>
                    <BarChart data={data.ageGroups} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip cursor={{ fill: "transparent" }} />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        radius={[0, 4, 4, 0]}
                        barSize={25}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <ChartCard title="Channel Traffic Source">
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {data.channels.map((ch, idx) => (
                      <Grid item xs={6} key={idx}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid #f1f5f9",
                            bgcolor: "#fff",
                          }}
                        >
                          <Typography variant="caption" color="textSecondary">
                            {ch.name}
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {ch.clickCount || 0}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </ChartCard>
              </Grid>
            </Grid>

            {/* Top Content Row */}
            <Card sx={{ borderRadius: 4, p: 3, border: "1px solid #f1f5f9" }}>
              <Typography variant="h6" fontWeight={700} mb={3}>
                🏆 Most Engaged Content
              </Typography>
              <Grid container spacing={2}>
                {data.blogs.map((blog, i) => (
                  <Grid item xs={12} key={i}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      p={2}
                      sx={{
                        bgcolor: "#f8fafc",
                        borderRadius: 3,
                        "&:hover": { bgcolor: "#f1f5f9" },
                        transition: "0.2s",
                      }}
                    >
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Typography
                          variant="h6"
                          color="primary.main"
                          fontWeight={800}
                          sx={{ minWidth: 30 }}
                        >
                          0{i + 1}
                        </Typography>
                        <Box>
                          <Typography fontWeight={700} color="#334155">
                            {blog.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Community favorite article
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={`${blog.reactions} Reactions`}
                          size="small"
                          variant="soft"
                          color="secondary"
                          sx={{ fontWeight: 600 }}
                        />
                        <IconButton size="small">
                          <ChromeReaderModeOutlined fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </>
        )}
      </div>
    </Container>
  );
};

export default ReportingPage;
