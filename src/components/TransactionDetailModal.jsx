import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2Icon, Skull, Trash2Icon } from 'lucide-react';
import dayjs from 'dayjs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TransactionDetailModal = ({ transaction, isOpen, onClose, onEdit, onDelete }) => {
    if (!transaction) return null; // Don't render if no transaction is selected

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [transactionIdToDelete, setTransactionIdToDelete] = useState(null);

    const handleEditClick = () => {
        onEdit(transaction._id);
        onClose(); // Close modal after initiating edit
    };

    const openDeleteDialog = (e, id) => {
        e.stopPropagation(); // Stop row click
        setTransactionIdToDelete(id);
        setIsAlertOpen(true);
    };

    const closeDeleteConfirm = (e) => {
        e.stopPropagation();
        setTransactionIdToDelete(null);
        setIsAlertOpen(false);
    }

    const confirmDelete = async () => {
        await onDelete(transactionIdToDelete)
        setIsAlertOpen(false); // Close the dialog
        setTransactionIdToDelete(null);
        onClose(); // Close the modal
    };

    // Format date for display
    const formattedDate = transaction.dateTime
        ? dayjs(transaction.dateTime).format('MMM DD, YYYY, hh:mm A')
        : 'N/A';



    const descriptionText = "This action cannot be undone. This will permanently delete the transaction record.";
    const characters = Array.from(descriptionText); 

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.015, // 15ms delay between each character
            },
        },
    };

    const charVariants = {
        hidden: { opacity: 0, y: 5 }, // Start invisible and slightly down
        visible: { opacity: 1, y: 0 }, // Fade in and move up
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`bg-[#1e1e22] ${isAlertOpen ? 'blur-xs' : ''} border-neutral-700 text-white !p-6 rounded-2xl shadow-[0_0_10px_rgba(233,30,99,0.5)] md:max-w-lg max-h-[85vh] overflow-hidden wrap-break-word flex flex-col w-[90vw]`}
                // Use motion for animation
                as={motion.div}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
            >
                <DialogHeader className="mb-4 flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-[#ff0066] text-left md:text-center">
                        Transaction Details
                    </DialogTitle>
                    {/* Explicit Close Button */}
                    {/* <DialogClose asChild>
                        <button className="absolute top-4 right-4 !z-50 cursor-pointer hover:!bg-[#ff0066] text-gray-400 hover:text-white">
                           
                        </button>
                    </DialogClose> */}

                </DialogHeader>

                <div className="!space-y-1 text-md overflow-y-auto">
                    {/* Detail Rows */}
                    <DetailRow label="Amount" value={`₹${parseFloat(transaction.amount || 0).toLocaleString('en-IN')}`} isAmount={true} type={transaction.type} />
                    <DetailRow label="Date & Time" value={formattedDate} />
                    <DetailRow label="Method" value={transaction.method} />
                    <DetailRow label="Type" value={transaction.type} />
                    <hr className="border-neutral-700 !my-3" />
                    <DetailRow label="Transaction ID" value={transaction.transactionId} />
                    <hr className="border-neutral-700 !my-3" />
                    <DetailRow label="Sender Name" value={transaction.senderName} />
                    <DetailRow label="Sender ID" value={transaction.senderId} />
                    <hr className="border-neutral-700 !my-3" />
                    <DetailRow label="Receiver Name" value={transaction.receiverName} />
                    <DetailRow label="Receiver ID" value={transaction.receiverId} />
                </div>

                <DialogFooter className="mt-6 flex-row justify-end gap-3 flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={handleEditClick}
                        className="!p-2 cursor-pointer bg-neutral-800 text-white hover:text-[#ff0066] hover:bg-neutral-700"
                    >
                        <Edit2Icon size={12} /> Edit
                    </Button>
                    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                onClick={(e) => {
                                    openDeleteDialog(e, transaction._id);
                                }}
                                className="!p-2 cursor-pointer bg-[#ff0066] hover:bg-[#e6005c] text-white"
                            >
                                <Trash2Icon size={14} /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AnimatePresence>
                            <AlertDialogContent className="bg-[#1e1e22] !p-2 border-neutral-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-red-500 font-bold text-2xl"><Skull size={26} className='text-gray-400' /> Are you absolutely sure? <Skull size={26} className='text-gray-400' /></AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                            <motion.p
                                                className="text-gray-400" // Keep original styling
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                                aria-label={descriptionText} // For accessibility
                                            >
                                                {characters.map((char, index) => (
                                                    <motion.span
                                                        key={`${char}-${index}`} // Unique key
                                                        variants={charVariants}
                                                        style={{ display: 'inline-block' }} // Keep inline-block
                                                    >
                                                        {char === ' ' ? '\u00A0' : char} {/* This is the key change! */}
                                                    </motion.span>
                                                ))}
                                            </motion.p>
                                        </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row justify-end gap-2">
                                    <AlertDialogCancel
                                        onClick={closeDeleteConfirm}
                                        className="bg-neutral-700 !p-2 border-neutral-600 hover:bg-neutral-600 text-gray-200"
                                    >
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.stopPropagation(); // Stop click from bubbling
                                            confirmDelete(); // Use your existing confirm function
                                        }}
                                        className="bg-red-600 !p-2 hover:bg-red-700 text-white"
                                    >
                                        Confirm Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AnimatePresence>
                    </AlertDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Helper component for consistent detail rows
const DetailRow = ({ label, value, isAmount = false, type = 'credit' }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-400 font-medium">{label}:</span>
        <span className={`font-semibold rounded-sm ${isAmount ? (type === 'debit' ? 'bg-red-700 !px-1 text-gray-100' : 'bg-green-400 !px-1 text-gray-700') : 'text-gray-100'}`}>
            {value || 'N/A'}
        </span>
    </div>
);

export default TransactionDetailModal;