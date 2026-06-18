from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import torch
from torch import nn

from PIL import Image
from torchvision import transforms

import io
import zipfile
import os



# =========================
# Extract Model ZIP
# =========================

MODEL_FOLDER = "model"
MODEL_ZIP = "model.zip"


if not os.path.exists(MODEL_FOLDER):

    print("Extracting model...")

    with zipfile.ZipFile(MODEL_ZIP, "r") as zip_ref:

        zip_ref.extractall(".")


    print("Model extracted successfully")

else:

    print("Model folder already exists")



# =========================
# Device
# =========================

device = torch.device(
    "cuda" if torch.cuda.is_available()
    else "cpu"
)


print("Using device:", device)



# =========================
# Siamese Neural Network
# =========================


class MYNN(nn.Module):

    def __init__(self, input_features):

        super().__init__()


        self.features = nn.Sequential(

            nn.Conv2d(input_features,32,3,padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(32),
            nn.MaxPool2d(2),
            nn.Dropout(0.0013709629937075727),


            nn.Conv2d(32,64,3,padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(64),
            nn.MaxPool2d(2),
            nn.Dropout(0.0013709629937075727),


            nn.Conv2d(64,128,3,padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(128),
            nn.MaxPool2d(2),
            nn.Dropout(0.0013709629937075727)

        )


        self.classifier = nn.Sequential(

            nn.Linear(
                128*16*16,
                256
            ),

            nn.ReLU(),

            nn.Dropout(
                0.007875641171471472
            ),


            nn.Linear(
                256,
                128
            ),

            nn.ReLU(),

            nn.Dropout(
                0.007875641171471472
            ),


            nn.Linear(
                128,
                1
            )

        )



    def forward(self,img1,img2):


        feat1 = self.features(img1)

        feat2 = self.features(img2)


        feat1 = torch.flatten(
            feat1,
            start_dim=1
        )


        feat2 = torch.flatten(
            feat2,
            start_dim=1
        )


        diff = torch.abs(
            feat1-feat2
        )


        output = self.classifier(diff)


        return output





# =========================
# Load Model
# =========================


model = MYNN(
    input_features=3
)


MODEL_PATH = "model/face_recognition_siamese_model.pth"


model.load_state_dict(

    torch.load(
        MODEL_PATH,
        map_location=device,
        weights_only=True
    )

)


model.to(device)


model.eval()


print("Model loaded successfully")





# =========================
# FastAPI App
# =========================


app = FastAPI(
    title="Face Recognition API",
    version="1.0"
)



app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)





# =========================
# Image Transformation
# =========================


transform = transforms.Compose([

    transforms.Resize(
        (128,128)
    ),

    transforms.ToTensor()

])




def preprocess(image_bytes):


    image = Image.open(
        io.BytesIO(image_bytes)
    ).convert("RGB")



    image = transform(image)


    image = image.unsqueeze(0)


    return image.to(device)





# =========================
# Home API
# =========================


@app.get("/")

def home():

    return {

        "message":
        "Face Recognition API Running"

    }





# =========================
# Prediction API
# =========================


@app.post("/predict")

async def predict(

    image1: UploadFile = File(...),

    image2: UploadFile = File(...)

):


    img1 = await image1.read()

    img2 = await image2.read()



    img1 = preprocess(img1)

    img2 = preprocess(img2)



    with torch.no_grad():

        output = model(
            img1,
            img2
        )


        probability = torch.sigmoid(
            output
        )



    probability = probability.item()



    if probability >= 0.5:

        result = "Same Person"

    else:

        result = "Different Person"




    return {


        "prediction": result,


        "confidence":
        round(
            probability*100,
            2
        )

    }