import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';



const muiInputStyles = {
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

// Define payment methods
const METHODS = ["phonepay", "googlepay", "paytm", "aadhar", "other"];
const TYPES = ["credit", "debit"];

const FilterPopover = ({ initialFilters, setFilters, onApplyFilters }) => {
	const [startDate, setStartDate] = useState(initialFilters.startDate || null);
	const [endDate, setEndDate] = useState(initialFilters.endDate || null);
	const [amountRange, setAmountRange] = useState(initialFilters.amountRange || [0, 10000]); // Default range
	const [selectedMethods, setSelectedMethods] = useState(initialFilters.methods || []);
	const [selectedTypes, setSelectedTypes] = useState(initialFilters.types || []);

	// Update amount inputs when slider changes
	const handleSliderChange = (value) => {
		setAmountRange(value);
	};

	// Update slider when amount inputs change
	const handleInputChange = (index, value) => {
		const newValue = parseFloat(value) || 0;
		const newRange = [...amountRange];
		newRange[index] = newValue;
		// Ensure min is not greater than max
		if (index === 0 && newValue > newRange[1]) newRange[1] = newValue;
		if (index === 1 && newValue < newRange[0]) newRange[0] = newValue;
		setAmountRange(newRange);
	};

	// Toggle payment method selection
	const handleMethodToggle = (method) => {
		setSelectedMethods(prev =>
			prev.includes(method)
				? prev.filter(m => m !== method)
				: [...prev, method]
		);
	};
	const handleTypeToggle = (type) => {
		setSelectedTypes(prev =>
			prev.includes(type)
				? prev.filter(m => m !== type)
				: [...prev, type]
		);
	};

	const applyFilters = () => {
		setFilters({
			startDate,
			endDate,
			amountRange,
			methods: selectedMethods,
			types: selectedTypes,
		})
		onApplyFilters({
			startDate,
			endDate,
			amountRange,
			methods: selectedMethods,
			types: selectedTypes,
		});
	};

	const clearFilters = () => {
		setStartDate(null);
		setEndDate(null);
		setAmountRange([0, 100000]);
		setSelectedMethods([]);
		setFilters({
			startDate: null,
			endDate: null,
			amountRange: [0, 100000],
			methods: [],
			types: [],
		})
		onApplyFilters({ // Apply cleared filters immediately
			startDate: null,
			endDate: null,
			amountRange: [0, 100000],
			methods: [],
			types: [],
		});
	};

	// Sync local state if initialFilters change from parent
	useEffect(() => {
		setStartDate(initialFilters.startDate || null);
		setEndDate(initialFilters.endDate || null);
		setAmountRange(initialFilters.amountRange || [0, 100000]);
		setSelectedMethods(initialFilters.methods || []);
		setSelectedTypes(initialFilters.types || []);
	}, [initialFilters]);


	return (
		<div className="!p-3 w-80 space-y-4">
			{/* Date Range */}
			<div>
				<Label className="text-sm font-medium text-gray-300">Date Range</Label>
				<div className="flex gap-2 !mt-1">
					<DatePicker
						label="Start Date"
						value={startDate}
						onChange={setStartDate}
						sx={muiInputStyles}
						slotProps={{ textField: { size: 'small', autoFocus: false }}}
					/>
					<DatePicker
						label="End Date"
						value={endDate}
						onChange={setEndDate}
						sx={muiInputStyles}
						slotProps={{ textField: { size: 'small' } }}
					/>
				</div>
			</div>

			{/* Amount Range */}
			<div className='!mt-2'>
				<Label className="text-sm font-medium text-gray-300">Amount Range</Label>
				<Slider
					value={amountRange}
					onValueChange={handleSliderChange}
					max={100000} // Adjust max based on your data
					step={100}
					//className="!my-3 [&>span:first-child]:h-1 [&>span:first-child>span]:bg-[#ff0066] [&>span:nth-child(2)]:bg-[#ff0066] [&>span:nth-child(3)]:bg-[#ff0066]]"
					className="
						!my-3 relative flex items-center select-none touch-none w-full h-5

						// --- Track Styling (Targeting data-slot) ---
						[&_[data-slot='slider-track']]:relative
						[&_[data-slot='slider-track']]:h-1 // Adjust height as needed
						[&_[data-slot='slider-track']]:w-full
						[&_[data-slot='slider-track']]:grow
						[&_[data-slot='slider-track']]:overflow-hidden // <-- Important for rounding
						[&_[data-slot='slider-track']]:rounded-full   // <-- Round the main track
						[&_[data-slot='slider-track']]:bg-neutral-600 // Track background

						// --- Range Styling (Targeting data-slot) ---
						[&_[data-slot='slider-range']]:absolute
						[&_[data-slot='slider-range']]:h-full
						[&_[data-slot='slider-range']]:bg-[#ff0066]  // Range background
						[&_[data-slot='slider-range']]:rounded-full  // <-- Round the range

						// --- Thumb Styling ---
						[&_[data-slot='slider-thumb']]:block
						[&_[data-slot='slider-thumb']]:h-3          // Thumb size
						[&_[data-slot='slider-thumb']]:w-3          // Thumb size
						[&_[data-slot='slider-thumb']]:rounded-full
						
						[&_[data-slot='slider-thumb']]:bg-gray-200
						//[&_[data-slot='slider-thumb']]:ring-offset-background
						[&_[data-slot='slider-thumb']]:transition-colors
						[&_[data-slot='slider-thumb']]:focus-visible:outline-none
						[&_[data-slot='slider-thumb']]:focus-visible:ring-2
						[&_[data-slot='slider-thumb']]:focus-visible:ring-ring
						[&_[data-slot='slider-thumb']]:focus-visible:ring-offset-2
						[&_[data-slot='slider-thumb']]:disabled:pointer-events-none
						[&_[data-slot='slider-thumb']]:disabled:opacity-50
					"
				/>
				<div className="flex justify-between gap-2 text-xs text-gray-400">
					<Input
						type="number"
						value={amountRange[0]}
						onChange={(e) => handleInputChange(0, e.target.value)}
						className="!px-2 h-8 bg-neutral-700 border-none text-white focus:ring-[#ff0066]"
						placeholder="Min"
					/>
					<Input
						type="number"
						value={amountRange[1]}
						onChange={(e) => handleInputChange(1, e.target.value)}
						className="!px-2 h-8 bg-neutral-700 border-none text-white focus:ring-[#ff0066]"
						placeholder="Max"
					/>
				</div>
			</div>

			{/* Payment Method */}
			<div className='!my-2'>
				<Label className="text-sm font-medium text-gray-300">Payment Method</Label>
				<div className="flex flex-wrap gap-2 !my-1">
					{METHODS.map((method) => (
						<Button
							key={method}
							variant="outline"
							size="sm"
							onClick={() => handleMethodToggle(method)}
							className={`rounded-full !p-2 h-7 text-xs cursor-pointer border-neutral-600 hover:bg-neutral-700 hover:text-white transition-colors
                                ${selectedMethods.includes(method)
									? 'bg-[#ff0066] text-white border-pink-600 hover:bg-[#e6005c]'
									: 'bg-neutral-800 text-gray-300'
								}
                            `}
						>
							{method}
						</Button>
					))}
				</div>
			</div>
			{/* transaction type */}
			<div className='!my-2'>
				<Label className="text-sm font-medium text-gray-300">Payment Type</Label>
				<div className="flex flex-wrap gap-2 !my-1">
					{TYPES.map((type) => (
						<Button
							key={type}
							variant="outline"
							size="sm"
							onClick={() => handleTypeToggle(type)}
							className={`rounded-full !p-2 h-7 text-xs cursor-pointer border-neutral-600 hover:bg-neutral-700 hover:text-white transition-colors
                                ${selectedTypes.includes(type)
									? 'bg-[#ff0066] text-white border-pink-600 hover:bg-[#e6005c]'
									: 'bg-neutral-800 text-gray-300'
								}
                            `}
						>
							{type}
						</Button>
					))}
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-end gap-2 !pt-3  border-t border-neutral-700">
				<Button variant="outline" size="sm" onClick={clearFilters} className="!p-2 cursor-pointer bg-neutral-800 text-white hover:text-[#ff0066] hover:bg-neutral-700">Clear</Button>
				<Button size="sm" onClick={applyFilters} className="!p-2 cursor-pointer bg-[#ff0066] hover:bg-[#e6005c] text-white">Apply</Button>
			</div>
		</div>
	);
};

export default FilterPopover;