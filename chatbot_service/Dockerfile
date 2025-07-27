FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ libffi-dev && apt-get clean

COPY requirements.txt .

# Install numpy and torch first, then the rest
RUN pip install --upgrade pip && \
    pip install numpy==1.26.4 && \
    pip install torch==2.2.0+cpu -f https://download.pytorch.org/whl/torch_stable.html && \
    pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host=0.0.0.0", "--port=8000"]
