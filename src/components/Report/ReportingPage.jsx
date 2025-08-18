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

// New distinct color palette for UX-friendly look
const COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"];
const LINE_COLOR = "#1f77b4"; // Line chart color
const BAR_COLOR = "#ff7f0e"; // Bar chart color
const EXPORT_CSV_COLOR = "#2ca02c"; // Export CSV button color
const EXPORT_EXCEL_COLOR = "#d62728"; // Export Excel button color
const EXPORT_PDF_COLOR = "#9467bd"; // Export PDF button color

const ReportingPage = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");

  const [reportData, setReportData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [userStatusData, setUserStatusData] = useState([]);
  const [familyPlanData, setFamilyPlanData] = useState([]);
  const [cycleData, setCycleData] = useState([]);
  const [topBlogs, setTopBlogs] = useState([]);
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
        { params: query }
      );
      setReportData([
        { name: "Total Users", value: statsRes.data.totalUsers },
        { name: "Active Users", value: statsRes.data.activeUsers },
        { name: "Average Cycle Length", value: statsRes.data.avgCycleLength },
        { name: "Average Period Length", value: statsRes.data.avgPeriodLength },
        { name: "Total Blogs", value: statsRes.data.totalBlogs },
        { name: "Total Reactions", value: statsRes.data.totalReactions },
      ]);

      const [growthRes, statusRes, planRes, cycleRes, blogsRes] =
        await Promise.all([
          axios.get("https://shuyaapi.tharapa.ai/api/dashboard/user-growth", {
            params: query,
          }),
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
        ]);

      setUserGrowthData(growthRes.data);
      setUserStatusData(statusRes.data);
      setFamilyPlanData(planRes.data);
      setCycleData(cycleRes.data);
      setTopBlogs(blogsRes.data);
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
      <Box textAlign="center" mt="5rem">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "#fff0f5",
        minHeight: "100vh",
        p: "1.5rem",
        maxWidth: "1400px",
        margin: "auto",
        fontSize: "0.9rem",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: "#d81b60",
          fontWeight: "bold",
          mb: "1.5rem",
          fontSize: "1.6rem",
        }}
      >
        Reports & Analytics
      </Typography>

      {/* Filters */}
      <Box
        display="flex"
        gap="1rem"
        mb="1.5rem"
        flexWrap="wrap"
        sx={{ fontSize: "0.85rem" }}
      >
        <TextField
          type="date"
          label="From"
          InputLabelProps={{ shrink: true }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <TextField
          type="date"
          label="To"
          InputLabelProps={{ shrink: true }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: "150px" }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Single">Single</MenuItem>
          <MenuItem value="Married">Married</MenuItem>
          <MenuItem value="Pregnant">Pregnant</MenuItem>
        </TextField>
        <TextField
          select
          label="Family Plan"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          sx={{ width: "180px" }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Conceiving">Conceiving</MenuItem>
          <MenuItem value="AvoidPregnant">Avoid Pregnant</MenuItem>
        </TextField>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb="2rem">
        {reportData.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card
              sx={{
                borderRadius: "16px",
                textAlign: "center",
                p: "1rem",
                minHeight: "100px",
              }}
            >
              <CardContent>
                <Typography
                  variant="body1"
                  sx={{ color: "#d81b60", fontSize: "1rem" }}
                >
                  {item.name}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", fontSize: "1.3rem" }}
                >
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* User Growth */}
        <Grid item xs={12} md={8} sx={{ width: "50%" }}>
          <Card sx={{ borderRadius: "16px", p: "1rem", height: "350px" }}>
            <Typography
              variant="subtitle1"
              sx={{ color: "#d81b60", mb: "0.8rem" }}
            >
              User Growth Over Time
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke={LINE_COLOR}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Users by Status */}
        <Grid item xs={12} md={4} sx={{ width: "30%" }}>
          <Card sx={{ borderRadius: "16px", p: "1rem", height: "350px" }}>
            <Typography
              variant="subtitle1"
              sx={{ color: "#d81b60", mb: "0.8rem" }}
            >
              Users by Status
            </Typography>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={userStatusData}
                  dataKey="value"
                  outerRadius={80}
                  label
                >
                  {userStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Cycles per Month */}
        <Grid item xs={12} md={8} sx={{ width: "50%" }}>
          <Card sx={{ borderRadius: "16px", p: "1rem", height: "350px" }}>
            <Typography
              variant="subtitle1"
              sx={{ color: "#d81b60", mb: "0.8rem" }}
            >
              Cycles Tracked per Month
            </Typography>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={cycleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cycles" fill={BAR_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Family Plan */}
        <Grid item xs={12} md={4} sx={{ width: "30%" }}>
          <Card sx={{ borderRadius: "16px", p: "1rem", height: "350px" }}>
            <Typography
              variant="subtitle1"
              sx={{ color: "#d81b60", mb: "0.8rem" }}
            >
              Users by Family Plan
            </Typography>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={familyPlanData}
                  dataKey="value"
                  outerRadius={80}
                  label
                >
                  {familyPlanData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Top Blogs */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: "16px", p: "1rem" }}>
            <Typography
              variant="subtitle1"
              sx={{ color: "#d81b60", mb: "0.8rem" }}
            >
              Top Liked Blogs
            </Typography>
            {topBlogs.map((blog, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: "0.5rem 0",
                  borderBottom: "1px solid #f8bbd0",
                }}
              >
                <Typography>{blog.title}</Typography>
                <Typography sx={{ color: "#d81b60", fontWeight: "bold" }}>
                  {blog.reactions} Reactions
                </Typography>
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>

      {/* Export Buttons */}
      <Box
        textAlign="right"
        mt="2rem"
        display="flex"
        justifyContent="flex-end"
        gap="1rem"
      >
        <Button
          variant="contained"
          onClick={exportToCSV}
          sx={{ backgroundColor: EXPORT_CSV_COLOR }}
        >
          Export CSV
        </Button>
        <Button
          variant="contained"
          onClick={exportToExcel}
          sx={{ backgroundColor: EXPORT_EXCEL_COLOR }}
        >
          Export Excel
        </Button>
        <Button
          variant="contained"
          onClick={exportToPDF}
          sx={{ backgroundColor: EXPORT_PDF_COLOR }}
        >
          Export PDF
        </Button>
      </Box>
    </Box>
  );
};

export default ReportingPage;
