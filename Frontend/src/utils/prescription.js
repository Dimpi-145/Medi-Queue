import jsPDF from "jspdf";
import QRCode from "qrcode";
import logo from "../assets/logo.png";

const buildPrescriptionPDF = async ({
  patient,
  doctor,
  prescriptionText,
}) => {

  const doc = new jsPDF();

  /* ===== COLORS ===== */
  const primary = [59, 130, 246];
  const dark = [15, 23, 42];
  const gray = [100, 116, 139];

  /* ===== CLEAN DOCTOR NAME ===== */
  const cleanDoctorName = (doctor || "Doctor")
    .replace(/^Dr\.\s*/i, "")
    .trim();

  /* ===== PRESCRIPTION ID ===== */
  const prescriptionId =
    "MQ-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

  /* ===== QR DATA ===== */
  const qrData = `
Prescription ID: ${prescriptionId}
Patient: ${patient?.name || patient?.username || "N/A"}
Doctor: Dr. ${cleanDoctorName}
Generated via MediQueue
`;

  const qrImage = await QRCode.toDataURL(qrData);

  /* ===== HEADER ===== */
  doc.setFillColor(...primary);
  doc.rect(0, 0, 210, 38, "F");

  /* ===== LOGO ===== */
  try {
    doc.addImage(
      logo,
      "PNG",
      15,
      8,
      18,
      18
    );
  } catch (err) {
    console.log("Logo load failed");
  }

  /* ===== TITLE ===== */
  doc.setTextColor(255, 255, 255);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);

  doc.text(
    "MediQueue Hospital",
    38,
    18
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(
    "Digital Medical Prescription",
    38,
    26
  );

  /* ===== QR CODE ===== */
  doc.addImage(
    qrImage,
    "PNG",
    168,
    6,
    26,
    26
  );

  /* ===== PRESCRIPTION ID ===== */
  doc.setFontSize(8);

  doc.text(
    prescriptionId,
    170,
    34
  );

  /* ===== INFO BOX ===== */
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(220, 220, 220);

  doc.roundedRect(
    15,
    48,
    180,
    58,
    5,
    5,
    "FD"
  );

  doc.setTextColor(...dark);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.text(
    "Patient Information",
    20,
    60
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  doc.text(
    `Patient Name: ${
      patient?.name ||
      patient?.username ||
      "N/A"
    }`,
    20,
    74
  );

  doc.text(
    `Gender: ${
      patient?.gender || "N/A"
    }`,
    20,
    86
  );

  doc.text(
    `Age: ${
      patient?.age || "N/A"
    }`,
    110,
    74
  );

  doc.text(
    `Doctor: Dr. ${cleanDoctorName}`,
    110,
    86
  );

  /* ===== PRESCRIPTION TITLE ===== */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);

  doc.text(
    "Prescription",
    20,
    122
  );

  doc.setDrawColor(...primary);

  doc.line(
    20,
    126,
    82,
    126
  );

  /* ===== PRESCRIPTION BOX ===== */
  doc.setDrawColor(210, 210, 210);

  doc.roundedRect(
    15,
    134,
    180,
    55,
    5,
    5,
    "S"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);

  doc.setTextColor(...dark);

  const splitText = doc.splitTextToSize(
    prescriptionText ||
      "No prescription provided.",
    165
  );

  doc.text(
    splitText,
    22,
    148
  );

  /* ===== SIGNATURE ===== */
  doc.setDrawColor(180, 180, 180);

  doc.line(
    132,
    225,
    186,
    225
  );

  doc.setFontSize(11);
  doc.setTextColor(...gray);

  doc.text(
    `Dr. ${cleanDoctorName}`,
    145,
    233
  );

  doc.text(
    "Authorized Signature",
    136,
    240
  );

  /* ===== FOOTER ===== */
  doc.setFontSize(9);

  doc.text(
    `Generated on: ${new Date().toLocaleString()}`,
    20,
    285
  );

  doc.text(
    "Verified & generated digitally via MediQueue",
    102,
    285
  );

  doc.setFontSize(8);

  doc.text(
    "support@mediqueue.com | +91-9876543210",
    20,
    291
  );

  return doc;
};

export const generatePrescriptionPDF = async ({
  patient,
  doctor,
  prescriptionText,
}) => {

  const doc = await buildPrescriptionPDF({
    patient,
    doctor,
    prescriptionText,
  });

  const fileName = `prescription_${(
    patient?.name ||
    patient?.username ||
    "patient"
  )
    .replace(/\s+/g, "_")
    .toLowerCase()}.pdf`;

  doc.save(fileName);
};

export const createPrescriptionPdfBlob = async ({
  patient,
  doctor,
  prescriptionText,
}) => {

  const doc = await buildPrescriptionPDF({
    patient,
    doctor,
    prescriptionText,
  });

  return doc.output("blob");
};