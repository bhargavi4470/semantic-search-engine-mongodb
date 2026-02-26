import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Loader2, Search } from 'lucide-react';
import Tesseract from 'tesseract.js';

export default function CameraScanner({ onScanComplete, onClose }) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [scanResult, setScanResult] = useState('');
    const [error, setError] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
                setError(null);
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Failed to access camera. Please ensure permissions are granted.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsStreaming(false);
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const captureImage = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg');
            setCapturedImage(imageData);
            stopCamera();
        }
    };

    const performOCR = async () => {
        if (!capturedImage) return;
        setIsScanning(true);
        try {
            const { data: { text } } = await Tesseract.recognize(
                capturedImage,
                'eng',
                { logger: m => console.log(m) }
            );
            setScanResult(text);
        } catch (err) {
            console.error("OCR error:", err);
            setError("Failed to scan text. Please try again with a clearer image.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setScanResult('');
        startCamera();
    };

    const handleConfirm = () => {
        onScanComplete(scanResult);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl transition-colors duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Camera className="h-5 w-5" />
                        </div>
                        Vision Scanner
                    </h3>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Camera View / Preview */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {!capturedImage ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            {/* Scanner Overlay HUD */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-8 border-2 border-indigo-500/30 rounded-lg">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />
                                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-indigo-500/20 animate-scan-line" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-6 text-center">
                            <X className="h-12 w-12 text-red-500 mb-4" />
                            <p className="text-white font-medium">{error}</p>
                            <button onClick={startCamera} className="mt-4 px-6 py-2 bg-indigo-600 rounded-xl text-white font-bold">Try Again</button>
                        </div>
                    )}

                    {isScanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80">
                            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
                            <p className="text-white font-medium animate-pulse">Extracting text with AI...</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-8 bg-white dark:bg-slate-900 text-center">
                    {!capturedImage && isStreaming && (
                        <div className="flex flex-col items-center gap-6">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Align document within frame</p>
                            <button
                                onClick={captureImage}
                                className="h-24 w-24 rounded-full border-8 border-slate-100 dark:border-slate-800 p-1 hover:scale-105 transition-all duration-300 shadow-2xl"
                            >
                                <div className="h-full w-full rounded-full bg-indigo-600 shadow-inner flex items-center justify-center text-white">
                                    <div className="h-12 w-12 rounded-full border-4 border-white/30" />
                                </div>
                            </button>
                        </div>
                    )}

                    {capturedImage && !isScanning && (
                        <div className="space-y-6 text-left">
                            {scanResult ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block px-1">SCANNED TEXT RESULT</label>
                                        <div className="max-h-48 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2rem] text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                                            {scanResult}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={handleRetake}
                                            className="py-4 px-6 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Retake
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="py-4 px-6 bg-indigo-600 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                                        >
                                            <Check className="h-4 w-4" />
                                            Use Result
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleRetake}
                                        className="py-4 px-6 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Retake
                                    </button>
                                    <button
                                        onClick={performOCR}
                                        className="py-4 px-6 bg-indigo-600 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                                    >
                                        <Search className="h-4 w-4" />
                                        Extract Text
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes scan-line {
          0% { transform: translateY(-50px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(150px); opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s infinite linear;
        }
      `}} />
        </div>
    );
}
