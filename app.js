// Function to dismiss the mid-year reminder alert
function dismissAlert() {
    const alertBox = document.getElementById('midYearAlert');
    alertBox.style.opacity = '0';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 300); // Wait for fade out animation if added later
}

// Future implementation: 
// Here we will add the Firebase data fetching logic to dynamically populate 
// the KPI numbers and Progress Bar percentages instead of hardcoding them.
console.log("GK Assessment Portal JS Loaded Successfully.");
