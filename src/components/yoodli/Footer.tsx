import React from "react";
import ScrollAnimation from "./ScrollAnimation";

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
    { name: "GTM Enablement", href: "#" },
    { name: "Learning & Development", href: "#" },
    { name: "Partner Enablement", href: "#" },
    { name: "Corporate Communications", href: "#" },
    { name: "Leadership", href: "#" },
    { name: "Engineering", href: "#" },
  ];

  const aboutLinks = [
    { name: "Our Team", href: "#" },
    { name: "Careers", href: "#" },
    { name: "AI Roleplays", href: "#" },
    { name: "FAQ", href: "#" },
    { name: "Webinars", href: "#" },
    { name: "Status", href: "#" },
    { name: "Feature Announcements", href: "#" },
    { name: "Coach Directory", href: "#" },
    { name: "Glossary", href: "#" },
  ];

  const useCasesLinks = [
    { name: "Conversation Roleplays", href: "#" },
    { name: "Interview Preparation", href: "#" },
    { name: "Presentation Practice", href: "#" },
    { name: "Online Meetings", href: "#" },
    { name: "Toastmasters", href: "#" },
    { name: "Speech Coaches", href: "#" },
  ];

  const resourcesLinks = [
    { name: "Blog", href: "#" },
    { name: "Our Partnerships", href: "#" },
    { name: "Press", href: "#" },
    { name: "Help Center", href: "#" },
    { name: "Sample Speeches", href: "#" },
    { name: "Community", href: "#" },
    { name: "Trust Center", href: "#" },
    { name: "Ambassadors", href: "#" },
    { name: "Courses", href: "#" },
    { name: "Video Tutorials", href: "#" },
  ];

  return (
    <footer className="bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <FooterSection
            title="FOR BUSINESS"
            links={businessLinks}
          />
          <FooterSection title="ABOUT" links={aboutLinks} />
          <FooterSection
            title="USE CASES"
            links={useCasesLinks}
          />
          <FooterSection
            title="RESOURCES"
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
              <span className="text-black font-medium">See pricing plans</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <span className="text-black font-medium">Talk to Sales</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-blue-500 transition-colors"
            >
              <span className="text-black font-medium">Join our community</span>
            </a>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} OratorAI.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-blue-600 transition-colors">
              Contact Us
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Cookie Preferences
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

