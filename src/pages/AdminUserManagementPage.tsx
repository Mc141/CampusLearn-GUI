import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  AdminPanelSettings,
  Search,
  Save,
  Block,
  CheckCircle,
  Delete,
} from "@mui/icons-material";
import {
  adminUserService,
  AdminUserRow,
  PlatformRole,
} from "../services/adminUserService";
import { useAuth } from "../context/AuthContext";

const AdminUserManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState<Record<string, PlatformRole>>(
    {}
  );
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<AdminUserRow | null>(null);
  const [banReason, setBanReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  const filtered = useMemo(() => users, [users]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminUserService.listUsers(search);
      setUsers(data);
    } catch (e) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSaveRole = async (userId: string) => {
    try {
      const role = editedRole[userId];
      if (!role) return;
      await adminUserService.updateRole(userId, role);
      setSuccess("Role updated");
      setEditedRole((prev) => ({ ...prev, [userId]: role }));
      await load();
    } catch (e) {
      setError("Failed to update role");
    }
  };

  const handleToggleActive = async (row: AdminUserRow) => {
    if (row.is_active) {
      setBanTarget(row);
      setBanReason("");
      setBanDialogOpen(true);
      return;
    }
    try {
      await adminUserService.setActive(row.id, true, user?.id, undefined);
      setSuccess("User unbanned");
      await load();
    } catch (e) {
      setError("Failed to update user status");
    }
  };

  const confirmBan = async () => {
    if (!banTarget) return;
    try {
      await adminUserService.setActive(
        banTarget.id,
        false,
        user?.id,
        banReason || undefined
      );
      setSuccess("User banned");
      setBanDialogOpen(false);
      setBanTarget(null);
      setBanReason("");
      await load();
    } catch (e) {
      setError("Failed to ban user");
    }
  };

  const handleDeleteUser = (row: AdminUserRow) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminUserService.deleteUser(deleteTarget.id);
      setSuccess("User deleted");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError("Failed to delete user");
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
        <AdminPanelSettings color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Manage Users
        </Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: "flex", gap: 2 }}>
          <TextField
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ flex: 1 }}
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  {row.first_name} {row.last_name}
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      label="Role"
                      value={editedRole[row.id] || row.role}
                      onChange={(e) =>
                        setEditedRole((prev) => ({
                          ...prev,
                          [row.id]: e.target.value as PlatformRole,
                        }))
                      }
                    >
                      <MenuItem value="student">Student</MenuItem>
                      <MenuItem value="tutor">Tutor</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={row.is_active ? "success" : "default"}
                    label={row.is_active ? "Active" : "Banned"}
                  />
                </TableCell>
                <TableCell>
                  {new Date(row.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleSaveRole(row.id)}
                    title="Save Role"
                  >
                    <Save />
                  </IconButton>
                  <IconButton
                    color={row.is_active ? "error" : "success"}
                    onClick={() => handleToggleActive(row)}
                    title={row.is_active ? "Ban User" : "Unban User"}
                  >
                    {row.is_active ? <Block /> : <CheckCircle />}
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteUser(row)}
                    title="Delete User"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog
        open={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ban User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Provide an optional reason for banning {banTarget?.first_name}{" "}
            {banTarget?.last_name}.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Reason (optional)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmBan}>
            Ban User
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete{" "}
            {deleteTarget?.first_name} {deleteTarget?.last_name}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            This action cannot be undone. All user data will be permanently
            removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagementPage;
