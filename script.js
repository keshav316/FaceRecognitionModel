function previewImage(event, id) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function() {
            let img = document.getElementById("preview" + id);
            img.src = reader.result;
            img.style.display = "block";
            
            // Hide the full placeholder group
            let placeholder = document.getElementById("placeholder" + id);
            if (placeholder) {
                placeholder.style.display = "none";
            }
            
            // Add a brief scanning effect for upload confirmation
            let uploadBox = document.getElementById("uploadBox" + id);
            if (uploadBox) {
                uploadBox.classList.add("scanning");
                setTimeout(() => {
                    uploadBox.classList.remove("scanning");
                }, 2000);
            }
        }
        reader.readAsDataURL(file);
    }
}

async function predict() {
    let image1 = document.getElementById("image1").files[0];
    let image2 = document.getElementById("image2").files[0];

    if (!image1 || !image2) {
        alert("Please upload both images");
        return;
    }

    let formData = new FormData();
    formData.append("image1", image1);
    formData.append("image2", image2);

    // Get elements for visual styling
    const resultBox = document.getElementById("resultBox");
    const resultText = document.getElementById("result");
    const confidenceText = document.getElementById("confidence");
    const confidencePercent = document.getElementById("confidencePercent");
    const progressFill = document.getElementById("progressFill");
    const divider = document.querySelector(".divider");
    const uploadBox1 = document.getElementById("uploadBox1");
    const uploadBox2 = document.getElementById("uploadBox2");

    // Reset styles for loading state
    resultBox.classList.remove("success", "error", "has-result");
    resultBox.classList.add("loading");
    resultText.innerHTML = "⏳ AI is analyzing biometrics...";
    
    if (divider) divider.classList.add("comparing");
    if (uploadBox1) uploadBox1.classList.add("analyzing");
    if (uploadBox2) uploadBox2.classList.add("analyzing");
    
    progressFill.style.width = "0%";
    confidencePercent.innerHTML = "0%";

    try {
        let response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            body: formData
        });

        let data = await response.json();

        // Remove loading state classes
        resultBox.classList.remove("loading");
        if (divider) divider.classList.remove("comparing");
        if (uploadBox1) uploadBox1.classList.remove("analyzing");
        if (uploadBox2) uploadBox2.classList.remove("analyzing");

        // Set matching result classes
        resultBox.classList.add("has-result");
        
        let isMatch = data.prediction.toLowerCase().includes("same");
        if (isMatch) {
            resultBox.classList.add("success");
            resultText.innerHTML = "✅ Same Person Detected";
        } else {
            resultBox.classList.add("error");
            resultText.innerHTML = "❌ Different Person Detected";
        }

        // Update confidence values and progress bar width
        confidencePercent.innerHTML = data.confidence + "%";
        progressFill.style.width = data.confidence + "%";
        
        // For compatibility with any other elements
        if (confidenceText) {
            confidenceText.innerHTML = "Confidence : " + data.confidence + "%";
        }
    } catch (error) {
        console.error("Prediction error:", error);
        
        // Remove loading styles on error
        if (divider) divider.classList.remove("comparing");
        if (uploadBox1) uploadBox1.classList.remove("analyzing");
        if (uploadBox2) uploadBox2.classList.remove("analyzing");
        
        resultText.innerHTML = "❌ Error analyzing faces. Please check backend connection.";
    }
}