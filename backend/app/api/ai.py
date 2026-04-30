from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import require_any_role, require_admin, require_manager_or_admin
from app.services.log_service import write_log
from app.services import ai_service
from app.ml.trainer import model_exists
from app.models.user import User
from app.schemas.ai import (
    AIQueryRequest,
    AIQueryResponse,
    StockAnalysisResponse,
    ReorderResponse,
    TrainResponse,
)

router = APIRouter(prefix="/ai", tags=["AI-ассистент"])


# ─── Обучение нейросети ───────────────────────────────────────────────────────

@router.post(
    "/train",
    response_model=TrainResponse,
    summary="Обучить нейросеть",
    description=(
        "Запускает обучение MLP-нейросети на синтетических данных (2000 примеров) "
        "+ реальные данные из БД если они есть. "
        "Сохраняет веса в app/ml/weights/. "
        "**Только для администраторов.**"
    ),
)
def train_model(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        result = ai_service.train_model(db)
        write_log(
            db,
            current_user.id,
            "ai_train",
            details={
                "accuracy":      result["accuracy"],
                "samples_total": result["samples_total"],
            },
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обучения: {str(e)}")


# ─── Анализ склада ────────────────────────────────────────────────────────────

@router.get(
    "/stock/analysis",
    response_model=StockAnalysisResponse,
    summary="AI-анализ склада",
    description=(
        "Нейросеть анализирует все запчасти: расход за 30 дней, "
        "прогноз до нуля, уровень критичности, уверенность модели. "
        "Отсортировано: critical → warning → ok. "
        "**Менеджер и администратор.**"
    ),
)
def stock_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    if not model_exists():
        raise HTTPException(
            status_code=425,
            detail=(
                "Нейросеть ещё не обучена. "
                "Администратор должен вызвать POST /api/ai/train"
            ),
        )
    try:
        result = ai_service.get_stock_analysis(db)
        write_log(
            db,
            current_user.id,
            "ai_stock_analysis",
            details={"total_parts": result["total_parts"]},
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=425, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка анализа: {str(e)}")


# ─── Список закупок ───────────────────────────────────────────────────────────

@router.get(
    "/stock/reorder",
    response_model=ReorderResponse,
    summary="AI-список для закупки",
    description=(
        "Только позиции с recommended_order_qty > 0. "
        "Включает примерную стоимость закупки. "
        "Отсортировано: critical → warning → ok. "
        "**Менеджер и администратор.**"
    ),
)
def stock_reorder(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    if not model_exists():
        raise HTTPException(
            status_code=425,
            detail="Нейросеть ещё не обучена. Вызови POST /api/ai/train",
        )
    try:
        result = ai_service.get_reorder_list(db)
        write_log(
            db,
            current_user.id,
            "ai_reorder_list",
            details={"total_items": result["total_items"]},
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=425, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка формирования списка: {str(e)}")


# ─── Общий AI-чат (сохранён из предыдущей версии) ────────────────────────────

@router.post(
    "/query",
    response_model=AIQueryResponse,
    summary="Вопрос AI-ассистенту (требует ANTHROPIC_API_KEY)",
    description="Свободный вопрос на тему автосервиса. Доступно всем сотрудникам.",
)
def ai_query(
    data: AIQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_role),
):
    from decouple import config
    api_key = config("ANTHROPIC_API_KEY", default="")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="AI-чат не настроен. Укажите ANTHROPIC_API_KEY в .env",
        )
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        user_message = data.question
        if data.context:
            user_message = f"Контекст:\n{data.context}\n\nВопрос:\n{data.question}"

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=(
                "Ты — AI-ассистент для автосервиса (СТО). "
                "Помогаешь механикам и менеджерам: диагностика, запчасти, "
                "стоимость работ, управление складом. "
                "Отвечай кратко и по делу на русском языке."
            ),
            messages=[{"role": "user", "content": user_message}],
        )

        answer = message.content[0].text
        write_log(db, current_user.id, "ai_query", details={"question": data.question[:200]})
        return AIQueryResponse(answer=answer, model=message.model)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка AI: {str(e)}")
