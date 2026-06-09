import { useLocation } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    
    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-white">
            <div className="p-4">
                <BackButton to="/" label="Back" />
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-slate-500">404</h1>
                        <div className="h-0.5 w-16 bg-slate-700 mx-auto"></div>
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-white">
                            Page Not Found
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            The page <span className="font-medium text-slate-300">"{pageName}"</span> could not be found.
                        </p>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}
