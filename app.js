// 1. Import Firebase from the official Google CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. Your specific Firebase Configuration Keys
const firebaseConfig = {
  apiKey: "AIzaSyDSCB9jQIzyn9WxGZ58sLkYJPHCj5oeEKQ",
  authDomain: "pdrrmo-dashboard.firebaseapp.com",
  projectId: "pdrrmo-dashboard",
  storageBucket: "pdrrmo-dashboard.firebasestorage.app",
  messagingSenderId: "555106842078",
  appId: "1:555106842078:web:18e95c2e1352db559ad94f"
};

// 3. Initialize Firebase and Firestore Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Test the Connection (Wired to the Add Button)
document.addEventListener("DOMContentLoaded", () => {
    
    // Find the "Add New Record" button on the checklist page
    const addBtn = document.querySelector(".btn-primary");
    
    if(addBtn) {
        addBtn.addEventListener("click", async () => {
            // Change button text so you know it's working
            addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                // Push a test document into a new 'gk_assessments' folder in Firebase
                const docRef = await addDoc(collection(db, "gk_assessments"), {
                    criterion: "Test 1.1",
                    document_name: "Test Executive Order " + new Date().toLocaleTimeString(),
                    opr: "PDRRMO",
                    status: "Testing Connection",
                    upload_date: new Date()
                });
                
                alert("Success! The portal is officially connected to Firebase. Record ID: " + docRef.id);
                addBtn.innerHTML = '<i class="fas fa-plus"></i> Add New Record'; // Reset button
                
            } catch (e) {
                console.error("Error adding document: ", e);
                alert("Connection failed. Please check the developer console.");
                addBtn.innerHTML = '<i class="fas fa-times"></i> Error';
            }
        });
    }
});
