import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Button,
  Divider,
  useTheme,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

// Icons
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import FavoriteIcon from "@mui/icons-material/Favorite";
import TimerIcon from "@mui/icons-material/Timer";
import EventNoteIcon from "@mui/icons-material/EventNote";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];

const Dashboard = () => {
  const [summary, setSummary] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [familyPlan, setFamilyPlan] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date States
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "month"));
  const [endDate, setEndDate] = useState(dayjs());

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const from = startDate.format("YYYY-MM-DD");
    const to = endDate.format("YYYY-MM-DD");

    try {
      // 1. Fetch Stats (Summary 6 cards)
      const statsRes = await fetch(
        `https://shuyaapi.tharapa.ai/api/dashboard/stats?from=${from}&to=${to}`,
      );
      const s = await statsRes.json();

      setSummary([
        {
          title: "Total Users",
          value: s.totalUsers,
          icon: <PeopleIcon />,
          color: "#6366F1",
        },
        {
          title: "Active Users",
          value: s.activeUsers,
          icon: <SignalCellularAltIcon />,
          color: "#10B981",
        },
        {
          title: "Avg Cycle",
          value: `${s.avgCycleLength} Days`,
          icon: <TimerIcon />,
          color: "#F59E0B",
        },
        {
          title: "Avg Period",
          value: `${s.avgPeriodLength} Days`,
          icon: <EventNoteIcon />,
          color: "#EC4899",
        },
        {
          title: "Total Blogs",
          value: s.totalBlogs,
          icon: <ArticleIcon />,
          color: "#8B5CF6",
        },
        {
          title: "Reactions",
          value: s.totalReactions,
          icon: <FavoriteIcon />,
          color: "#EF4444",
        },
      ]);

      // 2. Fetch Age Segmentation (New Endpoint)
      const ageRes = await fetch(
        `https://shuyaapi.tharapa.ai/api/dashboard/age-segmentation?from=${from}&to=${to}`,
      );
      setAgeData(await ageRes.json());

      // 3. Fetch Family Plan
      const familyRes = await fetch(
        `https://shuyaapi.tharapa.ai/api/dashboard/family-plan?from=${from}&to=${to}`,
      );
      setFamilyPlan(await familyRes.json());
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={4} sx={{ backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
        {/* Header & Filter */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems="center"
          mb={4}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} color="textPrimary">
              Analytics Overview
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Monitor your platform performance and user demographics
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={2}
            sx={{ p: 1, bgcolor: "white", borderRadius: 2, boxShadow: 1 }}
          >
            <DatePicker
              label="From"
              value={startDate}
              onChange={(val) => setStartDate(val)}
              slotProps={{ textField: { size: "small" } }}
            />
            <DatePicker
              label="To"
              value={endDate}
              onChange={(val) => setEndDate(val)}
              slotProps={{ textField: { size: "small" } }}
            />
          </Stack>
        </Stack>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="50vh"
          >
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} mb={4}>
              {summary.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                  <Card
                    sx={{
                      borderRadius: 4,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            display: "flex",
                            bgcolor: `${item.color}15`,
                            color: item.color,
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            fontWeight={600}
                          >
                            {item.title}
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {item.value}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
              {/* Age Segmentation Bar Chart */}
              <Grid item xs={12} md={7}>
                <Card
                  sx={{
                    borderRadius: 4,
                    p: 2,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="h6" fontWeight={700} mb={3} px={2}>
                    Age Segmentation
                  </Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={ageData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#F3F4F6"
                      />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "#F9FAFB" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#6366F1"
                        radius={[6, 6, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>

              {/* Family Plan Pie Chart */}
              <Grid item xs={12} md={5}>
                <Card
                  sx={{
                    borderRadius: 4,
                    p: 2,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="h6" fontWeight={700} mb={3} px={2}>
                    Family Plan Usage
                  </Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={familyPlan}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                      >
                        {familyPlan.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard;
