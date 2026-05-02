import jsPDF from "jspdf";

export const generatePrescriptionPDF = ({ patient, doctor, prescriptionText }) => {
  const doc = new jsPDF();

  // 🏥 HEADER
  doc.setFontSize(18);
  doc.text("MediQueue Hospital", 20, 20);

  doc.setFontSize(12);
  doc.text("Medical Prescription", 20, 30);

  doc.line(20, 35, 190, 35);

  // 👤 DOCTOR INFO
  doc.text(`Doctor: ${doctor}`, 20, 45);

  // 👤 PATIENT INFO
  doc.text(`Patient: ${patient?.name || patient?.username}`, 20, 55);
  doc.text(`Age: ${patient?.age || "N/A"}`, 20, 65);
  doc.text(`Gender: ${patient?.gender || "N/A"}`, 20, 75);

  // 💊 PRESCRIPTION
  doc.text("Prescription:", 20, 90);

  const splitText = doc.splitTextToSize(prescriptionText || "No notes", 170);
  doc.text(splitText, 20, 100);

  // 📅 FOOTER
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);

  doc.save(`prescription_${patient?.name || "patient"}.pdf`);
};