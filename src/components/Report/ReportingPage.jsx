import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  LineChart,
  Line,
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
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Download,
  TrendingUp,
  People,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Article,
} from "@mui/icons-material";

// Color palette
const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#10b981",
];
const LINE_COLOR = "#6366f1";
const BAR_COLOR = "#10b981";

const ReportingPage = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");

  const [reportData, setReportData] = useState([]);
  // Changed from userGrowthData to ageSegmentationData
  const [ageSegmentationData, setAgeSegmentationData] = useState([]);
  const [userStatusData, setUserStatusData] = useState([]);
  const [familyPlanData, setFamilyPlanData] = useState([]);
  const [cycleData, setCycleData] = useState([]);
  const [topBlogs, setTopBlogs] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const query = {};
      if (fromDate) query.from = fromDate;
      if (toDate) query.to = toDate;
      if (statusFilter && statusFilter !== "All") query.status = statusFilter;
      if (planFilter && planFilter !== "All") query.plan = planFilter;

      const statsRes = await axios.get(
        "https://shuyaapi.tharapa.ai/api/dashboard/stats",
        { params: query },
      );
      setReportData([
        {
          name: "Total Users",
          value: statsRes.data.totalUsers,
          icon: <People />,
        },
        {
          name: "Active Users",
          value: statsRes.data.activeUsers,
          icon: <TrendingUp />,
        },
        {
          name: "Avg Cycle Length",
          value: statsRes.data.avgCycleLength,
          icon: <BarChartIcon />,
        },
        {
          name: "Avg Period Length",
          value: statsRes.data.avgPeriodLength,
          icon: <PieChartIcon />,
        },
        {
          name: "Total Blogs",
          value: statsRes.data.totalBlogs,
          icon: <Article />,
        },
        {
          name: "Total Reactions",
          value: statsRes.data.totalReactions,
          icon: "❤️",
        },
      ]);

      // Updated the first endpoint to age-segmentation
      const [ageRes, statusRes, planRes, cycleRes, blogsRes, channelsRes] =
        await Promise.all([
          axios.get(
            "https://shuyaapi.tharapa.ai/api/dashboard/age-segmentation",
            {
              params: query,
            },
          ),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/user-status", {
            params: query,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/family-plan", {
            params: query,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/cycle-data", {
            params: query,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/top-blogs", {
            params: query,
          }),
          axios.get("https://shuyaapi.tharapa.ai/api/channels"),
        ]);

      setAgeSegmentationData(ageRes.data); // Mapping the age range data
      setUserStatusData(statusRes.data);
      setFamilyPlanData(planRes.data);
      setCycleData(cycleRes.data);
      setTopBlogs(blogsRes.data);
      setChannels(channelsRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fromDate, toDate, statusFilter, planFilter]);

  const exportToCSV = () => {
    const headers = ["Metric,Value"];
    const rows = reportData.map((item) => `${item.name},${item.value}`);
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, "report.xlsx");
  };

  const exportToPDF = () => {
    const input = document.body;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("report.pdf");
    });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography
            variant="h4"
            sx={{ color: "#1a237e", fontWeight: "bold" }}
          >
            Analytics Dashboard
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToCSV}
              sx={{ borderColor: "#6366f1", color: "#6366f1" }}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToExcel}
              sx={{ borderColor: "#10b981", color: "#10b981" }}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToPDF}
              sx={{ borderColor: "#ef4444", color: "#ef4444" }}
            >
              PDF
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                label="From Date"
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                label="To Date"
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="User Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Single">Single</MenuItem>
                <MenuItem value="Married">Married</MenuItem>
                <MenuItem value="Pregnant">Pregnant</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Family Plan"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="All">All Plans</MenuItem>
                <MenuItem value="Conceiving">Conceiving</MenuItem>
                <MenuItem value="AvoidPregnant">Avoid Pregnancy</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={5} sx={{ mb: 4 }}>
        {reportData.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card
              sx={{
                textAlign: "center",
                p: 2,
                background: `linear-gradient(135deg, ${COLORS[index]}, ${COLORS[index]}20)`,
                color: "white",
              }}
            >
              <CardContent sx={{ p: "16px !important" }}>
                <Box sx={{ fontSize: "2rem", mb: 1 }}>{item.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {item.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Channel Metrics */}
      {channels.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, color: "#374151" }}>
            Channel Performance
          </Typography>
          <Grid container spacing={2}>
            {channels.map((channel, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <Box
                  sx={{
                    textAlign: "center",
                    p: 2,
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
                    {channel.name}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      color: COLORS[index % COLORS.length],
                    }}
                  >
                    {channel.clickCount ?? 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                    Clicks
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* MODIFIED: Age Segmentation Chart (Replaces User Growth) */}
        {/* Age Segmentation Chart */}
        <Grid item xs={12} lg={10} sx={{ width: "50%" }}>
          <Card sx={{ p: 2, height: "400px" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
              Age Segmentation
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={ageSegmentationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                {/* Changed dataKey to "name" to match your JSON */}
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  /* Changed dataKey to "value" to match your JSON */
                  dataKey="value"
                  fill={COLORS[0]}
                  radius={[4, 4, 0, 0]}
                  name="Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* User Status Distribution */}
        <Grid item xs={12} lg={4} sx={{ width: "30%" }}>
          <Card sx={{ p: 2, height: "400px" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
              User Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={userStatusData}
                  dataKey="value"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {userStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Cycle Tracking */}
        <Grid item xs={12} lg={8} sx={{ width: "50%" }}>
          <Card sx={{ p: 2, height: "400px" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
              Cycles Tracked per Month
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={cycleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cycles" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Family Plan Distribution */}
        <Grid item xs={12} lg={4} sx={{ width: "30%" }}>
          <Card sx={{ p: 2, height: "400px" }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#374151" }}>
              Family Plan Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={familyPlanData}
                  dataKey="value"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {familyPlanData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[(index + 2) % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Top Blogs */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: "#374151" }}>
              Top Performing Blogs
            </Typography>
            <Grid container spacing={2}>
              {topBlogs.map((blog, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Paper sx={{ p: 2, border: "1px solid #e5e7eb" }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", mb: 1 }}
                    >
                      {blog.title}
                    </Typography>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Chip
                        label={`${blog.reactions} Reactions`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        #{index + 1}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportingPage;
