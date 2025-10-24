
// import { GoogleGenAI } from '@google/genai';
// //const GEMINI_API_KEY = "AIzaSyBbKv8r5nq5gHyM-gZq7qpnivhuqdlDTFg";
// const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// const ai = new GoogleGenAI({ apiKey: apiKey });


// const prompt_instructions = `
//      Analyze the attached UPI transaction screenshot carefully.
//   From the visual cues, logos, and text, identify the specific payment app used (e.g., "googlepay", "phonepay", "paytm" and many more etc).
//   Provide the output ONLY in a valid JSON format. If a value is not present, use null.

//     - payment_app: The name of the app (e.g., "googlepay", "phonepay", "paytm", "aadhar" or "other") in the given case.
//     - status: The final status of the transaction (e.g., "Successful", "Completed", "Failed").
//     - amount: The primary numeric transaction amount.
//     - dateTime: The date and time of the transaction in form of compatible with dayjs() i.e. => i will store this dateTime like that .....dateTime: dayjs(extractedData.dateTime), where extractedData is variable name which store the result you will return.
//     - transaction_type: "debit" if money was sent, or "credit" if money was received.
//     - upi_transaction_id: The main UPI Transaction ID or Reference Number (Ref No).
//     - sender_name: The name of the person or entity sending the money.
//     - sender_id: The UPI ID or phone number of the sender.
//     - receiver_name: The name of the person or entity receiving the money.
//     - receiver_id: The UPI ID or phone number of the receiver.
//     `
// async function fileToGenerativePart(fileBlob) { // Accept a generic Blob
//   const base64EncodedDataPromise = new Promise((resolve, reject) => { // Add reject
//     const reader = new FileReader();
//     reader.onloadend = () => resolve(reader.result.split(',')[1]);
//     reader.onerror = (err) => reject(err); // Add error handling
//     reader.readAsDataURL(fileBlob); // Read the Blob
//   });

//   return {
//     inlineData: {
//       data: await base64EncodedDataPromise,
//       mimeType: fileBlob.type || 'image/jpeg', // Get mimeType from the Blob
//     },
//   };
// }

// /**
//  * Runs a chat with the Gemini API, handling both text and optional image input.
//  * @param {string} prompt The text prompt.
//  * @param {File | null} imageFile An optional image file to include.
//  * @returns {Promise<string>} The text response from the model.
//  */


// async function runChat(imageFile = null) {

//   if (imageFile) {

//     const cleanFileBlob = new Blob([imageFile], { type: imageFile.type });

//     const imagePart = await fileToGenerativePart(cleanFileBlob);
//     const result = await ai.models.generateContent({
//       model: 'gemini-2.0-flash-001',
//       contents: [prompt_instructions, imagePart],
//     });
//     return result.text;

//   } else {
//     throw new Error("No image provided");
//   }
// }

// export default runChat; 








// src/service/gemini.js

// Helper to convert the browser File object to a base64 string
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Get only the base64 part
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Calls your secure Convex backend to run the Gemini chat.
 * @param {File} imageFile The image file to analyze.
 * @returns {Promise<string>} The text response from the model.
 */
async function runChat(imageFile = null) {
  if (!imageFile) {
    throw new Error("No image provided");
  }

  // 1. Convert the file to base64
  const base64Image = await fileToBase64(imageFile);
  const mimeType = imageFile.type || 'image/jpeg';

  // 2. Get your Convex HTTP endpoint URL
  // This replaces '.cloud' with '.site' to get the public URL
  const convexHttpUrl = import.meta.env.VITE_CONVEX_URL.replace(
    ".cloud",
    ".site"
  );
  
  // 3. Call your own backend, not Google's
  const response = await fetch(`${convexHttpUrl}/extractDetails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, mimeType: mimeType }),
  });

  if (!response.ok) {
    throw new Error(`Server failed with status ${response.status}: ${ response.text}`);
  }

  // The response from our action is the raw text
  return response.text;
}

export default runChat;












