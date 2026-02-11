import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Building2,
  BadgeCheck,
  BadgeX,
  AlertCircle,
} from "lucide-react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import Toast from "@/components/Toast/Toast";
import DepartmentModal, {
  DepartmentFormData,
} from "@/components/Department/DepartmentModal";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  Department,
} from "@/services/features/admin/adminSlice";
import { AppDispatch, RootState } from "@/services/store/store";

const AdminDepartmentPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { departments, loading, error } = useSelector(
    (state: RootState) => state.admin,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<
    Department | undefined
  >();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleCreateDepartment = () => {
    setSelectedDepartment(undefined);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    const result = await dispatch(deleteDepartment(departmentId.toString()));
    if (deleteDepartment.fulfilled.match(result)) {
      await dispatch(fetchDepartments());
      setToast({ message: "Department deleted successfully", type: "success" });
    } else {
      setToast({ message: "Failed to delete department", type: "error" });
    }
    setShowDeleteConfirm(null);
  };

  const handleSubmitDepartment = async (formData: DepartmentFormData) => {
    if (selectedDepartment) {
      const result = await dispatch(
        updateDepartment({
          departmentId: selectedDepartment.departmentId.toString(),
          departmentName: formData.departmentName,
          description: formData.description,
          isActive: formData.isActive,
        }),
      );
      if (updateDepartment.fulfilled.match(result)) {
        await dispatch(fetchDepartments());
        setToast({
          message: "Department updated successfully",
          type: "success",
        });
      } else {
        setToast({ message: "Failed to update department", type: "error" });
      }
    } else {
      const result = await dispatch(
        createDepartment({
          departmentCode: formData.departmentCode,
          departmentName: formData.departmentName,
          description: formData.description,
        }),
      );
      if (createDepartment.fulfilled.match(result)) {
        await dispatch(fetchDepartments());
        setToast({
          message: "Department created successfully",
          type: "success",
        });
      } else {
        setToast({ message: "Failed to create department", type: "error" });
      }
    }

    setIsModalOpen(false);
    setSelectedDepartment(undefined);
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      const matchesSearch =
        department.departmentCode
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        department.departmentName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (department.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && department.isActive) ||
        (filterStatus === "inactive" && !department.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [departments]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarAdmin activeItem="manage-departments" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Administration
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Department Management
              </h1>
              <p className="text-sm text-slate-600">
                Manage departments, status, and details.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(fetchDepartments())}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleCreateDepartment}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Department
              </button>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-sky-100 text-sky-700 p-2">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Total Departments
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 text-emerald-700 p-2">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Active
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.active}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-rose-100 text-rose-700 p-2">
                <BadgeX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Inactive
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Directory
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  Departments
                </h2>
              </div>
              <div className="flex rounded-2xl flex-col sm:flex-row gap-2 sm:items-center w-full md:w-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code, name, or description..."
                  className="w-full sm:w-64 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
                <div className="relative w-full sm:w-40">
                  <select
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(
                        e.target.value as "all" | "active" | "inactive",
                      )
                    }
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none bg-white appearance-none cursor-pointer pr-8"
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {filteredDepartments.length} records
                </div>
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-center text-slate-500">
                <div className="mx-auto mb-3 h-10 w-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
                Loading departments...
              </div>
            ) : error ? (
              <div className="px-6 py-8 flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Building2 className="w-10 h-10 text-slate-300" />
                <p>
                  {searchTerm || filterStatus !== "all"
                    ? "No departments found matching your filters"
                    : "No departments available. Create your first department to get started."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDepartments.map((department) => (
                      <tr
                        key={department.departmentId}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {department.departmentName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {department.departmentCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {department.description || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              department.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {department.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(department.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEditDepartment(department)}
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Edit Department"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setShowDeleteConfirm(department.departmentId)
                              }
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-rose-100 p-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Delete Department
              </h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this department? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDepartment(showDeleteConfirm)}
                className="px-4 py-2 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
              >
                Delete Department
              </button>
            </div>
          </div>
        </div>
      )}

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitDepartment}
        initialData={selectedDepartment}
        isLoading={loading}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminDepartmentPage;
