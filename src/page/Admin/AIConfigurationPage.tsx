import React from "react";
import SidebarAdmin from "@/components/Sidebar/SidebarAdmin/SidebarAdmin";

const AIConfigurationPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarAdmin activeItem="ai-configuration" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Cấu hình AI
          </h1>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <p className="text-gray-600">Trang cấu hình AI sẽ sớm được cập nhật...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIConfigurationPage;

