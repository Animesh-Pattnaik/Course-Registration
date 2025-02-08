import { google } from "googleapis";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary(file: File) {
  // Convert File to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString('base64');
  const dataURI = `data:${file.type};base64,${base64Data}`;

  // Upload to Cloudinary
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

    if (!name || !email || !course || !photo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload photo to Cloudinary and get the URL
    const photoUrl = await uploadToCloudinary(photo);
    console.log("Form submission:", { name, email, course, photoUrl });

    // Google Sheets Authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    try {
      // Append data to Google Sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        range: "Sheet1!A:D", // Adjust range according to your sheet
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[name, email, course, photoUrl]],
        },
      });
    } catch (sheetsError) {
      console.error("Google Sheets Error:", sheetsError);
      return NextResponse.json(
        { error: "Failed to save to Google Sheets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Data submitted successfully",
      data: { name, email, course, photoUrl }
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}