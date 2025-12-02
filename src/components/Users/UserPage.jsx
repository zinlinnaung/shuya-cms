// UserTable.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Avatar,
} from "@mui/material";
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
      const usersData = data.users || data; // adjust depending on API
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
    if (!searchText) {
      setFilteredUsers(users);
    } else {
      const lower = searchText.toLowerCase();
      const filtered = users.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(lower)) ||
          (u.phone && u.phone.toLowerCase().includes(lower)) ||
          (u.Township && u.Township.toLowerCase().includes(lower)) ||
          (u.Division && u.Division.toLowerCase().includes(lower))
      );
      setFilteredUsers(filtered);
    }
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
          <Avatar>{params.row.name[0]}</Avatar>
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
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("YYYY-MM-DD") : "",
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
      flex: 0.5,
      renderCell: (params) =>
        params.value ? (
          <Typography color="green">Yes</Typography>
        ) : (
          <Typography color="red">No</Typography>
        ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Users Table
      </Typography>

      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <TextField
          label="Search by name, phone, township..."
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          fullWidth
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {loading && <CircularProgress />}

      {error && <Typography color="error">Error: {error}</Typography>}

      {!loading && !error && (
        <div style={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            getRowId={(row) => row.id}
            sx={{
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(0,0,0,0.04)",
              },
            }}
          />
        </div>
      )}
    </Box>
  );
}
