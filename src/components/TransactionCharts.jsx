import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween'; // Import plugin for date range checking
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

dayjs.extend(isBetween); // Extend dayjs with the isBetween plugin

// Helper function to format currency
const formatCurrency = (value) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TransactionCharts = ({ transactions = [] }) => {

	const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, startAngle, endAngle, fill, payload, percent, value }) => {
		const RADIAN = Math.PI / 180;
		// Position for the line end
		const sin = Math.sin(-RADIAN * midAngle);
		const cos = Math.cos(-RADIAN * midAngle);
		const sx = cx + (outerRadius + 10) * cos;
		const sy = cy + (outerRadius + 10) * sin;
		// Position for the text start, slightly further out
		const mx = cx + (outerRadius + 20) * cos;
		const my = cy + (outerRadius + 100) * sin;
		const ex = mx + (cos >= 0 ? 1 : -1) * 12; // Length of the horizontal part of the line
		const ey = my;
		const textAnchor = cos >= 0 ? 'start' : 'end';
		const percentage = (percent * 100).toFixed(0);

		return (
			<g>
				{/* The line connecting slice to text */}
				<path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
				{/* Circle dot at the end of the first line segment */}
				<circle cx={sx} cy={sy} r={2} fill={fill} stroke="none" />
				{/* The text label */}
				<text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} textAnchor={textAnchor} fill="#ccc" fontSize={12}>
					{`${payload.name} (${percentage}%)`}
				</text>
			</g>
		);
	};

	// --- Data Processing ---
	const chartData = useMemo(() => {
		if (!transactions || transactions.length === 0) {
			return {
				typeData: [],
				methodData: [],
				weeklyData: [],
			};
		}

		// 1. Data for Credit vs Debit Pie Chart
		const typeSummary = transactions.reduce((acc, tx) => {
			const amount = parseFloat(tx.amount || 0);
			if (tx.type.toLowerCase() === 'credit') {
				acc.credit += amount;
			} else if (tx.type.toLowerCase() === 'debit') {
				acc.debit += amount;
			}
			return acc;
		}, { credit: 0, debit: 0 });

		const typeData = [
			{ name: 'Credit', value: typeSummary.credit, fill: 'hsl(var(--chart-1))' }, // Use shadcn chart colors
			{ name: 'Debit', value: typeSummary.debit, fill: 'hsl(var(--chart-2))' },
		].filter(d => d.value > 0); // Filter out zero values

		// 2. Data for Payment Method Pie Chart
		const methodSummary = transactions.reduce((acc, tx) => {
			const amount = parseFloat(tx.amount || 0);
			const method = tx.method || 'other';
			acc[method] = (acc[method] || 0) + amount;
			return acc;
		}, {});

		const methodData = Object.entries(methodSummary).map(([name, value], index) => ({
			name,
			value,
			fill: `hsl(var(--chart-${index + 1}))` // Cycle through chart colors
		})).filter(d => d.value > 0);

		// 3. Data for Weekly Bar Chart
		const today = dayjs();
		const lastWeekStart = today.subtract(6, 'day').startOf('day'); // Go back 6 days from today
		const weeklySummary = {};

		// Initialize days
		for (let i = 0; i < 7; i++) {
			const dateStr = lastWeekStart.add(i, 'day').format('MMM D'); // Format like "Oct 16"
			weeklySummary[dateStr] = { date: dateStr, credit: 0, debit: 0 };
		}

		transactions.forEach(tx => {
			const txDate = dayjs(tx.dateTime);
			// Check if the transaction is within the last 7 days
			if (txDate.isBetween(lastWeekStart, today, 'day', '[]')) { // '[]' includes start and end day
				const dateStr = txDate.format('MMM D');
				const amount = parseFloat(tx.amount || 0);
				if (tx.type.toLowerCase() === 'credit') {
					weeklySummary[dateStr].credit += amount;
				} else if (tx.type.toLowerCase() === 'debit') {
					weeklySummary[dateStr].debit += amount;
				}
			}
		});

		const weeklyData = Object.values(weeklySummary);

		return { typeData, methodData, weeklyData };
	}, [transactions]);

	const pieTooltip = ({ active, payload }) => {
		if (active && payload && payload.length) {
			return (
				<div className="rounded-lg border bg-background !p-1 shadow-sm">
					<div className="grid grid-cols-2 gap-2">
						<div className="flex flex-col">
							<span className="text-[0.70rem] uppercase text-muted-foreground">{payload[0].name}</span>
							<span className="font-bold text-muted-foreground">{formatCurrency(payload[0].value)}</span>
						</div>
					</div>
				</div>
			);
		}
		return null;
	};


	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 !p-2 !mb-8 bg-[#08080a]">
			{/* Type Pie Chart */}
            <Card className="bg-[#01010e] border-neutral-700 text-white">
                <CardHeader>
                    <CardTitle className="!p-2 text-pink-500 text-center">Credit vs Debit</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="mx-auto aspect-square h-[350px]">  {/* className="mx-auto aspect-square h-[350px]" */}
                        {/* <ResponsiveContainer width="100%" height="100%"> */}
                             <PieChart width={350} height={350} margin={{ top: 100, right: 150, bottom: 100, left: 150 }}> {/* Added margin */}
                                <ChartTooltip content={pieTooltip} />
                                <Pie
                                    data={chartData.typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false} // Disable default line
                                    label={renderCustomizedLabel} // Use our custom label function
                                    outerRadius={60} // Adjust radius if needed
                                    innerRadius={30} // Optional: Create a donut chart
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        {/* </ResponsiveContainer> */}
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Method Pie Chart */}
            <Card className="bg-[#01010e] border-neutral-700 text-white">
                <CardHeader>
                    <CardTitle className="!p-2 text-pink-500 text-center">Amount by Method</CardTitle>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={{}} className="mx-auto aspect-square h-[350px]" >
                        {/* <ResponsiveContainer width="100%" height="100%"> */}
                            <PieChart width={350} height={350} margin={{ top: 100, right: 150, bottom: 100, left: 150 }}> {/* Added margin */}
                                <ChartTooltip content={pieTooltip} />
                                <Pie
                                    data={chartData.methodData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false} // Disable default line
                                    label={renderCustomizedLabel} // Use our custom label function
                                    outerRadius={60} // Adjust radius if needed
                                    innerRadius={30} // Optional: Create a donut chart
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.methodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        {/* </ResponsiveContainer> */}
                    </ChartContainer>
                </CardContent>
            </Card>

			{/* Weekly Bar Chart */}
			<Card className="bg-[#01010e] border-neutral-700 text-white md:col-span-2 lg:col-span-1">
				<CardHeader>
					<CardTitle className="!p-2 text-pink-500 text-center">Last 7 Days Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<ChartContainer config={{}} className="h-[250px] w-full">
						{/* <ResponsiveContainer width="100%" height="100%"> */}
							<BarChart  data={chartData.weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
								<XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.5)" fontSize={10} tickLine={false} axisLine={false} />
								<YAxis stroke="rgba(255, 255, 255, 0.5)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
								<ChartTooltip
									cursor={false}
									content={({ active, payload }) => {
										if (active && payload && payload.length) {
											return (
												<div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
													<p className="font-bold">{payload[0].payload.date}</p>
													<p style={{ color: 'hsl(var(--chart-1))' }}>Credit: {formatCurrency(payload[0].value)}</p>
													<p style={{ color: 'hsl(var(--chart-2))' }}>Debit: {formatCurrency(payload[1].value)}</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar dataKey="credit" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
								<Bar dataKey="debit" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
							</BarChart>
						{/* </ResponsiveContainer> */}
					</ChartContainer>
				</CardContent>
			</Card>
		</div>
	);
};

export default TransactionCharts;