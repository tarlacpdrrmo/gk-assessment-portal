import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
// NEW: Import Authentication Modules
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJUoe7O-8dXK9WNx2SqWTYkg1y-uFMkjE",
  authDomain: "gk-portal-dev.firebaseapp.com",
  projectId: "gk-portal-dev",
  storageBucket: "gk-portal-dev.firebasestorage.app",
  messagingSenderId: "824670517028",
  appId: "1:824670517028:web:f369d96b08068a9f8365b1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Initialize Authentication

document.addEventListener("DOMContentLoaded", () => {
    
   // ==========================================
    // MODULE 0: SECURITY & AUTHENTICATION
    // ==========================================
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes("login.html");
    const adminNav = document.getElementById("adminNav");
    const userRoleDisplay = document.getElementById("userRoleDisplay");
    
    // Define the Master Admins
    const LEAD_ADMIN_EMAILS = [
        "paness9793@gmail.com"
        // "newadmin1@gmail.com", 
        // "newadmin2@gmail.com"
    ]; 
    
    // Global variable so the rest of the app knows the user's role
    let isLeadAdmin = false; 

    // 1. Listen for User Login Status & Enforce Roles
    onAuthStateChanged(auth, (user) => {
        if (!user && !isLoginPage) {
            window.location.href = "login.html";
        } else if (user && isLoginPage) {
            window.location.href = "index.html";
        } else if (user) {
            // Establish Role
            isLeadAdmin = LEAD_ADMIN_EMAILS.includes(user.email);

            // Update the top-right profile text dynamically
            if (userRoleDisplay) {
                if (isLeadAdmin) {
                    userRoleDisplay.innerHTML = '<i class="fas fa-user-shield"></i> Master Admin';
                } else {
                    userRoleDisplay.innerHTML = '<i class="fas fa-user"></i> LGU Encoder';
                }
            }

            // ENCODER RESTRICTIONS
            if (!isLeadAdmin) {
                // 1. Hide the Admin menu on the sidebar
                if (adminNav) adminNav.style.display = "none";
                
                // 2. Alert and block if they type /admin.html into the browser URL
                if (currentPage.includes("admin.html")) {
                    alert("ACCESS DENIED: Your account does not have Master Admin privileges. Redirecting to the Dashboard.");
                    window.location.href = "index.html";
                }
            }
        }
    });

    // 2. Handle the Login Form Submission
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (error) {
                console.error("Login Error:", error);
                alert("Invalid Email or Password. Please try again.");
            }
        });
    }

    // 3. Handle Logout Button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await signOut(auth);
        });
    }
   // ==========================================
    // MODULE 1: MOV CHECKLIST LOGIC (UPDATED FOR 7 COLUMNS)
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
            // FIXED: Added Pillar to the save package
            const recordData = {
                pillar: document.getElementById("inputPillar").value,
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
                alert("Failed to save record. Ensure you are logged in.");
            }
        });
    }

    if (tableBody) {
        const q = query(collection(db, "gk_assessments"), orderBy("created_at", "desc"));
        onSnapshot(q, (snapshot) => {
            tableBody.innerHTML = "";
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No records found. Click "Add New Record" to create one.</td></tr>';
                return;
            }
            snapshot.forEach((documentSnap) => {
                const data = documentSnap.data();
                const id = documentSnap.id;
                const row = document.createElement("tr");
                
                // FIXED: Rendering all 7 columns perfectly
                row.innerHTML = `
                    <td style="color: #7f8c8d; font-size: 0.9em;">${data.pillar || ''}</td>
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

            // FIXED: Shifted the column numbers by +1 so the Edit button grabs the correct data
            document.querySelectorAll(".btn-edit").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const docId = e.currentTarget.getAttribute("data-id");
                    currentEditId = docId;
                    const row = e.currentTarget.closest("tr");
                    
                    document.getElementById("inputPillar").value = row.cells[0].innerText.trim();
                    document.getElementById("inputCriterion").value = row.cells[1].innerText.trim();
                    document.getElementById("inputTitle").value = row.cells[2].innerText.trim();
                    document.getElementById("inputOPR").value = row.cells[3].innerText.trim();
                    document.getElementById("inputStatus").value = row.cells[4].innerText.trim();
                    
                    let linkText = row.cells[5].innerText.trim();
                    if(linkText === "View Link") linkText = row.cells[5].querySelector('a').href;
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
    // MODULE 2: UNIFIED DASHBOARD LOGIC
    // ==========================================
    const barStructure = document.getElementById("bar-structure");
    
    if (barStructure) { 
        // We run ONE query to pull everything for the dashboard
        onSnapshot(collection(db, "gk_assessments"), (snapshot) => {
            let counts = { 
                "Structure": 0, "Competency": 0, "Management Systems": 0, 
                "Enabling Policies": 0, "Knowledge Management and Advocacy": 0, "Partnership and Participation": 0 
            };
            
            let totalOk = 0;
            let pendingCount = 0;
            let reviewCount = 0;
            let requestedItems = []; // Array to hold table data
            const TOTAL_CRITERIA = 26;

            // 1. Tally up all the data
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                // Count completed items for bars
                if (data.status === "OK / Scanned" || data.status === "Hardcopy On Hand") {
                    if (counts[data.pillar] !== undefined) counts[data.pillar]++;
                    totalOk++;
                }

                // Count KPIs and collect Requested items for the table
                if (data.status === "Requested") {
                    pendingCount++;
                    requestedItems.push(data);
                }
                if (data.status === "Under Review") {
                    reviewCount++;
                }
            });

            // 2. Update Progress Bars
            const updateBar = (id, textId, count, target) => {
                const bar = document.getElementById(id);
                const text = document.getElementById(textId);
                if (bar && text) {
                    const percent = Math.min((count / target) * 100, 100);
                    bar.style.width = `${percent}%`;
                    text.innerText = count;
                }
            };

            updateBar("bar-structure", "text-structure", counts["Structure"], 5);
            updateBar("bar-competency", "text-competency", counts["Competency"], 5);
            updateBar("bar-management", "text-management", counts["Management Systems"], 5);
            updateBar("bar-policies", "text-policies", counts["Enabling Policies"], 5);
            updateBar("bar-knowledge", "text-knowledge", counts["Knowledge Management and Advocacy"], 5);
            updateBar("bar-partnership", "text-partnership", counts["Partnership and Participation"], 5);

// 3. Update the Top KPI Numbers
            const kpiCompletion = document.getElementById("kpiCompletion");
            const kpiFraction = document.getElementById("kpiFraction");
            const kpiPending = document.getElementById("kpiPending");
            const kpiReview = document.getElementById("kpiReview");
            
            // New Score Elements
            const kpiScore = document.getElementById("kpiScore");
            const kpiScoreText = document.getElementById("kpiScoreText");

            if (kpiCompletion && kpiFraction) {
                const totalPercent = Math.round((totalOk / TOTAL_CRITERIA) * 100);
                kpiCompletion.innerText = `${totalPercent}%`;
                kpiFraction.innerText = `${totalOk}/${TOTAL_CRITERIA} Criteria Uploaded`;
            }
            if (kpiPending) kpiPending.innerText = pendingCount;
            if (kpiReview) kpiReview.innerText = reviewCount;

            // Calculate Dynamic Score (Assuming Max Score of 3.0)
            if (kpiScore && kpiScoreText) {
                const maxScore = 3.00;
                const currentScore = ((totalOk / TOTAL_CRITERIA) * maxScore).toFixed(2);
                kpiScore.innerText = currentScore;

                // Dynamically change the text and color based on the score
                if (currentScore >= 2.50) {
                    kpiScoreText.innerText = "Beyond Compliant (Projected)";
                    kpiScore.style.color = "#f1c40f"; // Gold
                } else if (currentScore >= 1.50) {
                    kpiScoreText.innerText = "Fully Compliant (Projected)";
                    kpiScore.style.color = "#3498db"; // Blue
                } else {
                    kpiScoreText.innerText = "Needs Improvement (Projected)";
                    kpiScore.style.color = "#e74c3c"; // Red
                }
            }

            // 4. Update the Priority Table
            const priorityTable = document.getElementById("priorityOprTableBody");
            if (priorityTable) {
                priorityTable.innerHTML = "";
                
                if (requestedItems.length === 0) {
                    priorityTable.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #27ae60;"><strong><i class="fas fa-check-circle"></i> All caught up! No pending OPR requests.</strong></td></tr>';
                } else {
                    // Sort items in JavaScript (newest first) to bypass Firebase index errors
                    requestedItems.sort((a, b) => {
                        const dateA = a.created_at ? a.created_at.toMillis() : 0;
                        const dateB = b.created_at ? b.created_at.toMillis() : 0;
                        return dateB - dateA;
                    });

                    // Take the top 4 items and inject them into the table
                    const topItems = requestedItems.slice(0, 4);
                    topItems.forEach(item => {
                        const row = document.createElement("tr");
                        row.style.borderBottom = "1px solid #ecf0f1";
                        row.innerHTML = `
                            <td style="padding: 10px; font-weight: bold; color: #34495e;">${item.criterion || 'N/A'}</td>
                            <td style="padding: 10px; font-size: 0.85em; color: #7f8c8d;">${item.document_name || 'Unnamed Document'}</td>
                            <td style="padding: 10px;"><strong>${item.opr || 'N/A'}</strong></td>
                            <td style="padding: 10px;">
                                <a href="tracker.html" style="background: #3498db; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 0.85em; display: inline-block;">Track Email</a>
                            </td>
                        `;
                        priorityTable.appendChild(row);
                    });
                }
            }
        });
    }

    // ==========================================
    // MODULE 3: OPR REQUEST TRACKER LOGIC
    // ==========================================
    // Ensure your tracker.html has a <tbody> with id="trackerTableBody"
    const trackerTableBody = document.getElementById("trackerTableBody");

    if (trackerTableBody) {
        const q = query(collection(db, "gk_assessments"), orderBy("created_at", "desc"));
        onSnapshot(q, (snapshot) => {
            trackerTableBody.innerHTML = "";
            let hasRequests = false;

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                // Only pull items marked as "Requested"
                if (data.status === "Requested") {
                    hasRequests = true;
                    const row = document.createElement("tr");
                    
                    // Calculate how many days it has been pending
                    let daysPending = 1;
                    if (data.created_at) {
                        const createdDate = data.created_at.toDate();
                        const today = new Date();
                        const diffTime = Math.abs(today - createdDate);
                        daysPending = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    }

                    // Automatically draft the email subject and body
                    const emailSubject = encodeURIComponent(`URGENT: Gawad KALASAG 2026 Requirement - ${data.criterion}`);
                    const emailBody = encodeURIComponent(`Good day,\n\nThis is an automated request from the PDRRMO Gawad KALASAG Portal.\n\nWe are urgently requesting the following document for our 2026 Assessment:\n\nCriterion: ${data.criterion}\nDocument Required: ${data.document_name}\n\nPlease provide this document to the PDRRMO as soon as possible so we can update our system.\n\nThank you,\nLead Admin, PDRRMO Tarlac`);
                    
                    row.innerHTML = `
                        <td><strong>${data.criterion || ''}</strong></td>
                        <td style="color: #7f8c8d; font-size: 0.9em;">${data.document_name || ''}</td>
                        <td><span class="badge badge-internal" style="background: #fbeee0; color: #e67e22; padding: 4px 8px; border-radius: 4px;">${data.opr || ''}</span></td>
                        <td style="color: #e67e22; font-weight: bold;">${daysPending} Days</td>
                        <td>
                            <a href="mailto:?subject=${emailSubject}&body=${emailBody}" class="btn-email" style="background: #3498db; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 0.85em; display: inline-block; transition: 0.3s;">
                                <i class="fas fa-envelope"></i> Draft Email
                            </a>
                        </td>
                    `;
                    trackerTableBody.appendChild(row);
                }
            });

            // If there are no requests, show a success message
            if (!hasRequests) {
                trackerTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #27ae60; padding: 20px;"><strong><i class="fas fa-check-circle"></i> All caught up! No pending OPR requests at this time.</strong></td></tr>';
            }
        });
    }

// ==========================================
    // MODULE 4: REPORTS & CSV EXPORT LOGIC
    // ==========================================
    const exportCsvBtn = document.getElementById("exportCsvBtn");

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", async () => {
            try {
                // Change button text to show it's working
                const originalText = exportCsvBtn.innerHTML;
                exportCsvBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating CSV...';
                exportCsvBtn.disabled = true;

                // 1. Fetch all records from the database
                const snapshot = await getDocs(query(collection(db, "gk_assessments"), orderBy("pillar", "asc")));
                
                if (snapshot.empty) {
                    alert("No data found to export.");
                    exportCsvBtn.innerHTML = originalText;
                    exportCsvBtn.disabled = false;
                    return;
                }

                // 2. Setup CSV Headers
                let csvContent = "Pillar,Criterion,Document Title,OPR,Status,Link / Location\n";

                // 3. Loop through data and format as CSV safely
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    
                    // Helper function to escape commas and quotes so the spreadsheet doesn't break
                    const clean = (str) => {
                        if (!str) return '""';
                        return `"${str.toString().replace(/"/g, '""')}"`;
                    };

                    const row = [
                        clean(data.pillar),
                        clean(data.criterion),
                        clean(data.document_name),
                        clean(data.opr),
                        clean(data.status),
                        clean(data.file_url)
                    ].join(",");
                    
                    csvContent += row + "\n";
                });

                // 4. Create a downloadable file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                
                // Name the file dynamically based on today's date
                const today = new Date().toISOString().split('T')[0];
                link.setAttribute("href", url);
                link.setAttribute("download", `GK_2026_Database_Export_${today}.csv`);
                link.style.visibility = 'hidden';
                
                // Force the browser to download the file
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Restore the button
                exportCsvBtn.innerHTML = originalText;
                exportCsvBtn.disabled = false;

            } catch (error) {
                console.error("Export failed:", error);
                alert("Failed to export data. Check your connection.");
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

    if (oprList && addOprForm) {
        onSnapshot(query(collection(db, "gk_oprs"), orderBy("name")), (snapshot) => {
            oprList.innerHTML = "";
            if (snapshot.empty) oprList.innerHTML = '<li><span style="color:#7f8c8d;">No OPRs found. Add one below.</span></li>';
            snapshot.forEach((docSnap) => {
                const id = docSnap.id;
                const name = docSnap.data().name;
                const li = document.createElement("li");
                li.innerHTML = `<strong>${name}</strong> <button class="btn-del-opr" data-id="${id}" style="background: #e74c3c; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;"><i class="fas fa-trash"></i></button>`;
                oprList.appendChild(li);
            });

            document.querySelectorAll(".btn-del-opr").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    if (confirm("Are you sure you want to delete this OPR?")) await deleteDoc(doc(db, "gk_oprs", e.currentTarget.getAttribute("data-id")));
                });
            });
        });

        addOprForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = document.getElementById("newOprInput");
            if (input.value.trim()) {
                await addDoc(collection(db, "gk_oprs"), { name: input.value.trim() });
                input.value = "";
            }
        });
    }

    if (statusList && addStatusForm) {
        onSnapshot(query(collection(db, "gk_statuses"), orderBy("name")), (snapshot) => {
            statusList.innerHTML = "";
            if (snapshot.empty) statusList.innerHTML = '<li><span style="color:#7f8c8d;">No status tags found. Add one below.</span></li>';
            snapshot.forEach((docSnap) => {
                const id = docSnap.id;
                const name = docSnap.data().name;
                const li = document.createElement("li");
                li.innerHTML = `<strong>${name}</strong> <button class="btn-del-status" data-id="${id}" style="background: #e74c3c; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;"><i class="fas fa-trash"></i></button>`;
                statusList.appendChild(li);
            });

            document.querySelectorAll(".btn-del-status").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    if (confirm("Are you sure you want to delete this Status Tag?")) await deleteDoc(doc(db, "gk_statuses", e.currentTarget.getAttribute("data-id")));
                });
            });
        });

        addStatusForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = document.getElementById("newStatusInput");
            if (input.value.trim()) {
                await addDoc(collection(db, "gk_statuses"), { name: input.value.trim() });
                input.value = "";
            }
        });
    }

    // --- 3. Dynamic Dropdown Population for Checklist Form ---
    const inputOPR = document.getElementById("inputOPR");
    const inputStatus = document.getElementById("inputStatus");

    if (inputOPR) {
        onSnapshot(query(collection(db, "gk_oprs"), orderBy("name")), (snapshot) => {
            inputOPR.innerHTML = '<option value="">Select OPR...</option>';
            snapshot.forEach((docSnap) => {
                const opt = document.createElement("option");
                opt.value = docSnap.data().name;
                opt.innerText = docSnap.data().name;
                inputOPR.appendChild(opt);
            });
        });
    }

    if (inputStatus) {
        onSnapshot(query(collection(db, "gk_statuses"), orderBy("name")), (snapshot) => {
            inputStatus.innerHTML = '<option value="">Select Status...</option>';
            snapshot.forEach((docSnap) => {
                const opt = document.createElement("option");
                opt.value = docSnap.data().name;
                opt.innerText = docSnap.data().name;
                inputStatus.appendChild(opt);
            });
        });
    }
});
