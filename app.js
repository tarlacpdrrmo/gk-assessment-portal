import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
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
const auth = getAuth(app); 

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // MODULE 0: SECURITY & AUTHENTICATION
    // ==========================================
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes("login.html");
    const adminNav = document.getElementById("adminNav");
    const userRoleDisplay = document.getElementById("userRoleDisplay");
    
    const LEAD_ADMIN_EMAILS = ["paness9793@gmail.com"]; 
    
    const TEAM_NAMES = {
        "paness9793@gmail.com": "Admin", 
        "encoder@tarlac.gov.ph": "Juan (PSWDO)", 
        "another@tarlac.gov.ph": "Maria (PHRMO)" 
    };

    let isLeadAdmin = false; 

    onAuthStateChanged(auth, (user) => {
        if (!user && !isLoginPage) {
            window.location.href = "login.html";
        } else if (user && isLoginPage) {
            window.location.href = "index.html";
        } else if (user) {
            isLeadAdmin = LEAD_ADMIN_EMAILS.includes(user.email);
            const displayName = TEAM_NAMES[user.email] || user.email.split('@')[0];

            if (userRoleDisplay) {
                if (isLeadAdmin) {
                    userRoleDisplay.innerHTML = `<i class="fas fa-user-shield"></i> ${displayName}`;
                } else {
                    userRoleDisplay.innerHTML = `<i class="fas fa-user"></i> ${displayName}`;
                }
            }

            if (!isLeadAdmin) {
                if (adminNav) adminNav.style.display = "none";
                if (currentPage.includes("admin.html")) {
                    alert("ACCESS DENIED: Your account does not have Master Admin privileges. Redirecting to the Dashboard.");
                    window.location.href = "index.html";
                }
            }
        }
    });

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

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await signOut(auth);
        });
    }

    // ==========================================
    // MODULE 1: MOV CHECKLIST & CASCADING DROPDOWNS
    // ==========================================
    const modal = document.getElementById("recordModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const recordForm = document.getElementById("addRecordForm");
    const tableBody = document.getElementById("checklistTableBody");
    const modalTitle = document.querySelector(".modal-header h3");
    
    const pillarSelect = document.getElementById("inputPillar");
    const criterionSelect = document.getElementById("inputCriterion");

    let currentEditId = null;

    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
            currentEditId = null;
            recordForm.reset();
            if(criterionSelect) criterionSelect.innerHTML = '<option value="">Select a Pillar first...</option>';
            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-file-medical"></i> Add New Assessment MOV';
            modal.style.display = "flex";
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            modal.style.display = "none";
            recordForm.reset();
            if(criterionSelect) criterionSelect.innerHTML = '<option value="">Select a Pillar first...</option>';
        });
    }

    // --- NEW: CASCADING DROPDOWN DICTIONARY ---
    const criteriaMap = {
        "Structure": [
            {
                groupName: "A. Established and Functional LDRRMC",
                indicators: [
                    { id: "1.1", title: "Establishment of LDRRMC" },
                    { id: "1.2", title: "Convene the LDRRMC quarterly or as necessary" },
                    { id: "1.3", title: "Organization of DRRMC" }
                ]
            },
            {
                groupName: "B. Creation of Local DRRM Office",
                indicators: [
                    { id: "1.4", title: "Secretariat and Executive Arm of LDRRMC" },
                    { id: "1.5", title: "Creation of LDRRM Office" },
                    { id: "1.6", title: "LDRRMO Staffing/ Personnel Complement" },
                    { id: "1.7", title: "Local DRRM Officer" }
                ]
            },
            {
                groupName: "C. Established Local DRRM Operations Center",
                indicators: [
                    { id: "1.8", title: "Establishment of Prov/City/Mun DRRM Ops Center" },
                    { id: "1.9", title: "Organization and Competence of local ERTs" }
                ]
            }
        ],

        "Competency": [
    {
        groupName: "A. Capacitated on Disaster Prevention and Mitigation",
        indicators: [
            { id: "2.1", title: "Facilitation and Support to Risk Assessment" },
            { id: "2.2", title: "Maintenance of Local Risk Maps" },
            { id: "2.3", title: "Operation of multi-hazard end-to-end Early Warning System (EWS)" }
        ]
    },
    {
        groupName: "B. Capacitated on Disaster Preparedness",
        indicators: [
            { id: "2.4", title: "DRRM Activities, C/M/BDRRM Plan, LCCAP & Contingency Plans" },
            { id: "2.5", title: "Monitor and evaluate the implementation of the LDRRMPs" },
            { id: "2.6", title: "Organization and conduct of training, orientation and knowledge management" }
        ]
    },
        {
        groupName: "C. Capacitated on Disaster Response",
        indicators: [
            { id: "2.7", title: "Recommend the implementation of forced or pre-emptive evacuation" },
            { id: "2.8", title: "Pre-positioning" },
            { id: "2.9", title: "Camp Coordination and Camp Management" },
            { id: "2.10", title: "Response to and management of adverse effects of emergencies/disasters" }
        ]
    },
        {
        groupName: "D. Capacitated on Disaster Rehabilitation and Recovery",
        indicators: [
            { id: "2.11", title: "Facilitation of early recovery and rehabilitation interventions" },
            { id: "2.12", title: "Formulation of Rehabilitation and Recovery Program" }
        ]
    }
],

    "Management Systems": [
            {
                groupName: "A. Established Standard Operating Procedures",
                indicators: [
                    { id: "3.1", title: "Hazard-specific SOPs" }
                ]
            },
            {
                groupName: "B. Mainstreaming of DRRM and CCA in Local Development Plans",
                indicators: [
                    { id: "3.2", title: "Ensure the integration of risk reduction and climate change adaptation" }
                ]
            },
            {
                groupName: "C. Local DRRM Funding Utilization",
                indicators: [
                    { id: "3.3", title: "Programming and budgeting for LDRRMF" }
                ]
            }
        
    };

    if (pillarSelect && criterionSelect) {
        pillarSelect.addEventListener("change", function() {
            const selectedPillar = this.value;
            criterionSelect.innerHTML = '<option value="">Select Criterion...</option>';
            
            if (criteriaMap[selectedPillar]) {
                criteriaMap[selectedPillar].forEach(category => {
                    const optGroup = document.createElement("optgroup");
                    optGroup.label = category.groupName;
                    
                    category.indicators.forEach(crit => {
                        const option = document.createElement("option");
                        option.value = crit.id; 
                        option.textContent = `${crit.id} - ${crit.title}`;
                        optGroup.appendChild(option);
                    });
                    criterionSelect.appendChild(optGroup);
                });
            }
        });
    }

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
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No records found. Click "Add New Record" to create one.</td></tr>';
                return;
            }
            snapshot.forEach((documentSnap) => {
                const data = documentSnap.data();
                const id = documentSnap.id;
                const row = document.createElement("tr");
                
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

            document.querySelectorAll(".btn-edit").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const docId = e.currentTarget.getAttribute("data-id");
                    currentEditId = docId;
                    const row = e.currentTarget.closest("tr");
                    
                    document.getElementById("inputPillar").value = row.cells[0].innerText.trim();
                    
                    // Trigger pillar change to populate criterion dropdown
                    const event = new Event('change');
                    document.getElementById("inputPillar").dispatchEvent(event);
                    setTimeout(() => { document.getElementById("inputCriterion").value = row.cells[1].innerText.trim(); }, 100);

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
    // MODULE 2: UNIFIED DASHBOARD LOGIC (STRICT OPTION A)
    // ==========================================
    const kpiCompletion = document.getElementById("kpiCompletion"); 
    
    if (kpiCompletion) { 
        const setupAccordion = (headerId, contentId) => {
            const header = document.getElementById(headerId);
            const content = document.getElementById(contentId);
            if (header && content) {
                header.addEventListener('click', () => {
                    const isHidden = content.style.display === 'none';
                    content.style.display = isHidden ? 'block' : 'none';
                    header.querySelector('i').className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                });
            }
        };
        setupAccordion('header-pillar-1', 'content-pillar-1');
        setupAccordion('header-pillar-2', 'content-pillar-2');
        setupAccordion('header-pillar-3', 'content-pillar-3'); 
        setupAccordion('header-pillar-4', 'content-pillar-4'); 
        setupAccordion('header-pillar-5', 'content-pillar-5'); 
        setupAccordion('header-pillar-6', 'content-pillar-6'); 

        // TARGETS
        const PILLAR_1_TARGETS = { "1.1": 4, "1.2": 8, "1.3": 19, "1.4": 4, "1.5": 4, "1.6": 4, "1.7": 4, "1.8": 8, "1.9": 7 };
        const totalPillar1Target = 62;
        const PILLAR_2_TARGETS = { "2.1": 6, "2.2": 4, "2.3": 2, "2.4": 14, "2.5": 3, "2.6": 4, "2.7": 3, "2.8": 4, "2.9": 6, "2.10": 10, "2.11": 5, "2.12": 10 };
        const totalPillar2Target = 71;
        const PILLAR_3_TARGETS = { "3.1": 7, "3.2": 3, "3.3": 5 };
        const totalPillar3Target = 15;
        const PILLAR_4_TARGETS = { "4.1": 4 };
        const totalPillar4Target = 4;
        const PILLAR_5_TARGETS = { "5.1": 4, "5.2": 4 };
        const totalPillar5Target = 8;
        const PILLAR_6_TARGETS = { "6.1": 6, "6.2": 4 };
        const totalPillar6Target = 10;

        onSnapshot(collection(db, "gk_assessments"), (snapshot) => {
            let p1Counts = { "1.1": 0, "1.2": 0, "1.3": 0, "1.4": 0, "1.5": 0, "1.6": 0, "1.7": 0, "1.8": 0, "1.9": 0 };
            let p2Counts = { "2.1": 0, "2.2": 0, "2.3": 0, "2.4": 0, "2.5": 0, "2.6": 0, "2.7": 0, "2.8": 0, "2.9": 0, "2.10": 0, "2.11": 0, "2.12": 0 };
            let p3Counts = { "3.1": 0, "3.2": 0, "3.3": 0 }; 
            let p4Counts = { "4.1": 0 }; 
            let p5Counts = { "5.1": 0, "5.2": 0 }; 
            let p6Counts = { "6.1": 0, "6.2": 0 }; 
            
            let pendingCount = 0;
            let reviewCount = 0;
            let requestedItems = []; 
            const TOTAL_CRITERIA = 29; 
            
            // STRICT TRACKER AND RATING VARIABLES
            let fullyCompletedCriteria = 0;
            let totalAssessedPoints = 0; // Tracks your 0-3 points

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.status === "OK / Scanned" || data.status === "Hardcopy On Hand") {
                    if (data.pillar === "Structure" && p1Counts[data.criterion] !== undefined) p1Counts[data.criterion]++;
                    if (data.pillar === "Competency" && p2Counts[data.criterion] !== undefined) p2Counts[data.criterion]++;
                    if (data.pillar === "Management Systems" && p3Counts[data.criterion] !== undefined) p3Counts[data.criterion]++;
                    if (data.pillar === "Enabling Policies" && p4Counts[data.criterion] !== undefined) p4Counts[data.criterion]++;
                    if (data.pillar === "Knowledge Management and Advocacy" && p5Counts[data.criterion] !== undefined) p5Counts[data.criterion]++;
                    if (data.pillar === "Partnership and Participation" && p6Counts[data.criterion] !== undefined) p6Counts[data.criterion]++;
                }
                if (data.status === "Requested") {
                    pendingCount++;
                    requestedItems.push(data);
                }
                if (data.status === "Under Review") reviewCount++;
            });

            const processPillarMath = (countsObj, targetsObj, prefix, overallTarget) => {
                let totalUploaded = 0;
                for (let crit in targetsObj) {
                    let uploaded = countsObj[crit];
                    let target = targetsObj[crit];
                    totalUploaded += Math.min(uploaded, target); 
                    
                    let pct = Math.round((uploaded / target) * 100);
                    if (pct > 100) pct = 100;
                    
                    // 1. STRICT TRACKER MATH
                    if (pct === 100) {
                        fullyCompletedCriteria++;
                    }

                    // 2. 0-3 RATING ENGINE
                    let score = 0;
                    if (pct === 100) {
                        score = 3; 
                    } else if (pct >= 50) {
                        score = 2; 
                    } else if (pct > 0) {
                        score = 1; 
                    }
                    totalAssessedPoints += score; 

                    let pctElement = document.getElementById(`pct-${crit.replace('.', '-')}`);
                    if (pctElement) {
                        pctElement.innerText = `${pct}%`;
                        pctElement.style.color = pct === 100 ? '#27ae60' : (pct > 0 ? '#e67e22' : '#e74c3c');
                    }
                }
                let overallPct = Math.round((totalUploaded / overallTarget) * 100);
                let overallElement = document.getElementById(`pillar-${prefix}-overall-pct`);
                if (overallElement) overallElement.innerText = `(${overallPct}%)`;
            };

            processPillarMath(p1Counts, PILLAR_1_TARGETS, "1", totalPillar1Target);
            processPillarMath(p2Counts, PILLAR_2_TARGETS, "2", totalPillar2Target);
            processPillarMath(p3Counts, PILLAR_3_TARGETS, "3", totalPillar3Target); 
            processPillarMath(p4Counts, PILLAR_4_TARGETS, "4", totalPillar4Target); 
            processPillarMath(p5Counts, PILLAR_5_TARGETS, "5", totalPillar5Target); 
            processPillarMath(p6Counts, PILLAR_6_TARGETS, "6", totalPillar6Target); 

            // KPIs
            const kpiFraction = document.getElementById("kpiFraction");
            const kpiPending = document.getElementById("kpiPending");
            const kpiReview = document.getElementById("kpiReview");
            const kpiScore = document.getElementById("kpiScore");
            const kpiScoreText = document.getElementById("kpiScoreText");

            if (kpiCompletion && kpiFraction) {
                const totalPercent = Math.round((fullyCompletedCriteria / TOTAL_CRITERIA) * 100);
                kpiCompletion.innerText = `${totalPercent}%`;
                kpiFraction.innerText = `${fullyCompletedCriteria}/${TOTAL_CRITERIA} Criteria Fully Satisfied`;
            }
            
            if (kpiPending) kpiPending.innerText = pendingCount;
            if (kpiReview) kpiReview.innerText = reviewCount;

            // ADVANCED 0-3 PROJECTED SCORE
            if (kpiScore && kpiScoreText) {
                const currentScore = (totalAssessedPoints / TOTAL_CRITERIA).toFixed(2);
                kpiScore.innerText = currentScore;
                
                if (currentScore >= 2.50) {
                    kpiScoreText.innerText = "Beyond Compliant (Projected)";
                    kpiScore.style.color = "#f1c40f"; 
                } else if (currentScore >= 1.50) {
                    kpiScoreText.innerText = "Fully Compliant (Projected)";
                    kpiScore.style.color = "#3498db"; 
                } else {
                    kpiScoreText.innerText = "Needs Improvement (Projected)";
                    kpiScore.style.color = "#e74c3c"; 
                }
            }

            // Priority Table
            const priorityTable = document.getElementById("priorityOprTableBody");
            if (priorityTable) {
                priorityTable.innerHTML = "";
                if (requestedItems.length === 0) {
                    priorityTable.innerHTML = '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #27ae60;"><strong><i class="fas fa-check-circle"></i> All caught up! No pending OPR requests.</strong></td></tr>';
                } else {
                    requestedItems.sort((a, b) => (b.created_at ? b.created_at.toMillis() : 0) - (a.created_at ? a.created_at.toMillis() : 0));
                    requestedItems.slice(0, 4).forEach(item => {
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
    const trackerTableBody = document.getElementById("trackerTableBody");

    if (trackerTableBody) {
        const q = query(collection(db, "gk_assessments"), orderBy("created_at", "desc"));
        onSnapshot(q, (snapshot) => {
            trackerTableBody.innerHTML = "";
            let hasRequests = false;

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.status === "Requested") {
                    hasRequests = true;
                    const row = document.createElement("tr");
                    
                    let daysPending = 1;
                    if (data.created_at) {
                        const createdDate = data.created_at.toDate();
                        const today = new Date();
                        const diffTime = Math.abs(today - createdDate);
                        daysPending = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    }

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
                const originalText = exportCsvBtn.innerHTML;
                exportCsvBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating CSV...';
                exportCsvBtn.disabled = true;

                const snapshot = await getDocs(query(collection(db, "gk_assessments"), orderBy("pillar", "asc")));
                
                if (snapshot.empty) {
                    alert("No data found to export.");
                    exportCsvBtn.innerHTML = originalText;
                    exportCsvBtn.disabled = false;
                    return;
                }

                let csvContent = "Pillar,Criterion,Document Title,OPR,Status,Link / Location\n";

                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
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

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                
                const today = new Date().toISOString().split('T')[0];
                link.setAttribute("href", url);
                link.setAttribute("download", `GK_2026_Database_Export_${today}.csv`);
                link.style.visibility = 'hidden';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

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

// ==========================================
    // MODULE 6: TABLE FILTERING ENGINE (FIXED)
    // ==========================================
    const filterPillar = document.getElementById("filterPillar");
    const filterCriterion = document.getElementById("filterCriterion");
    const filterOPR = document.getElementById("filterOPR");
    const filterStatus = document.getElementById("filterStatus");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const checklistTableBodyFilter = document.getElementById("checklistTableBody");

    // We define a standalone dictionary here to prevent scope errors!
    const filterCriteriaMap = {
        "Structure": [
            {
                groupName: "A. Established and Functional LDRRMC",
                indicators: [
                    { id: "1.1", title: "Establishment of LDRRMC" },
                    { id: "1.2", title: "Convene the LDRRMC quarterly or as necessary" },
                    { id: "1.3", title: "Organization of DRRMC" }
                ]
            },
            {
                groupName: "B. Creation of Local DRRM Office",
                indicators: [
                    { id: "1.4", title: "Secretariat and Executive Arm of LDRRMC" },
                    { id: "1.5", title: "Creation of LDRRM Office" },
                    { id: "1.6", title: "LDRRMO Staffing/ Personnel Complement" },
                    { id: "1.7", title: "Local DRRM Officer" }
                ]
            },
            {
                groupName: "C. Established Local DRRM Operations Center",
                indicators: [
                    { id: "1.8", title: "Establishment of Prov/City/Mun DRRM Ops Center" },
                    { id: "1.9", title: "Organization and Competence of local ERTs" }
                ]
            }
        ],

        "Competency": [
    {
        groupName: "A. Capacitated on Disaster Prevention and Mitigation",
        indicators: [
            { id: "2.1", title: "Facilitation and Support to Risk Assessment" },
            { id: "2.2", title: "Maintenance of Local Risk Maps" },
            { id: "2.3", title: "Operation of multi-hazard end-to-end Early Warning System (EWS)" }
        ]
    },
    {
        groupName: "B. Capacitated on Disaster Preparedness",
        indicators: [
            { id: "2.4", title: "DRRM Activities, C/M/BDRRM Plan, LCCAP & Contingency Plans" },
            { id: "2.5", title: "Monitor and evaluate the implementation of the LDRRMPs" },
            { id: "2.6", title: "Organization and conduct of training, orientation and knowledge management" }
        ]
    },
    {
        groupName: "C. Capacitated on Disaster Response",
        indicators: [
            { id: "2.7", title: "Recommend the implementation of forced or pre-emptive evacuation" },
            { id: "2.8", title: "Pre-positioning" },
            { id: "2.9", title: "Camp Coordination and Camp Management" },
            { id: "2.10", title: "Response to and management of adverse effects of emergencies/disasters" }
        ]
    },
    {
        groupName: "D. Capacitated on Disaster Rehabilitation and Recovery",
        indicators: [
            { id: "2.11", title: "Facilitation of early recovery and rehabilitation interventions" },
            { id: "2.12", title: "Formulation of Rehabilitation and Recovery Program" }
        ]
    }
],
        "Management Systems": [
            {
                groupName: "A. Established Standard Operating Procedures",
                indicators: [
                    { id: "3.1", title: "Hazard-specific SOPs" }
                ]
            },
            {
                groupName: "B. Mainstreaming of DRRM and CCA in Local Development Plans",
                indicators: [
                    { id: "3.2", title: "Ensure the integration of risk reduction and climate change adaptation" }
                ]
            },
            {
                groupName: "C. Local DRRM Funding Utilization",
                indicators: [
                    { id: "3.3", title: "Programming and budgeting for LDRRMF" }
                ]
            },
        
    };

    if (filterPillar && filterCriterion && filterOPR && filterStatus) {
        
        // 1. Populate Dropdowns from Firebase
        onSnapshot(query(collection(db, "gk_oprs"), orderBy("name")), (snapshot) => {
            filterOPR.innerHTML = '<option value="All">All OPRs</option>';
            snapshot.forEach(docSnap => filterOPR.innerHTML += `<option value="${docSnap.data().name}">${docSnap.data().name}</option>`);
        });

        onSnapshot(query(collection(db, "gk_statuses"), orderBy("name")), (snapshot) => {
            filterStatus.innerHTML = '<option value="All">All Statuses</option>';
            snapshot.forEach(docSnap => filterStatus.innerHTML += `<option value="${docSnap.data().name}">${docSnap.data().name}</option>`);
        });

        // 2. Cascading Pillar -> Criterion Filter
        filterPillar.addEventListener("change", () => {
            const selected = filterPillar.value;
            filterCriterion.innerHTML = '<option value="All">All Criteria</option>';
            
            if (selected !== "All" && filterCriteriaMap[selected]) {
                filterCriteriaMap[selected].forEach(category => {
                    const optGroup = document.createElement("optgroup");
                    optGroup.label = category.groupName;
                    category.indicators.forEach(crit => {
                        optGroup.innerHTML += `<option value="${crit.id}">${crit.id} - ${crit.title}</option>`;
                    });
                    filterCriterion.appendChild(optGroup);
                });
            }
            applyFilters();
        });

        // 3. The Core Filter Logic
        const applyFilters = () => {
            if (!checklistTableBodyFilter) return;
            const pVal = filterPillar.value;
            const cVal = filterCriterion.value;
            const oVal = filterOPR.value;
            const sVal = filterStatus.value;

            const rows = checklistTableBodyFilter.querySelectorAll("tr");
            rows.forEach(row => {
                if (row.cells.length < 5) return; // Skip empty state row

                const rowPillar = row.cells[0].innerText.trim();
                const rowCriterion = row.cells[1].innerText.trim();
                const rowOPR = row.cells[3].innerText.trim();
                const rowStatus = row.cells[4].innerText.trim();

                const matchPillar = (pVal === "All" || rowPillar === pVal);
                const matchCriterion = (cVal === "All" || rowCriterion === cVal);
                const matchOPR = (oVal === "All" || rowOPR === oVal);
                const matchStatus = (sVal === "All" || rowStatus === sVal);

                if (matchPillar && matchCriterion && matchOPR && matchStatus) {
                    row.style.display = ""; // Show
                } else {
                    row.style.display = "none"; // Hide
                }
            });
        };

        // 4. Trigger filters on dropdown change
        filterCriterion.addEventListener("change", applyFilters);
        filterOPR.addEventListener("change", applyFilters);
        filterStatus.addEventListener("change", applyFilters);

        // 5. Reset Button
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener("click", () => {
                filterPillar.value = "All";
                filterPillar.dispatchEvent(new Event("change")); // Resets the criteria list
                filterOPR.value = "All";
                filterStatus.value = "All";
                setTimeout(applyFilters, 50);
            });
        }

        // 6. Auto-filter when Firebase adds new data to the table
        const observer = new MutationObserver(applyFilters);
        observer.observe(checklistTableBodyFilter, { childList: true });
    }
