import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Camera, Zap, Loader2Icon } from 'lucide-react';
import { Button } from './ui/button';
import useTransactionStore from '@/store/transactionStore';
import runChat from '@/service/gemini';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog";

const ImageDropzone = ({ isFormVisible }) => {

    const image = useTransactionStore((state) => state.image);
    const setImage = useTransactionStore((state) => state.setImage);
    const setFormState = useTransactionStore((state) => state.setFormState);
    const setIsConfirmOpen = useTransactionStore((state) => state.setIsConfirmOpen);
    const isCameraOpen = useTransactionStore((state) => state.isCameraOpen);
    const setIsCameraOpen = useTransactionStore((state) => state.setIsCameraOpen);
    const [isExtracting, setIsExtracting] = useState(false);

    const [file, setFile] = useState(image);
    const [cameraStream, setCameraStream] = useState(null);
    const [tapEffect, setTapEffect] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!isFormVisible) {
            setFile(null);
            setImage(null);
        }
    }, [isFormVisible, setImage]);

    useEffect(() => {
        setFile(image);
    }, [image]);

    const onDrop = useCallback(acceptedFiles => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            const fileWithPreview = Object.assign(selectedFile, {
                preview: URL.createObjectURL(selectedFile)
            });
            setFile(fileWithPreview);
            setImage(fileWithPreview);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        noClick: isCameraOpen,
    });

    const removeFile = (e) => {
        e.stopPropagation();
        setFile(null);
        setImage(null);
    };

    const handleExtract = async () => {
        //console.log("Extracting...");
        if (!file || !(file instanceof File)) { console.log("No image selected"); return; }

        if (file) {
            try {
                setIsExtracting(true);
                const result = await runChat(file);
                setIsExtracting(false);
                if (!result) throw new Error("Failed to extract payment details.");
                // console.log("Payment details extracted successfully.", result);

                const cleanedJson = result.replace(/```json|```/g, '').trim();
                const extractedData = JSON.parse(cleanedJson);

                //console.log("Parsed Data:", extractedData);

                const combinedDateTimeString = `${extractedData.date} ${extractedData.time}`;
                // Use 'D' for single/double digit day and 'h' for single/double digit hour
                const finalDateTime = dayjs(combinedDateTimeString, 'D MMM YYYY, h:mm A');

                const payload = {
                    // This already works: parseFloat(null) || 0 will correctly result in 0
                    amount: parseFloat(extractedData.amount) || 0,

                    // Use the OR operator to default null (or undefined) to an empty string
                    receiverName: extractedData.receiver_name || "",
                    senderName: extractedData.sender_name || "",
                    senderId: extractedData.sender_id || "",
                    receiverId: extractedData.receiver_id || "",

                    // Special check for dateTime to avoid an invalid date
                    // If extractedData.dateTime is null, it will default to the current date/time
                    dateTime: extractedData.dateTime ? dayjs(extractedData.dateTime) : dayjs(),

                    method: extractedData.payment_app || "",
                    type: extractedData.transaction_type || "",
                    transactionId: extractedData.upi_transaction_id || "",
                    _id: null, // New transaction
                }
                console.log("Form State:", payload);
                setFormState(payload);
                setIsConfirmOpen(true);
                toast.success("Payment details extracted and form populated!");
                setFile(null);
                setImage(null);
            } catch (error) {
                console.error("Error extracting payment details:", error);
                toast.error("Failed to extract payment details!");
            } finally {
                setIsExtracting(false);
            }

        } else {
            // console.error("No file selected for extraction.");
            throw new Error("No image selected for extraction.");
        }
    }

    const openCamera = async (e) => {
        e.stopPropagation();
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

            // --- NEW: Define high-resolution constraints ---
            const constraints = {
                video: {
                    facingMode: "environment", // Prioritizes the back camera on mobile
                    width: { ideal: 1920 }, // Request 1080p width
                    height: { ideal: 1080 } // Request 1080p height
                }
            };

            try {
                // --- UPDATED: Pass the new constraints to getUserMedia ---
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                setCameraStream(stream);
                setIsCameraOpen(true);
            } catch (err) {
                console.error("Error accessing camera (HD request failed, retrying): ", err);

                // --- FALLBACK: If 1080p fails, try again with default settings ---
                try {
                    const defaultStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    setCameraStream(defaultStream);
                    setIsCameraOpen(true);
                } catch (fallbackErr) {
                    console.error("Error accessing camera (default): ", fallbackErr);
                    alert("Could not access camera. Please check permissions.");
                }
            }
        } else {
            alert("Your browser does not support camera access.");
        }
    };

    // --- NEW: Tap-to-Focus Handler ---
    const handleVideoClick = async (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // --- 1. Set Tap Effect State (Visual) ---
        setTapEffect({
            key: Date.now(),
            x: x,
            y: y,
        });

        // --- 2. Apply Camera Focus (Functional) ---
        // Check for all required objects *before* trying to use them.
        if (cameraStream && videoRef.current) {
            try {
                const videoTrack = cameraStream.getVideoTracks()[0];
                const capabilities = videoTrack.getCapabilities();

                // Check if the camera supports the features we need
                if (capabilities.focusMode && capabilities.focusMode.includes("manual") &&
                    capabilities.pointsOfInterest) {

                    const focusX = x / rect.width;
                    const focusY = y / rect.height;

                    console.log(`Applying focus at: ${focusX.toFixed(2)}, ${focusY.toFixed(2)}`);

                    await videoTrack.applyConstraints({
                        advanced: [{
                            pointsOfInterest: [{ x: focusX, y: focusY }],
                            focusMode: 'manual'
                        }]
                    });

                } else {
                    console.warn("Tap-to-focus (pointsOfInterest) not supported by this camera.");
                }
            } catch (err) {
                console.error("Tap-to-focus failed:", err);
            }
        } else {
            console.warn("Could not apply focus: cameraStream or videoRef not ready.");
        }
    };

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
        setCameraStream(null);
    };

    // --- THIS IS THE CORRECTED FUNCTION ---
    const takePhoto = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        const canvas = canvasRef.current;
        console.log("takePhoto called. Video:", video, "Canvas:", canvas); // Log 1
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            console.log("Drew image to canvas."); // Log 2

            // The toBlob function is asynchronous. All actions must happen inside its callback.
            canvas.toBlob(blob => {
                console.log("toBlob callback executed. Blob:", blob); // Log 3
                if (!blob) {
                    console.error("Canvas to Blob conversion failed.");
                    closeCamera();
                    return;
                }
                const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                console.log("Created File object:", capturedFile); // Log 4
                const fileWithPreview = Object.assign(capturedFile, {
                    preview: URL.createObjectURL(capturedFile)
                });
                console.log("File with preview:", fileWithPreview.preview); // Log 5
                setFile(fileWithPreview);
                setImage(fileWithPreview);
                console.log("State updated."); // Log 6

                closeCamera();
            }, 'image/jpeg');
        } else {
            console.error("Video or Canvas ref is missing.");
        }
    };
    // This function will be called when the <video> element is mounted
    const videoRefCallback = useCallback((node) => {
        if (node) {
            // Store the node in the ref (optional, but can be useful)
            videoRef.current = node;
            // If the stream is ready, attach it now
            if (cameraStream) {
                console.log("Attaching stream via ref callback:", node);
                node.srcObject = cameraStream;
                node.play().catch(err => console.error("Video play failed:", err));
            }
        }
    }, [cameraStream]); // Re-run if cameraStream changes

    // Cleanup effect for the stream (still important)
    useEffect(() => {
        // Return a cleanup function
        return () => {
            if (cameraStream) {
                console.log("Cleaning up camera stream in useEffect");
                cameraStream.getTracks().forEach(track => track.stop());
                // No need to set cameraStream to null here, closeCamera handles it
            }
        };
    }, [cameraStream]); // Run cleanup when the stream changes (e.g., becomes null)


    useEffect(() => {
        return () => { if (file) URL.revokeObjectURL(file.preview); };
    }, [file]);

    return (
        <div
            {...getRootProps()}
            className={`
                border-2 !w-[90%] border-dashed rounded-xl !mb-2 !p-4 text-center cursor-pointer transition-colors duration-300
                ${isDragActive
                    ? 'border-[#ff0066] bg-pink-900/20'
                    : 'border-neutral-600 hover:border-[#ff0066] hover:bg-neutral-800/30'
                }
            `}
        >
            <input {...getInputProps()} />

            {file ? (
                // Preview View
                <div className="relative w-full h-32 flex justify-between items-center">
                    <div className='w-auto max-w-[60%] flex items-center !h-full'>
                        <img src={file.preview} alt="Preview" className="max-h-full max-w-full rounded-md object-contain" />
                    </div>
                    <div>
                        <Button type="ghost" onClick={removeFile} className="absolute top-0 right-0 m-1 bg-gray-600/80 hover:bg-gray-700 text-white !p-2">Remove</Button>
                        <Button type="ghost" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleExtract() }} className="absolute bottom-0 right-0 m-1 bg-[#ff0066] hover:bg-[#e6005c] text-white !p-3">{!isExtracting ? "Extract" : <Loader2Icon size={24} className='animate-spin' />} </Button>
                    </div>
                </div>
            ) : (
                // Default View
                <div className="flex flex-col items-center justify-center text-gray-400">
                    <UploadCloud size={32} className="mb-2 text-[#ff0066]" />
                    <p className="font-semibold">Drag & drop screenshot here</p>
                    <p className="text-sm">or click to select file</p>
                    <div className="flex items-center !my-3 w-full">
                        <div className="flex-grow border-t border-neutral-700"></div>
                        <span className="flex-shrink mx-4 text-xs font-bold">OR</span>
                        <div className="flex-grow border-t border-neutral-700"></div>
                    </div>
                    <button
                        type="button"
                        onClick={openCamera}
                        className="flex items-center gap-2 bg-[#ff0066] !p-2 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        <Camera size={18} />
                        Capture with Camera
                    </button>
                </div>
            )}

            {/* Camera Modal */}
            {/* {isCameraOpen && (
                <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                    <video ref={videoRef} autoPlay playsInline className="w-full max-w-2xl h-auto rounded-lg"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="absolute bottom-10 flex items-center gap-6">
                        <button onClick={closeCamera} className="bg-gray-600/80 hover:bg-gray-700 cursor-pointer text-white font-bold !py-1 !px-2 rounded-full">Cancel</button>
                        <button onClick={takePhoto} className="bg-[#ff0066] hover:bg-[#e6005c] cursor-pointer text-white p-4 rounded-full ring-4 ring-white/50">
                            <Zap size={28} />
                        </button>
                    </div>
                </div>
            )} */}
            {/* --- NEW CAMERA DIALOG --- */}
            <Dialog open={isCameraOpen} onOpenChange={closeCamera}>
                <DialogContent
                    className="bg-[#01010e] border-neutral-700 text-white p-6 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.45)] max-w-lg w-[90vw]"
                >
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-[#ff0066] text-center">
                            Capture Image
                        </DialogTitle>
                    </DialogHeader>

                    {/* Video feed and hidden canvas */}
                    <div className="relative mt-4 !p-2">
                        <video
                            ref={videoRefCallback} // Use the callback function
                            autoPlay
                            playsInline
                            muted // Often needed for autoplay
                            className="w-full h-auto rounded-lg cursor-pointer"
                            onClick={handleVideoClick}
                        ></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        {/* tap effect */}
                        <AnimatePresence>
                            {tapEffect && (
                                <motion.div
                                    key={tapEffect.key}
                                    className="absolute rounded-full border-2 border-white pointer-events-none"
                                    style={{
                                        // Position the div based on the click coordinates
                                        left: tapEffect.x,
                                        top: tapEffect.y,
                                    }}
                                    initial={{ scale: 0, opacity: 0.8, x: "-50%", y: "-50%" }} // Center on click
                                    animate={{ scale: 20, opacity: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    onAnimationComplete={() => setTapEffect(null)} // Remove from DOM after
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <DialogFooter className="mt-6 flex-row justify-center">
                        <button onClick={takePhoto} className="bg-[#ff0066] hover:bg-[#e6005c] cursor-pointer text-white p-4 rounded-full ring-4 ring-white/50">
                            <Zap size={28} />
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ImageDropzone;