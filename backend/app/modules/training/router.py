from fastapi import APIRouter

from app.modules.training.service import calculate_completion_percentage

router = APIRouter(
    prefix="/training",
    tags=["Training"]
)


@router.get("/")
def training_home():
    return {
        "module": "Training",
        "status": "Working"
    }


@router.get("/progress")
def get_sample_progress():

    completed = 6
    total = 10

    return {
        "employee": "EMP001",
        "completed_units": completed,
        "total_units": total,
        "completion_percentage":
            calculate_completion_percentage(
                completed,
                total
            )
    }