// UserTable.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Avatar,
  Paper,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("https://shuyaapi.tharapa.ai/api/user");
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
      const data = await resp.json();
      const usersData = data.users || data;
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      console.error("Fetch users failed", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    if (!searchText.trim()) return setFilteredUsers(users);

    const lower = searchText.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.name?.toLowerCase().includes(lower) ||
        u.phone?.toLowerCase().includes(lower) ||
        u.Township?.toLowerCase().includes(lower) ||
        u.Division?.toLowerCase().includes(lower)
    );

    setFilteredUsers(filtered);
  };

  const columns = [
    {
      field: "profile",
      headerName: "Avatar",
      width: 80,
      renderCell: (params) =>
        params.value ? (
          <Avatar src={params.value} alt={params.row.name} />
        ) : (
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {params.row.name?.[0]}
          </Avatar>
        ),
      sortable: false,
      filterable: false,
    },
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    {
      field: "birthDate",
      headerName: "Birth Date",
      flex: 1,
      valueFormatter: (params) => {
        if (!params || !params.value) return ""; // ⬅️ prevents crash
        return dayjs(params.value).format("YYYY-MM-DD");
      },
    },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "weight", headerName: "Weight (kg)", flex: 1 },
    { field: "flow", headerName: "Flow", flex: 1 },
    { field: "Township", headerName: "Township", flex: 1 },
    { field: "Division", headerName: "Division", flex: 1 },
    { field: "familyPlan", headerName: "Family Plan", flex: 1 },
    {
      field: "is_active",
      headerName: "Active",
      flex: 0.7,
      renderCell: (params) => (
        <Typography color={params.value ? "green" : "red"} fontWeight={600}>
          {params.value ? "Yes" : "No"}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        👤 User Management
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: "white",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            label="Search users..."
            variant="outlined"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ px: 3, borderRadius: 2 }}
          >
            Search
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setSearchText("");
              setFilteredUsers(users);
            }}
            startIcon={<RefreshIcon />}
            sx={{ px: 3, borderRadius: 2 }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}

      {!loading && !error && (
        <Paper
          elevation={3}
          sx={{
            height: 600,
            width: "100%",
            p: 2,
            borderRadius: 3,
          }}
        >
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            getRowId={(row) => row.id}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f0f4f8",
                borderRadius: 1,
                fontWeight: 700,
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(25,118,210,0.08)",
              },
              "& .MuiDataGrid-cell": {
                padding: "0 12px",
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
