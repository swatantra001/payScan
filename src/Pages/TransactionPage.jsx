import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ModernForm from '@/components/FormPage';
import TableComponent from '@/components/Table';
import useTransactionStore from '@/store/transactionStore';
import { TooltipProvider } from '@/components/ui/tooltip';
import { dark } from '@clerk/themes';
import { SignedIn, useAuth, UserButton } from "@clerk/clerk-react";
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import FilterPopover from '../components/FilterPopover';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter, Search, Loader2Icon, Download} from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import TransactionCharts from '../components/TransactionCharts';
import { Input } from '@/components/ui/input';
import TransactionPageSkeleton from '@/components/TransactionPageSkeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PdfPreviewModal from '../components/PdfPreviewModal';

const TransactionsPage = () => {
	const { isLoaded, isSignedIn } = useAuth();
	const isFormVisible = useTransactionStore((state) => state.isFormVisible);
	const setFormVisible = useTransactionStore((state) => state.setFormVisible);
	const resetFormState = useTransactionStore((state) => state.resetFormState);
	const deleteTransaction = useMutation(api.transactions.remove);
	const setFormState = useTransactionStore((state) => state.setFormState);
	const setImage = useTransactionStore((state) => state.setImage);
	const isConfirmOpen = useTransactionStore((state) => state.isConfirmOpen);
	const isModalOpen = useTransactionStore((state) => state.isModalOpen);
	const isCameraOpen = useTransactionStore((state) => state.isCameraOpen);
	const isAlertOpen = useTransactionStore((state) => state.isAlertOpen);
	const isDuplicateAlertOpen = useTransactionStore((state) => state.isDuplicateAlertOpen);

	const [filters, setFilters] = useState({
		startDate: null,
		endDate: null,
		amountRange: [0, 100000],
		methods: [],
		types: [],
	});
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfFileName, setPdfFileName] = useState("");
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

	if (!isLoaded) {
		return (
			<div className="flex !h-[100vh] !w-[100vw] bg-[#1a1a1d] justify-center items-center">
				<Loader2Icon size={24} className='text-white animate-spin' />
				<p className="text-white text-xl">Transaction loading...</p>
			</div>
		);
	}

	const transactions = useQuery(isSignedIn ? api.transactions.get : null);// || [];

	const filteredTransactions = useMemo(() => {
		if (!transactions) return [];

		const normalizedSearch = searchTerm.trim().toLowerCase();

		return transactions.filter(tx => {
			const txDate = dayjs(tx.dateTime);
			const txAmount = parseFloat(tx.amount || 0);
			const dateMatch =
				(!filters.startDate || txDate.isAfter(dayjs(filters.startDate).startOf('day'))) &&
				(!filters.endDate || txDate.isBefore(dayjs(filters.endDate).endOf('day')));
			const amountMatch =
				txAmount >= filters.amountRange[0] &&
				txAmount <= filters.amountRange[1];
			const methodMatch =
				filters.methods.length === 0 || filters.methods.includes(tx.method);
			const typeMatch =
				filters.types.length === 0 || filters.types.includes(tx.type);

			const popoverFiltersMatch = dateMatch && amountMatch && methodMatch && typeMatch;

			const searchMatch = normalizedSearch === ""
				? true
				: (tx.transactionId || "").toString().toLowerCase().startsWith(normalizedSearch);

			return popoverFiltersMatch && searchMatch;
		});
	}, [transactions, filters, searchTerm]);
	// if (!isLoaded || transactions === undefined) { 
	//     return <TransactionPageSkeleton />; // <-- Render the skeleton component
	// }

	const handleApplyFilters = (newFilters) => {
		setFilters(newFilters);
		setIsPopoverOpen(false);
	};

	const handleDelete = async (id) => {
		try {
			await deleteTransaction({ id: id });
			toast.success("Transaction deleted successfully!");
		} catch (error) {
			console.error("Error deleting transaction:", error);
			toast.error("Error deleting transaction!");
		}
	};

	const handleEdit = (id) => {
		try {
			const transaction = transactions.find((item) => item._id === id);
			const payload = { ...transaction, dateTime: dayjs(transaction.dateTime) };
			setFormState(payload);
			setFormVisible(true);
			toast.success("transaction details populated to form!");
		} catch (error) {
			console.error("Error editing transaction:", error);
			toast.error("coudn't populate the transaction details to form!");
		}
	};

	// download pdf function
	// Helper function to format the filter state into a string
	const getFilterString = () => {
		let parts = [];
		if (filters.startDate) parts.push(`From: ${dayjs(filters.startDate).format('DD/MM/YY')}`);
		if (filters.endDate) parts.push(`To: ${dayjs(filters.endDate).format('DD/MM/YY')}`);
		if (filters.methods.length > 0) parts.push(`Methods: ${filters.methods.join(', ')}`);
		if (filters.types.length > 0) parts.push(`Types: ${filters.types.join(', ')}`);
		if (parts.length === 0) return "None";
		return parts.join(' | ');
	};

	// --- NEW: PDF Generation Function ---
	const handleGeneratePdf = () => {
        if (filteredTransactions.length === 0) {
            toast.error("No transactions to download!");
            return;
        }

        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: 'a4',
            });

            // 1. DEFINE TABLE COLUMNS (8 columns)
            const tableColumn = [
                "S.N.", "Amount", "Sender Name", "Method", "Type", 
                "Date & Time", "Transaction-id", "Receiver Name"
            ];
            
            // 2. CREATE TABLE ROWS (Fixes the data merging bug)
            const tableRows = filteredTransactions.map((tx, index) => [
                index + 1,
                `${parseFloat(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                tx.senderName || "N/A",
                tx.method || "N/A",
                tx.type || "N/A",
                dayjs(tx.dateTime).format('MMM D, YYYY, h:mm A'),
                tx.transactionId || "N/A",
                tx.receiverName || "N/A",
            ]);

            // --- Document Header ---
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(255, 0, 102); // Pink color
            doc.text("PayScan Transaction Report", 15, 30);

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150); // Gray color
            doc.text(`Generated: ${dayjs().format('DD MMM YYYY, h:mm A')}`, 15, 40);
            // ... (add filter string here if you want) ...

            // 3. FIX FOR TOTAL AMOUNT (uses colspan)
            const totalAmount = filteredTransactions.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            const formattedTotal = `${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            // --- Generate Main Table ---
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 65,
                theme: 'grid',
                styles: { fillColor: [30, 30, 34], textColor: [240, 240, 240], lineColor: [50, 50, 50], lineWidth: 0.5 },
                headStyles: { fillColor: [255, 0, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
                foot: [
                    // This creates two columns for the footer
                    [
                        { content: 'Total', styles: { fontStyle: 'bold', halign: 'right' } },
                        { content: formattedTotal, colSpan: 7, styles: { fontStyle: 'bold' } }
                    ]
                ],
                footStyles: { fillColor: [42, 42, 46], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 12 },
                didDrawPage: (data) => { /* ... page number logic ... */ }
            });

            // 4. --- NEW SUMMARY SECTION (Key-Value Pairs) ---
            
            // Calculate summaries
            let totalCredit = 0;
            let totalDebit = 0;
            const methodTotals = { googlepay: 0, phonepay: 0, paytm: 0, aadhar: 0, other: 0 };

            for (const tx of filteredTransactions) {
                const amount = parseFloat(tx.amount || 0);
                const type = (tx.type || "").toLowerCase();
                const method = (tx.method || "other").toLowerCase();

                if (type === 'credit') totalCredit += amount;
                if (type === 'debit') totalDebit += amount;

                if (method in methodTotals) {
                    methodTotals[method] += amount;
                } else {
                    methodTotals.other += amount;
                }
            }

            // Get Y position after the first table
            const finalY = (doc).lastAutoTable.finalY; 
            let currentY = finalY + 20; // Starting Y for summary

            doc.setFontSize(16);
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(255, 255, 255);
            doc.text("Summary", 15, currentY);
            currentY += 20;

            // Set font for key-value pairs
            doc.setFontSize(10);
            const labelX = 20;
            const valueX = 100;

            const formatSummaryCurrency = (val) => `${val.toLocaleString('en-IN')}`;
            
            // Render each key-value pair
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(255, 0, 102); // Pink for labels
            doc.text("Total Credit:", labelX, currentY);
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(formatSummaryCurrency(totalCredit), valueX, currentY);
            currentY += 15;

            doc.setFont("Helvetica", "bold");
            doc.setTextColor(255, 0, 102);
            doc.text("Total Debit:", labelX, currentY);
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(formatSummaryCurrency(totalDebit), valueX, currentY);
            currentY += 15;

            doc.setFont("Helvetica", "bold");
            doc.setTextColor(255, 0, 102);
            doc.text("Total Google Pay:", labelX, currentY);
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(formatSummaryCurrency(methodTotals.googlepay), valueX, currentY);
            currentY += 15;
            
            doc.setFont("Helvetica", "bold");
            doc.setTextColor(255, 0, 102);
            doc.text("Total Phone Pay:", labelX, currentY);
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(formatSummaryCurrency(methodTotals.phonepay), valueX, currentY);
            currentY += 15;

            doc.setFont("Helvetica", "bold");
            doc.setTextColor(255, 0, 102);
            doc.text("Total Paytm:", labelX, currentY);
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(formatSummaryCurrency(methodTotals.paytm), valueX, currentY);
            currentY += 15;

            doc.setFont("Helvetica", "bold");
            doc.setTextColor(255, 0, 102);
            doc.text("Total Aadhar:", labelX, currentY);
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(formatSummaryCurrency(methodTotals.aadhar), valueX, currentY);
            currentY += 15;

            doc.setFont("Helvetica", "bold");
            doc.setTextColor(255, 0, 102);
            doc.text("Total Other:", labelX, currentY);
            doc.setFont("Helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(formatSummaryCurrency(methodTotals.other), valueX, currentY);

            // // --- Save the PDF ---
            // doc.save(`PayScan_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
            // toast.success("PDF Downloaded!");

			const pdfDataUri = doc.output('datauristring');
            const fileName = `PayScan_Report_${dayjs().format('YYYY-MM-DD')}.pdf`;
            
            setPdfUrl(pdfDataUri);
            setPdfFileName(fileName);
            setIsPdfModalOpen(true); // <-- This opens the modal

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF.");
        }
    };

	// --- NEW Function to handle the actual download from the modal ---
    const handleActualDownload = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("PDF Downloaded!");
        setIsPdfModalOpen(false); // Close the modal
    };

	
	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<div className={`min-h-screen w-[100%]  bg-neutral-900 text-white p-8 font-sans`}>
				<header className="w-full mb-3 sticky top-0 z-30 bg-[#1a1a1d]  shadow-xs shadow-[#ff0066] !p-2">
					<div className="flex justify-around md:justify-between items-center !px-2">
						<h1 className="text-3xl md:text-4xl font-extrabold">PayScan</h1>
						<div className='flex items-center gap-3 !px-5'>
							<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
								<PopoverTrigger asChild>
									<Button variant="outline" className="gap-1 !p-2 md:!p-3 !py-3 md:!py-6 px-6 cursor-pointer bg-neutral-800 border-neutral-600 hover:bg-neutral-700 hover:text-[#ff0066] transition-colors">
										<Filter className='hidden md:inline' size={14} />
										Filters
									</Button>
								</PopoverTrigger>
								<PopoverContent sideOffset={18} className="w-auto p-0 bg-[#1e1e22] border-neutral-700 text-white" align="end">
									<FilterPopover
										initialFilters={filters}
										setFilters={setFilters}
										onApplyFilters={handleApplyFilters}
									/>
								</PopoverContent>
							</Popover>
							<Button

								onClick={() => { setFormVisible(!isFormVisible); if (!isFormVisible) setImage(null); resetFormState(); }}
								className="gap-1 !p-2 md:!p-3 !py-3 md:!py-6 px-6 bg-[#ff0066] hover:bg-[#e6005c] text-white font-bold rounded-lg transition duration-300 cursor-pointer"
							>
								{isFormVisible ? (
									<>
										<span className="md:hidden">Close</span>
										<span className="hidden md:inline">Close Form</span>
									</>
								) : (
									<>
										<span className="md:hidden">Add</span>
										<span className="hidden md:inline">ADD Transaction</span>
									</>
								)}
							</Button>

							<SignedIn>
								<UserButton
									appearance={{
										baseTheme: dark,
										elements: {
											userButtonAvatarBox: {
												width: "3rem",
												height: "3rem",
											},
											userButtonPopoverCard: {
												backgroundColor: "#2a2a2e",
												borderRadius: "0.5rem",
												boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
												border: "1px solid rgba(255, 255, 255, 0.1)"
											},
											userButtonPopoverItem: {
												"&:hover": {
													backgroundColor: "#ff0066",
													color: "white",
												},
												borderRadius: "0.375rem",
												margin: "0.25rem 0.5rem",
											},
											userButtonPopoverMainIdentifier: { color: "white" },
											userButtonPopoverSecondaryIdentifier: { color: "gray" },
											userButtonPopoverFooter: {
												borderTop: "1px solid rgba(255, 255, 255, 0.1)",
												paddingTop: "0.75rem",
												marginTop: "0.5rem"
											},
											userButtonPopoverFooterPages: {
												"&:hover": {
													backgroundColor: "#ff0066",
													color: "white",
												},
												borderRadius: "0.375rem",
												margin: "0.25rem 0.5rem",
												padding: "0.5rem 0.75rem"
											}
										}
									}}
								/>
							</SignedIn>
						</div>
					</div>

				</header>
				<main className={`max-w-7xl ${(isConfirmOpen || isModalOpen || isCameraOpen || isPopoverOpen || isAlertOpen || isDuplicateAlertOpen) ? "blur-xs" : ""} mx-auto p-4 md:p-8`}>

					{/* --- ADD THIS SEARCH BAR --- */}
					<div className="bg-[#1e1e22] flex justify-center gap-2 !p-6">
						<div className="relative max-w-sm md:min-w-lg md:max-w-xl">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
							<Input
								type="text"
								placeholder="Search by Transaction ID..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full !pl-10 !pr-4 !py-2 bg-neutral-800 border-neutral-700 text-white rounded-lg focus:!ring-1 focus:ring-pink-500"
							/>
						</div>
						{/* --- ADD DESKTOP DOWNLOAD BUTTON --- */}
						<Button
							onClick={handleGeneratePdf}
							variant="outline"
							className="gap-1 !p-2 md:!p-4 !py-3 px-4 md:px-6 cursor-pointer bg-neutral-800 border-neutral-600 hover:bg-neutral-700 hover:text-[#ff0066] transition-colors"
						>
							<Download size={14} />
							<span className="hidden md:inline">Download PDF</span>
						</Button>
					</div>

					<AnimatePresence>
						{isFormVisible && (
							<TooltipProvider delayDuration={0}>
								<ModernForm transactions={filteredTransactions} onClose={() => { setFormVisible(false); resetFormState(); }} />
							</TooltipProvider>
						)}
					</AnimatePresence>
				</main>

				<div className={`overflow-y-scroll ${(isConfirmOpen || isModalOpen || isCameraOpen || isPopoverOpen || isAlertOpen || isDuplicateAlertOpen) ? "blur-xs" : ""} w-[100%]`}>
					<TableComponent transactions={filteredTransactions} onEdit={handleEdit} onDelete={handleDelete} />
				</div>
				{filteredTransactions.length > 0 &&
				<div className={`${(isConfirmOpen || isModalOpen || isCameraOpen || isPopoverOpen || isAlertOpen || isDuplicateAlertOpen) ? "blur-xs" : ""}`}>
					<TransactionCharts transactions={filteredTransactions} />
				</div>
				}
				{/* --- RENDER THE NEW MODAL --- */}
                <PdfPreviewModal 
                    isOpen={isPdfModalOpen}
                    onClose={() => setIsPdfModalOpen(false)}
                    pdfUrl={pdfUrl}
                    fileName={pdfFileName}
                    onDownload={handleActualDownload}
                />
			</div>
		</LocalizationProvider>
	);
};

export default TransactionsPage;
