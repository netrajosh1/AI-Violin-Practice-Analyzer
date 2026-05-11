import { useState } from 'react';
import { AudioUploader } from './components/AudioUploader';
import { PitchGraph } from './components/PitchGraph';

function App() {
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
            AI Violin Practice Analyzer
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Upload your violin recording for instant, AI-powered intonation analysis. Get real-time feedback on your pitch accuracy.
          </p>
        </div>

        {/* Uploader Section */}
        <div className="max-w-2xl mx-auto">
          <AudioUploader onAnalysisComplete={handleAnalysisComplete} />
        </div>

        {/* Results Section */}
        {analysisData && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <PitchGraph 
              data={analysisData.graph_data} 
              averageDeviation={analysisData.average_deviation_cents}
              absAverageDeviation={analysisData.absolute_average_deviation_cents}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
