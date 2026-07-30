import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// NEW: Import Authentication Modules
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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

    // 1. Listen for User Login Status
    onAuthStateChanged(auth, (user) => {
        if (!user && !isLoginPage) {
            // If they are NOT logged in and try to access the dashboard, kick them to login
            window.location.href = "login.html";
        } else if (user && isLoginPage) {
            // If they ARE logged in but on the login page, push them to the dashboard
            window.location.href = "index.html";
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
                // Success! The onAuthStateChanged listener above will auto-redirect them
            } catch (error) {
                console.error("Login Error:", error);
                alert("Invalid Email or Password. Please try again.");
            }
        });
    }

    // 3. Handle Logout Button (If you add an id="logoutBtn" to any button)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await signOut(auth);
        });
    }

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
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No records found. Click "Add New Record" to create one.</td></tr>';
                return;
            }
            snapshot.forEach((documentSnap) => {
                const data = documentSnap.data();
                const id = documentSnap.id;
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><span style="font-size: 0.85em; color: #7f8c8d; font-weight: bold;">${data.pillar || 'Uncategorized'}</span></td> <!-- NEW LINE -->
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
    // MODULE 2: NEW PILLAR DASHBOARD LOGIC
    // ==========================================
    const kpiStructure = document.getElementById("kpiStructure");
    if (kpiStructure) { 
        onSnapshot(query(collection(db, "gk_assessments")), (snapshot) => {
            let counts = { "Structure": 0, "Competency": 0, "Management Systems": 0, "Enabling Policies": 0, "Knowledge Management and Advocacy": 0, "Partnership and Participation": 0 };

            snapshot.forEach((doc) => {
                const data = doc.data();
                // Only count it if the status means it is completed
                if (data.status === "OK / Scanned" || data.status === "Hardcopy On Hand") {
                    if (counts[data.pillar] !== undefined) counts[data.pillar]++;
                }
            });

            document.getElementById("kpiStructure").innerText = `${counts["Structure"]} MOV`;
            document.getElementById("kpiCompetency").innerText = `${counts["Competency"]} MOV`;
            document.getElementById("kpiManagement").innerText = `${counts["Management Systems"]} MOV`;
            document.getElementById("kpiPolicies").innerText = `${counts["Enabling Policies"]} MOV`;
            document.getElementById("kpiKnowledge").innerText = `${counts["Knowledge Management and Advocacy"]} MOV`;
            document.getElementById("kpiPartnership").innerText = `${counts["Partnership and Participation"]} MOV`;
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
                            <button style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
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
