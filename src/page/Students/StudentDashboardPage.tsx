import React, { useState, useEffect, useMemo } from "react";
import { toast } from "@/lib/toast";
import { Input, Tag, Typography, ConfigProvider, Pagination } from "antd";
import {
  Search,
  BookText,
  GraduationCap,
  Zap,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/services/store/store";
import { fetchCourses } from "@/services/features/course/courseSlice";
import { fetchDepartments } from "@/services/features/admin/adminSlice";
import {
  fetchEnrolledClasses,
} from "@/services/features/enrollment/enrollmentSlice";
import StudentLayout from "@/components/StudentLayout/StudentLayout";
import DepartmentBrowserModal from "@/components/Department/DepartmentBrowserModal";
import EnrollModal from "@/components/Department/EnrollModal";
import type { ClassItem } from "@/components/Department/DepartmentBrowserModal";

const { Title, Text } = Typography;

const StudentDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const { departments, departmentPagination, loading: deptLoading } = useAppSelector(
    (state) => state.admin,
  );
  const {
    courses,
    error: courseError,
  } = useAppSelector((state) => state.course);
  const { classes: apiClasses, loading: classLoading, coursePagination: classPagination } =
    useAppSelector((state) => state.class);
  const { enrolledClassIds } = useAppSelector((state) => state.enrollment);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [deptModal, setDeptModal] = useState<{
    open: boolean;
    dept: (typeof departments)[0] | null;
    gradientIdx: number;
  }>({ open: false, dept: null, gradientIdx: 0 });

  const [enrollModal, setEnrollModal] = useState<{
    open: boolean;
    classItem: ClassItem | null;
  }>({ open: false, classItem: null });

  const [quickJoinOpen, setQuickJoinOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments({ page: currentPage, limit: 10 }));
    dispatch(fetchEnrolledClasses());
  }, [dispatch, currentPage]);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (courseError) toast.error(courseError);
  }, [courseError]);

  const coursesByDept = useMemo(() => {
    const map: Record<number, typeof courses> = {};
    courses.forEach((c) => {
      if (!map[c.departmentId]) map[c.departmentId] = [];
      map[c.departmentId].push(c);
    });
    return map;
  }, [courses]);

  const filteredDepts = useMemo(() => {
    const q = searchText.toLowerCase();
    return departments.filter((d) => {
      if (!d.isActive) return false;
      if (q) {
        const deptMatch =
          d.departmentName.toLowerCase().includes(q) ||
          d.departmentCode.toLowerCase().includes(q);
        if (!deptMatch) {
          const deptCourses = coursesByDept[d.departmentId] || [];
          return deptCourses.some(
            (c) =>
              c.courseName.toLowerCase().includes(q) ||
              c.courseCode.toLowerCase().includes(q),
          );
        }
      }
      return true;
    });
  }, [departments, searchText, coursesByDept]);

  const openDeptModal = (dept: (typeof departments)[0], idx: number) => {
    setDeptModal({ open: true, dept, gradientIdx: idx });
  };

  const closeDeptModal = () => {
    setDeptModal({ open: false, dept: null, gradientIdx: 0 });
  };

  const openEnroll = (classItem: ClassItem) => {
    setEnrollModal({ open: true, classItem });
  };

  const closeEnroll = () => {
    setEnrollModal({ open: false, classItem: null });
  };

  const BRAND_GRADIENT = "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)";

  return (
    <StudentLayout>
      <ConfigProvider componentSize="large">
        <div style={{ fontFamily: "'Poppins', sans-serif", background: "#fff", minHeight: "100vh" }}>
          <div style={{ maxWidth: 1480, margin: "0 auto", padding: "32px 24px" }}>
            <div style={{ marginBottom: 24 }}>
              <Title
                level={2}
                style={{ margin: 0, fontWeight: 700, color: "#1F2937", fontSize: 26 }}
              >
                Khóa học
              </Title>
              <Text style={{ color: "#6B7280", fontSize: 15 }}>
                Khám phá các chuyên ngành và môn học phù hợp với bạn
              </Text>
            </div>

            <Input
              size="large"
              placeholder="Tìm kiếm chuyên ngành, môn học..."
              prefix={<Search style={{ color: "#1da9e6", width: 18, height: 18 }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{
                borderRadius: 12,
                height: 48,
                border: "2px solid #1da9e6",
                fontSize: 15,
                boxShadow: "0 2px 8px rgba(29,169,230,0.08)",
                marginBottom: 20,
              }}
            />

            {/* Quick Join Banner */}
            <div
              onClick={() => setQuickJoinOpen(true)}
              style={{
                background: "linear-gradient(135deg, #1da9e6 0%, #6966fe 100%)",
                borderRadius: 14,
                padding: "14px 20px",
                marginBottom: 28,
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(29,169,230,0.25)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              className="hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Zap style={{ width: 22, height: 22, color: "white" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  Tham gia lớp nhanh
                </span>
                <span
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.82)",
                    fontSize: 12,
                  }}
                >
                  Nhập mã do giảng viên cung cấp — không cần tìm kiếm lớp
                </span>
              </div>
              <span
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 8,
                  letterSpacing: 0.5,
                  flexShrink: 0,
                }}
              >
                ORA-XXXX-XXXX-XXXX
              </span>
            </div>

            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: 700, color: "#1F2937" }}>
                Các chuyên ngành
              </Text>
              <Tag
                style={{
                  borderRadius: 20,
                  fontSize: 11,
                  padding: "1px 10px",
                  background: "#EEF2FF",
                  border: "1px solid #C7D2FE",
                  color: "#4F46E5",
                  fontWeight: 600,
                }}
              >
                {filteredDepts.length} chuyên ngành
              </Tag>
            </div>

            {deptLoading ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 20,
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 280,
                      background: "#F9FAFB",
                      borderRadius: 12,
                      border: "1px solid #E5E7EB",
                    }}
                  />
                ))}
              </div>
            ) : filteredDepts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 20px",
                  background: "white",
                  borderRadius: 14,
                  border: "1px solid #E5E7EB",
                }}
              >
                <BookText
                  style={{ width: 40, height: 40, color: "#D1D5DB", margin: "0 auto 10px" }}
                />
                <Text style={{ fontSize: 14, color: "#9CA3AF", display: "block" }}>
                  Không tìm thấy chuyên ngành nào
                </Text>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 20,
                  }}
                >
                  {filteredDepts.map((dept, idx) => {
                    const deptCoursesCount = (coursesByDept[dept.departmentId] || []).length;
                    const gradient = BRAND_GRADIENT;
                    return (
                      <div
                        key={dept.departmentId}
                        onClick={() => openDeptModal(dept, idx)}
                        style={{
                          background: "white",
                          borderRadius: 12,
                          border: "1px solid #E5E7EB",
                          overflow: "hidden",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                        className="hover:shadow-lg hover:-translate-y-1"
                      >
                        <div
                          style={{
                            background: gradient,
                            height: 160,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            gap: 8,
                          }}
                        >
                          <GraduationCap
                            style={{ width: 36, height: 36, color: "rgba(255,255,255,0.7)" }}
                          />
                          <span
                            style={{
                              fontSize: 22,
                              fontWeight: 800,
                              color: "white",
                              letterSpacing: 1,
                              textShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                          >
                            {dept.departmentCode}
                          </span>
                          <div
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              background: "rgba(255,255,255,0.25)",
                              backdropFilter: "blur(4px)",
                              borderRadius: 20,
                              padding: "2px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "white",
                            }}
                          >
                            {deptCoursesCount} môn
                          </div>
                        </div>

                        <div style={{ padding: "14px 16px 16px" }}>
                          <Text
                            strong
                            style={{
                              fontSize: 14,
                              color: "#1F2937",
                              display: "block",
                              lineHeight: 1.45,
                              marginBottom: 12,
                              minHeight: 42,
                            }}
                          >
                            {dept.departmentName}
                          </Text>
                          <Tag
                            style={{
                              borderRadius: 20,
                              fontSize: 11,
                              padding: "2px 12px",
                              background: "#EEF2FF",
                              border: "1px solid #C7D2FE",
                              color: "#6366F1",
                              fontWeight: 600,
                            }}
                          >
                            Chuyên ngành
                          </Tag>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {departmentPagination.total > 10 && (
                  <Pagination
                    current={currentPage}
                    pageSize={10}
                    total={departmentPagination.total}
                    onChange={(p) => setCurrentPage(p)}
                    showSizeChanger={false}
                    showTotal={(total) => `Tổng ${total} chuyên ngành`}
                    style={{ textAlign: "center", marginTop: 24 }}
                  />
                )}
              </>
            )}
          </div>

          <DepartmentBrowserModal
            open={deptModal.open}
            department={deptModal.dept}
            courses={courses}
            coursesByDept={coursesByDept}
            apiClasses={apiClasses}
            enrolledClassIds={enrolledClassIds}
            classLoading={classLoading}
            classPagination={classPagination}
            onClose={closeDeptModal}
            onEnroll={openEnroll}
          />

          <EnrollModal
            open={enrollModal.open}
            classData={enrollModal.classItem}
            onClose={closeEnroll}
          />

          {/* Quick Join Modal — classData=null triggers quick-join mode */}
          <EnrollModal
            open={quickJoinOpen}
            classData={null}
            onClose={() => {
              setQuickJoinOpen(false);
              dispatch(fetchEnrolledClasses());
            }}
          />
        </div>
      </ConfigProvider>
    </StudentLayout>
  );
};

export default StudentDashboardPage;
