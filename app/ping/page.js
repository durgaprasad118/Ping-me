export const dynamic = 'force-dynamic';

export default async function PingStatusPage() {
    try {
        const res = await fetch(`${process.env.BASE_URL}/api/ping-dbs`, {
            cache: 'no-store'
        });

        const data = await res.json();

        if (!data.ok) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h1>
                            <p className="text-gray-600 mb-4">Unable to reach database services</p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-700 text-sm">{data.error}</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const totalDbs = data.results.length;
        const onlineDbs = data.results.filter(r => r.status === 'success').length;
        const offlineDbs = totalDbs - onlineDbs;

        return (
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">Database Monitor</h1>
                        <p className="text-slate-400 mb-4">Real-time connectivity status</p>
                        <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-slate-300 text-sm">Last checked: {new Date(data.timestamp).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Total Databases</p>
                                    <p className="text-3xl font-bold text-white">{totalDbs}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Online</p>
                                    <p className="text-3xl font-bold text-green-400">{onlineDbs}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Offline</p>
                                    <p className="text-3xl font-bold text-red-400">{offlineDbs}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.results.map((result, index) => (
                            <div
                                key={index}
                                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-1">
                                            {result.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${
                                                result.status === 'success' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                                            }`}></div>
                                            <span className={`text-sm font-medium ${
                                                result.status === 'success' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {result.status === 'success' ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        result.status === 'success' 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {result.status === 'success' ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                    </div>
                                </div>

                                <div className={`px-3 py-2 rounded-lg text-sm ${
                                    result.status === 'success'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                    {result.status === 'success' ? 'Connection Successful' : 'Connection Failed'}
                                </div>

                                {result.status === 'error' && (
                                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <p className="text-red-400 text-xs">{result.message}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2 border border-slate-700">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-slate-400 text-sm">Automated monitoring prevents database auto-shutdown</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (e) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">System Error</h1>
                        <p className="text-gray-600 mb-4">Unable to load monitoring dashboard</p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-700 text-sm">{e.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
