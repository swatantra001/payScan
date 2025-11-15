import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2Icon, Send } from 'lucide-react';
import dayjs from 'dayjs';

// Re-use the DetailRow helper if it's accessible, or define it here
const DetailRow = ({ label, value, isAmount = false, type = 'credit' }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-400 font-medium">{label}:</span>
        <span className={`font-semibold rounded-sm ${isAmount ? (type === 'debit' ? 'bg-red-700 !px-1 text-gray-100' : 'bg-green-400 !px-1 text-gray-700') : 'text-gray-100'}`}>
            {value || 'N/A'}
        </span>
    </div>
);


const ConfirmationDialog = ({ formData, isOpen, onClose, onConfirmSubmit }) => {
    if (!formData) return null;

    //Format date/time from the potentially combined dayjs object in formData
    const formattedDate = formData.dateTime
        ? dayjs(formData.dateTime).format('MMM DD, YYYY, hh:mm A')
        : 'N/A';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                as={motion.div}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#01010e] border-neutral-700 text-white !p-6 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.45)] md:max-w-lg max-h-[85vh] overflow-hidden wrap-break-word flex flex-col w-[90vw]"
            >
                <DialogHeader className="mb-4 flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-[#ff0066] text-left md:text-center">
                        Confirm Transaction Details
                    </DialogTitle>
                    {/* <DialogClose asChild>
                        <button className="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-full p-1 transition">
                            <X size={20}/>
                        </button>
                    </DialogClose> */}
                </DialogHeader>

                <div className="!space-y-1 text-md overflow-y-auto">
                    {/* Display the details from formData */}
                    <DetailRow label="Amount" value={`₹${parseFloat(formData.amount || 0).toLocaleString('en-IN')}`} isAmount={true} type={formData.type} />
                    <DetailRow label="Date & Time" value={formattedDate} />
                    <DetailRow label="Method" value={formData.method} />
                    <DetailRow label="Type" value={formData.type} />
                    <hr className="border-neutral-700 my-2" />
                    <DetailRow label="Transaction ID" value={formData.transactionId} />
                     <hr className="border-neutral-700 my-2" />
                    <DetailRow label="Sender Name" value={formData.senderName} />
                    <DetailRow label="Sender ID" value={formData.senderId} />
                    <hr className="border-neutral-700 my-2" />
                    <DetailRow label="Receiver Name" value={formData.receiverName} />
                    <DetailRow label="Receiver ID" value={formData.receiverId} />
                </div>

                <DialogFooter className="mt-6 flex-row justify-end gap-3 flex-shrink-0">
                    {/* Edit Button: Just closes the confirmation dialog */}
                    <Button
                        variant="outline"
                        onClick={onClose} // Simply close the dialog
                        className="!p-2 cursor-pointer bg-[#0e0e11]] text-white hover:text-[#ff0066] hover:bg-[#131317]"
                    >
                       <Edit2Icon size={12}/> Edit
                    </Button>
                    {/* Confirm Submit Button: Calls the actual submit function */}
                    <Button
                        onClick={onConfirmSubmit} // Trigger the real submission
                        className="!p-2 cursor-pointer bg-[#ff0066] hover:bg-[#e6005c] text-white"
                    >
                        <Send size={12}/> Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmationDialog;