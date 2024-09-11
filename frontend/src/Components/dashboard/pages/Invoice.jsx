import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, storage } from '../../../firebase';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);

  // Fetch all invoices from Firestore
  const fetchInvoices = async () => {
    const querySnapshot = await getDocs(collection(db, 'invoice'));
    const invoiceList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setInvoices(invoiceList);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Handle download PDF
  // Handle download PDF
  // Handle download PDF
  // Handle download PDF
  const downloadPDF = async (pdfRef) => {
    try {
      const pdfURL = localStorage.getItem('latestInvoicePDF');

      if (!pdfURL) {
        throw new Error('No PDF URL found in local storage');
      }

      // Trigger the download
      const link = document.createElement('a');
      link.href = pdfURL;
      link.setAttribute('download', 'invoice.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF: ', error);
      alert('Failed to download PDF. Please try again later.');
    }
  };



  // Handle delete invoice
  const deleteInvoice = async (id, pdfRef) => {
    try {
      await deleteDoc(doc(db, 'invoice', id));
      if (pdfRef) {
        const pdfStorageRef = ref(storage, pdfRef);
        await deleteObject(pdfStorageRef);
      }
      alert('Invoice deleted successfully!');
      fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error('Error deleting invoice: ', error);
      alert('Failed to delete the invoice.');
    }
  };

  return (
    <div className="invoice-list">
      <h1>Invoices</h1>
      <ul>
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <div>
              <h3>Invoice Number: {invoice.invoiceNumber}</h3>
              <p>Total Amount: {invoice.totalAmount}</p>
              <button
                style={{ marginRight: '10px' }} // Added margin to the buttons
                onClick={() => downloadPDF(invoice.pdfRef)} // Use pdfRef for download
              >
                Download PDF
              </button>
              <button
                style={{ marginRight: '10px' }} // Added margin to the buttons
                onClick={() => deleteInvoice(invoice.id, invoice.pdfRef)}
              >
                Delete Invoice
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Invoice;
