import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
    
    // ==========================================
    // MODULE 1: MOV CHECKLIST LOGIC
    // ==========================================
    const modal = document.getElementById("recordModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const recordForm = document.getElementById("addRecordForm");
    const tableBody = document.getElementById("checklistTableBody");
    const modalTitle = document.querySelector(".modal-header h3");

    let currentEditId = null;

    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
            currentEditId = null;
            recordForm.reset();
            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-file-medical"></i> Add New Assessment MOV';
            modal.style.display = "flex";
        });
    }

    if (closeModalBtn) closeModalBtn.addEventListener("click", () => modal.style.display = "none");

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
                    await updateDoc(doc(db, "gk_assessments", currentEditId), recordData);
                    alert("Record successfully updated!");
                } else {
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

            document.querySelectorAll(".btn-edit").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const docId = e.currentTarget.getAttribute("data-id");
                    currentEditId = docId;
                    const row = e.currentTarget.closest("tr");
                    document.getElementById("inputCriterion").value = row.cells[0].innerText.trim();
                    document.getElementById("inputTitle").value = row.cells[1].innerText.trim();
                    document.getElementById("inputOPR").value = row.cells[2].innerText.trim();
                    document.getElementById("inputStatus").value = row.cells[3].innerText.trim();
                    let linkText = row.cells[4].innerText.trim();
                    if(linkText === "View Link") linkText = row.cells[4].querySelector('a').href;
                    document.getElementById("inputFileUrl").value = linkText;
                    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Assessment MOV';
                    modal.style.display = "flex";
                });
            });

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
    // MODULE 2: DASHBOARD KPI LOGIC
    // ==========================================
    const kpiCompletion = document.getElementById("kpiCompletion");
    const kpiFraction = document.getElementById("kpiFraction");
    const kpiPending = document.getElementById("kpiPending");
    const kpiReview = document.getElementById("kpiReview");

    if (kpiCompletion) { 
        const dashboardQuery = query(collection(db, "gk_assessments"));
        onSnapshot(dashboardQuery, (snapshot) => {
            let okCount = 0;
            let pendingCount = 0;
            let reviewCount = 0;
            const TOTAL_CRITERIA = 26;

            snapshot.forEach((doc) => {
                const status = doc.data().status;
                if (status === "OK / Scanned" || status === "Hardcopy On Hand") okCount++;
                if (status === "Requested") pendingCount++;
                if (status === "Under Review") reviewCount++;
            });

            const percentage = Math.round((okCount / TOTAL_CRITERIA) * 100);
            kpiCompletion.innerText = `${percentage}%`;
            kpiFraction.innerText = `${okCount}/${TOTAL_CRITERIA} Criteria Uploaded`;
            kpiPending.innerText = pendingCount;
            kpiReview.innerText = reviewCount;
        });
    }

    // ==========================================
    // MODULE 3: OPR TRACKER LOGIC
    // ==========================================
    const trackerTableBody = document.getElementById("trackerTableBody");

    if (trackerTableBody) {
        const trackerQuery = query(collection(db, "gk_assessments"), orderBy("created_at", "desc"));
        
        onSnapshot(trackerQuery, (snapshot) => {
            trackerTableBody.innerHTML = "";
            let hasPendingItems = false;

            snapshot.forEach((documentSnap) => {
                const data = documentSnap.data();
                
                if (data.status === "Requested") {
                    hasPendingItems = true;
                    const row = document.createElement("tr");
                    
                    let daysPending = 0;
                    if (data.created_at) {
                        const createdDate = data.created_at.toDate();
                        const today = new Date();
                        const diffTime = Math.abs(today - createdDate);
                        daysPending = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    row.innerHTML = `
                        <td><strong>${data.criterion || ''}</strong></td>
                        <td>${data.document_name || ''}</td>
                        <td><span class="badge badge-external">${data.opr || ''}</span></td>
                        <td><span style="color: #e67e22; font-weight: bold;">${daysPending} Days</span></td>
                        <td>
                            <button class="btn-email" 
                                data-opr="${data.opr || ''}" 
                                data-crit="${data.criterion || ''}" 
                                data-doc="${data.document_name || ''}" 
                                style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                                <i class="fas fa-envelope"></i> Draft Email
                            </button>
                        </td>
                    `;
                    trackerTableBody.appendChild(row);
                }
            });

            if (!hasPendingItems) {
                trackerTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #27ae60; padding: 20px;"><strong><i class="fas fa-check-circle"></i> All caught up! No pending requests.</strong></td></tr>';
            }

            document.querySelectorAll(".btn-email").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const targetOPR = e.currentTarget.getAttribute("data-opr");
                    const targetCrit = e.currentTarget.getAttribute("data-crit");
                    const targetDoc = e.currentTarget.getAttribute("data-doc");

                    const subject = encodeURIComponent(`URGENT: Gawad KALASAG 2026 Requirement - ${targetCrit}`);
                    const body = encodeURIComponent(
                        `Good day ${targetOPR} Team,\n\n` +
                        `We are currently preparing our documents for the Gawad KALASAG 2026 Assessment.\n\n` +
                        `Could we kindly request a soft copy of the following document to be uploaded or sent to our office at your earliest convenience?\n\n` +
                        `Criterion: ${targetCrit}\n` +
                        `Required Document: ${targetDoc}\n\n` +
                        `Please let us know if you have any questions or require further clarification.\n\n` +
                        `Thank you,\n` +
                        `PDRRMO Tarlac`
                    );

                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                });
            });
        });
    }

    // ==========================================
    // MODULE 4: SHEETS & REPORTS LOGIC
    // ==========================================
    const exportCsvBtn = document.getElementById("exportCsvBtn");

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", async () => {
            try {
                // Temporarily change button text so the user knows it's working
                exportCsvBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Export...';
                exportCsvBtn.disabled = true;

                // 1. Fetch all records from Firebase
                const exportQuery = query(collection(db, "gk_assessments"), orderBy("created_at", "desc"));
                const querySnapshot = await getDocs(exportQuery);

                if (querySnapshot.empty) {
                    alert("No data available to export.");
                    exportCsvBtn.innerHTML = '<i class="fas fa-file-csv"></i> Export Full Database to CSV';
                    exportCsvBtn.disabled = false;
                    return;
                }

                // 2. Prepare the CSV Headers
                let csvContent = "Criterion,Document Title,OPR,Status,Link / Location,Date Added\n";

                // 3. Loop through every document and format it for the spreadsheet
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    
                    // We wrap fields in quotes so commas inside titles don't break the columns
                    const crit = `"${(data.criterion || '').replace(/"/g, '""')}"`;
                    const title = `"${(data.document_name || '').replace(/"/g, '""')}"`;
                    const opr = `"${(data.opr || '').replace(/"/g, '""')}"`;
                    const status = `"${(data.status || '').replace(/"/g, '""')}"`;
                    const link = `"${(data.file_url || '').replace(/"/g, '""')}"`;
                    
                    let dateAdded = '""';
                    if (data.created_at) {
                        dateAdded = `"${data.created_at.toDate().toLocaleDateString()}"`;
                    }

                    // Add the row to our CSV text block
                    csvContent += `${crit},${title},${opr},${status},${link},${dateAdded}\n`;
                });

                // 4. Create the downloadable file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const linkElement = document.createElement("a");
                const url = URL.createObjectURL(blob);
                
                linkElement.setAttribute("href", url);
                linkElement.setAttribute("download", "GK_2026_MOV_Tracker.csv"); // This is the file name
                linkElement.style.visibility = 'hidden';
                document.body.appendChild(linkElement);
                linkElement.click();
                document.body.removeChild(linkElement);

                // Reset button text
                exportCsvBtn.innerHTML = '<i class="fas fa-file-csv"></i> Export Full Database to CSV';
                exportCsvBtn.disabled = false;

            } catch (error) {
                console.error("Error exporting data: ", error);
                alert("An error occurred while generating the report.");
                exportCsvBtn.innerHTML = '<i class="fas fa-file-csv"></i> Export Full Database to CSV';
                exportCsvBtn.disabled = false;
            }
        });
    }

  // ==========================================
    // MODULE 5: ADMIN SETTINGS LOGIC
    // ==========================================
    const oprList = document.getElementById("oprList");
    const addOprForm = document.getElementById("addOprForm");
    const statusList = document.getElementById("statusList");
    const addStatusForm = document.getElementById("addStatusForm");

    // --- 1. OPR Management ---
    if (oprList && addOprForm) {
        // Load OPRs from Firebase
        onSnapshot(query(collection(db, "gk_oprs"), orderBy("name")), (snapshot) => {
            oprList.innerHTML = "";
            if (snapshot.empty) {
                oprList.innerHTML = '<li><span style="color:#7f8c8d;">No OPRs found. Add one below.</span></li>';
            }
            snapshot.forEach((docSnap) => {
                const id = docSnap.id;
                const name = docSnap.data().name;
                const li = document.createElement("li");
                li.innerHTML = `
                    <strong>${name}</strong>
                    <button class="btn-del-opr" data-id="${id}" style="background: #e74c3c; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;"><i class="fas fa-trash"></i></button>
                `;
                oprList.appendChild(li);
            });

            // Delete OPR Logic
            document.querySelectorAll(".btn-del-opr").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const docId = e.currentTarget.getAttribute("data-id");
                    if (confirm("Are you sure you want to delete this OPR?")) {
                        await deleteDoc(doc(db, "gk_oprs", docId));
                    }
                });
            });
        });

        // Add New OPR Logic
        addOprForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = document.getElementById("newOprInput");
            const newName = input.value.trim();
            if (newName) {
                await addDoc(collection(db, "gk_oprs"), { name: newName });
                input.value = ""; // Automatically clear the input box
            }
        });
    }

    // --- 2. Status Tag Management ---
    if (statusList && addStatusForm) {
        // Load Statuses from Firebase
        onSnapshot(query(collection(db, "gk_statuses"), orderBy("name")), (snapshot) => {
            statusList.innerHTML = "";
            if (snapshot.empty) {
                statusList.innerHTML = '<li><span style="color:#7f8c8d;">No status tags found. Add one below.</span></li>';
            }
            snapshot.forEach((docSnap) => {
                const id = docSnap.id;
                const name = docSnap.data().name;
                const li = document.createElement("li");
                li.innerHTML = `
                    <strong>${name}</strong>
                    <button class="btn-del-status" data-id="${id}" style="background: #e74c3c; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;"><i class="fas fa-trash"></i></button>
                `;
                statusList.appendChild(li);
            });

            // Delete Status Logic
            document.querySelectorAll(".btn-del-status").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const docId = e.currentTarget.getAttribute("data-id");
                    if (confirm("Are you sure you want to delete this Status Tag?")) {
                        await deleteDoc(doc(db, "gk_statuses", docId));
                    }
                });
            });
        });

        // Add New Status Logic
        addStatusForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = document.getElementById("newStatusInput");
            const newName = input.value.trim();
            if (newName) {
                await addDoc(collection(db, "gk_statuses"), { name: newName });
                input.value = ""; // Automatically clear the input box
            }
        });
    }
});
