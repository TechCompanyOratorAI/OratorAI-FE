import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Tag, Space, Typography, Empty, Spin } from "antd";
import {
  BookOpen,
  Users,
  RefreshCw,
} from "lucide-react";
import SidebarInstructor from "@/components/Sidebar/SidebarInstructor/SidebarInstructor";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchClassesByInstructor } from "@/services/features/admin/classSlice";

const { Text } = Typography;

const InstructorStudentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { classes, loading, pagination } = useAppSelector(
    (state) => state.class,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    dispatch(
      fetchClassesByInstructor({ page: currentPage, limit: pageSize }),
    );
  }, [dispatch, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil((pagination?.total || classes.length || 0) / pageSize) || 1,
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarInstructor activeItem="students" />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Instructor
              </Text>
              <h1 className="text-2xl font-bold text-gray-900">
                Danh sách lớp học
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Chọn một lớp để xem điểm và tiến độ của sinh viên
              </p>
            </div>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() =>
                dispatch(fetchClassesByInstructor({ page: currentPage, limit: pageSize }))
              }
              loading={loading}
            >
              Làm mới
            </Button>
          </div>

          {/* Loading */}
          {loading && classes.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <Spin size="large" />
            </div>
          )}

          {/* Empty */}
          {!loading && classes.length === 0 && (
            <Card>
              <Empty
                description={
                  <span className="text-gray-500">
                    Bạn chưa được phân công giảng dạy lớp nào.
                  </span>
                }
              />
            </Card>
          )}

          {/* Class cards grid */}
          {classes.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <Card
                    key={cls.classId}
                    hoverable
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/instructor/class/${cls.classId}/students`)
                    }
                  >
                    <Space direction="vertical" className="w-full" size={4}>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <Tag color={cls.status === "active" ? "green" : "default"}>
                          {cls.status === "active" ? "Hoạt động" : "Lưu trữ"}
                        </Tag>
                      </div>

                      <div>
                        <Text strong className="text-base">
                          {cls.classCode}
                        </Text>
                        <div className="text-sm text-gray-500">
                          {cls.course?.courseName ?? ""}
                        </div>
                        {cls.course?.courseCode && (
                          <Tag color="blue" className="mt-1">
                            {cls.course.courseCode}
                          </Tag>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                        <Space>
                          <Users size={14} />
                          <span>
                            {cls.enrollmentCount ?? cls.enrollments?.length ?? 0} Sinh viên
                          </span>
                        </Space>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <Text type="secondary" className="text-xs">
                          Xem điểm &amp; tiến độ →
                        </Text>
                      </div>
                    </Space>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center">
                  <Space>
                    <Button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Trước
                    </Button>
                    <Text>
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sau
                    </Button>
                  </Space>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default InstructorStudentsPage;