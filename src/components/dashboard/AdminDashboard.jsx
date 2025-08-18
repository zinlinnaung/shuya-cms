import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import PeopleIcon from "@mui/icons-material/People";
import ArticleIcon from "@mui/icons-material/Article";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import NotificationsIcon from "@mui/icons-material/Notifications";

const COLORS = ["#BB86FC", "#03DAC6"];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [familyPlan, setFamilyPlan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch(
          "https://shuyaapi.tharapa.ai/api/dashboard/stats"
        );
        const statsData = await statsRes.json();

        setStats([
          {
            title: "Total Users",
            value: statsData.totalUsers,
            icon: <PeopleIcon fontSize="large" />,
            color: "#BB86FC",
          },
          {
            title: "Total Blogs",
            value: statsData.totalBlogs,
            icon: <ArticleIcon fontSize="large" />,
            color: "#03DAC6",
          },
          {
            title: "Bookmarks",
            value: statsData.totalBookmarks,
            icon: <BookmarkIcon fontSize="large" />,
            color: "#FF9800",
          },
          {
            title: "Notifications",
            value: statsData.totalNotifications,
            icon: <NotificationsIcon fontSize="large" />,
            color: "#F44336",
          },
        ]);

        // Fetch user growth
        const growthRes = await fetch(
          "https://shuyaapi.tharapa.ai/api/dashboard/user-growth"
        );
        const growthData = await growthRes.json();
        setUserGrowth(growthData);

        // Fetch family plan distribution
        const familyRes = await fetch(
          "https://shuyaapi.tharapa.ai/api/dashboard/family-plan"
        );
        const familyData = await familyRes.json();
        setFamilyPlan(familyData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Stats Cards */}
      <Grid container spacing={3}>
        {/* {stats.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{ backgroundColor: item.color + "33", borderRadius: "16px" }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6">{item.title}</Typography>
                    <Typography variant="h4">{item.value}</Typography>
                  </Box>
                  <Box color={item.color}>{item.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))} */}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mt={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: "16px" }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                User Growth
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowth}>
                  <XAxis dataKey="month" stroke="#FFFFFF" />
                  <YAxis stroke="#FFFFFF" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#BB86FC"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: "16px" }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Family Plan Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={familyPlan}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {familyPlan.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
