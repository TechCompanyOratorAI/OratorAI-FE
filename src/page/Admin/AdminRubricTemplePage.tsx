import React, { useEffect, useMemo, useState } from "react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import Toast from "@/components/Toast/Toast";
import RubricTemplateModal from "@/components/RubricTemplate/RubricTemplateModal";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import {
  RubricTemplate,
  RubricTemplatePayload,
  clearRubricTemplateError,
  createRubricTemplate,
  deleteRubricTemplate,
  fetchRubricTemplates,
  updateRubricTemplate,
} from "@/services/features/admin/rubricTempleSlice";
import {
  AlertCircle,
  BadgeCheck,
  ClipboardList,
  Edit,
  ListChecks,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

const AdminRubricTemplePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { templates, loading, actionLoading, error } = useAppSelector(
    (state) => state.rubricTemplate,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [filterAssignmentType, setFilterAssignmentType] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RubricTemplate | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState<RubricTemplate | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    dispatch(fetchRubricTemplates({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
      dispatch(clearRubricTemplateError());
    }
  }, [error, dispatch]);

  const filteredTemplates = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesKeyword =
        !keyword ||
        template.templateName.toLowerCase().includes(keyword) ||
        template.description.toLowerCase().includes(keyword) ||
        template.assignmentType.toLowerCase().includes(keyword);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && template.isActive) ||
        (filterStatus === "inactive" && !template.isActive);

      const matchesAssignmentType =
        filterAssignmentType === "all" ||
        template.assignmentType === filterAssignmentType;

      return matchesKeyword && matchesStatus && matchesAssignmentType;
    });
  }, [templates, searchTerm, filterStatus, filterAssignmentType]);

  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((template) => template.isActive).length;
    const defaults = templates.filter((template) => template.isDefault).length;
    return { total, active, defaults };
  }, [templates]);

  const assignmentTypes = useMemo(
    () =>
      Array.from(new Set(templates.map((template) => template.assignmentType))),
    [templates],
  );

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const openEditModal = (template: RubricTemplate) => {
    setEditingTemplate(template);
    setIsEditModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTemplate(null);
  };

  const handleCreateTemplate = async (payload: RubricTemplatePayload) => {
    try {
      await dispatch(createRubricTemplate(payload)).unwrap();
      setToast({ message: "Tạo template thành công", type: "success" });

      handleCloseCreateModal();
      dispatch(fetchRubricTemplates({ page: 1, limit: 20 }));
    } catch (createError: any) {
      setToast({
        message:
          typeof createError === "string"
            ? createError
            : createError?.message || "Không thể tạo rubric template",
        type: "error",
      });
    }
  };

  const handleUpdateTemplate = async (payload: RubricTemplatePayload) => {
    if (!editingTemplate) return;

    try {
      await dispatch(
        updateRubricTemplate({
          rubricTemplateId: editingTemplate.rubricTemplateId,
          data: payload,
        }),
      ).unwrap();
      setToast({ message: "Cập nhật template thành công", type: "success" });

      handleCloseEditModal();
      dispatch(fetchRubricTemplates({ page: 1, limit: 20 }));
    } catch (updateError: any) {
      setToast({
        message:
          typeof updateError === "string"
            ? updateError
            : updateError?.message || "Không thể cập nhật rubric template",
        type: "error",
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!showDeleteConfirm) return;

    try {
      await dispatch(
        deleteRubricTemplate(showDeleteConfirm.rubricTemplateId),
      ).unwrap();
      setToast({ message: "Xóa template thành công", type: "success" });
      setShowDeleteConfirm(null);
      dispatch(fetchRubricTemplates({ page: 1, limit: 20 }));
    } catch (deleteError: any) {
      setToast({
        message:
          typeof deleteError === "string"
            ? deleteError
            : deleteError?.message || "Không thể xóa rubric template",
        type: "error",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarAdmin activeItem="rubric-templates" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Administration
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Rubric Template Management
              </h1>
              <p className="text-sm text-slate-600">
                Quản lý bộ rubric mẫu cho các loại bài nộp
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  dispatch(fetchRubricTemplates({ page: 1, limit: 20 }))
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-full border bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="rounded-lg bg-sky-100 text-sky-700 p-2">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Total Templates
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
              <div className="rounded-lg bg-indigo-100 text-indigo-700 p-2">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Default
                </p>
                <p className="text-xl font-bold text-slate-900">
                  {stats.defaults}
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
                  Rubric Templates
                </h2>
              </div>
              <div className="flex rounded-2xl flex-col sm:flex-row gap-2 sm:items-center w-full md:w-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by template name, description, type..."
                  className="w-full sm:w-72 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as "all" | "active" | "inactive",
                    )
                  }
                  className="w-full sm:w-40 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none bg-white"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={filterAssignmentType}
                  onChange={(e) => setFilterAssignmentType(e.target.value)}
                  className="w-full sm:w-44 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none bg-white"
                >
                  <option value="all">All types</option>
                  {assignmentTypes.map((assignmentType) => (
                    <option key={assignmentType} value={assignmentType}>
                      {assignmentType}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {filteredTemplates.length} records
                </div>
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-center text-slate-500">
                <div className="mx-auto mb-3 h-10 w-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
                Loading rubric templates...
              </div>
            ) : error ? (
              <div className="px-6 py-8 flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <ClipboardList className="w-10 h-10 text-slate-300" />
                <p>
                  {searchTerm ||
                  filterStatus !== "all" ||
                  filterAssignmentType !== "all"
                    ? "No rubric templates found matching your filters"
                    : "No rubric templates available. Create your first template to get started."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Criteria
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTemplates.map((template) => {
                      const sortedCriteria = [
                        ...(template.criteria || []),
                      ].sort((a, b) => a.displayOrder - b.displayOrder);

                      return (
                        <tr
                          key={template.rubricTemplateId}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {template.templateName}
                            </div>
                            <div className="text-xs text-slate-500 line-clamp-1">
                              {template.description || "-"}
                            </div>
                            {template.isDefault && (
                              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-700">
                                Default
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {template.assignmentType}
                          </td>
                          <td className="px-6 py-4 align-top">
                            {sortedCriteria.length === 0 ? (
                              <div className="text-xs text-slate-500">
                                No criteria
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {sortedCriteria.map((criterion) => (
                                  <div
                                    key={criterion.criteriaId}
                                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-semibold text-slate-800 leading-5">
                                        {criterion.displayOrder}.{" "}
                                        {criterion.criteriaName}
                                      </p>
                                      <span className="shrink-0 inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-[11px] font-medium">
                                        {Number(criterion.weight)}% ·{" "}
                                        {criterion.maxScore}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                template.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {template.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {formatDate(
                              template.updatedAt || template.createdAt,
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditModal(template)}
                                className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                title="Edit Template"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(template)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Template"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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

      <RubricTemplateModal
        isOpen={isCreateModalOpen}
        mode="create"
        isLoading={actionLoading}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateTemplate}
      />

      <RubricTemplateModal
        isOpen={isEditModalOpen}
        mode="edit"
        isLoading={actionLoading}
        initialData={
          editingTemplate
            ? {
                templateName: editingTemplate.templateName,
                description: editingTemplate.description,
                assignmentType: editingTemplate.assignmentType,
                isDefault: editingTemplate.isDefault,
              }
            : undefined
        }
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateTemplate}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-rose-100 p-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Xác nhận xóa template
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Bạn có chắc muốn xóa template “
                  {showDeleteConfirm.templateName}”?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteTemplate}
                disabled={actionLoading}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Deleting..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default AdminRubricTemplePage;
