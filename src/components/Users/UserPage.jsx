import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for search input
  const [searchText, setSearchText] = useState("");
  // State for the actual search term used to fetch data
  const [apiSearchTerm, setApiSearchTerm] = useState("");

  // Pagination State (DataGrid uses 0-based indexing for pages)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0); // Total users in DB (from meta.total)

  // --- Core Fetching Logic ---
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Backend expects 1-based page, so we add 1 to paginationModel.page
    const pageForBackend = paginationModel.page + 1;
    const limit = paginationModel.pageSize;

    // Construct the URL with all parameters
    const queryParams = new URLSearchParams({
      page: pageForBackend.toString(),
      limit: limit.toString(),
      search: apiSearchTerm,
    }).toString();

    const url = `https://shuyaapi.tharapa.ai/api/user?${queryParams}`;

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);

      const result = await resp.json();

      // Ensure we have data and metadata in the expected format { data: [...], meta: { total: X } }
      const usersData = (result.data || []).map((u) => ({
        ...u,
        // Normalize birthDate
        birthDate: u.birthDate ? dayjs(u.birthDate).format("YYYY-MM-DD") : "",
      }));

      setUsers(usersData);
      setRowCount(result.meta?.total || 0); // Set total count for the DataGrid
    } catch (err) {
      console.error("Fetch users failed", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, apiSearchTerm]);
  // Dependency array includes paginationModel and apiSearchTerm: refetches when page, limit, or search changes.

  // --- Effects and Handlers ---
  useEffect(() => {
    // Initial fetch and refetch on state change
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    // When search button is clicked, update the term that triggers the API call
    setApiSearchTerm(searchText.trim());
    // Important: Reset to page 0 when a new search is performed
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleReset = () => {
    setSearchText("");
    setApiSearchTerm("");
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const columns = [
    // ... (Keep columns definition unchanged)
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
            onClick={handleReset}
            startIcon={<RefreshIcon />}
            sx={{ px: 3, borderRadius: 2 }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error: {error}
        </Typography>
      )}

      {/* Main Data Grid */}
      <Paper
        elevation={3}
        sx={{
          height: 650, // Increased height slightly to accommodate DataGrid
          width: "100%",
          p: 2,
          borderRadius: 3,
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.id}
          // --- Server-side Pagination Props ---
          paginationMode="server" // Tells DataGrid not to paginate locally
          loading={loading} // Uses the DataGrid's built-in loading overlay
          rowCount={rowCount} // Total number of rows in the DB
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          // ------------------------------------

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
    </Box>
  );
}
