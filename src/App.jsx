import react from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TransactionsPage from './Pages/TransactionPage';

import { SignedOut, SignIn } from "@clerk/clerk-react";

import { Authenticated } from 'convex/react';
import { Toaster } from 'sonner';


const darkTheme = createTheme({
	palette: {
		mode: 'dark', // This is the key to enable dark mode styling
		primary: {
			main: '#ff0066', // Your pink accent color
		},
		background: {
			paper: '#01010e', // The background color for the calendar popup
		},
		text: {
			primary: '#ffffff',
			secondary: '#b0b0b0',
		},
	},
});


function App() {
	return (
		<>
			<ThemeProvider theme={darkTheme}>
				<main className='h-[100vh] w-[100vw] bg-[#0e0e11]'>
					<Toaster />
					<SignedOut>
						{/* Display the sign-in form when the user is signed out */}
						<div className="flex bg-black justify-center items-center h-[100vh]">
							<SignIn />
						</div>
					</SignedOut>
					<Authenticated>
						{/* Display your app's content when the user is signed in */}
						<TransactionsPage />
					</Authenticated>
				</main>
			</ThemeProvider>
		</>
	)
}

export default App
