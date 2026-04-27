import React from "react";
import {
  Button,
  ConfigProvider,
  Input,
  Modal,
  Select,
  Space,
  Table,
} from "antd";
import viVN from "antd/locale/vi_VN";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface CompetencyListModalProps {
  open: boolean;
  title: string;
  loading: boolean;
  searchTerm: string;
  filterStatus: "all" | "active" | "inactive";
  page: number;
  pageSize: number;
  total: number;
  dataSource: any[];
  columns: ColumnsType<any>;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onFilterStatusChange: (value: "all" | "active" | "inactive") => void;
  onRefresh: () => void;
  onCreateNew: () => void;
  onPageChange: (page: number, pageSize: number) => void;
}

const CompetencyListModal: React.FC<CompetencyListModalProps> = ({
  open,
  title,
  loading,
  searchTerm,
  filterStatus,
  page,
  pageSize,
  total,
  dataSource,
  columns,
  onClose,
  onSearchChange,
  onFilterStatusChange,
  onRefresh,
  onCreateNew,
  onPageChange,
}) => {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1080}
      destroyOnClose
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <Space wrap>
          <Input
            placeholder="Tìm theo mã, tên hoặc mô tả năng lực..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-80"
            allowClear
          />
          <Select
            value={filterStatus}
            onChange={onFilterStatusChange}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "active", label: "Đang hoạt động" },
              { value: "inactive", label: "Không hoạt động" },
            ]}
          />
        </Space>
        <Space>
          <Button
            icon={<ReloadOutlined style={{ fontSize: 14 }} />}
            onClick={onRefresh}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined style={{ fontSize: 14 }} />}
            onClick={onCreateNew}
          >
            Năng lực mới
          </Button>
        </Space>
      </div>

      <ConfigProvider locale={viVN}>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="competencyId"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: false,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (all, range) =>
              `${range[0]}-${range[1]} trên tổng ${all} năng lực`,
            onChange: onPageChange,
          }}
          locale={{
            emptyText:
              searchTerm || filterStatus !== "all"
                ? "Không tìm thấy năng lực phù hợp bộ lọc"
                : "Chưa có năng lực nào trong lĩnh vực này.",
          }}
        />
      </ConfigProvider>
    </Modal>
  );
};

export default CompetencyListModal;
