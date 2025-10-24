
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { IndianRupee, ListChecks, Loader2Icon, PlusCircle, Skull } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import TransactionDetailModal from "./TransactionDetailModal";
import useTransactionStore from "../store/transactionStore";
import dayjs from "dayjs";
import { Switch } from "./ui/switch";
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
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const TableComponent = ({ transactions, onEdit, onDelete }) => {

	const deleteTransaction = useMutation(api.transactions.remove);

	const [sortBy, setSortBy] = useState("dateTime"); // Default sorting by ID
	const [sortOrder, setSortOrder] = useState("desc"); // Default ascending order
	// --- NEW STATE FOR MODAL ---
	const [selectedTransaction, setSelectedTransaction] = useState(null);
	const isModalOpen = useTransactionStore((state) => state.isModalOpen);
	const setIsModalOpen = useTransactionStore((state) => state.setIsModalOpen);
	const setIsFormVisible = useTransactionStore((state) => state.setFormVisible);
	const isFormVisible = useTransactionStore((state) => state.isFormVisible);

	const isAlertOpen = useTransactionStore((state) => state.isAlertOpen);
	const setIsAlertOpen = useTransactionStore((state) => state.setIsAlertOpen);
	const [isDeleting, setIsDeleting] = useState(false);

	const [selectAll, setSelectAll] = useState(false);
	const [enableSwitches, setEnableSwitches] = useState({});

	const scrollRef = useRef(null)
	const scrollRefStart = useRef(null)
	useEffect(() => {
		if (selectAll) {
			setTimeout(() => {
				scrollRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 10); // delay matches your Framer Motion transition
		}
		else {
			setTimeout(() => {
				scrollRefStart?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 200); //
		}
	}, [selectAll]);

	useEffect(() => {
		if (Array.isArray(transactions)) {
			setEnableSwitches(prevSwitches => {
				const newSwitches = {};
				// Loop through transactions and add any new keys
				for (const tx of transactions) {
					if (!(tx._id in newSwitches)) { // If the key doesn't exist
						newSwitches[tx._id] = false; // Add it and default to false
					}
				}
				return newSwitches;
			});
		}
	}, [transactions]);

	useEffect(() => {
		if (Object.keys(enableSwitches).length > 0) { // Only run if there are switches
			const allSelected = Object.values(enableSwitches).every(val => val === true);
			setSelectAll(allSelected);
		} else {
			setSelectAll(false); // No switches, so selectAll is false
		}
	}, [enableSwitches]);

	const handleSelectAllClick = (e) => {
		e.preventDefault();
		e.stopPropagation();

		setSelectAll(!selectAll);
		setEnableSwitches(() => {
			const newSwitches = {};
			for (const id in enableSwitches) {
				newSwitches[id] = !selectAll;
			}
			return newSwitches;
		});
	}

	//console.log("Enable Switches State:", enableSwitches);

	const toggleSwitch = (e, id) => {
		e.stopPropagation();
		e.preventDefault();
		setEnableSwitches((prev) => ({
			...prev,
			[id]: !prev[id],
		}))
	}


	const handleRowClick = (transaction) => {
		// Get the current text selection in the window
		const selection = window.getSelection();
		// If the selection is not collapsed (i.e., text is highlighted)
		// or if the user clicked inside an input/button (like the dropdown)
		if (!selection.isCollapsed || event.target.closest('button, [role="menuitem"]')) {
			return; // Do nothing, user is just selecting text or clicking a button
		}

		setSelectedTransaction(transaction);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		// Delay clearing selection slightly for exit animation
		setTimeout(() => setSelectedTransaction(null), 300);
	};

	const handleSort = (key) => {
		if (sortBy === key) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(key);
			setSortOrder("asc");
		}
	};


	// Sorting logic based on sortBy and sortOrder

	const sortedData = useMemo(() => {
		if (!transactions) return []; // Handle undefined case
		return [...transactions].sort((a, b) => {
			let aValue = a[sortBy];
			let bValue = b[sortBy];

			// --- Specific sorting logic ---
			if (sortBy === 'dateTime') {
				// Convert date strings to Date objects for correct comparison
				aValue = new Date(aValue);
				bValue = new Date(bValue);
			} else if (sortBy === 'amount') {
				// Convert amount values to numbers for correct comparison
				aValue = parseFloat(aValue || 0);
				bValue = parseFloat(bValue || 0);
			}
			// For other fields, default string comparison is usually fine

			// --- Comparison logic ---
			if (aValue < bValue) {
				return sortOrder === "asc" ? -1 : 1;
			}
			if (aValue > bValue) {
				return sortOrder === "asc" ? 1 : -1;
			}
			return 0; // Values are equal
		});
	}, [transactions, sortBy, sortOrder]);


	const closeDeleteConfirm = (e) => {
		e.stopPropagation();

		setIsAlertOpen(false);
	}

	const confirmDelete = async () => {

		try {
			setIsDeleting(true);
			const idsToDelete = Object.keys(enableSwitches).filter(key => enableSwitches[key] === true);
			for (const id of idsToDelete) {
				await deleteTransaction({ id: id });
			}
			toast.success("Selected transactions deleted successfully!");
			setEnableSwitches(prev => {
				const newSwitches = { ...prev };
				for (const id of idsToDelete) {
					delete newSwitches[id];
				}
				return newSwitches;
			});
			//setSelectAll(false);
		} catch (error) {
			console.error("Error submitting form:", error);
			toast.error("Error in deleting transaction!");
		}
		finally {
			setIsDeleting(false);
			setIsAlertOpen(false);
		}
	};


	const textPart1 = "This action cannot be undone. This will permanently delete ";
	//const transactionIdText = formState.transactionId || '';
	const textPart2 = "  selected transaction record.";

	const charactersPart1 = Array.from(textPart1);
	//const charactersTransactionId = Array.from(transactionIdText);
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
		<div className={`w-[100%] !h-auto relative !m-auto !px-2 overflow-x-auto rounded-lg bg-[#1a1a1d`}>
			<div className={`w-100% max-h-[400px]  overflow-y-auto shadow-xs shadow-[#ff0066]`}>
				<table className="w-full text-left border-collapse">
					<thead className="bg-neutral-800 !z-1 sticky top-0">
						<tr>
							<th ref={scrollRefStart}
								className="min-w-[20px] bg-neutral-800 text-[#ff0066] p-3 font-semibold text-sm cursor-pointer hover:bg-neutral-700 transition-colors"
							>

							</th>
							<th
								onClick={() => handleSort("amount")}
								className="min-w-[70px] !p-3 text-[#ff0066] font-semibold text-sm cursor-pointer hover:bg-neutral-700 transition-colors"
							>
								Amount {sortBy === "amount" && <span className="text-gray-300 ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
							</th>

							<th className="min-w-[90px] !p-3 text-[#ff0066] font-semibold text-sm">
								Method
							</th>
							<th className="min-w-[90px] !p-3 text-[#ff0066] font-semibold text-sm">
								Type
							</th>

							<th
								onClick={() => handleSort("dateTime")}
								className="min-w-[170px] text-[#ff0066] p-3 font-semibold text-sm cursor-pointer hover:bg-neutral-700 transition-colors"
							>
								Date & Time {sortBy === "dateTime" && <span className="text-gray-300 ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
							</th>
							<th className="min-w-[120px] text-[#ff0066] p-3 font-semibold text-sm">
								Transaction-id
							</th>
							<th
								className="min-w-[100px] text-[#ff0066] p-3 font-semibold text-sm transition-colors"
							>
								Sender Name
							</th>
							<th
								className="min-w-[100px] text-[#ff0066] p-3 font-semibold text-sm">
								Receiver Name
							</th>
							<th className="min-w-[100px] text-[#ff0066] p-3 font-semibold text-sm">
								Sender-id
							</th>
							<th className="min-w-[100px] text-[#ff0066] p-3 font-semibold text-sm">
								Receiver-id
							</th>
							<th ref={scrollRef} className="min-w-[50px] text-[#ff0066] p-3 font-semibold text-sm">
								Select
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedData
							.map((item, index) => (
								<tr key={index} id={item._id} onClick={() => handleRowClick(item)} className="border-b border-neutral-700 hover:bg-neutral-800 transition-colors">
									<td className="p-3 text-gray-200">{item.id}</td>
									<td className="!p-3 text-gray-200"><Button type="ghost" className="bg-green-900/50 !max-h-8 md:!max-h-6 !p-1">{item.amount}</Button></td>
									<td className="!p-3 text-gray-200">{item.method}</td>
									<td className="!p-3 text-gray-200">{item.type}</td>
									<td className="p-3 text-gray-200">{dayjs(item.dateTime).format('MMM DD, YYYY, hh:mm A')}</td>
									<td className="!p-3 text-gray-200 text-xs">{item.transactionId}</td>
									<td className="p-3 text-gray-200">{item.senderName}</td>
									<td className="p-3 text-gray-200">{item.receiverName}</td>
									<td className="p-3 text-gray-200 text-xs truncate">{item.senderId}</td>
									<td className="p-3 text-gray-200 text-xs">{item.receiverId}</td>
									<td className="p-3 text-gray-200">
										<div
											className="!p-2 md:!p-1 bg-[#1a1d1b] hover:bg-neutral-800 flex justify-center !py-2 !m-0 rounded-md cursor-pointer"
											onClick={(e) => toggleSwitch(e, item._id)}
										>
											<Switch
												checked={enableSwitches[item._id]}
												className="data-[state=checked]:bg-[#00eab9] data-[state=unchecked]:bg-neutral-700 transition-all duration-300"
											/>
										</div>
									</td>
								</tr>
							))}
					</tbody>
				</table>
				{/* --- RENDER THE MODAL --- */}
				<AnimatePresence>
					{isModalOpen && (
						<TransactionDetailModal
							transaction={selectedTransaction}
							isOpen={isModalOpen}
							onClose={closeModal}
							onEdit={onEdit} // Pass down the edit handler from props
							onDelete={onDelete} // Pass down the delete handler from props
						/>
					)}
				</AnimatePresence>

			</div>
			{transactions.length === 0 &&
				<div className="h-10 !mt-5 text-center text-gray-200">
					No Transaction Record
					{!isFormVisible && <div className="!mt-2">
						<span className="text-sm text-gray-400">Add you first Transaction...</span>
						<Button onClick={() => setIsFormVisible(true)} className="!ml-2 bg-[#ff0066] hover:bg-[#e6005c] text-white font-bold rounded-lg transition duration-300 cursor-pointer !p-1 md:!p-2"><PlusCircle size={18} /> ADD</Button>
					</div>}
				</div>
			}
			{<div className="!p-2 !pt-10">
				{/* --- Selection and Deletion --- */}
				{transactions.length > 0 &&
					<div className="max-w-4xl flex-1 !mx-auto bg-neutral-800 !p-1 rounded-xl ring-1 ring-white/10 flex items-center justify-between gap-6">
						<div
							onClick={handleSelectAllClick}
							className="flex items-center gap-3 bg-neutral-800 !p-1 md:!p-2 font-bold text-md cursor-pointer rounded-md"
						>
							<Switch checked={selectAll} className="bg-gray-700 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=unchecked]:bg-neutral-700 data-[state=checked]:to-purple-500 transition-colors duration-300" />
							Select all
						</div>

						<AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
							<AlertDialogTrigger asChild>
								<Button disabled={!Object.values(enableSwitches).some(val => val === true)} variant="destructive" className="bg-[#ff0066] !p-2 gap-3 font-bold text-md cursor-pointer">
									Delete {Object.values(enableSwitches).filter(val => val === true).length} Records
								</Button>
							</AlertDialogTrigger>
							<AnimatePresence>
								<AlertDialogContent className="bg-[#1e1e22] !p-2 border-neutral-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]">
									<AlertDialogHeader>
										<AlertDialogTitle className="flex items-center gap-2 text-red-500 font-bold text-2xl"><Skull size={26} className='text-gray-400' /> Are you absolutely sure? <Skull size={26} className='text-gray-400' /></AlertDialogTitle>
										<AlertDialogDescription asChild>
											<motion.p
												className="text-gray-400"
												variants={containerVariants}
												initial="hidden"
												animate="visible"
												// Make sure the aria-label contains the full text for accessibility
												aria-label={`${textPart1}${Object.values(enableSwitches).filter(val => val === true).length.toString()}${textPart2}`}
											>
												{charactersPart1.map((char, index) => (
													<motion.span
														key={`p1-${index}`}
														variants={charVariants}
														style={{ display: 'inline-block' }}
													>
														{char === ' ' ? '\u00A0' : char}
													</motion.span>
												))}

												{(Array.from((Object.values(enableSwitches).filter(val => val === true).length).toString())).map((char, index) => (
													<motion.span
														key={`id-${index}`}
														variants={charVariants}

														className="text-red-600 font-bold text-xl"
														style={{ display: 'inline-block' }}
													>
														{char === ' ' ? '\u00A0' : char}
													</motion.span>
												))}

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
											{isDeleting ? <Loader2Icon className='animate-spin' /> : 'Confirm Delete'}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AnimatePresence>
						</AlertDialog>
					</div>
				}

				{/* --- Total Amount Card --- */}
				<div className="!my-7 max-w-4xl !pt-2 !mx-auto p-4 flex flex-col justify-center md:flex-row gap-6 overflow-hidden">

					{/* --- Total Transactions Card --- */}
					<div className="flex-1 bg-neutral-800 !p-2 rounded-xl ring-1 ring-white/10 flex items-center gap-6 transform hover:-translate-y-1 transition-transform">
						<div className="bg-pink-900/50 p-4 rounded-lg">
							<ListChecks className="w-8 h-8 text-pink-400" />
						</div>
						<div>
							<p className="text-sm text-gray-400">Total Transactions</p>
							<span className="text-4xl font-bold text-white">{transactions.length}</span>
						</div>
					</div>

					{/* --- Total Amount Card --- */}
					<div className="flex-1 bg-neutral-800 !p-2 rounded-xl ring-1 ring-white/10 flex items-center gap-6 transform hover:-translate-y-1 transition-transform">
						<div className="bg-green-900/50 p-4 rounded-lg">
							<IndianRupee className="w-8 h-8 text-green-400" />
						</div>
						<div>
							<p className="text-sm text-gray-400">Total Amount</p>
							<span className="text-4xl font-bold text-white">
								{/* This automatically formats the number as Indian Rupees (e.g., ₹1,23,456) */}
								{transactions.reduce((acc, curr) => acc + parseInt(curr['amount']), 0)
									.toLocaleString('en-IN', {
										style: 'currency',
										currency: 'INR',
										minimumFractionDigits: 0,
										maximumFractionDigits: 2,
									})}
							</span>
						</div>
					</div>

				</div>
			</div>}
		</div >
	);
};

export default TableComponent;