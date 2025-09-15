import { useNavigate } from 'react-router-dom';

function Nopage() {
    const navigate = useNavigate();

    const goToDashboard = () => {
        navigate('/agencies');
    };

    return (
        <div className="p-6 min-h-screen flex items-center justify-center">
            <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6 w-full max-w-md text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-300 mb-4">Page Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Sorry, the page you are looking for does not exist.
                </p>
                <button
                    onClick={goToDashboard}
                    className="cursor-pointer bg-purple-500 text-white font-semibold py-2 px-4 rounded hover:bg-purple-600"
                >
                    Go back
                </button>
            </div>
        </div>
    );
}

export default Nopage;
