export const dynamic = "force-dynamic";

import { google } from "googleapis";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString('base64');
  const dataURI = `data:${file.type};base64,${base64Data}`;

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload(dataURI, {
      folder: 'course-registrations',
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });

  return (result as any).secure_url;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const course = formData.get("course") as string;
    const photo = formData.get("photo") as File;

    const photoUrl = await uploadToCloudinary(photo);
    console.log("Form submission:", { name, email, course, photoUrl });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, email, course, photoUrl]],
      },
    });

    return NextResponse.json({ message: "Data submitted successfully" });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}