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

    // Modal Controls
    if (openModalBtn) openModalBtn.addEventListener("click", () => modal.style.display = "flex");
    if (closeModalBtn) closeModalBtn.addEventListener("click", () => modal.style.display = "none");

    // SAVE NEW RECORD
    if (recordForm) {
        recordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const newRecord = {
                criterion: document.getElementById("inputCriterion").value,
                document_name: document.getElementById("inputTitle").value,
                opr: document.getElementById("inputOPR").value,
                status: document.getElementById("inputStatus").value,
                file_url: document.getElementById("inputFileUrl").value || "N/A",
                created_at: new Date()
            };

            try {
                await addDoc(collection(db, "gk_assessments"), newRecord);
                alert("Record successfully saved to Firebase!");
                recordForm.reset();
                modal.style.display = "none";
            } catch (error) {
                console.error("Error writing document: ", error);
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
                    <td>
                        <button class="btn-delete" data-id="${id}" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em;"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Attach Click Listeners for Delete Buttons
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
});
