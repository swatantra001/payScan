import { create } from "zustand";
import dayjs from "dayjs";

const transactionData = [
    { id: 1, amount: 500.00, receiverName: "Arjun Verma", method: "Phone Pay", dateTime: "Oct 08, 2025, 09:15 PM", transactionId: "T2510082115123456789", senderName: "Priya Singh", senderId: "priya.singh@okaxis", receiverId: "arjun.v@ybl", type: 'Debit' },
    { id: 2, amount: 1250.50, receiverName: "Sneha Reddy", method: "Google Pay", dateTime: "Oct 07, 2025, 03:45 PM", transactionId: "CICAgOCPqZ7yXw", senderName: "Rohan Mehra", senderId: "rohanm@okhdfc", receiverId: "snehareddy@okicici", type: 'Credit' },
    { id: 3, amount: 85.00, receiverName: "Grocery Store", method: "Paytm", dateTime: "Oct 07, 2025, 11:20 AM", transactionId: "paytmqr281000012345", senderName: "Anjali Gupta", senderId: "9876543210@paytm", receiverId: "grocerystore@paytm", type: 'Debit' },
    { id: 4, amount: 2000.00, receiverName: "Vikram Rathore", method: "Phone Pay", dateTime: "Oct 06, 2025, 08:00 PM", transactionId: "T2510062000987654321", senderName: "Sameer Khan", senderId: "sameer.k@ybl", receiverId: "vikramr@axl", type: 'Debit' },
    { id: 5, amount: 300.75, receiverName: "Cafe Corner", method: "Google Pay", dateTime: "Oct 05, 2025, 01:10 PM", transactionId: "CICAgODFjY8yQw", senderName: "Nisha Patel", senderId: "nishap@oksbi", receiverId: "cafecorner@okaxis", type: 'Credit' },
    { id: 6, amount: 5500.00, receiverName: "Aisha Begum", method: "Paytm", dateTime: "Oct 04, 2025, 06:55 PM", transactionId: "paytmqr281000065432", senderName: "Karan Malhotra", senderId: "karan.m@paytm", receiverId: "aishab@paytm", type: 'Debit' },
    { id: 7, amount: 150.00, receiverName: "Book World", method: "Phone Pay", dateTime: "Oct 04, 2025, 10:30 AM", transactionId: "T2510041030555444333", senderName: "Divya Nair", senderId: "divyan@ybl", receiverId: "bookworld@axl", type: 'Credit' },
    { id: 8, amount: 999.00, receiverName: "Online Shopping", method: "Google Pay", dateTime: "Oct 03, 2025, 09:05 PM", transactionId: "CICAgOCLpU9yXg", senderName: "Aditya Rao", senderId: "adityarao@okhdfc", receiverId: "onlineshop@okicici", type: 'Debit' },
    { id: 9, amount: 420.00, receiverName: "Ravi Prasad", method: "Paytm", dateTime: "Oct 02, 2025, 02:20 PM", transactionId: "paytmqr281000098765", senderName: "Sunita Devi", senderId: "sunita.d@paytm", receiverId: "raviprasad@paytm", type: 'Credit' },
    { id: 10, amount: 75.00, receiverName: "Tea Stall", method: "Phone Pay", dateTime: "Oct 01, 2025, 05:40 PM", transactionId: "T2510011740111222333", senderName: "Deepak Chauhan", senderId: "deepakc@ybl", receiverId: "teastall@ybl", type: 'Debit' },
    { id: 11, amount: 1800.00, receiverName: "Fatima Sheikh", method: "Google Pay", dateTime: "Sep 30, 2025, 07:12 PM", transactionId: "CICAgODCqZ7ySw", senderName: "Manish Kumar", senderId: "manishk@oksbi", receiverId: "fatimasheikh@okaxis", type: 'Credit' },
    { id: 12, amount: 250.00, receiverName: "Rajesh Singh", method: "Phone Pay", dateTime: "Sep 29, 2025, 12:00 PM", transactionId: "T2509291200777888999", senderName: "Geeta Joshi", senderId: "geetaj@axl", receiverId: "rajesh.s@ybl", type: 'Debit' },
];

const form = {
    _id: null,
		id: "",
		transactionId: "",
		amount: "",
		receiverName: "",
		senderName: "",
    senderId: "",
    receiverId: "",
    dateTime: dayjs(),
		method: "other",
		type: "credit"
	}

  const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const storedTheme = window.localStorage.getItem('theme');
    return storedTheme || 'dark';
  }
  return 'dark';
};

const useTransactionStore = create((set) => ({

    isFormVisible: false,
    setFormVisible: (value) => set((state) => ({ isFormVisible: value })),
    formState: form,
    //setFormState: (value) => set((state) => ({ formState: {...state.formState,...value } })),
    setFormState: (value) => set({formState: value}),
    resetFormState: () => set(() => ({ formState: form })),
    image: null,
    setImage: (value) => set({ image: value }),
    isConfirmOpen: false,
    setIsConfirmOpen: (value) => set({ isConfirmOpen: value }),
    isModalOpen: false,
    setIsModalOpen: (value) => set({ isModalOpen: value }),
    isCameraOpen: false,
    setIsCameraOpen: (value) => set({ isCameraOpen: value }),
    isAlertOpen: false,
    setIsAlertOpen: (value) => set({ isAlertOpen: value }),
    isDuplicateAlertOpen: false,
    setIsDuplicateAlertOpen: (value) => set({ isDuplicateAlertOpen: value }),

    theme: getInitialTheme(),
    toggleTheme: () => set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('theme', newTheme); // Save to localStorage
      return { theme: newTheme };
    }),
  
}));

export default useTransactionStore