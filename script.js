function previewImage(event,id){


let file = event.target.files[0];


if(file){


let reader = new FileReader();


reader.onload=function(){


let img =
document.getElementById(
"preview"+id
);



img.src=reader.result;


img.style.display="block";



document.getElementById(
"text"+id
).style.display="none";



}



reader.readAsDataURL(file);



}


}







async function predict(){



let image1 =
document.getElementById(
"image1"
).files[0];



let image2 =
document.getElementById(
"image2"
).files[0];





if(!image1 || !image2){


alert(
"Please upload both images"
);


return;


}





let formData =
new FormData();




formData.append(
"image1",
image1
);



formData.append(
"image2",
image2
);






document.getElementById(
"result"
).innerHTML=
"⏳ AI is analyzing faces...";






let response =
await fetch(

"http://127.0.0.1:8000/predict",

{

method:"POST",

body:formData

}

);






let data =
await response.json();





document.getElementById(
"result"
).innerHTML=


data.prediction;



document.getElementById(
"confidence"
).innerHTML=


"Confidence : "
+
data.confidence
+
"%";




}