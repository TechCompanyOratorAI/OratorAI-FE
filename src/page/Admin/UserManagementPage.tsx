import React, { useEffect, useMemo, useState } from "react";
import { Users, ShieldCheck, MailCheck, AlertCircle, RefreshCw, UserX } from "lucide-react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchAllUsers, AdminUser } from "@/services/features/admin/adminSlice";

const roleWhitelist: string[] = ["student", "instructor"];

const UserManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.admin);
  const safeUsers = Array.isArray(users) ? users : [];
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "instructor">("all");
  const [search, setSearch] = useState<string>("");

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
          `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          (user.email || "").toLowerCase().includes(query);

        return matchesRole && matchesSearch;
      }),
    [safeUsers, roleFilter, search]
  );

  const stats = useMemo(() => {
    const total = filteredUsers.length;
    const active = filteredUsers.filter((u) => u.isActive).length;
    const verified = filteredUsers.filter((u) => u.isEmailVerified).length;
    return { total, active, verified };
  }, [filteredUsers]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarAdmin activeItem="user-management" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Administration</p>
              <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
              <p className="text-sm text-slate-600">Students & Instructors directory with quick search and role filter.</p>
            </div>
            <button
              onClick={() => dispatch(fetchAllUsers())}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-sky-100 text-sky-700 p-2">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">Total users</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">Active</p>
                <p className="text-xl font-bold text-slate-900">{stats.active}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 text-indigo-700 p-2">
                <MailCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">Verified email</p>
                <p className="text-xl font-bold text-slate-900">{stats.verified}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Directory</p>
                <h2 className="text-lg font-bold text-slate-900">Students & Instructors</h2>
              </div>
              <div className="flex rounded-2xl flex-col sm:flex-row gap-2 sm:items-center w-full md:w-auto">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full sm:w-64 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
                <div className="relative w-full sm:w-40">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as "all" | "student" | "instructor")}
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none bg-white appearance-none cursor-pointer pr-8"
                  >
                    <option value="all">All roles</option>
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">{filteredUsers.length} records</div>
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-center text-slate-500">
                <div className="mx-auto mb-3 h-10 w-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
                Loading users...
              </div>
            ) : error ? (
              <div className="px-6 py-8 flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <UserX className="w-10 h-10 text-slate-300" />
                No Student or Instructor accounts found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">User</th>
                      <th className="px-6 py-3 text-left font-semibold">Role</th>
                      <th className="px-6 py-3 text-left font-semibold">Status</th>
                      <th className="px-6 py-3 text-left font-semibold">Verify</th>
                      <th className="px-6 py-3 text-left font-semibold">Last login</th>
                      <th className="px-6 py-3 text-left font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user: AdminUser) => {
                      const role = user.userRoles?.find((ur) => ur.role?.roleName && roleWhitelist.includes(ur.role.roleName.toLowerCase()))?.role?.roleName;
                      return (
                        <tr key={user.userId} className="hover:bg-slate-50/80 transition">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : user.username}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-700 border-slate-200">
                              {role || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                user.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                user.isEmailVerified
                                  ? "bg-sky-50 text-sky-700 border-sky-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {user.isEmailVerified ? "Verified" : "Unverified"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default UserManagementPage;

