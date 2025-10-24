// convex/gemini.ts

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from '@google/genai';

//const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	console.log("GEMINI_API_KEY is not set in Convex environment variables.")
	throw new Error("GEMINI_API_KEY is not set in Convex environment variables.");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

const prompt_instructions = `
     Analyze the attached UPI transaction screenshot carefully.
  From the visual cues, logos, and text, identify the specific payment app used (e.g., "googlepay", "phonepay", "paytm" and many more etc).
  Provide the output ONLY in a valid JSON format. If a value is not present, use null.

    - payment_app: The name of the app (e.g., "googlepay", "phonepay", "paytm", "aadhar" or "other") in the given case.
    - status: The final status of the transaction (e.g., "Successful", "Completed", "Failed").
    - amount: The primary numeric transaction amount.
    - dateTime: The date and time of the transaction in form of compatible with dayjs() i.e. => i will store this dateTime like that .....dateTime: dayjs(extractedData.dateTime), where extractedData is variable name which store the result you will return.
    - transaction_type: "debit" if money was sent, or "credit" if money was received.
    - upi_transaction_id: The main UPI Transaction ID or Reference Number (Ref No).
    - sender_name: The name of the person or entity sending the money.
    - sender_id: The UPI ID or phone number of the sender.
    - receiver_name: The name of the person or entity receiving the money.
    - receiver_id: The UPI ID or phone number of the receiver.
    `

// 3. This is your file-to-part logic, now inside the action
// We don't need fileToGenerativePart, we can just create the Part object

type Part = {
	inlineData: {
		data: string;
		mimeType: string;
	};
};

const fileToPart = (base64Data: string, mimeType: string): Part => {
	return {
		inlineData: {
			data: base64Data,
			mimeType: mimeType || "image/jpeg",
		},
	};
};

// 4. This is your runChat logic, wrapped in a Convex action
export const run = action({
	args: {
		base64Image: v.string(),
		mimeType: v.string(),
	},
	handler: async (ctx, { base64Image, mimeType }) => {

		try {
			const imagePart = fileToPart(base64Image, mimeType);

			const result = await ai.models.generateContent({
				model: 'gemini-2.0-flash-001',
				contents: [prompt_instructions, imagePart],
			});
			return result.text;
		} catch (error) {
			console.error("Error generating content with Gemini API:", error);
			throw new Error("Failed to process the image with Gemini API.");
		}
  },
});