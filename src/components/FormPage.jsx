import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, User2Icon, LucideBanknote, IdCard, Hash, Loader2Icon } from 'lucide-react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // Make sure you import DatePicker
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import ImageDropzone from './ImageDropZone';

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import useTransactionStore from '@/store/transactionStore';

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Label } from './ui/label';
import { toast } from 'sonner';
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

import ConfirmationDialog from './ConfirmationDialog';
import { Button } from './ui/button';


const MuiInputStyle = {
	width: '90% !important', // Make the input take full width
	// Target the input field's container
	'& .MuiInputBase-root': {
		backgroundColor: '#2a2a2e', // Match your other inputs' background
		borderRadius: '8px', // Match your other inputs' border radius
		'& fieldset': {
			border: 'none', // Remove the default border
		},
		'&:hover fieldset': {
			border: 'none',
		},
		'&.Mui-focused fieldset': {
			border: '2px solid #ff0066', // Add a pink ring on focus
		},
	},
}

export default function ModernForm({ transactions, onClose }) {

	const isFormVisible = useTransactionStore((state) => state.isFormVisible);
	const setFormVisible = useTransactionStore((state) => state.setFormVisible);
	const formState = useTransactionStore((state) => state.formState);
	const setFormState = useTransactionStore((state) => state.setFormState);
	const resetFormState = useTransactionStore((state) => state.resetFormState);
	const isConfirmOpen = useTransactionStore((state) => state.isConfirmOpen);
	const setIsConfirmOpen = useTransactionStore((state) => state.setIsConfirmOpen);
	//console.log("formState:", formState);
	const addTransaction = useMutation(api.transactions.add);

	const [isAdding, setIsAdding] = useState(false);
	const isDuplicateAlertOpen = useTransactionStore((state) => state.isDuplicateAlertOpen);
	const setIsDuplicateAlertOpen = useTransactionStore((state) => state.setIsDuplicateAlertOpen);
	//const [isDuplicateAlertOpen, setIsDuplicateAlertOpen] = useState(false);
	const [alertPayload, setAlertPayload] = useState(null);

	const handleDateChange = (newDate) => {
		// Combine the new date with the existing time from formState
		const existingTime = dayjs(formState.dateTime);
		const combined = newDate
			.hour(existingTime.hour())
			.minute(existingTime.minute())
			.second(existingTime.second());
		setFormState({ ...formState, dateTime: combined });
	};

	const handleTimeChange = (newTime) => {
		// Combine the new time with the existing date from formState
		const existingDate = dayjs(formState.dateTime);
		const combined = existingDate
			.hour(newTime.hour())
			.minute(newTime.minute())
			.second(newTime.second());
		setFormState({ ...formState, dateTime: combined });
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		if (type === 'radio') {

			setFormState({ ...formState, type: checked ? value : formState[name] });
		} else {

			setFormState({ ...formState, [name]: value });
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		// console.log("Form Data:", formState);
		// console.log("selectedTime:", selectedTime.format("HH:mm:ss"), "selectedDate:", selectedDate.format("YYYY-MM-DD"))
		try {
			setIsAdding(true);
			setIsConfirmOpen(false); // Close confirmation dialog

			const dateTime = dayjs(formState.dateTime);
			// 2. Create the final payload for Convex, converting the date
			const payload = {
				...formState,
				// THE FIX: Convert the dayjs object to a standard ISO string
				amount: parseFloat(formState.amount),
				dateTime: dateTime.toISOString(),
			};
			if (!payload.type || payload.type === "") payload.type = "credit";   // default

			// Remove the separate date/time fields if they exist in your form state
			delete payload.transactionDate;
			delete payload.transactionTime;
			delete payload.id;
			delete payload._creationTime;
			delete payload.userId;
			const isUpdation = payload._id !== null;
			const isTransactionAlreadyExist = transactions.filter(tr => payload._id === null && tr.transactionId === payload.transactionId && tr.transactionId.length > 0 && payload.transactionId.length > 0);
			if (payload._id === null) delete payload._id;

			if (isTransactionAlreadyExist.length > 0) {
				setAlertPayload(payload);
				setIsDuplicateAlertOpen(true);
				setIsAdding(false);
				return;
			}
			// 3. Send the clean payload to your Convex backend
			await addTransaction(payload);

			setFormVisible(false);
			setIsAdding(false);

			resetFormState();
			if (isUpdation) toast.success("Transaction updated successfully!");
			else toast.success("Transaction added successfully!");
			onClose();
		}
		catch (error) {
			console.error("Error submitting form:", error);
			toast.error("Error adding transaction!");
		}
		finally {
			setIsAdding(false);
		}
	}

	const handleCancelAlert = (e) => {
		e.preventDefault();
		setAlertPayload(null);
		setIsDuplicateAlertOpen(false);
	}
	const handleAlertSubmit = async (e) => {
		e.preventDefault();
		try {
			setIsAdding(true);
			setIsDuplicateAlertOpen(false); // Close confirmation dialog

			const isUpdation = alertPayload._id !== null && alertPayload._id !== undefined;
			await addTransaction(alertPayload);
			setAlertPayload(null);
			setFormVisible(false);
			setIsAdding(false);

			resetFormState();
			if (isUpdation) toast.success("Transaction updated successfully!");
			else toast.success("Transaction added successfully!");
			onClose();
		} catch (error) {
			console.error("Error submitting form:", error);
			toast.error("Error adding transaction!");
		}
		finally {
			setIsAdding(false);
		}
	}

	// 4. New handler for the form's submit button (opens the confirmation)
	const handleOpenConfirmation = (e) => {
		e.preventDefault();
		// Here you could add validation before opening the confirmation
		setIsConfirmOpen(true);
	};

	const ref = useRef(null);
	useEffect(() => {
		if (isFormVisible) {
			setTimeout(() => {
				ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 300); // delay matches your Framer Motion transition
		}
	}, [isFormVisible]);

	const textPart1 = "A transaction with the same Transaction ID: ";
    const transactionIdText = formState.transactionId || '';
    const textPart2 = " already exists. Are you sure you want to submit this duplicate transaction?";

    const charactersPart1 = Array.from(textPart1);
    const charactersTransactionId = Array.from(transactionIdText); 
    const charactersPart2 = Array.from(textPart2);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.015, // Your 15ms delay
			},
		},
	};

	const charVariants = {
		hidden: { opacity: 0, y: 5 },
		visible: { opacity: 1, y: 0 },
	};


	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<motion.div>
				<div ref={ref} className={`min-h-screen w-[100%] bg-[#0e0e11] !py-6 flex flex-col gap-4 md:flex-row items-center justify-center p-6 font-sans`}>
					{/* Left Section */}

					<motion.div
						iinitial={{ opacity: 0, y: -20, height: 0 }}
						animate={{ opacity: 1, y: 0, height: 'auto' }}
						exit={{ opacity: 0, y: -20, height: 0 }} // 3. Define the exit animation
						transition={{ duration: 0.3 }}
						className="bg-[#01010e] rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.45)]
 py-8 md:w-[25%] w-[90%] max-w-md text-white"
					>
						<div className='!m-4'>
							<h2 className="text-[#ff0066] text-3xl font-bold text-center mb-2">Required*</h2>
						</div>
						<form onSubmit={handleOpenConfirmation} className="!space-y-6 m-6 flex flex-col items-center justify-center">
							{/* Inputs */}
							{formState.amount && <Label htmlFor="amount" className="block text-sm font-medium !mb-1 text-gray-400 md:hidden w-full !px-6">Amount</Label>}
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="relative w-[90%] !mb-3">
										<IndianRupee size={18} className="text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />

										<input type="text" name="amount" onChange={handleChange} value={formState.amount} placeholder="Amount *" className="form-input w-full bg-[#0f0f15] rounded-lg border-none !pl-8 !pr-4 !py-1 text-gray-200 focus:ring-2 focus:ring-[#ff0066]" required />
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-black text-white rounded !p-1 text-xs">
									<p className='relative z-10'>Amount</p>
								</TooltipContent>
							</Tooltip>

							{/* CORRECTED: Level of Development (Radio Buttons) */}
							<div>
								<p className="text-[#ff0066] font-semibold mt-1 mb-3 text-sm text-center">Transaction Type</p>
								<div className="!flex !space-x-6 text-gray-300">
									<label className="!flex !items-center !space-x-1 cursor-pointer">
										<input
											type="radio"
											name="type"
											value="credit"
											checked={formState.type === 'credit'}
											onChange={handleChange}
											className="form-radio bg-[#0f0f15] border-neutral-600 text-[#ff0066] focus:ring-[#ff0066]"
										/>
										<span>Credit</span>
									</label>
									<label className="flex items-center !space-x-1 cursor-pointer">
										<input
											type="radio"
											name="type"
											value="debit"
											checked={formState.type === 'debit'}
											onChange={handleChange}
											className="form-radio bg-[#0f0f15] border-neutral-600 text-[#ff0066] focus:ring-[#ff0066]"
										/>
										<span>Debit</span>
									</label>
								</div>
							</div>

							{formState.transactionId && <Label htmlFor="amount" className="block text-sm font-medium !mb-1 text-gray-400 md:hidden w-full !px-6">Transaction Id</Label>}
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="relative w-[90%] !mb-3">
										<IdCard size={18} className="text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
										<input type="text" name="transactionId" onChange={handleChange} value={formState.transactionId} placeholder="Transaction id" className="form-input w-full bg-[#0f0f15] rounded-lg border-none !pl-8 !pr-4 !py-1 text-gray-200 focus:ring-2 focus:ring-[#ff0066]" />
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-black text-white rounded !p-1 text-xs">
									<p className='relative z-10'>Transaction ID</p>
								</TooltipContent>
							</Tooltip>

							{formState.senderName && <Label htmlFor="amount" className="block text-sm font-medium !mb-1 text-gray-400 md:hidden w-full !px-6">Sender Name</Label>}
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="relative w-[90%] !mb-3">
										<User2Icon size={18} className="text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
										<input type="text" name="senderName" onChange={handleChange} value={formState.senderName} placeholder="Sender name" className="form-input w-full bg-[#0f0f15] rounded-lg border-none !pl-10 !pr-4 !py-1 text-gray-200 focus:ring-2 focus:ring-[#ff0066]" />
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-black text-white rounded !p-1 text-xs">
									<p className='relative z-10'>Sender Name</p>
								</TooltipContent>
							</Tooltip>

							{formState.receiverName && <Label htmlFor="amount" className="block text-sm font-medium !mb-1 text-gray-400 md:hidden w-full !px-6">Receiver Name</Label>}
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="relative w-[90%] !mb-3">
										<User2Icon size={18} className="text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
										<input type="text" name="receiverName" onChange={handleChange} value={formState.receiverName} placeholder="Receiver name" className="form-input w-full bg-[#0f0f15] rounded-lg border-none !pl-10 !pr-4 !py-1 text-gray-200 focus:ring-2 focus:ring-[#ff0066]" />
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-black text-white rounded !p-1 text-xs">
									<p className='relative z-10'>Receiver Name</p>
								</TooltipContent>
							</Tooltip>

							{formState.senderId && <Label htmlFor="amount" className="block text-sm font-medium !mb-1 text-gray-400 md:hidden w-full !px-6">Sender Id</Label>}
							<Tooltip>
								<TooltipTrigger asChild>

									<div className="relative w-[90%] !mb-3">
										<Hash size={18} className="text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
										<input type="text" name="senderId" onChange={handleChange} value={formState.senderId} placeholder="Sender id" className="form-input w-full bg-[#0f0f15] rounded-lg border-none !pl-10 !pr-4 !py-1 text-gray-200 focus:ring-2 focus:ring-[#ff0066]" />
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-black text-white rounded !p-1 text-xs">
									<p className='relative z-10'>Sender ID</p>
								</TooltipContent>
							</Tooltip>

							{formState.receiverId && <Label htmlFor="amount" className="block text-sm font-medium !mb-1 text-gray-400 md:hidden w-full !px-6">Receiver Id</Label>}
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="relative w-[90%] !mb-3">
										<Hash size={18} className="text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
										<input type="text" name="receiverId" onChange={handleChange} value={formState.receiverId} placeholder="Receiver id" className="form-input w-full bg-[#0f0f15] rounded-lg border-none !pl-10 !pr-4 !py-1 text-gray-200 focus:ring-2 focus:ring-[#ff0066]" />
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-black text-white rounded !p-1 text-xs">
									<p className='relative z-10'>Receiver ID</p>
								</TooltipContent>
							</Tooltip>

							{1 && <Label htmlFor="amount" className="block text-sm font-medium !mb-1 text-gray-400 md:hidden w-full !px-6">Payment App</Label>}
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="relative w-[90%] !mb-1">
										<LucideBanknote size={18} className="text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
										<select name="method" onChange={handleChange} value={formState.method} className="form-select w-full bg-[#0f0f15] rounded-lg border-none !pl-10 !pr-4 !py-1 text-gray-200 focus:ring-2 focus:ring-[#ff0066]">
											<option value="" disabled>Method *</option>
											<option value="phonepay">Phone pay</option>
											<option value="googlepay">Google pay</option>
											<option value="paytm">Paytm</option>
											<option value="aadhar">Aadhar</option>
											<option value="other">Other</option>
										</select>
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-black text-white rounded !p-1 text-xs">
									<p className='relative z-10'>Payment App</p>
								</TooltipContent>
							</Tooltip>

							{/* Submit Button */}
							<Button onSubmit={handleOpenConfirmation} disabled={isAdding || formState.amount === "" || parseFloat(formState.amount) === 0 || isNaN(parseFloat(formState.amount))} type="submit" className={`cursor-pointer !m-4 w-[90%] flex items-center justify-center h-[40px] bg-[#ff0066] hover:bg-[#e6005c] text-white font-semibold rounded-lg py-3 transition-all`}>
								{isAdding ? <Loader2Icon className='animate-spin' /> : 'Submit'}
							</Button>
							
						</form>
					</motion.div>

					{/* Form Card */}
					<motion.div
						initial={{ opacity: 0, y: -20, height: 0 }}
						animate={{ opacity: 1, y: 0, height: 'auto' }}
						exit={{ opacity: 0, y: -20, height: 0 }} // 3. Define the exit animation
						transition={{ duration: 0.3 }}
						className="bg-[#01010e] rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.45)] p-8 md:w-[25%] w-[90%] max-w-md text-white"
					>
						<div className='!m-6'>
							<h2 className="text-[#ff0066] text-3xl font-bold text-center mb-2">FORM</h2>
							<p className="text-gray-400 text-center text-sm mb-8">Provide optional details for a more complete record.</p>
						</div>
						<form onSubmit={handleOpenConfirmation} className="flex !gap-4 flex-col items-center justify-center">
							{/* Inputs */}
							<DatePicker value={dayjs(formState.dateTime || dayjs(new Date()))} onChange={handleDateChange} sx={MuiInputStyle} label="Transaction date" />
							<TimePicker value={dayjs(formState.dateTime || dayjs(new Date()))} onChange={handleTimeChange} sx={MuiInputStyle} label="Transaction time" />
							{/* </div> */}
							<div className='w-[90%] flex items-center justify-between'>
								<div className='h-[1px] w-[44%] border-t-1 border-gray-500 border-dashed'></div>
								<p className='text-gray-500'>or</p>
								<div className='h-[1px] w-[44%] border-t-1 border-gray-500 border-dashed'></div>
							</div>
							<ImageDropzone isFormVisible={isFormVisible} />
						</form>
					</motion.div>
				</div>
			</motion.div>

			{/* 6. Render the Confirmation Dialog */}
			<AnimatePresence>
				{isConfirmOpen && (
					<ConfirmationDialog
						formData={formState} // Pass current form data for display
						isOpen={isConfirmOpen}
						onClose={() => setIsConfirmOpen(false)} // Handler to close
						onConfirmSubmit={handleSubmit} // Handler for final submit
					/>
				)}
			</AnimatePresence>
			<AnimatePresence>
				{isDuplicateAlertOpen && (
					<AlertDialog open={isDuplicateAlertOpen} onOpenChange={setIsDuplicateAlertOpen}>
						<AnimatePresence>
							<AlertDialogContent className="bg-[#01010e] !p-2 border-neutral-700 text-white shadow-[0_0_20px_rgba(0,0,0,0.45)]">
								<AlertDialogHeader>
									<AlertDialogTitle className="flex items-center gap-2 text-red-500 font-bold text-2xl">!! WARNING !!</AlertDialogTitle>
									{/* <AlertDialogDescription className="text-gray-400">
										A transaction with the same Transaction ID: <span className='font-bold text-lg text-white'>{alertPayload.transactionId}</span> already exists. Are you sure you want to submit this duplicate transaction?
									</AlertDialogDescription> */}
									<AlertDialogDescription asChild>
										<motion.p
											className="text-gray-400"
											variants={containerVariants}
											initial="hidden"
											animate="visible"
											// Make sure the aria-label contains the full text for accessibility
											aria-label={`${textPart1}${transactionIdText}${textPart2}`}
										>
											{/* Animate the first static part */}
											{charactersPart1.map((char, index) => (
												<motion.span
													key={`p1-${index}`}
													variants={charVariants}
													style={{ display: 'inline-block' }}
												>
													{char === ' ' ? '\u00A0' : char}
												</motion.span>
											))}

											{/* --- Animate the transaction ID here --- */}
											{charactersTransactionId.map((char, index) => (
												<motion.span
													key={`id-${index}`}
													variants={charVariants}
													// Apply ID specific styling here
													className='font-bold text-lg text-white'
													style={{ display: 'inline-block' }}
												>
													{char === ' ' ? '\u00A0' : char}
												</motion.span>
											))}

											{/* Animate the second static part */}
											{charactersPart2.map((char, index) => (
												<motion.span
													key={`p2-${index}`}
													variants={charVariants}
													style={{ display: 'inline-block' }}
												>
													{char === ' ' ? '\u00A0' : char}
												</motion.span>
											))}
										</motion.p>
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter className="flex-row justify-end gap-2">
									<AlertDialogCancel
										onClick={handleCancelAlert}
										className="bg-neutral-700 !p-2 border-neutral-600 hover:bg-neutral-600 text-gray-200"
									>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={(e) => {
											e.stopPropagation(); // Stop click from bubbling
											handleAlertSubmit(e); // Use your existing confirm function
										}}
										className="bg-red-600 !p-2 hover:bg-red-700 text-white"
									>
										Add Anyway
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AnimatePresence>
					</AlertDialog>
				)}
			</AnimatePresence>
		</LocalizationProvider>
	);
}