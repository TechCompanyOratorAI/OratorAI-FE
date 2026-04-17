import React from "react";
import ScrollAnimation from "../yoodli/ScrollAnimation";

const FooterSection = ({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string }[];
}) => (
  <ScrollAnimation>
    <div className="flex flex-col space-y-4">
      <h3 className="font-semibold text-gray-700 uppercase">{title}</h3>
      <div className="flex flex-col space-y-3">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  </ScrollAnimation>
);

const Footer: React.FC = () => {
  const businessLinks = [
    { name: "Hỗ trợ triển khai", href: "#" },
    { name: "Đào tạo & phát triển", href: "#" },
    { name: "Hỗ trợ đối tác", href: "#" },
    { name: "Truyền thông nội bộ", href: "#" },
    { name: "Lãnh đạo", href: "#" },
    { name: "Kỹ thuật", href: "#" },
  ];

  const aboutLinks = [
    { name: "Đội ngũ", href: "#" },
    { name: "Tuyển dụng", href: "#" },
    { name: "Mô phỏng AI", href: "#" },
    { name: "Câu hỏi thường gặp", href: "#" },
    { name: "Hội thảo", href: "#" },
    { name: "Trạng thái hệ thống", href: "#" },
    { name: "Thông báo tính năng", href: "#" },
    { name: "Danh bạ huấn luyện viên", href: "#" },
    { name: "Thuật ngữ", href: "#" },
  ];

  const useCasesLinks = [
    { name: "Mô phỏng hội thoại", href: "#" },
    { name: "Luyện phỏng vấn", href: "#" },
    { name: "Luyện thuyết trình", href: "#" },
    { name: "Họp trực tuyến", href: "#" },
    { name: "Toastmasters", href: "#" },
    { name: "Huấn luyện viên diễn thuyết", href: "#" },
  ];

  const resourcesLinks = [
    { name: "Blog", href: "#" },
    { name: "Đối tác", href: "#" },
    { name: "Báo chí", href: "#" },
    { name: "Trung tâm trợ giúp", href: "#" },
    { name: "Bài nói mẫu", href: "#" },
    { name: "Cộng đồng", href: "#" },
    { name: "Trung tâm tin cậy", href: "#" },
    { name: "Đại sứ", href: "#" },
    { name: "Khóa học", href: "#" },
    { name: "Video hướng dẫn", href: "#" },
  ];

  return (
    <footer className="bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <FooterSection
            title="CHO TỔ CHỨC"
            links={businessLinks}
          />
          <FooterSection title="GIỚI THIỆU" links={aboutLinks} />
          <FooterSection
            title="KỊCH BẢN ỨNG DỤNG"
            links={useCasesLinks}
          />
          <FooterSection
            title="TÀI NGUYÊN"
            links={resourcesLinks}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="flex space-x-4">
            <a
              href="https://linkedin.com"
              className="text-gray-600 hover:text-blue-600"
            >
              LinkedIn
            </a>
            <a
              href="https://twitter.com"
              className="text-gray-600 hover:text-blue-400"
            >
              Twitter
            </a>
            <a
              href="https://youtube.com"
              className="text-gray-600 hover:text-red-600"
            >
              YouTube
            </a>
          </div>

          <div className="flex flex-col md:flex-row gap-4 text-sm">
            <a
              href="#"
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <span className="text-black font-medium">Xem bảng giá</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <span className="text-black font-medium">Liên hệ tư vấn</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <span className="text-black font-medium">Tham gia cộng đồng</span>
            </a>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} OratorAI.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-600 transition-colors">
              Liên hệ
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Điều khoản dịch vụ
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Tùy chọn cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

