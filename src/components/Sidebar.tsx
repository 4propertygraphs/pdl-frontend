// import { FaHome } from "react-icons/fa};
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CiViewTable } from "react-icons/ci";
import { MdLogout } from "react-icons/md";
import { BiGitCompare } from "react-icons/bi"; // Add this import for field mapping icon

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activePage = location.pathname;
    const isLoggedIn = !!localStorage.getItem('token');


    const handleLogout = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            localStorage.removeItem('token');
            navigate('/login', { replace: true });
        }
    };

    return (
        <>
            {/* Desktop/Tablet Sidebar - Now fixed position */}
            <aside className="hidden sm:block fixed left-0 top-0 bg-white dark:bg-gray-900 w-64 h-screen p-4 shadow-lg z-10 overflow-y-auto">
                <img className='block dark:hidden mb-4 w-32 h-auto' src="https://4pm.ie/assets/4property-logo-black.png" alt="4Property Logo" />
                <img className='hidden dark:block mb-4 w-32 h-auto' src="https://www.4property.com/wp-content/uploads/2019/10/4property-logo.png" alt="4Property Logo" />
                <ul className="space-y-2">
                    {/* <li>
                        <Link
                            to="/dashboard"
                            className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/dashboard' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300 '}`}
                        >
                            <FaHome size={20} />
                            <span>Dashboard</span>
                        </Link>
                    </li> */}
                    <li>
                        <Link
                            to='/agencies'
                            className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/agencies' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300 '}`}
                        >


                            <CiViewTable size={20} />
                            <span>Agencies</span>
                        </Link>
                    </li>

                    {!isLoggedIn && (
                        <li>
                            <Link
                                to='/login'
                                className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/login' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500 dark:text-gray-300'}`}
                            >
                                <MdLogout size={20} />
                                <span>Login</span>
                            </Link>
                        </li>
                    )}
                    {isLoggedIn && (
                        <>


                            <li>
                                <Link to='/field-mappings' className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/field-mappings' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300'}`}>
                                    <BiGitCompare size={20} />
                                    <span>Field Mapping</span>
                                </Link>
                            </li>

                            <li>
                                <button
                                    onClick={handleLogout}
                                    className={`w-full text-left rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/logout' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300'}`}
                                >
                                    <MdLogout size={20} />
                                    <span>Logout</span>
                                </button>
                            </li>
                        </>
                    )}

                </ul>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center py-2 sm:hidden shadow-lg"
            >
                <Link
                    to="/agencies"
                    className={`flex flex-col items-center text-xs ${activePage === '/agencies' ? 'text-purple-600' : 'text-gray-500 dark:text-gray-300'}`}
                >
                    <CiViewTable size={24} />
                    <span>Agencies</span>
                </Link>
                {isLoggedIn && (
                    <Link
                        to="/field-mappings"
                        className={`flex flex-col items-center text-xs ${activePage === '/field-mappings' ? 'text-purple-600' : 'text-gray-500 dark:text-gray-300'}`}
                    >
                        <BiGitCompare size={24} />
                        <span>Mapping</span>
                    </Link>
                )}
                {!isLoggedIn ? (
                    <Link
                        to="/login"
                        className={`flex flex-col items-center text-xs ${activePage === '/login' ? 'text-purple-600' : 'text-gray-500 dark:text-gray-300'}`}
                    >
                        <MdLogout size={24} />
                        <span>Login</span>
                    </Link>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center text-xs text-gray-500 dark:text-gray-300"
                    >
                        <MdLogout size={24} />
                        <span>Logout</span>
                    </button>
                )}
            </nav>
        </>
    );
};

export default Sidebar;