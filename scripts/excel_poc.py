"""
TASK-014 · Excel servis araştırması - POC scripti

Amaç: multipart/form-data ile gelen bir .xlsx dosyasını FastAPI'de
UploadFile ile almak, pandas ile okumak ve ilk 5 satırı yazdırmak.

Çalıştırma:
    uvicorn excel_poc:app --reload --port 8001

Test:
    curl -X POST "http://localhost:8001/excel-poc/upload" \
         -F "file=@ornek.xlsx"

Not: Bu dosya production'a gitmeyecek, sadece araştırma/POC amaçlıdır.
Sprint 2'de gerçek endpoint apps/api/app/api/v1/excel.py içinde yazılacak.
"""

import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI(title="Excel POC")


@app.post("/excel-poc/upload")
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Sadece .xlsx/.xls dosyaları kabul edilir")

    contents = await file.read()

    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Excel okunamadı: {str(e)}")

    preview = df.head(5).to_dict(orient="records")

    return {
        "filename": file.filename,
        "n_rows": len(df),
        "n_columns": len(df.columns),
        "columns": list(df.columns),
        "preview_first_5_rows": preview,
    }


if __name__ == "__main__":
    print("excel_poc.py hatasız yüklendi. Sunucuyu başlatmak için:")
    print("  uvicorn scripts.excel_poc:app --reload --port 8001")
