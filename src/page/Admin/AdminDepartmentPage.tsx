import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Card,
  Popconfirm,
  App,
  ConfigProvider,
  Form,
} from "antd";
import viVN from "antd/locale/vi_VN";
import type { ColumnsType } from "antd/es/table";
import {
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import SummaryMetrics, {
  SummaryMetricItem,
} from "@/components/Dashboard/SummaryMetrics";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";
import DepartmentModal, {
  DepartmentFormData,
} from "@/components/Department/DepartmentModal";
import DepartmentSubjectAreasModal from "@/components/Department/DepartmentSubjectAreasModal";
import SubjectAreaFormModal from "@/components/Department/SubjectAreaFormModal";
import CompetencyListModal from "@/components/Department/CompetencyListModal";
import CompetencyFormModal from "@/components/Department/CompetencyFormModal";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  Department,
} from "@/services/features/admin/adminSlice";
import { AppDispatch, RootState } from "@/services/store/store";
import { extractLocalizedMessage } from "@/lib/utils";
import { api } from "@/services/constant/axiosInstance";
import {
  SUBJECT_AREAS_ENDPOINT,
  SUBJECT_AREA_DETAIL_ENDPOINT,
  COMPETENCIES_ENDPOINT,
} from "@/services/constant/apiConfig";

interface SubjectArea {
  subjectAreaId: number;
  subjectCode: string;
  subjectName: string;
  departmentId: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  department?: {
    departmentId: number;
    departmentCode: string;
    departmentName: string;
  } | null;
}

interface SubjectAreaFormValues {
  subjectCode: string;
  subjectName: string;
  departmentId?: number;
  isActive: boolean;
}

interface Competency {
  competencyId: number;
  competencyCode: string;
  competencyName: string;
  description?: string | null;
  departmentId: number | null;
  subjectAreaId: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CompetencyFormValues {
  competencyCode: string;
  competencyName: string;
  description?: string;
  isActive: boolean;
}

const AdminDepartmentPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [subjectAreaForm] = Form.useForm<SubjectAreaFormValues>();
  const [competencyForm] = Form.useForm<CompetencyFormValues>();
  const { departments, loading } = useSelector(
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
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [subjectAreas, setSubjectAreas] = useState<SubjectArea[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState("");
  const [subjectFilterStatus, setSubjectFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [subjectFilterDepartmentId, setSubjectFilterDepartmentId] = useState<
    number | undefined
  >(undefined);
  const [subjectPage, setSubjectPage] = useState(1);
  const [subjectPageSize, setSubjectPageSize] = useState(10);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<
    SubjectArea | undefined
  >();
  const [isDepartmentSubjectModalOpen, setIsDepartmentSubjectModalOpen] =
    useState(false);
  const [selectedDepartmentForSubject, setSelectedDepartmentForSubject] =
    useState<Department | undefined>();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [competencyLoading, setCompetencyLoading] = useState(false);
  const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);
  const [isCompetencyFormModalOpen, setIsCompetencyFormModalOpen] =
    useState(false);
  const [selectedSubjectForCompetency, setSelectedSubjectForCompetency] =
    useState<SubjectArea | undefined>();
  const [competencySearchTerm, setCompetencySearchTerm] = useState("");
  const [competencyFilterStatus, setCompetencyFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [competencyPage, setCompetencyPage] = useState(1);
  const [competencyPageSize, setCompetencyPageSize] = useState(10);

  const { notification } = App.useApp();

  const notifySuccess = (title: string, description: string) => {
    notification.success({
      message: title,
      description,
      placement: "topRight",
    });
  };

  const notifyError = (title: string, description: string) => {
    notification.error({
      message: title,
      description,
      placement: "topRight",
    });
  };

  const normalizeDepartmentMessage = (message: string) =>
    message.replace(/bộ môn/gi, "chuyên ngành");

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const fetchSubjectAreas = async () => {
    setSubjectLoading(true);
    try {
      const response = await api.get(`${SUBJECT_AREAS_ENDPOINT}?limit=200`);
      const payload = response.data as { data?: SubjectArea[] };
      setSubjectAreas(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      notifyError(
        "Tải thất bại",
        extractLocalizedMessage(error, "Không thể tải danh sách lĩnh vực môn học."),
      );
    }
    setSubjectLoading(false);
  };

  useEffect(() => {
    fetchSubjectAreas();
  }, []);

  const handleCreateDepartment = () => {
    setSelectedDepartment(undefined);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    setActionLoading(true);
    try {
      const response = await dispatch(
        deleteDepartment(departmentId.toString()),
      ).unwrap();
      await dispatch(fetchDepartments());
      notifySuccess(
        "Xóa thành công",
        normalizeDepartmentMessage(
          extractLocalizedMessage(response, "Đã xóa chuyên ngành thành công."),
        ),
      );
    } catch (error) {
      notifyError(
        "Xóa thất bại",
        normalizeDepartmentMessage(
          extractLocalizedMessage(error, "Không thể xóa chuyên ngành."),
        ),
      );
    }
    setActionLoading(false);
  };

  const handleSubmitDepartment = async (formData: DepartmentFormData) => {
    setActionLoading(true);
    try {
      if (selectedDepartment) {
        const response = await dispatch(
          updateDepartment({
            departmentId: selectedDepartment.departmentId.toString(),
            departmentName: formData.departmentName,
            description: formData.description,
            isActive: formData.isActive,
          }),
        ).unwrap();
        await dispatch(fetchDepartments());
        notifySuccess(
          "Cập nhật thành công",
          normalizeDepartmentMessage(
            extractLocalizedMessage(
              response,
              "Đã cập nhật chuyên ngành thành công.",
            ),
          ),
        );
      } else {
        const response = await dispatch(
          createDepartment({
            departmentCode: formData.departmentCode,
            departmentName: formData.departmentName,
            description: formData.description,
          }),
        ).unwrap();
        await dispatch(fetchDepartments());
        notifySuccess(
          "Tạo thành công",
          normalizeDepartmentMessage(
            extractLocalizedMessage(response, "Đã tạo chuyên ngành thành công."),
          ),
        );
      }
      setIsModalOpen(false);
      setSelectedDepartment(undefined);
    } catch (error) {
      notifyError(
        selectedDepartment ? "Cập nhật thất bại" : "Tạo thất bại",
        normalizeDepartmentMessage(
          extractLocalizedMessage(
            error,
            selectedDepartment
              ? "Không thể cập nhật chuyên ngành."
              : "Không thể tạo chuyên ngành.",
          ),
        ),
      );
    }
    setActionLoading(false);
  };

  const filteredDepartments = useMemo(() => {
    return [...departments]
      .sort((left, right) => {
        const leftTime = left.createdAt
          ? new Date(left.createdAt).getTime()
          : 0;
        const rightTime = right.createdAt
          ? new Date(right.createdAt).getTime()
          : 0;
        return sortOrder === "newest"
          ? rightTime - leftTime
          : leftTime - rightTime;
      })
      .filter((department) => {
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
  }, [departments, searchTerm, filterStatus, sortOrder]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [departments]);

  const summaryItems: SummaryMetricItem[] = [
    {
      key: "total",
      title: "Tổng chuyên ngành",
      value: stats.total,
      icon: <BookOutlined style={{ fontSize: 20 }} />,
      tone: "blue",
      description: "Toàn hệ thống",
    },
    {
      key: "active",
      title: "Đang hoạt động",
      value: stats.active,
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      tone: "green",
      description: "Sẵn sàng sử dụng",
    },
    {
      key: "inactive",
      title: "Không hoạt động",
      value: stats.inactive,
      icon: <ExclamationCircleOutlined style={{ fontSize: 20 }} />,
      tone: "red",
      description: "Cần rà soát",
    },
  ];

  const columns: ColumnsType<Department> = [
    {
      title: "Chuyên ngành",
      key: "department",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.departmentName}</div>
          <div className="text-xs text-gray-400">{record.departmentCode}</div>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (val) => val || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val?: string) => {
        if (!val) return "-";
        const date = new Date(val);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<FolderOpenOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleManageDepartmentSubjectAreas(record)}
            className="text-violet-500 hover:text-violet-600"
            title="Quản lý lĩnh vực môn học"
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleEditDepartment(record)}
            className="text-blue-500 hover:text-blue-600"
          />
          <Popconfirm
            title="Xác nhận xóa chuyên ngành"
            description="Bạn có chắc muốn xóa chuyên ngành này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDeleteDepartment(record.departmentId)}
            okText="Xóa"
            okButtonProps={{ danger: true, loading: actionLoading }}
            cancelText="Hủy"
          >
            <Button
              type="text"
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreateSubjectArea = (department?: Department) => {
    setSelectedSubjectArea(undefined);
    const targetDepartmentId = department?.departmentId;
    subjectAreaForm.setFieldsValue({
      subjectCode: "",
      subjectName: "",
      departmentId: targetDepartmentId,
      isActive: true,
    });
    setIsSubjectModalOpen(true);
  };

  const handleManageDepartmentSubjectAreas = (department: Department) => {
    setSelectedDepartmentForSubject(department);
    setIsDepartmentSubjectModalOpen(true);
    setSubjectFilterDepartmentId(department.departmentId);
    setSubjectPage(1);
  };

  const handleEditSubjectArea = (subjectArea: SubjectArea) => {
    setSelectedSubjectArea(subjectArea);
    subjectAreaForm.setFieldsValue({
      subjectCode: subjectArea.subjectCode,
      subjectName: subjectArea.subjectName,
      departmentId: subjectArea.departmentId || undefined,
      isActive: subjectArea.isActive,
    });
    setIsSubjectModalOpen(true);
  };

  const handleDeleteSubjectArea = async (subjectAreaId: number) => {
    setActionLoading(true);
    try {
      const response = await api.delete(
        SUBJECT_AREA_DETAIL_ENDPOINT(subjectAreaId.toString()),
      );
      await fetchSubjectAreas();
      notifySuccess(
        "Xóa thành công",
        extractLocalizedMessage(response.data, "Đã xóa lĩnh vực môn học thành công."),
      );
    } catch (error) {
      notifyError(
        "Xóa thất bại",
        extractLocalizedMessage(error, "Không thể xóa lĩnh vực môn học."),
      );
    }
    setActionLoading(false);
  };

  const handleSubmitSubjectArea = async () => {
    setActionLoading(true);
    try {
      const formData = await subjectAreaForm.validateFields();
      const payload = {
        subjectCode: formData.subjectCode.trim().toUpperCase(),
        subjectName: formData.subjectName.trim(),
        departmentId:
          selectedDepartmentForSubject?.departmentId ?? formData.departmentId,
        isActive: formData.isActive,
      };
      if (selectedSubjectArea) {
        const response = await api.patch(
          SUBJECT_AREA_DETAIL_ENDPOINT(selectedSubjectArea.subjectAreaId.toString()),
          payload,
        );
        notifySuccess(
          "Cập nhật thành công",
          extractLocalizedMessage(
            response.data,
            "Đã cập nhật lĩnh vực môn học thành công.",
          ),
        );
      } else {
        const response = await api.post(SUBJECT_AREAS_ENDPOINT, payload);
        notifySuccess(
          "Tạo thành công",
          extractLocalizedMessage(response.data, "Đã tạo lĩnh vực môn học thành công."),
        );
      }
      await fetchSubjectAreas();
      setIsSubjectModalOpen(false);
      setSelectedSubjectArea(undefined);
      subjectAreaForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) {
        setActionLoading(false);
        return;
      }
      notifyError(
        selectedSubjectArea ? "Cập nhật thất bại" : "Tạo thất bại",
        extractLocalizedMessage(
          error,
          selectedSubjectArea
            ? "Không thể cập nhật lĩnh vực môn học."
            : "Không thể tạo lĩnh vực môn học.",
        ),
      );
    }
    setActionLoading(false);
  };

  const filteredSubjectAreas = useMemo(() => {
    return [...subjectAreas]
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .filter((subjectArea) => {
        const matchesSearch =
          subjectArea.subjectCode
            .toLowerCase()
            .includes(subjectSearchTerm.toLowerCase()) ||
          subjectArea.subjectName
            .toLowerCase()
            .includes(subjectSearchTerm.toLowerCase()) ||
          (subjectArea.department?.departmentName || "")
            .toLowerCase()
            .includes(subjectSearchTerm.toLowerCase()) ||
          (subjectArea.department?.departmentCode || "")
            .toLowerCase()
            .includes(subjectSearchTerm.toLowerCase());

        const matchesStatus =
          subjectFilterStatus === "all" ||
          (subjectFilterStatus === "active" && subjectArea.isActive) ||
          (subjectFilterStatus === "inactive" && !subjectArea.isActive);

        const matchesDepartment =
          subjectFilterDepartmentId === undefined ||
          subjectArea.departmentId === subjectFilterDepartmentId;

        return matchesSearch && matchesStatus && matchesDepartment;
      });
  }, [
    subjectAreas,
    subjectSearchTerm,
    subjectFilterStatus,
    subjectFilterDepartmentId,
  ]);

  const subjectColumns: ColumnsType<SubjectArea> = [
    {
      title: "Lĩnh vực môn học",
      key: "subject",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.subjectName}</div>
          <div className="text-xs text-gray-400">{record.subjectCode}</div>
        </div>
      ),
    },
    {
      title: "Chuyên ngành",
      key: "department",
      render: (_, record) =>
        record.department
          ? `${record.department.departmentCode} - ${record.department.departmentName}`
          : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<ToolOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleOpenCompetencyModal(record)}
            className="text-violet-500 hover:text-violet-600"
            title="Quản lý năng lực"
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleEditSubjectArea(record)}
            className="text-blue-500 hover:text-blue-600"
          />
          <Popconfirm
            title="Xác nhận xóa lĩnh vực môn học"
            description="Bạn có chắc muốn xóa lĩnh vực này? Hành động này không thể hoàn tác."
            onConfirm={() => handleDeleteSubjectArea(record.subjectAreaId)}
            okText="Xóa"
            okButtonProps={{ danger: true, loading: actionLoading }}
            cancelText="Hủy"
          >
            <Button
              type="text"
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const departmentSubjectAreas = useMemo(() => {
    if (!selectedDepartmentForSubject) return [];
    return filteredSubjectAreas.filter(
      (item) => item.departmentId === selectedDepartmentForSubject.departmentId,
    );
  }, [filteredSubjectAreas, selectedDepartmentForSubject]);

  const fetchCompetencies = async (subjectAreaId: number) => {
    setCompetencyLoading(true);
    try {
      const response = await api.get(
        `${COMPETENCIES_ENDPOINT}?subjectAreaId=${subjectAreaId}&limit=200`,
      );
      const payload = response.data as { data?: Competency[] };
      setCompetencies(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      notifyError(
        "Tải thất bại",
        extractLocalizedMessage(error, "Không thể tải danh sách năng lực."),
      );
    }
    setCompetencyLoading(false);
  };

  const handleOpenCompetencyModal = async (subjectArea: SubjectArea) => {
    setSelectedSubjectForCompetency(subjectArea);
    setCompetencySearchTerm("");
    setCompetencyFilterStatus("all");
    setCompetencyPage(1);
    setIsCompetencyModalOpen(true);
    await fetchCompetencies(subjectArea.subjectAreaId);
  };

  const handleOpenCreateCompetency = () => {
    competencyForm.setFieldsValue({
      competencyCode: "",
      competencyName: "",
      description: "",
      isActive: true,
    });
    setIsCompetencyFormModalOpen(true);
  };

  const handleSubmitCompetency = async () => {
    if (!selectedSubjectForCompetency) return;
    setActionLoading(true);
    try {
      const formData = await competencyForm.validateFields();
      const payload = {
        competencyCode: formData.competencyCode.trim().toUpperCase(),
        competencyName: formData.competencyName.trim(),
        description: (formData.description || "").trim() || null,
        departmentId:
          selectedDepartmentForSubject?.departmentId ??
          selectedSubjectForCompetency.departmentId,
        subjectAreaId: selectedSubjectForCompetency.subjectAreaId,
        isActive: formData.isActive,
      };
      const response = await api.post(COMPETENCIES_ENDPOINT, payload);
      notifySuccess(
        "Tạo thành công",
        extractLocalizedMessage(response.data, "Đã tạo năng lực thành công."),
      );
      await fetchCompetencies(selectedSubjectForCompetency.subjectAreaId);
      setIsCompetencyFormModalOpen(false);
      competencyForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) {
        setActionLoading(false);
        return;
      }
      notifyError(
        "Tạo thất bại",
        extractLocalizedMessage(error, "Không thể tạo năng lực."),
      );
    }
    setActionLoading(false);
  };

  const filteredCompetencies = useMemo(() => {
    return competencies.filter((item) => {
      const matchesSearch =
        item.competencyCode
          .toLowerCase()
          .includes(competencySearchTerm.toLowerCase()) ||
        item.competencyName
          .toLowerCase()
          .includes(competencySearchTerm.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(competencySearchTerm.toLowerCase());
      const matchesStatus =
        competencyFilterStatus === "all" ||
        (competencyFilterStatus === "active" && item.isActive) ||
        (competencyFilterStatus === "inactive" && !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [competencies, competencySearchTerm, competencyFilterStatus]);

  const competencyColumns: ColumnsType<Competency> = [
    {
      title: "Năng lực",
      key: "competency",
      render: (_, record) => (
        <div>
          <div className="font-semibold">{record.competencyName}</div>
          <div className="text-xs text-gray-400">{record.competencyCode}</div>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (value: string | null | undefined) => value || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 150,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Đang hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin activeItem="manage-departments" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Quản trị
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản lý chuyên ngành
              </h1>
              <p className="text-sm text-gray-600">
                Quản lý chuyên ngành, trạng thái và thông tin chi tiết.
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                onClick={async () => {
                  await dispatch(fetchDepartments());
                  await fetchSubjectAreas();
                }}
                loading={loading || subjectLoading}
              >
                Làm mới
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined style={{ fontSize: 14 }} />}
                onClick={handleCreateDepartment}
              >
                Chuyên ngành mới
              </Button>
            </Space>
          </div>

          <SummaryMetrics
            items={summaryItems}
            columnsClassName="grid grid-cols-1 sm:grid-cols-3 gap-4"
          />

          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  Danh mục
                </p>
                <h2 className="text-lg font-bold text-gray-900">Chuyên ngành</h2>
              </div>
              <Space wrap>
                <Input
                  placeholder="Tìm theo mã, tên hoặc mô tả..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-64"
                  allowClear
                />
                <Select
                  value={filterStatus}
                  onChange={(val) => {
                    setFilterStatus(val);
                    setPage(1);
                  }}
                  style={{ width: 140 }}
                  options={[
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "active", label: "Đang hoạt động" },
                    { value: "inactive", label: "Không hoạt động" },
                  ]}
                />
                <Select
                  value={sortOrder}
                  onChange={(val) => {
                    setSortOrder(val);
                    setPage(1);
                  }}
                  style={{ width: 130 }}
                  options={[
                    { value: "newest", label: "Mới nhất" },
                    { value: "oldest", label: "Cũ nhất" },
                  ]}
                />
              </Space>
            </div>

            <ConfigProvider locale={viVN}>
              <Table
                columns={columns}
                dataSource={filteredDepartments}
                rowKey="departmentId"
                loading={loading}
                pagination={{
                  current: page,
                  pageSize,
                  total: filteredDepartments.length,
                  showSizeChanger: true,
                  showQuickJumper: false,
                  pageSizeOptions: ["10", "20", "50"],
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} trên tổng ${total} chuyên ngành`,
                  onChange: (p, ps) => {
                    setPage(p);
                    setPageSize(ps);
                  },
                }}
                locale={{
                  emptyText:
                    searchTerm || filterStatus !== "all"
                      ? "Không tìm thấy chuyên ngành phù hợp bộ lọc"
                      : "Chưa có chuyên ngành nào. Hãy tạo chuyên ngành đầu tiên để bắt đầu.",
                }}
              />
            </ConfigProvider>
          </Card>

        </div>
      </main>

      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDepartment(undefined);
        }}
        onSubmit={handleSubmitDepartment}
        initialData={selectedDepartment}
        isLoading={actionLoading}
      />

      <DepartmentSubjectAreasModal
        open={isDepartmentSubjectModalOpen}
        title={
          selectedDepartmentForSubject
            ? `Lĩnh vực môn học - ${selectedDepartmentForSubject.departmentName}`
            : "Lĩnh vực môn học"
        }
        loading={subjectLoading}
        searchTerm={subjectSearchTerm}
        filterStatus={subjectFilterStatus}
        page={subjectPage}
        pageSize={subjectPageSize}
        total={departmentSubjectAreas.length}
        dataSource={departmentSubjectAreas as any[]}
        columns={subjectColumns as any}
        onClose={() => {
          setIsDepartmentSubjectModalOpen(false);
          setSelectedDepartmentForSubject(undefined);
          setSubjectSearchTerm("");
          setSubjectFilterStatus("all");
          setSubjectFilterDepartmentId(undefined);
          setSubjectPage(1);
        }}
        onSearchChange={(value) => {
          setSubjectSearchTerm(value);
          setSubjectPage(1);
        }}
        onFilterStatusChange={(value) => {
          setSubjectFilterStatus(value);
          setSubjectPage(1);
        }}
        onRefresh={fetchSubjectAreas}
        onCreateNew={() =>
          selectedDepartmentForSubject &&
          handleCreateSubjectArea(selectedDepartmentForSubject)
        }
        onPageChange={(p, ps) => {
          setSubjectPage(p);
          setSubjectPageSize(ps);
        }}
      />

      <CompetencyListModal
        open={isCompetencyModalOpen}
        title={
          selectedSubjectForCompetency
            ? `Năng lực - ${selectedSubjectForCompetency.subjectName}`
            : "Năng lực"
        }
        loading={competencyLoading}
        searchTerm={competencySearchTerm}
        filterStatus={competencyFilterStatus}
        page={competencyPage}
        pageSize={competencyPageSize}
        total={filteredCompetencies.length}
        dataSource={filteredCompetencies as any[]}
        columns={competencyColumns as any}
        onClose={() => {
          setIsCompetencyModalOpen(false);
          setSelectedSubjectForCompetency(undefined);
          setCompetencies([]);
          setCompetencySearchTerm("");
          setCompetencyFilterStatus("all");
          setCompetencyPage(1);
        }}
        onSearchChange={(value) => {
          setCompetencySearchTerm(value);
          setCompetencyPage(1);
        }}
        onFilterStatusChange={(value) => {
          setCompetencyFilterStatus(value);
          setCompetencyPage(1);
        }}
        onRefresh={() =>
          selectedSubjectForCompetency &&
          fetchCompetencies(selectedSubjectForCompetency.subjectAreaId)
        }
        onCreateNew={handleOpenCreateCompetency}
        onPageChange={(p, ps) => {
          setCompetencyPage(p);
          setCompetencyPageSize(ps);
        }}
      />

      <SubjectAreaFormModal
        open={isSubjectModalOpen}
        isEditing={!!selectedSubjectArea}
        loading={actionLoading}
        form={subjectAreaForm}
        departments={departments}
        disableDepartmentSelect={!!selectedDepartmentForSubject}
        onCancel={() => {
          setIsSubjectModalOpen(false);
          setSelectedSubjectArea(undefined);
          subjectAreaForm.resetFields();
        }}
        onSubmit={handleSubmitSubjectArea}
      />

      <CompetencyFormModal
        open={isCompetencyFormModalOpen}
        loading={actionLoading}
        form={competencyForm}
        onCancel={() => {
          setIsCompetencyFormModalOpen(false);
          competencyForm.resetFields();
        }}
        onSubmit={handleSubmitCompetency}
      />
    </div>
  );
};

export default AdminDepartmentPage;
