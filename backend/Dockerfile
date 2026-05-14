FROM python:3.11-slim

WORKDIR /app

# Устанавливаем зависимости отдельным слоем — кешируется если requirements.txt не менялся
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходники
COPY . .

EXPOSE 8000

# Таблицы создаются автоматически через Base.metadata.create_all() при старте приложения
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
