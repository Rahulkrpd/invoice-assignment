import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import "./newInvoice.css";



// Utility function to convert number to words
const numberToWords = (num) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Million", "Billion"];

  if (num === 0) return "Zero Only";

  let word = '';

  function helper(n, index) {
    if (n === 0) return '';
    if (n < 10) return ones[n] + ' ';
    if (n < 20) return teens[n - 10] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
    return ones[Math.floor(n / 100)] + ' Hundred ' + helper(n % 100, 0);
  }

  let i = 0;
  while (num > 0) {
    if (num % 1000 !== 0) {
      word = helper(num % 1000, i) + thousands[i] + ' ' + word;
    }
    num = Math.floor(num / 1000);
    i++;
  }

  return word.trim() + ' Only';
};

const uploadFile = async (file, folderName) => {
  if (!file) return null;
  const storageRef = ref(storage, `${folderName}/${uuidv4()}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

const NewInvoice = () => {
  const [items, setItems] = useState([{ id: 1, description: '', unitPrice: 0, discount: 0, quantity: 0, netAmount: 0, taxRate: 18, taxType: 'IGST', taxAmount: 0, totalAmount: 0 }]);
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [placeOfDelivery, setPlaceOfDelivery] = useState("");
  const [netAmount, setNetAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountInWords, setAmountInWords] = useState('');

  const today = new Date().toISOString().split('T')[0];


  const getFileBlob = (fileInputId) => {
    const fileInput = document.getElementById(fileInputId).files[0];
    if (!fileInput) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(fileInput);
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    updatedItems[index].netAmount = updatedItems[index].unitPrice * updatedItems[index].quantity - updatedItems[index].discount;
    updatedItems[index].taxAmount = updatedItems[index].netAmount * (updatedItems[index].taxRate / 100);
    updatedItems[index].totalAmount = updatedItems[index].netAmount + updatedItems[index].taxAmount;
    setItems(updatedItems);

    const totalNetAmount = updatedItems.reduce((acc, item) => acc + item.netAmount, 0);
    const totalTaxAmount = updatedItems.reduce((acc, item) => acc + item.taxAmount, 0);
    const totalInvoiceAmount = updatedItems.reduce((acc, item) => acc + item.totalAmount, 0);

    setNetAmount(totalNetAmount);
    setTaxAmount(totalTaxAmount);
    setTotalAmount(totalInvoiceAmount);
    setAmountInWords(numberToWords(totalInvoiceAmount));
  };

  const addNewRow = () => {
    setItems([...items, { id: items.length + 1, description: '', unitPrice: 0, discount: 0, quantity: 0, netAmount: 0, taxRate: 18, taxType: 'IGST', taxAmount: 0, totalAmount: 0 }]);
  };


  //validation code
  const validateForm = () => {
    const requiredFields = [
      'sellerName', 'sellerAddress', 'sellerPan', 'gstNo',
      'billName', 'billAddress', 'stateCode',
      'placeOfSupply', 'placeOfDelivery',
      'invoiceNumber', 'invoiceDate',
      'orderNumber', 'orderDate', 'shippingAddress', 'soldBy'
    ];

    for (let field of requiredFields) {
      const value = document.getElementById(field).value.trim();
      if (!value) {
        alert(`${field.replace(/([A-Z])/g, ' $1')} is required`);
        return false;
      }
    }

    return true;
  };


  // save data to database
  const saveData = async () => {
    if (!validateForm()) return;
  
    try {
      const companyLogoFile = document.getElementById('companyLogo').files[0];
      const ownerSignFile = document.getElementById('ownerSign').files[0];
  
      // Upload company logo and owner signature files
      const companyLogoURL = await uploadFile(companyLogoFile, 'companyLogos');
      const ownerSignURL = await uploadFile(ownerSignFile, 'ownerSignatures');
  
      // Generate and upload the PDF
      const pdfURL = await generatePDFAndUpload();
  
      const invoiceData = {
        items,
        placeOfSupply,
        placeOfDelivery,
        netAmount,
        taxAmount,
        totalAmount,
        amountInWords,
        companyLogoURL,
        ownerSignURL,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        invoiceDate: document.getElementById('invoiceDate').value,
        orderNumber: document.getElementById('orderNumber').value,
        orderDate: document.getElementById('orderDate').value,
        shippingAddress: document.getElementById('shippingAddress').value,
        seller: {
          name: document.getElementById('sellerName').value,
          address: document.getElementById('sellerAddress').value,
          pan: document.getElementById('sellerPan').value,
          gstNo: document.getElementById('gstNo').value,
        },
        customer: {
          name: document.getElementById('billName').value,
          address: document.getElementById('billAddress').value,
          stateCode: document.getElementById('stateCode').value,
        },
        reverseCharge: document.getElementById('reverseCharge').value,
        owner: {
          name: document.getElementById('soldBy').value,
        },
        pdfURL, // Save the URL of the PDF in Firestore
      };
  
      // Save the invoice data to Firestore
      await setDoc(doc(collection(db, 'invoice')), invoiceData);
  
      // Save PDF URL to local storage
      localStorage.setItem('latestInvoicePDF', pdfURL);
  
      alert('Invoice saved successfully with PDF!');
    } catch (error) {
      console.error('Error saving invoice: ', error);
      alert('Failed to save the invoice.');
    }
  };
  

  const generatePDFAndUpload = async () => {
    const invoiceElement = document.querySelector('.invoice-container');

    // Convert HTML to canvas for the PDF
    const canvas = await html2canvas(invoiceElement, {
      scale: 2, // Increase the scale for better quality
    });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = 600; // Adjust based on your design
    const imgHeight = canvas.height * imgWidth / canvas.width;

    // Add the invoice image to the PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save the PDF and upload to Firebase Storage
    const pdfBlob = pdf.output('blob');
    const storageRef = ref(storage, `invoices/${uuidv4()}.pdf`);
    const snapshot = await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(snapshot.ref); // Get the download URL of the uploaded PDF

    return downloadURL;
  };



  return (
    <div className="invoice-container">
      <div className="header">
        <div className="company-logo">
          <label htmlFor="companyLogo">Company Logo:</label>
          <input type="file" id="companyLogo" />
        </div>
        <div className="invoice-title">
          <h2>Tax Invoice / Bill of Supply / Cash Memo</h2>
          <p>(Original for Recipient)</p>

          <button className='saveInvoice' onClick={saveData}>Save Invoice</button>
        </div>
      </div>

      <div className="details">
        <div className="details-left">
          <h4>Sold By:</h4>
          <label htmlFor="sellerName">Seller Name:</label>
          <input type="text" id="sellerName" placeholder="Seller Name" />
          <label htmlFor="sellerAddress">Seller Address:</label>
          <textarea id="sellerAddress" rows="3" placeholder="Seller Address"></textarea>
          <label htmlFor="sellerPan">PAN No.:</label>
          <input type="text" id="sellerPan" placeholder="Seller PAN No." />
          <label htmlFor="gstNo">GST Registration No.:</label>
          <input type="text" id="gstNo" placeholder="GST Registration No." />
        </div>
        <div className="details-right">
          <h4>Bill To:</h4>
          <label htmlFor="billName">Customer Name:</label>
          <input type="text" id="billName" placeholder="Customer Name" />
          <label htmlFor="billAddress">Billing Address:</label>
          <textarea id="billAddress" rows="3" placeholder="Billing Address"></textarea>
          <label htmlFor="stateCode">State/UT Code:</label>
          <input type="text" id="stateCode" placeholder="State/UT Code" />
          <label htmlFor="placeOfSupply">Place of Supply:</label>
          <input type="text" id="placeOfSupply" placeholder="Place of Supply" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />
          <label htmlFor="placeOfDelivery">Place of Delivery:</label>
          <input type="text" id="placeOfDelivery" placeholder="Place of Delivery" value={placeOfDelivery} onChange={(e) => setPlaceOfDelivery(e.target.value)} />
          <label htmlFor="invoiceNumber">Invoice Number:</label>
          <input type="text" id="invoiceNumber" placeholder="Invoice Number" />
          <label htmlFor="invoiceDate">Invoice Date:</label>
          <input type="date" id="invoiceDate" defaultValue={today} />
        </div>
      </div>

      <div className="details">
        <div className="details-left">
          <label htmlFor="orderNumber">Order Number:</label>
          <input type="text" id="orderNumber" placeholder="Order Number" />
          <label htmlFor="orderDate">Order Date:</label>
          <input type="date" id="orderDate" />
        </div>
        <div className="details-right">
          <label htmlFor="shippingAddress">Shipping Address:</label>
          <textarea id="shippingAddress" rows="3" placeholder="Shipping Address"></textarea>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SI. No</th>
              <th>Description</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Qty</th>
              <th>Net Amount</th>
              <th>Tax Rate</th>
              <th>Tax Type</th>
              <th>Tax Amount</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td><input type="text" placeholder="Item Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                <td><input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>
                <td><input type="number" placeholder="Discount" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)} /></td>
                <td><input type="number" placeholder="Quantity" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                <td><input type="number" value={item.netAmount.toFixed(2)} disabled /></td>
                <td><input type="number" placeholder="Tax Rate" value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 18)} /></td>
                <td>
                  <select value={item.taxType} onChange={(e) => handleItemChange(index, 'taxType', e.target.value)}>
                    <option value="IGST">IGST</option>
                    <option value="CGST">CGST</option>
                    <option value="SGST">SGST</option>
                  </select>
                </td>
                <td><input type="number" value={item.taxAmount.toFixed(2)} disabled /></td>
                <td><input type="number" value={item.totalAmount.toFixed(2)} disabled /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addNewRow}>Add Row</button>
      </div>

      <div className="footer">
        <div className="sign-area">
          <label htmlFor="soldBy">Sold By:</label>
          <input type="text" id="soldBy" placeholder="Owner Name" />
          <label htmlFor="ownerSign">Owner Signature:</label>
          <input type="file" id="ownerSign" />
        </div>
        <div className="total-area">
          <table className="totals-table">
            <tbody>
              <tr>
                <td><strong>Total Tax Amount:</strong></td>
                <td><input type="number" id="totalTaxAmount" value={taxAmount.toFixed(2)} disabled /></td>
              </tr>
              <tr>
                <td><strong>Total Amount:</strong></td>
                <td><input type="number" id="totalAmount" value={totalAmount.toFixed(2)} disabled /></td>
              </tr>
            </tbody>
          </table>
          <label htmlFor="amountInWords"><strong>Amount in Words:</strong></label>
          <textarea id="amountInWords" rows="2" value={amountInWords} disabled />
        </div>
      </div>

      <div className="reverse-charge">
        <label htmlFor="reverseCharge">Reverse Charge:</label>
        <select id="reverseCharge">
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

    </div>
  );
}

export default NewInvoice;
