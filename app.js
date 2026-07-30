import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSCB9jQIzyn9WxGZ58sLkYJPHCj5oeEKQ",
  authDomain: "pdrrmo-dashboard.firebaseapp.com",
  projectId: "pdrrmo-dashboard",
  storageBucket: "pdrrmo-dashboard.firebasestorage.app",
  messagingSenderId: "555106842078",
  appId: "1:555106842078:web:18e95c2e1352db559ad94f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    
    // UI Elements
    const modal = document.getElementById("recordModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const recordForm = document.getElementById("addRecordForm");
    const tableBody = document.getElementById("checklistTableBody");
    const modalTitle = document.querySelector(".modal-header h3");

    let currentEditId = null; // Tracks if we are editing or adding

    // OPEN MODAL (For Adding)
    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
            currentEditId = null;
            recordForm.reset();
            modalTitle.innerHTML = '<i class="fas fa-file-medical"></i> Add New Assessment MOV';
            modal.style.display = "flex";
        });
    }

    // CLOSE MODAL
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => modal.style.display = "none");
    }

    // FORM SUBMIT (Handles both Add and Edit)
    if (recordForm) {
        recordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const recordData = {
                criterion: document.getElementById("inputCriterion").value,
                document_name: document.getElementById("inputTitle").value,
                opr: document.getElementById("inputOPR").value,
                status: document.getElementById("inputStatus").value,
                file_url: document.getElementById("inputFileUrl").value || "N/A",
                updated_at: new Date()
            };

            try {
                if (currentEditId) {
                    // UPDATE EXISTING RECORD
                    await updateDoc(doc(db, "gk_assessments", currentEditId), recordData);
                    alert("Record successfully updated!");
                } else {
                    // ADD NEW RECORD
                    recordData.created_at = new Date();
                    await addDoc(collection(db, "gk_assessments"), recordData);
                    alert("New record successfully saved!");
                }
                
                recordForm.reset();
                modal.style.display = "none";
                currentEditId = null;
            } catch (error) {
                console.error("Error saving document: ", error);
                alert("Failed to save record.");
            }
        });
    }

    // REAL-TIME READ & RENDER (With Delete & Edit buttons)
    if (tableBody) {
        const q = query(collection(db, "gk_assessments"), orderBy("created_at", "desc"));
        
        onSnapshot(q, (snapshot) => {
            tableBody.innerHTML = "";
            
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No records found. Click "Add New Record" to create one.</td></tr>';
                return;
            }

            snapshot.forEach((documentSnap) => {
                const data = documentSnap.data();
                const id = documentSnap.id;
                const row = document.createElement("tr");
                
                row.innerHTML = `
                    <td><strong>${data.criterion || ''}</strong></td>
                    <td>${data.document_name || ''}</td>
                    <td><span class="badge badge-internal">${data.opr || ''}</span></td>
                    <td><span class="status-tag status-ok">${data.status || ''}</span></td>
                    <td>${data.file_url.startsWith('http') ? `<a href="${data.file_url}" target="_blank" class="file-link">View Link</a>` : data.file_url}</td>
                    <td style="display: flex; gap: 5px;">
                        <button class="btn-edit" data-id="${id}" style="background: #f39c12; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em;"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" data-id="${id}" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em;"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Attach Click Listeners for EDIT Buttons
            document.querySelectorAll(".btn-edit").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const docId = e.currentTarget.getAttribute("data-id");
                    currentEditId = docId; // Set the tracker
                    
                    // Grab the row's data from the table HTML directly to fill the form instantly
                    const row = e.currentTarget.closest("tr");
                    document.getElementById("inputCriterion").value = row.cells[0].innerText.trim();
                    document.getElementById("inputTitle").value = row.cells[1].innerText.trim();
                    document.getElementById("inputOPR").value = row.cells[2].innerText.trim();
                    document.getElementById("inputStatus").value = row.cells[3].innerText.trim();
                    
                    let linkText = row.cells[4].innerText.trim();
                    if(linkText === "View Link") linkText = row.cells[4].querySelector('a').href;
                    document.getElementById("inputFileUrl").value = linkText;

                    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Assessment MOV';
                    modal.style.display = "flex"; // Open the modal
                });
            });

            // Attach Click Listeners for DELETE Buttons
            document.querySelectorAll(".btn-delete").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const docId = e.currentTarget.getAttribute("data-id");
                    if (confirm("Are you sure you want to delete this record?")) {
                        await deleteDoc(doc(db, "gk_assessments", docId));
                    }
                });
            });
        });
    }

  // ==========================================
    // DASHBOARD KPI CALCULATIONS
    // ==========================================
    const kpiCompletion = document.getElementById("kpiCompletion");
    const kpiFraction = document.getElementById("kpiFraction");
    const kpiPending = document.getElementById("kpiPending");
    const kpiReview = document.getElementById("kpiReview");

    // Only run this math if we are actually on the Dashboard page
    if (kpiCompletion) { 
        const dashboardQuery = query(collection(db, "gk_assessments"));
        
        onSnapshot(dashboardQuery, (snapshot) => {
            let okCount = 0;
            let pendingCount = 0;
            let reviewCount = 0;
            const TOTAL_CRITERIA = 26; // Total GK requirements

            // Loop through all database records and count the statuses
            snapshot.forEach((doc) => {
                const status = doc.data().status;
                if (status === "OK / Scanned" || status === "Hardcopy On Hand") okCount++;
                if (status === "Requested") pendingCount++;
                if (status === "Under Review") reviewCount++;
            });

            // Calculate the percentage
            const percentage = Math.round((okCount / TOTAL_CRITERIA) * 100);

            // Push the live numbers to the HTML screen
            kpiCompletion.innerText = `${percentage}%`;
            kpiFraction.innerText = `${okCount}/${TOTAL_CRITERIA} Criteria Uploaded`;
            kpiPending.innerText = pendingCount;
            kpiReview.innerText = reviewCount;
        });
    }
  
});
