import React, { useEffect, useMemo, useState } from "react";
import { Users, RefreshCw, Search } from "lucide-react";
import { Table, Button, Input, Select, Tag, Space, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchAllUsers, AdminUser } from "@/services/features/admin/adminSlice";

const roleWhitelist: string[] = ["student", "instructor"];

const UserManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.admin);
  const safeUsers = Array.isArray(users) ? users : [];

  const [roleFilter, setRoleFilter] = useState<
    "all" | "student" | "instructor"
  >("all");
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const filteredUsers = useMemo(
    () =>
      safeUsers.filter((user) => {
        const matchesRole = user.userRoles?.some((ur) => {
          const roleName = ur.role?.roleName?.toLowerCase();
          if (!roleName) return false;
          if (roleFilter === "all") return roleWhitelist.includes(roleName);
          return roleName === roleFilter;
        });

        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          `${user.firstName || ""} ${user.lastName || ""}`
            .toLowerCase()
            .includes(query) ||
          user.username.toLowerCase().includes(query) ||
          (user.email || "").toLowerCase().includes(query);

        return matchesRole && matchesSearch;
      }),
    [safeUsers, roleFilter, search],
  );

  const stats = useMemo(() => {
    const total = filteredUsers.length;
    const active = filteredUsers.filter((u) => u.isActive).length;
    const verified = filteredUsers.filter((u) => u.isEmailVerified).length;
    return { total, active, verified };
  }, [filteredUsers]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const columns: ColumnsType<AdminUser> = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div>
          <div className="font-semibold">
            {record.firstName || record.lastName
              ? `${record.firstName || ""} ${record.lastName || ""}`.trim()
              : record.username}
          </div>
          <div className="text-xs text-gray-400">{record.email}</div>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: (_, record) => {
        const role = record.userRoles?.find(
          (ur) =>
            ur.role?.roleName &&
            roleWhitelist.includes(ur.role.roleName.toLowerCase()),
        )?.role?.roleName;
        return <Tag>{role || "Unknown"}</Tag>;
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.isActive ? "green" : "red"}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Verify",
      key: "verify",
      render: (_, record) => (
        <Tag color={record.isEmailVerified ? "blue" : "default"}>
          {record.isEmailVerified ? "Verified" : "Unverified"}
        </Tag>
      ),
    },
    {
      title: "Last Login",
      key: "lastLogin",
      render: (_, record) =>
        record.lastLoginAt
          ? new Date(record.lastLoginAt).toLocaleString()
          : "—",
    },
    {
      title: "Joined",
      key: "createdAt",
      render: (_, record) =>
        record.createdAt
          ? new Date(record.createdAt).toLocaleDateString()
          : "—",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin activeItem="user-management" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Administration
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-sm text-gray-600">
                Students & Instructors directory with quick search and role
                filter.
              </p>
            </div>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => dispatch(fetchAllUsers())}
              loading={loading}
            >
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-blue-100 text-blue-600 p-2">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Total Users
                  </p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-green-100 text-green-600 p-2">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Active
                  </p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </Space>
            </Card>
            <Card size="small">
              <Space>
                <div className="rounded-lg bg-indigo-100 text-indigo-600 p-2">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">
                    Verified Email
                  </p>
                  <p className="text-xl font-bold">{stats.verified}</p>
                </div>
              </Space>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Directory
                </p>
                <h2 className="text-lg font-bold text-gray-900">
                  Students & Instructors
                </h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Search..."
                  prefix={<Search size={14} className="text-gray-400" />}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-64"
                  allowClear
                />
                <Select
                  value={roleFilter}
                  onChange={(val) => {
                    setRoleFilter(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 140 }}
                  options={[
                    { value: "all", label: "All roles" },
                    { value: "student", label: "Student" },
                    { value: "instructor", label: "Instructor" },
                  ]}
                />
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={paginatedUsers}
              rowKey="userId"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize,
                total: filteredUsers.length,
                showSizeChanger: true,
                showQuickJumper: false,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} users`,
                onChange: (p, ps) => {
                  setCurrentPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: error
                  ? error
                  : search || roleFilter !== "all"
                    ? "No users found matching your filters"
                    : "No Student or Instructor accounts found.",
              }}
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserManagementPage;
