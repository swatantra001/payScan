import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from 'lucide-react';

const PdfPreviewModal = ({ isOpen, onClose, pdfUrl, onDownload, fileName }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent
                        as={motion.div}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#01010e] border-neutral-700 text-white !p-1 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.45)] 
                                   max-w-4xl w-[90vw] md:h-[90vh] flex flex-col"
                    >
                        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b border-neutral-700">
                            <DialogTitle className="text-xl font-bold text-[#ff0066] text-left">
                                PDF Preview
                            </DialogTitle>
                            
                        </DialogHeader>

                        {/* PDF Preview Area */}
                        <div className="flex-grow overflow-hidden !p-1">
                            <iframe
                                src={pdfUrl}
                                title="PDF Preview"
                                className="w-full h-full border-none rounded-sm"
                            />
                        </div>

                        <DialogFooter className="!p-2 flex-row justify-end gap-3 flex-shrink-0 border-t border-neutral-700">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="!px-2 bg-[#0e0e11] border-neutral-600 hover:bg-[#131317] !text-gray-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => onDownload(pdfUrl, fileName)}
                                className="!px-2 cursor-pointer flex items-center gap-2 bg-[#ff0066] hover:bg-pink-700 text-white"
                            >
                                <Download size={16} />
                                Download PDF
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AnimatePresence>
    );
};

export default PdfPreviewModal;