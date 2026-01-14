import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavItem from "./NavItem";
import Button from "./Button";

const Nav: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsMenuOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <nav
                className={`bg-white sticky top-0 z-50 px-2 transition-all duration-300 ${scrolled ? "shadow-lg" : "shadow-sm"
                    }`}
            >
                <div className="flex items-center p-4 max-w-[1984px] mx-auto">
                    <div className="flex gap-2 items-center">
                        <img
                            className="mt-1"
                            src="/yoodli_logo.svg"
                            alt="OratorAI Logo"
                            width={30}
                            height={30}
                        />
                        <span className="hidden xl:block font-semibold text-lg">
                            OratorAI
                        </span>
                    </div>

                    <button
                        className="flex flex-col lg:hidden ml-auto gap-2 bg-white"
                        onClick={toggleMenu}
                    >
                        <span className="w-[30px] h-[3px] rounded-sm bg-gradient-to-r from-sky-500 to-indigo-500" />
                        <span
                            className={`h-[3px] rounded-sm bg-gradient-to-r from-sky-500 to-indigo-500 ml-auto duration-500 ease-out ${isMenuOpen ? "w-[30px]" : "w-[15px]"
                                }`}
                        />
                    </button>

                    <div className="hidden lg:flex items-center w-full">
                        <div className="flex space-x-6 lg:space-x-12 ml-10">
                            <NavItem
                                text="FOR BUSINESS"
                                more={[
                                    "GTM Enablement",
                                    "Learning & Development",
                                    "Partner Enablement",
                                    "Corporate Communications",
                                ]}
                            />
                            <NavItem text="PRICING" />
                            <NavItem
                                text="ABOUT"
                                more={["Our Team", "Careers", "AI Roleplays", "FAQ"]}
                            />
                            <NavItem
                                text="USE CASES"
                                more={[
                                    "Conversation Roleplays",
                                    "Interview Preparation",
                                    "Presentation Practice",
                                    "Online Meetings",
                                ]}
                            />
                            <NavItem
                                text="RESOURCES"
                                more={[
                                    "Blog",
                                    "Our Partnerships",
                                    "Press",
                                    "Help Center",
                                    "Sample Speeches",
                                    "Community",
                                    "Trust Center",
                                ]}
                            />
                        </div>
                        <div className="flex space-x-2 lg:space-x-4 ml-auto">
                            <Button
                                text="Sign In"
                                variant="tertiary"
                                onClick={() => navigate("/login")}
                            />
                            <Button text="Get OratorAI" variant="primary" />
                            <Button text="Talk to Sales" variant="secondary" />
                        </div>
                    </div>
                </div>
            </nav>

            <div
                className={`${isMenuOpen ? "translate-x-[0]" : "translate-x-[100%]"
                    } fixed pt-24 top-0 right-0 shadow-2xl z-40 transform p-[32px] duration-700 ease-in-out w-[320px] max-w-screen bg-white h-screen flex flex-col items-center lg:hidden`}
            >
                <div className="w-full flex flex-col space-y-8 ml-4">
                    <NavItem
                        text="FOR BUSINESS"
                        more={[
                            "GTM Enablement",
                            "Learning & Development",
                            "Partner Enablement",
                            "Corporate Communications",
                        ]}
                    />
                    <NavItem text="PRICING" />
                    <NavItem
                        text="ABOUT"
                        more={["Our Team", "Careers", "AI Roleplays", "FAQ"]}
                    />
                    <NavItem
                        text="USE CASES"
                        more={[
                            "Conversation Roleplays",
                            "Interview Preparation",
                            "Presentation Practice",
                            "Online Meetings",
                        ]}
                    />
                    <NavItem
                        text="RESOURCES"
                        more={[
                            "Blog",
                            "Our Partnerships",
                            "Press",
                            "Help Center",
                            "Sample Speeches",
                            "Community",
                            "Trust Center",
                        ]}
                    />
                </div>
                <div className="mt-10 flex flex-col w-full space-y-4">
                    <Button
                        text="Sign In"
                        variant="tertiary"
                        onClick={() => {
                            setIsMenuOpen(false);
                            navigate("/login");
                        }}
                    />
                    <Button text="Get OratorAI" variant="primary" />
                    <Button text="Talk to Sales" variant="secondary" />
                </div>
            </div>
        </>
    );
};

export default Nav;

