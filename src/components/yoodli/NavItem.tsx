import React from "react";

type NavItemProps = {
  text: string;
  more?: string[];
};

// Đơn giản hóa: giữ layout, bỏ framer-motion
const NavItem: React.FC<NavItemProps> = ({ text, more }) => {
  return (
    <div className="navMain relative w-fit text-stone-900 hover:text-indigo-500">
      <div className="navItem w-fit relative font-[500] text-[13px] md:text-[12px] lg:text-[13px] text-[inherit] cursor-pointer duration-100">
        {text}
      </div>
      {more && (
        <div className="navItemMore left-[50%] absolute bg-white shadow-xl rounded-xl flex flex-col w-max overflow-hidden z-10">
          {more.map((item, index) => (
            <div
              key={index}
              className="text-[10px] md:text-[16px] text-stone-900 duration-200 bg-white hover:bg-blue-50 px-3 md:px-7 py-2 md:py-3 cursor-pointer"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavItem;

